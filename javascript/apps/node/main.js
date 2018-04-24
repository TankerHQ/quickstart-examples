const Tanker = require('@tanker/core').default;
const fs = require('fs');
const uuid = require('uuid/v4');

// nodeJS: custom setup to persist data with PouchDB (this is not needed when
//         using the tanker SDK in a browser application)
const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
PouchDB.plugin(PouchDBFind);

const config = {
  ...require('./config.js'),
  PouchDB: function (dbName) {
    const folder = `./data/${config.trustchainId.replace(/[\/\\]/g, '_')}`;

    // Ensure folder exists to store tokens for this trusthchain
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    // PouchDB will store data in the proper folder
    return new PouchDB(`${folder}/${dbName}`);
  }
};
// nodeJS: end of custom setup

async function getToken(userId) {
  // Authenticated request: always pass "Tanker" as password (mock auth)
  let res = await fetch(`http://localhost:8080/login?userId=${encodeURIComponent(userId)}&password=Tanker`);

  // User not found
  if (res.status === 404) {
    res = await fetch(`http://localhost:8080/signup?userId=${encodeURIComponent(userId)}&password=Tanker`);
  }

  return res.text();
}

async function openSession(tanker, userId) {
  console.log('Opening session ' + userId);
  // Get User Token for current user
  const userToken = await getToken(userId);

  // Open Tanker session for the user
  await tanker.open(userId, userToken);
}

async function main () {
  // Randomize ids so that each test runs with new users
  const aliceId = 'alice-' + uuid();
  const bobId = 'bob-' + uuid();

  // Init tanker
  const tanker = new Tanker(config);

  tanker.on('waitingForValidation', () => console.log('This user is already created, please use another userId'));
  tanker.on('sessionClosed', () => console.log('Bye!'));

  // Open Bob's session to make sure his account exists
  await openSession(tanker, bobId);
  await tanker.close();

  // Open Alice's session
  await openSession(tanker, aliceId);

  console.log('Encrypting message for Bob');
  const clearData = 'This is a secret message';
  const encryptedData = await tanker.encrypt(clearData, { shareWith: [bobId] });
  await tanker.close();

  // Open Bob's session
  await openSession(tanker, bobId);
  const decryptedData = await tanker.decrypt(encryptedData);
  console.log('Got message from Alice: ' + decryptedData);

  await tanker.close();
}

main().then(() => {
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
