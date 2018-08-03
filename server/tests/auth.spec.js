const auth = require('../src/middlewares/auth');
const chai = require('chai');
const sodium = require('libsodium-wrappers-sumo');

const { expect } = chai;

describe('password reset token', () => {
  beforeEach(async () => {
    await sodium.ready;
  });
  it('serializes/deserialize token', () => {
    const secret = auth.generateSecret();
    const token = auth.generatePasswordResetToken({ email: 'bob@example.com', secret });

    const parsed = auth.parsePasswordResetToken(token);
    expect(parsed.email).to.eq('bob@example.com');
    const actualSecret = parsed.secret;
    expect(sodium.compare(actualSecret, secret)).to.eq(0);
  });
});
