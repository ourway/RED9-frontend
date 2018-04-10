import React, { Component } from 'react';

import { Image } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <Image src="/to-go-cup.png" size="small" centered />
        <h2>Hey Friend :-)</h2>
        <Link to="/services">
          <h3>Start here</h3>
        </Link>
      </div>
    );
  }
}

export default Home;
