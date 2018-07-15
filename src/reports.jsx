import React, { Component } from 'react'
import { Segment, Menu, Input, Table, Divider, Grid } from 'semantic-ui-react'
import JDate from 'jalali-date'
import accounting from 'accounting-js'
import _ from 'lodash'
import store from 'store'
import {
  LineChart,
  Line,
  XAxis,
  ComposedChart,
  ResponsiveContainer,
  YAxis,
  Area,
  Bar,
  Tooltip,
  Legend
} from 'recharts'

import { getFTPAggregateReport, getSubscriptionDetails } from './apis'

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
      data: [],
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

          let indexed = _.uniqBy(
            _.merge(reports.activations, reports.deactivations),
            'date_time'
          ).filter(e => {
            return e.date_time !== 'N/A'
          })

          this.setState({
            red9_sub_data: {
              raw_data: data.reports,
              reports: reports,
              nested: indexed
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
                return { ...d, date_time: jdate }
              })
            })
          })
        }
      })
      // red9 subscriptions data
    }
  }

  componentDidMount() {
    this.fetchTimeout = setTimeout(() => {
      this.fetchReportData()
    }, 200)
  }

  componentWillUnmount() {
    clearTimeout(this.fetchTimeout)
    clearTimeout(this.startFetchDataTimeout)
    clearTimeout(this.endFetchDataTimeout)
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
        <Segment id="mci_panel" inverted>
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
                  placeholder="Report end date"
                />
              </Menu.Item>
            </Menu.Menu>
          </Menu>

          {this.state.service.meta &&
          this.state.service.wappush !== 'true' &&
          this.state.service.meta.operator === 'MCI' ? (
            <Segment id="mci_report_panel" inverted>
              <ResponsiveContainer width="99%" height={200}>
                <LineChart
                  data={this.state.data}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <XAxis dataKey="date_time" />
                  <YAxis />
                  <Tooltip
                    wrapperStyle={{ backgroundColor: '#222' }}
                    cursor={{ stroke: '#515151', strokeWidth: 1 }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="unsub_count"
                    stroke="#cc0000"
                    activeDot={{ r: 2 }}
                  />
                  <Line
                    activeDot={{ r: 5 }}
                    type="monotone"
                    dataKey="subs_count"
                    stroke="teal"
                  />
                </LineChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="99%" height={200}>
                <ComposedChart data={this.state.data}>
                  <XAxis dataKey="date_time" />
                  <YAxis />
                  <Legend verticalAlign="top" height={36} />
                  <Tooltip
                    wrapperStyle={{ backgroundColor: '#222' }}
                    cursor={{ stroke: '#515151', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    fill="teal"
                    stroke="lightgreen"
                  />
                </ComposedChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="99%" height={200}>
                <ComposedChart data={this.state.data}>
                  <XAxis dataKey="date_time" />
                  <YAxis />
                  <Legend verticalAlign="top" height={36} />
                  <Tooltip
                    wrapperStyle={{ backgroundColor: '#222' }}
                    cursor={{ stroke: '#515151', strokeWidth: 1 }}
                  />
                  <Bar dataKey="success_rate" barSize={10} fill="#333" />

                  <Line
                    activeDot={{ r: 5 }}
                    type="monotone"
                    dataKey="success_rate"
                    stroke="orange"
                  />
                </ComposedChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="99%" height={200}>
                <LineChart
                  data={this.state.data}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <XAxis dataKey="date_time" />
                  <YAxis />
                  <Tooltip
                    wrapperStyle={{ backgroundColor: '#222' }}
                    cursor={{ stroke: '#515151', strokeWidth: 1 }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="unsuccessful_charge_attempt"
                    stroke="#cc0000"
                    activeDot={{ r: 2 }}
                  />
                  <Line
                    activeDot={{ r: 5 }}
                    type="monotone"
                    dataKey="successful_charge_attempt"
                    stroke="teal"
                  />
                </LineChart>
              </ResponsiveContainer>

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
              >
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell />
                    <Table.HeaderCell>Date</Table.HeaderCell>
                    <Table.HeaderCell>Income</Table.HeaderCell>
                    <Table.HeaderCell>Subs</Table.HeaderCell>
                    <Table.HeaderCell>Unsubs</Table.HeaderCell>
                    <Table.HeaderCell>Successful Charge tries</Table.HeaderCell>
                    <Table.HeaderCell>
                      Unsuccessful Charge tries
                    </Table.HeaderCell>
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
                          <code> {accounting.formatNumber(r.income)} </code>
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
                          {accounting.formatNumber(
                            r.unsuccessful_charge_attempt
                          )}
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          {Math.round(r.success_rate * 100) / 100}
                        </Table.Cell>
                      </Table.Row>
                    )
                  })}
                </Table.Body>
              </Table>
            </Segment>
          ) : null}

          {this.state.service.meta &&
          this.state.service.wappush === 'true' &&
          this.state.service.meta.operator === 'MCI' ? (
            <Segment id="mci_report_panel_wappush" inverted>
              <ResponsiveContainer width="99%" height={200}>
                <LineChart
                  data={this.state.red9_sub_data.nested}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <XAxis dataKey="date_time" />
                  <YAxis />
                  <Tooltip
                    wrapperStyle={{ backgroundColor: '#222' }}
                    cursor={{ stroke: '#515151', strokeWidth: 1 }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="activations"
                    stroke="teal"
                    activeDot={{ r: 2 }}
                  />
                  <Line
                    activeDot={{ r: 5 }}
                    type="monotone"
                    dataKey="deactivations"
                    stroke="red"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Segment>
          ) : null}

          <div>
            <Divider />
            <h2 align="center">DB Data</h2>
            <Grid columns="equal" divided>
              <Grid.Row key="activations">
                {['API', 'SMS', 'OTP', 'WAP'].map((method, i) => {
                  const data = this.state.red9_sub_data.reports.activations.filter(
                    (x, i) => {
                      return x.source === method
                    }
                  )
                  if (data.length > 0) {
                    return (
                      <Grid.Column key={`${method}_ac`}>
                        <h5 align="center" key="label">{`${method ||
                          'N/A'} activations`}</h5>
                        <ResponsiveContainer
                          width="100%"
                          height={200}
                          key="chart"
                        >
                          <LineChart
                            data={data}
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                          >
                            <XAxis dataKey="date_time" />
                            <YAxis />
                            <Tooltip
                              wrapperStyle={{ backgroundColor: '#222' }}
                              cursor={{ stroke: '#515151', strokeWidth: 1 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="activations"
                              stroke="lightgreen"
                              activeDot={{ r: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Grid.Column>
                    )
                  } else {
                    return []
                  }
                })}
              </Grid.Row>
              <Grid.Row key="deactivations">
                {['API', 'SMS', 'OTP', 'WAP', 'TAJMI'].map((method, i) => {
                  const data = this.state.red9_sub_data.reports.deactivations.filter(
                    (x, i) => {
                      return x.source === method
                    }
                  )
                  if (data.length > 0) {
                    return (
                      <Grid.Column key={`${method}_da`}>
                        <h5 key="label" align="center">{`${method ||
                          'N/A'} deactivations`}</h5>
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
                            <YAxis />
                            <Tooltip
                              wrapperStyle={{ backgroundColor: '#222' }}
                              cursor={{ stroke: '#515151', strokeWidth: 1 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="deactivations"
                              stroke="red"
                              activeDot={{ r: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Grid.Column>
                    )
                  } else {
                    return []
                  }
                })}
              </Grid.Row>
            </Grid>

            <Divider />
          </div>
        </Segment>
      </div>
    )
  }
}

export default Reports
