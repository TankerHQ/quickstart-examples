import * as React from 'react';
import {
  Nav, Navbar, NavDropdown,
} from 'react-bootstrap';
import { withRouter } from 'react-router-dom';

import Logo from './Logo';
import './Topbar.css';

const Topbar = ({
  status, email, onLogOut, history,
}) => (
  <Navbar fixed="top" expand="md">
    <Navbar.Brand>
      <Logo className="logo" /> Notepad
    </Navbar.Brand>
    <Navbar.Toggle />
    <Navbar.Collapse className="justify-content-end">
      {status === 'open' && (
        <Nav>
          <NavDropdown title={email} id="topbar_dropdown">
            <NavDropdown.Item id="settings-menu-item" onClick={() => history.push('/settings')} eventKey={1}>
              Settings
            </NavDropdown.Item>
            <NavDropdown.Item id="log-out-menu-item" onClick={onLogOut} eventKey={2}>
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      )}
    </Navbar.Collapse>
  </Navbar>
);

export default withRouter(Topbar);
