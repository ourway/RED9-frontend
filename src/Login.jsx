import React, { Component } from 'react'
import store from 'store'
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
import Shine from './Shine'
import Showcase from './Showcase'
import { Image, Loader, Dimmer, Segment } from 'semantic-ui-react'
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

  componentDidMount() {
    if (this.state.only_report === true) {
      reporterSignal.next('OK')
    }

    if (this.state.uuid) {
      this.doLogin()
    }
    this.redirectSubscription = redirectSignal.subscribe({
      next: (t, history) => {
        this.props.history.push(t)
      }
    })

    store.clearAll()
    store.set('reporter', btoa(this.state.only_report))
    titleChangeSignal.next('Login')
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

        <Grid style={{ paddingBottom: 0 }} padded verticalAlign="middle">
          <Grid.Row>
            <Grid.Column computer={1} tablet="1" mobile="1" />
            <Grid.Column computer={6} tablet="8" mobile="16">
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
                    inline
                    style={{
                      verticalAlign: 'baseline',
                      width: '5em',
                      filter: 'grayscale(100%)'
                    }}
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
                              fontSize: '3em'
                            }}
                          >
                            RED
                          </b>
                          <span
                            style={{
                              color: '#000',
                              fontWeight: 200,
                              fontSize: '4.5em',
                              filter: 'drop-shadow(1px 1px 20px white)'
                            }}
                          >
                            9
                          </span>
                        </span>
                      )}
                    </strong>
                    <br />
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
                  </strong>
                  <br />

                  <br />

                  <Segment attach="top" style={{ margin: 'auto' }}>
                    <Label>
                      Enter your 128-bit{' '}
                      <b style={{ color: 'teal' }}>Client Key</b>:
                    </Label>

                    <TextField
                      onChange={this.handleUUID}
                      value={this.state.uuid}
                      required={true}
                      autoFocus={true}
                      type="password"
                      placeholder="00000000-0000-0000-0000-000000000000"
                    />

                    <br />
                    <CompoundButton
                      primary={true}
                      onClick={this.doLogin}
                      autoComplete="false"
                      style={{ backgroundColor: '#cc0000' }}
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
                  </Segment>
                </form>

                <br />
                <br />
                <br />
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
            <Grid.Column computer={1} tablet="1" mobile="1" />
            <Grid.Column computer={7} tablet="7" mobile="16">
              <Showcase />
            </Grid.Column>
            <hr />
          </Grid.Row>
          <Grid.Row style={{ backgroundColor: '#cc0000' }}>
            <Grid.Column computer={3} tablet="16" mobile="16" />
            <Grid.Column computer={10} tablet="16" mobile="16">
              <Grid.Column computer={3} tablet="16" mobile="16" />
              <Shine />
            </Grid.Column>
          </Grid.Row>
        </Grid>

        <Footer />
      </Segment>
    )
  }
}

export default Login
