// @flow
const log = require('../log');
const sodium = require('libsodium-wrappers-sumo');

const hashPassword = async (password) => {
  await sodium.ready;
  return sodium.crypto_pwhash_str(
    password,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
  );
};

const verifyPassword = async (user, password) => {
  await sodium.ready;
  return sodium.crypto_pwhash_str_verify(user.hashed_password, password);
};

const authMiddleware = async (storage, req, res, next) => {
  const { email, password } = req.query;

  // Check valid auth credentials
  log('Check authentication', 1);

  if (!password || !email) {
    log('Missing email or password', 1);
    res.sendStatus(400);
    return;
  }

  const userId = storage.emailToId(email);
  if (!userId) {
    log(`Authentication error: ${email} not found`, 1);
    res.sendStatus(404);
    return;
  }

  const user = storage.get(userId);
  const passwordOk = await verifyPassword(user, password);
  if (!passwordOk) {
    log('Authentication error: invalid password', 1);
    res.sendStatus(401);
    return;
  }

  // Forward the user to the next request handler
  res.locals.user = user;
  next();
};

const authMiddlewareBuilder = (app) => { // eslint-disable-line arrow-body-style
  return (req, res, next) => authMiddleware(app.storage, req, res, next).catch((err) => {
    // Forward error to the global Express error handler
    next(err);
  });
};

module.exports = {
  authMiddlewareBuilder,
  hashPassword,
  verifyPassword,
};
