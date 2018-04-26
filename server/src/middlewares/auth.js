// @flow
const log = require('../log').default;
const users = require('../users').default;

const authMiddleware = (req, res, next) => {
  const { userId, password } = req.query;

  // Check valid auth credentials
  log('Check authentication', 1);

  if (typeof userId !== 'string' || !users.exists(userId)) {
    log(`Authentication error: user "${userId}" does not exist`, 1);
    res.sendStatus(404);
    return;
  }

  const user = users.find(userId);

  if (password !== user.password) {
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