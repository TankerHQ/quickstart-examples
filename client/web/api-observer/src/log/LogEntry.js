import React from 'react';
import Highlight from 'react-highlight';

// alternative themes that could work well: idea.css / default.css
import 'highlight.js/styles/github.css';
import './LogEntry.css';

const LogEntry = (props) => {
  const { date, title, code, children, type, language } = props;

  return (
    <div className={`log-entry log-entry--${type}`}>
      <div className="log-entry__title">{date + ' -'} {title}</div>
      <div className="log-entry__body">
        {code && (
          <Highlight className={language || 'javascript'}>
            {code}
          </Highlight>
        )}
        {children}
      </div>
    </div>
  );
};

export default LogEntry;