// @flow
import * as React from 'react';
import { MenuItem, Nav, Navbar, NavDropdown } from 'react-bootstrap';

import Logo from './Logo';
import './Topbar.css';

const Signout = ({ userId, onSignout }: { onSignout: SyntheticEvent => any }) => (
  <NavDropdown eventKey={1} title={userId} id="topbar_dropdown">
    <MenuItem onClick={onSignout} eventKey={1}>Sign out</MenuItem>
  </NavDropdown>
);

const Topbar = ({ isOpen, userId, onSignout }: { isOpen: bool, userId: string, onSignout: Function }) => (
  <Navbar staticTop>
    <Navbar.Header>
      <Navbar.Brand>
        <Logo className="logo" /> Notepad
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav pullRight>
        {isOpen && <Signout userId={userId} onSignout={onSignout} />}
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

export default Topbar;
