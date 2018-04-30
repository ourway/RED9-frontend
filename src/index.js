import React from 'react'
import ReactDOM from 'react-dom'
import 'semantic-ui-css/semantic.css'
import 'typeface-inconsolata/index.css'
import 'font-awesome/css/font-awesome.css'
import 'highlight.js/styles/solarized-dark.css'
import 'lato-font/css/lato-font.css'
import './index.css'
import './App.css'
import './general'
import { env, browser } from './config'
import NotSupportedBrowser from './not_supported_browser.js'
import Unavailable from './unavailable.js'
import Login from './Login'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { initializeIcons } from '@uifabric/icons'
import App from './App'

import registerServiceWorker from './registerServiceWorker'

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

registerServiceWorker()

const is_devmode = process.env.NODE_ENV === 'development'

if (is_devmode === false) {
  const cst = 'color: green; font-size:12px;font-family:monospace'
  console.debug(
    `Hey geek friend!  ${env.company} ${
      env.product
    } (based on RED9) is using Erlang technology on backend.  If you h` +
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
    `Copyright 2016-Present | ${env.copyright_company} | licenced to ${
      env.company
    } with ♥ | Designed and implemented by Farsheed Ashouri`
  )
}
