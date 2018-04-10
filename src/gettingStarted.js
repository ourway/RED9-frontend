import React, { Component } from 'react';
import { titleChangeSignal } from './utils';
import Gist from 'react-gist';
import { Segment } from 'semantic-ui-react';

class GettingStarted extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    titleChangeSignal.next('Getting Started Guide');
  }

  componentWillUnmount() {}

  render() {
    return (
      <Segment size="big">
        <Gist id="39b8a3277f99a78fdcb348ef3366b759" />
      </Segment>
    );
  }
}

export default GettingStarted;
