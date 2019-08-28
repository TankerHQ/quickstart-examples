import * as React from 'react';
import {
  MenuItem, Nav, Navbar, NavDropdown,
} from 'react-bootstrap';
import { withRouter } from 'react-router-dom';

import Logo from './Logo';
import './Topbar.css';

const Topbar = ({
  status, email, onLogOut, history,
}) => (
  <Navbar staticTop>
    <Navbar.Header>
      <Navbar.Brand>
        <Logo className="logo" /> Notepad
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      {status === 'open' && (
        <Nav pullRight>
          <NavDropdown title={email} id="topbar_dropdown">
            <MenuItem id="settings-menu-item" onClick={() => history.push('/settings')} eventKey={1}>
              Settings
            </MenuItem>
            <MenuItem id="log-out-menu-item" onClick={onLogOut} eventKey={2}>
              Logout
            </MenuItem>
          </NavDropdown>
        </Nav>
      )}
    </Navbar.Collapse>
  </Navbar>
);

export default withRouter(Topbar);
