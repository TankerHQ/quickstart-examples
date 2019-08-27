const session = require('express-session');

const sessionCookieName = 'sessionId';

const middleware = () => session({
  cookie: { maxAge: 1800 * 1000 }, // 30 min
  name: sessionCookieName,
  resave: false,
  saveUninitialized: false,
  secret: 'Tanker rocks!',
});

const regenerate = (req) => new Promise((resolve, reject) => {
  if (req.session) {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
    return;
  }
  reject(new Error('Trying to regenerate a non existing session'));
});

const destroy = (req, res) => new Promise((resolve, reject) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
      } else {
        res.clearCookie(sessionCookieName);
        resolve();
      }
    });
    return;
  }
  resolve(); // no session to destroy
});

module.exports = {
  destroy,
  regenerate,
  middleware,
};
