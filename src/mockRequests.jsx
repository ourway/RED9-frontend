import React, { Component } from 'react'

import NotImplemented from './not_implemented'

class MockRequests extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    return <NotImplemented />
  }
}

export default MockRequests
