import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import AccessibleNotes from './AccessibleNotes';

const Home = ({ session }) => (
  <Card>
    <Card.Header id="my-note-heading">Home</Card.Header>
    <Card.Body>
      <section>
        <h2>My note</h2>
        <p>
          This is a simple notepad application. You have a single note that you can edit and
          share.
        </p>
        <p>
          <Link id="edit-link" to="/edit" href="/edit">
            Edit my note&nbsp;&nbsp;<span className="flip">&#x270e;</span>
          </Link>
        </p>
      </section>
      <section>
        <h2>Notes shared with me</h2>
        <AccessibleNotes session={session} />
      </section>
    </Card.Body>
  </Card>
);

export default Home;
