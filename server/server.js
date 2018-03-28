// WARNING WARNING WARNING
// This is a demo server, you MUST NOT use it *as is* in production!
// Nothing in this piece of code, is safe nor reliable, nor intented to be.
// This program is provided as an example, and as an example only!
// This only purpose is to illustrate how to use and articulate the tanker SDK
// with your application services.

// @flow
const express = require('express');
const fs = require('fs');
const usertoken = require('@tanker/user-token');
const bodyParser = require('body-parser');

const { corsMiddleware } = require('./corsMiddleware.js');
const config = require('./server-config.js');

/* eslint-disable no-console */

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(corsMiddleware);
app.use(bodyParser.text());

app.get('/signup', (req, res) => {
  const { userId, password } = req.query;

  console.log(`New Sign Up request: ${userId}`);

  const path = `./${userId}.txt`;

  console.log(`New request: ${userId}`);

  if (fs.existsSync(path)) {
    console.log('User already exists');
    res.sendStatus(409);
    return;
  }

  console.log('Creating new token');
  const token = usertoken.generateUserToken(config.trustchainId, config.trustchainPrivateKey, userId);
  // Save newly generated token to storage
  fs.writeFileSync(path, JSON.stringify({ password, token }));
  res.send(token);
});

app.get('/login', (req, res) => {
  const { userId, password } = req.query;

  console.log(`New Login request: ${userId}`);

  const path = `./${userId}.txt`;

  if (!fs.existsSync(path)) {
    console.log('User does not exist');
    res.sendStatus(404);
    return;
  }

  const user = JSON.parse(fs.readFileSync(path).toString());

  // Request must be authenticated
  if (password !== user.password) {
    console.log('Authentication error');
    res.sendStatus(401);
    return;
  }
  res.send(user.token);
});

app.put('/:userId/:password', async (req, res) => {
  const { userId, password } = req.params;
  console.log(`put for ${userId}`);
  const path = `./${userId}.txt`;

  if (!fs.existsSync(path)) {
    console.log('User not found');
    res.sendStatus(404);
    return;
  }
  try {
    const user = JSON.parse(fs.readFileSync(path).toString());
    if (user.password !== password) {
      console.log('Authentication error');
      res.sendStatus(401);
      return;
    }
    const content = await req.body;
    user.data = content;
    fs.writeFileSync(path, JSON.stringify(user));
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
  res.sendStatus(200);
});

app.get('/:userId/:password/', async (req, res) => {
  const { userId, password } = req.params;
  console.log(`get for ${userId}`);
  const path = `./${userId}.txt`;

  if (!fs.existsSync(path)) {
    console.log('User not found');
    res.sendStatus(404);
    return;
  }
  try {
    const user = JSON.parse(fs.readFileSync(path).toString());
    if (user.password !== password) {
      console.log('Authentication error');
      res.sendStatus(401);
      return;
    }
    res.send(user.data);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});


console.log('Listening on http://localhost:8080');
app.listen(8080);
