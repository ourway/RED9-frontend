import React, { Component } from 'react'

import sample from 'lodash/sample'
import { Card, Image, Dimmer, Loader } from 'semantic-ui-react'

class Shine extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dayquote: {},
      quotes: [],
      message_count: '-------',
      isLoadingDayquote: false
    }

    this.loadDayquote = this.loadDayquote.bind(this)
    this.startQuoteInterval = this.startQuoteInterval.bind(this)
  }

  componentDidMount() {
    this.quoteStartTimeout = setTimeout(() => {
      this.loadDayquote()
    }, 100)

    this.quoteLoadInterval = this.startQuoteInterval()
    if (this.state.uuid) {
      this.doLogin()
    }
  }

  componentWillUnmount() {
    clearInterval(this.quoteLoadInterval)
    clearTimeout(this.loadTimeout)
    clearTimeout(this.quoteStartTimeout)
  }

  loadDayquote() {
    let self = this

    if (this.state.quotes.length === 0) {
      this.setState({
        isLoadingDayquote: true
      })
      fetch('/quotes.json').then(r => {
        r.json().then(data => {
          this.setState({
            quotes: data,
            dayquote: sample(data)
          })
          self.loadTimeout = setTimeout(() => {
            self.setState({
              isLoadingDayquote: false
            })
          }, 1000)
        })
      })
    } else {
      this.setState({
        dayquote: sample(this.state.quotes)
      })
    }
  }

  startQuoteInterval = () => {
    const t = 24000
    return setInterval(() => {
      this.loadDayquote()
    }, t)
  }

  render() {
    return (
      <Card color="blue" centered fluid className="shine">
        <Card.Content>
          <Card.Header />
          <Card.Meta>Shine your day</Card.Meta>
          <Card.Description
            style={{ lineHeight: '1em' }}
            className="ms-font-xxl ms-fontColor-themePrimary"
          >
            <Image
              floated="right"
              size="medium"
              src="/horse.png"
              style={{ filter: 'invert(100%)' }}
            />

            <Dimmer active={this.state.isLoadingDayquote === true}>
              <Loader indeterminate>
                let me inspire you to help you get through your day
              </Loader>
            </Dimmer>

            {this.state.dayquote.quoteText}
            <br />
            <br />
            <b>
              <small>{this.state.dayquote.quoteAuthor}</small>
            </b>
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <div />
        </Card.Content>
      </Card>
    )
  }
}

export default Shine
