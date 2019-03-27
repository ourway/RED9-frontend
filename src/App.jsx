import React, { Component } from 'react'

import S from 'string'
import { distinctUntilChanged, debounceTime } from 'rxjs/operators'
import { Route, Switch } from 'react-router-dom'
import store from 'store'

import {
  titleChangeSignal,
  sendLoginRequest,
  redirectSignal,
  startLoading$,
  stopLoading$,
  searching$
} from './utils'
import Leftbar from './Leftbar'
import Header from './Header'
import Footer from './Footer'
import { env, browser } from './config'
import Services from './services'
import Applications from './apps'
import ClientManagement from './client_management'
import Templates from './templates'
import Messaging from './messaging'

import Reactions from './reactions'
import Home from './home'
import Subscriptions from './subscriptions'
import Charging from './charging'
import Reports from './reports'
import FTPData from './ftpData'
import IntegrationPanel from './integrationPanel'
import Logs from './logs'
import CustomerCare from './customerCare'
import KeyValueDb from './keyValueDb'
import MockRequests from './mockRequests'
import APIDocs from './apiDocs'
import GettingStarted from './gettingStarted'
import Profile from './profile'
import Settings from './settings'
import AggregatedReports from './aggregatedReports'
import ForensicAdministration from './forensicAdministration'
import Monitoring from './monitoring'
import Information from './information'
import Search from './search'
import NotFound from './notFound'

import { Grid, Icon, Segment, Image } from 'semantic-ui-react'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      isLoggedIn: false,
      user: null
    }
    this.sendLoginRequest = sendLoginRequest.bind(this)
  }

  componentWillUnmount() {
    this.redirectSubscription.unsubscribe()
    this.startLoadingSubscription.unsubscribe()
    this.stopLoadingSubscription.unsubscribe()
    this.searchChangedSubscription.unsubscribe()
    clearInterval(this.loginInterval)
    clearTimeout(this.loginRequestTimeout)
  }

  componentDidMount() {
    this.startLoadingSubscription = startLoading$.subscribe({
      next: q => {
        this.setState({ isLoading: true })
      }
    })

    this.stopLoadingSubscription = stopLoading$.subscribe({
      next: q => {
        this.setState({ isLoading: false })
      }
    })

    this.searchChangedSubscription = searching$
      .pipe(
        distinctUntilChanged(),
        debounceTime(1000)
      )
      .subscribe({
        next: q => {
          if (q) {
            redirectSignal.next(`/search/${q}`)
          }
        }
      })

    this.redirectSubscription = redirectSignal
      .pipe(distinctUntilChanged())
      .subscribe({
        next: (t, history) => {
          this.props.history.push(t)
        }
      })
    const uuidKey = store.get('uuid')
    if (uuidKey) {
      this.loginRequestTimeout = setTimeout(() => {
        this.sendLoginRequest(atob(uuidKey), false, false)
      }, 200)
      this.loginInterval = setInterval(() => {
        this.sendLoginRequest(atob(uuidKey), false, false)
      }, 30000)
    } else {
      redirectSignal.next('/login')
    }
    titleChangeSignal.next('Panel')
  }

  render() {
    return (
      <div className="App ms-scaleUpIn100">
        <Header />

        <Grid padded inverted>
          <Grid.Row style={{ paddingTop: 0, borderTop: '1px solid #41474d' }}>
            <Grid.Column
              computer={3}
              only="computer tablet"
              style={{
                borderRight: '1px solid #515151',
                padding: 10,
                paddingRight: 0,
                background: 'linear-gradient(#1E262B,transparent)'
              }}
            >
              <Leftbar
                activepath={this.props.location.pathname.slice(1, 100)}
              />
            </Grid.Column>
            <Grid.Column
              style={{
                backgroundImage: `url(/${
                  this.props.location.pathname.split('/')[1]
                }.png)`
              }}
              className="desktop"
              computer={13}
              only="computer tablet"
            >
              <Segment
                className="grad"
                loading={this.state.isLoading === true}
                inverted
                style={{ padding: 1, paddingBottom: 250 }}
              >
                <Switch>
                  <Route
                    exact
                    path="/search/:query"
                    name="search"
                    component={Search}
                  />

                  <Route
                    exact
                    path="/system-information"
                    name="information"
                    component={Information}
                  />

                  <Route
                    exact
                    path="/monitoring"
                    name="monitoring"
                    component={Monitoring}
                  />

                  <Route
                    exact
                    path="/forensic-administration"
                    name="forensic-administration"
                    component={ForensicAdministration}
                  />

                  <Route
                    exact
                    path="/aggregated-reports"
                    name="aggregated-reports"
                    component={AggregatedReports}
                  />

                  <Route
                    exact
                    path="/settings"
                    name="settings"
                    component={Settings}
                  />

                  <Route
                    exact
                    path="/profile"
                    name="profile"
                    component={Profile}
                  />

                  <Route
                    exact
                    path="/getting-started"
                    name="getting-started"
                    component={GettingStarted}
                  />

                  <Route
                    exact
                    path="/api-docs"
                    name="api-docs"
                    component={APIDocs}
                  />

                  <Route
                    exact
                    path="/mock-requests"
                    name="mockrequests"
                    component={MockRequests}
                  />

                  <Route
                    exact
                    path="/key.value-database"
                    name="key.value-database"
                    component={KeyValueDb}
                  />

                  <Route
                    exact
                    path="/customer-care"
                    name="customer-care"
                    component={CustomerCare}
                  />

                  <Route exact path="/logs" name="logs" component={Logs} />

                  <Route
                    exact
                    path="/integration-panel"
                    name="integration-panel"
                    component={IntegrationPanel}
                  />

                  <Route
                    exact
                    path="/ftpdata"
                    name="ftpdata"
                    component={FTPData}
                  />

                  <Route
                    exact
                    path="/reports"
                    name="reports"
                    component={Reports}
                  />

                  <Route
                    exact
                    path="/charging"
                    name="charging"
                    component={Charging}
                  />

                  <Route
                    exact
                    path="/subscriptions"
                    name="subscriptions"
                    component={Subscriptions}
                  />

                  <Route
                    exact
                    path="/reactions"
                    name="reactions"
                    component={Reactions}
                  />

                  <Route
                    exact
                    path="/services"
                    name="services"
                    component={Services}
                  />

                  <Route exact path="/overview" name="home" component={Home} />

                  <Route
                    exact
                    path="/services/:uuid"
                    name="serviceItem"
                    component={Services}
                  />

                  <Route
                    exact
                    path="/client-management"
                    name="clientManagement"
                    component={ClientManagement}
                  />

                  <Route
                    exact
                    path="/apps"
                    name="apps"
                    component={Applications}
                  />

                  <Route
                    exact
                    path="/apps/:uuid"
                    name="apps"
                    component={Applications}
                  />

                  <Route
                    exact
                    path="/templates"
                    name="templates"
                    component={Templates}
                  />

                  <Route
                    exact
                    path="/messaging"
                    name="messaging"
                    component={Messaging}
                  />

                  <Route exact path="/" name="home" component={Home} />

                  <Route component={NotFound} />
                </Switch>
              </Segment>
            </Grid.Column>
            <Grid.Column
              mobile="16"
              tablet="16"
              only="mobile"
              className="ms-slideUpIn20"
            >
              <Segment inverted textAlign="left" padded="very">
                <Image
                  src="/error-browser-not-supported.svg"
                  size="small"
                  centered
                />
                <p>
                  <b>
                    {env.company} {env.product}
                  </b>{' '}
                  is not designed to work on small screens. Your{' '}
                  <i>{browser.os}</i> <em>{S(browser.name).capitalize().s}</em>{' '}
                  browser screen is too small. Please consider resizing your
                  browser.
                  <br />
                  {browser.os === 'iOS' ? (
                    <span>
                      We have successfully tested the application on <b>iPad</b>
                      , <b>iPad Mini</b> and <b>iPad Pro</b> on landscape mode.
                    </span>
                  ) : null}
                  {browser.os === 'Mac OS' ? (
                    <span>
                      We have successfully tested the application on{' '}
                      <b>Chrome</b>, <b>Safari</b>, <b>Opera</b>, <b>Vivaldi</b>{' '}
                      and <b>Firefox</b> on widescreen mode.
                    </span>
                  ) : null}
                  <br />
                  <br />
                  --
                  <br />
                  Your{' '}
                  <b>
                    {env.company} {env.product}
                  </b>{' '}
                  team.
                </p>
              </Segment>
            </Grid.Column>
            <Grid.Column width={1} />
          </Grid.Row>
        </Grid>

        <Segment basic floated="right">
          <Icon name="bug" color="grey" />
          <a
            href={`mailto:${env.bug_report_email}?subject=${env.company}-${
              env.product
            }/ Bug Report`}
          >
            <small>Report a bug</small>
          </a>
        </Segment>

        <Footer />
      </div>
    )
  }
}

export default App
