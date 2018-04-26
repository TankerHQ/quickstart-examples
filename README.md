# Tanker examples

Example applications using the Tanker SDK in JavaScript, iOS and Android.

## Prerequisites

### Setup

Clone this repository:
```bash
git@github.com:SuperTanker/tanker-ui-demos.git
```

Install [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/en/docs/install), or upgrade if needed:
```bash
node -v  # >= 8    (async/await support)
yarn -v  # >= 1.0  (workspaces support)
```

Install all dependencies:
```bash
cd tanker-ui-demos && yarn
```

### Create a Trustchain

In short, your Trustchain is the structure in which most of the cryptographic stuff will be stored when you run the examples.

If you don't have a Trustchain yet, use the [Tanker dashboard](https://dashboard.tanker.io) to create a Trustchain, and store the configuration file safely.

### Configure

Take the JSON configuration file from the previous step and copy it under the `config/` folder.

That's all you need to start the server and applications!

### Start the example server

Start the example server in a terminal with:

```bash
yarn start:server
```

The example server provides applications with:
* a mock auth system
* an endpoint to retrieve user tokens as needed by the Tanker SDK
* a couple of routes to upload/download user data

Note: in a real world application, you must plug in your secure auth system, and store user tokens alongside your user records in a secure database.

### Run example applications

Note: before running any of the example applications, don't forget to always start the server first!

Go to the homepage of the example server in your browser, and follow instructions:

```
http://localhost:8080/
```
