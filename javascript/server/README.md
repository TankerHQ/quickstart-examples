# What it is ?

This is a a really simple, *totally* *not* *safe* and not meant for production application backend server. It was build as an example, to be simple to read and understand.

It features the following functionnality:
- User signUp
- User login
- save data pushed by the user
- serve the data back to the user

The server does not encrypt data, only the client does, but stores it regardless. The server use the tanker usertoken library to generate and serve the client its usertoken.
This usertoken is an authorization token to the client and allow him to open a tanker session when he logs in.

# How to use it ?
## Create your trustchain

If you don't have one, The easiest way, for now, is to ask to a Tanker Staff to create one for you.
You have to use the same trustchain configuration between the client and the server.

## Configure the server

First, copy the sample config and edit it:

```bash
$ cp server-config.sample.js server-config.js && $EDITOR server-config.js
```
Replace the `<Fix me>` values with those of your trustchain.

## Installation

Now you install the dependencies, you have to do this only once:

```bash
$ yarn
```
It can takes a bit of time dependending of your internet connection speed.

## Start the server

```bash
$ yarn start
```

This will launch the server.

