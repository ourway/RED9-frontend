import React, { Component } from 'react'
import store from 'store'
import sample from 'lodash/sample'
import { distinctUntilChanged, debounceTime } from 'rxjs/operators'

import {
  Button,
  Icon,
  Table,
  Form,
  Segment,
  Label,
  Dimmer,
  Popup,
  Loader
} from 'semantic-ui-react'

import { env } from './config'
import swal from 'sweetalert2'
import { onFilter$, toggleFormEdit$, changeColorCode$ } from './utils'

import {
  Dialog,
  DialogType,
  DialogFooter
} from 'office-ui-fabric-react/lib/Dialog'

import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button'
import { ChoiceGroup } from 'office-ui-fabric-react/lib/ChoiceGroup'

import { TextField } from 'office-ui-fabric-react/lib/TextField'

import { getClientAuthHeaders } from './apis'
import {
  MessageBar,
  MessageBarType
} from 'office-ui-fabric-react/lib/MessageBar'

class Red9Form extends Component {
  constructor(props) {
    super(props)
    const colorCode = props.data.colorCode
      ? props.data.colorCode
      : sample(env.colorset)
    const data = {
      ...props.data,
      colorCode: colorCode
    }
    this.state = {
      filter: '',
      deactivationBox: false,
      activationBox: false,
      isLoading: true,
      colorCode: colorCode,
      isHidden: props.editable === true,
      field_params: props.field_params,
      original_field_params: props.field_params,
      data: data,
      attrDialogOps: {
        is_hidden: true,
        type: 'string',
        key: '',
        value: '',
        targetAttribute: null
      },
      changeSet: props.data.colorCode ? [] : ['colorCode'],
      is_saving: false,
      original_data: props.data
    }

    this.handleValueChange = this.handleValueChange.bind(this)
    this.handleSaveChanges = this.handleSaveChanges.bind(this)
    this.doUpdate = this.doUpdate.bind(this)
    this.deactivate = this.deactivate.bind(this)
    this.hideDeactivate = this.hideDeactivate.bind(this)
    this.doDeactivate = this.doDeactivate.bind(this)

    this.activate = this.activate.bind(this)
    this.hideActivate = this.hideActivate.bind(this)
    this.doActivate = this.doActivate.bind(this)
  }

  handleSaveChanges = () => {
    this.setState({
      is_saving: true
    })
    let uuidKey = store.get('apikey')
    if (this.props.scope === 'client') {
      uuidKey = store.get('uuid')
    }
    const authHeaders = getClientAuthHeaders(atob(uuidKey))

    let opts = {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(this.state.data)
      //mode: 'cors',
      //cache: 'default'
    }
    const req = fetch(this.props.endpoint, opts)
    req.then(resp => {
      if (resp.ok === true) {
        resp.json().then(result => {
          if (!swal.isVisible()) {
            swal({
              position: 'center',
              type: 'success',
              title: `${resp.status}`,
              text: `${result.message}`,
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              this.setState({
                is_saving: false
              })
            })
          }
        })

        this.setState({
          original_data: this.state.data,
          changeSet: []
        })
      } else {
        swal({
          position: 'center',
          type: 'error',
          title: `${resp.status}`,
          text: `Something went wrong`,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          this.setState({
            is_saving: false
          })
        })
      }
    })
  }

  OpenAttrDialog = (e, m) => {
    this.setState({
      attrDialogOps: {
        is_hidden: false,
        type: 'string',
        key: '',
        value: '',
        targetAttribute: m.targetattr
      }
    })
  }

  CloseAttrDialog = () => {
    this.setState({
      attrDialogOps: {
        is_hidden: true,
        type: 'string',
        key: '',
        value: '',
        targetAttribute: null
      }
    })
  }

  attrDialogValueChanged = value => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        value:
          this.state.attrDialogOps.type === 'string'
            ? value.toString()
            : isNaN(parseInt(value, 10))
            ? 0
            : parseInt(value, 10)
      }
    })
  }

  doUpdate() {
    if (!this.state.attrDialogOps.targetAttribute) {
      this.setState({
        data: {
          ...this.state.data,
          [this.state.attrDialogOps.key]: this.state.attrDialogOps.value
        },
        changeSet: [...this.state.changeSet, this.state.attrDialogOps.key]
      })
    } else {
      this.setState({
        data: {
          ...this.state.data,
          [this.state.attrDialogOps.targetAttribute]: {
            ...this.state.data[this.state.attrDialogOps.targetAttribute],
            [this.state.attrDialogOps.key]: this.state.attrDialogOps.value
          }
        },
        changeSet: [...this.state.changeSet, this.state.attrDialogOps.key]
      })
    }
    this.CloseAttrDialog()
  }

  attrDialogKeyChanged = key => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        key: key
          .toString()
          .replace(' ', '_')
          .toLowerCase()
          .trim()
      }
    })
  }

  AttrDialogTypeChanged = (e, option) => {
    this.setState({
      attrDialogOps: {
        ...this.state.attrDialogOps,
        type: option.key
      }
    })
  }

  addAttrDialog = () => {
    return (
      <Dialog
        hidden={this.state.attrDialogOps.is_hidden}
        disabled={true}
        onDismiss={this.CloseAttrDialog}
        dialogContentProps={{
          title: `Add an attribute ${
            this.state.attrDialogOps.targetAttribute
              ? 'to ' + this.state.attrDialogOps.targetAttribute
              : ''
          }`,
          subText: `Be carefull.  Large data values may effect your service performance.`
        }}
      >
        <ChoiceGroup
          label="Value Type:"
          selectedKey={this.state.attrDialogOps.type}
          options={[
            {
              key: 'string',
              text: 'Text'
            },
            {
              key: 'number',
              text: 'Number'
            }
          ]}
          onChange={this.AttrDialogTypeChanged}
        />

        <br />

        <TextField
          onChange={this.attrDialogKeyChanged}
          prefix="Key"
          description="No spaces, -, digits, ... "
          value={this.state.attrDialogOps.key}
        />
        <br />
        <TextField
          prefix="Value"
          onChange={this.attrDialogValueChanged}
          disabled={this.state.attrDialogOps.key === ''}
          description={`Avoid large ${this.state.attrDialogOps.type}s`}
          value={this.state.attrDialogOps.value}
        />
        <br />

        <DialogFooter>
          <PrimaryButton
            onClick={this.doUpdate}
            text="Add"
            disabled={
              this.state.attrDialogOps.key === '' ||
              this.state.attrDialogOps.value === ''
            }
          />
          <DefaultButton onClick={this.CloseAttrDialog} text="Cancel" />
        </DialogFooter>
      </Dialog>
    )
  }

  hideDeactivate = () => {
    this.setState({ deactivationBox: false })
  }

  deactivate = () => {
    this.setState({ deactivationBox: true })
    //let uuidKey = store.get('uuid');
    // this.props.deactivation_api(atob(uuidKey), this.state.data)
  }

  doDeactivate = () => {
    let uuidKey = store.get('uuid')
    this.props.deactivation_api(atob(uuidKey), this.state.data)
    this.setState({
      data: {
        ...this.state.data,
        meta: {
          ...this.state.data.meta,
          is_active: false
        }
      }
    })
    this.hideDeactivate()
  }

  hideActivate = () => {
    this.setState({ activationBox: false })
  }

  activate = () => {
    this.setState({ activationBox: true })
    //let uuidKey = store.get('uuid');
    // this.props.deactivation_api(atob(uuidKey), this.state.data)
  }

  doActivate = () => {
    let uuidKey = store.get('uuid')
    this.props.activation_api(atob(uuidKey), this.state.data)
    this.setState({
      data: {
        ...this.state.data,
        meta: {
          ...this.state.data.meta,
          is_active: true
        }
      }
    })
    this.hideActivate()
  }

  // This is the main function to update and handle value changes
  handleValueChange = e => {
    let value = e.target.value.trim().toString()
    const name = e.target.name
    if (e.target.type === 'number') {
      value = parseInt(value, 10)
    }

    let newData = {}

    if (name.indexOf('|') > 0) {
      newData = {
        ...this.state.data,
        [name.split('|')[0]]: {
          ...this.state.data[name.split('|')[0]],
          [name.split('|')[1]]: value
        }
      }

      if (!value) {
        if (!this.state.data[name.split('|')[0]]) {
          value = this.state.data[name.split('|')[1]]
        }
      }

      //ES6 nice to learn
      if (
        value ===
        this.state.original_data[name.split('|')[0]][name.split('|')[1]]
      ) {
        this.setState(prevState => ({
          changeSet: prevState.changeSet.filter(i => i !== name)
        }))
      } else {
        this.setState(prevState => ({
          changeSet: [...prevState.changeSet, name]
        }))
      }
    } else {
      newData = {
        ...this.state.data,
        [name]: value
      }

      if (!value) {
        if (!this.state.original_data[name]) {
          value = this.state.original_data[name]
        }
      }

      //ES6 nice to learn
      if (value === this.state.original_data[name]) {
        this.setState(prevState => ({
          changeSet: prevState.changeSet.filter(i => i !== name)
        }))
      } else {
        this.setState(prevState => ({
          changeSet: [...prevState.changeSet, name]
        }))
      }
    }

    this.setState({
      data: newData
    })

    //console.log(this.state.data)
  }

  componentWillUnmount() {
    this.filterSubscription.unsubscribe()
    this.editableFormSubscription.unsubscribe()
  }

  componentDidMount() {
    changeColorCode$.next(this.state.colorCode)
    this.editableFormSubscription = toggleFormEdit$
      .pipe(debounceTime(50))
      .subscribe(target => {
        if (target.meta.uuid === this.state.data.meta.uuid) {
          this.setState({ isHidden: !this.state.isHidden })
        }
      })

    this.filterSubscription = onFilter$
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(debounced => {
        if (!debounced) {
          this.setState({
            data: this.state.original_data,
            filter: ''
          })
        } else {
          this.setState({
            data: {
              filter: debounced,
              ...Object.keys(this.state.original_data)
                .filter(sp => {
                  const pat = RegExp(debounced.toLowerCase())
                  return sp.match(pat)
                })
                .reduce((o, val) => {
                  o[val] = this.state.data[val]
                  return o
                }, {}),
              meta: this.state.original_data.meta
            }
          })
        }
      })
    this.setState({ isLoading: false })
  }

  render() {
    return (
      <Segment
        loading={this.state.isLoading === true}
        inverted
        basic
        disabled={this.state.data.meta.is_active === false}
        style={{ padding: 0 }}
      >
        {this.state.data.meta.is_active === false ? (
          <MessageBar
            messageBarType={MessageBarType.blocked}
            style={{ color: 'grey' }}
          >
            This service has been deactivated. Reactivation of a service is
            might be problematic in some cases. Please
            <a className="dark" href={`mailto:${env.company_email}`}>
              <b>{env.company} support team</b>
            </a>{' '}
            for more information
          </MessageBar>
        ) : null}

        <Dialog
          hidden={this.state.deactivationBox === false}
          onDismiss={this._closeDialog}
          dialogContentProps={{
            type: DialogType.error,
            title: 'Are you really sure?',
            subText: 'Please make sure what you are doing is correct.'
          }}
          modalProps={{
            titleAriaId: 'Form.Deactivation',
            subtitleAriaId: 'Form.DeactivationSubtitle',
            isBlocking: false,
            containerClassName: 'ms-dialogMainOverride ms-slideLeftIn40'
          }}
        >
          {
            null /** You can also include null values as the result of conditionals */
          }
          <DialogFooter>
            <PrimaryButton onClick={this.doDeactivate} text="Deactivate" />
            <DefaultButton onClick={this.hideDeactivate} text="Cancel" />
          </DialogFooter>
        </Dialog>

        <Dialog
          hidden={this.state.activationBox === false}
          onDismiss={this._closeDialog}
          dialogContentProps={{
            type: DialogType.success,
            title: 'Are you really sure?',
            subText: 'Please make sure what you are doing is correct.'
          }}
          modalProps={{
            titleAriaId: 'Form.Activation',
            subtitleAriaId: 'Form.ActivationSubtitle',
            isBlocking: false,
            containerClassName: 'ms-dialogMainOverride ms-slideLeftIn40'
          }}
        >
          {
            null /** You can also include null values as the result of conditionals */
          }
          <DialogFooter>
            <PrimaryButton onClick={this.doActivate} text="Activate" />
            <DefaultButton onClick={this.hideActivate} text="Cancel" />
          </DialogFooter>
        </Dialog>

        <Table
          celled
          selectable
          compact
          structured
          inverted
          className={`red9form ${this.state.isHidden ? 'hidden' : ''}`}
        >
          <Table.Header fullWidth>
            <Table.Row>
              <Table.HeaderCell>Parameter</Table.HeaderCell>
              <Table.HeaderCell>Value</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Description</Table.HeaderCell>
              <Table.HeaderCell>Operator/Gateway</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {Object.keys(this.state.data)
              .filter(i => i !== 'meta')
              .map(param => {
                const paramValue = this.state.data[param]
                const _t = typeof paramValue
                const paramType = paramValue === null ? '' : _t
                const targetParamField = this.state.field_params.filter(
                  i => i.name === param
                )[0]
                return (
                  <Table.Row key={param}>
                    <Table.Cell width={2}>
                      <span className="paramName">{param}</span>
                    </Table.Cell>
                    <Table.Cell width={7}>
                      <Form>
                        {typeof paramValue === 'object' &&
                        paramValue !== null ? (
                          <Form.Group grouped>
                            {Object.keys(paramValue).map(p => {
                              return (
                                <Form.Field key={p}>
                                  <Label
                                    horizontal
                                    ribbon
                                    color="grey"
                                    content={p}
                                  />
                                  <Form.Input
                                    name={`${param}|${p}`}
                                    relatedkey={p}
                                    className={
                                      this.state.changeSet.includes(
                                        `${param}|${p}`
                                      )
                                        ? 'property small changed'
                                        : 'property small'
                                    }
                                    onChange={this.handleValueChange}
                                    placeholder="any idea?"
                                    value={
                                      paramValue[p] ||
                                      (typeof paramValue[p] === 'number'
                                        ? 0
                                        : '')
                                    }
                                  />
                                </Form.Field>
                              )
                            })}

                            <Popup
                              size="mini"
                              position="bottom right"
                              trigger={
                                <Button
                                  floated="right"
                                  icon
                                  labelPosition="left"
                                  color="black"
                                  size="mini"
                                  targetattr={param}
                                  onClick={(e, m) => this.OpenAttrDialog(e, m)}
                                >
                                  <Icon name="add" /> Add Attribute{' '}
                                </Button>
                              }
                              header="New Attribute"
                              content={`Click to add a new attribute to ${param}`}
                              on={['hover', 'click']}
                            />
                          </Form.Group>
                        ) : (
                          <Form.Group grouped>
                            {param === 'colorCode' ? (
                              <Icon
                                name="square"
                                size="large"
                                style={{ color: paramValue }}
                              />
                            ) : null}
                            <Form.Input
                              type={paramType}
                              className={
                                this.state.changeSet.includes(param)
                                  ? 'property changed'
                                  : 'property'
                              }
                              value={
                                paramValue || (paramType === 'number' ? 0 : '')
                              }
                              onChange={this.handleValueChange}
                              name={param}
                              placeholder={
                                targetParamField
                                  ? targetParamField.placeholder
                                  : null
                              }
                              disabled={this.state.filter !== ''}
                            />
                          </Form.Group>
                        )}
                      </Form>
                    </Table.Cell>
                    <Table.Cell width={1}>
                      <code>{paramType}</code>
                    </Table.Cell>
                    <Table.Cell width={4}>
                      <p>
                        {targetParamField ? targetParamField.description : null}
                      </p>
                    </Table.Cell>
                    <Table.Cell collapsing color="blue">
                      {targetParamField
                        ? targetParamField.gateway.map(g => {
                            return <em key={g}>{g} &nbsp;</em>
                          })
                        : null}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
          </Table.Body>

          <Table.Footer fullWidth>
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell colSpan="16">
                {this.state.data.meta.is_active === true ? (
                  <Button
                    floated="right"
                    icon
                    labelPosition="left"
                    color="grey"
                    onClick={this.deactivate}
                    size="small"
                  >
                    <Icon name="pause circle outline" /> Deactivate{' '}
                    {this.props.form_name}
                  </Button>
                ) : (
                  <Button
                    floated="right"
                    icon
                    labelPosition="left"
                    color="green"
                    onClick={this.activate}
                    size="small"
                  >
                    <Icon name="play circle outline" /> Activate{' '}
                    {this.props.form_name}
                  </Button>
                )}

                {this.props.has_add_attribute === true ? (
                  <Popup
                    size="mini"
                    trigger={
                      <Button
                        icon
                        labelPosition="left"
                        color="black"
                        size="small"
                        onClick={this.OpenAttrDialog}
                      >
                        <Icon name="add" /> Add Attribute{' '}
                      </Button>
                    }
                    header="New Attribute"
                    content={`Click to add a new attribute to this ${
                      this.props.form_name
                    }`}
                    on={['hover', 'click']}
                  />
                ) : null}

                <Button
                  onClick={this.handleSaveChanges}
                  icon
                  disabled={
                    this.state.changeSet.length === 0 ||
                    this.state.data.meta.is_active === false
                  }
                  size="small"
                  color="green"
                >
                  <Icon name="save" /> Save Changes
                </Button>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>

        <Dimmer active={this.state.is_saving === true}>
          <Loader indeterminate>
            <h3>
              Saving changing to database <br />
              Please wait ...
            </h3>
          </Loader>
        </Dimmer>

        {this.addAttrDialog()}
      </Segment>
    )
  }
}

export default Red9Form
