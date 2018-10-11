import React, { Component } from 'react'
import { env } from './config'
import { Image } from 'semantic-ui-react'

class Footer extends Component {
  render() {
    const fafan = atob('bW9jLmVtQGFuZW1kb3I=')
      .split('')
      .reverse()
      .join('')
    return (
      <footer style={{ marginTop: 20, clear: 'both' }}>
        <div style={{}}>
          <div
            style={{
              float: 'right',
              marginTop: 10,
              padding: 5,
              marginBottom: 10
            }}
          >
            <a
              href="/landing/what-is-red9?"
              target="_new"
              className="techstuff"
            >
              {' '}
              <Image src="/logo.png" size="mini" inline />{' '}
            </a>
            <a
              href="//www.postgresql.org/about/"
              target="_new"
              className="techstuff"
            >
              {' '}
              <Image src="/postgresql.png" size="mini" inline />{' '}
            </a>
            <a
              href="//wiki.illumos.org/display/illumos/ZFS"
              target="_new"
              className="techstuff"
            >
              {' '}
              <Image src="/zfs.png" size="mini" inline />{' '}
            </a>
            <a
              href="//www.erlang.org/about"
              target="_new"
              className="techstuff"
            >
              {' '}
              <Image src="/erlang.jpg" size="mini" inline />{' '}
            </a>
            <a
              href="//www.freebsd.org/about.html"
              target="_new"
              className="techstuff"
            >
              {' '}
              <Image src="/freebsd.png" size="mini" inline />{' '}
            </a>
          </div>

          <div style={{ padding: 20 }}>
            <Image src="/rashavas.png" avatar size="mini" />
            <small>
              &copy; 2018-Present |{' '}
              <a
                style={{ color: 'white' }}
                href={`mailto:${env.copyright_company_email}`}
              >
                {env.copyright_company}
              </a>{' '}
              &bull; Licensed to <b>{env.company}</b> with{' '}
              <i style={{ color: 'hotpink' }} className="fa fa-heart" />
              <br />
              <span style={{ marginLeft: 32 }}>
                {' '}
                &nbsp; Proudly <b>MADE IN IRAN</b>
              </span>
              <br />
              <span style={{ opacity: 0.5, marginLeft: 32 }}>
                {' '}
                &nbsp; /Designed and developed by
                <a style={{ fontWeight: 400 }} href={`mailto:${fafan}`}>
                  {' '}
                  {atob(env.author)}
                </a>
                /{' '}
              </span>
            </small>
          </div>
          <br />
          <div />
          <ul>
            <li style={{ display: 'inline-block' }}>
              <a href="//docs.red9.ir">API documentation</a>
            </li>
            {' / '}
            <li style={{ display: 'inline-block' }}>
              <a href="//status.red9.ir">Service Status</a>
            </li>
            {' / '}
            <li style={{ display: 'inline-block' }}>
              <a href="//tech.red9.ir/smart-charging/whitepaper.txt">
                Smart Charging White Paper
              </a>
            </li>
            {'  / '}
          </ul>
        </div>
      </footer>
    )
  }
}

export default Footer
