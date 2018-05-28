import React from "react";
import { Button, Panel, Alert } from "react-bootstrap";
import UserList from "./UserList";

const withoutMe = (me, elements) => elements.filter(e => e !== me);

class Share extends React.Component {
  state = {
    users: [], //all the users
    selected: new Set(), // the new selection
    isLoading: true,
    isLoaded: false,
    isSharing: false,
    error: null,
  };

  componentWillMount = async () => {
    const { session } = this.props;
    try {
      const [users, recipients] = await Promise.all([
        session.getUsers(),
        session.getNoteRecipients(),
      ]);
      this.setState({
        isLoading: false,
        isLoaded: true,
        users: withoutMe(session.userId, users),
        selected: new Set(withoutMe(session.userId, recipients)),
        error: null,
      });
    } catch (err) {
      console.error(err);
      this.setState({ isLoading: false, error: err.toString(), isLoaded: true });
    }
  };

  onToggle = (user, checked) => {
    const { selected } = this.state;
    if (checked) {
      selected.add(user);
    } else {
      selected.delete(user);
    }
    this.setState({ selected });
  };

  onBackClicked = event => {
    event.preventDefault();
    this.props.history.push("/edit");
  };

  onShareClicked = async () => {
    const { session } = this.props;
    const { selected } = this.state;
    this.setState({ error: null, isSharing: true });
    try {
      const recipients = Array.from(selected.values());
      await session.share(recipients);
      this.setState({ isSharing: false });
      this.props.history.push("/edit");
    } catch (err) {
      console.error(err);
      this.setState({ error: err.toString(), isSharing: false });
    }
  };

  render() {
    const { users, selected, error, isLoading, isLoaded, isSharing } = this.state;
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
          <UserList users={users} selected={selected} onToggle={this.onToggle} />
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
