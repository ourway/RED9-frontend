import React, { Component } from 'react'
import {
  Segment,
  Divider,
  Message,
  Icon,
  Table,
  Statistic
} from 'semantic-ui-react'
import { ftpRenewalHistory } from './apis'
import store from 'store'
import sortBy from 'lodash/sortBy'
import { env } from './config'

import accounting from 'accounting-js'

import jalaali from 'jalaali-js'

class FTPRenewal extends Component {
  constructor(props) {
    super(props)
    this.state = { ftp_events: [] }
  }

  componentWillReceiveProps(nextProps) {
    this.doPrepare(nextProps)
  }

  componentDidMount() {
    this.doPrepare(this.props)
  }

  doPrepare(props) {
    this.setState({ ftp_events: [] })
    const now = new Date()
    const last90days = now.setSeconds(now.getUTCSeconds() - 3600 * 24 * 90)
    const nowJd = jalaali.toJalaali(new Date())
    const last90daysJd = jalaali.toJalaali(new Date(last90days))
    const nowj = `${nowJd.jy}-${nowJd.jm}-${nowJd.jd}`
    const last90j = `${last90daysJd.jy}-${last90daysJd.jm}-${last90daysJd.jd}`
    ftpRenewalHistory(
      props.activeService.meta.ftp_key,
      props.query,
      last90j,
      nowj
    ).then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          const events = data.events || []

          const _e = sortBy(events, [
            function(o) {
              return -o.date_time
            }
          ])
          this.setState({ ftp_events: _e, nowj: nowj, last90j: last90j })
        })
      }
    })
  }

  render() {
    if (this.state.ftp_events.length > 0) {
      const billed = this.state.ftp_events
        .map((e, i) => {
          return e.billed_price_point / 10
        })
        .reduce((a, b) => a + b, 0)
      const target = this.state.ftp_events
        .map((e, i) => {
          return e.base_price_point / 10
        })
        .reduce((a, b) => a + b, 0)
      const success = Math.round((billed / target) * 100)
      return (
        <Segment inverted>
          <Message color="black">
            <Message.Header color="green">
              <Icon name="money" color="orange" />
              FTP renewal data (
              <small>
                {this.state.ftp_events.length}
                <code /> events / last 90 days
              </small>
              )<Divider />
              <Icon name="code" color="orange" />
              <code className="red9_samples">
                {`curl -X POST '${env.FTP_BASE}/query/user_renewal_history?access_token=${this.props.activeService.meta.ftp_key}&start_date=${this.state.last90j}&end_date=${this.state.nowj}' -d '{ "user":"${this.props.query}" }' `}
              </code>
              <Divider />
              <Statistic color="green" inverted size="small">
                <Statistic.Value>
                  <small>{accounting.formatNumber(billed)}</small>
                </Statistic.Value>
                <Statistic.Label>Billed</Statistic.Label>
              </Statistic>
              <Statistic color="blue" inverted size="mini">
                <Statistic.Value>
                  <small>{accounting.formatNumber(target)}</small>
                </Statistic.Value>
                <Statistic.Label>Target</Statistic.Label>
              </Statistic>
              <Statistic color="violet" inverted size="mini">
                <Statistic.Value>
                  <small>{success}%</small>
                </Statistic.Value>
                <Statistic.Label>Success Rate</Statistic.Label>
              </Statistic>
            </Message.Header>
            <Message.Content>
              <div style={{ maxHeight: 300, overflowX: 'scroll' }}>
                <Table inverted celled singleLine compact basic>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell width={1} />
                      <Table.HeaderCell width={4}>
                        Transaction ID
                      </Table.HeaderCell>
                      <Table.HeaderCell width={4}>
                        Datetime (yyyy/mm/dd) <small>(khorshidi)</small>
                      </Table.HeaderCell>
                      <Table.HeaderCell width={2}>
                        Target Price (T)
                      </Table.HeaderCell>
                      <Table.HeaderCell width={2}>
                        Billed Amount (T)
                      </Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {this.state.ftp_events.map((e, i) => {
                      const d = new Date(e.date_time * 1000)
                      const _d = jalaali.toJalaali(d)
                      return (
                        <Table.Row key={e.trasn_id}>
                          <Table.Cell>{i + 1} </Table.Cell>
                          <Table.Cell collapsing>
                            <code> {e.trasn_id} </code>
                          </Table.Cell>

                          <Table.Cell collapsing>
                            <code>
                              {' '}
                              {`${_d.jy}/${_d.jm
                                .toString()
                                .padStart(2, 0)}/${_d.jd
                                .toString()
                                .padStart(2, 0)}`}{' '}
                            </code>
                          </Table.Cell>

                          <Table.Cell collapsing>
                            {e.base_price_point / 10}
                          </Table.Cell>

                          <Table.Cell collapsing>
                            {e.billed_price_point / 10}
                          </Table.Cell>
                        </Table.Row>
                      )
                    })}
                  </Table.Body>
                </Table>
              </div>
            </Message.Content>
          </Message>
        </Segment>
      )
    } else {
      return <span>Not any FTP renewal events :/</span>
    }
  }
}

class Search extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ftp_events: [],
      query: '',
      isLoading: false,
      activeService: {}
    }
  }

  getNationalNumber = num => {
    const m = num.match(/[\d]*([\d]{10})/)
    if (m && m.length === 2) {
      return 98 + m[1]
    }
  }

  doActBasedOnQuery = q => {
    let query = atob(q)
    const _query = decodeURIComponent(query)
    this.setState({
      query: _query
    })
  }

  componentDidMount() {
    this.doFindService()
    this.doActBasedOnQuery(this.props.match.params.query)
  }

  doFindService() {
    this.setState({ activeService: store.get('service') })
  }

  componentWillUnmount() {}

  componentWillReceiveProps(nextProps) {
    this.doFindService()
    this.doActBasedOnQuery(nextProps.match.params.query)
  }

  render() {
    return (
      <Segment loading={this.state.isLoading === true} inverted>
        {this.state.activeService.name ? (
          <Segment loading={this.state.isLoading === true} inverted>
            <h4>
              Searching for{' '}
              <b>
                <code>{this.state.query}</code>
              </b>{' '}
              on <u>{this.state.activeService.name}</u> Service
            </h4>
            <Divider />
            {this.state.activeService.meta.operator === 'MCI' &&
            this.getNationalNumber(this.state.query) ? (
              <FTPRenewal
                activeService={this.state.activeService}
                query={this.getNationalNumber(this.state.query)}
              />
            ) : null}
          </Segment>
        ) : (
          <span>Please Select a service to search</span>
        )}
      </Segment>
    )
  }
}
export default Search
