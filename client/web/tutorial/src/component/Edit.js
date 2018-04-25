// @flow
import React from 'react';
import { withRouter } from 'react-router';
import { Alert, Button, ButtonGroup, FormControl, FormGroup, ControlLabel } from 'react-bootstrap';
import Session from '../Session';

type Props = {
  session: Session,
  history: any,
};

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

  Load = async () => {
    const { session } = this.props;
    try {
      const text = await session.loadText();
      this.setState({ text });
    } catch (e) {
      this.setState({ error: e.message });
    }
  }

  async componentWillMount() {
    const { session, history } = this.props;
    if (!session.isOpen()) {
      history.push('/login');
      return;
    }
    await this.Load();
  }

  handleTextChange = (e) => {
    this.setState({ error: null, message: null, text: e.target.value });
  }

  onSave = async () => {
    const { text } = this.state;
    const { session } = this.props;
    await session.saveText(text);
  }

  onLoad = async () => {
    await this.Load();
  }

  render() {
    const { error, message } = this.state;
    return (
      <form action="#" onSubmit={() => {}} className="form-signin">
        <FormGroup >
          <ControlLabel>Your Story</ControlLabel>
          <FormControl componentClass="textarea" onChange={this.handleTextChange} value={this.state.text} />
        </FormGroup>
        <ButtonGroup>
          <Button bsStyle="primary" onClick={this.onSave}>Save</Button>
          <Button onClick={this.onLoad}>Load</Button>
        </ButtonGroup>
        <div className="Alert-spacer">
          { error && <Alert bsStyle="danger">{error}</Alert> }
          { message && <Alert bsStyle="info">{message}</Alert> }
        </div>
      </form>
    );
  }
}

export default withRouter(Edit);
