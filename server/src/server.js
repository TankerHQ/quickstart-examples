// /!\ WARNING
//
// This is a demo server, you MUST NOT use it *as is* in production!
//
// The only purpose of this program is to illustrate how to provide a
// backend server to the demo applications using the Tanker SDK.

// @flow
const assert = require('assert').strict;
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const userToken = require('@tanker/user-token');
const sodium = require('libsodium-wrappers-sumo');
const debugMiddleware = require('debug-error-middleware').express;

const auth = require('./middlewares/auth').default;
const cors = require('./middlewares/cors').default;

const config = require('./config');
const log = require('./log').default;
const home = require('./home').default;
const Storage = require('./storage').default;


let storage;

// Setup server
const setup = (config) => {
  const { dataPath } = config;
  assert(dataPath);
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }
  storage = new Storage(dataPath);
}



// Build express application
const app = express();
app.use(cors); // enable CORS
app.use(bodyParser.text());
app.use(bodyParser.json());
app.options('*', cors); // enable pre-flight CORS requests

// Show helpful error messages. In a production server,
// remove this as it could leak sensitive information.
app.use(debugMiddleware());


// Add routes for the server's home page (readmes...)
app.use(home);


// Add middlewares to log requests on routes defined below
app.use(morgan('dev'));
app.use((req, res, next) => {
  const { userId } = req.query;
  log(`New ${req.path} request` + (userId ? ` from ${userId}:` : ':'));
  next();
});


// Add signup route (non authenticated)
app.get('/signup', (req, res) => {
  const { userId, password } = req.query;
  const hashed_password = sodium.crypto_pwhash_str(password,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
  );

  if (storage.exists(userId)) {
    log(`User "${userId}" already exists`, 1);
    res.sendStatus(409);
    return;
  }

  log('Generate a new user token', 1);
  const token = userToken.generateUserToken(config.trustchainId, config.trustchainPrivateKey, userId);

  log('Save password and token to storage', 1);
  storage.save({ id: userId, hashed_password, token });

  log('Serve the token', 1);
  res.set('Content-Type', 'text/plain');
  res.send(token);
});


// Add authentication middleware for all routes below
//   - check valid "userId" and "password" query params
//   - set res.locals.user for the request handlers
app.use(auth(storage));


// Add authenticated routes
app.get('/login', (req, res) => {
  log('Retrieve token from storage', 1);
  const user = res.locals.user;

  log('Serve the token', 1);
  res.set('Content-Type', 'text/plain');
  res.send(user.token);
});

app.put('/data', (req, res) => {
  const user = res.locals.user;

  log('Save data on storage', 1);
  try {
    user.data = req.body;
    storage.save(user);
  } catch (e) {
    log(e, 1);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(200);
});

app.delete('/data', (req, res) => {
  const user = res.locals.user;

  log('Clear user data', 1);
  storage.clearData(user);
  res.sendStatus(200);
});

app.get('/data/:userId', (req, res) => {
  const { userId } = req.params;
  log('Retrieve data from storage', 1);

  if (!storage.exists(userId)) {
    log(`User ${userId} does not exist`);
    res.sendStatus(404);
    return
  }
  const user = storage.get(userId);

  if (!user.data) {
    log('User has no stored data', 1);
    res.sendStatus(404);
    return
  }

  log('Serve the data', 1);
  res.set('Content-Type', 'text/plain');
  res.send(user.data);
});



app.get('/users', (req, res) => {
  const knownIds = storage.getAllIds();

  res.set('Content-Type', 'application/json');
  res.json(knownIds);
});

// Add
app.post('/share', (req, res) => {
  const { from, to } = req.body;
  // ensure only the current user can share their note with others
  if (from !== res.locals.user.id)
    return res.sendStatus(401);

  storage.share(from, to);
  res.sendStatus('201');
});

app.get('/me', (req, res) => {
  // res.locals.user is set by the auth middleware
  const me = res.locals.user;
  res.json(me);
});

const listen = (port) => {
  app.listen(port);
}

module.exports = {
  listen,
  setup
}
