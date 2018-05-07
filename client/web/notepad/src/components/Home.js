// @flow
import React from 'react';
import { Panel } from 'react-bootstrap';
import Session from '../Session';


class FriendsList extends React.Component {
  onFriendClicked = (event, friend) => {
    event.preventDefault();
    this.props.onFriend(friend);
  }

  row = (friend) => {
    return <li key={friend}><a onClick={(event) => this.onFriendClicked(event, friend)} href="/">{friend}</a></li>
  }

  render() {
    return (
      <ul>
        {this.props.friends.map(this.row)}
      </ul>
    );
  }
}

class Home extends React.Component {
  state: State = {
    friends: [],
  }

  onEditClicked = (event) => {
    event.preventDefault();
    this.props.onEdit();
  }

  async load() {
    const friends = await this.props.session.getFriends();
    this.setState({ friends });
  }

  async componentWillMount() {
    await this.load();
  }

  render() {
    return (
      <Panel>
        <Panel.Heading>Welcome</Panel.Heading>
        <Panel.Body>
          <h3><a onClick={this.onEditClicked} href="/">My note</a></h3>
          <hr />
          <h3>Shared with me</h3>
          <FriendsList friends={this.state.friends} onFriend={this.props.onFriend} />
        </Panel.Body>
      </Panel>
    )
  };
}

export default Home;
