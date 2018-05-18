import React from "react";
import { Button, Panel, Alert } from "react-bootstrap";
import UserList from "./UserList";
import Session from "../../Session";

const withoutMe = (me, elements) => elements.filter(e => e !== me);

type Props = {
  session: Session,
  history: Object
};

type State = {
  users: string[],
  selected: Set,
  error: ?string,
  isLoading: boolean,
  isSharing: boolean
};

class Share extends React.Component<Props, State> {
  state = {
    users: [], //all the users
    selected: new Set(), // the new selection
    isLoading: true,
    error: null,
    isSharing: false
  };

  componentWillMount = async () => {
    const { session } = this.props;
    try {
      const [users, recipients] = await Promise.all([
        session.getUsers(),
        session.getNoteRecipients()
      ]);
      this.setState({
        isLoading: false,
        users: withoutMe(session.userId, users),
        selected: new Set(withoutMe(session.userId, recipients)),
        error: null
      });
    } catch (err) {
      console.error(err);
      this.setState({ isLoading: false, error: err.toString() });
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
    this.props.history.goBack();
  };

  onShareClicked = async () => {
    const { session } = this.props;
    const { selected } = this.state;
    this.setState({ error: null, isSharing: true });
    try {
      const recipients = Array.from(selected.values());
      await session.share(recipients);
      this.setState({ isSharing: false });
      this.props.history.goBack();
    } catch (err) {
      console.error(err);
      this.setState({ error: err.toString(), isSharing: false });
    }
  };

  render() {
    const { users, selected, error, isLoading } = this.state;
    return (
      <Panel>
        <Panel.Heading>Share</Panel.Heading>
        <Panel.Body>
          {error && <Alert bsStyle="danger">{error}</Alert>}
          {isLoading && <Alert bsStyle="info">Loading...</Alert>}
          <UserList users={users} selected={selected} onToggle={this.onToggle} />
          <Button
            bsStyle="primary"
            className="pull-right"
            onClick={this.onShareClicked}
            active={!this.state.isSharing}
          >
            {this.state.isSharing ? "Sharing..." : "Share"}
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
