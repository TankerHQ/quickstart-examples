// You need this middleware if you serve applications on a domain that
// is different from the server's.

// @flow
const cors = require('cors');

const allowedOrigins = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || origin.match(allowedOrigins)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
});

module.exports = corsMiddleware;
