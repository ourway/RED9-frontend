import React, { Component } from 'react'
import swal from 'sweetalert2'
import store from 'store'
import { Table, Icon, Divider, Menu, Input } from 'semantic-ui-react'
import {
  getClients,
  createClient,
  renewClientKey,
  activateClient,
  deactivateClient
} from './apis'
import { env } from './config'
import { redirectSignal } from './utils'
import {
  MessageBar,
  MessageBarType
} from 'office-ui-fabric-react/lib/MessageBar'

import {
  Dialog,
  DialogType,
  DialogFooter
} from 'office-ui-fabric-react/lib/Dialog'
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button'
import { TextField } from 'office-ui-fabric-react/lib/TextField'

class ClientManagement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      error: null,
      clients: [],
      selected: null,
      is_renew_dialog_hidden: true,
      is_activate_dialog_hidden: true,
      filter: '',
      attrDialogOps: {
        is_hidden: true,
        params: [
          {
            name: 'Company',
            key: 'company',
            description: 'Service provider name',
            placeholder: 'Name of service provider or contract',
            type: 'text'
          },
          {
            name: 'Email',
            key: 'email',
            description: 'Service provider email address',
            placeholder: `ex: ${env.company_email}`,
            type: 'email'
          },
          {
            name: 'Contact Name',
            key: 'name',
            description: 'Service provider contact first and last name',
            placeholder: 'First and last name please',
            type: 'text'
          },
          {
            name: 'Contact Number',
            key: 'gsm',
            description: 'Service Provider MSISDN',
            placeholder: 'Unique number / 989xx-xxxx-xxx (MSISDN please)',
            type: 'tel'
          },

          {
            name: 'Max MT Message TPM',
            key: 'config.max_message_tpm',
            //default: 1200,
            description: 'Maximun number of overall MT messages per minute',
            placeholder: '1200 messages per minute (across all services)',
            type: 'number'
          },
          {
            name: 'Max Charge TPM',
            key: 'config.max_charge_tpm',
            //default: 1200,
            description: 'Maximun number of overall charge requests per minute',
            placeholder: '1200 charges per minute (across all services)',
            type: 'number'
          },

          {
            name: 'Max Push OTP TPM',
            key: 'config.max_push_otp_tpm',
            //default: 1200,
            description: 'Maximun number of overall push OTPs per minute',
            placeholder: '1200 otp pushes per minute (across all services)',
            type: 'number'
          },

          {
            name: 'Max Push Notification TPM',
            key: 'config.max_push_notif_tpm',
            //default: 1200,
            description:
              'Maximun number of overall push notifications per minute',
            placeholder: '4800 pushes per minute (across all services)',
            type: 'number'
          },

          {
            name: 'Email Report Frequency',
            //default: 2,
            key: 'config.email_report_freq',
            description: 'Report emailes will be sent every N days',
            placeholder: '2',
            type: 'number'
          },

          {
            name: 'IP whitelist',
            //default: 2,
            key: 'config.white_list_ips',
            placeholder: '91.99.99.203;185.147.178.13;...',
            description: 'List of whitelist IPs',
            type: 'text'
          }
        ],
        data: {}
      }
    }
  }

  doRenewClientKey = () => {
    const uuidKey = store.get('uuid')
    renewClientKey(atob(uuidKey), this.state.selected.email).then(resp => {
      if (resp.status === 200) {
        this.closeRenewDialog()

        resp.json().then(data => {
          console.log(data.client_key)

          swal({
            position: 'center',
            type: 'success',
            title: 'New client key is assigned',
            text: `${data.client_key}`,
            showConfirmButton: true,
            timer: 20000
          }).then(() => {
            this.doGetClients()
          })
        })
      }
    })
  }

  refreshClientKeyDialog = target => {
    this.setState({ is_renew_dialog_hidden: false, selected: target })
  }

  ActivateClientKeyDialog = target => {
    this.setState({ is_activate_dialog_hidden: false, selected: target })
  }

  closeActivateDialog = () => {
    this.setState({ is_activate_dialog_hidden: true })
  }

  closeRenewDialog = () => {
    this.setState({ is_renew_dialog_hidden: true })
  }

  doToggleActivation = () => {
    let targetFunc
    const uuidKey = store.get('uuid')
    if (this.state.selected.is_active === true) {
      targetFunc = deactivateClient(atob(uuidKey), this.state.selected.email)
    } else {
      targetFunc = activateClient(atob(uuidKey), this.state.selected.email)
    }
    targetFunc.then(resp => {
      this.closeActivateDialog()
      swal({
        position: 'center',
        type: 'success',
        title: 'Done',
        text: `Client has been ${
          this.state.selected.is_active === true ? 'deactivated' : 'activated'
        } successfully`,
        showConfirmButton: false,
        timer: 2000
      }).then(() => {
        this.doGetClients()
      })
    })
  }

  componentWillUnmount() {}

  doCreateNewClient = () => {
    const uuidKey = store.get('uuid')
    createClient(atob(uuidKey), this.state.attrDialogOps.data).then(resp => {
      if (resp.status === 500) {
        this.setState({
          error: `
          something went wrong.
          Please notice that Email
          and Number must be unique
              `
        })
      } else if (resp.status === 200) {
        this.CloseAttrDialog()
        swal({
          position: 'center',
          type: 'success',
          title: 'Congrats!',
          text: `Client has been created successfully`,
          showConfirmButton: false,
          timer: 2000
        }).then(() => {
          this.doGetClients()
        })
      }
    })
  }

  doGetClients = () => {
    const uuidKey = store.get('uuid')
    getClients(atob(uuidKey)).then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          this.setState({
            clients: data.clients.sort((a, b) => {
              return a.is_active ? -1 : 1
            })
          })
        })
      }
    })
  }

  componentDidMount() {
    this.doGetClients()
  }

  handleFilterClients = (_, o) => {
    this.setState({ filter: o.value.toLowerCase().trim() })
  }

  DialogValueChanged = (value, key) => {
    let data = {}

    if (key.match('config.') === null) {
      data = {
        ...this.state.attrDialogOps.data,
        [key]: value.toString()
      }
    } else {
      data = {
        ...this.state.attrDialogOps.data,
        [key]: value.toString(),
        config: {
          ...this.state.attrDialogOps.data.config,
          [key.slice(7, 100)]: value.toString()
        }
      }
    }

    if (!value) {
      let raw_data = this.state.attrDialogOps.data
      delete raw_data[key]
      data = raw_data
    }

    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        data: data
      }
    })
  }

  goToLoginPage = ck => {
    redirectSignal.next(`/login/${ck}`)
  }

  CloseAttrDialog = () => {
    this.setState({
      error: null,
      attrDialogOps: { ...this.state.attrDialogOps, is_hidden: true, data: {} }
    })
  }

  clientAddDialog = () => {
    this.setState({
      error: null,
      attrDialogOps: { ...this.state.attrDialogOps, is_hidden: false, data: {} }
    })
  }

  render() {
    return (
      <div>
        <Menu attached="top" inverted style={{ backgroundColor: '#212931' }}>
          <Menu.Menu position="right">
            <Menu.Item
              icon="add"
              title="Click to add a client"
              name="Add a client"
              onClick={this.clientAddDialog}
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
                placeholder="Filter clients ..."
              />
            </Menu.Item>
          </Menu.Menu>
        </Menu>

        <Table celled inverted selectable singleLine sortable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell>Company</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Contact</Table.HeaderCell>
              <Table.HeaderCell>Contact Number</Table.HeaderCell>
              <Table.HeaderCell>Limits [M/C/P]</Table.HeaderCell>
              <Table.HeaderCell>IP ACL</Table.HeaderCell>
              <Table.HeaderCell>Client Access Key</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {this.state.clients
              .filter(c => {
                return this.state.filter === ''
                  ? true
                  : c.company
                      .toLowerCase()
                      .trim()
                      .match(RegExp(this.state.filter)) !== null ||
                      c.name
                        .toLowerCase()
                        .trim()
                        .match(RegExp(this.state.filter)) !== null ||
                      c.services
                        .join(';')
                        .toLowerCase()
                        .trim()
                        .match(RegExp(this.state.filter)) !== null ||
                      c.email
                        .toLowerCase()
                        .trim()
                        .match(RegExp(this.state.filter)) !== null ||
                      c.gsm
                        .toLowerCase()
                        .trim()
                        .match(RegExp(this.state.filter)) !== null ||
                      c.client_key
                        .toLowerCase()
                        .trim()
                        .match(RegExp(this.state.filter)) !== null
              })
              .map((c, i) => {
                return (
                  <Table.Row key={i}>
                    <Table.Cell>{i + 1}</Table.Cell>
                    <Table.Cell>
                      <a
                        style={{ cursor: 'pointer' }}
                        onClick={() => this.goToLoginPage(c.client_key)}
                      >
                        <strong>{c.company}</strong>
                      </a>
                    </Table.Cell>
                    <Table.Cell>
                      <a
                        href="#/?refresh-client-key-clicked"
                        onClick={() => this.ActivateClientKeyDialog(c)}
                      >
                        {c.is_active === true ? (
                          <Icon name="checkmark box" color="green" />
                        ) : (
                          <Icon name="square outline" color="grey" />
                        )}
                      </a>
                    </Table.Cell>
                    <Table.Cell>
                      <a href={`mailto:${c.email}`}>
                        <Icon color="black" name="mail" circular inverted />
                      </a>
                      {c.name}
                    </Table.Cell>
                    <Table.Cell>{c.gsm}</Table.Cell>
                    <Table.Cell>
                      {c.config.max_message_tpm} / {c.config.max_charge_tpm} /{' '}
                      {c.config.max_push_notif_tpm}
                    </Table.Cell>
                    <Table.Cell>{c.config.white_list_ips}</Table.Cell>
                    <Table.Cell>
                      <code>{c.client_key}</code>
                    </Table.Cell>
                    <Table.Cell>
                      <a
                        href="#/?refresh-client-key-clicked"
                        onClick={() => this.refreshClientKeyDialog(c)}
                      >
                        <Icon.Group>
                          <Icon color="orange" name="key" />
                          <Icon corner color="orange" name="refresh" />
                        </Icon.Group>
                      </a>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
          </Table.Body>
        </Table>

        <Divider />

        <Dialog
          hidden={this.state.is_activate_dialog_hidden}
          onDismiss={this.closeActivateDialog}
          dialogContentProps={{
            type: DialogType.normal,
            title: `${
              this.state.selected
                ? this.state.selected.is_active === true
                  ? 'Deactivate'
                  : 'Activate'
                : null
            } Client?`,
            subText: (
              <span>
                This will change status of client{' '}
                <code>
                  {this.state.selected ? this.state.selected.email : null}
                </code>. This will{' '}
                <u>effect user application keys (API keys)</u>. A notification
                email will be sent to{' '}
                {this.state.selected ? this.state.selected.company : null} email
                account.
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
          <DialogFooter>
            <DefaultButton onClick={this.doToggleActivation} text="Yes" />
            <PrimaryButton onClick={this.closeActivateDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>

        <Dialog
          hidden={this.state.is_renew_dialog_hidden}
          onDismiss={this.closeRenewDialog}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Revoke Client Key?',
            subText: (
              <span>
                This action will <u>revoke</u> client key and reassigns{' '}
                <b>new client key</b> for{' '}
                <code>
                  {this.state.selected ? this.state.selected.email : null}
                </code>. This will not effect user application keys (API keys).
                Not any email will be sent to user and user will not be able to
                login to their panel nor use client related operations like
                reportings. This can not be undone. Please do not forget to
                inform{' '}
                {this.state.selected ? this.state.selected.company : null}.
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
          <DialogFooter>
            <DefaultButton onClick={this.doRenewClientKey} text="Renew" />
            <PrimaryButton onClick={this.closeRenewDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>

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
            icon: 'user',
            title: (
              <span>
                {' '}
                <i
                  className="ms-Icon ms-Icon--AddTo middleIcon"
                  aria-hidden="true"
                />{' '}
                Add a New Client{' '}
              </span>
            ),
            subText: (
              <small>
                {' '}
                Client-Key will be sent to user email after creation process.{' '}
              </small>
            )
          }}
        >
          {this.state.error !== null ? (
            <MessageBar
              messageBarType={MessageBarType.error}
              isMultiline={true}
            >
              {this.state.error}
            </MessageBar>
          ) : null}

          <br />

          {this.state.attrDialogOps.params.map(p => {
            return (
              <TextField
                key={p.name}
                label={p.name}
                type={p.type}
                borderless
                onChanged={v => this.DialogValueChanged(v, p.key)}
                value={this.state.attrDialogOps.data[p.key] || p.default}
                title={p.description}
                placeholder={p.placeholder}
                required={true}
              />
            )
          })}
          <DialogFooter>
            <PrimaryButton
              onClick={this.doCreateNewClient}
              text="Add"
              disabled={
                Object.keys(this.state.attrDialogOps.data).length !==
                this.state.attrDialogOps.params.length + 1
              }
            />
            <DefaultButton
              onClick={this.CloseAttrDialog}
              text="Cancel"
              disabled={false}
            />
          </DialogFooter>
        </Dialog>
      </div>
    )
  }
}

export default ClientManagement
