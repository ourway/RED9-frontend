import React, { Component } from 'react'
import { Segment, Message, Icon } from 'semantic-ui-react'

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
            <Icon name="smile" color="orange" />
            Sorry this feature is not implemented yet and we're working on this.
            Please get back soon
          </Message.Header>
        </Message>
      </Segment>
    )
  }
}

export default Information
