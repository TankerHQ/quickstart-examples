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
const morgan = require('morgan');
const userToken = require('@tanker/user-token');
const sodium = require('libsodium-wrappers-sumo');

const auth = require('./middlewares/auth').default;
const cors = require('./middlewares/cors').default;

const config = require('./config');
const log = require('./log').default;
const home = require('./home').default;
const users = require('./users').default;



// Build express application
const app = express();
const port = 8080;
app.use(cors); // enable CORS
app.use(bodyParser.text());
app.options('*', cors); // enable pre-flight CORS requests


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

  if (users.exists(userId)) {
    log(`User "${userId}" already exists`, 1);
    res.sendStatus(409);
    return;
  }

  log('Generate a new user token', 1);
  const token = userToken.generateUserToken(config.trustchainId, config.trustchainPrivateKey, userId);

  log('Save password and token to storage', 1);
  users.save({ id: userId, hashed_password, token });

  log('Serve the token', 1);
  res.set('Content-Type', 'text/plain');
  res.send(token);
});


// Add authentication middleware for all routes below
//   - check valid "userId" and "password" query params
//   - set res.locals.user for the request handlers
app.use(auth);


// Add authenticated routes
app.get('/login', (req, res) => {
  log('Retrieve token from storage', 1);
  const user = res.locals.user;

  log('Serve the token', 1);
  res.set('Content-Type', 'text/plain');
  res.send(user.token);
});

app.put('/data', async (req, res) => {
  const user = res.locals.user;

  log('Save data on storage', 1);
  try {
    user.data = await req.body;
    users.save(user);
  } catch (e) {
    log(e, 1);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(200);
});

app.get('/data', async (req, res) => {
  log('Retrieve data from storage', 1);
  const user = res.locals.user;

  if (user.data) {
    log('Serve the data', 1);
    res.set('Content-Type', 'text/plain');
    res.send(user.data);
    return;
  }

  log('User has no stored data', 1);
  res.sendStatus(404);
});


// Start application
log('Tanker mock server:');
log(`Configured with Trustchain: ${config.trustchainId}`, 1);
log(`Listening on http://localhost:${port}/`, 1);

app.listen(port);
