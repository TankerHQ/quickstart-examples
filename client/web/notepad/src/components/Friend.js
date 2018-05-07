import { Alert, FormControl, Panel } from 'react-bootstrap';
import React from 'react';

class Friend extends React.Component {
  state = { text: '', error: '' };

  async load() {
    const { session, friend } = this.props;
    try {
      const text = await session.loadTextFromUser(friend);
      this.setState({ text });
    } catch (error) {
      this.setState({ text: '', error: error.message });
    }
  }

  componentWillMount() {
    // FIXME: need to abort if onBackClicked is fired before
    // load is done
    this.load();
  }

  onBackClicked = (event) => {
    event.preventDefault();
    this.props.onHome();
  }

  render() {
    const { friend } = this.props;
    const { text, error } = this.state;
    return (
      <div>
        <Panel>
          <Panel.Heading>Note from {friend}</Panel.Heading>
          <Panel.Body>
            {error && <Alert bsStyle="danger">{error}</Alert>}
            <FormControl disabled componentClass="textarea" value={text} />
            <br />
            <a onClick={this.onBackClicked} href="/">&laquo; Back</a>
          </Panel.Body>
        </Panel>
      </div>
    );
  }
}

export default Friend;
