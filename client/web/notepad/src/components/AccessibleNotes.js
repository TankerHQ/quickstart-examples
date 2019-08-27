import React from 'react';
import {
  Alert, Button, ListGroup, ListGroupItem,
} from 'react-bootstrap';
import { withRouter } from 'react-router-dom';

class AccessibleNotes extends React.Component {
  state = {
    accessibleNotes: [],
    isLoading: true,
    error: null,
  };

  async componentDidMount() {
    await this.load();
  }

  load = async () => {
    this.setState({ isLoading: true });
    try {
      await this.props.session.refreshMe();
      const accessibleNotes = await this.props.session.getAccessibleNotes();
      this.setState({ accessibleNotes, error: null, isLoading: false });
    } catch (err) {
      this.setState({
        accessibleNotes: [],
        error: err.toString(),
        isLoading: false,
      });
    }
  };

  render = () => {
    const { history } = this.props;
    const { isLoading, error, accessibleNotes } = this.state;
    const noteCount = accessibleNotes.length;

    if (isLoading) {
      return <Alert bsStyle="info">Loading shared notes...</Alert>;
    }

    return (
      <div>
        {error && (
          <Alert bsStyle="danger">
            <h4>Error fetching friend&lsquo;s note list:</h4>
            {error}
          </Alert>
        )}
        <Button
          id="refresh-button"
          bsStyle="link"
          className="pull-right"
          onClick={this.load}
        >
          Refresh&nbsp;&nbsp;&#x21ba;
        </Button>
        {!error && noteCount === 0 && (
          <p id="accessible-notes-empty-warning">No shared note yet! Ask a friend to share one with you.</p>
        )}
        {!error && noteCount !== 0 && (
          <div>
            <p>The notes below have been shared with you:</p>
            <ListGroup id="accessible-notes-list">
              {accessibleNotes.map((friend) => (
                <ListGroupItem key={friend.id} onClick={() => history.push(`/view/${friend.id}/${friend.email}`)}>
                  {`From ${friend.email}`}
                </ListGroupItem>
              ))}
            </ListGroup>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(AccessibleNotes);
