// @flow
const log = require('../log').default;
const users = require('../users').default;
const sodium = require('libsodium-wrappers-sumo');

const authMiddleware = (req, res, next) => {
  const { userId, password } = req.query;

  // Check valid auth credentials
  log('Check authentication', 1);

  if (!users.exists(userId)) {
    log(`Authentication error: user "${userId}" does not exist`, 1);
    res.sendStatus(404);
    return;
  }

  const user = users.find(userId);


  const hash_matches = sodium.crypto_pwhash_str_verify(user.hashed_password, password);
  if (!hash_matches) {
    log('Authentication error: invalid password', 1);
    res.sendStatus(401);
    return;
  }

  // Forward the user to the next request handler
  res.locals.user = user;
  next();
};

module.exports = {
  default: authMiddleware,
  auth: authMiddleware
}
