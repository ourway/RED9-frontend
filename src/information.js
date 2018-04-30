import React, { Component } from 'react'
import { Segment, Message, Divider, Icon } from 'semantic-ui-react'
import { env } from './config'

class Information extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    return (
      <Segment inverted>
        <Message color="black" attached="bottom">
          <Message.Header>
            <Icon name="desktop" color="orange" />
            {`${env.company} ${env.product} System Information`}
          </Message.Header>
          <ul>
            <li>
              Public API Endpoint: <code>{`${env.API_BASE}`}</code>
            </li>

            <Divider />
            <li>
              IMI Incomming MO:{' '}
              <code>{`${env.SELF_IP}:${env.SELF_PORT}/messaging/mo`}</code>
            </li>

            <li>
              IMI Centralize Endpoint:{' '}
              <code>{`${env.SELF_IP}:${env.SELF_PORT}/centralize`}</code>
            </li>

            <li>
              IMI Delivery Reports:{' '}
              <code>{`${env.SELF_IP}:${
                env.SELF_PORT
              }/delivery/IMI/<CORRELATOR>`}</code>{' '}
              <small>
                {' '}
                correlator is message correlator and must be defined by IMI SDP
                team
              </small>
            </li>

            <Divider />
            <li>
              IMI FTP tool API Endpoint: <code>{`${env.FTP_BASE}`}</code>
            </li>

            <li>
              IMI Integration Panel API ENDPOINT:{' '}
              <code>{`${env.CODE51_BASE}`}</code> <small>X-AUTH-TOKEN:</small>{' '}
              <code>{`${env.CODE51_TOKEN}`}</code>
            </li>

            <Divider />

            <li>
              Irancell Incomming EndPoint:{' '}
              <code>{`${env.SELF_IP}:${env.SELF_PORT}/irancell`}</code>
            </li>
          </ul>
        </Message>
      </Segment>
    )
  }
}

export default Information
