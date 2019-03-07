const chai = require('chai');
const sodium = require('libsodium-wrappers-sumo');

const auth = require('../src/auth');

const { expect } = chai;

describe('password reset token', () => {
  beforeEach(() => sodium.ready);

  it('serializes/deserialize token', () => {
    const userId = 'bob';
    const secret = auth.generateSecret();
    const token = auth.generatePasswordResetToken({ userId, secret });
    const parsed = auth.parsePasswordResetToken(token);
    expect(parsed).to.deep.equal({ userId, secret });
  });
});
