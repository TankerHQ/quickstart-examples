import React from 'react';
import { Badge, Card } from 'react-bootstrap';

import LogEntry from './LogEntry';

const LogCard = ({ entries }) => (
  <Card>
    <Card.Header>
      <Card.Title>
        Application log <Badge id="log-badge" variant="secondary">{entries.length}</Badge>
      </Card.Title>
    </Card.Header>
    <Card.Body>
      {entries.map(entry => (
        <LogEntry
          key={entry.id}
          date={entry.date}
          title={entry.title}
          code={entry.code}
          language={entry.language}
          type={entry.type}
        >
          {entry.body}
        </LogEntry>
      ))}
    </Card.Body>
  </Card>
);

export default LogCard;
