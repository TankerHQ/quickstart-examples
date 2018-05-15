import {Button, Checkbox, Panel, Alert} from 'react-bootstrap';
import React from 'react';

class UserList extends React.Component {
  renderRow = user => {
    const {onToggle} = this.props;
    const active = this.props.selected.has(user);
    return (
      <Checkbox
        key={user}
        onChange={event => {
          onToggle(user, event.target.checked);
        }}
        checked={active}
      >
        {user}
      </Checkbox>
    );
  };

  render() {
    return <div>{this.props.users.map(this.renderRow)}</div>;
  }
}

const withoutMe = (me, elements) => elements.filter(e => e !== me);

class Share extends React.Component {
  state = {
    users: [], //all the users
    recipients: [], // the current recipients
    selected: new Set(), // the new selection
    loading: true,
    error: null,
    isSharing: false,
  };

  componentWillMount = async () => {
    const {session} = this.props;
    try {
      const [users, recipients] = await Promise.all([
        session.getUsers(),
        session.getNoteRecipients(),
      ]);
      this.setState({
        loading: false,
        users: withoutMe(session.userId, users),
        selected: new Set(withoutMe(session.userId, recipients)),
        error: null,
      });
    } catch (err) {
      console.error(err);
      this.setState({loading: false, error: err.toString()});
    }
  };

  onToggle = (user, checked) => {
    const {selected} = this.state;
    if (checked) {
      selected.add(user);
    } else {
      selected.delete(user);
    }
    this.setState({selected});
  };

  onBackClicked = event => {
    event.preventDefault();
    this.props.history.goBack();
  };

  onShareClicked = async () => {
    const {session} = this.props;
    const {selected} = this.state;
    this.setState({error: null, isSharing: true});
    try {
      const recipients = Array.from(selected.values());
      await session.share(recipients);
      this.setState({isSharing: false});
      this.props.history.goBack();
    } catch (err) {
      console.error(err);
      this.setState({error: err.toString(), isSharing: false});
    }
  };

  render() {
    const {users, selected, error, loading} = this.state;
    return (
      <Panel>
        <Panel.Heading>Share</Panel.Heading>
        <Panel.Body>
          {error && <Alert bsStyle="danger">{error}</Alert>}
          {loading && <Alert bsStyle="info">Loading...</Alert>}
          <UserList
            users={users}
            selected={selected}
            onToggle={this.onToggle}
          />
          <Button
            bsStyle="primary"
            className="pull-right"
            onClick={this.onShareClicked}
            active={!this.state.isSharing}
          >
            {this.state.isSharing ? 'Sharing...' : 'Share'}
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
