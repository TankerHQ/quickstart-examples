const fs = require('fs');
const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
PouchDB.plugin(PouchDBFind);

const tankerConfig = require('./config');

// Custom setup to persist data with PouchDB in Node.js (not needed when
// using the tanker SDK in a browser application).
module.exports = {
  config: {
    PouchDB: function (dbName) {
      // Folder to store tokens for this trustchain
      const folder = `./data/${tankerConfig.trustchainId.replace(/[\/\\]/g, '_')}`;

      // Ensure folder exists
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }

      // PouchDB will now store data in the proper folder
      return new PouchDB(`${folder}/${dbName}`);
    }
  }
};
