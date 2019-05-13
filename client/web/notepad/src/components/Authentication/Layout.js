import * as React from "react";
import { Panel, Tab, Nav, NavItem } from "react-bootstrap";
import { withRouter } from "react-router-dom";
import { Switch, Route, Redirect } from "react-router";

import PasswordResetRequest from "./PasswordResetRequest";
import PasswordResetConfirm from "./PasswordResetConfirm";
import Login from "./Login";
import Signup from "./Signup";

const isSignupPath = (path) => path && path.match(/^\/signup/);

class Layout extends React.Component {
  onLoginTab = (event) => {
    event.preventDefault();

    if (isSignupPath(this.props.location.pathname)) {
      this.props.history.replace("/login");
    }
  }

  onSignupTab = (event) => {
    event.preventDefault();

    if (!isSignupPath(this.props.location.pathname)) {
      this.props.history.replace("/signup");
    }
  }

  render() {
    const { onLogIn, onSignUp, onPasswordResetRequest, onPasswordResetConfirm, location: { pathname } } = this.props;
    const activeKey = isSignupPath(pathname) ? "signup" : "login";

    return (
      <Tab.Container defaultActiveKey={activeKey} id="session_form_container">
        <Panel>
          <Panel.Heading>
            <Nav bsStyle="tabs" role="tablist" className="nav-justified">
              <NavItem eventKey="login" onClick={this.onLoginTab}>Login</NavItem>
              <NavItem eventKey="signup" onClick={this.onSignupTab}>Signup</NavItem>
            </Nav>
          </Panel.Heading>
          <Panel.Body>
            <Tab.Content animation={false}>
              <Tab.Pane eventKey={activeKey}>
                <Switch>
                  <Route path="/signup" render={() => <Signup onSubmit={onSignUp} />} />
                  <Route path="/login" render={() => <Login onSubmit={onLogIn} />} />
                  <Route path="/request-password-reset" render={() => <PasswordResetRequest onSubmit={onPasswordResetRequest} />} />
                  <Route path="/confirm-password-reset" render={() => <PasswordResetConfirm onSubmit={onPasswordResetConfirm} />} />
                  <Redirect path="/" to="/login" />
                </Switch>
              </Tab.Pane>
            </Tab.Content>
          </Panel.Body>
        </Panel>
      </Tab.Container>
    );
  }
}

export default withRouter(Layout);
