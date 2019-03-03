import React, { Component } from 'react'
import { List, Icon, Search, Label } from 'semantic-ui-react'
import store from 'store'

import { distinctUntilChanged, debounceTime } from 'rxjs/operators'
import { selectService$, selectApp$, searching$ } from './utils'

import { Link } from 'react-router-dom'

import { isAdmin } from './utils'
import { getIp } from './utils'

class Leftbar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selected_service: null,
      selected_app: null,
      is_admin: false,
      ip: '--.--.--.--',
      city: ''
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // There are two modes that we need to render:
    // is_admin mode is changing or active path is changing
    return (
      nextState.is_admin !== this.state.is_admin ||
      nextProps.activepath !== this.props.activepath ||
      nextState.ip !== this.state.ip ||
      nextState.selected_service !== this.state.selected_service ||
      nextState.selected_app !== this.state.selected_app
    )
  }

  componentWillUnmount() {
    clearTimeout(this.getIpTimeout)
    clearTimeout(this.selectServiceTimeout)
    this.adminSubscription.unsubscribe()
    this.serviceSelection.unsubscribe()
    this.AppSelection.unsubscribe()
  }

  componentDidMount() {
    this.setState({ reporter: atob(store.get('reporter') || 'ZmFsc2U=') })

    this.selectServiceTimeout = setTimeout(() => {
      const service = store.get('service')
      if (service) {
        this.setState({ selected_service: service })
      }
    }, 0)

    this.serviceSelection = selectService$
      .pipe(
        distinctUntilChanged(),
        debounceTime(50)
      )
      .subscribe({
        next: s => {
          this.setState({ selected_service: s })
        }
      })

    this.AppSelection = selectApp$
      .pipe(
        distinctUntilChanged(),
        debounceTime(50)
      )
      .subscribe({
        next: a => {
          this.setState({ selected_app: a })
        }
      })

    this.adminSubscription = isAdmin.pipe(distinctUntilChanged()).subscribe({
      next: b => {
        this.setState({
          is_admin: b
        })
      }
    })

    this.getIpTimeout = setTimeout(() => {
      getIp().then(resp => {
        resp.json().then(r => {
          if (!r.country_calling_code) {
          } else {
            this.setState({
              ip: r.ip,
              city: r.city
            })
          }
        })
      })
    }, 2)
  }

  doSearch = (_, e) => {
    const val = e.value.trim()
    searching$.next(btoa(encodeURIComponent(val)))
  }

  render() {
    const sections =
      this.state.reporter !== 'true'
        ? [
            ':Definitions:',
            'Services',
            'Apps',
            ':Advanced Settings:',
            'Templates',
            'Reactions',
            ':Try:',
            'Messaging',
            'Charging',
            'Subscriptions',
            ':Analyze:',
            'Reports',
            ':Help Desk:',
            'Customer Care',
            ':Development:',
            'Key.Value Database',
            'API Docs',
            'Getting Started',
            ':Set:',
            'Profile',
            'Settings'
          ]
        : ['Services', 'Reports', 'Subscriptions']

    const need_service = [
      'Reactions',
      'Apps',
      'Reports',
      'FTP Data',
      'Subscriptions',
      'Integration Panel',
      'Logs',
      'Customer Care'
    ]

    const need_app = ['Messaging', 'Charging']
    const admin_sections = [
      'Client Management',
      'Aggregated Reports',
      'Forensic Administration',
      'Monitoring',
      'System Information'
    ]

    return (
      <List relaxed className="ms-slideRightIn10">
        {this.state.selected_service ? (
          <Search
            placeholder="Search for MSISDN, Correlators, ..."
            className="mainSearch"
            onSearchChange={this.doSearch}
            key="search_section"
            size="mini"
            open={false}
            minCharacters={4}
          />
        ) : null}
        <h3 key="panel_text" className="ms-font-l ms-fontColor-white">
          Panel
        </h3>

        {sections.map((i, n) => {
          let p = i.toLowerCase().replace(' ', '-')
          const ap = this.props.activepath.split('/')[0]
          let is_activepath = ap === p

          let mode = need_service.includes(i)
            ? this.state.selected_service === null
              ? 'disabled'
              : ''
            : need_app.includes(i)
              ? this.state.selected_app === null
                ? 'disabled'
                : ''
              : ''

          if (p.indexOf(':') > -1) {
            return (
              <List.Item key={n} color="orange" className="">
                <h5
                  style={{
                    color: '#f2711d',
                    backgroundColor: '#1a2127',
                    fontWeight: 300
                  }}
                  key={n}
                >
                  {i.slice(1, -1)}
                </h5>
              </List.Item>
            )
          }
          return (
            <List.Item
              key={n}
              color="black"
              className="menuListItem"
              style={{
                backgroundColor: is_activepath ? '#daac03' : 'transparent'
              }}
            >
              <Link to={mode !== 'disabled' ? `/${p}` : '#'} className={mode}>
                <Icon
                  name={is_activepath ? 'arrow circle right' : 'chevron right'}
                  color={is_activepath ? 'black' : 'grey'}
                />
                <span
                  style={{
                    fontWeight: is_activepath ? 400 : 200,
                    color: is_activepath ? '#313131' : 'lightgrey',
                    width: '100%'
                  }}
                >
                  {i}
                  {this.props.activepath !== ap && is_activepath === true ? (
                    <small style={{ color: 'grey' }}>
                      {' '}
                      /&bull;&bull;&bull;{' '}
                    </small>
                  ) : null}
                </span>
              </Link>
            </List.Item>
          )
        })}
        {this.state.is_admin === true
          ? [
              <h4 key="admin_text" className="ms-font-l ms-fontColor-white">
                Administration
              </h4>,

              admin_sections.map((i, n) => {
                let p = i.toLowerCase().replace(' ', '-')
                let is_activepath = this.props.activepath === p

                return (
                  <List.Item
                    key={n + sections.length + 1}
                    className="menuListItem"
                  >
                    <Link to={`/${i.toLowerCase().replace(' ', '-')}`}>
                      <Icon
                        name={
                          is_activepath ? 'arrow circle right' : 'chevron right'
                        }
                        color={is_activepath ? 'blue' : 'black'}
                      />
                      <span style={{ fontWeight: is_activepath ? 800 : 100 }}>
                        {i}
                      </span>
                    </Link>
                  </List.Item>
                )
              })
            ]
          : null}

        <br />
        <br />
        <br />

        <List.Item key="client_ip">
          <Label size="mini" tag color="blue">
            {' '}
            <b>Your IP</b>: <code>{this.state.ip}</code> | {this.state.city}{' '}
          </Label>
        </List.Item>

        <List.Item key="logout">
          <Link to="/login">
            {' '}
            <Icon name="bed" color="orange" /> Logout
          </Link>
        </List.Item>
      </List>
    )
  }
}

export default Leftbar
