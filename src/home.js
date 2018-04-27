import React, { Component } from 'react';

import { Image, List, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import store from 'store';
import { getClientServices } from './apis';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = { services: [] };
  }

  componentDidMount() {
    const uuidKey = store.get('uuid');
    if (uuidKey) {
      getClientServices(atob(uuidKey)).then(resp => {
        if (resp.status === 200) {
          resp.json().then(data => {
            this.setState({
              services: data.services
                .filter((s, i) => {
                  return s.meta.is_active === true;
                })
                .map((s, i) => {
                  return {
                    name: s.name,
                    uuid: s.meta.uuid,
                    short_code: s.short_code
                  };
                })
            });
          });
        }
      });
    }
  }

  componentWillUnmount() {}

  render() {
    return (
      <div style={{ margin: 'auto', padding: 25, textAlign: 'center' }}>
        <List
          selection
          horizontal
          relatex="very"
          style={{
            minHeight: 64,
            borderBottom: '1px solid grey',
            marginBottom: 5
          }}
        >
          {this.state.services.map((s, i) => {
            return (
              <List.Item key={s.uuid}>
                <Icon name="options" color="yellow" />{' '}
                <Link to={`/services/${s.uuid}`}>{s.name.toUpperCase()}</Link>
                <br />
                <small style={{ color: 'grey', float: 'left' }}>
                  {s.short_code}
                </small>
              </List.Item>
            );
          })}
        </List>
        <Image
          src="/to-go-cup.png"
          size="small"
          centered
          className="homePageGlass"
        />
        <h2>Hey Friend :-)</h2>
        <Link to="/services">
          <h3>Start here</h3>
        </Link>
      </div>
    );
  }
}

export default Home;
