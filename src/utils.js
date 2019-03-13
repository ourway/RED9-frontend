import swal from 'sweetalert2'
import { Subject } from 'rxjs'
import { distinctUntilChanged, debounceTime } from 'rxjs/operators'
import { env } from './config'
import { getClientGateways, createClientGateway } from './apis'

import store from 'store'
export const usernameAssigned = new Subject()
export const isAdmin = new Subject()
export const nowUpdate = new Subject()
export const redirectSignal = new Subject()
export const joinSubject$ = new Subject()
export const incomingMoSubject$ = new Subject()
export const newEventSubject$ = new Subject()
export const clientKeySignal = new Subject()
export const reloadReports = new Subject()
export const titleChangeSignal = new Subject()
export const onFilter$ = new Subject()
export const reporterSignal = new Subject()
export const selectService$ = new Subject()
export const selectApp$ = new Subject()
export const toggleFormEdit$ = new Subject()
export const changeColorCode$ = new Subject()
export const searching$ = new Subject()
export const startLoading$ = new Subject()
export const stopLoading$ = new Subject()
export const handle_message_count_receive$ = new Subject()

//export const ab_controller = new AbortController()
//export const ab_signal = ab_controller.signal
//
export const fixDatetime = dtr => {
  let dt = new Date(dtr)
  let myTZO = 270
  let myNewDate = new Date(dt.getTime() + myTZO * 60000)
  return myNewDate.toLocaleString('en-US', { timeZone: 'Asia/Tehran' })
}

export const getIp = () => {
  return fetch('https://ipapi.co/json')
}

export const browser = () => {}

titleChangeSignal.subscribe({
  next: t => {
    document.title = `${t} - ${env.company} ${env.product}`
  }
})

selectService$
  .pipe(
    distinctUntilChanged(),
    debounceTime(50)
  )
  .subscribe({
    next: s => {
      const serviceData = {
        name: s.name,
        colorCode: s.colorCode,
        wappush: s.wappush,
        ftp_key: s.meta.ftp_key,
        meta: s.meta,
        sid: s.service_id
      }
      store.set('service', serviceData)
    }
  })

export const getCredentialHeaders = uuid => {
  const uuidKey = uuid ? btoa(uuid) : store.get('uuid')
  let headers = new Headers()

  if (uuidKey) {
    headers.set('client-key', atob(uuidKey))
  }
  return headers
}

export const sendLoginRequest = (uuid, hora, login_mode, no_admin) => {
  const headers = getCredentialHeaders(uuid)

  const req = fetch(`${env.API_BASE}/api/client/ping`, {
    credentials: 'same-origin',
    headers: headers
  })

  req.then(resp => {
    switch (resp.status) {
      case 200:
        if (login_mode === true) {
          store.set('uuid', btoa(uuid))
          const gwr = getClientGateways(uuid)
          gwr.then(resp => {
            resp.json().then(result => {
              redirectSignal.next('/?m=welcome')
              const gws = result.gateways
              if (gws.filter(i => i.operator === 'MTN/IRANCELL').length === 0) {
                createClientGateway(uuid, 'irancell').then(r => {})
              }
              if (gws.filter(i => i.operator === 'MCI').length === 0) {
                createClientGateway(uuid, 'imi').then(r => {})
              }
            })
          })
        }
        resp.json().then(data => {
          nowUpdate.next(data.now)
          usernameAssigned.next(data.company)

          if (data.is_admin === true) {
            redirectSignal.next('/client-management')
          } else {
          }

          store.set('acl', { admin: data.is_admin === true })
          isAdmin.next(data.is_admin === true)
          clientKeySignal.next(btoa(uuid))
          if (!swal.isVisible() && hora === true) {
            swal({
              position: 'center',
              type: 'success',
              title: 'Welcome',
              text: `Welcome to ${env.company} ${env.product}`,
              showConfirmButton: false,
              timer: 1000
            })
          }
        })

        joinSubject$.next(`client:${uuid}`)
        return true

      default:
        redirectSignal.next('/login')
        clientKeySignal.next(btoa('00000000-0000-0000-0000-000000000000'))
        swal({
          position: 'center',
          type: 'error',
          title: 'opps!',
          text: 'something went wrong!',
          showConfirmButton: false,
          timer: 1500
        })
        return false
    }
  })
  return req
}

export const padZero = (str, len) => {
  len = len || 2
  var zeros = new Array(len).join('0')
  return (zeros + str).slice(-len)
}

export const invertColor = (hex, bw) => {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1)
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.')
  }
  var r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16)
  if (bw) {
    // http://stackoverflow.com/a/3943023/112731
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF'
  }
  // invert color components
  r = (255 - r).toString(16)
  g = (255 - g).toString(16)
  b = (255 - b).toString(16)
  // pad each with zeros and return
  return '#' + padZero(r) + padZero(g) + padZero(b)
}

export const msisdn_prettefy = target => {
  return `${target.slice(0, 3)}-${target.slice(3, 7)}-${target.slice(7, 10)}`
}

export const convertToCSV = objArray => {
  let rows = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray
  let header = ''
  Object.keys(rows[0]).map(pr => (header += pr + ';'))

  let str = ''
  rows.forEach(row => {
    let line = ''
    let columns = typeof row !== 'object' ? JSON.parse(row) : Object.values(row)
    columns.forEach(column => {
      if (line !== '') {
        line += ';'
      }
      if (typeof column === 'object') {
        line += JSON.stringify(column)
      } else {
        line += column
      }
    })
    str += line + '\r\n'
  })
  return header + '\r\n' + str
}
