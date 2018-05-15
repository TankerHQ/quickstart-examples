// @flow
import React from 'react';
import {Panel} from 'react-bootstrap';
import {Link} from 'react-router-dom';

import AccessibleNotes from './AccessibleNotes';

class Home extends React.Component {
  state: State = {
    accessibleNotes: [],
    loading: true,
    error: null,
  };

  onEditClicked = event => {
    event.preventDefault();
    this.props.onEdit();
  };

  async load() {
    this.setState({loading: true});
    try {
      const accessibleNotes = await this.props.session.getaccessibleNotes();
      this.setState({accessibleNotes, error: null, loading: false});
    } catch (err) {
      this.setState({
        accessibleNotes: [],
        error: err.toString(),
        loading: false,
      });
    }
  }

  async componentWillMount() {
    await this.load();
  }

  render() {
    return (
      <Panel>
        <Panel.Heading>My Note</Panel.Heading>
        <Panel.Body>
          <p>
            This is a simple notepad application. You have a single note that
            you can edit and share.
          </p>
          <p>
            <Link to="/edit">Edit your note</Link>
          </p>
        </Panel.Body>
        <Panel.Heading>Notes shared with me</Panel.Heading>
        <Panel.Body>
          <p>The notes bellow have been shared with you.</p>
          <AccessibleNotes
            error={this.state.error}
            loading={this.state.loading}
            accessibleNotes={this.state.accessibleNotes}
            onFriend={this.props.onFriend}
          />
        </Panel.Body>
      </Panel>
    );
  }
}

export default Home;
