import React, { Component } from 'react';

import { Card, Icon } from 'semantic-ui-react';
import { titleChangeSignal } from './utils';

const extra = (
  <a className="dark" href="/getting-started" target="_new">
    <Icon name="help" />
    Need Help? Read the docs
  </a>
);

class NotFound extends Component {
  componentDidMount() {
    titleChangeSignal.next('406 / Not Supported');
  }

  render() {
    return (
      <div>
        <div>
          <Card
            style={{
              padding: 20,
              textAlign: 'center',
              width: '100%',
              fontWeight: 400
            }}
            header="404 / The requested page is not here"
            description="Double check the URL and try again.  It might be a temprary problem"
            extra={extra}
          />
        </div>
      </div>
    );
  }
}

export default NotFound;
