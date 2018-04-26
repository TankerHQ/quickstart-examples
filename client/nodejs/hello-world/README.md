# Node.js client example application

## Run the server

Please check that [the server is started](../../../README.md) as this example application will rely on it.

## Run the application

In a new terminal, run:

```bash
yarn start:nodejs:hello-world
```

The output should be similar to:

|Server output|App output |
|-------------|-----------|
||Opening session bob|
|New request: bob||
|Creating new token||
||Bye!|
||Opening session alice|
|New request: alice||
|Creating new token||
||Encrypting message for Bob|
||Bye!|
||Opening session bob|
|New request: bob||
|Serving existing token||
||Got message from Alice: This is a secret message|
||Bye!|
