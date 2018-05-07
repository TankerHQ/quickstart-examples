// @flow
import React from 'react';
import { Alert, Button, ButtonGroup, FormControl, FormGroup, Panel } from 'react-bootstrap';
import Session from '../Session';

type Props = { session: Session };

type State = {
  text: string,
  error: ?string,
  message: ?string,
}

class Edit extends React.Component<Props, State> {
  state: State = {
    text: '',
    error: null,
    message: null,
  }

  async componentWillMount() {
    await this.load();
  }

  async load() {
    try {
      const text = await this.props.session.loadText();
      this.setState({ text });
    } catch (e) {
      this.setState({ error: e.message });
    }
  }

  onChange = (e) => {
    this.setState({ error: null, message: null, text: e.target.value });
  }

  onSave = () => {
    const { text } = this.state;
    const { session } = this.props;
    return session.saveText(text);
  }

  onLoad = async () => {
    await this.load();
  }

  onBackClicked = (event) => {
    event.preventDefault();
    this.props.onHome();
  }

  onShareClicked = async () => {
    const resourceId = await this.onSave();
    this.props.onShare(resourceId)
  }

  render() {
    const { error, message } = this.state;

    return (
      <Panel>
        <Panel.Heading>Your Story</Panel.Heading>
        <Panel.Body>
          <form className="form-signin">
            {error && <Alert bsStyle="danger">{error}</Alert>}
            {message && <Alert bsStyle="info">{message}</Alert>}
            <FormGroup id="edit">
              <FormControl componentClass="textarea" onChange={this.onChange} value={this.state.text} />
            </FormGroup>
            <ButtonGroup>
              <Button bsStyle="primary" onClick={this.onSave}>Save</Button>
              <Button bsStyle="info" onClick={this.onShareClicked}>Share</Button>
              <Button onClick={this.onLoad}>Load</Button>
            </ButtonGroup>
            <br /> <br />
            <a onClick={this.onBackClicked} href="/">&laquo; Back</a>
          </form>
        </Panel.Body>
      </Panel>
    );
  }
}

export default Edit;
