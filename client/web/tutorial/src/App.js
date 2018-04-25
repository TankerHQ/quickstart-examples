// @flow
import React from 'react';
import { Grid, Col, Row, Navbar, Nav, NavItem } from 'react-bootstrap';
import { Route, Switch } from 'react-router-dom';

import Session from './Session';

import { Edit, Login, SaveUnlockKey, Signup } from './component';
import Logo from './logo';
import './App.css';

const Logout = ({ session, history }: {session: Session, history: any}) => {
  const logout = () => {
    if (session.isOpen())
      session.close();
    history.push('/');
  };

  return (
    <NavItem onClick={logout}>Logout</NavItem>
  );
};

type Props = {
  session: Session,
}

class App extends React.Component<Props> {
  render() {
    const { session } = this.props;
    return (
      <div className="App">
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              Notepad
            </Navbar.Brand>
          </Navbar.Header>
          <Navbar.Text>
            { session.isOpen() ?
                (`Signed in as: ${session.userId}`)
                : 'Session is closed' }
          </Navbar.Text>
          <Nav bsStyle="pills" pullRight>
            <Switch>
              <Route path="/signup" render={({ history }) => <NavItem onClick={() => history.push('/login')} >Login</NavItem>}/>
              <Route path="/(|login)" render={({ history }) => <NavItem onClick={() => history.push('/signup')} >Signup</NavItem>}/>
              <Route component={({ history }) => <Logout history={history} session={session}/>}/>
            </Switch>
          </Nav>
        </Navbar>
        <Grid>
          <Row>
            <Col lg={6} lgOffset={3} md={6} mdOffset={3} sm={6} smOffset={3}>
              <Logo className="Logo"/>
            </Col>
          </Row>
          <Row>
            <Col lg={6} lgOffset={3} md={6} mdOffset={3} sm={6} smOffset={3}>
              <Switch>
                <Route path="/signup" component={() => <Signup session={session} />}/>
                <Route path="/savekey" component={() => <SaveUnlockKey session={session} />}/>
                <Route path="/edit" component={() => <Edit session={session} />}/>
                <Route path="/(|login)" component={() => <Login session={session} />}/>
              </Switch>
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

export default App;
