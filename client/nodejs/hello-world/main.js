const tankerlib = require('@tanker/client-node');
const fetch = require('node-fetch');
const fs = require('fs');
const uuid = require('uuid/v4');

const Tanker = tankerlib.default;

// TODO: get from tankerlib.SIGN_IN_RESULT;
const SIGN_IN_RESULT = Object.freeze({
  OK: 1,
  IDENTITY_VERIFICATION_NEEDED: 2,
  IDENTITY_NOT_REGISTERED: 3,
});

const users = new Map();
const serverRoot = 'http://127.0.0.1:8080';

const doRequest = (url, options = {}) => fetch(url, { credentials: 'include', ...options });

async function getTankerConfig() {
  const res = await doRequest(`${serverRoot}/config`);
  const config = await res.json();

  // Folder to store tanker client data
  const dbPath = `${__dirname}/data/${config.trustchainId.replace(/[\/\\]/g, '_')}/`;

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath);
  }

  config.dataStore = { dbPath };

  return config;
}

async function signUp(tanker, email) {
  let res;
  const body = JSON.stringify({ email, password: 'Tanker' });
  const headers = { 'Content-Type': 'application/json' };
  const method = 'post';

  // Always sign up with "Tanker" as password (mock auth)
  console.log('\nSign up ' + email);
  console.log('  - calling /signup on the app server');
  const response = await doRequest(`${serverRoot}/signup`, { body, headers, method });
  const user = await response.json();

  console.log('  - calling tanker.signUp() on the client side');
  await tanker.signUp(user.identity);
  users.set(email, user);

  return user;
}

async function signIn(tanker, email) {
  let res;
  const body = JSON.stringify({ email, password: 'Tanker' });
  const headers = { 'Content-Type': 'application/json' };
  const method = 'post';

  console.log('\nSign in ' + email);
  console.log('  - calling /login on the app server');
  const response = await doRequest(`${serverRoot}/login`, { body, headers, method });
  const user = await response.json();

  console.log('  - calling tanker.singIn() on the client side');
  const signInResult = await tanker.signIn(user.identity);

  if (signInResult !== SIGN_IN_RESULT.OK)
    throw new Error(`Assertion error: unexpected Tanker signIn result ${signInResult}`);

  return user;
}

async function main () {
  console.log(`Using Tanker version: ${Tanker.version}`);
  // Randomize emails so that each test runs with new users
  const aliceEmail = `alice-${uuid()}@example.com`;
  const bobEmail = `bob-${uuid()}@example.com`;

  // Init tanker
  const tankerConfig = await getTankerConfig();
  const tanker = new Tanker(tankerConfig);

  tanker.on('sessionClosed', () => console.log('Signed out.'));

  // Open Bob's session to make sure his account exists
  const bob = await signUp(tanker, bobEmail);
  await tanker.signOut();

  // Open Alice's session
  const alice = await signUp(tanker, aliceEmail);

  console.log('Encrypting message for Bob');
  const clearData = 'This is a secret message';
  const encryptedData = await tanker.encrypt(clearData, { shareWithUsers: [bob.publicIdentity] });
  await tanker.signOut();

  // Open Bob's session
  await signIn(tanker, bobEmail);
  const decryptedData = await tanker.decrypt(encryptedData);
  console.log('Decrypt message from Alice: ' + decryptedData);

  await tanker.signOut();
}

main().then(() => {
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
