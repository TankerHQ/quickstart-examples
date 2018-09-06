import { Alert, Panel } from "react-bootstrap";
import React from "react";

class ViewNote extends React.Component {
  state = { text: "", error: null, isLoading: true };

  componentWillMount() {
    // FIXME: need to abort if onBackClicked is fired before
    // load is done
    this.load();
  }

  onBackClicked = event => {
    event.preventDefault();
    this.props.history.push("/");
  };

  async load() {
    const { session } = this.props;
    const { friendId } = this.props.match.params;

    this.setState({ isLoading: true });
    try {
      const text = await session.loadTextFromUser(friendId);
      this.setState({ text, error: null, isLoading: false });
    } catch (error) {
      console.error(error);
      this.setState({ text: "", error: error.toString(), isLoading: false });
    }
  }

  render() {
    const { friendEmail } = this.props.match.params;
    const { text, error, isLoading } = this.state;
    return (
      <div>
        <Panel>
          <Panel.Heading id="note-from-friend-heading">Note from {friendEmail}</Panel.Heading>
          <Panel.Body>
            {error && <Alert bsStyle="danger">{error}</Alert>}
            {isLoading && (
              <Alert id="view-loading" bsStyle="info">
                Loading...
              </Alert>
            )}
            <p id="view-textarea" style={{ whiteSpace: "pre-line" }}>
              {text}
            </p>
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
