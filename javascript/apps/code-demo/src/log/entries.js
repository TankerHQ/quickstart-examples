const ellipsis = (s, max = 10) => (s.length > max) ? s.substring(0, max) + '...' : s;
const quoteEllipsis = (s, max = 10) => JSON.stringify(ellipsis(s, max));
const quote = (s) => JSON.stringify(s);

export default {
  initialize: (trustchainId) => ({
    title: 'Initialize Tanker SDK',
    code: `
import Tanker from "@tanker/core";

const tanker = new Tanker({
  trustchainId: ${quoteEllipsis(trustchainId, 20)}
});
`
  }),

  encryption: (text, shareWith) => ({
    title: 'Encryption',
    code: shareWith ? `
const binary = tanker.encrypt(${quoteEllipsis(text)}, {
  shareWith: ${quote(shareWith)}
});
const base64 = toBase64(binary);
` : `
const binary = tanker.encrypt(${quoteEllipsis(text)});
const base64 = toBase64(binary);
`
  }),

  encryptionSuccess: (base64) => ({
    title: 'Encryption success',
    code: `base64 === ${quoteEllipsis(base64, 20)}; // true`
  }),

  decryption: (base64) => ({
    title: 'Decryption',
    code: `
const binary = fromBase64(${quoteEllipsis(base64)});
const clear = tanker.decrypt(binary);
`
  }),

  decryptionSuccess: (clear) => ({
    title: 'Decryption success',
    code: `clear === ${quoteEllipsis(clear, 20)}; // true`
  }),

  closingSession: (userId) => ({
    title: `Closing session for ${userId}`,
    code: 'await tanker.close();'
  }),

  closedSession: (userId) => ({ title: `Closed session for ${userId}` }),

  openingSession: (userId) => ({
    title: `Opening session for ${userId}`,
    code: `
const userToken = await getToken(${quote(userId)});
await tanker.open(${quote(userId)}, userToken);
`
  }),

  openedSession: (userId) => ({ title: `Opened session for ${userId}` }),

  serverHint: () => ({
    title: 'Have you started the server?',
    type: 'hint',
    body: 'Then retry to open a session',
    language: 'bash',
    code: `
# Hint:
$ yarn start:server
`
  })
};
