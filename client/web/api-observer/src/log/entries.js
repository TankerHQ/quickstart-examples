const ellipsis = (s, max = 10) => (s.length > max) ? s.substring(0, max) + '...' : s;
const quoteEllipsis = (s, max = 10) => JSON.stringify(ellipsis(s, max));
const quote = (s) => JSON.stringify(s);

const getCodeEncryptAndShare = (text, shareWithEmail) => `
const clear = ${quoteEllipsis(text, 20)};
const email = ${quoteEllipsis(shareWithEmail, 20)};
const identity = api.fetchPublicIdentity(email);

const binary = await tanker.encrypt(clear, {
  shareWithUsers: [identity]
});

const base64 = toBase64(binary);
`;

const getCodeEncryptionOnly = (text) => `
const clear = ${quoteEllipsis(text, 20)};
const binary = await tanker.encrypt(clear);
const base64 = toBase64(binary);
`;

export default {
  initApiClient: (trustchainId) => ({
    title: '[API] Initialize Client',
    code: `
import { ApiClient } from "../your/app";

// Example object to request your app server
const api = new ApiClient();
`
  }),

  initTanker: (trustchainId) => ({
    title: '[Tanker] Initialize SDK',
    code: `
import { Tanker } from "@tanker/client-browser";

const tanker = new Tanker({
  trustchainId: ${quoteEllipsis(trustchainId, 20)}
});
`
  }),

  encryption: (text, shareWith) => ({
    title: '[Tanker] Encryption',
    code: (shareWith ? getCodeEncryptAndShare(text, shareWith) : getCodeEncryptionOnly(text))
  }),

  encryptionSuccess: (base64) => ({
    title: '[Tanker] Encryption success',
    code: `base64 === ${quoteEllipsis(base64, 20)}; // true`
  }),

  decryption: (base64) => ({
    title: '[Tanker] Decryption',
    code: `
const binary = fromBase64(${quoteEllipsis(base64)});
const clear = await tanker.decrypt(binary);
`
  }),

  decryptionSuccess: (clear) => ({
    title: '[Tanker] Decryption success',
    code: `clear === ${quoteEllipsis(clear, 20)}; // true`
  }),

  signOut: (email) => ({
    title: `[API] Sign out ${email}`,
    code: 'await api.signOut();'
  }),

  signUp: (email, password) => ({
    title: `[API] Sign up ${email}`,
    code: `
const email = ${quote(email)};
const password = ${quote(password)};
const user = await api.signUp(email, password);
`
  }),

  signIn: (email, password) => ({
    title: `[API] Sign in ${email}`,
    code: `
const email = ${quote(email)};
const password = ${quote(password)};
const user = await api.signIn(email, password);
`
  }),

  signedIn: (email) => ({ title: `[API] Signed in ${email}` }),
  signedUp: (email) => ({ title: `[API] Signed up ${email}` }),
  signedOut: (email) => ({ title: `[API] Signed out ${email}` }),

  start: () => ({
    title: '[Tanker] Start',
    code: `
const { identity } = user;
const status = await tanker.start(identity);
`
  }),

  started: (status, statusName) => ({
    title: '[Tanker] Started',
    code: `
const {
  STOPPED,
  READY,
  IDENTITY_REGISTRATION_NEEDED,
  IDENTITY_VERIFICATION_NEEDED
} = Tanker.statuses;

status === ${statusName}; // ${status}
`,
  }),

  registerIdentity: (passphrase) => ({
    title: '[Tanker] Register identity',
    code: `
const passphrase = ${quote(passphrase)};
await tanker.registerIdentity({ passphrase });
`
  }),

  registeredIdentity: () => ({
    title: '[Tanker] Registered identity'
  }),

  verifyIdentity: (passphrase) => ({
    title: '[Tanker] Verify identity',
    code: `
const passphrase = ${quote(passphrase)};
await tanker.verifyIdentity({ passphrase });
`
  }),

  verifiedIdentity: () => ({
    title: '[Tanker] Verified identity'
  }),

  ready: () => ({
    title: '[Tanker] Instance is now READY'
  }),

  stop: () => ({
    title: `[Tanker] Stop`,
    code: 'await tanker.stop();'
  }),

  stopped: () => ({
    title: `[Tanker] Stopped`,
  }),

  serverHint: () => ({
    title: 'Have you started the server?',
    type: 'hint',
    body: 'Then reload the page',
    language: 'bash',
    code: `
# Hint:
$ yarn start:server
`
  })
};
