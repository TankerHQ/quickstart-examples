const { Tanker } = require('@tanker/client-node');
const fetch = require('node-fetch');
const fs = require('fs');
const uuid = require('uuid/v4');

const serverRoot = 'http://127.0.0.1:8080';

const doRequest = (path, options = {}) => fetch(`${serverRoot}/${path}`, { credentials: 'include', ...options });

async function getTankerConfig() {
  console.log('\nServer: /config\n');

  const res = await doRequest('config');
  const config = await res.json();

  // Folder to store tanker client data
  const dbPath = `${__dirname}/data/${config.trustchainId.replace(/[\/\\]/g, '_')}/`;

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath);
  }

  config.dataStore = { dbPath };

  return config;
}

async function signUp(email) {
  let res;
  const body = JSON.stringify({ email, password: 'Tanker' });
  const headers = { 'Content-Type': 'application/json' };
  const method = 'post';

  // Always sign up with "Tanker" as password (mock auth)
  console.log(`\nServer: /signup ${email}\n`);
  const response = await doRequest('signup', { body, headers, method });
  const user = await response.json();
  return user;
}

async function signIn(email) {
  let res;
  const body = JSON.stringify({ email, password: 'Tanker' });
  const headers = { 'Content-Type': 'application/json' };
  const method = 'post';

  console.log(`\nServer: /login ${email}\n`);
  const response = await doRequest('login', { body, headers, method });
  const user = await response.json();
  return user;
}

async function main () {
  console.log(`Application: using Tanker version: ${Tanker.version}`);
  // Randomize emails so that each test runs with new users
  const aliceEmail = `alice-${uuid()}@example.com`;
  const bobEmail = `bob-${uuid()}@example.com`;

  // Init tanker
  console.log('Application: init Tanker object');
  const tankerConfig = await getTankerConfig();
  const tanker = new Tanker(tankerConfig);

  // Open Bob's session to make sure his account exists
  const bob = await signUp(bobEmail);
  console.log('Application: starting Tanker session for Bob');
  await tanker.start(bob.identity);
  await tanker.registerIdentity({ passphrase: 'Bob\'s secret passphrase'});
  await tanker.stop();
  console.log('Application: stopping Tanker session for Bob');

  // Open Alice's session
  const alice = await signUp(aliceEmail);
  console.log('Application: starting Tanker session for Alice');
  await tanker.start(alice.identity);
  await tanker.registerIdentity({ passphrase: 'Alice\'s secret passphrase' });

  console.log('Application: encrypting message for Bob');
  const clearData = 'This is a secret message';
  const encryptedData = await tanker.encrypt(clearData, { shareWithUsers: [bob.publicIdentity] });
  await tanker.stop();
  console.log('Application: stopping Tanker session for Alice');

  // Open Bob's session
  await signIn(bobEmail);
  console.log('Application: starting Tanker session for Bob');
  await tanker.start(bob.identity);
  const decryptedData = await tanker.decrypt(encryptedData);
  console.log('Application: decrypt message from Alice: ' + decryptedData);

  await tanker.stop();
  console.log('Application: stopping Tanker session for Bob');
}

main().then(() => {
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
