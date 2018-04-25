# Node.js client application example

## Run the server

If not done yet, [start the server](../../../README.md) that this application example will need.

## Run the application

In a new terminal, run:

```bash
yarn start:node
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
