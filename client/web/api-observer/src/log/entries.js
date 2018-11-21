const ellipsis = (s, max = 10) => (s.length > max) ? s.substring(0, max) + '...' : s;
const quoteEllipsis = (s, max = 10) => JSON.stringify(ellipsis(s, max));
const quote = (s) => JSON.stringify(s);

const getCodeEncryptAndShare = (text, shareWithEmail) => `
const userId = getUserId(${quoteEllipsis(shareWithEmail)});
const opts = { shareWithUsers: [userId] };
const clear = ${quoteEllipsis(text, 20)};
const binary = await tanker.encrypt(clear, opts);
const base64 = toBase64(binary);

// Or:
// const userId = getUserId(${quoteEllipsis(shareWithEmail)});
// const opts = { shareWithUsers: [userId] };
// const clear = ${quoteEllipsis(text, 20)};
// const binary = await tanker.encrypt(clear);
// const resourceId = tanker.getResourceId(binary);
// await tanker.share([resourceId], opts);
`;

const getCodeEncryptionOnly = (text) => `
const clear = ${quoteEllipsis(text, 20)};
const binary = await tanker.encrypt(clear);
const base64 = toBase64(binary);
`;

export default {
  initialize: (trustchainId) => ({
    title: 'Initialize Tanker SDK',
    code: `
import Tanker from "@tanker/client-browser";

const tanker = new Tanker({
  trustchainId: ${quoteEllipsis(trustchainId, 20)}
});
`
  }),

  encryption: (text, shareWith) => ({
    title: 'Encryption',
    code: (shareWith ? getCodeEncryptAndShare(text, shareWith) : getCodeEncryptionOnly(text))
  }),

  encryptionSuccess: (base64) => ({
    title: 'Encryption success',
    code: `base64 === ${quoteEllipsis(base64, 20)}; // true`
  }),

  decryption: (base64) => ({
    title: 'Decryption',
    code: `
const binary = fromBase64(${quoteEllipsis(base64)});
const clear = await tanker.decrypt(binary);
`
  }),

  decryptionSuccess: (clear) => ({
    title: 'Decryption success',
    code: `clear === ${quoteEllipsis(clear, 20)}; // true`
  }),

  closingSession: (email) => ({
    title: `Closing session for ${email}`,
    code: 'await tanker.close();'
  }),

  closedSession: (email) => ({ title: `Closed session for ${email}` }),

  openingSession: (email, password) => ({
    title: `Opening session for ${email}`,
    code: `
const email = ${quote(email)};
const password = ${quote(password)};
const user = await authenticate(email, password);

await tanker.open(user.id, user.token);
`
  }),

  openedSession: (email) => ({ title: `Opened session for ${email}` }),

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
