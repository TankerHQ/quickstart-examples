import { Checkbox } from "react-bootstrap";
import React from "react";

type Props = {
  onToggle: (string, boolean) => void,
  selected: Set<string>,
  users: string[],
};

export default function UserList({ onToggle, selected, users }: Props) {
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
