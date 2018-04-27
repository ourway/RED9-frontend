import { detect } from 'detect-browser';

export const browser =
  detect() !== null ? detect() : { os: 'N/A', name: 'Unknown' };

export const env = {
  company: 'SabaIdea',
  company_email: 'my.samimi@gmail.com',
  company_contact_gsm: '9124056673',
  product: 'VAS Platform',
  API_BASE: 'https://aparat.red9.ir',
  SELF_IP: 'http://10.20.97.21',
  SELF_PORT: 6051,
  IMI_PORT: 8090,
  FTP_BASE: 'https://aparat.red9.ir/imi_ftp/v1',
  CODE51_BASE: 'https://aparat.red9.ir/code51',
  CODE51_TOKEN: 'aa71ee01',
  product_version: '0.5.5 / 27 April 2018',
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
    '#111111',
    '#091508',
    '#1e0c21',
    '#1d0b27',
    '#232221',
    '#270d18'
  ]
};
