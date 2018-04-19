import React, { Component } from 'react';
import swal from 'sweetalert2';
import Rx from 'rxjs/Rx';
import store from 'store';
import {
  Table,
  Menu,
  Icon,
  Input,
  TextArea,
  Button,
  Segment
} from 'semantic-ui-react';

import { titleChangeSignal } from './utils';
import { getReactions, updateReaction, deleteReaction } from './apis';

const filter$ = new Rx.Subject();

class Reactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      reactions: [],
      original_reactions: [],
      ref_reactions: [],
      is_fetching: false,
      filter: ''
    };
    this._getReactions = this._getReactions.bind(this);
  }

  _getReactions = name => {
    this.setState({ is_fetching: true });
    const uuidKey = store.get('uuid');
    getReactions(atob(uuidKey), name).then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          this.setState({
            reactions: data.reactions,
            original_reactions: data.reactions,
            ref_reactions: data.reactions,
            is_fetching: false
          });
        });
      }
    });
  };

  sendFilterSignal = (o, v) => {
    filter$.next(v.value);
    this.setState({ filter: v.value });
  };

  _handleDeleteReaction = t => {
    const uuidKey = store.get('uuid');
    deleteReaction(atob(uuidKey), t.name).then(resp => {
      switch (resp.status) {
        case 500:
          swal({
            position: 'center',
            type: 'error',
            title: 'Opps',
            text: `Seems Reaction is not removable (May be you have used this)`,
            showConfirmButton: true,
            timer: 5000
          });
          //.then(() => {
          //  this._getReactions();
          //});

          break;
        default:
          swal({
            position: 'center',
            type: 'success',
            title: 'Done',
            text: `The removal process was seccessful`,
            showConfirmButton: true,
            timer: 1000
          });
          //.then(() => {
          //this._getReactions();
          //});

          break;
      }
    });
  };

  _handleBodyChange = (o, v, i, t) => {
    const val = v.value;
    let newList = [
      ...this.state.reactions.slice(0, i),
      { ...t, body: val },
      ...this.state.reactions.slice(i + 1)
    ];
    this.setState({ reactions: newList });
  };

  _handleUpdateReaction = (t, i) => {
    this.setState({ is_fetching: true });
    const uuidKey = store.get('uuid');
    updateReaction(atob(uuidKey), t)
      .then(resp => {
        if (resp.status === 202) {
          const val = t.body;
          let newList = [
            ...this.state.original_reactions.slice(0, i),
            { ...t, body: val },
            ...this.state.original_reactions.slice(i + 1)
          ];
          this.setState({
            original_reactions: newList,
            ref_reactions: newList
          });
        }
      })
      .then(() => {
        this.setState({ is_fetching: false });
      });
  };

  componentDidMount() {
    if (store.get('service')) {
      const service = store.get('service');
      this._getReactions(service.name);
      titleChangeSignal.next(`${service.name} reactions`);
    }

    this.filterSubscribe = filter$

      .distinctUntilChanged()
      .debounceTime(500)

      .subscribe(v => {
        const newList = this.state.ref_reactions.filter(t => {
          return this.state.filter === ''
            ? true
            : t.name
                .toLowerCase()
                .trim()
                .match(RegExp(this.state.filter)) !== null ||
                t.body
                  .toLowerCase()
                  .trim()
                  .match(RegExp(this.state.filter)) !== null;
        });
        this.setState({
          filter: v,
          reactions: newList,
          original_reactions: newList
        });
      });
  }

  componentWillUnmount() {
    this.filterSubscribe.unsubscribe();
  }

  render() {
    return (
      <Segment inverted loading={this.state.is_fetching === true}>
        <Menu attached="top" inverted style={{ backgroundColor: '#212931' }}>
          <Menu.Menu position="right">
            <Menu.Item
              icon="add"
              disabled={true}
              title="Click to add a new reaction"
              name="Add a new reaction"
              onClick={this.openAddDialog}
            />

            <Menu.Item>
              <Input
                size="tiny"
                onChange={this.sendFilterSignal}
                value={this.state.filter}
                transparent
                type="search"
                inverted
                icon={{ name: 'filter' }}
                placeholder="Filter reactions ..."
              />
            </Menu.Item>
          </Menu.Menu>
        </Menu>

        <Table  basic inverted fixed  singleLine size="small" stackable={true}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={2}>Reaction name</Table.HeaderCell>
              <Table.HeaderCell width={3}>Target(s) regex</Table.HeaderCell>
              <Table.HeaderCell width={1}>Is active?</Table.HeaderCell>
              <Table.HeaderCell width={1}>Is mute?</Table.HeaderCell>
              <Table.HeaderCell width={1}>Conditions</Table.HeaderCell>
              <Table.HeaderCell width={1}>Triggers</Table.HeaderCell>
              <Table.HeaderCell width={2}>Webhook</Table.HeaderCell>
              <Table.HeaderCell width={2}>SlackID</Table.HeaderCell>
              <Table.HeaderCell width={2}>Slack Message</Table.HeaderCell>
              <Table.HeaderCell width={1}>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {this.state.reactions.map((t, i) => {
              return (
                  <Table.Row 
                      
                      key={t.name} className="formRow">
                  <Table.Cell>
                    <code> {t.name} </code>
                  </Table.Cell>
                  <Table.Cell >
                    <div>
                      {t.targets.keys.map((r, i) => {
                        return (
                            <li key={i} style={{listStyle: 'none'}}>

                    <Input
                      fluid
                      inverted
                      icon="keyboard"
                      type="text"
                      iconPosition="left"
                      transparent
                      placeholder="Target Regex"
                      value={r}
                    />





                            </li> 
                        )
                      })}
                  </div>
                  </Table.Cell>


                  <Table.Cell onClick={() => this.toggleReactionMute(t, i)}>
                    {t.is_active === false ? (
                      <Icon name="square outline" color="grey" />
                    ) : (
                      <Icon name="square checkmark" color="green" />
                    )}
                  </Table.Cell>

                  <Table.Cell onClick={() => this.toggleReactionMute(t, i)}>
                    {t.mute === false ? (
                      <Icon name="circle outline" color="green" />
                    ) : (
                      <Icon name="square checkmark" color="yellow" />
                    )}
                  </Table.Cell>
                  <Table.Cell>
                      Conds
                  </Table.Cell>


                  <Table.Cell>
                      Trigers
                  </Table.Cell>


                  <Table.Cell collapsing>
                    <Input
                      fluid
                      inverted
                      icon="inr"
                      type="url"
                      iconPosition="left"
                      transparent
                      placeholder="Callback webhook"
                      value=""
                    />
                  </Table.Cell>

                  <Table.Cell collapsing>
                    <Input
                      fluid
                      inverted
                      icon="slack"
                      type="text"
                      iconPosition="left"
                      transparent
                      placeholder="Slack Webhook"
                      value=""
                    />
                  </Table.Cell>



                  <Table.Cell collapsing>
                    <Input
                      fluid
                      inverted
                      icon="comment"
                      type="text"
                      iconPosition="left"
                      transparent
                      placeholder="Slack Message"
                      value=""
                    />
                  </Table.Cell>



                  <Table.Cell >
                      <div
                      
                      style={{minHeight: 32}}
                      >
                      <Button
                        className="deleteButton"
                        onClick={() => this._handleDeleteReaction(t, i)}
                        circular
                        secondary
                        floated="right"
                        icon="remove"
                        size="mini"
                      />

                      {this.state.original_reactions[i].body !== t.body ? (
                        <Button
                          onClick={() => this._handleUpdateReaction(t, i)}
                          circular
                          color="teal"
                          floated="left"
                          icon="save"
                          size="tiny"
                        />
                      ) : null}
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </Segment>
    );
  }
}

export default Reactions;
