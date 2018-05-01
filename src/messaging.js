import React, { Component } from 'react'
import JDate from 'jalali-date'
import store from 'store'
import swal from 'sweetalert2'
import { Segment, Statistic, Button, Table } from 'semantic-ui-react'
import { CompoundButton } from 'office-ui-fabric-react/lib/Button'
import { Label } from 'office-ui-fabric-react/lib/Label'
import {
  getTemplates,
  getMessageQueue,
  deleteMessageQueue,
  sendSmsWithoutCharge,
  postNewBulkToSubs,
  getKVKey,
  setKVKey,
  getAllKVKeys
} from './apis'

import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button'
import {
  Dialog,
  DialogType,
  DialogFooter
} from 'office-ui-fabric-react/lib/Dialog'

import { TextField } from 'office-ui-fabric-react/lib/TextField'
import { Dropdown as MSDropdown } from 'office-ui-fabric-react/lib/Dropdown'

class Messaging extends Component {
  constructor(props) {
    super(props)
    this.state = {
      apikey: null,
      templates: [],
      bulk_list: {},
      inqueue: 'N/A',
      is_bulk_dialog_hidden: true,
      is_single_dialog_hidden: true,
      attrDialogOps: {
        bulk: {
          message: '',
          template: null,
          name: ''
        },
        single: {
          message: 'something',
          template: '',
          national_number: 0
        }
      }
    }
  }

  getQueueSize = apikey => {
    getMessageQueue(apikey).then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          this.setState({ inqueue: data.messages.count })
        })
      }
    })
  }

  doCleanQueue = () => {
    deleteMessageQueue(this.state.apikey).then(r => {
      if (r.status === 200) {
        swal({
          position: 'center',
          type: 'success',
          title: 'OK',
          text: `Your Queue is clean now`,
          showConfirmButton: false,
          timer: 2000
        })
      }
    })
  }
  doCreateNewBulk = () => {
    const data = {
      message: this.state.attrDialogOps.bulk.message,
      template: this.state.attrDialogOps.bulk.template
    }

    postNewBulkToSubs(this.state.apikey, data).then(resp => {
      this.closeBulkDialog()
      if (resp.status === 200) {
        resp.json().then(d => {
          this.setState({ inqueue: d.count })
          setKVKey(
            this.state.apikey,
            'bulk',
            this.state.attrDialogOps.bulk.name,
            { template: data.template, count: d.count }
          )
          swal({
            position: 'center',
            type: 'success',
            title: 'Congrats!',
            text: `Your bulk is queued (${d.count} messages)`,
            showConfirmButton: false,
            timer: 2000
          }).then(() => this.doGetBulks(this.state.apikey))
        })
      }
    })
  }

  doPostNewSms = () => {
    const data = {
      message: this.state.attrDialogOps.single.message,
      template: this.state.attrDialogOps.single.template,
      country_code: 98,
      instant: true,
      national_number: this.state.attrDialogOps.single.national_number
    }

    sendSmsWithoutCharge(this.state.apikey, data).then(resp => {
      this.closeSingleDialog()
      if (resp.status === 200) {
        resp.json().then(data => {
          swal({
            position: 'center',
            type: 'success',
            title: 'Congrats!',
            text: `${data.result}`,
            showConfirmButton: false,
            timer: 1000
          })
        })
      } else {
        resp.json().then(data => {
          swal({
            position: 'center',
            type: 'error',
            title: `${data.result.fault}`,
            text: `${data.result.description}`,
            showConfirmButton: true,
            timer: 10000
          })
        })
      }
    })
  }

  openBulkDialog = () => {
    this.setState({ is_bulk_dialog_hidden: false })
  }

  closeBulkDialog = () => {
    this.setState({ is_bulk_dialog_hidden: true })
  }

  openSingleDialog = () => {
    this.setState({ is_single_dialog_hidden: false })
  }

  closeSingleDialog = () => {
    this.setState({ is_single_dialog_hidden: true })
  }

  _newBulkNameChanged = v => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        bulk: { ...this.state.attrDialogOps.bulk, name: v }
      }
    })
  }

  _newBulkTemplateChanged = v => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        bulk: { ...this.state.attrDialogOps.bulk, template: v.key }
      }
    })
  }

  doGetBulks = apikey => {
    getAllKVKeys(apikey, 'bulk').then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          data.keys.map((k, i) => {
            return getKVKey(apikey, 'bulk', k).then(r => {
              if (r.status === 200) {
                r.json().then(d => {
                  this.setState({
                    bulk_list: {
                      ...this.state.bulk_list,
                      [k]: d
                    }
                  })
                })
              }
            })
          })
        })
      }
    })
  }
  _newSmsPhoneChanged = v => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        single: { ...this.state.attrDialogOps.single, national_number: v }
      }
    })
  }

  _newSmsTemplateChanged = v => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        single: { ...this.state.attrDialogOps.single, template: v.key }
      }
    })
  }

  componentDidMount() {
    const uuidKey = store.get('uuid')
    const apikeyb64 = store.get('api-key')
    if (apikeyb64) {
      this.setState({ apikey: atob(apikeyb64) })
      this.getQueueSize(atob(apikeyb64))
      this.messagesCountInterval = setInterval(() => {
        this.getQueueSize(atob(apikeyb64))
      }, 15000)
      this.doGetBulks(atob(apikeyb64))
    }

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
  }

  componentWillUnmount() {
    clearInterval(this.messagesCountInterval)
  }

  render() {
    return (
      <Segment inverted>
        <Segment inverted floated="right">
          <Statistic color="yellow">
            <Statistic.Label style={{ color: 'grey' }}>
              Queued Messages{' '}
              {this.state.inqueue !== 'N/A' && this.state.inqueue > 0 ? (
                <Button
                  size="mini"
                  color="red"
                  icon="stop"
                  onClick={this.doCleanQueue}
                />
              ) : null}
            </Statistic.Label>
            <Statistic.Value>{this.state.inqueue}</Statistic.Value>
          </Statistic>
        </Segment>
        <div style={{ display: 'inline-block' }}>
          <Label> </Label>
          <CompoundButton
            primary={true}
            description="Send a message to all services subscribers"
            disabled={this.state.templates === []}
            onClick={this.openBulkDialog}
            checked={true}
          >
            Bulk message
          </CompoundButton>
        </div>

        <div style={{ display: 'inline-block' }}>
          <Label> </Label>
          <CompoundButton
            primary={false}
            onClick={this.openSingleDialog}
            description="Send single message to a phone number"
            disabled={this.state.templates === []}
            checked={true}
          >
            Single message
          </CompoundButton>
        </div>

        <Table inverted celled singleLine>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Datetime</Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>template</Table.HeaderCell>
              <Table.HeaderCell>Subscribers</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Object.keys(this.state.bulk_list).map((b, i) => {
              const d = new JDate(new Date(this.state.bulk_list[b].updated_at))
              const bd = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
              return (
                <Table.Row key={i} className="appRow">
                  <Table.Cell collapsing>{bd}</Table.Cell>
                  <Table.Cell collapsing>
                    {this.state.bulk_list[b].key}
                  </Table.Cell>
                  <Table.Cell collapsing>
                    {this.state.bulk_list[b].object.template}
                  </Table.Cell>

                  <Table.Cell collapsing>
                    {this.state.bulk_list[b].object.count}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>

        <Dialog
          hidden={this.state.is_bulk_dialog_hidden}
          onDismiss={this.closeBulkDialog}
          dialogContentProps={{
            type: DialogType.largeHeader,
            title: 'Bulk Message',
            subText: (
              <span>
                Bulk message will be send to all subscribers. It won't be sent
                after 24:00 and it shall start within 30 seconds. You can cancel
                queued messages in main panel.
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
            label="Bulk Name"
            borderless
            onChanged={this._newBulkNameChanged}
            value={this.state.attrDialogOps.bulk.name}
            title="Enter new bulk name"
            placeholder="new_movie_has_arrived ..."
            required={true}
          />

          <MSDropdown
            placeHolder="Select a Template"
            label="Message Template:"
            onChanged={this._newBulkTemplateChanged}
            id="Basicdrop122"
            required={true}
            options={this.state.templates}
          />

          <DialogFooter>
            <PrimaryButton
              disabled={
                this.state.attrDialogOps.bulk.name === '' ||
                !this.state.attrDialogOps.bulk.template
              }
              onClick={this.doCreateNewBulk}
              text="Start"
            />
            <DefaultButton onClick={this.closeBulkDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>

        <Dialog
          hidden={this.state.is_single_dialog_hidden}
          onDismiss={this.closeSingleDialog}
          dialogContentProps={{
            type: DialogType.largeHeader,
            title: 'Send Message',
            subText: (
              <span>
                Send message based on a template. Message will not be queued.
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
            type="number"
            label="Target Cell Phone"
            borderless
            onChanged={this._newSmsPhoneChanged}
            value={this.state.attrDialogOps.single.national_number}
            title="Enter target cellphone number"
            placeholder="9120228207"
            required={true}
          />

          <MSDropdown
            placeHolder="Select a Template"
            label="Message Template:"
            onChanged={this._newSmsTemplateChanged}
            id="Basicdrop122"
            required={true}
            options={this.state.templates}
          />

          <DialogFooter>
            <PrimaryButton
              disabled={
                this.state.attrDialogOps.single.cellphone === 0 ||
                !this.state.attrDialogOps.single.template
              }
              onClick={this.doPostNewSms}
              text="Start"
            />
            <DefaultButton onClick={this.closeSingleDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>
      </Segment>
    )
  }
}

export default Messaging
