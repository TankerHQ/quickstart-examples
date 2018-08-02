const fs = require('fs');
const sodium = require('libsodium-wrappers-sumo');
const auth = require('../src/middlewares/auth');
const chai = require('chai');
const fetch = require('node-fetch');
const tmp = require('tmp');
const querystring = require('querystring');

const { app, setup } = require('../src/server');

const { expect } = chai;

const doRequest = async (testServer, request) => {
  const address = testServer.address();
  const { port } = address;
  const {
    verb, path, query, body, headers,
  } = request;
  const queryString = querystring.stringify(query);
  const url = `http://127.0.0.1:${port}${path}?${queryString}`;
  const fetchOpts = { headers, method: verb };
  if (body !== undefined) {
    fetchOpts.body = body;
  }
  const response = await fetch(url, fetchOpts);
  return response;
};

const assertRequest = async (testServer, request, expectedResponse) => {
  const actual = await doRequest(testServer, request);
  const expectedStatus = expectedResponse.status;
  if (actual.status !== expectedStatus) {
    const actualText = await actual.text();
    console.error(actualText);
    expect(actual.status).to.eq(expectedStatus);
  }
  return actual;
};


describe('server', () => {
  let tempPath;
  let testServer;

  const trustchainId = '4bPbtrLr82kNDoaieRDMXIPycLrTynpL7hmIjPGXsWw=';
  const trustchainPrivateKey = '6+Z3FlkU8n1g27/aNF2+3DFOwOXYVZXqiDhuvmF5Lpj0myDj+nNAkKZZxaPE7luhcRMQzTItDyk/zBh21rTyHw==';

  const bobId = 'bob';
  const bobEmail = 'bob@example.com';
  const bobPassword = 'p4ssw0rd';
  const bobPasswordHash = '$argon2id$v=19$m=65536,t=2,p=1$88wT+5X56Ui7EAQMz/wIdw$37pEnuujONgGxa6FudmN9aa0K3TUQbL/tziT30PX7v4';
  const bobToken = 'bobToken';

  const aliceId = 'alice';
  const aliceEmail = 'alice@example.com';
  const alicePassword = '4lic3';
  const alicePasswordHash = '$argon2id$v=19$m=65536,t=2,p=1$UNqRSixl3aeit4F7mR+5pw$KKfiAWPyUaDkVefJ77w2XRdb8gafLpR1a2Uqd0zYnlY';
  const aliceToken = 'aliceToken';

  const signUpBob = () => {
    const user = {
      id: bobId, email: bobEmail, hashed_password: bobPasswordHash, token: bobToken,
    };
    app.storage.save(user);
  };


  const requestResetBobPassword = () => {
    const body = JSON.stringify({ email: bobEmail });
    const headers = { 'Content-Type': 'application/json' };

    return doRequest(
      testServer,
      {
        verb: 'post', path: '/requestResetPassword', body, headers,
      },
    );
  };

  const signUpAlice = () => {
    const user = {
      id: aliceId, email: aliceEmail, hashed_password: alicePasswordHash, token: aliceToken,
    };
    app.storage.save(user);
  };

  const createBobNote = async (contents) => {
    const user = app.storage.get(bobId);
    user.data = contents;
    app.storage.save(user);
  };


  beforeEach(async () => {
    tempPath = tmp.dirSync({ unsafeCleanup: true });
    await setup({
      dataPath: tempPath.name,
      trustchainId,
      trustchainPrivateKey,
      testMode: true,
    });
    testServer = app.listen(0);
  });

  afterEach(() => {
    tempPath.removeCallback();
    testServer.close();
  });

  it('/', async () => {
    await assertRequest(testServer, { verb: 'get', path: '/' }, { status: 200 });
  });

  it('/config', async () => {
    const response = await assertRequest(testServer, { verb: 'get', path: '/config' }, { status: 200 });
    const json = await response.json();
    expect(json).to.deep.equal({ trustchainId, testMode: true });
  });

  describe('/signup', () => {
    specify('sign up with an email', async () => {
      const email = 'user42@example.com';
      const password = 'p4ssw0rd';
      const query = { email, password };

      const response = await assertRequest(
        testServer,
        { verb: 'get', path: '/signup', query },
        { status: 201 },
      );

      const { id, token } = await response.json();
      expect(id).to.be.a('string');
      expect(token).to.be.a('string');
    });

    it('returns 400 if email is missing', async () => {
      const invalidQuery = { password: 'secret' };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/signup', query: invalidQuery },
        { status: 400 },
      );
    });

    it('returns 400 if email is invalid', async () => {
      const invalidQuery = { password: 'secret', email: 'not.an.email.address' };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/signup', query: invalidQuery },
        { status: 400 },
      );
    });

    it('returns 400 if password is missing', async () => {
      const invalidQuery = { email: 'bob@example.com' };

      await assertRequest(
        testServer,
        { verb: 'get', path: '/signup', query: invalidQuery },
        { status: 400 },
      );
    });

    it('refuses to sign up existing users', async () => {
      const existingUser = { id: 'existing', email: 'existing@example.com' };
      app.storage.save(existingUser);

      const query = { email: existingUser.email };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/signup', query },
        { status: 400 },
      );
    });
  });

  describe('/login', () => {
    specify('signed up users can log in', async () => {
      signUpBob();
      const query = { email: bobEmail, password: bobPassword };
      const response = await assertRequest(
        testServer,
        { verb: 'get', path: '/login', query },
        { status: 200 },
      );
      const { id, token } = await response.json();
      expect(id).to.equal(bobId);
      expect(token).to.equal(bobToken);
    });

    it('refuses to log in with incorrect password', async () => {
      signUpBob();
      const incorrectPassword = 'letmein';
      const query = { email: bobEmail, password: incorrectPassword };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/login', query },
        { status: 401 },
      );
    });
  });

  describe('/me', () => {
    it('gets the current user', async () => {
      signUpBob();
      const query = { email: bobEmail, password: bobPassword };
      const response = await assertRequest(
        testServer,
        { verb: 'get', path: '/me', query },
        { status: 200 },
      );
      const user = await response.json();
      expect(user.id).to.equal(bobId);
      expect(user.email).to.equal(bobEmail);
      expect(user.token).to.be.undefined;
    });

    it('can change password', async () => {
      signUpBob();
      const newPassword = 'n3wp4ss';
      const query = { email: bobEmail, password: bobPassword };
      const headers = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({ oldPassword: bobPassword, newPassword });

      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/me/password', query, body, headers,
        },
        { status: 200 },
      );

      const newQuery = { email: bobEmail, password: newPassword };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/login', query: newQuery },
        { status: 200 },
      );
    });

    it('can change email', async () => {
      signUpBob();
      const newEmail = 'new.bob@example.com';
      const query = { email: bobEmail, password: bobPassword };
      const headers = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({ email: newEmail });

      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/me/email', query, body, headers,
        },
        { status: 200 },
      );

      const newQuery = { email: newEmail, password: bobPassword };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/login', query: newQuery },
        { status: 200 },
      );
    });

    it('cannot change email if already taken', async () => {
      signUpAlice();
      signUpBob();
      const newEmail = aliceEmail;
      const query = { email: bobEmail, password: bobPassword };
      const headers = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({ email: newEmail });

      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/me/email', query, body, headers,
        },
        { status: 409 },
      );
    });

    it('cannot change email if given address is invalid', async () => {
      signUpAlice();
      signUpBob();
      const newEmail = 'not.an.email.address';
      const query = { email: bobEmail, password: bobPassword };
      const headers = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({ email: newEmail });

      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/me/email', query, body, headers,
        },
        { status: 400 },
      );
    });
  });

  describe('/data', () => {
    specify('put and get', async () => {
      signUpBob();

      const bobNote = 'the note of bob';

      const query = { email: bobEmail, password: bobPassword };
      const body = bobNote;
      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/data', query, body,
        },
        { status: 200 },
      );

      const response = await doRequest(testServer, { verb: 'get', path: `/data/${bobId}`, query });
      const actualNote = await response.text();
      expect(actualNote).to.eq(bobNote);
    });

    specify('update', async () => {
      signUpBob();
      createBobNote('old note');

      const newNote = 'new note';
      const query = { email: bobEmail, password: bobPassword };
      const body = newNote;
      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/data', query, body,
        },
        { status: 200 },
      );
      const response = await doRequest(testServer, { verb: 'get', path: `/data/${bobId}`, query });
      const actualNote = await response.text();
      expect(actualNote).to.eq(newNote);
    });

    specify('delete', async () => {
      signUpBob();
      const query = { email: bobEmail, password: bobPassword };
      await assertRequest(
        testServer,
        { verb: 'delete', path: '/data', query },
        { status: 200 },
      );

      await assertRequest(
        testServer,
        { verb: 'get', path: `/data/${bobId}`, query },
        { status: 404 },
      );
    });
  });

  describe('/share', () => {
    it('records recipients and accessible notes', async () => {
      signUpBob();
      signUpAlice();
      createBobNote('For Alice');

      // Post a share request
      let query = { email: bobEmail, password: bobPassword };
      const headers = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({ from: bobId, to: [aliceId] });
      await assertRequest(
        testServer,
        {
          verb: 'post', path: '/share', query, body, headers,
        },
        { status: 201 },
      );

      // Alice should have Bob in her accessibleNotes
      query = { email: aliceEmail, password: alicePassword };
      let response = await doRequest(testServer, { verb: 'get', path: '/me', query });
      let actual = await response.json();
      expect(actual.accessibleNotes.map(user => user.id)).to.have.members(['bob']);

      // Bob should have Alice in his recipients
      query = { email: bobEmail, password: bobPassword };
      response = await doRequest(testServer, { verb: 'get', path: '/me', query });
      actual = await response.json();
      expect(actual.noteRecipients.map(user => user.id)).to.have.members(['alice']);
    });
  });

  describe('/users', () => {
    it('returns the list of all users (id and email only)', async () => {
      signUpBob();
      signUpAlice();

      const query = { email: bobEmail, password: bobPassword };
      const response = await doRequest(
        testServer,
        { verb: 'get', path: '/users', query },
      );
      const res = await response.json();
      expect(res).to.deep.equal([
        { id: aliceId, email: aliceEmail },
        { id: bobId, email: bobEmail },
      ]);
    });

    it('does not crash if a json file is corrupted', async () => {
      signUpBob();
      signUpAlice();

      const alicePath = app.storage.dataFilePath(aliceId);
      fs.writeFileSync(alicePath, 'this is {not} valid json[]');

      const query = { email: bobEmail, password: bobPassword };
      const response = await doRequest(
        testServer,
        { verb: 'get', path: '/users', query },
      );
      expect(response.status).to.eq(500);
      const details = await response.json();
      expect(details.error).to.contain(`${aliceId}.json`);
    });
  });

  describe('forgot password', () => {
    it('calls trustchaind properly', async () => {
      signUpBob();
      await requestResetBobPassword();

      const actualRequest = app.trustchaindClient.sentRequest;
      const actualEmail = actualRequest.email;
      expect(actualEmail.to_email).to.eq(bobEmail);
      expect(actualEmail.html).to.contains('{{ verificationCode }}');
    });

    it('can reset password with a token', async () => {
      signUpBob();
      await requestResetBobPassword();

      const bob = app.storage.get(bobId);
      const bobResetSecret = sodium.from_base64(bob.b64_password_reset_secret);
      const passwordResetToken = auth.generatePasswordResetToken({
        email: bobEmail,
        secret: bobResetSecret,
      });

      const newPassword = 'n3wp4ss';
      const body = JSON.stringify({ passwordResetToken, newPassword });
      const headers = { 'Content-Type': 'application/json' };
      const answer = await doRequest(
        testServer,
        {
          verb: 'post', path: '/resetPassword', body, headers,
        },
      );

      const response = await answer.json();
      expect(response.email).to.eq(bobEmail);
    });

    it('refuses to reset password if token is invalid', async () => {
      signUpBob();
      await requestResetBobPassword();

      const newPassword = 'n3wp4ss';
      const body = JSON.stringify({ passwordResetToken: 'invalid', newPassword });
      const headers = { 'Content-Type': 'application/json' };
      const answer = await doRequest(
        testServer,
        {
          verb: 'post', path: '/resetPassword', body, headers,
        },
      );

      expect(answer.status).to.eq(403);
    });
  });
});
