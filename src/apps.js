import React, { Component } from 'react';
import store from 'store';
import { env } from './config';
import swal from 'sweetalert2';
import {
  Table,
  Icon,
  Menu,
  Input,
  Message,
  Radio,
  Divider
} from 'semantic-ui-react';
import { getServiceApps, createApp, updateApp } from './apis';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import Gist from 'react-gist';

import { redirectSignal, startLoading$, stopLoading$ } from './utils';

import {
  Dialog,
  DialogType,
  DialogFooter
} from 'office-ui-fabric-react/lib/Dialog';
import {
  PrimaryButton,
  DefaultButton
} from 'office-ui-fabric-react/lib/Button';

class Applications extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      apps: [],
      original_apps: [],
      activeApp: {},
      activeService: {},
      selected: { uuid: props.match.params.uuid },
      is_add_dialog_hidden: true,
      filter: '',
      attrDialogOps: {
        is_hidden: true,
        params: [
          {
            name: 'App Name',
            key: 'name',
            description: 'Application name',
            placeholder: 'mobile_developers_app',
            type: 'text'
          },
          {
            name: 'MO URL',
            key: 'mo_url',
            description: 'Callback URL',
            placeholder: 'https://ss2.ir/...',
            type: 'url'
          }
        ],
        data: {}
      }
    };
  }

  openAddDialog = () => {
    this.setState({ is_add_dialog_hidden: false });
  };

  closeAddDialog = () => {
    this.setState({ is_add_dialog_hidden: true });
  };

  doGetApps = () => {
    startLoading$.next(true);

    const uuidKey = store.get('uuid');
    getServiceApps(atob(uuidKey)).then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          const apps = data.apps.filter(a => {
            return a.service === this.state.activeService.name;
          });

          this.setState({
            apps: apps,
            original_apps: apps,
            selected: apps.filter(a => {
              return a.uuid === this.props.match.params.uuid;
            })[0] || { uuid: null }
          });
          stopLoading$.next(true);
        });
      }
    });
  };

  componentWillUnmount() {}

  componentDidMount() {
    this.doGetApps();
    const lss = store.get('service');
    if (lss) {
      const sd = lss;
      this.setState({ activeService: sd });
    }
  }

  handleFilterApps = (_, o) => {
    this.setState({ filter: o.value.toLowerCase().trim() });
  };

  doCreateNewApp = () => {
    const uuidKey = store.get('uuid');
    createApp(
      atob(uuidKey),
      this.state.attrDialogOps.data.name,
      this.state.activeService.name,
      this.state.attrDialogOps.data.mo_url
    ).then(resp => {
      if (resp.status === 201) {
        this.closeAddDialog();
        swal({
          position: 'center',
          type: 'success',
          title: 'Congrats!',
          text: `Your new application is ready to use`,
          showConfirmButton: false,
          timer: 2000
        }).then(() => {
          this.doGetApps();
        });
      }
    });
  };

  DialogValueChanged = (value, key) => {
    let data = {
      ...this.state.attrDialogOps.data,
      [key]: value
        .trim()
        .toString()
        .toLowerCase()
    };
    if (!value) {
      let raw_data = this.state.attrDialogOps.data;
      delete raw_data[key];
      data = raw_data;
    }

    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        data: data
      }
    });
  };

  goToLoginPage = ck => {
    redirectSignal.next(`/login/${ck}`);
  };

  toggleAppStatus = (app, index) => {
    const status = !app.is_active;
    const newAppData = { ...app, is_active: status };
    let newList = [
      ...this.state.apps.slice(0, index),
      newAppData,
      ...this.state.apps.slice(index + 1)
    ];

    this.handleAppUpdate(newAppData);
    this.setState({ apps: newList });
  };

  handleAppUpdate = app => {
    startLoading$.next(true);
    const uuidKey = store.get('uuid');
    updateApp(atob(uuidKey), app).then(resp => {
      if (resp.status === 202) {
        this.doGetApps();
      }
      stopLoading$.next(true);
    });
  };

  handleUrlUpdate = a => {
    this.handleAppUpdate(a);
  };

  handleUrlChange = (app, index, _, target) => {
    const val = target.value;
    let newList = [
      ...this.state.apps.slice(0, index),
      { ...app, mo_url: val },
      ...this.state.apps.slice(index + 1)
    ];
    this.setState({ apps: newList });
  };

  handleAppClick = app => {
    this.setState({
      selected: this.state.apps.filter(a => {
        return a.uuid === app.uuid;
      })[0]
    });
    redirectSignal.next(`/apps/${app.uuid}`);
  };

  render() {
    return (
      <div>
        <Menu attached="top" inverted style={{ backgroundColor: '#212931' }}>
          <Menu.Menu position="right">
            <Menu.Item
              icon="add"
              title="Click to add an application"
              name="Add an application"
              onClick={this.openAddDialog}
            />

            <Menu.Item>
              <Input
                size="tiny"
                onChange={this.handleFilterClients}
                value={this.state.filter}
                transparent
                type="search"
                inverted
                icon={{ name: 'filter' }}
                placeholder="Filter applications ..."
              />
            </Menu.Item>
          </Menu.Menu>
        </Menu>

        <Table inverted celled singleLine>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell width={2}>Name</Table.HeaderCell>
              <Table.HeaderCell width={1}>Status</Table.HeaderCell>
              <Table.HeaderCell width={7}>Callback (MO) URL</Table.HeaderCell>
              <Table.HeaderCell width={1}>
                Queued <br />
                <small>messages</small>
              </Table.HeaderCell>
              <Table.HeaderCell width={4}>API Keys</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {this.state.apps.map((a, i) => {
              return (
                <Table.Row key={a.uuid} className="appRow">
                  <Table.Cell collapsing>
                    <Radio
                      toggle
                      size="mini"
                      onChange={() => this.handleAppClick(a)}
                      color="black"
                      readOnly={a.is_active === false}
                      checked={this.state.selected.uuid === a.uuid}
                    />
                  </Table.Cell>

                  <Table.Cell selectable onClick={() => this.handleAppClick(a)}>
                    {a.name}
                  </Table.Cell>
                  <Table.Cell onClick={() => this.toggleAppStatus(a, i)}>
                    {a.is_active === true ? (
                      <Icon name="checkmark box" color="green" />
                    ) : (
                      <Icon name="square outline" color="grey" />
                    )}
                  </Table.Cell>
                  <Table.Cell selectable>
                    <Input
                      fluid
                      size="small"
                      inverted
                      disabled={!a.is_active}
                      icon="inr"
                      type="url"
                      onChange={(o, t) => this.handleUrlChange(a, i, o, t)}
                      iconPosition="left"
                      action={
                        this.state.original_apps[i].mo_url !== a.mo_url
                          ? {
                              labelPosition: 'left',
                              icon: 'save',
                              label: 'Save',
                              color: 'green',
                              onClick: (o, v) => this.handleUrlUpdate(a, o, v),
                              circular: true
                            }
                          : null
                      }
                      transparent
                      placeholder={`https://example.org/sdp/${env.company}-${
                        env.product
                      }/MO`}
                      value={a.mo_url}
                    />
                  </Table.Cell>
                  <Table.Cell />
                  <Table.Cell>
                    {a.apikeys.map((ak, i) => {
                      return (
                        <li key={i} className="appListLi">
                          <code style={{ fontSize: 10 }}>{ak}</code>
                        </li>
                      );
                    })}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>

        <Message color="black" attached="bottom">
          <Message.Header>
            <Icon name="lightbulb" color="yellow" />
            Tips
          </Message.Header>
          <ul>
            <li>Click on rows to edit App information.</li>
            <li>
              Use <code>{'http(s)://myapicenter.me/<%= variable %>'}</code> to
              add data to your url. Variables can be found on variables section
              of this page.
            </li>
            <li>
              Add <code>&_get=true</code> as a query parameter of your url to
              have SDP send data as GET.
            </li>
            <li>The changes will be online within 60 seconds.</li>
            <li>Carefully study URL guidelines for best practices.</li>
            <li>Try to test your URL before deploying on production.</li>
            <li>Log requests/reponses for at least 1 week.</li>
          </ul>
          {this.state.selected.name
            ? [
                <Divider key="divder" />,
                <Message.Header key="header_message">
                  <Icon name="code" color="green" /> Sending message
                  {' | '}{' '}
                  <a
                    target="_new"
                    href="https://docs.red9.ir/#f7582daf-4ecb-50e8-b3f2-dbeeb1e543ba"
                  >
                    <small>Documentation</small>
                  </a>
                </Message.Header>,
                <pre key="code" className="red9_samples">
                  <code>
                    {' '}
                    {` curl -X POST \\
  ${env.API_BASE}/api/app/messaging/send_sms_without_charge \\
  	-H 'Content-Type: application/json' \\
  	-H 'api-key: ${this.state.selected.apikeys}' \\
  	-d '{
  		"message": "We like to think of ${env.company} ${
                      env.product
                    } as the Dieter Rams of VAS platforms",
  		"national_number": ${env.company_contact_gsm},
  		"country_code": 98
}'
`}
                  </code>
                </pre>,

                <Divider key="divder_bulk_to_subs" />,
                <Message.Header key="header_bulk_to_subs">
                  <Icon name="code" color="violet" /> Sending bulk messages to
                  service subscribers
                  {' | '}{' '}
                  <a
                    target="_new"
                    href="https://docs.red9.ir/#eeeb2d23-dd09-4084-bf74-83c3aec1657f"
                  >
                    <small>Documentation</small>
                  </a>
                </Message.Header>,
                <pre key="code_bulk_to_subs" className="red9_samples">
                  <code>
                    {' '}
                    {` curl -X POST \\
  ${env.API_BASE}/api/app/messaging/send_bulk_to_subs \\
  	-H 'Content-Type: application/json' \\
  	-H 'api-key: ${this.state.selected.apikeys}' \\
  	-d '{
            "message": "We like to think of ${env.company} ${
                      env.product
                    } as the Dieter Rams of VAS platforms",
            "template": null
}'
`}
                  </code>
                </pre>
              ]
            : null}
          {this.state.selected.name &&
          this.state.activeService.meta.operator === 'MCI'
            ? [
                <Divider key="divder2" />,
                <Message.Header key="header_otp_subs">
                  <Icon name="code" color="blue" /> OTP subscription
                </Message.Header>,
                <p key="reqmode">
                  &bull; STEP1 | <b>Requesting</b>
                  {' | '}{' '}
                  <a
                    target="_new"
                    href="https://docs.red9.ir/#2e580aef-d855-b23c-3c5b-6d383aace439"
                  >
                    <small>Documentation</small>
                  </a>
                </p>,
                <pre key="code2" className="red9_samples">
                  <code>
                    {' '}
                    {` curl -X POST \\
  ${env.API_BASE}/api/app/subscriptions/otp_subscribe \\
  	-H 'Content-Type: application/json' \\
  	-H 'api-key: ${this.state.selected.apikeys}' \\
  	-d '{
   		"national_number":${env.company_contact_gsm},
   		"country_code": 98
}'
`}
                  </code>
                </pre>,
                <p key="confirm">
                  &bull; STEP2 | <b>Confirmation</b>
                  {' | '}{' '}
                  <a
                    target="_new"
                    href="https://docs.red9.ir/#c3a135d7-482d-9b0e-215b-75e382439e84"
                  >
                    <small>Documentation</small>
                  </a>
                  <br />
                  <small>
                    You should get <code>correlator</code> from STEP1 response
                    and <code>pin</code> from user.
                  </small>
                </p>,
                <pre key="code3" className="red9_samples">
                  <code>
                    {' '}
                    {` curl -X POST \\
  ${env.API_BASE}/api/app/subscriptions/otp_confirm_subscription \\
  	-H 'Content-Type: application/json' \\
  	-H 'api-key: ${this.state.selected.apikeys}' \\
  	-d '{
   		"correlator": "3e34c2b0-cd6d-4a05-a3e7-0e806192272",
   		"pin": "9527"
}'
`}
                  </code>
                </pre>
              ]
            : null}
          <Divider />,
          <Message.Header>
            <Icon name="code" color="grey" />
            Variables
          </Message.Header>
          <Gist id="1df99b31b264efb2f6609d737fda1d52" />
        </Message>

        <Dialog
          hidden={this.state.is_add_dialog_hidden}
          onDismiss={this.closeAddDialog}
          dialogContentProps={{
            type: DialogType.largeHeader,
            title: 'New Application',
            subText: (
              <span>
                A new application enable you to expand your service into broader
                development possibilities. Use new applications to target
                specific campaigns or aceess development teams. A name and a
                callback (MO) url is required.
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

          <TextField
            key="nameField"
            type="text"
            label="App Name"
            borderless
            onChanged={v => this.DialogValueChanged(v, 'name')}
            value={this.state.attrDialogOps.data['name']}
            title="Enter your new application name"
            placeholder="IOS application team ..."
            required={true}
          />

          <TextField
            key="moField"
            type="url"
            label="Callback (MO) URL"
            borderless
            onChanged={v => this.DialogValueChanged(v, 'mo_url')}
            value={this.state.attrDialogOps.data['mo_url']}
            title="Enter your target URL"
            placeholder="https://myapi.network/red9/callback/..."
            required={true}
          />

          <DialogFooter>
            <PrimaryButton onClick={this.doCreateNewApp} text="Create" />
            <DefaultButton onClick={this.closeAddDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>
      </div>
    );
  }
}

export default Applications;
