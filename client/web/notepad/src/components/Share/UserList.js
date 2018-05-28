import { Checkbox } from "react-bootstrap";
import React from "react";

export default function UserList({ onToggle, selected, users }) {
  const renderRow = user => {
    const active = selected.has(user);
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

  return <div>{users.map(renderRow)}</div>;
}
