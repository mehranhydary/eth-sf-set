import React, { Component } from "react";
import { Nav, Navbar, NavItem } from "react-bootstrap";


export default class Navigation extends Component {

    render() {
        return (  
            <Navbar fluid collapseOnSelect>
            <Navbar.Header>
              <Navbar.Brand>
                Get  Set  Go
              </Navbar.Brand>
              <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
              <Nav pullRight>
                <NavItem href="/create">Create</NavItem>
                <NavItem href="/sell">Sell</NavItem>
                <NavItem href="/buy">Buy</NavItem>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
        );
    }
}