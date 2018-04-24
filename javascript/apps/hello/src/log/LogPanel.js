import React from 'react';
import { Badge, Panel } from 'react-bootstrap';

import LogEntry from './LogEntry';

const LogPanel = ({ entries }) => (
  <Panel>
    <Panel.Heading>
      <Panel.Title componentClass="h5">
        Application log <Badge>{entries.length}</Badge>
      </Panel.Title>
    </Panel.Heading>
    <Panel.Body>
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
    </Panel.Body>
  </Panel>
);

export default LogPanel;