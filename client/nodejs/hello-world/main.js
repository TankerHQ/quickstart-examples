const tankerlib = require('@tanker/client-node');
const fetch = require('node-fetch');
const fs = require('fs');
const uuid = require('uuid/v4');

const serverRoot = 'http://127.0.0.1:8080';
const emails = new Set();

const Tanker = tankerlib.default;

async function getTankerConfig() {
  const res = await fetch(`${serverRoot}/config`);
  const config = await res.json();

  // Folder to store tanker client data
  const dbPath = `${__dirname}/data/${config.trustchainId.replace(/[\/\\]/g, '_')}/`;

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath);
  }

  config.dataStore = { dbPath };

  return config;
}

async function authenticate(email) {
  let res;
  const eEmail = encodeURIComponent(email);
  const ePassword = encodeURIComponent('Tanker');

  // User known: log in
  if (emails.has(email)) {
    res = await fetch(`${serverRoot}/login?email=${eEmail}&password=${ePassword}`);

    // User not known: sign up
  } else {
    // Always sign up with "Tanker" as password (mock auth)
    res = await fetch(`${serverRoot}/signup?email=${eEmail}&password=${ePassword}`);
    emails.add(email);
  }

  return res.json();
}

async function openSession(tanker, email) {
  console.log('Opening session for ' + email);

  // Get identity for current email
  const user = await authenticate(email);
  const { id, token } = user;

  // Open Tanker session for the user
  await tanker.open(id, token);

  return id;
}

async function main () {
  // Randomize emails so that each test runs with new users
  const aliceEmail = `alice-${uuid()}@example.com`;
  const bobEmail = `bob-${uuid()}@example.com`;

  // Init tanker
  const tankerConfig = await getTankerConfig();
  const tanker = new Tanker(tankerConfig);

  tanker.on('unlockRequired', () => console.log('This user is already created, please use another email'));
  tanker.on('sessionClosed', () => console.log('Bye!'));

  // Open Bob's session to make sure his account exists
  const bobId = await openSession(tanker, bobEmail);
  await tanker.close();

  // Open Alice's session
  const aliceId = await openSession(tanker, aliceEmail);

  console.log('Encrypting message for Bob');
  const clearData = 'This is a secret message';
  const encryptedData = await tanker.encrypt(clearData, { shareWith: [bobId] });
  await tanker.close();

  // Open Bob's session
  await openSession(tanker, bobEmail);
  const decryptedData = await tanker.decrypt(encryptedData);
  console.log('Got message from Alice: ' + decryptedData);

  await tanker.close();
}

main().then(() => {
  console.log(`Using Tanker version: ${tankerlib.getTankerVersion()}`);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
