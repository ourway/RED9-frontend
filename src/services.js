import React, { Component } from 'react';
import swal from 'sweetalert2';
import Gist from 'react-gist';
import store from 'store';
import {
  Menu,
  Button,
  Segment,
  Divider,
  Input,
  Message,
  Table,
  Icon,
  Card,
  Dropdown,
  Header,
  Grid
} from 'semantic-ui-react';

import { env } from './config';

import S from 'string';

import Red9Form from './red9form';
import {
  getClientServices,
  getClientGateways,
  ftpServicePing,
  createService,
  getCode51Services,
  testService,
  activateService,
  deactivateService
} from './apis';
import {
  titleChangeSignal,
  onFilter$,
  selectService$,
  selectApp$,
  startLoading$,
  stopLoading$,
  changeColorCode$,
  redirectSignal,
  toggleFormEdit$
} from './utils';
import { Icon as MsIcon } from 'office-ui-fabric-react/lib/Icon';
import { CompoundButton } from 'office-ui-fabric-react/lib/Button';
import { Link } from 'react-router-dom';

import {
  Dialog,
  DialogType,
  DialogFooter
} from 'office-ui-fabric-react/lib/Dialog';
import {
  PrimaryButton,
  DefaultButton
} from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

import { Dropdown as MSDropdown } from 'office-ui-fabric-react/lib/Dropdown';

import { serviceParams } from './params';

import {
  MessageBar,
  MessageBarType
} from 'office-ui-fabric-react/lib/MessageBar';

class Services extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editMode: false,
      testSmsResult: {},
      overview: [],
      colorCode: 'transparent',
      uuid: atob(store.get('uuid')),
      activeService: {
        meta: {
          uuid: props.match.params.uuid
        }
      },
      services: [],
      filter: '',
      attrDialogOps: {
        is_hidden: true,
        operator: null,
        params: [],
        data: {}
      }
    };

    this.OperatorChanged = this.OperatorChanged.bind(this);
    this.doCreateNewService = this.doCreateNewService.bind(this);
    this.toggleEditMode = this.toggleEditMode.bind(this);
    this.ftpPing = this.ftpPing.bind(this);
    this.getCode51 = this.getCode51.bind(this);
  }

  handleFilterParams = e => {
    this.setState({
      filter: e.target.value
    });
    onFilter$.next(e.target.value);
  };

  toggleEditMode = () => {
    toggleFormEdit$.next(this.state.activeService);
    this.setState({ editMode: !this.state.editMode });
  };

  getCode51 = name => {
    getCode51Services().then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          let available = false;
          const _s = data.result.filter(s => s.name === name).length;
          if (_s > 0) {
            available = true;
          }
          this.setState({
            activeService: {
              ...this.state.activeService,
              meta: {
                ...this.state.activeService.meta,
                is_in_code51: available
              }
            }
          });
        });
      }
    });
  };

  ftpPing = ftp_key => {
    ftpServicePing(ftp_key).then(resp => {
      let connection = false;
      if (resp.status === 200) {
        connection = true;
      }
      this.setState({
        activeService: {
          ...this.state.activeService,
          meta: {
            ...this.state.activeService.meta,
            is_ftp_connected: connection
          }
        }
      });
    });
  };

  handleServiceClick = (e, { uuid, title, data }) => {
    this.setState({
      testSmsResult: {},
      activeService: data,
      filter: '',
      editMode: false
    });

    if (data.meta.operator === 'MCI') {
      this.someAjaxCalls = setTimeout(() => {
        this.ftpPing(data.meta.ftp_key);
        this.getCode51(data.name);
      }, 10);
    }
    redirectSignal.next(`/services/${uuid}`);
    titleChangeSignal.next(`${title} - Services`);
    onFilter$.next('');
    selectService$.next(data);
    const app = data.meta.apps.filter(a => {
      return true;
    })[0] || { name: 'N/A' };
    selectApp$.next(app);
  };

  handleItemClick = (e, { name }) => this.setState({ activeItem: name });

  prepareServiceList = () => {
    startLoading$.next(true);
    const uuidKey = store.get('uuid'); //no need to check again
    const r = getClientServices(atob(uuidKey));
    return r.then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          titleChangeSignal.next('Services');
          data.services.sort((a, b) => a.meta.is_active !== true);
          const asl = data.services.filter(s => {
            return s.meta.uuid === this.state.activeService.meta.uuid;
          });
          selectApp$.next(
            asl.length > 0 ? asl[0].meta.apps[0] : { name: 'N/A' }
          );
          this.setState({
            services: data.services,
            activeService:
              asl.length > 0 ? asl[0] : { meta: { uuid: undefined } }
          });
          if (asl.length > 0) {
            titleChangeSignal.next(`${S(asl[0].name)} - Services`);
            selectService$.next(asl[0]);
            if (asl[0].meta.operator === 'MCI') {
              this.extraTimeouts = setTimeout(() => {
                this.ftpPing(asl[0].meta.ftp_key);
                this.getCode51(asl[0].name);
              }, 10);
            }
          }
        });
        stopLoading$.next(true);
      }
    });
  };

  componentWillReceiveProps(nextProps) {
    //console.log(nextProps)
  }

  componentWillUnmount() {
    this.colorCodeChangeSubscription.unsubscribe();
    clearTimeout(this.someAjaxCalls);
    clearTimeout(this.extraTimeouts);
    // stopLoading$.next(true);
  }

  componentDidMount() {
    const service = store.get('service');
    if (service) {
      this.setState({ activeService: service });
    }

    this.colorCodeChangeSubscription = changeColorCode$
      .distinctUntilChanged()
      .debounceTime(250)
      .subscribe(c => {
        this.setState({ colorCode: c });
      });

    this.prepareServiceList();
  }

  OpenAttrDialog = e => {
    this.setState({
      attrDialogOps: {
        is_hidden: false,
        operator: null,
        params: [],
        data: {}
      }
    });
  };

  CloseAttrDialog = () => {
    this.setState({
      attrDialogOps: {
        is_hidden: true,
        operator: null,
        params: [],
        data: {}
      }
    });
  };

  DialogValueChanged = (v, option) => {
    const value = v.split(' ').join('_');
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        data: {
          ...this.state.attrDialogOps.data,
          [option]: value
        }
      }
    });
  };

  doCreateNewService() {
    const data = this.state.attrDialogOps.data;
    const crs = createService(this.state.uuid, data);
    crs.then(resp => {
      if (resp.status === 201) {
        this.CloseAttrDialog();
        swal({
          position: 'center',
          type: 'success',
          title: 'Congrats!',
          text: `Service ${data.name} has been created successfully`,
          showConfirmButton: false,
          timer: 2000
        }).then(() => {
          this.CloseAttrDialog();
        });
        this.prepareServiceList();
      } else {
        swal({
          position: 'center',
          type: 'error',
          title: 'Opps',
          text: `Please Recheck your settings`,
          showConfirmButton: true,
          timer: 5000
        });
      }
    });
  }

  OperatorChanged = (e, options) => {
    const jsonParams = serviceParams.filter(
      i => i.gateway.includes(e.key) && i.type === 'json'
    );

    const gwr = getClientGateways(this.state.uuid);

    const params = serviceParams.filter(
      i => i.gateway.includes(e.key) && i.type !== 'json'
    );
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        operator: e.key,
        params: params,
        data:
          jsonParams.length === 0
            ? {}
            : jsonParams.reduce((o, val) => {
                return { [val.name]: {} };
              }, {})
      }
    });

    gwr.then(resp =>
      resp.json().then(data => {
        const gateways = data.gateways.filter(i => i.sms_center === e.key);
        if (gateways.length > 0) {
          this.setState({
            attrDialogOps: {
              ...this.state.attrDialogOps,
              data: {
                ...this.state.attrDialogOps.data,
                gateway: gateways[0].name
              }
            }
          });
        }
      })
    );
  };

  ServiceDialog = () => {
    return (
      <Dialog
        hidden={this.state.attrDialogOps.is_hidden}
        disabled={true}
        onDismiss={this.CloseAttrDialog}
        modalProps={{
          isDarkOverlay: true,
          containerClassName:
            'serviceCreationDialog ms-slideDownIn20 hiddenMdDown'
        }}
        dialogContentProps={{
          type: DialogType.largeHeader,
          icon: 'Mail',
          title: (
            <span>
              <i
                className="ms-Icon ms-Icon--AddTo middleIcon"
                aria-hidden="true"
              />{' '}
              New Service
            </span>
          ),
          subText: (
            <span>
              Questions? contact us <u>{env.company_email}</u>{' '}
            </span>
          )
        }}
      >
        <MSDropdown
          placeHolder="Select an Operator"
          label="Operator"
          required={true}
          selectedKey={this.state.attrDialogOps.operator}
          id="service_operator"
          onChanged={this.OperatorChanged}
          ariaLabel=""
          options={[
            { key: 'IMI', text: 'MCI IMI VAS' },
            { key: 'IRANCELL', text: 'MTN/Irancell VAS' },
            { key: 'MAGFA', text: 'Magfa Messaging Systems [3000]' },
            { key: 'mailgun', text: 'Mailgun Transactional Email API' },
            { key: 'mailjet', text: 'Mailjet Emailing ' }
          ]}
        />

        <br />

        {this.state.attrDialogOps.params.length > 0 ||
        this.state.attrDialogOps.operator === null ? (
          this.state.attrDialogOps.params.map(p => {
            return (
              <TextField
                key={p.name}
                type={p.type}
                label={S(p.name.split('_').join(' ')).capitalize().s}
                borderless
                onChanged={v => this.DialogValueChanged(v, p.name)}
                value={this.state.attrDialogOps.data[p.name]}
                title={p.description}
                placeholder={p.placeholder}
                required={true}
              />
            );
          })
        ) : (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            This service is not active for your client
          </MessageBar>
        )}

        <DialogFooter>
          <PrimaryButton
            onClick={this.doCreateNewService}
            text="Add"
            disabled={
              this.state.attrDialogOps.key === '' ||
              this.state.attrDialogOps.value === ''
            }
          />
          <DefaultButton
            onClick={this.CloseAttrDialog}
            text="Cancel"
            disabled={false}
          />
        </DialogFooter>
      </Dialog>
    );
  };

  doTestService = () => {
    this.setState({
      testSmsIsSending: true,
      testSmsResult: {}
    });

    const uuidKey = store.get('uuid'); //no need to check again
    const req = testService(atob(uuidKey), this.state.activeService.meta.uuid);
    req.then(resp =>
      resp.json().then(data => {
        this.setState({
          testSmsResult: data,
          testSmsIsSending: false
        });
      })
    );
  };

  render() {
    //console.log("wow")
    //const service_uuid = this.props.match.params.uuid
    return (
      <div>
        <Menu attached="top" inverted>
          {this.state.services.map((s, i) => {
            if (i <= 5) {
              return (
                <Menu.Item
                  as="a"
                  icon={
                    this.state.activeService.meta.uuid === s.meta.uuid
                      ? 'chevron circle down'
                      : 'chevron circle right'
                  }
                  fitted="vertically"
                  index={i}
                  color="grey"
                  uuid={s.meta.uuid}
                  title={S(s.name).capitalize().s}
                  name={s.name}
                  data={s}
                  key={s.meta.uuid}
                  active={this.state.activeService.meta.uuid === s.meta.uuid}
                  onClick={this.handleServiceClick}
                />
              );
            } else {
              return null;
            }
          })}

          {this.state.services.length > 5 ? (
            <Dropdown icon="sidebar" pointing="top" className="link item">
              <Dropdown.Menu>
                {this.state.services.map((s, i) => {
                  if (i > 5) {
                    return (
                      <Dropdown.Item key={s.meta.uuid}>
                        <Link
                          className="ui dark"
                          onClick={this.handleServiceClick}
                          to={`/services/${s.meta.uuid}`}
                        >
                          {s.name}
                        </Link>
                      </Dropdown.Item>
                    );
                  } else {
                    return null;
                  }
                })}
              </Dropdown.Menu>
            </Dropdown>
          ) : null}

          <Menu.Menu position="right">
            {this.state.activeService.meta.inserted_at ? (
              <Menu.Item
                as="a"
                icon={
                  this.state.editMode === true
                    ? 'check square'
                    : 'square outline'
                }
                fitted="vertically"
                color="grey"
                name="Edit Mode"
                title="Edit Mode"
                key="edit_mode"
                style={{ backgroundColor: '#23367c85' }}
                active={this.state.editMode === true}
                onClick={this.toggleEditMode}
              />
            ) : null}
            {this.state.activeService.meta.uuid &&
            this.state.editMode === true ? (
              <Menu.Item>
                <Input
                  size="tiny"
                  disabled={this.state.editMode === false}
                  onChange={this.handleFilterParams}
                  value={this.state.filter}
                  transparent
                  type="search"
                  inverted
                  icon={{ name: 'filter' }}
                  placeholder="Filter parameters ..."
                />
              </Menu.Item>
            ) : null}

            <Menu.Item
              as="a"
              icon="add"
              fitted="vertically"
              color="blue"
              name=""
              title="Add a new service"
              key="add_new_service"
              style={{ backgroundColor: '#23367c85' }}
              onClick={this.OpenAttrDialog}
            />
          </Menu.Menu>
        </Menu>

        {this.state.activeService.meta.inserted_at ? (
          <Segment attached="bottom" children basic raised inverted>
            {this.state.services
              .filter(s => {
                return s.meta.uuid === this.state.activeService.meta.uuid;
              })
              .map(s => {
                return (
                  <Red9Form
                    key={s.meta.uuid}
                    data={s}
                    editable={true}
                    has_deactivate_button={s.meta.is_active === true}
                    deactivation_api={deactivateService}
                    activation_api={activateService}
                    has_add_attribute={true}
                    field_params={serviceParams}
                    endpoint={`${env.API_BASE}/api/client/service`}
                    scope="client"
                    form_name="service"
                  />
                );
              })}

            {this.state.editMode === false ? (
              <Grid relaxed padded="horizontally">
                <Grid.Row>
                  <Grid.Column width={1}>
                    <Header as="h6" icon color="orange">
                      <Icon name="window maximize" circular inverted />
                      Overview
                    </Header>
                  </Grid.Column>

                  <Grid.Column width={15}>
                    <Table
                      className="backtransition"
                      style={{
                        background: `linear-gradient(transparent, ${
                          this.state.colorCode
                        }77)`
                      }}
                      inverted
                      celled
                      padded
                      structured
                      verticalAlign="middle"
                    >
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell rowSpan="2">
                            {' '}
                            Operator{' '}
                          </Table.HeaderCell>
                          <Table.HeaderCell rowSpan="2">
                            {' '}
                            ShortCode{' '}
                          </Table.HeaderCell>
                          <Table.HeaderCell rowSpan="2">Name</Table.HeaderCell>
                          <Table.HeaderCell rowSpan="2">
                            Activation Date
                          </Table.HeaderCell>
                          <Table.HeaderCell rowSpan="2">Apps</Table.HeaderCell>
                          {this.state.activeService.meta.operator === 'MCI'
                            ? [
                                <Table.HeaderCell key="ftp" rowSpan="2">
                                  FTP
                                </Table.HeaderCell>,
                                <Table.HeaderCell key="ip" rowSpan="2">
                                  {' '}
                                  Integration Panel{' '}
                                </Table.HeaderCell>
                              ]
                            : null}
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell textAlign="center">
                            <h4>{this.state.activeService.meta.operator}</h4>
                          </Table.Cell>

                          <Table.Cell textAlign="center">
                            <h4>{this.state.activeService.short_code}</h4>
                          </Table.Cell>

                          <Table.Cell>
                            {this.state.activeService.service_name}
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            {new Date(
                              this.state.activeService.meta.inserted_at || null
                            ).toString()}
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            <Button.Group vertical labeled fluid>
                              {this.state.activeService.meta.apps.map(
                                (app, i) => {
                                  return (
                                    <Button
                                      content={app.name}
                                      href={`/apps/${app.uuid}`}
                                      key={app.name}
                                      size="small"
                                      icon="adn"
                                      color="black"
                                    />
                                  );
                                }
                              )}
                            </Button.Group>
                          </Table.Cell>

                          {this.state.activeService.meta.operator === 'MCI'
                            ? [
                                <Table.Cell key="ftp" textAlign="center">
                                  {this.state.activeService.meta
                                    .is_ftp_connected === undefined ? (
                                    <Icon loading name="spinner" />
                                  ) : (
                                    <MsIcon
                                      iconName={
                                        this.state.activeService.meta
                                          .is_ftp_connected === true
                                          ? 'Accept'
                                          : 'Cancel'
                                      }
                                      style={{
                                        color:
                                          this.state.activeService.meta
                                            .is_ftp_connected === true
                                            ? 'lightgreen'
                                            : 'red'
                                      }}
                                    />
                                  )}
                                </Table.Cell>,

                                <Table.Cell key="ip" textAlign="center">
                                  {this.state.activeService.meta
                                    .is_in_code51 === undefined ? (
                                    <Icon loading name="spinner" />
                                  ) : (
                                    <MsIcon
                                      iconName={
                                        this.state.activeService.meta
                                          .is_in_code51 === true
                                          ? 'Accept'
                                          : 'Cancel'
                                      }
                                      style={{
                                        color:
                                          this.state.activeService.meta
                                            .is_in_code51 === true
                                            ? 'lightgreen'
                                            : 'red'
                                      }}
                                    />
                                  )}
                                </Table.Cell>
                              ]
                            : null}
                        </Table.Row>
                      </Table.Body>
                    </Table>
                  </Grid.Column>
                </Grid.Row>

                <Divider />
                <Grid.Row>
                  <Grid.Column width={1}>
                    <Header as="h6" icon color="orange">
                      <Icon name="travel" circular inverted />
                      Tools
                    </Header>
                  </Grid.Column>

                  <Grid.Column width={15}>
                    <Card color="blue">
                      <Card.Content>
                        <Card.Header>
                          <CompoundButton
                            onClick={this.doTestService}
                            description={
                              <p>
                                {' '}
                                Click to send a test SMS to{' '}
                                {this.state.activeService.meta.client_gsm}
                              </p>
                            }
                            disabled={this.state.testSmsIsSending === true}
                            checked={true}
                          >
                            Send Test SMS
                          </CompoundButton>
                        </Card.Header>
                        <Card.Meta>
                          <span className="date" />
                        </Card.Meta>
                        <Card.Description>
                          {this.state.testSmsResult.resp
                            ? this.state.testSmsResult.status === 'error'
                              ? [
                                  <h4 key="header">
                                    We tried to send a message from{' '}
                                    <code>
                                      {this.state.activeService.short_code}
                                    </code>{' '}
                                    to{' '}
                                    <code>
                                      {this.state.testSmsResult.msisdn}
                                    </code>{' '}
                                    and we got this error:
                                  </h4>,
                                  <ul key="errorlist">
                                    <li>
                                      Error ID:{' '}
                                      <code>
                                        {this.state.testSmsResult.resp.id}
                                      </code>
                                    </li>
                                    <li>
                                      Fault:{' '}
                                      <code>
                                        {this.state.testSmsResult.resp.fault}
                                      </code>
                                    </li>
                                    <li>
                                      Description:{' '}
                                      <code>
                                        {
                                          this.state.testSmsResult.resp
                                            .description
                                        }
                                      </code>
                                    </li>
                                    <li>
                                      Correlator:{' '}
                                      <Link
                                        className="dark"
                                        to={`/messaging/status/${
                                          this.state.testSmsResult.correlator
                                        }`}
                                      >
                                        <small style={{ color: 'darkgreen' }}>
                                          {this.state.testSmsResult.correlator}
                                        </small>
                                      </Link>
                                    </li>
                                  </ul>
                                ]
                              : null
                            : null}
                        </Card.Description>
                      </Card.Content>
                      <Card.Content extra>
                        {this.state.testSmsIsSending === true ? (
                          <Icon
                            loading
                            size="small"
                            name="spinner"
                            color="blue"
                          />
                        ) : null}

                        {this.state.testSmsResult.resp ? (
                          <a>
                            <Icon
                              name="circle"
                              color={
                                this.state.testSmsResult.status === 'ok'
                                  ? 'green'
                                  : 'red'
                              }
                            />
                            {this.state.testSmsResult.status}
                          </a>
                        ) : (
                          <span>Click button to update the status of test</span>
                        )}
                      </Card.Content>
                    </Card>
                  </Grid.Column>
                </Grid.Row>
                <Divider />

                <Grid.Row>
                  <Grid.Column width={8}>
                    <Message color="black" attached="bottom">
                      <Message.Header>
                        <Icon name="lightbulb" color="yellow" />
                        Tips
                      </Message.Header>
                      <ul>
                        <li>
                          Reading{' '}
                          <Link to="/getting-started">
                            Getting Started Guide
                          </Link>{' '}
                          is always a good idea
                          {` 😁`}
                        </li>
                        {this.state.activeService.meta.operator === 'MCI'
                          ? [
                              <li key="t1">
                                FTP check indicates whether ftp folder is
                                available for{' '}
                                <u>{this.state.activeService.name}</u> service.
                                You can find more information{' '}
                                <Link to="/ftp-data">here</Link>.
                              </li>,
                              <li key="t2">
                                Integrated check indicates whether{' '}
                                <u>{this.state.activeService.name}</u> service
                                is enabled in <code>*800#</code>.
                              </li>
                            ]
                          : null}
                        <li>
                          Click on Edit mode on top right corner to edit service
                          details.
                        </li>
                        <li>The changes will be online within 60 seconds.</li>
                        <li>
                          Carefully study URL guidelines for best practices.
                        </li>
                        <li>
                          Try to{' '}
                          <Link to="/mock-requests"> test your URLs </Link>{' '}
                          before deploying on production.
                        </li>
                      </ul>
                    </Message>
                  </Grid.Column>

                  <Grid.Column width={8}>
                    {!this.state.activeService.sub_url ||
                    !this.state.activeService.unsub_url ||
                    !this.state.activeService.renewal_url ||
                    !this.state.activeService.max_daily_allowed_charge ? (
                      <Message warning color="black">
                        <Message.Header>Warning</Message.Header>
                        {!this.state.activeService.sub_url ? (
                          <li>
                            You do not set <code>sub_url</code> for your
                            service; hence subscription notifications will be
                            send to you via app mo url.
                          </li>
                        ) : null}

                        {!this.state.activeService.unsub_url ? (
                          <li>
                            You do not set <code>unsub_url</code> for your
                            service; hence unsubscription notifications will be
                            send to you via app mo url.
                          </li>
                        ) : null}

                        {!this.state.activeService.renewal_url ? (
                          <li>
                            You do not set <code>renewal_url</code> for your
                            service. You won't recieve renewal notifications
                            unless you set this variable.
                          </li>
                        ) : null}

                        {!this.state.activeService.max_daily_allowed_charge ? (
                          <li>
                            You do not set <code>max_daily_allowed_charge</code>{' '}
                            for your service. You won't be able to use OTP
                            subscription related functions.
                          </li>
                        ) : null}
                        <Divider />

                        <p>
                          You can add new attributes to your service by clicking{' '}
                          <b>Edit Mode</b> and then by clicking on{' '}
                          <b> Add Attribute</b> button
                        </p>
                      </Message>
                    ) : null}
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            ) : (
              <Segment inverted>
                <Gist id="1df99b31b264efb2f6609d737fda1d52" />
                <Gist id="f1554463853a1f06f0e9b38095ca0245" />
              </Segment>
            )}
          </Segment>
        ) : (
          <section style={{ textAlign: 'center', marginTop: 100 }}>
            <span className="ms-font-xl ms-fontColor-white ms-slideLeftIn40">
              <MsIcon iconName="Redeploy" className="" /> &nbsp; Select A
              Service To Start
              <br />
              <br />
              <span style={{ color: 'lightgrey' }}>Or</span>
              <br />
              <br />
              <CompoundButton
                primary={true}
                onClick={this.OpenAttrDialog}
                description="It's easy"
                iconProps={{ iconName: 'Add' }}
              >
                Create A New Service
              </CompoundButton>
              <h6>
                <Link to="/getting-started">
                  <Icon name="doctor" />
                  If you don't know what is a service, read the{' '}
                  <u>Getting Started</u> guide
                </Link>
              </h6>
            </span>
          </section>
        )}
        {this.ServiceDialog()}
      </div>
    );
  }
}

export default Services;
