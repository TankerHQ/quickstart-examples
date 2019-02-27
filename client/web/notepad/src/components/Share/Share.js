import React from "react";
import { Button, Panel, Alert } from "react-bootstrap";
import UserList from "./UserList";

const withoutMe = (myId, elements) => elements.filter(e => e.id !== myId);

class Share extends React.Component {
  state = {
    users: [], //all the users
    selectedUserIds: new Set(), // the new selection
    isLoading: true,
    isLoaded: false,
    isSharing: false,
    error: null,
  };

  componentDidMount = async () => {
    const { session } = this.props;
    try {
      const [users, recipients] = await Promise.all([
        session.getUsers(),
        session.getNoteRecipients(),
      ]);
      this.setState({
        isLoading: false,
        isLoaded: true,
        users: withoutMe(session.user.id, users),
        selectedUserIds: new Set(withoutMe(session.user.id, recipients).map(user => user.id)),
        error: null,
      });
    } catch (err) {
      console.error(err);
      this.setState({ isLoading: false, error: err.toString(), isLoaded: true });
    }
  };

  onToggle = (userId, checked) => {
    const { selectedUserIds } = this.state;
    if (checked) {
      selectedUserIds.add(userId);
    } else {
      selectedUserIds.delete(userId);
    }
    this.setState({ selectedUserIds });
  };

  onBackClicked = event => {
    event.preventDefault();
    this.props.history.push("/edit");
  };

  onShareClicked = async () => {
    const { session } = this.props;
    const { selectedUserIds } = this.state;
    this.setState({ error: null, isSharing: true });
    try {
      const recipients = Array.from(selectedUserIds.values());
      await session.share(recipients);
      this.setState({ isSharing: false });
      this.props.history.push("/edit");
    } catch (err) {
      console.error(err);
      this.setState({ error: err.toString(), isSharing: false });
    }
  };

  render() {
    const { users, selectedUserIds, error, isLoading, isLoaded, isSharing } = this.state;
    return (
      <Panel>
        <Panel.Heading id="share-heading">Share</Panel.Heading>
        <Panel.Body>
          {error && (
            <Alert id="share-error" bsStyle="danger">
              {error}
            </Alert>
          )}
          {isLoading && (
            <Alert id="share-loading" bsStyle="info">
              Loading...
            </Alert>
          )}
          <UserList users={users} selectedUserIds={selectedUserIds} onToggle={this.onToggle} />
          <Button
            id="share-button"
            bsStyle="primary"
            className="pull-right"
            onClick={this.onShareClicked}
            disabled={isSharing || !isLoaded}
          >
            {isSharing ? "Sharing..." : "Share"}
          </Button>
        </Panel.Body>
        <Panel.Footer>
          <a onClick={this.onBackClicked} href="/">
            &laquo; Back
          </a>
        </Panel.Footer>
      </Panel>
    );
  }
}

export default Share;
