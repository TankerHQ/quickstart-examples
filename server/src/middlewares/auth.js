// @flow
const log = require('../log');
const sodium = require('libsodium-wrappers-sumo');

const hashPassword = password => sodium.crypto_pwhash_str(
  password,
  sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
  sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
);

const verifyPassword = (user, password) => { // eslint-disable-line arrow-body-style
  return sodium.crypto_pwhash_str_verify(user.hashed_password, password);
};

const authMiddleware = (storage, req, res, next) => {
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
  const passwordOk = verifyPassword(user, password);
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
  return (req, res, next) => authMiddleware(app.storage, req, res, next);
};

const generateSecret = () => sodium.randombytes_buf(32);

const generatePasswordResetToken = ({ email, secret }) => {
  const b64secret = sodium.to_base64(secret);
  const asString = JSON.stringify({ email, secret: b64secret });
  const buf = sodium.from_string(asString);
  return sodium.to_base64(buf);
};


const parsePasswordResetToken = (b64token) => {
  const buf = sodium.from_base64(b64token);
  const string = sodium.to_string(buf);
  const obj = JSON.parse(string);
  const b64secret = obj.secret;
  return {
    email: obj.email,
    secret: sodium.from_base64(b64secret),
  };
};

module.exports = {
  authMiddlewareBuilder,
  hashPassword,
  verifyPassword,
  generateSecret,
  generatePasswordResetToken,
  parsePasswordResetToken,
};
