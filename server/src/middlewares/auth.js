// @flow
const log = require('../log');
const sodium = require('libsodium-wrappers-sumo');

const authMiddleware = (storage, req, res, next) => {
  const { userId, password } = req.query;

  // Check valid auth credentials
  log('Check authentication', 1);

  if (!password) {
    res.sendStatus(400);
    return;
  }


  if (typeof userId !== 'string' || !storage.exists(userId)) {
    log(`Authentication error: user "${userId}" does not exist`, 1);
    res.sendStatus(404);
    return;
  }

  const user = storage.get(userId);
  const hashMatches = sodium.crypto_pwhash_str_verify(user.hashed_password, password);
  if (!hashMatches) {
    log('Authentication error: invalid password', 1);
    res.sendStatus(401);
    return;
  }

  // Forward the user to the next request handler
  res.locals.user = user;
  next();
};

const auth = (app) => { return (req, res, next) => authMiddleware(app.storage, req, res, next) };


module.exports = auth;
