import { Button, Checkbox, Panel } from 'react-bootstrap';
import React from 'react';

class UserList extends React.Component {

  row = (user) => {
    const { onToggle } = this.props;
    return <li key={user}><Checkbox onChange={(event) => {onToggle(user, event.target.checked)}} >{user}</Checkbox></li>
  }

  render() {
    return (
      <ul>
        {this.props.users.map(this.row)}
      </ul>
    );
  }
}

class Share extends React.Component {
  state = {
    users: [],
    selected: new Set()
  };

  componentWillMount = async () => {
    const { session } = this.props;
    const users = await session.getUsers();
    this.setState({ users });
  }

  onToggle = (user, checked) => {
    const { selected } = this.state;
    if (checked) {
      selected.add(user);
    } else {
      selected.delete(user);
    }
    this.setState({ selected });
  }

  onShareClicked = async () => {
    const { session, resourceId, onEdit } = this.props;
    const { selected } = this.state;
    const recipents = Array.from(selected.values());
    await session.share(resourceId, recipents);
    onEdit();
  }

  render() {
    const { users, selected } = this.state;
    return (
      <Panel>
        <Panel.Heading>Share Settings</Panel.Heading>
        <Panel.Body>
        </Panel.Body>
        <UserList users={users} onToggle={this.onToggle} />
        <Button onClick={this.onShareClicked}>Share with {selected.size} user(s)</Button>
      </Panel>
    )
  }

}

export default Share;
