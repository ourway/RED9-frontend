import React, { Component } from 'react'

import { Segment, List } from 'semantic-ui-react'

class APIDocs extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    return (
      <Segment inverted color="black">
        <List divided inverted relaxed>
          <List.Item>
            <List.Content>
              <List.Header>
                <a>Complete API documentation</a>
              </List.Header>
              This page includes all API options and documentation. Must be
              studied as a reference. Important ones are included in this page
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Content>
              <List.Header>Sending a message</List.Header>
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Content>
              <List.Header>Get user history</List.Header>
            </List.Content>
          </List.Item>
        </List>
      </Segment>
    )
  }
}

export default APIDocs
