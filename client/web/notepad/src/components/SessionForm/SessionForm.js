// @flow
import * as React from 'react';
import {Panel, Tab, Nav, NavItem} from 'react-bootstrap';

import Signin from './Signin';
import Signup from './Signup';

type Props = {
  onSignIn: (login: string, password: string) => Promise<void>,
  onSignUp: (login: string, password: string) => Promise<void>,
};

const SessionForm = ({onSignIn, onSignUp}: Props) => (
  <Tab.Container
    defaultActiveKey={1}
    id="session_form_container"
  >
    <Panel>
      <Nav bsStyle="tabs" role="tablist" className="nav-justified">
        <NavItem eventKey={1}>Sign in</NavItem>
        <NavItem eventKey={2}>Sign up</NavItem>
      </Nav>
      <Panel.Body>
        <Tab.Content animation={false}>
          <Tab.Pane eventKey={1}>
            <Signin onSubmit={onSignIn} />
          </Tab.Pane>
          <Tab.Pane eventKey={2}>
            <Signup onSubmit={onSignUp} />
          </Tab.Pane>
        </Tab.Content>
      </Panel.Body>
    </Panel>
  </Tab.Container>
);

export default SessionForm;
