import React from "react";
import { ListGroup, ListGroupItem, Alert } from "react-bootstrap";
import { withRouter } from "react-router-dom";

const AccessibleNotes = ({ isLoading, error, accessibleNotes, history }) => {
  if (isLoading) {
    return <Alert bsStyle="info">Loading...</Alert>;
  }

  if (error) {
    return (
      <Alert bsStyle="danger">
        <h4>Error fetching friend&lsquo;s note list:</h4>
        {error}
      </Alert>
    );
  }

  if (!accessibleNotes || !accessibleNotes.length) {
    return (
      <span id="accessible-notes-empty-span">None yet! Ask a friend to share a note with you.</span>
    );
  }

  return (
    <ListGroup id="accessible-notes-list">
      {accessibleNotes.map(friend => (
        <ListGroupItem key={friend.id} onClick={() => history.push(`/view/${friend.id}/${friend.email}`)}>
          {`From ${friend.email}`}
        </ListGroupItem>
      ))}
    </ListGroup>
  );
};

export default withRouter(AccessibleNotes);
