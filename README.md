# Tanker examples

Example applications using the Tanker SDK in JavaScript, iOS and Android.

## Prerequisites

### Setup

Clone this repository:
```bash
git clone https://github.com/SuperTanker/quickstart-examples.git
```

Install [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/en/docs/install), or upgrade if needed:
```bash
node -v  # >= 8    (async/await support)
yarn -v  # >= 1.0  (workspaces support)
```

Install all dependencies:
```bash
cd quickstart-examples && yarn
```

### Create a Trustchain

In short, your Trustchain is the structure in which the cryptographic operations will be stored when you run the examples.

If you don't have a Trustchain yet, use the [Tanker dashboard](https://dashboard.tanker.io) to create a Trustchain, and store the configuration file safely.

Note: if you need to request access to the Tanker dashboard, please contact us at [contact@tanker.io](mailto:contact@tanker.io).

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

### Run example applications

Note: before running any of the example applications, don't forget to always start the server first!

Go to the homepage of the example server in your browser:

```
http://localhost:8080/
```

On this page, you will find all the instructions needed to run the example applications and a link to a tutorial.
