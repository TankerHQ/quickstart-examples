# Notepad example application tutorial

## Goal of this tutorial

Using a simple web application written in [React](https://reactjs.org/) and [Bootstrap](https://react-bootstrap.github.io/), you'll try to implement end-to-end user data encryption / decryption using the JavaScript Tanker SDK.

The web application you'll start with has very basic features:
- signup
- login
- save some user input text to the cloud
- retrieve this text from the cloud
- logout

## How to

### Run the server

Please check that [the server is started](../../../README.md) as this example application will rely on it.

### Run the application

In a new terminal, run:

```bash
yarn start:web:tutorial
```

The application should open in a new browser tab. If not, go to http://localhost:3000/ manually.

## Implementing end-to-end encryption

Your goal is to add the Tanker SDK to the application, and to implement the following steps:
- open a session
- register a new device, if needs be
- encrypt text
- decrypt text
