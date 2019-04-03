import React, { Component } from 'react'

import { Image, List, Icon, Header, Grid, Segment } from 'semantic-ui-react'
import accounting from 'accounting-js'
import { Link } from 'react-router-dom'
import store from 'store'
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getClientServices, ftpServiceLive } from './apis'

class Home extends Component {
  constructor(props) {
    super(props)
    this.state = {
      services: [],
      stats: { overall: [], today: [] },
      today_revenue: 0,
      total_revenue: 0
    }
  }

  render_pie = mode => {
    return (
      <Segment loading={false} inverted secondary>
        <Header
          as="h5"
          icon
          textAlign="center"
          style={{
            color: 'grey'
          }}
        >
          <Icon name={mode === 'today' ? 'compress' : 'expand'} />
          <Header.Content>
            Your {mode === 'today' ? "Today's" : 'Total'} Revenue
          </Header.Content>
        </Header>

        <code
          style={{
            fontSize: mode === 'today' ? 24 : 36,
            fontWeight: mode === 'today' ? 200 : 800,
            color: mode === 'today' ? 'lightgrey' : 'lightgreen'
          }}
        >
          {accounting.formatNumber(
            mode === 'today'
              ? this.state.today_revenue
              : this.state.total_revenue
          )}
        </code>
        {mode === 'overall' ? (
          <div style={{ width: '100%', minHeight: 300 }}>
            <ResponsiveContainer width="90%" height={400} key={mode}>
              <PieChart>
                <Pie
                  dataKey={
                    mode === 'today' ? 'today_revenue' : 'overall_revenue'
                  }
                  isAnimationActive={false}
                  data={
                    this.mode === 'today'
                      ? this.state.stats.today
                      : this.state.stats.overall
                  }
                  paddingAngle={6}
                  label={{ fill: 'white' }}
                >
                  {(mode === 'today'
                    ? this.state.stats.today
                    : this.state.stats.overall
                  ).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </Segment>
    )
  }

  componentDidMount() {
    const uuidKey = store.get('uuid')
    if (uuidKey) {
      getClientServices(atob(uuidKey)).then(resp => {
        if (resp.status === 200) {
          resp.json().then(data => {
            this.setState({
              services: data.services
                .filter((s, i) => {
                  return s.meta.is_active === true
                })
                .map((s, i) => {
                  this.doGetFtpData(
                    s.meta.ftp_key,
                    true,
                    s.name,
                    s.meta.colorCode
                  )
                  this.doGetFtpData(
                    s.meta.ftp_key,
                    false,
                    s.name,
                    s.meta.colorCode
                  )
                  return {
                    name: s.name,
                    uuid: s.meta.uuid,
                    short_code: s.short_code,
                    ftp_key: s.meta.ftp_key
                  }
                })
            })
          })
        }
      })
    }

    this.doGetFtpData = (ftp_key, overall, namespace, fill) => {
      return ftpServiceLive(ftp_key, overall).then(resp => {
        if (resp.status === 200) {
          resp.json().then(data => {
            const result = data.result
            this.setState({
              [overall === true ? 'total_revenue' : 'today_revenue']:
                this.state[
                  overall === true ? 'total_revenue' : 'today_revenue'
                ] +
                result.income / 10,

              stats: {
                ...this.state.stats,
                [overall === true ? 'overall' : 'today']: [
                  ...this.state.stats[overall === true ? 'overall' : 'today'],
                  {
                    name: namespace,
                    [overall === true ? 'overall_revenue' : 'today_revenue']:
                      result.income / 10,
                    fill: fill,
                    subscriptions: result.subs_count,
                    unsubscriptions: result.unsub_count
                  }
                ]
              }
            })
          })
        } else {
          this.setState({
            stats: {
              ...this.state.stats,
              [overall === true ? 'overall' : 'today']: [
                ...this.state.stats[overall === true ? 'overall' : 'today'],
                {
                  name: namespace,
                  fill: 'black',
                  [overall === true ? 'overall_revenue' : 'today_revenue']: 0,
                  subscriptions: 0,
                  unsubscriptions: 0
                }
              ]
            }
          })
        }
      })
    }
  }

  componentWillUnmount() {}

  render() {
    return (
      <div style={{ margin: 'auto', padding: 25, textAlign: 'center' }}>
        <Header
          as="h4"
          icon
          textAlign="center"
          style={{
            color: 'grey',

            borderBottom: '1px solid #121212',
            paddingBottom: 20
          }}
        >
          <Icon name="pie graph" />
          <Header.Content>Client Overview Console</Header.Content>
        </Header>

        <List
          selection
          horizontal
          relatex="very"
          style={{
            minHeight: 64,
            borderBottom: '1px solid grey',
            marginBottom: 5
          }}
        >
          {this.state.services.map((s, i) => {
            return (
              <List.Item key={s.uuid}>
                <Icon name="dot circle" color="red" />{' '}
                <Link to={`/services/${s.uuid}`}>{s.name.toUpperCase()}</Link>
                <br />
                <small style={{ color: 'lightgrey', float: 'left' }}>
                  {s.short_code}
                </small>
              </List.Item>
            )
          })}
        </List>

        <Grid style={{ marginTop: 10 }}>
          <Grid.Row>
            <Grid.Column width="6">{this.render_pie('overall')}</Grid.Column>
            <Grid.Column width="4">
              <Image
                src="/to-go-cup.png"
                size="small"
                centered
                className="homePageGlass"
              />
              <h2>Hey Friend :-)</h2>
              <Link to="/services">
                <h3>Start here</h3>
              </Link>
            </Grid.Column>
            <Grid.Column width="6">{this.render_pie('today')}</Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    )
  }
}

export default Home
