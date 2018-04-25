import swal from 'sweetalert2';
import Rx from 'rxjs/Rx';
import { env } from './config';
import { getClientGateways, createClientGateway } from './apis';

import store from 'store';
export const usernameAssigned = new Rx.Subject();
export const isAdmin = new Rx.Subject();
export const nowUpdate = new Rx.Subject();
export const redirectSignal = new Rx.Subject();
export const clientKeySignal = new Rx.Subject();
export const reloadReports = new Rx.Subject();
export const titleChangeSignal = new Rx.Subject();
export const onFilter$ = new Rx.Subject();
export const selectService$ = new Rx.Subject();
export const selectApp$ = new Rx.Subject();
export const toggleFormEdit$ = new Rx.Subject();
export const changeColorCode$ = new Rx.Subject();
export const searching$ = new Rx.Subject();
export const startLoading$ = new Rx.Subject();
export const stopLoading$ = new Rx.Subject();

//export const ab_controller = new AbortController()
//export const ab_signal = ab_controller.signal

export const getIp = () => {
  return fetch('https://ipapi.co/json');
};

export const browser = () => {};

titleChangeSignal.distinctUntilChanged().subscribe({
  next: t => {
    document.title = `${t} - ${env.company} ${env.product}`;
  }
});

selectService$
  .distinctUntilChanged()
  .debounceTime(50)
  .subscribe({
    next: s => {
      const serviceData = {
        name: s.name,
        ftp_key: s.meta.ftp_key,
        meta: s.meta,
        sid: s.service_id
      };
      store.set('service', serviceData);
    }
  });

export const getCredentialHeaders = uuid => {
  const uuidKey = uuid ? btoa(uuid) : store.get('uuid');
  let headers = new Headers();

  if (uuidKey) {
    headers.set('client-key', atob(uuidKey));
  }
  return headers;
};

export const sendLoginRequest = (uuid, hora, login_mode, no_admin) => {
  const headers = getCredentialHeaders(uuid);

  const req = fetch(`${env.API_BASE}/api/client/ping`, {
    credentials: 'same-origin',
    headers: headers
  });

  req.then(resp => {
    switch (resp.status) {
      case 200:
        if (login_mode === true) {
          store.set('uuid', btoa(uuid));
          redirectSignal.next('/?m=welcome');
          const gwr = getClientGateways(uuid);
          gwr.then(resp => {
            resp.json().then(result => {
              const gws = result.gateways;
              if (gws.filter(i => i.operator === 'MTN/IRANCELL').length === 0) {
                createClientGateway(uuid, 'irancell').then(r => {
                  console.log(r.status);
                });
              }
              if (gws.filter(i => i.operator === 'MCI').length === 0) {
                createClientGateway(uuid, 'imi').then(r => {
                  console.log(r.status);
                });
              }
            });
          });
        }
        resp.json().then(data => {
          nowUpdate.next(data.now);
          usernameAssigned.next(data.company);
          if (!no_admin) {
                                                                 

          }

          store.set('acl', {admin: data.is_admin === true});
          isAdmin.next(data.is_admin === true);
          clientKeySignal.next(btoa(uuid));
          if (!swal.isVisible() && hora === true) {
            swal({
              position: 'center',
              type: 'success',
              title: 'Welcome',
              text: `Welcome to ${env.company} ${env.product}`,
              showConfirmButton: false,
              timer: 1000
            });
          }
        });

        return true;

      default:
        redirectSignal.next('/login');
        clientKeySignal.next(btoa('00000000-0000-0000-0000-000000000000'));
        swal({
          position: 'center',
          type: 'error',
          title: 'opps!',
          text: 'something went wrong!',
          showConfirmButton: false,
          timer: 1500
        });
        return false;
    }
  });
  return req;
};
