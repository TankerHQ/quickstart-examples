// /!\ WARNING
//
// This is a demo server, you MUST NOT use it *as is* in production!
//
// The only purpose of this program is to illustrate how to provide a
// backend server to the demo applications using the Tanker SDK.

// @flow
const bodyParser = require('body-parser');
const debugMiddleware = require('debug-error-middleware').express;
const express = require('express');
const emailValidator = require('email-validator');
const fs = require('fs');
const morgan = require('morgan');
const sodium = require('libsodium-wrappers-sumo');
const uuid = require('uuid/v4');
const userToken = require('@tanker/user-token');

const auth = require('./auth');
const cors = require('./cors');
const log = require('./log');
const home = require('./home');
const session = require('./session');
const Storage = require('./storage');
const { FakeTrustchaindClient, TrustchaindClient } = require('./TrustchaindClient');

// Build express application
const app = express();
app.disable('x-powered-by'); // don't advertise the use of Express

// Setup server
let serverConfig;
let clientConfig;

const makeClientConfig = (fullConfig) => {
  // WARNING: the Trustchain private key MUST never be sent to the client
  const { dataPath, trustchainPrivateKey, ...config } = fullConfig;
  return config;
};

const setup = async (config) => {
  serverConfig = config;
  clientConfig = makeClientConfig(config);

  const {
    dataPath, trustchainId, testMode, authToken,
  } = config;
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }
  app.storage = new Storage(dataPath, trustchainId);


  if (testMode) {
    app.trustchaindClient = new FakeTrustchaindClient();
  } else {
    const trustchaindUrl = config.url || 'https://api.tanker.io';
    app.trustchaindClient = new TrustchaindClient({ trustchaindUrl, authToken, trustchainId });
  }

  // Libsodium loads asynchronously (Wasm module)
  await sodium.ready;
};

const sanitizePublicUser = (user) => {
  const { hashed_password, token, ...safeUser } = user; // eslint-disable-line camelcase
  return safeUser;
};

const reviveUsers = ids => ids.map(id => sanitizePublicUser(app.storage.get(id)));

const sanitizeUser = (user) => {
  const { hashed_password, ...safeUser } = user; // eslint-disable-line camelcase
  safeUser.accessibleNotes = reviveUsers(safeUser.accessibleNotes || []);
  safeUser.noteRecipients = reviveUsers(safeUser.noteRecipients || []);
  return safeUser;
};

app.use(cors.middleware()); // enable CORS
app.use(bodyParser.text());
app.use(bodyParser.json());
app.options('*', cors.middleware()); // enable pre-flight CORS requests

// Show helpful error messages. In a production server,
// remove this as it could leak sensitive information.
app.use(debugMiddleware());


// Add routes for the server's home page (readmes...)
app.use(home);


// Add middlewares to log requests on routes defined below
app.use(morgan('dev'));
app.use((req, res, next) => {
  const { email } = req.query;
  const maybeFrom = email ? ` from ${email}:` : ':';
  log(`New ${req.path} request${maybeFrom}`);
  next();
});

// Add config route (non authenticated)
app.get('/config', (req, res) => {
  log('Serve the client Tanker config', 1);
  res.set('Content-Type', 'application/json');
  res.status(200).send(clientConfig);
});


// Add session middleware
app.use(session.middleware());


// Add logout route (non authenticated)
app.get('/logout', async (req, res) => {
  log('Destroy the current session if any', 1);
  await session.destroy(req, res);
  res.status(200).json('{}');
});


// Add signup route (non authenticated)
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const { trustchainId, trustchainPrivateKey } = serverConfig;

  if (!email || !emailValidator.validate(email)) {
    res.status(400).send('Invalid email address');
    return;
  }

  if (!password) {
    res.status(400).send('Missing password');
    return;
  }

  const existingUserId = app.storage.emailToId(email);

  if (existingUserId) {
    log(`Email ${email} already taken`, 1);
    res.status(409).json({ error: 'Email already taken' });
    return;
  }

  const userId = uuid();

  log('Hash the password', 1);
  const hashedPassword = auth.hashPassword(password);

  log('Generate a new user token', 1);
  const token = userToken.generateUserToken(
    trustchainId,
    trustchainPrivateKey,
    userId,
  );

  log('Save the user to storage', 1);
  const user = {
    id: userId, email, hashed_password: hashedPassword, token,
  };
  app.storage.save(user);

  log('Save the userId in the session', 1);
  await session.regenerate(req);
  req.session.userId = userId;

  log('Return the user id and token', 1);
  res.set('Content-Type', 'application/json');
  res.status(201).json(sanitizeUser(user));
});

// Add login route (non authenticated)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  log('Check login credentials', 1);

  if (!email || !password) {
    log('Missing email or password', 1);
    res.sendStatus(400);
    return;
  }

  const userId = app.storage.emailToId(email);
  if (!userId) {
    log(`Authentication error: ${email} not found`, 1);
    res.sendStatus(404);
    return;
  }

  const user = app.storage.get(userId);
  const passwordOk = auth.verifyPassword(user, password);
  if (!passwordOk) {
    log('Authentication error: invalid password', 1);
    res.sendStatus(401);
    return;
  }

  log('Save the userId in the session', 1);
  await session.regenerate(req);
  req.session.userId = userId;

  log('Serve the token', 1);
  res.set('Content-Type', 'application/json');
  res.json(sanitizeUser(user));
});

app.post('/requestResetPassword', async (req, res) => {
  try {
    const userEmail = req.body.email;
    const userId = app.storage.emailToId(userEmail);
    if (userId === null) {
      res.status(404).json({ error: `no such email: ${userEmail}` });
      return;
    }

    const secret = auth.generateSecret();
    const passwordResetToken = auth.generatePasswordResetToken({ userId, secret });
    app.storage.setPasswordResetSecret(userId, secret);

    const emailDomain = serverConfig.domain;
    const confirmUrl = `http://127.0.0.1:3000/confirm-password-reset#${passwordResetToken}:TANKER_VERIFICATION_CODE`;

    const email = {
      subject: 'Password Reset',
      html: `<p>Click <a href="${confirmUrl}">here</a> to reset your password</p>`,
      from_email: `noreply@${emailDomain}`,
      from_name: 'the friendly unlock server',
      to_email: userEmail,
    };

    const response = await app.trustchaindClient.sendVerification({
      userId,
      email,
    });

    if (!response.ok) {
      const error = await response.text();
      res.status(500).json(`sendVerification failed with status ${response.status}: ${JSON.stringify(error)}`);
      return;
    }
    res.status(200).json('{}');
  } catch (error) {
    console.error(error);
  }
});

app.post('/resetPassword', (req, res) => {
  const { newPassword, passwordResetToken } = req.body;

  if (!newPassword) {
    res.status(401).json('Invalid new password');
    return;
  }

  if (!passwordResetToken) {
    res.status(401).json('Invalid password reset token');
    return;
  }

  let userId;
  let secret;
  try {
    ({ userId, secret } = auth.parsePasswordResetToken(passwordResetToken));
  } catch (error) {
    res.status(401).json('Invalid password reset token');
    return;
  }

  let user;
  try {
    user = app.storage.get(userId);
  } catch (error) {
    res.status(401).json('Invalid password reset token');
    return;
  }

  const storedSecret = user.password_reset_secret;

  if (!storedSecret) {
    res.status(401).json('Invalid password reset token');
    return;
  }

  if (secret !== storedSecret) {
    res.status(401).json('Invalid password reset token');
    user.password_reset_secret = undefined;
    app.storage.save(user);
    return;
  }
  user.password_reset_secret = undefined;
  user.hashed_password = auth.hashPassword(newPassword);
  app.storage.save(user);

  res.set('Content-Type', 'application/json');
  res.status(200).json({ userId, email: user.email });
});


// Add authentication middleware for all routes below
//   - check valid session cookie
//   - set res.locals.user for the request handlers
app.use(auth.middleware(app));

// Add authenticated routes
app.get('/me', (req, res) => {
  // res.locals.user is set by the auth middleware
  const safeMe = sanitizeUser(res.locals.user);
  res.json(safeMe);
});

app.put('/me/password', (req, res) => {
  const { user } = res.locals;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    log('Invalid arguments', 1);
    res.sendStatus(400);
    return;
  }

  log('Verify old password', 1);
  const passwordOk = auth.verifyPassword(user, oldPassword);
  if (!passwordOk) {
    log('Wrong old password', 1);
    res.sendStatus(400, 1);
    return;
  }

  log('Change password', 1);
  user.hashed_password = auth.hashPassword(newPassword);
  app.storage.save(user);
  res.sendStatus(200);
});

app.put('/me/email', async (req, res) => {
  const { user } = res.locals;
  const { email } = req.body;

  if (!email || !emailValidator.validate(email)) {
    log('Invalid new email address', 1);
    res.sendStatus(400);
    return;
  }

  const otherUser = app.storage.emailToId(email);
  if (otherUser) {
    log(`Email ${email} already taken`, 1);
    res.status(409).json({ error: 'Email already taken' });
    return;
  }

  log('Change email', 1);
  user.email = email;
  app.storage.save(user);
  res.sendStatus(200);
});

app.put('/data', (req, res) => {
  const { user } = res.locals;

  log('Save data on storage', 1);
  try {
    user.data = req.body;
    app.storage.save(user);
  } catch (e) {
    log(e, 1);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(200);
});

app.delete('/data', (req, res) => {
  const { user } = res.locals;

  log('Clear user data', 1);
  app.storage.clearData(user.id);
  res.sendStatus(200);
});

app.get('/data/:userId', (req, res) => {
  const { userId } = req.params;
  log('Retrieve data from storage', 1);

  if (!app.storage.exists(userId)) {
    log(`User ${userId} does not exist`);
    res.sendStatus(404);
    return;
  }
  const user = app.storage.get(userId);

  if (!user.data) {
    log('User has no stored data', 1);
    res.sendStatus(404);
    return;
  }

  log('Serve the data', 1);
  res.set('Content-Type', 'text/plain');
  res.send(user.data);
});


app.get('/users', (req, res) => {
  const allUsers = app.storage.getAll();
  const safeUsers = allUsers.map(sanitizePublicUser);

  res.set('Content-Type', 'application/json');
  res.json(safeUsers);
});

// Register a new share
app.post('/share', (req, res) => {
  const { from, to } = req.body;
  // ensure only the current user can share their note with others
  if (from !== res.locals.user.id) {
    res.sendStatus(401);
    return;
  }

  app.storage.share(from, to);
  res.sendStatus('201');
});

// Return nice 500 message when an exception is thrown
const errorHandler = (err, req, res, next) => { // eslint-disable-line  no-unused-vars
  console.error(err);
  res.status(500);
  res.json({ error: err.message });
  // Note: we don't call next() because we don't want the request to continue
};
app.use(errorHandler);


module.exports = {
  setup,
  app,
};
