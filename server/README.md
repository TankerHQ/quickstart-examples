# Tanker example server

## Description

This is an example Tanker user token server, built to be simple to read and to understand.

The provided implementation is not meant to be production ready and should be considered as an example of how to support Tanker user tokens in an authentication scheme.

The server does the bare minimum by hashing the passwords before storing them, but doesn't provide a "forgot my password" feature.

The minimalistic authentication system would need to be hardened to be ready for production, but this is beyond the scope of these examples.

The following endpoints are implemented:

| method | path    | description |
|--------|---------|-------------|
| GET    | /signup | user sign up |
| GET    | /login  | user login |
| GET    | /data   | get the user data |
| PUT    | /data   | store the user data |
| DELETE | /data   | clear the user data |


The data is encrypted on the client side. The server stores the received data whether it is encrypted or not.

The server uses the `@tanker/user-token` npm library to generate and serve a user token for each user. This user token is unique to each user, and is sent to the client application so that it can open a Tanker session with it.

Note: in a real world application, you must plug in your secure auth system, and store user tokens alongside your user records in a secure database.
