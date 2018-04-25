# Tanker example server

## Description

This is a sample Tanker user-token server. It is build to be simple to read and to understand.

It is not meant to be production ready, but should be considered an example of how to support Tanker user-token in your user authentication schemes.

As such, the user authentication is pretty basic and would need to be hardened to be ready for production, for example by using mechanisms like OAuth and JWT Tokens, that would complicate the example.

The following endpoints are implemented:

| method | path    | description |
|--------|---------|-------------|
| GET    | /signup | user sign up |
| GET    | /login  | user login |
| GET    | /data   | get the user data |
| PUT    | /data   | store the user data |

The data is encrypted on the client side. The server stores the received data whether it is encrypted or not.

The server use the `@tanker/user-token` npm library to generate and serve a userToken for each user. This userToken is unique to each user, and is sent to the client application so that it can open a Tanker session with it.
