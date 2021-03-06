import React, { Component } from 'react'
import {
  Segment,
  Menu,
  Radio,
  Input,
  Table,
  Divider,
  Grid,
  Icon
} from 'semantic-ui-react'
import JDate from 'jalali-date'
import accounting from 'accounting-js'
import _ from 'lodash'
import { titleChangeSignal, downloadAs } from './utils'

import store from 'store'
import {
  LineChart,
  Line,
  XAxis,
  ZAxis,
  ComposedChart,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  YAxis,
  CartesianGrid,
  Area,
  Bar,
  Tooltip,
  Legend
} from 'recharts'

import {
  getFTPAggregateReport,
  getSubscriptionDetails,
  getMoTrendData,
  getAllReports
} from './apis'

const str_pad = n => {
  return String('00' + n).slice(-2)
}

class Reports extends Component {
  constructor(props) {
    super(props)
    const date = new Date()
    const lastMonth = new Date()
    lastMonth.setDate(lastMonth.getDate() - 90)

    const today = `${date.getFullYear()}-${str_pad(
      date.getMonth() + 1
    )}-${str_pad(date.getDate())}`
    const lastM = `${lastMonth.getFullYear()}-${str_pad(
      lastMonth.getMonth() + 1
    )}-${str_pad(lastMonth.getDate())}`
    this.state = {
      raw_data: [],
      mo_trend_key: 'count',
      mo_trends: { '00/00/00': [{ msg: null, date: null, count: -1 }] },
      data: [],
      all_reports: [],
      red9_sub_data: { reports: { activations: [], deactivations: [] } },
      endDate: today,
      startDate: lastM,
      service: {}
    }
  }

  getPersianDate = d => {
    let jdate = new JDate()

    if (Number.isInteger(d)) {
      jdate = new JDate(new Date(d * 1000))
    } else {
      jdate = new JDate(new Date(d))
    }

    if (d === '1970-01-01T00:00:00') {
      return 'N/A'
    } else {
      return `${jdate.getFullYear()}-${str_pad(jdate.getMonth())}-${str_pad(
        jdate.getDate()
      )}`
    }
  }

  doGetAllReports = () => {
    const service = store.get('service')
    const apikey = store.get('uuid')
    getAllReports(atob(apikey), service.name).then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          let final = data.result.map((e, i) => {
            return {
              ...e,
              deactivations: e.postpaid_deactivations + e.prepaid_deactivations,
              activations:
                e.new_postpaid_subscribers + e.new_prepaid_subscribers,
              total_subs:
                e.total_prepaid_subscribers + e.total_postpaid_subscribers,
              bounced:
                e.postpaid_bounced_subscribers + e.prepaid_bounced_subscribers,
              pure:
                e.new_postpaid_subscribers +
                e.new_prepaid_subscribers -
                (e.postpaid_bounced_subscribers + e.prepaid_bounced_subscribers)
            }
          })

          this.setState({ all_reports: final.reverse() })
        })
      }
    })
  }

  fetchTrendData = () => {
    const service = store.get('service')
    const apikey = store.get('uuid')
    getMoTrendData(atob(apikey), service.meta.id).then(resp => {
      resp.json().then(data => {
        this.setState({ mo_trends: data.result })
      })
    })
  }

  fetchReportData = () => {
    const service = store.get('service')
    const apikey = store.get('uuid')
    this.setState({ service: service })
    getSubscriptionDetails(atob(apikey), service.name).then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          let reports = {
            activations: data.reports.activations.reverse().map((d, i) => {
              const jdate = this.getPersianDate(d.activation_date)
              return { ...d, date_time: jdate }
            }),
            deactivations: data.reports.deactivations.reverse().map((d, i) => {
              const jdate = this.getPersianDate(d.deactivation_date)
              return { ...d, date_time: jdate }
            })
          }

          this.setState({
            red9_sub_data: {
              raw_data: data.reports,
              reports: reports
            }
          })
        })
      }
    })
    if (service.meta.operator === 'MCI' && service.wappush !== 'true') {
      // ftp data
      getFTPAggregateReport(
        service.ftp_key,
        this.state.startDate,
        this.state.endDate
      ).then(resp => {
        if (resp.status === 200) {
          resp.json().then(data => {
            this.setState({
              raw_data: data.result,
              data: data.result.map((d, i) => {
                const jdate = this.getPersianDate(d.date_time)
                return {
                  ...d,
                  date_time: jdate,
                  jday: jdate,
                  total_atempts:
                    d.successful_charge_attempt + d.unsuccessful_charge_attempt
                }
              })
            })
          })
        }
      })
      // red9 subscriptions data
    }
  }

  componentDidMount() {
    titleChangeSignal.next(`Reports`)
    this.fetchTimeout = setTimeout(() => {
      this.fetchReportData()
      this.fetchTrendData()
      this.doGetAllReports()
    }, 100)
  }

  componentWillUnmount() {
    clearTimeout(this.fetchTimeout)
    clearTimeout(this.startFetchDataTimeout)
    clearTimeout(this.endFetchDataTimeout)
  }

  change_mo_trend_key = (_, t) => {
    this.setState({ mo_trend_key: t.checked === true ? 'count' : 'msg_count' })
  }

  _handleEndDateChange = (o, v) => {
    this.setState({ endDate: v.value })

    this.endFetchDataTimeout = setTimeout(() => {
      this.fetchReportData()
    }, 500)
  }
  _handleStartDateChange = (o, v) => {
    this.setState({ startDate: v.value })
    this.startFetchDataTimeout = setTimeout(() => {
      this.fetchReportData()
    }, 500)
  }

  render() {
    return (
      <div style={{ marginBottom: 64 }}>
        <Segment id="mci_panel" inverted style={{ textShadow: 'none' }}>
          <Menu attached="top" inverted>
            <Menu.Menu position="left">
              <Menu.Item>
                <Input
                  size="mini"
                  onChange={(o, v) => this._handleStartDateChange(o, v)}
                  type="date"
                  value={this.state.startDate}
                  icon={{ name: 'calendar' }}
                  iconPosition="left"
                  inverted
                  transparent
                  label="FROM"
                  labelPosition="right"
                  placeholder="Report end date"
                />
              </Menu.Item>
            </Menu.Menu>

            <Menu.Menu position="right">
              <Menu.Item>
                <Input
                  size="mini"
                  onChange={(o, v) => this._handleEndDateChange(o, v)}
                  type="date"
                  value={this.state.endDate}
                  icon={{ name: 'calendar' }}
                  iconPosition="left"
                  inverted
                  transparent
                  label="TO"
                  labelPosition="right"
                  placeholder="Report end date"
                />
              </Menu.Item>
            </Menu.Menu>
          </Menu>

          <Segment
            id="mci_report_panel"
            inverted
            style={{ background: '#2c3843' }}
          >
            <h2 align="center">DB Data </h2>
            <Grid columns="equal" divided>
              <Grid.Row key="activations">
                {['API', 'SMS', 'OTP', 'WAP', 'TAJMI', 'USSD'].map(
                  (method, i) => {
                    const data = this.state.red9_sub_data.reports.activations.filter(
                      (x, i) => {
                        return x.source === method
                      }
                    )
                    if (data.length > 0) {
                      return (
                        <Grid.Column key={`${method}_ac`}>
                          <h5 align="center" key="label">
                            {`${method || 'N/A'} activations `}

                            <Icon
                              name="download"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                downloadAs(
                                  data,
                                  `${this.state.service.name}_${method}_activations_history`
                                )
                              }}
                            />
                          </h5>
                          <ResponsiveContainer
                            width="100%"
                            height={200}
                            key="chart"
                          >
                            <LineChart
                              data={data}
                              margin={{
                                top: 5,
                                right: 10,
                                left: 10,
                                bottom: 5
                              }}
                            >
                              <XAxis dataKey="date_time" />
                              <CartesianGrid
                                stroke="#444"
                                strokeDasharray="5 5"
                              />

                              <YAxis />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#ccc',
                                  color: '#111'
                                }}
                                cursor={{ stroke: '#515151', strokeWidth: 1 }}
                              />
                              <Line
                                type="monotone"
                                strokeWidth={5}
                                dataKey="activations"
                                stroke="teal"
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Grid.Column>
                      )
                    } else {
                      return []
                    }
                  }
                )}
              </Grid.Row>
              <Grid.Row key="deactivations">
                {['API', 'SMS', 'OTP', 'WAP', 'TAJMI', 'USSD'].map(
                  (method, i) => {
                    const data = this.state.red9_sub_data.reports.deactivations.filter(
                      (x, i) => {
                        return x.source === method
                      }
                    )
                    if (data.length > 0) {
                      return (
                        <Grid.Column key={`${method}_da`}>
                          <h5 key="label" align="center">
                            {`${method || 'N/A'} deactivations `}

                            <Icon
                              name="download"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                downloadAs(
                                  data,
                                  `${this.state.service.name}_${method}_deactivations_history`
                                )
                              }}
                            />
                          </h5>
                          <ResponsiveContainer
                            width="100%"
                            height={200}
                            key="chart"
                          >
                            <LineChart
                              data={data}
                              margin={{
                                top: 5,
                                right: 10,
                                left: 10,
                                bottom: 5
                              }}
                            >
                              <XAxis dataKey="date_time" />
                              <CartesianGrid
                                stroke="#444"
                                strokeDasharray="5 5"
                              />
                              <YAxis />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#ccc',
                                  color: '#111'
                                }}
                                cursor={{ stroke: '#333', strokeWidth: 1 }}
                              />

                              <Line
                                type="natural"
                                strokeWidth={3}
                                dataKey="deactivations"
                                stroke="red"
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Grid.Column>
                      )
                    } else {
                      return []
                    }
                  }
                )}
              </Grid.Row>
            </Grid>
            <Segment
              style={{ minHeight: 100 }}
              inverted
              loading={Object.keys(this.state.mo_trends).length === 1}
            >
              {Object.keys(this.state.mo_trends).length !== 1 ? (
                <>
                  <Divider />

                  <h1 align="center">MO/MT Stats</h1>
                  <h3 align="center">
                    Inbound Trends{' '}
                    <small>
                      Last 7 days <br />
                      <span style={{ verticalAlign: 'middle' }}>
                        <span style={{ marginRight: 10, fontWeight: 200 }}>
                          {this.state.mo_trend_key === 'count' ? '' : 'Non'}{' '}
                          Unique MSISDNs
                        </span>
                        <Radio
                          size="tiny"
                          toggle
                          checked={
                            this.state.mo_trend_key === 'count' ? true : false
                          }
                          onChange={this.change_mo_trend_key}
                        />
                      </span>
                    </small>
                  </h3>

                  {Object.keys(this.state.mo_trends).map((ev, i) => {
                    const td = this.state.mo_trends[ev]
                    //const counts = td.flatMap((x, _) => x.count)
                    //const re = Math.max(...counts)
                    //const rs = Math.min(...counts)
                    return (
                      <ResponsiveContainer height={80} key={`${i}_graph`}>
                        <ScatterChart
                          margin={{ top: 10, right: 0, bottom: 0, left: 0 }}
                        >
                          <XAxis
                            type="category"
                            dataKey="msg"
                            name="msg"
                            interval={0}
                            tick={{ fontSize: 12, stroke: 'grey' }}
                            tickLine={{ transform: 'translate(0, -6)' }}
                          />
                          <YAxis
                            type="number"
                            dataKey={this.state.mo_trend_key}
                            tick={true}
                            tickLine={true}
                            axisLine={false}
                            label={{
                              value: td.length > 0 ? td[0].date : null,
                              fill: 'gold',
                              position: 'insideBottomLeft'
                            }}
                          />
                          <ZAxis
                            type="number"
                            dataKey="count"
                            range={[20, 300]}
                            sclae="log"
                          />
                          <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            wrapperStyle={{ zIndex: 100 }}
                          />
                          <Scatter
                            data={td}
                            fill={
                              _.shuffle([
                                'teal',
                                '#b7fbff',
                                '#ffe0a3',
                                '#acc6aa',
                                '#d2c8c8'
                              ])[0]
                            }
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )
                  })}
                </>
              ) : null}
            </Segment>
          </Segment>
          <Divider />

          {this.state.service.meta &&
          this.state.service.wappush !== 'true' &&
          this.state.service.meta.operator === 'MCI' ? (
            <Segment id="mci_report_panel" inverted>
              <h1 align="center">
                FTP server data{' '}
                <Icon
                  name="download"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    downloadAs(
                      this.state.data,
                      `${this.state.service.name}_FTP_data`
                    )
                  }}
                />
              </h1>

              <Grid columns="equal" divided>
                <Grid.Row>
                  <Grid.Column>
                    <ResponsiveContainer width="99%" height={200}>
                      <LineChart
                        data={this.state.data}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <XAxis dataKey="date_time" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ccc',
                            color: '#111'
                          }}
                          cursor={{ stroke: '#515151', strokeWidth: 1 }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Line
                          type="monotone"
                          dataKey="unsub_count"
                          stroke="#cc0000"
                          activeDot={{ r: 1 }}
                        />
                        <Line
                          activeDot={{ r: 1 }}
                          type="monotone"
                          dataKey="subs_count"
                          stroke="teal"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Grid.Column>
                  <Grid.Column>
                    <ResponsiveContainer width="99%" height={200}>
                      <ComposedChart data={this.state.data}>
                        <XAxis dataKey="date_time" />
                        <YAxis />
                        <Legend verticalAlign="top" height={36} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ccc',
                            color: '#111'
                          }}
                          cursor={{ stroke: '#515151', strokeWidth: 1 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="income"
                          fill="teal"
                          stroke="teal"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column>
                    <ResponsiveContainer width="99%" height={200}>
                      <ComposedChart data={this.state.data}>
                        <XAxis dataKey="date_time" />
                        <YAxis />
                        <Legend verticalAlign="top" height={36} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ccc',
                            color: '#111'
                          }}
                          cursor={{ stroke: '#515151', strokeWidth: 1 }}
                        />
                        <Bar dataKey="success_rate" barSize={10} fill="#333" />

                        <Line
                          activeDot={{ r: 1 }}
                          type="monotone"
                          dataKey="success_rate"
                          stroke="orange"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Grid.Column>
                  <Grid.Column>
                    <ResponsiveContainer width="99%" height={200}>
                      <LineChart
                        data={this.state.data}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <XAxis dataKey="date_time" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ccc',
                            color: '#111'
                          }}
                          cursor={{ stroke: '#515151', strokeWidth: 1 }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Line
                          type="monotone"
                          dataKey="unsuccessful_charge_attempt"
                          stroke="#cc0000"
                          activeDot={{ r: 1 }}
                        />
                        <Line
                          activeDot={{ r: 1 }}
                          type="monotone"
                          dataKey="successful_charge_attempt"
                          stroke="teal"
                        />

                        <Line
                          activeDot={{ r: 1 }}
                          type="monotone"
                          dataKey="total_atempts"
                          stroke="black"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Segment>
          ) : null}

          {this.state.service.meta &&
          this.state.service.wappush === 'true' &&
          this.state.service.meta.operator === 'MCI' ? (
            <Segment id="mci_report_panel_wappush" inverted>
              <ResponsiveContainer width="99%" height={200}>
                <LineChart
                  data={_.union(this.state.red9_sub_data.reports.activations)}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <XAxis dataKey="date_time" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ccc', color: '#111' }}
                    cursor={{ stroke: '#515151', strokeWidth: 1 }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="activations"
                    stroke="teal"
                    activeDot={{ r: 1 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="source"
                    stroke="grey"
                    activeDot={{ r: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="99%" height={200}>
                <LineChart
                  data={_.union(this.state.red9_sub_data.reports.deactivations)}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <XAxis dataKey="date_time" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ccc', color: '#111' }}
                    cursor={{ stroke: '#515151', strokeWidth: 1 }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="deactivations"
                    stroke="red"
                    activeDot={{ r: 1 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="source"
                    stroke="grey"
                    activeDot={{ r: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Segment>
          ) : null}

          <div>
            <Divider />

            <Table
              celled
              inverted
              selectable
              attached="bottom"
              singleLine
              striped
              size="small"
              compact
              basic
              style={{ textShadow: 'none' }}
            >
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell />
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Income</Table.HeaderCell>
                  <Table.HeaderCell>Subs</Table.HeaderCell>
                  <Table.HeaderCell>Unsubs</Table.HeaderCell>
                  <Table.HeaderCell>Successful Charge tries</Table.HeaderCell>
                  <Table.HeaderCell>Unsuccessful Charge tries</Table.HeaderCell>
                  <Table.HeaderCell>Success Rate</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {this.state.raw_data.reverse().map((r, i) => {
                  return (
                    <Table.Row key={i}>
                      <Table.Cell textAlign="center">{i + 1}</Table.Cell>
                      <Table.Cell textAlign="center">
                        {this.getPersianDate(r.date_time)}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <code>
                          {' '}
                          {accounting.formatNumber(r.income / 10.0)}{' '}
                        </code>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        {accounting.formatNumber(r.subs_count)}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        {accounting.formatNumber(r.unsub_count)}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        {accounting.formatNumber(r.successful_charge_attempt)}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        {accounting.formatNumber(r.unsuccessful_charge_attempt)}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        {Math.round(r.success_rate * 100) / 100}
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          </div>
        </Segment>
      </div>
    )
  }
}

export default Reports
