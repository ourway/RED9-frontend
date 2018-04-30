import React, { Component } from 'react'
import store from 'store'
import swal from 'sweetalert2'
import { Segment, Statistic, Button } from 'semantic-ui-react'
import { CompoundButton, IButtonProps } from 'office-ui-fabric-react/lib/Button'
import { Label } from 'office-ui-fabric-react/lib/Label'
import {
  getTemplates,
  getMessageQueue,
  deleteMessageQueue,
  sendSmsWithoutCharge,
  postNewBulkToSubs
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

  doCreateNewBulk = () => {
    const data = {
      message: this.state.attrDialogOps.bulk.message,
      template: this.state.attrDialogOps.bulk.template
    }

    postNewBulkToSubs(this.state.apikey, data).then(resp => {
      this.closeBulkDialog()
      if (resp.status === 200) {
        resp.json().then(data => {
          this.setState({ inqueue: data.count })
          swal({
            position: 'center',
            type: 'success',
            title: 'Congrats!',
            text: `Your bulk is queued (${data.count} messages)`,
            showConfirmButton: false,
            timer: 2000
          })
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
                <Button size="mini" color="red" icon="stop" />
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
