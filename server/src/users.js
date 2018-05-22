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
const dataFilePath = userId =>
  `${dataFolder}/${userId.replace(/[\/\\]/g, '_')}.json`;

// record a share:
//  - for each recipient in `to` add the note `from` to the accessibleNotes
//  - store the list of recipients `to` for the current user `from`
const share = (from, to) => {
  to.forEach(recipient => {
    addAccessibleNoteId(from, recipient);
  });
  addNoteRecipients(from, to);
};

// Record that `to` shared a note with `from`
const addAccessibleNoteId = (from, to) => {
  const user = find(to);
  if (!user.accessibleNotes) {
    user.accessibleNotes = [];
  }
  if (!user.accessibleNotes.includes(from)) {
    user.accessibleNotes.push(from);
  }
  save(user);
};

// Record that the note of `from` is shared with `to`
const addNoteRecipients = (from, to) => {
  const user = find(from);
  user.noteRecipients = to;
  save(user);
};

const exists = id => {
  const path = dataFilePath(id);
  return fs.existsSync(path);
};

const find = id => {
  const path = dataFilePath(id);
  return JSON.parse(fs.readFileSync(path));
};

const save = user => {
  const path = dataFilePath(user.id);
  fs.writeFileSync(path, JSON.stringify(user, null, 2));
};

const getAllIds = () => {
  const jsonFiles = fs.readdirSync(dataFolder).filter(f => f.match(/\.json$/));
  return jsonFiles.map(path => {
    const fullPath = `${dataFolder}/${path}`;
    const user = JSON.parse(fs.readFileSync(fullPath));
    return user.id;
  });
};

module.exports = {
  default: {
    share,
    dataFilePath,
    getAllIds,
    exists,
    find,
    save,
  },
};
