import React, { Component } from 'react'

import { Card } from 'semantic-ui-react'

class Shine extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pic_num: 1
    }
  }

  componentDidMount() {
    this.picChangeInterval = setInterval(() => {
      this.setState({
        pic_num: this.state.pic_num > 5 ? 1 : this.state.pic_num + 1
      })
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.picChangeInterval)
  }

  render() {
    return (
      <Card color="blue" centered fluid>
        <Card.Content>
          <Card.Header />
          <Card.Meta>
            <h3>SHOWCASE</h3>
          </Card.Meta>
          <Card.Description />
        </Card.Content>
        <Card.Content
          style={{
            backgroundImage: `url(/red9-${this.state.pic_num}.png)`,
            backgroundSize: 'cover',
            height: 400
          }}
        />
      </Card>
    )
  }
}

export default Shine
