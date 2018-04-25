// @flow
const cors = require('cors');

const whitelist = [
  'http://127.0.0.1:3000',
  'http://localhost:3000'
];

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
});

module.exports = {
  default: corsMiddleware
};
