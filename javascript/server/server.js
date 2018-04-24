// /!\ WARNING
//
// This is a demo server, you MUST NOT use it *as is* in production!
//
// Nothing in this piece of code is safe nor reliable, nor intented to be.
//
// The only purpose of this program is to illustrate how to provide a
// backend server to the demo applications using the Tanker SDK.

// @flow
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const userToken = require('@tanker/user-token');

const corsMiddleware = require('./corsMiddleware.js').default;
const config = require('./config.js');

// Build express application
const app = express();
const port = 8080;
app.use(corsMiddleware); // enable CORS
app.use(bodyParser.text());
app.options('*', corsMiddleware); // enable preflight CORS requests

// Pretty logger
const log = (message, indentLevel = 0) => {
  const date = (new Date()).toISOString().slice(11, 19);
  const tabSize = 4;
  const prefix = indentLevel ? new Array(indentLevel * tabSize - 1).join(' ') + '- ' : '';

  if (indentLevel === 0) console.log(''); // skip line

  if (message instanceof Error) {
    console.log('[' + date + ']', prefix + 'A server-side error occured'); // eslint-disable-line no-console
    console.error(message); // eslint-disable-line no-console
  } else {
    console.log('[' + date + ']', prefix + message); // eslint-disable-line no-console
  }
};

// Ensure folder exists to store tokens for this trustchain
const dataFolder = `./data/${config.trustchainId.replace(/[\/\\]/g, '_')}`;

if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder);
}

const dataFilePath = userId => `${dataFolder}/${userId.replace(/[\/\\]/g, '_')}.json`;

// Helpers to read/write user data
const findUser = (id, password) => {
  const path = dataFilePath(id);

  if (!fs.existsSync(path)) {
    return { error: { status: 404, message: `Authentication error: user "${id}" does not exist` } };
  }

  const user = JSON.parse(fs.readFileSync(path));

  if (password !== user.password) {
    return { error: { status: 401, message: 'Authentication error: invalid password' } };
  }

  return { user };
};

const saveUser = (user) => {
  const path = dataFilePath(user.id);
  fs.writeFileSync(path, JSON.stringify(user, null, 2));
};

// Routes
app.get('/signup', (req, res) => {
  const { userId, password } = req.query;

  log(`New sign up request from ${userId}:`);

  const path = dataFilePath(userId);

  if (fs.existsSync(path)) {
    log(`User "${userId}" already exists`, 1);
    res.sendStatus(409);
    return;
  }

  log('Generate a new user token', 1);
  const token = userToken.generateUserToken(config.trustchainId, config.trustchainPrivateKey, userId);

  log('Save password and token to storage', 1);
  saveUser({ id: userId, password, token });

  log('Serve the token', 1);
  res.set('Content-Type', 'text/plain');
  res.send(token);
});

app.get('/login', (req, res) => {
  const { userId, password } = req.query;

  log(`New login request from ${userId}:`);
  log('Check authentication', 1);

  const { error, user } = findUser(userId, password);

  if (error) {
    log(error.message, 1);
    res.sendStatus(error.status);
    return;
  }

  log('Retrieve token from storage', 1);
  log('Serve the token', 1);
  res.set('Content-Type', 'text/plain');
  res.send(user.token);
});

app.put('/data', async (req, res) => {
  const { userId, password } = req.query;

  log(`New data update request (PUT) from ${userId}:`);
  log('Check authentication', 1);

  const { error, user } = findUser(userId, password);

  if (error) {
    log(error.message, 1);
    res.sendStatus(error.status);
    return;
  }

  log('Save data on storage', 1);
  try {
    user.data = await req.body;
    saveUser(user);
  } catch (e) {
    log(e, 1);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(200);
});

app.get('/data', async (req, res) => {
  const { userId, password } = req.query;

  log(`New data retrieval request (GET) from ${userId}:`);
  log('Check authentication', 1);

  const { error, user } = findUser(userId, password);

  if (error) {
    log(error.message, 1);
    res.sendStatus(error.status);
    return;
  }

  log('Retrieve data from storage', 1);
  log('Serve the data', 1);
  res.set('Content-Type', 'text/plain');
  res.send(user.data);
});

// Start application
log(`Listening on http://localhost:${port}`);
app.listen(port);
