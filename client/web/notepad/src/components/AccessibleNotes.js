// @flow
import React from 'react';
import {ListGroup, ListGroupItem, Alert} from 'react-bootstrap';
import {withRouter} from 'react-router-dom';

const AccessibleNotes = ({loading, error, friends, history}) => {
  if (loading) {
    return <span>Loading...</span>;
  }

  if (error) {
    return (
      <Alert bsStyle="danger">
        <h4>Error fetching friend's note list:</h4>
        {error}
      </Alert>
    );
  }

  if (!friends || !friends.length) {
    return <span>none yet! Ask a friend to share a note with you.</span>;
  }

  return (
    <ListGroup>
      {friends.map(friend => (
        <ListGroupItem
          key={friend}
          onClick={() => history.push(`/view/${friend}`)}
        >
          {friend + ' note'}
        </ListGroupItem>
      ))}
    </ListGroup>
  );
};

export default withRouter(AccessibleNotes);
