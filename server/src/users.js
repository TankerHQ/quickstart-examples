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

const addConnection = (from, to) => {
  const path = dataFilePath(to);
  const user = JSON.parse(fs.readFileSync(path));
  if (user.friends === undefined) {
    user.friends = [];
  }
  if (!user.friends.includes(from)) {
    user.friends.push(from);
  }
  save(user)
}

const exists = (id) => {
  const path = dataFilePath(id);
  return fs.existsSync(path);
};

const find = (id) => {
  const path = dataFilePath(id);
  return JSON.parse(fs.readFileSync(path));
};

const save = (user) => {
  const path = dataFilePath(user.id);
  fs.writeFileSync(path, JSON.stringify(user, null, 2));
};

const getAllIds = () => {
  const jsonFiles = fs.readdirSync(dataFolder).filter(f => f.match(/\.json$/));
  const res = [];
  jsonFiles.forEach(path => {
    const fullPath = `${dataFolder}/${path}`;
    const user = JSON.parse(fs.readFileSync(fullPath))
    res.push(user.id);
  });

  return res
}

module.exports = {
  default: {
    addConnection,
    dataFilePath,
    getAllIds,
    exists,
    find,
    save
  }
};
