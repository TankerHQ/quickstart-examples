const chai = require('chai');
const sodium = require('libsodium-wrappers-sumo');

const auth = require('../src/auth');

const { expect } = chai;

describe('password reset token', () => {
  beforeEach(async () => {
    await sodium.ready;
  });
  it('serializes/deserialize token', () => {
    const secret = auth.generateSecret();
    const token = auth.generatePasswordResetToken({ userId: 'bob', secret });

    const parsed = auth.parsePasswordResetToken(token);
    expect(parsed.userId).to.eq('bob');
    const actualSecret = parsed.secret;
    expect(sodium.compare(actualSecret, secret)).to.eq(0);
  });
});
