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

titleChangeSignal.pipe(distinctUntilChanged()).subscribe({
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
            redirectSignal.next('/?m=welcome')
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
