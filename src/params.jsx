import { env } from './config'

export const serviceParams = [
  {
    name: 'name',
    type: 'string',
    placeholder: 'Name of service',
    editable: false,
    description:
      'An arbitrary uniqe service name.  The input is uniqe to your service',
    gateway: ['IMI', 'IRANCELL', 'MAGFA']
  },
  {
    name: 'short_code',
    type: 'number',
    editable: true,
    placeholder: '98xxx...',
    description: 'Service short code.',
    gateway: ['IMI', 'IRANCELL', 'MAGFA']
  },

  {
    name: 'service_key',
    type: 'text',
    editable: true,
    placeholder: 'Service Secret Key',
    description:
      '128 bit service key defind by operator. Example: 103bfg7523fapa9e740630b7914c52db',
    gateway: ['IMI']
  },

  {
    name: 'service_id',
    type: 'number',
    editable: true,
    placeholder: 'ID of service provided by provider',
    description: 'Service ID defind by operator.',
    gateway: ['IMI', 'IRANCELL', 'MAGFA']
  },

  {
    name: 'service_name',
    type: 'text',
    editable: true,
    placeholder: 'Official Service name',
    description: "It's the name of the service in operator sdp",
    gateway: ['IMI', 'IRANCELL', 'MAGFA']
  },

  {
    name: 'spid',
    type: 'text',
    editable: true,
    placeholder: 'Partner ID',
    description: 'Partner id',
    gateway: ['IRANCELL']
  },

  {
    name: 'service_name_fa',
    type: 'text',
    editable: true,
    placeholder: 'Service name in *PERSIAN*',
    description: 'Service name in Persian.',
    gateway: ['IMI', 'IRANCELL', 'MAGFA']
  },
  {
    name: 'unsubscribe_code',
    type: 'text',
    placeholder: 'TBLMTUSUB1000CTBLYMAN',
    editable: true,
    description: 'UnSubscription code needed by SDP OTP processes.',
    gateway: ['IMI']
  },
  {
    name: 'subscribe_code',
    type: 'text',
    placeholder: 'TBLMTSUB1000CTBLYMAN',
    editable: true,
    description: 'Subscription code needed by SDP OTP processes.',
    gateway: ['IMI']
  },
  {
    name: 'sub_url',
    type: 'url',
    placeholder: `https://myserver.net/${env.company}-${env.product}/unsub`,
    editable: true,
    description: 'A valid URL for posting subscription notifications.',
    gateway: ['IMI', 'IRANCELL']
  },

  {
    name: 'unsub_url',
    type: 'url',
    placeholder: `https://myserver.net/${env.company}-${env.product}/unsub`,
    editable: true,
    description: 'A valid URL for posting unsubscription notifications.',
    gateway: ['IMI', 'IRANCELL']
  },

  {
    name: 'auto_response',
    type: 'text',
    placeholder: `true or false`,
    editable: true,
    description:
      'Do you expect SDP to response to sub notifications automaticly?',
    gateway: ['IMI', 'IRANCELL']
  },

  {
    name: 'wappush',
    type: 'text',
    placeholder: `true or false`,
    editable: true,
    description: 'Is this service a WAP PUSH type service?',
    gateway: ['IMI', 'IRANCELL']
  },

  {
    name: 'renewal_url',
    type: 'url',
    placeholder: `https://myserver.net/${env.company}-${env.product}/renewal/<%=national_number%>`,
    editable: true,
    description:
      'A valid URL for posting unsubscription renewal notifications.',
    gateway: ['IMI', 'IRANCELL']
  },

  {
    name: 'max_daily_allowed_charge',
    type: 'number',
    placeholder: `400`,
    editable: true,
    description: 'Max amount that SDP is allowed to charge the user',
    gateway: ['IMI', 'IRANCELL']
  },

  {
    name: 'charge_codes',
    type: 'json',
    placeholder: '',
    editable: true,
    description: `Charge codes are required if you need in app purchases. 
                      These number are provided for you by operator or your aggregator.`,
    gateway: ['IMI']
  }
]
