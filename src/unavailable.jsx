import React, { Component } from 'react'

import { Card } from 'semantic-ui-react'
import { browser, env } from './config'
import Footer from './Footer'
import Header from './Header'

import { titleChangeSignal } from './utils'

class Unavailable extends Component {
  componentDidMount() {
    titleChangeSignal.next('451 / Unavailable')
  }

  render() {
    return (
      <div>
        <Header />
        <div style={{ minHeight: 400 }}>
          <Card
            style={{
              padding: 20,
              textAlign: 'center',
              width: '100%',
              fontWeight: 400
            }}
            header="451 / Unavailable For Legal Reasons"
            description={`${env.company} ${
              env.product
            } is only available in Iran.
            To protect our customers, we log all communications.  
            Your browser ${browser.name} 
            reports that you are connecting outside Iran.  
            If you are using VPN/Proxy, Please turn it off`}
          />
        </div>

        <Footer />
      </div>
    )
  }
}

export default Unavailable
