// You need this middleware if you serve applications on a domain that
// is different from the server's.

// @flow
const cors = require('cors');

const whitelist = [
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3001', // needed if 3000 is already taken, then 3001 is proposed to the user
  'http://localhost:3001',
];

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
});

module.exports = {
  default: corsMiddleware,
  cors: corsMiddleware,
};
