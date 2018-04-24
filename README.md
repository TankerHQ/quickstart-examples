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
node -v  # >= 7.6  (async/await support)
yarn -v  # >= 1.0  (workspaces support)
```

Install all dependencies:
```bash
cd tanker-ui-demo && yarn
```

### Create a Trustchain

In short, your Trustchain is the structure in which most of the cryptographic stuff will be stored when you run the examples.

If you don't have a Trustchain yet, use the [Tanker dashboard](https://dashboard.tanker.io) to create a Trustchain, and store the configuration file safely.

### Configure

Take the JSON configuration file from the previous step and move it under the `config/` folder.

That's all you need to start the server and applications!

### Start the server example

Start the server example in a terminal with:

```bash
yarn start:server
```

The server example provides applications with:
* a mock auth system
* an endpoint to retrieve user tokens as needed by the Tanker SDK
* a couple of routes to upload/download user data

Note: in a real world application, you must plug in your secure auth system, and store user tokens alongside your user records in a secure database.

### Run an application example

Note: before running any of the example applications, don't forget to always start the server first!

Go to the homepage of the server example in your browser, and follow instructions:

```
http://localhost:8080/
```

For the record, here is where you can find the sources of all application examples:
```plain
.
├── android           -> Android demo app with realistic UI flows
├── ios               -> iOS demo app with realistic UI flows
└── javascript        
    ├── apps          
    │   ├── hello     -> JavaScript demo app with code snippets
    │   ├── node      -> JavaScript demo script in Node.JS
    │   └── ui-demo   -> JavaScript demo app with realistic UI flows
    └── server        -> Demo server for all apps (fake auth...)
```
