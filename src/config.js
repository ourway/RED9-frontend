import { detect } from 'detect-browser'

export const browser =
  detect() !== null ? detect() : { os: 'N/A', name: 'Unknown' }

const mode = 'rashavas'
const servermode = 'production' // or production

const sabaidea_env = {
  company: 'SabaIdea',
  monitor: 'https://status.red9.ir',
  company_email: 'info@sabaidea.com',
  company_contact_gsm: '9120228207',
  product: 'Telecom SDP',
  product_color: '#002121',
  API_BASE: 'https://aparat.red9.ir',
  SELF_IP: 'http://10.20.97.21',
  SELF_PORT: 6051,
  IMI_PORT: 8090,
  FTP_BASE: 'https://aparat.red9.ir/imi_ftp/v1',
  CODE51_BASE: 'https://aparat.red9.ir/code51',
  CODE51_TOKEN: 'aa71ee01',
  product_version: '0.7.6 / 25 Aug 2018',
  codename: 'Heavy Hurricane',
  logo: 'sabaidea',
  author: 'RmFyc2hlZWQgQXNob3VyaQ==',
  copyright_logo: 'rashavas.logo',
  copyright_company: "Tose'e Ide'e Rasha Co",
  copyright_company_email: 'info@rashavas.com',
  bug_report_email:
    'incoming+farsheed.ashouri/red9+9fbwb77rlvdgnfpbiyi114yh8@gitlab.com',
  colorset: [
    '#002046',
    '#210f0f',
    '#362156',
    '#111111',
    '#091508',
    '#1e0c21',
    '#1d0b27',
    '#232221',
    '#270d18'
  ]
}

const rashavas_env = {
  company: 'Rashavas ',
  monitor: 'https://status.red9.ir',
  company_email: 'ashouri@rashavas.com',
  company_contact_gsm: '9120228207',
  product: 'RED9',
  product_color: '#00182f',
  API_BASE:
    servermode === 'local' ? 'http://localhost:6051' : 'https://red9.ir',
  SELF_IP: 'http://10.20.197.211',
  SELF_PORT: 6051,
  IMI_PORT: 8090,
  FTP_BASE: 'https://ftp.red9.ir/imi_ftp/v1',
  CODE51_BASE: 'https://api.appido.ir/code51',
  CODE51_TOKEN: 'aa71ee01',
  product_version: '0.7.9 / 12 DEC 2018',
  codename: 'Sentinel Wolf',
  logo: 'red9',
  author: 'RmFyc2hlZWQgQXNob3VyaQ==',
  copyright_logo: 'rashavas.logo',
  copyright_company: "Tose'e Ide'e Rasha Co",
  copyright_company_email: 'info@rashavas.com',
  bug_report_email:
    'incoming+farsheed.ashouri/red9+9fbwb77rlvdgnfpbiyi114yh8@gitlab.com',
  colorset: [
    '#002046',
    '#210f0f',
    '#111111',
    '#091508',
    '#1e0c21',
    '#362156',
    '#1d0b27',
    '#232221',
    '#270d18'
  ]
}

const wat_env = {
  company: 'Group Co Ltd. ',
  company_email: 'info@watgroup.am',
  company_contact_gsm: '9120228207',
  product: 'SDP',
  product_color: '#002121',
  API_BASE: 'https://red9.ir',
  SELF_IP: 'http://10.20.197.211',
  SELF_PORT: 6051,
  IMI_PORT: 8090,
  FTP_BASE: 'https://ftp.red9.ir/imi_ftp/v1',
  CODE51_BASE: 'https://api.appido.ir/code51',
  CODE51_TOKEN: 'aa71ee01',
  product_version: '0.6.4 / 28 Jun 2018',
  codename: 'Brown Bandit',
  logo: 'wat',
  author: 'RmFyc2hlZWQgQXNob3VyaQ==',
  copyright_logo: 'rashavas.logo',
  copyright_company: "Tose'e Ide'e Rasha Co",
  copyright_company_email: 'info@rashavas.com',
  bug_report_email:
    'incoming+farsheed.ashouri/red9+9fbwb77rlvdgnfpbiyi114yh8@gitlab.com',
  colorset: [
    '#002046',
    '#210f0f',
    '#111111',
    '#091508',
    '#1e0c21',
    '#362156',
    '#1d0b27',
    '#232221',
    '#270d18'
  ]
}


const noor_env = {
  company: 'Noor',
  monitor: 'https://status.red9.ir',
  company_email: 'info@crcis.ir',
  company_contact_gsm: '9122035840',
  product: 'VAS SDP',
  product_color: '#002121',
  API_BASE: 'https://noor.red9.ir',
  SELF_IP: 'http://10.20.0.0',
  SELF_PORT: 6051,
  IMI_PORT: 8090,
  FTP_BASE: 'https://noor.red9.ir/imi_ftp/v1',
  CODE51_BASE: 'https://noor.red9.ir/code51',
  CODE51_TOKEN: 'aa71ee01',
  product_version: '0.6.4 / 28 Jun 2018',
  codename: 'Brown Bandit',
  logo: 'noor',
  author: 'RmFyc2hlZWQgQXNob3VyaQ==',
  copyright_logo: 'rashavas.logo',
  copyright_company: "Tose'e Ide'e Rasha Co",
  copyright_company_email: 'info@rashavas.com',
  bug_report_email:
    'incoming+farsheed.ashouri/red9+9fbwb77rlvdgnfpbiyi114yh8@gitlab.com',
  colorset: [
    '#002046',
    '#210f0f',
    '#111111',
    '#091508',
    '#1e0c21',
    '#362156',
    '#1d0b27',
    '#232221',
    '#270d18'
  ]
}



export const env = eval(`${mode}_env`)
