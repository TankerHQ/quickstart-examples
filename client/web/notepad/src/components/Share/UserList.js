import { Checkbox } from "react-bootstrap";
import React from "react";

export default function UserList({ onToggle, selectedUserIds, users }) {
  const renderRow = user => {
    const active = selectedUserIds.has(user.id);
    return (
      <Checkbox
        key={user.id}
        onChange={event => {
          onToggle(user.id, event.target.checked);
        }}
        checked={active}
      >
        {user.email}
      </Checkbox>
    );
  };

  return <div>{users.map(renderRow)}</div>;
}
