// @flow

// Return nice 500 message when an exception is thrown
const middleware = (err, req, res, next) => { // eslint-disable-line  no-unused-vars
  console.error(err);
  res.status(500);
  res.json({ error: err.message });
  // Note: we don't call next() because we don't want the request to continue
};

const watchError = (fn) => (req, res, next) => { // eslint-disable-line arrow-body-style
  return Promise
    .resolve(fn(req, res, next))
    .catch(next);
};

module.exports = {
  watchError,
  middleware,
};
