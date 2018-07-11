import * as React from "react";
import { MenuItem, Nav, Navbar, NavDropdown } from "react-bootstrap";

import Logo from "./Logo";
import "./Topbar.css";

const Signout = ({ userId, onSignOut }) => (
  <NavDropdown eventKey={1} title={userId} id="topbar_dropdown">
    <MenuItem id="sign-out-menu-item" onClick={onSignOut} eventKey={1}>
      Sign out
    </MenuItem>
  </NavDropdown>
);

const Topbar = ({ isOpen, userId, onSignOut }) => (
  <Navbar staticTop>
    <Navbar.Header>
      <Navbar.Brand>
        <Logo className="logo" /> Notepad <span id="topbar_tutorial_tag">- tutorial</span>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav pullRight>{isOpen && <Signout userId={userId} onSignOut={onSignOut} />}</Nav>
    </Navbar.Collapse>
  </Navbar>
);

export default Topbar;
