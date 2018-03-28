# What is it?

This is a simple web application written in [React](https://reactjs.org/) and [Bootstrap](https://react-bootstrap.github.io/). It has very basic features:
- Signup
- Login
- Save some user input text to the cloud
- Retrieve this text from the cloud
- Logout

All this features use The Tanker SDK, it implements:
- Open a session
- Register a new device, if needs be
- encrypt text
- decrypt text

# How to use it ?
## Create your Trustchain

If you don't have one, The easiest way, for now, is to ask to a Tanker Staff to create one for you.
You have to use the same trustchain configuration between the client and the server.

## Configure the application server

Head to the [server documentation](../server/README.md)

## Configure the client

First, copy the sample config and edit it:

```bash
$ cp src/client-config.sample.js src/client-config.js && $(EDITOR) src/client-config.js
```
Replace the `<Fix me>` values with those of your trustchain.

## Installation

Now you can install the dependencies, you have to do this only once:

```bash
$ yarn
```

It can takes a bit of time dependending of your internet connection speed.

## Start the application

Once the installation is done, launch the the app.

```bash
$ yarn start
```

This will build the application and launch a local http server. If everything went well, it will open the application in your default browser. Or you can copy paste the link in your favorite browser.


