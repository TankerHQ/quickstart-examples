const fs = require('fs');
const PouchDBCore = require('pouchdb-core');
const PouchDBAdapterLevel = require('pouchdb-adapter-leveldb');
const PouchDBFind = require('pouchdb-find');

const tankerConfig = require('./config');

PouchDBCore.plugin(PouchDBAdapterLevel);
PouchDBCore.plugin(PouchDBFind);

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

      // Apply defaults
      const PouchDB = PouchDBCore.defaults({ adapter: 'leveldb' });

      // PouchDB will now persist data in the proper folder
      return new PouchDB(`${folder}/${dbName}`);
    }
  }
};
