# Tanker demo server

## Description

This is a a really simple, _totally_ _not_ _safe_ and not meant for production application backend server. It was build as an example, to be simple to read and understand.

The following endpoints are implemented:

* GET /signup user sign up
* GET /login user login
* GET /data get the user data
* PUT /data store the user data

The data is encrypted on the client side. The server stores the received data whether it is encrypted or not. The server use the `@tanker/user-token` npm library to generate and serve a userToken for each user.
This userToken is unique to each users, it is sent to the client application so that it can open a Tanker session with it.

## How to use it

### Create your trustchain

Use the [Tanker dashboard](https://dashboard.tanker.io) to create a Trustchain, and store the configuration safely. You must use the same trustchain id for all clients and servers.

### Configure the server

First, copy the sample config and edit it:

```bash
$ cp server-config.sample.js server-config.js && $EDITOR server-config.js
```

Replace the `<Fix me>` values with those of your trustchain.

### Installation

Install the javascript dependencies using `yarn`:

```bash
$ yarn
```

It can takes a bit of time depending of your internet connection speed.

### Start the server

```bash
$ yarn start
```

This will launch the server.
