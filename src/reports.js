import React, { Component } from 'react';
import { Segment, Menu, Input } from 'semantic-ui-react';
import JDate from 'jalali-date';
import store from 'store';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

import { getFTPAggregateReport } from './apis';

const str_pad = n => {
  return String('00' + n).slice(-2);
};

class Reports extends Component {
  constructor(props) {
    super(props);
    const date = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);

    const today = `${date.getFullYear()}-${str_pad(date.getMonth())}-${str_pad(
      date.getDate()
    )}`;
    const lastM = `${lastMonth.getFullYear()}-${str_pad(
      lastMonth.getMonth()
    )}-${str_pad(lastMonth.getDate())}`;
    this.state = { data: [], endDate: today, startDate: lastM };
  }

  fetchReportData = () => {
    const service = store.get('service');
    if (service.meta.operator === 'MCI') {
      getFTPAggregateReport(
        service.ftp_key,
        this.state.startDate,
        this.state.endDate
      ).then(resp => {
        if (resp.status === 200) {
          resp.json().then(data => {
            this.setState({
              data: data.result.map((d, i) => {
                const jdate = new JDate(new Date(d.date_time * 1000));
                const r = `
                  ${jdate.getFullYear()}
                  -${jdate.getMonth()}
                  -${jdate.getDate()}
                  `;
                return { ...d, date_time: r };
              })
            });
          });
        }
      });
    }
  };

  componentDidMount() {
    this.fetchTimeout = setTimeout(() => {
      console.log('h1');
      this.fetchReportData();
    }, 1000);
  }

  componentWillUnmount() {
    clearTimeout(this.fetchTimeout);
  }

  _handleEndDateChange = (o, v) => {
    this.setState({ endDate: v.value });
    this.fetchReportData();
  };
  _handleStartDateChange = (o, v) => {
    this.setState({ startDate: v.value });
    this.fetchReportData();
  };

  render() {
    return (
      <Segment>
        <Menu attached="top">
          <Menu.Menu position="left">
            <Menu.Item>
              <Input
                style={{ color: '#222' }}
                size="tiny"
                onChange={(o, v) => this._handleStartDateChange(o, v)}
                type="date"
                value={this.state.startDate}
                inverted
                icon={{ name: 'calendar' }}
                iconPosition="left"
                placeholder="Report end date"
              />
            </Menu.Item>
          </Menu.Menu>

          <Menu.Menu position="right">
            <Menu.Item>
              <Input
                style={{ color: '#222' }}
                size="tiny"
                onChange={(o, v) => this._handleEndDateChange(o, v)}
                type="date"
                value={this.state.endDate}
                inverted
                icon={{ name: 'calendar' }}
                placeholder="Report end date"
              />
            </Menu.Item>
          </Menu.Menu>
        </Menu>

        <LineChart
          width={1000}
          height={300}
          data={this.state.data}
          margin={{ top: 5, right: 3, left: 2, bottom: 5 }}
        >
          <XAxis dataKey="date_time" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <Line dataKey="unsub_count" stroke="orange" activeDot={{ r: 8 }} />
          <Line
            activeDot={{ r: 8 }}
            type="monotone"
            dataKey="subs_count"
            stroke="teal"
          />
        </LineChart>
      </Segment>
    );
  }
}

export default Reports;
