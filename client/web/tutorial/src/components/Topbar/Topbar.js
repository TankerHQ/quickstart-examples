import * as React from "react";
import { MenuItem, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { withRouter } from "react-router-dom";

import Logo from "./Logo";
import "./Topbar.css";

const Topbar = ({ isOpen, email, onSignOut, history }) => (
  <Navbar staticTop>
    <Navbar.Header>
      <Navbar.Brand>
        <Logo className="logo" /> Notepad <span id="topbar_tutorial_tag">- tutorial</span>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      {isOpen && (
        <Nav pullRight>
          <NavDropdown title={email} id="topbar_dropdown">
            <MenuItem id="settings-menu-item" onClick={() => history.push(`/settings`)} eventKey={1}>
              Settings
            </MenuItem>
            <MenuItem id="sign-out-menu-item" onClick={onSignOut} eventKey={2}>
              Sign out
            </MenuItem>
          </NavDropdown>
        </Nav>
      )}
    </Navbar.Collapse>
  </Navbar>
);

export default withRouter(Topbar);
