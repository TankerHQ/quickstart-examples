// @flow
import * as React from 'react';
import { Panel, Tab, Nav, NavItem } from 'react-bootstrap';

import Signin from './Signin';
import Signup from './Signup';

import './SessionForm.css';

type Props = {
  onSignin: (login: string, password: string) => Promise<void>,
  onSignup: (login: string, password: string) => Promise<void>,
};

const SessionForm = ({ onSignin, onSignup }: Props) => (
  <Tab.Container defaultActiveKey={1} id="session_form_container" className="session_form">
    <Panel>
      <Nav role="tablist" className="nav-justified">
        <NavItem eventKey={1}>Sign in</NavItem>
        <NavItem eventKey={2}>Sign up</NavItem>
      </Nav>
      <Panel.Body>
        <Tab.Content animation={false}>
          <Tab.Pane eventKey={1}>
            <Signin onSubmit={onSignin} />
          </Tab.Pane>
          <Tab.Pane eventKey={2}>
            <Signup onSubmit={onSignup} />
          </Tab.Pane>
        </Tab.Content>
      </Panel.Body>
    </Panel>
  </Tab.Container>
);

export default SessionForm;
