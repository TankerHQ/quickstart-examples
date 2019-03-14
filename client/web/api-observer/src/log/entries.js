const ellipsis = (s, max = 10) => (s.length > max) ? s.substring(0, max) + '...' : s;
const quoteEllipsis = (s, max = 10) => JSON.stringify(ellipsis(s, max));
const quote = (s) => JSON.stringify(s);

const getCodeEncryptAndShare = (text, shareWithEmail) => `
const clear = ${quoteEllipsis(text, 20)};
const user = fetchPublicIdentity(${quoteEllipsis(shareWithEmail, 8)});
const binary = await tanker.encrypt(clear, {
  shareWithUsers: [user]
});
const base64 = toBase64(binary);
`;

const getCodeEncryptionOnly = (text) => `
const clear = ${quoteEllipsis(text, 20)};
const binary = await tanker.encrypt(clear);
const base64 = toBase64(binary);
`;

export default {
  initTanker: (trustchainId) => ({
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

  signingOut: (email) => ({
    title: `Sign out ${email}`,
    code: 'await tanker.signOut();'
  }),

  signedOut: (email) => ({ title: `Signed out ${email}` }),

  signUp: (email, password) => ({
    title: `Sign up ${email}`,
    code: `
const email = ${quote(email)};
const password = ${quote(password)};
const user = await signUp(email, password);

await tanker.signUp(user.identity);
`
  }),

  signIn: (email, password) => ({
    title: `Sign in ${email}`,
    code: `
const email = ${quote(email)};
const password = ${quote(password)};
const user = await signIn(email, password);

await tanker.signIn(user.identity);
`
  }),

  signedIn: (email) => ({ title: `Signed in ${email}` }),
  signedUp: (email) => ({ title: `Signed up ${email}` }),

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
