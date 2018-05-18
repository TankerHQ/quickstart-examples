// @flow
import * as React from "react";
import { Panel, Tab, Nav, NavItem } from "react-bootstrap";

import Signin from "./Signin";
import Signup from "./Signup";

type Props = {
  onSignIn: (login: string, password: string) => Promise<void>,
  onSignUp: (login: string, password: string) => Promise<void>
};

const SessionForm = ({ onSignIn, onSignUp }: Props) => (
  <Tab.Container defaultActiveKey="sign-in" id="session_form_container">
    <Panel>
      <Nav bsStyle="tabs" role="tablist" className="nav-justified">
        <NavItem eventKey="sign-in">Sign in</NavItem>
        <NavItem eventKey="sign-up">Sign up</NavItem>
      </Nav>
      <Panel.Body>
        <Tab.Content animation={false}>
          <Tab.Pane eventKey="sign-in">
            <Signin onSubmit={onSignIn} />
          </Tab.Pane>
          <Tab.Pane eventKey="sign-up">
            <Signup onSubmit={onSignUp} />
          </Tab.Pane>
        </Tab.Content>
      </Panel.Body>
    </Panel>
  </Tab.Container>
);

export default SessionForm;
