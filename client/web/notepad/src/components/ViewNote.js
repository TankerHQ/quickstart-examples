import {Alert, FormControl, Panel} from 'react-bootstrap';
import React from 'react';

class ViewNote extends React.Component {
  state = {text: '', error: '', loading: true};

  async load() {
    const {session} = this.props;
    const {friendId} = this.props.match.params;

    this.setState({loading: true});
    try {
      const text = await session.loadTextFromUser(friendId);
      this.setState({text, loading: false});
    } catch (error) {
      console.error(error);
      this.setState({text: '', error: error.toString(), loading: false});
    }
  }

  componentWillMount() {
    // FIXME: need to abort if onBackClicked is fired before
    // load is done
    this.load();
  }

  onBackClicked = event => {
    event.preventDefault();
    this.props.history.goBack();
  };

  render() {
    const {friendId} = this.props.match.params;
    const {text, error, loading} = this.state;
    return (
      <div>
        <Panel>
          <Panel.Heading>Note from {friendId}</Panel.Heading>
          <Panel.Body>
            {error && <Alert bsStyle="danger">{error}</Alert>}
            {loading && <Alert bsStyle="info">Loading...</Alert>}
            <FormControl
              disabled
              componentClass="textarea"
              value={text}
              rows="12"
            />
          </Panel.Body>
          <Panel.Footer>
            <a onClick={this.onBackClicked} href="/">
              &laquo; Back
            </a>
          </Panel.Footer>
        </Panel>
      </div>
    );
  }
}

export default ViewNote;
