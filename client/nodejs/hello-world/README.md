# Node.js client example application

## Run the server

Please check that [the server is started](../../../README.md) as this example application will rely on it.

## Run the application

In a new terminal, run:

```bash
yarn start:nodejs:hello-world
```

The output should be similar to:

|Server output                  | App output  |
|---------------------------    | ----------- |
|                               | Sign up bob |
| New /signup request for bob   | |
| Creating new identity         | |
|                               | Signed out |
|                               | Sign up alice |
| New /signup request for alice | |
| Creating new identity         | |
|                               | Encrypting message for Bob |
|                               | Signed out |
|                               | Sign in bob |
| New /signin request for bob   | |
| Serving existing identity     | | 
|                               | Decrypt message from Alice: This is a secret message |
|                               | Signed out |
