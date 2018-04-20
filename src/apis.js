import { env } from './config';

let CLIENTKEY = '00000000-0000-0000-0000-000000000000';

export const getClientAuthHeaders = client_key => {
  let authHeaders = new Headers();
  authHeaders.set('Content-Type', 'application/json');
  authHeaders.append('client-key', client_key || CLIENTKEY);
  return authHeaders;
};

export const getClientServices = client_key => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'GET',
    headers: authHeaders
    //mode: 'cors',
    //cache: 'default'
  };
  return fetch(`${env.API_BASE}/api/client/services`, opts);
};

export const getClientGateways = client_key => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'GET',
    headers: authHeaders
    //mode: 'cors',
    //cache: 'default'
  };
  return fetch(`${env.API_BASE}/api/client/gateways`, opts);
};

export const createClientGateway = (client_key, operator) => {
  const authHeaders = getClientAuthHeaders(client_key);
  const data = JSON.stringify({
    sms_center: operator,
    name: `${operator}_gateway`
  });
  let opts = {
    method: 'POST',
    headers: authHeaders,
    body: data
  };
  return fetch(`${env.API_BASE}/api/client/gateway`, opts);
};

export const createService = (client_key, data) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(data)
  };
  return fetch(`${env.API_BASE}/api/client/service`, opts);
};

export const deactivateService = (client_key, data) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'DELETE',
    headers: authHeaders,
    body: JSON.stringify({ name: data.name })
  };
  return fetch(`${env.API_BASE}/api/client/service/deactivate`, opts);
};

export const activateService = (client_key, data) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ name: data.name })
  };
  return fetch(`${env.API_BASE}/api/client/service/activate`, opts);
};

export const ftpServicePing = (ftp_key, data) => {
  let opts = {
    method: 'GET'
  };
  return fetch(`${env.FTP_BASE}/ping?access_token=${ftp_key}`, opts);
};

export const ftpServiceLive = (ftp_key, overall) => {
  let opts = {
    method: 'GET'
  };
  const postfix =
    overall === true ? '&start_date=2017-01-01&end_date=2040-01-01' : '';
  return fetch(
    `${
      env.FTP_BASE
    }/query/service_aggreg_info?access_token=${ftp_key}${postfix}`,
    opts
  );
};

export const getCode51Services = () => {
  let authHeaders = new Headers();
  authHeaders.set('Content-Type', 'application/json');
  authHeaders.append('X-Auth-Token', env.CODE51_TOKEN);

  let opts = {
    method: 'GET',
    headers: authHeaders
  };
  return fetch(`${env.CODE51_BASE}/subscription/list_all_services`, opts);
};

export const getClients = client_key => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'GET',
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/admin/list_clients`, opts);
};

export const createClient = (client_key, data) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      ...data,
      sender: `${env.company} ${env.product}`
    })
  };
  return fetch(`${env.API_BASE}/api/admin/create_client`, opts);
};

export const renewClientKey = (client_key, email) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      email: email,
      sender: `${env.company} ${env.product}`
    })
  };
  return fetch(`${env.API_BASE}/api/admin/renew_client_key`, opts);
};

export const getSubscribersCount = (client_key, sname) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'GET',
    headers: authHeaders
  };
  return fetch(
    `${env.API_BASE}/api/client/subscribers?service=${sname}&limit=0&offset=0`,
    opts
  );
};

export const activateClient = (client_key, email) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email: email,
      sender: `${env.company} ${env.product}`
    })
  };
  return fetch(`${env.API_BASE}/api/admin/activate`, opts);
};

export const deactivateClient = (client_key, email) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'DELETE',
    headers: authHeaders,
    body: JSON.stringify({
      email: email,
      sender: `${env.company} ${env.product}`
    })
  };
  return fetch(`${env.API_BASE}/api/admin/deactivate`, opts);
};

export const getServiceApps = client_key => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'GET',
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/client/apps`, opts);
};

export const testService = (client_key, uuid) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'POST',
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/client/service_test/${uuid}`, opts);
};

export const createApp = (client_key, name, service, mo_url) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'POST',
    body: JSON.stringify({ name: name, service: service, mo_url: mo_url }),
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/client/app`, opts);
};

export const updateApp = (client_key, appdata) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'PATCH',
    body: JSON.stringify(appdata),
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/client/app`, opts);
};

export const ftpRenewalHistory = (ftp_key, msisdn, jst, jen) => {
  let opts = {
    method: 'POST',
    body: JSON.stringify({ user: msisdn })
  };
  return fetch(
    `${
      env.FTP_BASE
    }/query/user_renewal_history?access_token=${ftp_key}&start_date=${jst}&end_date=${jen}`,
    opts
  );
};

export const ftpGetChargingSubscribersCount = ftp_key => {
  let opts = {
    method: 'GET'
  };
  return fetch(
    `${
      env.FTP_BASE
    }/query/users_in_service?access_token=${ftp_key}&status=all&only_count=true`,
    opts
  );
};

export const getTemplates = client_key => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'GET',
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/client/templates`, opts);
};

export const updateTemplate = (client_key, t) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'PATCH',
    body: JSON.stringify(t),
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/client/template`, opts);
};

export const deleteTemplate = (client_key, name) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'DELETE',
    body: JSON.stringify({ name: name }),
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/client/template`, opts);
};

export const getReactions = (client_key, service) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'GET',
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/client/reactions/${service}`, opts);
};

export const updateReaction = (client_key, r) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'PATCH',
    body: JSON.stringify(r),
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/client/reaction`, opts);
};

export const deleteReaction = (client_key, name) => {
  const authHeaders = getClientAuthHeaders(client_key);
  let opts = {
    method: 'DELETE',
    body: JSON.stringify({ name: name }),
    headers: authHeaders
  };
  return fetch(`${env.API_BASE}/api/client/reaction`, opts);
};

export const getFTPAggregateReport = (ftp_key, sdate, edate) => {
  const url = `${
    env.FTP_BASE
  }/query/service_aggreg_detailed_info?access_token=${ftp_key}&start_date=${sdate}&end_date=${edate}`;

  let opts = {
    method: 'GET'
  };

  return fetch(url, opts);
};
