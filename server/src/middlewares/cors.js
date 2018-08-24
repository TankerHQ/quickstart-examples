// You need this middleware if you serve applications on a domain that
// is different from the server's.

// @flow
const cors = require('cors');

const allowedOrigins = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

module.exports = () => cors({
  credentials: true, // adds header Access-Control-Allow-Credentials: true
  origin: (origin, callback) => {
    if (!origin || origin.match(allowedOrigins)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
});
