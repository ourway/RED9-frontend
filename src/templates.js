import React, { Component } from 'react';
import swal from 'sweetalert2';
import Rx from 'rxjs/Rx';
import {
  Table,
  Menu,
  Input,
  TextArea,
  Button,
  Segment
} from 'semantic-ui-react';
import { getTemplates, updateTemplate, deleteTemplate } from './apis';
import store from 'store';
import { titleChangeSignal } from './utils';

const filter$ = new Rx.Subject();

class Templates extends Component {
  constructor(props) {
    super(props);
    this.state = {
      templates: [],
      original_templates: [],
      ref_templates: [],
      is_fetching: false,
      filter: ''
    };
    this._getTemplates = this._getTemplates.bind(this);
  }

  _getTemplates = () => {
    this.setState({ is_fetching: true });
    const uuidKey = store.get('uuid');
    getTemplates(atob(uuidKey)).then(resp => {
      if (resp.status === 200) {
        resp.json().then(data => {
          this.setState({
            templates: data.templates,
            original_templates: data.templates,
            ref_templates: data.templates,
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

  _handleDeleteTemplate = t => {
    const uuidKey = store.get('uuid');
    deleteTemplate(atob(uuidKey), t.name).then(resp => {
      switch (resp.status) {
        case 500:
          swal({
            position: 'center',
            type: 'error',
            title: 'Opps',
            text: `Seems Template is not removable (May be you have used this)`,
            showConfirmButton: true,
            timer: 5000
          }).then(() => {
            this._getTemplates();
          });

          break;
        default:
          swal({
            position: 'center',
            type: 'success',
            title: 'Done',
            text: `The removal process was seccessful`,
            showConfirmButton: true,
            timer: 1000
          }).then(() => {
            this._getTemplates();
          });

          break;
      }
    });
  };

  _handleBodyChange = (o, v, i, t) => {
    const val = v.value;
    let newList = [
      ...this.state.templates.slice(0, i),
      { ...t, body: val },
      ...this.state.templates.slice(i + 1)
    ];
    this.setState({ templates: newList });
  };

  _handleUpdateTemplate = (t, i) => {
    this.setState({ is_fetching: true });
    const uuidKey = store.get('uuid');
    updateTemplate(atob(uuidKey), t)
      .then(resp => {
        if (resp.status === 202) {
          const val = t.body;
          let newList = [
            ...this.state.original_templates.slice(0, i),
            { ...t, body: val },
            ...this.state.original_templates.slice(i + 1)
          ];
          this.setState({
            original_templates: newList,
            ref_templates: newList
          });
        }
      })
      .then(() => {
        this.setState({ is_fetching: false });
      });
  };

  componentDidMount() {
    titleChangeSignal.next(`Templates`);
    this._getTemplates();
    this.filterSubscribe = filter$

      .distinctUntilChanged()
      .debounceTime(500)

      .subscribe(v => {
        const newList = this.state.ref_templates.filter(t => {
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
          templates: newList,
          original_templates: newList
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
              title="Click to add a new template"
              name="Add a new template"
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
                placeholder="Filter templates ..."
              />
            </Menu.Item>
          </Menu.Menu>
        </Menu>

        <Table inverted celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={1} />
              <Table.HeaderCell width={2}>Template Name</Table.HeaderCell>
              <Table.HeaderCell width={7}>Body / Message</Table.HeaderCell>
              <Table.HeaderCell width={1}>-</Table.HeaderCell>
              <Table.HeaderCell width={2}>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {this.state.templates.map((t, i) => {
              return (
                <Table.Row key={t.name} className="formRow">
                  <Table.Cell>
                    <code> {i + 1} </code>
                  </Table.Cell>

                  <Table.Cell>
                    <code> {t.name} </code>
                  </Table.Cell>
                  <Table.Cell collapsing>
                    <TextArea
                      style={{
                        backgroundColor:
                          this.state.original_templates[i].body === t.body
                            ? '#222'
                            : '#381717',
                        color: '#f8f8f8',
                        border: 'none',
                        padding: 5,
                        opacity: 0.9,
                        width: '100%',
                        direction: 'rtl',
                        textAlign: 'justify'
                      }}
                      value={t.body}
                      autoHeight
                      onChange={(o, v) => this._handleBodyChange(o, v, i, t)}
                      placeholder="message body to be used in message/reaction"
                      rows={1}
                    />
                  </Table.Cell>
                  <Table.Cell />
                  <Table.Cell>
                    <div>
                      <Button
                        className="deleteButton"
                        onClick={() => this._handleDeleteTemplate(t, i)}
                        circular
                        secondary
                        floated="right"
                        icon="remove"
                        size="mini"
                      />

                      {this.state.original_templates[i].body !== t.body ? (
                        <Button
                          onClick={() => this._handleUpdateTemplate(t, i)}
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

export default Templates;
