const { expect } = require('chai');
const tmp = require('tmp');

const auth = require('../src/auth');
const Storage = require('../src/storage');

describe('Storage', () => {
  let tempPath;
  let storage;

  beforeEach(() => {
    tempPath = tmp.dirSync({ unsafeCleanup: true });
    storage = new Storage(tempPath.name, 'appId');
  });

  afterEach(() => {
    tempPath.removeCallback();
  });

  it('can store and retrieve user data', () => {
    const user = {
      id: 'user_42',
      hashed_password: 'argon2:h4sh',
      token: 'secret_token',
      data: 'my note',
      noteRecipients: [
        'user_1',
      ],
      accessibleNotes: [
        'user_2', 'user_3',
      ],
    };
    storage.save(user);
    const backFromDb = storage.get('user_42');
    expect(backFromDb).to.deep.equal(user);
  });

  it('can check if a user exists', () => {
    const user = { id: 'user_42' };
    storage.save(user);

    expect(storage.exists('user_42')).to.be.true;
    expect(storage.exists('no_such_id')).to.be.false;
  });

  it('can get user id from email', () => {
    const user = { id: 'user_42', email: 'user_42@example.com' };
    storage.save(user);

    expect(storage.getByEmail(user.email).id).to.equal(user.id);
    expect(storage.getByEmail('wrong@example.com')).to.be.null;
  });

  it('can list all users', () => {
    const user1 = { id: 'user_1' };
    storage.save(user1);
    const user2 = { id: 'user_2' };
    storage.save(user2);

    expect(storage.getAll()).to.deep.equal([user1, user2]);
  });

  it('can record a share between users', () => {
    const alice = { id: 'alice' };
    const bob = { id: 'bob' };
    storage.save(alice);
    storage.save(bob);
    storage.share('alice', ['bob']);

    const aliceRecipients = storage.get('alice').noteRecipients;
    expect(aliceRecipients).to.have.members(['bob']);

    const bobAccessibleNotes = storage.get('bob').accessibleNotes;
    expect(bobAccessibleNotes).to.have.members(['alice']);
  });

  it('can unshare data', () => {
    const alice = { id: 'alice' };
    const bob = { id: 'bob' };
    storage.save(alice);
    storage.save(bob);
    storage.share('alice', ['bob']);
    storage.share('alice', []); // unshare

    const aliceRecipients = storage.get('alice').noteRecipients;
    expect(aliceRecipients).to.not.have.members(['bob']);

    const bobAccessibleNotes = storage.get('bob').accessibleNotes;
    expect(bobAccessibleNotes).to.not.have.members(['alice']);
  });

  it('can clear data', () => {
    const oldData = 'this is my old note';
    const user = { id: 'user_42', data: oldData };
    storage.save(user);

    storage.clearData('user_42');

    const fromDb = storage.get('user_42');
    expect(fromDb.data).to.be.undefined;
  });

  it('can store a password reset secret', () => {
    const bobEmail = 'bob@example.org';
    const bobId = '42';
    const bob = { id: bobId, email: bobEmail };
    storage.save(bob);

    const secret = auth.generateSecret();
    storage.setPasswordResetSecret(bobId, secret);

    const storedBob = storage.get(bobId);
    expect(storedBob.password_reset_secret).to.eq(secret);
  });
});
