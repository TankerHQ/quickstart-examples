import * as React from "react";
import { Panel, Tab, Nav, NavItem } from "react-bootstrap";
import { withRouter } from "react-router-dom";
import { Switch, Route, Redirect } from "react-router";

import PasswordResetRequest from "./PasswordResetRequest";
import PasswordResetConfirm from "./PasswordResetConfirm";
import Login from "./Login";
import Signup from "./Signup";

class Layout extends React.Component {
  navigationHandler = (path) => {
    const { history } = this.props;

    return (event) => {
      event.preventDefault();
      history.replace(path);
    };
  }

  render() {
    const { onLogIn, onSignUp, onPasswordResetRequest, onPasswordResetConfirm, location: { pathname } } = this.props;
    const selectedTab = pathname === "/signup" ? "signup" : "login";
    const loginTabLink = pathname === "/signup" ? "/login" : pathname;

    return (
      <Tab.Container defaultActiveKey={selectedTab} id="session_form_container">
        <Panel>
          <Panel.Heading>
            <Nav bsStyle="tabs" role="tablist" className="nav-justified">
              <NavItem eventKey="login" onClick={this.navigationHandler(loginTabLink)}>Login</NavItem>
              <NavItem eventKey="signup" onClick={this.navigationHandler("/signup")}>Signup</NavItem>
            </Nav>
          </Panel.Heading>
          <Panel.Body>
            <Tab.Content animation={false}>
              <Tab.Pane eventKey="login">
                <Switch>
                  <Route path="/login" render={() => <Login onSubmit={onLogIn} />} />
                  <Route path="/request-password-reset" render={() => <PasswordResetRequest onSubmit={onPasswordResetRequest} />} />
                  <Route path="/confirm-password-reset" render={() => <PasswordResetConfirm onSubmit={onPasswordResetConfirm} />} />
                  <Redirect path="/" to="/login" />
                </Switch>
              </Tab.Pane>
              <Tab.Pane eventKey="signup">
                <Signup onSubmit={onSignUp} />
              </Tab.Pane>
            </Tab.Content>
          </Panel.Body>
        </Panel>
      </Tab.Container>
    );
  }
}

export default withRouter(Layout);
