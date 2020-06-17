import React from 'react';
import {
  Alert, Button, ButtonGroup, Card, FormControl, FormGroup,
} from 'react-bootstrap';

import Spinner from './Spinner';

const avoidFlickering = async (promise) => {
  const minDelay = 500;
  const results = await Promise.all([
    promise,
    new Promise((resolve) => setTimeout(resolve, minDelay)),
  ]);
  return results[0];
};

class Edit extends React.Component {
  state = {
    text: '',
    error: null,
    modified: false,
    isSaving: false,
    isLoading: true,
    isLoaded: false,
    isDeleting: false,
  };

  async componentDidMount() {
    await this.load();
  }

  onChange = (e) => {
    this.setState({
      text: e.currentTarget.value,
      modified: true,
    });
  };

  onSave = async () => {
    const { text } = this.state;
    const { session } = this.props;
    this.setState({ modified: false, isSaving: true });
    try {
      await avoidFlickering(session.saveText(text));
      this.setState({ isSaving: false });
    } catch (err) {
      console.error(err);
      this.setState({ error: err.toString(), isSaving: false });
    }
  };

  onBackClicked = (e) => {
    e.preventDefault();
    this.props.history.push('/');
  };

  onDeleteClicked = async (e) => {
    this.setState({ isDeleting: true });
    const { session } = this.props;

    e.preventDefault();
    try {
      await avoidFlickering(session.delete());
      this.setState({ isDeleting: false, text: '' });
    } catch (err) {
      console.error(err);
      this.setState({ error: err.toString(), isDeleting: false });
    }
  };

  onShareClicked = async () => {
    await this.onSave();
    this.props.history.push('/share');
  };

  async load() {
    const { session } = this.props;
    const { user } = session;
    this.setState({ isLoading: true });
    try {
      const text = await session.loadTextFromUser(user.id);
      this.setState({ text, isLoading: false, isLoaded: true });
    } catch (e) {
      console.error(e);
      this.setState({ error: e.toString(), isLoading: false, isLoaded: true });
    }
  }

  render() {
    const {
      error, isLoading, isLoaded, isSaving, isDeleting,
    } = this.state;
    const disabled = isLoading || !isLoaded || isSaving || isDeleting;

    return (
      <Card>
        <Card.Header id="your-note-heading">My note</Card.Header>
        <Card.Body>
          <form>
            {error && (
              <Alert id="edit-error" variant="danger">
                {error}
              </Alert>
            )}
            <FormGroup id="edit">
              <FormControl
                id="edit-textarea"
                as="textarea"
                onChange={this.onChange}
                value={isLoading ? 'Loading...' : this.state.text}
                rows="12"
                disabled={disabled}
              />
            </FormGroup>
            {this.state.modified ? '*' : null}
            <div className="pull-right">
              {disabled && <Spinner id="edit-spinner" />}
              <ButtonGroup>
                <Button
                  id="delete-button"
                  variant="danger"
                  onClick={this.onDeleteClicked}
                  disabled={disabled}
                >
                  Delete
                </Button>
                <Button
                  id="save-button"
                  variant="success"
                  onClick={this.onSave}
                  disabled={disabled}
                >
                  Save
                </Button>
                <Button
                  id="go-to-share-button"
                  variant="primary"
                  onClick={this.onShareClicked}
                  disabled={disabled}
                >
                  Share
                </Button>
              </ButtonGroup>
            </div>
          </form>
        </Card.Body>
        <Card.Footer>
          <a id="back-link" onClick={this.onBackClicked} href="/">
            &laquo; Back
          </a>
        </Card.Footer>
      </Card>
    );
  }
}

export default Edit;
