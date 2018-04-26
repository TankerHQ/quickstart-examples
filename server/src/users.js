// @flow
const fs = require('fs');
const path = require('path');

const config = require('./config');

// Ensure folder exists to store tokens for the configured trustchain
const dataFolder = `../data/${config.trustchainId.replace(/[\/\\]/g, '_')}`;

if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder);
}

// Helpers to read/write user data
const dataFilePath = userId => `${dataFolder}/${userId.replace(/[\/\\]/g, '_')}.json`;

const exists = (id) => {
  const path = dataFilePath(id);
  return fs.existsSync(path);
};

const find = (id, password) => {
  const path = dataFilePath(id);
  return JSON.parse(fs.readFileSync(path));
};

const save = (user) => {
  const path = dataFilePath(user.id);
  fs.writeFileSync(path, JSON.stringify(user, null, 2));
};

module.exports = {
  default: {
    dataFilePath,
    exists,
    find,
    save
  }
};
