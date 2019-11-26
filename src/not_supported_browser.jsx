import React, { Component } from 'react'

import { Card, Icon } from 'semantic-ui-react'
import { browser, env } from './config'

import Footer from './Footer'
import Header from './Header'
import { titleChangeSignal } from './utils'

const extra = (
  <a
    className="dark"
    href="https://www.google.com/chrome/browser/thankyou.html"
    target="_new"
  >
    <Icon name="download" />
    Download a modern browser
  </a>
)

class NotSupportedBrowser extends Component {
  componentDidMount() {
    titleChangeSignal.next('406 / Not Supported')
  }

  render() {
    return (
      <div>
        <Header />
        <div>
          <Card
            style={{
              padding: 20,
              textAlign: 'center',
              width: '100%',
              fontWeight: 400
            }}
            header="406 / Not Supported Browser"
            meta={`${browser.name} ${browser.version} browser is not supprted`}
            description={`${env.company} ${env.product} is a modern application. Please use Google Chrome, Apple Safari, Vivaldi, Opera or Microsoft Edge to use it.
    `}
            extra={extra}
          />
        </div>

        <Footer />
      </div>
    )
  }
}

export default NotSupportedBrowser
