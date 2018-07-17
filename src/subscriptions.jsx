import React, { Component } from 'react'

import { fixDatetime } from './utils'
import { Segment, Table } from 'semantic-ui-react'
import { getSubscribers } from './apis'
import store from 'store'
import JDate from 'jalali-date'

class Subscriptions extends Component {
  constructor(props) {
    super(props)
    this.state = { subscribers: [], is_loading: true }
  }

  componentDidMount() {
    const service = store.get('service')
    const uuidKey = store.get('uuid') //no need to check again
    getSubscribers(atob(uuidKey), service.name).then(data => {
      if (data.status === 200) {
        data.json().then(resp => {
          this.setState({ subscribers: resp.results, is_loading: false })
        })
      }
    })
  }

  componentWillUnmount() {}

  render() {
    return (
      <Segment inverted loading={this.state.is_loading}>
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
              <Table.HeaderCell width={1}>Event</Table.HeaderCell>
              <Table.HeaderCell width={2}>MSISDN</Table.HeaderCell>
              <Table.HeaderCell>FNUM</Table.HeaderCell>
              <Table.HeaderCell>Activated On</Table.HeaderCell>
              <Table.HeaderCell width={1}>Activated Via</Table.HeaderCell>
              <Table.HeaderCell>Deactivated On</Table.HeaderCell>
              <Table.HeaderCell width={1}>Deactivated Via</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {this.state.subscribers.map((s, i) => {
              return (
                <Table.Row key={this.state.subscribers.length - i}>
                  <Table.Cell textAlign="center">
                    {this.state.subscribers.length - i}
                  </Table.Cell>
                  <Table.Cell>
                    <small>
                      {s.country_code === 98 ? 'IR' : s.country_code}
                    </small>{' '}
                    <strong
                      style={{
                        color: s.deactivated_on === null ? 'PaleGreen' : 'pink'
                      }}
                    >
                      {s.national_number}
                    </strong>
                  </Table.Cell>
                  <Table.Cell>{s.fake_number}</Table.Cell>
                  <Table.Cell>
                    {JDate.toJalali(new Date(s.activated_on)).join('/')}
                    {' | '}
                    <small>{fixDatetime(s.activated_on)}</small>
                  </Table.Cell>
                  <Table.Cell>{s.sub_source}</Table.Cell>
                  <Table.Cell>
                    {s.deactivated_on ? (
                      <span>
                        {JDate.toJalali(new Date(s.deactivated_on)).join('/')}
                        {' | '}
                        <small>{fixDatetime(s.deactivated_on)}</small>
                      </span>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>{s.unsub_source}</Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </Segment>
    )
  }
}

export default Subscriptions
