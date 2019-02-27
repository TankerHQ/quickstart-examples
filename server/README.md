# Tanker example server

## Description

This is an example application server, built to be simple to read and to understand.

The provided implementation is not meant to be production ready and should be considered as an example of how to support Tanker identities in an authentication scheme.

The following endpoints are implemented:

| method | path                  | description |
|--------|-----------------------|-------------|
| GET    | /config               | get the tanker config needed by the Tanker Client JS SDK |
| POST   | /signup               | sign up a new user (returns a complete user) |
| POST   | /login                | log in an existing user (returns a complete user) |
| GET    | /logout               | log out the current user |
| GET    | /me                   | get the identity of the current user |
| PUT    | /me/email             | change the email address of the current user |
| PUT    | /me/password          | change the password of the current user |
| GET    | /data/:userId         | get the data of the specified user |
| PUT    | /data                 | store the data of the current user |
| DELETE | /data                 | clear the data of the current user |
| POST   | /share                | share the data of the current user with a list of users |
| GET    | /users                | get the identities of all the users |
| POST   | /requestResetPassword | request an email with a link to reset password |
| POST   | /resetPassword        | reset password given a new password and a reset token |

The data is encrypted on the client side. The server stores the received data whether it is encrypted or not.

The server uses the `@tanker/identity` npm library to generate and serve a Tanker identity for each user. This identity is unique to each user, and is sent at login/signup to the client application so that it can open a Tanker session with it.

Note: in a real world application, you must plug in your secure auth system, and store Tanker identites alongside your user records in a secure database.
