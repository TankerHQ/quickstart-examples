// @flow
const sodium = require('libsodium-wrappers-sumo');
const log = require('./log');

const hashPassword = (password) => sodium.crypto_pwhash_str(
  password,
  sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
  sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
);

const verifyPassword = (user, password) => { // eslint-disable-line arrow-body-style
  return sodium.crypto_pwhash_str_verify(user.hashed_password, password);
};

const middlewareHandler = (storage, req, res, next) => {
  const { userId } = req.session;
  if (!userId) {
    log('Unauthorized: not logged in or session expired', 1);
    res.sendStatus(401);
    return;
  }

  const user = storage.get(userId);
  if (!user) {
    log(`Server error: ${userId} not found`, 1);
    res.sendStatus(500);
    return;
  }

  // Forward the user to the next request handler
  res.locals.user = user;
  next();
};

const middleware = (app) => { // eslint-disable-line arrow-body-style
  return (req, res, next) => middlewareHandler(app.storage, req, res, next);
};

const generateSecret = () => sodium.to_base64(sodium.randombytes_buf(32));

const generatePasswordResetToken = ({ userId, secret }) => {
  const asString = JSON.stringify({ userId, secret });
  const buf = sodium.from_string(asString);
  return sodium.to_base64(buf);
};

const parsePasswordResetToken = (b64token) => {
  const buf = sodium.from_base64(b64token);
  const string = sodium.to_string(buf);
  return JSON.parse(string);
};

module.exports = {
  middleware,
  hashPassword,
  verifyPassword,
  generateSecret,
  generatePasswordResetToken,
  parsePasswordResetToken,
};
