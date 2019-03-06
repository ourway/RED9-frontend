import React, { Component } from 'react'
import { Grid, Image, Step, Statistic, Label, Icon } from 'semantic-ui-react'
import { distinctUntilChanged, debounceTime } from 'rxjs/operators'
import {
  usernameAssigned,
  selectService$,
  changeColorCode$,
  handle_message_count_receive$,
  selectApp$
} from './utils'
import S from 'string'
import accounting from 'accounting-js'
import { env } from './config'
import {
  ftpServiceLive,
  ftpGetChargingSubscribersCount,
  getWapPushRevenue,
  getSubscribersCount
} from './apis'
import { Link } from 'react-router-dom'
import store from 'store'

const ZERO = 0
const ZERO2 = 0
const DASH = '------'

class Header extends Component {
  constructor(props) {
    super(props)
    this.state = {
      message_count: '-------',
      colorCode: env.product_color,
      wappush_revenue: 0,
      company: DASH,
      reporter: atob(store.get('reporter') || 'ZmFsc2U='),
      service: {
        name: DASH
      },
      app: {
        name: DASH
      },
      stats: {
        subscribers: 0,
        chargingSubscribers: 0,
        yesterday: {
          revenue: ZERO,
          subscriptions: ZERO2,
          unsubscriptions: ZERO2,
          success_rate: ZERO2
        },
        overall: {
          revenue: ZERO,
          subscriptions: ZERO2,
          unsubscriptions: ZERO2,
          success_rate: ZERO2
        }
      }
    }
  }

  componentWillMount() {
    handle_message_count_receive$.pipe(distinctUntilChanged()).subscribe({
      next: msg => {
        this.setState({
          message_count: msg.result
        })
      }
    })
  }

  componentWillUnmount() {
    clearTimeout(this.timer2)
    clearTimeout(this.ftpDataTimeout)
    clearTimeout(this.ftpDataTimeout2)
    this.appSelection.unsubscribe()
    this.clientSubscription.unsubscribe()
    this.serviceSelection.unsubscribe()
    this.colorCodeChangeSubscription.unsubscribe()
  }

  doGetWapPushRevenue = () => {
    const uuidKey = store.get('uuid')
    getWapPushRevenue(atob(uuidKey), this.state.service.name).then(data => {
      if (data.status === 200) {
        data.json().then(resp => {
          this.setState({ wappush_revenue: resp.revenue })
        })
      }
    })
  }

  doGetSubscribersCount = () => {
    const uuidKey = store.get('uuid')
    if (uuidKey) {
      getSubscribersCount(atob(uuidKey), this.state.service.name).then(resp => {
        if (resp.status === 200) {
          resp.json().then(data => {
            this.setState({
              stats: { ...this.state.stats, subscribers: data.count || 0 }
            })
          })
        }
      })
    }
  }

  doGetFtpChargingSubscribersCount = () => {
    ftpGetChargingSubscribersCount(this.state.service.meta.ftp_key).then(
      resp => {
        if (resp.status === 200) {
          resp.json().then(data => {
            this.setState({
              stats: {
                ...this.state.stats,
                chargingSubscribers: data.count || 0
              }
            })
          })
        }
      }
    )
  }

  doGetFtpData = (ftp_key, overall) => {
    return ftpServiceLive(ftp_key, overall).then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          const result = data.result
          this.setState({
            stats: {
              ...this.state.stats,
              [overall === true ? 'overall' : 'yesterday']: {
                revenue: result.income,
                subscriptions: result.subs_count,
                unsubscriptions: result.unsub_count,
                success_rate: Number(result.success_rate * 100).toFixed(1)
              }
            }
          })
        })
      } else {
        this.setState({
          stats: {
            ...this.state.stats,
            [overall === true ? 'overall' : 'yesterday']: {
              revenue: ZERO,
              subscriptions: ZERO2,
              unsubscriptions: ZERO2,
              success_rate: ZERO2
            }
          }
        })
      }
    })
  }

  componentDidMount() {
    if (store.get('service')) {
      const service = store.get('service')
      this.setState({ service: service })

      this.ftpDataTimeout2 = setTimeout(() => {
        this.doGetSubscribersCount()
        if (service.meta && service.meta.operator === 'MCI') {
          this.doGetFtpChargingSubscribersCount()
          this.doGetFtpData(service.meta.ftp_key, false).then(() => {
            this.doGetFtpData(service.meta.ftp_key, true)
          })
        }
      }, 100)
    }

    this.colorCodeChangeSubscription = changeColorCode$
      .pipe(
        distinctUntilChanged(),
        debounceTime(500)
      )
      .subscribe(c => {
        this.setState({ colorCode: c })
      })

    this.appSelection = selectApp$
      .pipe(
        distinctUntilChanged(),
        debounceTime(500)
      )
      .subscribe(v => {
        if (v) {
          this.setState({ app: v })
          if (v.api_keys) {
            store.set('api-key', btoa(v.api_keys.join('')))
          }
        }
      })

    this.serviceSelection = selectService$
      .pipe(
        distinctUntilChanged(),
        debounceTime(250)
      )
      .subscribe({
        next: s => {
          this.setState({
            service: s,
            stats: {
              yesterday: {
                revenue: ZERO,
                subscriptions: ZERO2,
                unsubscriptions: ZERO2,
                success_rate: ZERO2
              },
              overall: {
                revenue: ZERO,
                subscriptions: ZERO2,
                unsubscriptions: ZERO2,
                success_rate: ZERO2
              }
            }
          })
          this.doGetSubscribersCount()
          this.doGetWapPushRevenue()

          if (s.meta.operator === 'MCI') {
            this.doGetFtpChargingSubscribersCount()
            this.ftpDataTimeout = setTimeout(() => {
              this.doGetFtpData(s.meta.ftp_key, false).then(() => {
                this.doGetFtpData(s.meta.ftp_key, true)
              })
            }, 200)
          } else {
            this.setState({
              stats: {
                yesterday: {
                  revenue: ZERO,
                  subscriptions: ZERO2,
                  unsubscriptions: ZERO2,
                  success_rate: ZERO2
                },
                overall: {
                  revenue: ZERO,
                  subscriptions: ZERO2,
                  unsubscriptions: ZERO2,
                  success_rate: ZERO2
                }
              }
            })
          }
        }
      })

    this.clientSubscription = usernameAssigned
      .pipe(distinctUntilChanged())
      .subscribe({
        next: v => {
          this.setState({
            company: v
          })
        }
      })
  }

  render() {
    return (
      <header
        className="App-header ms-fadeIn500"
        style={{ backgroundColor: this.state.colorCode }}
      >
        <Grid centered doubling padded>
          <Grid.Row>
            <Grid.Column computer={4} mobile={12} tablet={4}>
              <Link to="/">
                <strong className="ms-font-xxl ms-fontColor-neutralLight">
                  <Image
                    src={`/${env.logo}.png`}
                    size="tiny"
                    style={{ verticalAlign: 'sub' }}
                    inline
                  />
                  <div
                    style={{
                      display: 'inline-block',
                      borderLeft: '1px dashed #ffffff77',
                      margin: 2,
                      padding: 2
                    }}
                  >
                    <small
                      style={{
                        clear: 'both',
                        fontSize: 14,
                        paddingBottom: 10,
                        color: 'lightgrey',
                        opacity: 0.6
                      }}
                    >
                      Proccessed /
                      <code style={{ fontSize: 18, color: 'gold' }}>
                        {this.state.message_count}
                      </code>
                      / messages.
                    </small>
                    <br />
                    <hr style={{ opacity: 0.25 }} />
                    {env.company === 'SabaIdea' ? ' ' : env.company}
                    <strong style={{ fontWeight: 800 }}>
                      {' '}
                      {env.product !== 'RED9' ? (
                        <span style={{ borderBottom: '1px dashed #cccccc33' }}>
                          {env.product}
                        </span>
                      ) : (
                        <span style={{ borderBottom: '1px dashed #cccccc33' }}>
                          <b style={{ color: '#cc0000', fontWeight: 800 }}>
                            RED
                          </b>
                          <span style={{ color: '#fff', fontWeight: 200 }}>
                            9
                          </span>
                        </span>
                      )}
                    </strong>
                    <br />
                    <i style={{ fontSize: 8 }}>
                      Verison{' '}
                      <b style={{ fontSize: 13 }}>
                        <code>{env.product_version.split('/')[0]}</code>
                      </b>
                      <small>{env.product_version.split('/')[1]}</small>
                      {' | '}
                      {env.codename}
                      {env.product !== 'RED9' ? (
                        <span>
                          {' | '}
                          Powered by{' '}
                          <span>
                            <b style={{ color: '#cc0000', fontWeight: 800 }}>
                              RED
                            </b>
                            <span style={{ color: '#fff' }}>9</span>
                          </span>
                        </span>
                      ) : null}
                    </i>
                  </div>
                </strong>
              </Link>
            </Grid.Column>

            <Grid.Column
              computer={11}
              only="computer tablet"
              verticalAlign="middle"
              textAlign="right"
            >
              {this.state.company.name !== DASH ? (
                <Grid
                  verticalAlign="middle"
                  className={
                    this.state.service.name !== DASH
                      ? 'topStatistics active'
                      : 'topStatistics deactive'
                  }
                  textAlign="right"
                >
                  <Grid.Column width={8} className="info">
                    <Label color="grey">Yesterday</Label>
                    <Statistic color="blue" inverted size="mini">
                      <Statistic.Value>
                        <small>
                          {accounting.formatNumber(
                            this.state.stats.yesterday.revenue / 10
                          )}
                        </small>
                      </Statistic.Value>
                      <Statistic.Label>Revenue</Statistic.Label>
                    </Statistic>
                    <Statistic inverted size="mini">
                      <Statistic.Value>
                        <small style={{ color: 'lightgreen' }}>
                          {this.state.stats.yesterday.subscriptions}
                        </small>
                        /
                        <small style={{ color: 'orange' }}>
                          {this.state.stats.yesterday.unsubscriptions}
                        </small>{' '}
                        <Icon
                          size="large"
                          name={
                            this.state.stats.yesterday.subscriptions <
                            this.state.stats.yesterday.unsubscriptions
                              ? 'arrow down'
                              : 'arrow up'
                          }
                          color={
                            this.state.stats.yesterday.subscriptions <
                            this.state.stats.yesterday.unsubscriptions
                              ? 'red'
                              : 'green'
                          }
                        />
                      </Statistic.Value>
                      <Statistic.Label>Subscriptions</Statistic.Label>
                    </Statistic>
                    <Statistic color="grey" inverted size="mini">
                      <Statistic.Value>
                        <small>
                          {this.state.stats.yesterday.success_rate}%
                        </small>
                      </Statistic.Value>
                      <Statistic.Label>Success Rate</Statistic.Label>
                    </Statistic>
                  </Grid.Column>

                  <Grid.Column width={8} className="info">
                    <Label color="grey">Overall</Label>
                    <Statistic color="blue" inverted size="mini">
                      <Statistic.Value>
                        <small>
                          {accounting.formatNumber(
                            this.state.stats.overall.revenue / 10
                          )}
                        </small>
                      </Statistic.Value>
                      <Statistic.Label>Revenue</Statistic.Label>
                    </Statistic>
                    <Statistic inverted size="mini">
                      <Statistic.Value>
                        <small style={{ color: 'lightgreen' }}>
                          {this.state.stats.overall.subscriptions}
                        </small>
                        /
                        <small style={{ color: 'orange' }}>
                          {this.state.stats.overall.unsubscriptions}
                        </small>{' '}
                        <Icon
                          size="small"
                          name={
                            this.state.stats.overall.subscriptions <
                            this.state.stats.overall.unsubscriptions
                              ? 'frown'
                              : 'smile'
                          }
                          color={
                            this.state.stats.overall.subscriptions <
                            this.state.stats.overall.unsubscriptions
                              ? 'red'
                              : 'green'
                          }
                        />
                      </Statistic.Value>
                      <Statistic.Label>Subscriptions</Statistic.Label>
                    </Statistic>
                    <Statistic color="grey" inverted size="mini">
                      <Statistic.Value>
                        <small>{this.state.stats.overall.success_rate}%</small>
                      </Statistic.Value>
                      <Statistic.Label>Success Rate</Statistic.Label>
                    </Statistic>
                  </Grid.Column>
                  <Grid.Column width={5}>
                    {this.state.stats.subscribers ? (
                      <Statistic
                        style={{ filter: 'brightness(100%)' }}
                        color="green"
                        className={
                          this.state.service.name !== DASH
                            ? 'topStatistics active info'
                            : 'topStatistics deactive'
                        }
                        inverted
                        size="tiny"
                      >
                        <Statistic.Value>
                          <small>{this.state.stats.subscribers}</small>
                        </Statistic.Value>
                        <Statistic.Label
                          style={{ fontSize: 10, fontWeight: 200 }}
                        >
                          Subscribers
                        </Statistic.Label>
                      </Statistic>
                    ) : null}

                    {this.state.stats.chargingSubscribers ? (
                      <Statistic
                        className={
                          this.state.service.name !== DASH
                            ? 'topStatistics active info'
                            : 'topStatistics deactive'
                        }
                        color="green"
                        inverted
                        size="mini"
                      >
                        <Statistic.Value>
                          <small>{this.state.stats.chargingSubscribers}</small>
                        </Statistic.Value>
                        <Statistic.Label
                          style={{ fontSize: 10, fontWeight: 400 }}
                        >
                          Charging
                        </Statistic.Label>
                      </Statistic>
                    ) : null}

                    {this.state.wappush_revenue !== 0 &&
                    this.state.reporter !== 'true' ? (
                      <Statistic
                        className={
                          this.state.service.name !== DASH
                            ? 'topStatistics active info'
                            : 'topStatistics deactive'
                        }
                        color="green"
                        inverted
                        size="mini"
                      >
                        <Statistic.Value>
                          <small>{this.state.wappush_revenue.total}</small>|
                          <small style={{ fontSize: 10 }}>
                            <a href="/reports">
                              {this.state.wappush_revenue.count} charge events
                            </a>
                          </small>
                        </Statistic.Value>
                        <Statistic.Label
                          style={{ fontSize: 10, fontWeight: 400 }}
                        >
                          SMS Charge Revenue
                        </Statistic.Label>
                      </Statistic>
                    ) : null}
                  </Grid.Column>
                  <Grid.Column width={11}>
                    <Step.Group
                      size="mini"
                      style={{ WebkitFilter: 'invert(90%)', opacity: 0.75 }}
                    >
                      <Step active={this.state.service.name === DASH}>
                        <Icon name="vcard" />
                        <Step.Content>
                          <Step.Title>
                            <Link className="companyName" to="/profile">
                              {this.state.company}
                            </Link>
                          </Step.Title>
                          <Step.Description>Active Client</Step.Description>
                        </Step.Content>
                      </Step>

                      <Step
                        disabled={this.state.service.name === DASH}
                        active={this.state.service.name !== DASH}
                      >
                        <Icon name="cubes" />
                        <Step.Content>
                          <Step.Title>
                            <Link
                              to={`/services/${
                                this.state.service.meta
                                  ? this.state.service.meta.uuid
                                  : ''
                              }`}
                              className="dark"
                            >
                              {S(this.state.service.name).capitalize().s}
                            </Link>
                          </Step.Title>
                          <Step.Description>Active Service</Step.Description>
                        </Step.Content>
                      </Step>

                      <Step disabled={this.state.app.name === DASH}>
                        <Icon name="adn" />
                        <Step.Content>
                          <Step.Title>
                            <Link
                              to={`/apps/${
                                this.state.app.name ? this.state.app.uuid : ''
                              }`}
                              className="dark"
                            >
                              {S(this.state.app.name).capitalize().s}
                            </Link>
                          </Step.Title>
                          <Step.Description>Active App</Step.Description>
                        </Step.Content>
                      </Step>
                    </Step.Group>
                  </Grid.Column>
                </Grid>
              ) : null}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </header>
    )
  }
}

export default Header
