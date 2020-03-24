import * as React from 'react';
import {
  Card, Nav, Tab,
} from 'react-bootstrap';
import { withRouter } from 'react-router-dom';
import { Switch, Route, Redirect } from 'react-router';

import PasswordResetRequest from './PasswordResetRequest';
import PasswordResetConfirm from './PasswordResetConfirm';
import Login from './Login';
import Signup from './Signup';

const isSignupPath = (path) => path && path.match(/^\/signup/);

class Layout extends React.Component {
  onLoginTab = (event) => {
    event.preventDefault();

    if (isSignupPath(this.props.location.pathname)) {
      this.props.history.replace('/login');
    }
  }

  onSignupTab = (event) => {
    event.preventDefault();

    if (!isSignupPath(this.props.location.pathname)) {
      this.props.history.replace('/signup');
    }
  }

  render() {
    const {
      onLogIn, onSignUp, onPasswordResetRequest, onPasswordResetConfirm, location: { pathname },
    } = this.props;
    const activeKey = isSignupPath(pathname) ? 'signup' : 'login';

    return (
      <Tab.Container defaultActiveKey={activeKey}>
        <Card id="session_form_container">
          <Card.Header>
            <Nav variant="tabs" role="tablist" className="nav-justified">
              <Nav.Item>
                <Nav.Link eventKey="login" onClick={this.onLoginTab}>Login</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="signup" onClick={this.onSignupTab}>Signup</Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body>
            <Tab.Content>
              <Tab.Pane eventKey={activeKey} transition={false}>
                <Switch>
                  <Route path="/signup" render={() => <Signup onSubmit={onSignUp} />} />
                  <Route path="/login" render={() => <Login onSubmit={onLogIn} />} />
                  <Route path="/request-password-reset" render={() => <PasswordResetRequest onSubmit={onPasswordResetRequest} />} />
                  <Route path="/confirm-password-reset" render={() => <PasswordResetConfirm onSubmit={onPasswordResetConfirm} />} />
                  <Redirect path="/" to="/login" />
                </Switch>
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>
    );
  }
}

export default withRouter(Layout);
