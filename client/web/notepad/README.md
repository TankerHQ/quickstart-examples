# Notepad example application

## Description

This is a simple web application written in [React](https://reactjs.org/) and [Bootstrap](https://react-bootstrap.github.io/). It has very basic features:
- signup
- login
- save some user input text to the cloud
- retrieve this text from the cloud
- logout

All this features use The Tanker SDK, it implements:
- open a session
- register a new device, if needs be
- encrypt text
- decrypt text

## How to

### Run the server

Please check that [the server is started](../../../README.md) as this example application will rely on it.

### Run the application

In a new terminal, run:

```bash
yarn start:web:notepad
```

The application should open in a new browser tab. If not, go to http://localhost:3000/ manually.
