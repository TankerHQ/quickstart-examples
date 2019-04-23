// You need this middleware if you serve applications on a domain that
// is different from the server's.

// @flow
const cors = require('cors');

// Allow all http(s) origins. In a real application, restrict to your domains / ips.
const allowedOrigins = /^https?:\/\//;

const middleware = () => cors({
  credentials: true, // adds header Access-Control-Allow-Credentials: true
  origin: (origin, callback) => {
    if (!origin || origin.match(allowedOrigins)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
});

module.exports = {
  middleware,
};
