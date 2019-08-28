// /!\ WARNING
//
// This is a demo server, you MUST NOT use it *as is* in production!
//
// The only purpose of this program is to illustrate how to provide a
// backend server to the demo applications using the Tanker SDK.

// @flow
const { createIdentity, getPublicIdentity, createProvisionalIdentity } = require('@tanker/identity');
const bodyParser = require('body-parser');
const express = require('express');
const emailValidator = require('email-validator');
const fs = require('fs');
const morgan = require('morgan');
const sodium = require('libsodium-wrappers-sumo');
const uuid = require('uuid/v4');

const { getDemoIP } = require('./ip');

const auth = require('./auth');
const cors = require('./cors');
const { watchError, middleware: errorMiddleware } = require('./error');
const log = require('./log');
const home = require('./home');
const session = require('./session');
const Storage = require('./storage');
const { TrustchaindClient } = require('./TrustchaindClient');
const { FakeTrustchaindClient } = require('./FakeTrustchaindClient');

// Build express application
const app = express();
app.disable('x-powered-by'); // don't advertise the use of Express

// Setup server
let serverConfig;
let clientConfig;

const makeClientConfig = (fullConfig) => {
  // WARNING: the app secret MUST never be sent to the client
  const { dataPath, appSecret, ...config } = fullConfig;
  return config;
};

const setup = async (config) => {
  serverConfig = config;
  clientConfig = makeClientConfig(config);

  const {
    dataPath, appId, testMode, authToken,
  } = config;
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }
  app.storage = new Storage(dataPath, appId);


  if (testMode) {
    app.trustchaindClient = new FakeTrustchaindClient();
  } else {
    const trustchaindUrl = config.url || 'https://api.tanker.io';
    app.trustchaindClient = new TrustchaindClient({ trustchaindUrl, authToken, appId });
  }

  // Libsodium loads asynchronously (Wasm module)
  await sodium.ready;
};

const sanitizePublicUser = async (user) => {
  const { hashed_password, identity, provisionalIdentity, _provisionalIdentity, ...otherAttributes } = user; // eslint-disable-line

  const publicIdentity = await getPublicIdentity(identity || provisionalIdentity);
  return { ...otherAttributes, publicIdentity };
};

const reviveUsers = async (ids) => Promise.all(
  ids.map((id) => sanitizePublicUser(app.storage.get(id))),
);

const sanitizeUser = async (user) => {
  const { hashed_password, ...safeUser } = user; // eslint-disable-line camelcase
  safeUser.accessibleNotes = await reviveUsers(safeUser.accessibleNotes || []);
  safeUser.noteRecipients = await reviveUsers(safeUser.noteRecipients || []);
  safeUser.publicIdentity = await getPublicIdentity(safeUser.identity);
  return safeUser;
};

app.use(cors.middleware()); // enable CORS
app.use(bodyParser.text());
app.use(bodyParser.json());
app.options('*', cors.middleware()); // enable pre-flight CORS requests


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
app.get('/logout', watchError(async (req, res) => {
  log('Destroy the current session if any', 1);
  await session.destroy(req, res);
  res.status(200).json('{}');
}));


// Add signup route (non authenticated)
app.post('/signup', watchError(async (req, res) => {
  const { email, password } = req.body;
  const { appId, appSecret } = serverConfig;

  if (!email || !emailValidator.validate(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  if (!password) {
    res.status(400).json({ error: 'Missing password' });
    return;
  }

  let user = app.storage.getByEmail(email);

  if (user) {
    if (user.identity) {
      log(`Email ${email} already taken`, 1);
      res.status(409).json({ error: 'Email already taken' });
      return;
    }
  } else {
    user = { id: uuid(), email };
  }

  log('Hash the password', 1);
  user.hashed_password = auth.hashPassword(password);

  log('Generate a new Tanker identity', 1);
  user.identity = await createIdentity(
    appId,
    appSecret,
    user.id,
  );

  log('Save the user to storage', 1);
  app.storage.save(user);

  log('Save the userId in the session', 1);
  await session.regenerate(req);
  req.session.userId = user.id;

  log('Return the user', 1);
  res.set('Content-Type', 'application/json');
  res.status(201).json(await sanitizeUser(user));
}));

// Add login route (non authenticated)
app.post('/login', watchError(async (req, res) => {
  const { email, password } = req.body;

  log('Check login credentials', 1);

  if (!email || !password) {
    log('Missing email or password', 1);
    res.status(400).json({ error: 'Missing email or password' });
    return;
  }

  const user = app.storage.getByEmail(email);
  if (!user || !(user.identity || user.token)) {
    log(`Authentication error: ${email} not found`, 1);
    res.status(404).json({ error: `Authentication error: ${email} not found` });
    return;
  }

  const passwordOk = auth.verifyPassword(user, password);
  if (!passwordOk) {
    log('Authentication error: invalid password', 1);
    res.status(401).json({ error: 'Authentication error: invalid password' });
    return;
  }

  log('Save the userId in the session', 1);
  await session.regenerate(req);
  req.session.userId = user.id;

  log('Serve the identity', 1);
  res.set('Content-Type', 'application/json');
  res.json(await sanitizeUser(user));
}));

app.post('/requestResetPassword', watchError(async (req, res) => {
  const userEmail = req.body.email;
  const user = app.storage.getByEmail(userEmail);
  if (!user) {
    res.status(404).json({ error: `no such email: ${userEmail}` });
    return;
  }

  const secret = auth.generateSecret();
  const passwordResetToken = auth.generatePasswordResetToken({ userId: user.id, secret });
  app.storage.setPasswordResetSecret(user.id, secret);

  const resetLink = `http://${getDemoIP()}:3000/confirm-password-reset#${passwordResetToken}`;

  // TODO remove this DEBUG statement from server console output
  console.log(`DEBUG Notepad password reset link: ${resetLink}`);

  // TODO send this via a mailer other than Tanker's:
  /*
  const email = {
    from_name: 'Notepad',
    from_email: `noreply@${serverConfig.domain}`,
    to_email: userEmail,
    subject: 'Notepad password reset',
    html: `
      <p>Hi,</p>
      <p>
        You requested a password reset. Please click
        <a href="${resetLink}">
          here
        </a>
        to set a new password.
      </p>
      <p>To keep your account secure, please don't forward this email to anyone.</p>
      <p>
        Best regards,<br />
        Notepad Team
      </p>
    `,
  };
  */

  res.status(200).json('{}');
}));

const authByPasswordResetToken = (passwordResetToken) => {
  let success = false;
  let user = null;

  try {
    const { userId, secret } = auth.parsePasswordResetToken(passwordResetToken);
    user = app.storage.get(userId);

    if (user.password_reset_secret === secret) {
      success = true;
    }
  } catch (e) {} // eslint-disable-line no-empty

  return { success, user };
};

app.post('/requestVerificationCode', watchError(async (req, res) => {
  const { passwordResetToken } = req.body;

  if (!passwordResetToken) {
    res.status(401).json({ error: 'Invalid password reset token' });
    return;
  }

  const { success, user } = authByPasswordResetToken(passwordResetToken);

  if (!success) {
    // Reset secret if bad token provided for a user (avoid guessing)
    if (user) {
      user.password_reset_secret = undefined;
      app.storage.save(user);
    }

    res.status(401).json({ error: 'Invalid password reset token' });
    return;
  }

  try {
    const email_data = {
      from_name: 'Notepad x Tanker',
      to_email: user.email,
      subject: 'Verification code',
      html: `
        <p>Hi,</p>
        <p>Here is your personal verification code:&nbsp;&nbsp;<b>TANKER_VERIFICATION_CODE</b></p>
        <p>To keep your account secure, please don't forward this email to anyone.</p>
        <p>
          Best regards,<br />
          Notepad Team
        </p>
      `,
    };

    const response = await app.trustchaindClient.sendVerification({ email_data });

    if (!response.ok) {
      const error = await response.text();
      res.status(500).json({ error: `sendVerification failed with status ${response.status}: ${JSON.stringify(error)}` });
      return;
    }

    res.status(200).json('{}');
  } catch (error) {
    console.error(error);
  }
}));

app.post('/resetPassword', watchError(async (req, res) => {
  const { newPassword, passwordResetToken } = req.body;

  if (!newPassword) {
    res.status(401).json({ error: 'Invalid new password' });
    return;
  }

  if (!passwordResetToken) {
    res.status(401).json({ error: 'Invalid password reset token' });
    return;
  }

  const { success, user } = authByPasswordResetToken(passwordResetToken);

  // Reset secret whether success or not (avoid guessing)
  if (user) {
    user.password_reset_secret = undefined;
    app.storage.save(user);
  }

  if (!success) {
    res.status(401).json({ error: 'Invalid password reset token' });
    return;
  }

  user.hashed_password = auth.hashPassword(newPassword);
  app.storage.save(user);

  res.set('Content-Type', 'application/json');
  res.status(201).json(await sanitizeUser(user));
}));

// Add authentication middleware for all routes below
//   - check valid session cookie
//   - set res.locals.user for the request handlers
app.use(auth.middleware(app));

// Add authenticated routes
app.get('/me', watchError(async (req, res) => {
  // res.locals.user is set by the auth middleware
  const safeMe = await sanitizeUser(res.locals.user);
  res.json(safeMe);
}));

app.put('/me/password', (req, res) => {
  const { user } = res.locals;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    log('Invalid arguments', 1);
    res.status(400).json({ error: 'Invalid argmuments' });
    return;
  }

  log('Verify old password', 1);
  const passwordOk = auth.verifyPassword(user, oldPassword);
  if (!passwordOk) {
    log('Wrong old password', 1);
    res.status(400).json({ error: 'Wrong old password' });
    return;
  }

  log('Change password', 1);
  user.hashed_password = auth.hashPassword(newPassword);
  app.storage.save(user);
  res.sendStatus(200);
});

app.put('/me/email', watchError(async (req, res) => {
  const { user } = res.locals;
  const { email } = req.body;

  if (!email || !emailValidator.validate(email)) {
    log('Invalid new email address', 1);
    res.status(400).json({ error: 'Invalid new email address' });
    return;
  }

  const otherUser = app.storage.getByEmail(email);
  if (otherUser) {
    log(`Email ${email} already taken`, 1);
    res.status(409).json({ error: 'Email already taken' });
    return;
  }

  log('Change email', 1);
  user.email = email;
  app.storage.save(user);
  res.sendStatus(200);
}));

app.post('/me/requestVerificationCode', watchError(async (req, res) => {
  let { email } = req.body;
  email = email || res.locals.user.email;

  const email_data = {
    from_name: 'Notepad x Tanker',
    to_email: email,
    subject: 'Verification code',
    html: `
      <p>Hi,</p>
      <p>Here is your personal verification code:&nbsp;&nbsp;<b>TANKER_VERIFICATION_CODE</b></p>
      <p>To keep your account secure, please don't forward this email to anyone.</p>
      <p>
        Best regards,<br />
        Notepad Team
      </p>
    `,
  };

  const response = await app.trustchaindClient.sendVerification({ email_data });

  if (!response.ok) {
    const error = await response.text();
    res.status(500).json({ error: `sendVerification failed with status ${response.status}: ${JSON.stringify(error)}` });
    return;
  }

  res.status(200).json('{}');
}));

app.post('/me/claimed', watchError(async (req, res) => {
  const { user } = res.locals;

  log('Save data on storage', 1);
  try {
    user._provisionalIdentity = user.provisionalIdentity; // eslint-disable-line
    delete user.provisionalIdentity;
    app.storage.save(user);
  } catch (e) {
    log(e, 1);
    res.status(500).json({ error: e.toString() });
    return;
  }

  res.sendStatus(200);
}));


app.put('/data', (req, res) => {
  const { user } = res.locals;

  log('Save data on storage', 1);
  try {
    user.data = req.body;
    app.storage.save(user);
  } catch (e) {
    log(e, 1);
    res.status(500).json({ error: e.toString() });
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
    res.status(404).json({ error: `User ${userId} does not exist` });
    return;
  }
  const user = app.storage.get(userId);

  if (!user.data) {
    log('User has no stored data', 1);
    res.status(404).json({ error: 'User has no stored data' });
    return;
  }

  log('Serve the data', 1);
  res.set('Content-Type', 'text/plain');
  res.send(user.data);
});


app.get('/users', watchError(async (req, res) => {
  let users = app.storage.getAll();

  if (req.query && req.query.email instanceof Array) {
    const emails = req.query.email;
    users = users.filter((user) => emails.includes(user.email));
    const foundEmails = users.map((user) => user.email);

    await Promise.all(emails.map(async (email) => {
      if (!foundEmails.includes(email)) {
        const user = {
          id: uuid(),
          email,
          provisionalIdentity: await createProvisionalIdentity(serverConfig.appId, email),
        };

        app.storage.save(user);

        users.push(user);
      }
    }));
  }

  const safeUsers = await Promise.all(users.map(sanitizePublicUser));

  res.set('Content-Type', 'application/json');
  res.json(safeUsers);
}));

// Register a new share
app.post('/share', (req, res) => {
  const { from, to } = req.body;
  // ensure only the current user can share their note with others
  if (from !== res.locals.user.id) {
    res.status(401).json({ error: 'Forbidden to share a note that does not belong to you' });
    return;
  }

  app.storage.share(from, to);
  res.sendStatus('201');
});

app.use(errorMiddleware);

module.exports = {
  setup,
  app,
};
