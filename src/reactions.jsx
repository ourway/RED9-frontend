import React, { Component } from 'react'
import swal from 'sweetalert2'

import { Subject } from 'rxjs'
import { distinctUntilChanged, debounceTime } from 'rxjs/operators'

import store from 'store'
import {
  Dropdown,
  Table,
  Divider,
  Menu,
  Message,
  Icon,
  Input,
  Button,
  Segment
} from 'semantic-ui-react'

import { titleChangeSignal } from './utils'
import {
  getReactions,
  createReaction,
  updateReaction,
  getServiceApps,
  deleteReaction,
  getTemplates
} from './apis'

import {
  Dialog,
  DialogType,
  DialogFooter
} from 'office-ui-fabric-react/lib/Dialog'
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import { Dropdown as MSDropdown } from 'office-ui-fabric-react/lib/Dropdown'

const filter$ = new Subject()

class Reactions extends Component {
  constructor(props) {
    super(props)
    this.state = {
      reactions: [],
      apps: [],
      service: {},
      digits_reaction: `^[\\d]{1}$`,
      templates: [],
      is_add_dialog_hidden: true,
      original_reactions: [],
      ref_reactions: [],
      is_fetching: false,
      filter: '',

      attrDialogOps: {
        is_hidden: true,
        data: {
          webhook: '',
          trigger_if_subscribed: true,
          trigger_if_not_subscribed: true,
          template: '',
          targets: {
            keys: ['']
          },
          slackid: null,
          slack_message: null,
          previous_reaction_not: null,
          previous_reaction: null,
          name: '',
          mute: false,
          is_optout: false,
          is_optin: false,
          is_active: true,
          exceptions: null,
          app: ''
        }
      }
    }
    this._getReactions = this._getReactions.bind(this)
  }

  _getReactions = name => {
    this.setState({ is_fetching: true })
    const uuidKey = store.get('uuid')
    getReactions(atob(uuidKey), name).then(resp => {
      if (resp.status === 200) {
        resp
          .json()
          .then(data => {
            this.setState({
              reactions: data.reactions,
              original_reactions: data.reactions,
              ref_reactions: data.reactions,
              is_fetching: false
            })
          })
          .then(() => {
            getTemplates(atob(uuidKey)).then(resp => {
              if (resp.status === 200) {
                resp.json().then(data => {
                  const temps = data.templates.map((t, i) => {
                    return { text: t.name, key: t.name, value: t.name }
                  })
                  this.setState({ templates: temps })
                })
              }
            })
          })
      }
    })
  }

  doGetApps = service => {
    const uuidKey = store.get('uuid')
    getServiceApps(atob(uuidKey)).then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          const apps = data.apps
            .filter(a => {
              return a.service === service.name && a.is_active === true
            })
            .map(a => {
              return { key: a.name, text: a.name }
            })

          this.setState({
            apps: apps
          })
        })
      }
    })
  }

  sendFilterSignal = (o, v) => {
    filter$.next(v.value)
    this.setState({ filter: v.value })
  }

  _handleDeleteReaction = t => {
    const uuidKey = store.get('uuid')
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
          })
          //.then(() => {
          //  this._getReactions();
          //});

          break
        default:
          swal({
            position: 'center',
            type: 'success',
            title: 'Done',
            text: `The removal process was seccessful`,
            showConfirmButton: true,
            timer: 1000
          }).then(() => {
            this._getReactions(this.state.service.name)
          })

          break
      }
    })
  }

  _handleBodyChange = (o, v, i, t) => {
    const val = v.value
    let newList = [
      ...this.state.reactions.slice(0, i),
      { ...t, body: val },
      ...this.state.reactions.slice(i + 1)
    ]
    this.setState({ reactions: newList })
  }

  _handleUpdateReaction = (t, i) => {
    this.setState({ is_fetching: true })
    const uuidKey = store.get('uuid')
    updateReaction(atob(uuidKey), t)
      .then(resp => {
        if (resp.status === 202) {
          const val = t.body
          let newList = [
            ...this.state.original_reactions.slice(0, i),
            { ...t, body: val },
            ...this.state.original_reactions.slice(i + 1)
          ]
          this.setState({
            original_reactions: newList,
            ref_reactions: newList
          })
        }
      })
      .then(() => {
        this.setState({ is_fetching: false })
      })
  }

  _handleTemplateChange = (t, i, o, v) => {
    const val = v.value
    let newList = [
      ...this.state.reactions.slice(0, i),
      { ...t, template: val },
      ...this.state.reactions.slice(i + 1)
    ]
    this.setState({ reactions: newList })
  }

  componentDidMount() {
    if (store.get('service')) {
      const service = store.get('service')
      this.setState({ service: service })
      this._getReactions(service.name)
      this.doGetApps(service)

      titleChangeSignal.next(`${service.name} reactions`)
    }

    this.filterSubscribe = filter$
      .pipe(
        distinctUntilChanged(),
        debounceTime(500)
      )
      .subscribe(v => {
        const newList = this.state.ref_reactions.filter(t => {
          return this.state.filter === ''
            ? true
            : t.name
                .toLowerCase()
                .trim()
                .match(RegExp(this.state.filter)) !== null
        })
        this.setState({
          filter: v,
          reactions: newList,
          original_reactions: newList
        })
      })
  }

  componentWillUnmount() {
    this.filterSubscribe.unsubscribe()
  }

  _changeTargetKey = (t, ki, i, o, v) => {
    const newReactionData = {
      ...t,
      targets: {
        ...t.targets,
        keys: [
          ...t.targets.keys.slice(0, ki),
          v.value,
          ...t.targets.keys.slice(ki + 1)
        ]
      }
    }

    let newList = [
      ...this.state.reactions.slice(0, i),
      newReactionData,
      ...this.state.reactions.slice(i + 1)
    ]
    this.setState({ reactions: newList })
  }

  _toggleReactionMute = (r, i) => {
    const newReactionData = { ...r, mute: !r.mute }
    let newList = [
      ...this.state.reactions.slice(0, i),
      newReactionData,
      ...this.state.reactions.slice(i + 1)
    ]
    this.setState({ reactions: newList })
  }

  _toggleReactionDeactivate = (r, i) => {
    const newReactionData = { ...r, is_active: !r.is_active }
    let newList = [
      ...this.state.reactions.slice(0, i),
      newReactionData,
      ...this.state.reactions.slice(i + 1)
    ]
    this.setState({ reactions: newList })
  }

  _toggleRegisterUsersOnly = (r, i) => {
    const newReactionData = {
      ...r,
      trigger_if_subscribed: !r.trigger_if_subscribed
    }
    let newList = [
      ...this.state.reactions.slice(0, i),
      newReactionData,
      ...this.state.reactions.slice(i + 1)
    ]
    this.setState({ reactions: newList })
  }

  _toggleUnregisterUsersOnly = (r, i) => {
    const newReactionData = {
      ...r,
      trigger_if_not_subscribed: !r.trigger_if_not_subscribed
    }
    let newList = [
      ...this.state.reactions.slice(0, i),
      newReactionData,
      ...this.state.reactions.slice(i + 1)
    ]
    this.setState({ reactions: newList })
  }

  _toggleSubscribe = (r, i) => {
    const newReactionData = { ...r, is_optin: !r.is_optin }
    let newList = [
      ...this.state.reactions.slice(0, i),
      newReactionData,
      ...this.state.reactions.slice(i + 1)
    ]
    this.setState({ reactions: newList })
  }

  _toggleUnsubscribe = (r, i) => {
    const newReactionData = { ...r, is_optout: !r.is_optout }
    let newList = [
      ...this.state.reactions.slice(0, i),
      newReactionData,
      ...this.state.reactions.slice(i + 1)
    ]
    this.setState({ reactions: newList })
  }

  openAddDialog = () => {
    this.setState({ is_add_dialog_hidden: false })
  }

  closeAddDialog = () => {
    this.setState({ is_add_dialog_hidden: true })
  }

  _newReactionAppChanged = v => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        data: { ...this.state.attrDialogOps.data, app: v.key }
      }
    })
  }

  _newReactionNameChanged = v => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        data: { ...this.state.attrDialogOps.data, name: v }
      }
    })
  }

  _newReactionWebhookChanged = v => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        data: { ...this.state.attrDialogOps.data, webhook: v }
      }
    })
  }

  _newReactionTemplateChanged = v => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        data: { ...this.state.attrDialogOps.data, template: v.key }
      }
    })
  }

  _newReactionRegexChanged = v => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        data: { ...this.state.attrDialogOps.data, targets: { keys: [v] } }
      }
    })
  }

  doCreateNewReaction = () => {
    const uuidKey = store.get('uuid')
    createReaction(atob(uuidKey), this.state.attrDialogOps.data).then(resp => {
      if (resp.status === 201) {
        this.closeAddDialog()
        swal({
          position: 'center',
          type: 'success',
          title: 'Congrats!',
          text: `Your new reaction is online`,
          showConfirmButton: false,
          timer: 2000
        }).then(() => {
          this._getReactions(this.state.service.name)
        })
      }
    })
  }

  render() {
    return (
      <div>
        <Segment inverted loading={this.state.is_fetching === true}>
          <Menu attached="top" inverted style={{ backgroundColor: '#212931' }}>
            <Menu.Menu position="right">
              <Menu.Item
                icon="add"
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

          <Table structured inverted singleLine size="small" stackable={true}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width={1}>Reaction name</Table.HeaderCell>
                <Table.HeaderCell width={3}>Target(s) regex</Table.HeaderCell>
                <Table.HeaderCell width={1}>Active/Mute</Table.HeaderCell>
                <Table.HeaderCell width={1}>Conditions</Table.HeaderCell>
                <Table.HeaderCell width={1}>Triggers</Table.HeaderCell>
                <Table.HeaderCell width={3}>Webhook</Table.HeaderCell>
                <Table.HeaderCell width={2}>Template</Table.HeaderCell>
                {/*
              <Table.HeaderCell width={2}>SlackID</Table.HeaderCell>
              <Table.HeaderCell width={2}>Slack Message</Table.HeaderCell>
                */}
                <Table.HeaderCell width={2}>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {this.state.reactions.map((t, i) => {
                return (
                  <Table.Row key={t.name} className="formRow">
                    <Table.Cell>
                      <code> {t.name} </code>
                    </Table.Cell>
                    <Table.Cell>
                      {t.targets.keys.map((k, ki) => {
                        return (
                          <li key={ki} style={{ listStyle: 'none' }}>
                            <Input
                              fluid
                              onChange={(o, v) =>
                                this._changeTargetKey(t, ki, i, o, v)
                              }
                              style={{
                                borderBottom: `1px dashed ${
                                  this.state.original_reactions[i].targets.keys[
                                    ki
                                  ] === k
                                    ? '#555'
                                    : 'hotpink'
                                }`,
                                marginTop: 5
                              }}
                              inverted
                              icon="keyboard"
                              type="text"
                              iconPosition="left"
                              transparent
                              placeholder="Target Regex"
                              value={k}
                            />
                          </li>
                        )
                      })}
                    </Table.Cell>

                    <Table.Cell>
                      <a onClick={() => this._toggleReactionDeactivate(t, i)}>
                        {t.is_active === true ? (
                          <Icon name="check square" color="green" />
                        ) : (
                          <Icon name="square outline" color="grey" />
                        )}
                      </a>
                      <a onClick={() => this._toggleReactionMute(t, i)}>
                        {t.mute === false ? (
                          <Icon name="circle outline" color="green" />
                        ) : (
                          <Icon name="check square" color="yellow" />
                        )}
                      </a>
                    </Table.Cell>

                    <Table.Cell>
                      <a
                        style={{ cursor: 'pointer' }}
                        onClick={() => this._toggleRegisterUsersOnly(t, i)}
                      >
                        <Icon
                          name="compress"
                          color={
                            t.trigger_if_subscribed === true ? 'orange' : 'grey'
                          }
                        />
                        <small
                          color={
                            t.trigger_if_subscribed === true
                              ? 'lightgrey'
                              : 'grey'
                          }
                        >
                          For subs
                        </small>
                      </a>
                      <br />
                      <a
                        style={{ cursor: 'pointer' }}
                        onClick={() => this._toggleUnregisterUsersOnly(t, i)}
                      >
                        <Icon
                          name="expand"
                          color={
                            t.trigger_if_not_subscribed === true
                              ? 'orange'
                              : 'grey'
                          }
                        />
                        <small
                          color={
                            t.trigger_if_not_subscribed === true
                              ? 'lightgrey'
                              : 'grey'
                          }
                        >
                          For unsubs
                        </small>
                      </a>
                    </Table.Cell>

                    <Table.Cell>
                      <a
                        style={{ cursor: 'pointer' }}
                        onClick={() => this._toggleSubscribe(t, i)}
                      >
                        <Icon
                          name="add user"
                          color={t.is_optin === true ? 'orange' : 'grey'}
                        />

                        <small
                          color={t.is_optin === true ? 'lightgrey' : 'grey'}
                        >
                          Sub
                        </small>
                      </a>
                      <br />
                      <a
                        style={{ cursor: 'pointer' }}
                        onClick={() => this._toggleUnsubscribe(t, i)}
                      >
                        <Icon
                          name="remove user"
                          color={t.is_optout === true ? 'orange' : 'grey'}
                        />
                        <small>Uns</small>
                      </a>
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
                        value={t.webhook || ''}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown
                        search
                        value={t.template}
                        selection
                        style={{ backgroundColor: 'transparent' }}
                        wrapSelection={false}
                        onChange={(o, v) =>
                          this._handleTemplateChange(t, i, o, v)
                        }
                        options={this.state.templates}
                        placeholder="Choose a template"
                      />
                    </Table.Cell>
                    {/*
                  <Table.Cell collapsing>
                    <Input
                      fluid
                      inverted
                      icon="slack"
                      type="text"
                      iconPosition="left"
                      transparent
                      placeholder="Slack id"
                      value={t.slackid || ''}
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
                      value={t.slack_message || ''}
                    />
                  </Table.Cell>
                  */}
                    <Table.Cell>
                      <div style={{ minHeight: 32 }}>
                        <Button
                          className="deleteButton"
                          onClick={() => this._handleDeleteReaction(t, i)}
                          circular
                          secondary
                          floated="right"
                          icon="remove"
                          size="mini"
                        />

                        {JSON.stringify(this.state.original_reactions[i]) !==
                        JSON.stringify(t) ? (
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
                )
              })}
            </Table.Body>
          </Table>

          <Divider />
        </Segment>

        <Segment style={{ marginBottom: 64 }} inverted>
          <Message color="black" attached="bottom">
            <Message.Header>
              <h1>
                <Icon name="lightbulb" color="yellow" />
                Guidelines
              </h1>
              <small>Please read carefully before using reactions</small>
            </Message.Header>
            <h3>What are reactions?</h3>
            <p>
              <b>
                Reactions are basicly automatic SDP response to user MO
                messages.
              </b>
              After system receives a MO, SDP will going to match the message
              with a pre defined reation and if all conditions are true, will
              response to user with a MT or will call a callback HTTP post.
            </p>

            <p>
              When you create a new service, SDP will create <b>4</b> default
              reactions for your service:
            </p>
            <ol>
              <li>
                <b>Default</b> Reaction:
                <br />
                <p>
                  It's a default reaction that will response to all MO messages
                  except 1 digit MOs (<code>{this.state.digits_reaction}</code>
                  ). The target key for default reaction is <code>default</code>
                  . You can disactive or mute it in panel or via API.
                </p>
              </li>
              <br />

              <li>
                <b>Digits Ignore</b> Reaction:
                <br />
                <p>
                  This reaction is a <u>mute</u> reaction. Means that when it
                  triggers, It does not send any MT to user, effectivly acts as
                  a mute actor.
                </p>
                <p>
                  The target regex key for this reaction is
                  <code>{this.state.digits_reaction}</code>.
                </p>
              </li>
              <br />
              <li>
                <b>SMS Subscription</b> Reaction:
                <br />
                <p>
                  When a SMS based subscription notification comes from
                  operator, SDP will trigger a reaction with
                  <code>{`^sms$`}</code> target key (is available).
                </p>
              </li>
              <br />
              <li>
                <b>OTP Subscription</b> Reaction:
                <br />
                <p>
                  When an OTP based subscription notification comes from
                  operator, SDP will trigger a reaction with
                  <code>{`^otp$`}</code> target key (is available).
                </p>
              </li>
            </ol>
            <h3>Use cases</h3>
            <p>
              Imagine you have a service and you need to send a token to user
              based on his subscription status when user sends you a 4 digit
              number starting with 2. Instead of creating your own server, you
              just need to implement your token generation API. The rest is
              reaction's responsibility. Here is one way: (There are other ways,
              for example using templates URL mothod)
            </p>
            <ol>
              <li>
                Create a template named <u>token_template</u>. The body must be{' '}
                <code>Your token is {`<%= message %>`}</code>.
              </li>
              <li>
                Create a reaction named <u>token_reaction</u>.<b>Template</b>{' '}
                must be null and the <b>target key</b> must be{' '}
                <code>{`^1[\\d]{3}`}</code>. The <b>webhook</b> must be your
                token API endpoint.
              </li>
              <li>
                <p>
                  Since SDP will automaticly call your webhook, You need to get
                  user info from SDP http post and send a message. Message
                  template name must be <u>token_template</u> and message
                  variable must be the token you need to send. Of cource
                  national number and country code must be the ones SDP just has
                  sent you.
                </p>
              </li>
            </ol>
            <h3>Basic Usage</h3>
            <p>
              For using a reaction, you need either a webhook callback, or a
              template and target keys regex. Best way to test your regex is a
              free online service like{' '}
              <a href="https://www.regextester.com/" target="_new">
                regextester
              </a>
              .
            </p>
            <h3>API docs</h3>
            <p>
              Please visit reactions API docs{' '}
              <a
                title="Reactions API docs"
                target="new"
                href="https://docs.red9.ir/#3f7837ab-41ae-6def-3222-879f233e6273"
              >
                here
              </a>
            </p>
          </Message>
        </Segment>

        <Dialog
          hidden={this.state.is_add_dialog_hidden}
          onDismiss={this.closeAddDialog}
          dialogContentProps={{
            type: DialogType.largeHeader,
            title: 'New Reaction',
            subText: (
              <span>
                A new reaction responds to user MO messages. New reaction will
                be created in deactivated mode. You can complete the options and
                activate it later.
              </span>
            )
          }}
          modalProps={{
            titleAriaId: 'myLabelId',
            subtitleAriaId: 'mySubTextId',
            isBlocking: false,
            containerClassName: 'ms-dialogMainOverride'
          }}
        >
          {
            null /** You can also include null values as the result of conditionals */
          }

          <MSDropdown
            placeHolder="Select an application"
            label="Reaction Application:"
            onChange={this._newReactionAppChanged}
            id="Basicdrop1"
            required={true}
            options={this.state.apps}
          />

          <TextField
            key="nameField"
            type="text"
            label="Reaction Name"
            borderless
            onChange={this._newReactionNameChanged}
            value={this.state.attrDialogOps.data.name}
            title="Enter new reaction name"
            placeholder="my_reaction_1"
            required={true}
          />

          <MSDropdown
            placeHolder="Select a Template"
            label="Reaction Template:"
            onChange={this._newReactionTemplateChanged}
            id="Basicdrop122"
            required={false}
            options={this.state.templates}
          />

          <TextField
            key="moField"
            type="text"
            label="Target Regex"
            borderless
            onChange={this._newReactionRegexChanged}
            value={this.state.attrDialogOps.data.targets.keys[0]}
            title="Enter a valid Regex"
            placeholder="Enter a valid Regex. ex: [\w\d]* "
            required={true}
          />

          <TextField
            key="moField2"
            type="url"
            label="Callback Webhook"
            borderless
            onChange={this._newReactionWebhookChanged}
            value={this.state.attrDialogOps.data.webhook}
            title="Enter a valid url"
            placeholder="https://www.example.org/red9/callbacks"
            required={false}
          />

          <DialogFooter>
            <PrimaryButton
              disabled={
                this.state.attrDialogOps.data.targets.keys[0] === '' ||
                this.state.attrDialogOps.data.name === '' ||
                this.state.attrDialogOps.data.app === ''
              }
              onClick={this.doCreateNewReaction}
              text="Create"
            />
            <DefaultButton onClick={this.closeAddDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>
      </div>
    )
  }
}

export default Reactions
