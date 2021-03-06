import React from 'react'
import ReactDOM from 'react-dom'
import 'semantic-ui-css/semantic.css'
import 'typeface-inconsolata/index.css'
import 'lato-font/css/lato-font.css'
import 'font-awesome/css/font-awesome.css'
import 'highlight.js/styles/solarized-dark.css'
import 'office-ui-fabric-react/dist/css/fabric.css'
import 'iransans/fontiran.less'
import './index.css'
import './App.css'
import './general'
import { env, browser } from './config'
import NotSupportedBrowser from './not_supported_browser'
import Unavailable from './unavailable'
import Login from './Login'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { initializeIcons } from '@uifabric/icons'
import App from './App'
import {
  handle_message_count_receive$,
  joinSubject$,
  newEventSubject$,
  incomingMoSubject$
} from './utils'

import { Socket } from 'phoenix/priv/static/phoenix'

//import registerServiceWorker from './registerServiceWorker'

let socket_connection = new Socket('wss://wolf.red9.ir/socket', {
  params: { token: 'start' }
})
socket_connection.connect()
socket_connection.onClose(() => console.log('the connection dropped'))
socket_connection.onOpen(() => join_channels())

const join_channels = () => {
  joinSubject$.subscribe({
    next: c => {
      let cnl = socket_connection.channel(c, {})
      cnl.join().receive('ok', _resp => {
        cnl.on('incoming_mo', msg => {
          incomingMoSubject$.next(msg)
        })

        cnl.on('new_event', msg => {
          newEventSubject$.next(msg)
        })

        //jnewc.on('new_event', msg => console.log(msg))
      })
    }
  })

  let channel = socket_connection.channel('stats:homepage', {})
  channel
    .join()

    .receive('ok', _resp => {
      console.info('Connected to upstream websocket server.')
      channel.push('get_stats')
    })
    .receive('error', ({ reason }) => console.log('failed join', reason))
    .receive('timeout', () => console.log('Networking issue. Still waiting...'))
  channel.on('messages_count', msg => handle_message_count_receive$.next(msg))
}

initializeIcons()
const is_supported =
  browser !== null
    ? browser.name === 'chrome' ||
      browser.name === 'safari' ||
      browser.name === 'vivaldi' ||
      browser.name === 'opera' ||
      browser.name === 'ios' ||
      browser.name === 'crios' ||
      browser.name === 'edge' ||
      browser.name === 'firefox'
    : {
        name: 'Unknown',
        os: 'N/A'
      }

ReactDOM.render(
  <BrowserRouter forceRefresh={false} basename={process.env.PUBLIC_URL}>
    <Switch>
      <Route exact path="/login" name="Login" component={Login} />
      <Route exact path="/login/:client_key" name="Login" component={Login} />
      <Route
        exact
        path="/login/:client_key/:only_report"
        name="Login"
        component={Login}
      />
      <Route component={Unavailable} exact path="/451" name="Home" />
      <Route component={NotSupportedBrowser} exact path="/406" name="Home" />
      <Route
        component={is_supported ? App : NotSupportedBrowser}
        path="/"
        name="Home"
      />
    </Switch>
  </BrowserRouter>,

  document.getElementById('root')
)

//registerServiceWorker()

if (navigator.serviceWorker) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      //console.debug(registration)
      registration.unregister()
    }
  })
}

const is_devmode = process.env.NODE_ENV === 'development'

if (is_devmode === false) {
  const cst = 'color: green; font-size:19px;font-family:monospace'
  console.debug(
    `Hey geek friend!  ${env.company} ${env.product} (based on RED9) is using Erlang technology on backend.  If you h` +
      'ave any problems hacking it, please contact me at farsheed.ashouri at gmail  ;-)'
  )
  console.debug(
    'You may also want to visit my repo:  https://github.com/ourway'
  )
  console.debug('%c   ___              _                   _', cst)
  console.debug('%c  / __\\_ _ _ __ ___| |__   ___  ___  __| |', cst)
  console.debug("%c / _\\/ _` | '__/ __| '_ \\ / _ \\/ _ \\/ _` |", cst)
  console.debug('%c/ / | (_| | |  \\__ \\ | | |  __/  __/ (_| |', cst)
  console.debug('%c\\/   \\__,_|_|  |___/_| |_|\\___|\\___|\\__,_|', cst)
  console.debug('                                                 ')
  console.info(
    `Copyright 2016-Present | ${env.copyright_company} | licenced to ${env.company} with ♥ | Designed and implemented by Farsheed Ashouri`
  )
}
