# Tanker example server

## Description

This is an example Tanker user-token server, built to be simple to read and to understand.

It is not meant to be production ready, but should be considered as an example of how to support Tanker user-token in your  authentication schemes.

The mock authentication system would have to be replaced in real applications, but this is beyond the scope of these examples.

The following endpoints are implemented:

| method | path    | description |
|--------|---------|-------------|
| GET    | /signup | user sign up |
| GET    | /login  | user login |
| GET    | /data   | get the user data |
| PUT    | /data   | store the user data |

The data is encrypted on the client side. The server stores the received data whether it is encrypted or not.

The server use the `@tanker/user-token` npm library to generate and serve a userToken for each user. This userToken is unique to each user, and is sent to the client application so that it can open a Tanker session with it.

Note: in a real world application, you must plug in your secure auth system, and store user tokens alongside your user records in a secure database.
