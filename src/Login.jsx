import React, { Component } from 'react'
import store from 'store'
import sample from 'lodash/sample'
import { debounceTime } from 'rxjs/operators'
import {
  sendLoginRequest,
  //sendStudio54LoginRequest,
  titleChangeSignal,
  redirectSignal,
  handle_message_count_receive$,
  reporterSignal
} from './utils'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import { Grid } from 'semantic-ui-react'
import Footer from './Footer'
import { Card, Image, Loader, Dimmer, Segment } from 'semantic-ui-react'
import { env } from './config'
import { CompoundButton } from 'office-ui-fabric-react/lib/Button'
import { Label } from 'office-ui-fabric-react/lib/Label'
import './App.css'

class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dayquote: {},
      quotes: [],
      message_count: '-------',
      isLoadingDayquote: false,
      isLoggingIn: false,
      uuid: props.match.params.client_key,
      only_report:
        props.match.params.only_report ===
        '7f45a9fa-5437-44df-a62c-03279548473d',
      activateButton: false
    }
    this.doLogin = this.doLogin.bind(this)
    this.doStudio54Login = this.doStudio54Login.bind(this)
    this.handleUUID = this.handleUUID.bind(this)
    this.sendLoginRequest = sendLoginRequest.bind(this)
    this.loadDayquote = this.loadDayquote.bind(this)
    this.startQuoteInterval = this.startQuoteInterval.bind(this)
  }

  componentWillMount() {
    handle_message_count_receive$.pipe(debounceTime(250)).subscribe({
      next: msg => {
        if (msg.result !== this.state.message_count) {
          this.setState({
            message_count: msg.result
          })
        }
      }
    })
  }
  componentWillUnmount() {
    this.redirectSubscription.unsubscribe()
    clearInterval(this.quoteLoadInterval)
    clearTimeout(this.loadTimeout)
    clearTimeout(this.quoteStartTimeout)
  }

  loadDayquote() {
    let self = this

    if (this.state.quotes.length === 0) {
      this.setState({
        isLoadingDayquote: true
      })
      fetch('/quotes.json').then(r => {
        r.json().then(data => {
          this.setState({
            quotes: data,
            dayquote: sample(data)
          })
          self.loadTimeout = setTimeout(() => {
            self.setState({
              isLoadingDayquote: false
            })
          }, 1000)
        })
      })
    } else {
      this.setState({
        dayquote: sample(this.state.quotes)
      })
    }
  }

  startQuoteInterval = () => {
    const t = 24000
    return setInterval(() => {
      this.loadDayquote()
    }, t)
  }

  componentDidMount() {
    if (this.state.only_report === true) {
      reporterSignal.next('OK')
    }
    this.redirectSubscription = redirectSignal.subscribe({
      next: (t, history) => {
        this.props.history.push(t)
      }
    })

    store.clearAll()
    store.set('reporter', btoa(this.state.only_report))
    titleChangeSignal.next('Login')
    this.quoteStartTimeout = setTimeout(() => {
      this.loadDayquote()
    }, 100)

    this.quoteLoadInterval = this.startQuoteInterval()
    if (this.state.uuid) {
      this.doLogin()
    }
  }

  handleUUID = e => {
    const pat = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i //uuid4
    let activateButton =
      e.target.value.length === 36 && e.target.value.match(pat) !== null
        ? true
        : false
    this.setState({
      uuid: e.target.value,
      activateButton: activateButton
    })
  }

  doLogin = e => {
    this.setState({
      activateButton: false,
      isLoggingIn: true
    })
    this.sendLoginRequest(this.state.uuid, true, true).then(resp => {
      if (resp.status !== 200) {
        this.setState({ isLoggingIn: false })
      }
    })
  }

  doStudio54Login = e => {
    this.setState({
      activateButton: false,
      isLoggingIn: true
    })
    this.sendStudio54LoginRequest(this.state.uuid, true, true).then(resp => {
      if (resp.status !== 200) {
        this.setState({ isLoggingIn: false })
      }
    })
  }

  render() {
    return (
      <Segment className="ms-fadeIn100" style={{ padding: 0 }}>
        <Dimmer
          className="ms-fadeIn100"
          page
          active={this.state.isLoggingIn === true}
        >
          <Loader indeterminate>
            <h2>Wait please ...</h2>
            <span>Authenticating you may take few seconds</span>
          </Loader>
        </Dimmer>

        <Grid style={{ paddingBottom: 196 }} padded verticalAlign="middle">
          <Grid.Row>
            <Grid.Column computer={8} tablet="10" mobile="16">
              <div
                style={{ margin: 10, padding: 40 }}
                className="ms-clearfix wrapper ms-slideRightIn10"
              >
                <form
                  onSubmit={this.doLogin}
                  action="/#/login"
                  method="POST"
                  name="Login_Form"
                  className="form-signin"
                >
                  <small style={{ color: 'grey' }}>
                    Verison <b>{env.product_version.split('/')[0]}</b>
                    {env.product_version.split('/')[1]}
                    {` | `}
                    Code Name:{' '}
                    <u>
                      <code style={{ fontSize: 12 }}>{env.codename}</code>
                    </u>
                    {` | `}
                    Endpoint: {env.API_BASE}
                    <br />
                  </small>

                  <small
                    style={{
                      clear: 'both',
                      fontSize: 14,
                      paddingBottom: 10,
                      color: 'grey',
                      opacity: 0.6
                    }}
                  >
                    Proccessed /
                    <code style={{ fontSize: 24, color: 'darkred' }}>
                      {this.state.message_count}
                    </code>
                    / messages.
                  </small>

                  <hr style={{ opacity: 0 }} />
                  <Image
                    src={`/${env.logo}-login.png`}
                    size="small"
                    inline
                    style={{ verticalAlign: 'baseline' }}
                  />

                  <strong className="ms-font-l ms-fontColor-black">
                    {' '}
                    &nbsp;
                    {
                      //env.company === 'SabaIdea' ? '' : env.company
                    }
                    <strong style={{ fontWeight: 800, fontFamily: 'lato' }}>
                      {' '}
                      {env.product !== 'RED9' ? (
                        <span style={{ borderBottom: '1px dashed #cccccc33' }}>
                          {env.product}
                        </span>
                      ) : (
                        <span style={{ borderBottom: '1px dashed #cccccc33' }}>
                          <b
                            style={{
                              color: '#cc0000',
                              fontWeight: 800,
                              fontSize: '4em'
                            }}
                          >
                            RED
                          </b>
                          <span
                            style={{
                              color: '#000',
                              fontWeight: 200,
                              fontSize: '6.5em',
                              filter: 'drop-shadow(1px 1px 20px white)'
                            }}
                          >
                            9
                          </span>
                          Authentication
                        </span>
                      )}
                    </strong>
                    <br />
                  </strong>
                  <br />
                  <hr style={{ opacity: 0 }} />

                  <hr className="colorgraph" />
                  <br />
                  <br />

                  <section style={{ margin: 'auto', width: '70%' }}>
                    <Label>
                      Enter your 128-bit{' '}
                      <b style={{ color: 'teal' }}>Client Key</b>:
                    </Label>
                    <TextField
                      onChange={this.handleUUID}
                      value={this.state.uuid}
                      autoComplete="false"
                      required={true}
                      autoFocus={true}
                      type="password"
                      placeholder="00000000-0000-0000-0000-000000000000"
                    />

                    <br />

                    <CompoundButton
                      primary={true}
                      onClick={this.doLogin}
                      secondaryText={`to ${env.company} ${env.product}`}
                      disabled={this.state.activateButton === false}
                      checked={false}
                    >
                      Login
                    </CompoundButton>
                    {env.company === 'MCI ' ? (
                      <span>
                        {' '}
                        <h1
                          style={{
                            display: 'inline-flex',
                            fontWeight: 100,
                            color: 'teal'
                          }}
                        >
                          OR
                        </h1>{' '}
                        <CompoundButton
                          style={{
                            backgroundColor:
                              this.state.activateButton === true
                                ? 'teal'
                                : 'lightgrey'
                          }}
                          primary={true}
                          onClick={this.doStudio54Login}
                          secondaryText="MCI&trade; Revenue Assurance Console"
                          disabled={this.state.activateButton === false}
                          checked={false}
                        >
                          Enter
                        </CompoundButton>
                      </span>
                    ) : null}
                  </section>
                </form>

                <br />
                <br />
                <br />
                <hr />
                <p>
                  <small>
                    If you need a new client-key, please
                    <a
                      href={`mailto:${
                        env.company_email
                      }?subject=Service%20Delivery%20Platform`}
                    >
                      <span style={{ color: 'teal' }}> contact us</span>
                    </a>
                    .
                  </small>
                </p>
              </div>
            </Grid.Column>
            <Grid.Column computer={8} tablet="6" mobile="16">
              <Card color="blue" centered fluid>
                <Card.Content>
                  <Card.Header>
                    <small>Welcome to </small>{' '}
                    <b>
                      {env.company} {env.product}
                    </b>
                  </Card.Header>
                  <Card.Meta>Shine your day</Card.Meta>
                  <Card.Description
                    style={{ lineHeight: '1em' }}
                    className="ms-font-xxl ms-fontColor-themePrimary"
                  >
                    <Image floated="right" size="small" src="/horse.png" />

                    <Dimmer
                      active={this.state.isLoadingDayquote === true}
                      inverted
                    >
                      <Loader indeterminate>
                        let me inspire you to help you get through your day
                      </Loader>
                    </Dimmer>

                    <small>{this.state.dayquote.quoteText}</small>
                    <br />
                    <br />
                    <b>
                      <small>{this.state.dayquote.quoteAuthor}</small>
                    </b>
                  </Card.Description>
                </Card.Content>
                <Card.Content extra>
                  <div />
                </Card.Content>
              </Card>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <div>
                <iframe
                  title="server status"
                  className="monitor"
                  src={env.monitor}
                />
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>

        <Footer />
      </Segment>
    )
  }
}

export default Login
