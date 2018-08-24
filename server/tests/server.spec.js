const fs = require('fs');
const sodium = require('libsodium-wrappers-sumo');
const chai = require('chai');
const fetch = require('node-fetch');
const tmp = require('tmp');
const querystring = require('querystring');

const { app, setup } = require('../src/server');
const auth = require('../src/middlewares/auth');

const { expect } = chai;

const doRequest = async (testServer, request) => {
  const address = testServer.address();
  const { port } = address;
  const {
    verb, path, query, body, headers,
  } = request;
  let url = `http://127.0.0.1:${port}${path}`;
  if (query) {
    const queryString = querystring.stringify(query);
    url = `${url}?${queryString}`;
  }
  const fetchOpts = { credentials: true, headers, method: verb };
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
  const bobNewPassword = 'n3wp4ss';

  const bobPasswordHash = '$argon2id$v=19$m=65536,t=2,p=1$88wT+5X56Ui7EAQMz/wIdw$37pEnuujONgGxa6FudmN9aa0K3TUQbL/tziT30PX7v4';
  const bobToken = 'bobToken';

  const aliceId = 'alice';
  const aliceEmail = 'alice@example.com';
  const alicePassword = '4lic3';
  const alicePasswordHash = '$argon2id$v=19$m=65536,t=2,p=1$UNqRSixl3aeit4F7mR+5pw$KKfiAWPyUaDkVefJ77w2XRdb8gafLpR1a2Uqd0zYnlY';
  const aliceToken = 'aliceToken';

  const signUpAlice = () => {
    const user = {
      id: aliceId, email: aliceEmail, hashed_password: alicePasswordHash, token: aliceToken,
    };
    app.storage.save(user);
  };

  const signUpBob = () => {
    const user = {
      id: bobId, email: bobEmail, hashed_password: bobPasswordHash, token: bobToken,
    };
    app.storage.save(user);
  };

  const logInAlice = async () => {
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify({ email: aliceEmail, password: alicePassword });

    const response = await doRequest(
      testServer,
      {
        verb: 'post', path: '/login', body, headers,
      },
    );

    const cookie = response.headers.get('set-cookie');
    return cookie;
  };

  const logInBob = async () => {
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify({ email: bobEmail, password: bobPassword });

    const response = await doRequest(
      testServer,
      {
        verb: 'post', path: '/login', body, headers,
      },
    );

    const cookie = response.headers.get('set-cookie');
    return cookie;
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
    const headers = { 'Content-Type': 'application/json' };

    specify('sign up with an email', async () => {
      const email = 'user42@example.com';
      const password = 'p4ssw0rd';
      const body = JSON.stringify({ email, password });

      const response = await assertRequest(
        testServer,
        {
          verb: 'post', path: '/signup', body, headers,
        },
        { status: 201 },
      );

      const { id, token } = await response.json();
      expect(id).to.be.a('string');
      expect(token).to.be.a('string');
    });

    it('returns 400 if email is missing', async () => {
      const invalidBody = JSON.stringify({ password: 'secret' });
      await assertRequest(
        testServer,
        {
          verb: 'post', path: '/signup', body: invalidBody, headers,
        },
        { status: 400 },
      );
    });

    it('returns 400 if email is invalid', async () => {
      const invalidBody = JSON.stringify({ password: 'secret', email: 'not.an.email.address' });
      await assertRequest(
        testServer,
        {
          verb: 'post', path: '/signup', body: invalidBody, headers,
        },
        { status: 400 },
      );
    });

    it('returns 400 if password is missing', async () => {
      const invalidBody = JSON.stringify({ email: 'bob@example.com' });

      await assertRequest(
        testServer,
        {
          verb: 'post', path: '/signup', body: invalidBody, headers,
        },
        { status: 400 },
      );
    });

    it('refuses to sign up existing users', async () => {
      const existingUser = { id: 'existing', email: 'existing@example.com' };
      app.storage.save(existingUser);

      const invalidBody = JSON.stringify({ email: existingUser.email, password: 'secret' });
      await assertRequest(
        testServer,
        {
          verb: 'post', path: '/signup', body: invalidBody, headers,
        },
        { status: 409 },
      );
    });
  });

  describe('/login', () => {
    const headers = { 'Content-Type': 'application/json' };

    specify('signed up users can log in', async () => {
      signUpBob();
      const body = JSON.stringify({ email: bobEmail, password: bobPassword });

      const response = await assertRequest(
        testServer,
        {
          verb: 'post', path: '/login', body, headers,
        },
        { status: 200 },
      );

      const { id, token } = await response.json();
      expect(id).to.equal(bobId);
      expect(token).to.equal(bobToken);
    });

    it('refuses to log in with incorrect password', async () => {
      signUpBob();
      const incorrectPassword = 'letmein';
      const body = JSON.stringify({ email: bobEmail, password: incorrectPassword });
      await assertRequest(
        testServer,
        {
          verb: 'post', path: '/login', body, headers,
        },
        { status: 401 },
      );
    });
  });

  describe('/me', () => {
    it('gets the current user', async () => {
      signUpBob();
      const bobCookie = await logInBob();
      const response = await assertRequest(
        testServer,
        {
          verb: 'get', path: '/me', headers: { Cookie: bobCookie },
        },
        { status: 200 },
      );
      const user = await response.json();
      expect(user.id).to.equal(bobId);
      expect(user.email).to.equal(bobEmail);
      expect(user.token).to.be.undefined;
    });

    it('can change password', async () => {
      signUpBob();
      const bobCookie = await logInBob();

      const newPassword = 'n3wp4ss';
      const headers = { 'Content-Type': 'application/json', Cookie: bobCookie };
      const body = JSON.stringify({ oldPassword: bobPassword, newPassword });

      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/me/password', body, headers,
        },
        { status: 200 },
      );

      const newBody = JSON.stringify({ email: bobEmail, password: newPassword });
      await assertRequest(
        testServer,
        {
          verb: 'post', path: '/login', body: newBody, headers: { 'Content-Type': 'application/json' },
        },
        { status: 200 },
      );
    });

    it('can change email', async () => {
      signUpBob();
      const bobCookie = await logInBob();

      const newEmail = 'new.bob@example.com';
      const headers = { 'Content-Type': 'application/json', Cookie: bobCookie };
      const body = JSON.stringify({ email: newEmail });

      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/me/email', body, headers,
        },
        { status: 200 },
      );

      const newBody = JSON.stringify({ email: newEmail, password: bobPassword });
      await assertRequest(
        testServer,
        {
          verb: 'post', path: '/login', body: newBody, headers: { 'Content-Type': 'application/json' },
        },
        { status: 200 },
      );
    });

    it('cannot change email if already taken', async () => {
      signUpAlice();
      signUpBob();
      const bobCookie = await logInBob();

      const newEmail = aliceEmail;
      const headers = { 'Content-Type': 'application/json', Cookie: bobCookie };
      const body = JSON.stringify({ email: newEmail });

      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/me/email', body, headers,
        },
        { status: 409 },
      );
    });

    it('cannot change email if given address is invalid', async () => {
      signUpBob();
      const bobCookie = await logInBob();

      const newEmail = 'not.an.email.address';
      const headers = { 'Content-Type': 'application/json', Cookie: bobCookie };
      const body = JSON.stringify({ email: newEmail });

      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/me/email', body, headers,
        },
        { status: 400 },
      );
    });
  });

  describe('/data', () => {
    specify('put and get', async () => {
      signUpBob();
      const bobCookie = await logInBob();

      const bobNote = 'the note of bob';

      const body = bobNote;
      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/data', body, headers: { Cookie: bobCookie },
        },
        { status: 200 },
      );

      const response = await doRequest(testServer, { verb: 'get', path: `/data/${bobId}`, headers: { Cookie: bobCookie } });
      const actualNote = await response.text();
      expect(actualNote).to.eq(bobNote);
    });

    specify('update', async () => {
      signUpBob();
      createBobNote('old note');
      const bobCookie = await logInBob();

      const newNote = 'new note';
      const body = newNote;
      await assertRequest(
        testServer,
        {
          verb: 'put', path: '/data', body, headers: { Cookie: bobCookie },
        },
        { status: 200 },
      );
      const response = await doRequest(testServer, { verb: 'get', path: `/data/${bobId}`, headers: { Cookie: bobCookie } });
      const actualNote = await response.text();
      expect(actualNote).to.eq(newNote);
    });

    specify('delete', async () => {
      signUpBob();
      const bobCookie = await logInBob();

      await assertRequest(
        testServer,
        { verb: 'delete', path: '/data', headers: { Cookie: bobCookie } },
        { status: 200 },
      );

      await assertRequest(
        testServer,
        { verb: 'get', path: `/data/${bobId}`, headers: { Cookie: bobCookie } },
        { status: 404 },
      );
    });
  });

  describe('/share', () => {
    it('records recipients and accessible notes', async () => {
      signUpBob();
      signUpAlice();
      createBobNote('For Alice');
      const aliceCookie = await logInAlice();
      const bobCookie = await logInBob();

      // Post a share request
      const headers = { 'Content-Type': 'application/json', Cookie: bobCookie };
      const body = JSON.stringify({ from: bobId, to: [aliceId] });
      await assertRequest(
        testServer,
        {
          verb: 'post', path: '/share', body, headers,
        },
        { status: 201 },
      );

      // Alice should have Bob in her accessibleNotes
      let response = await doRequest(testServer, { verb: 'get', path: '/me', headers: { Cookie: aliceCookie } });
      let actual = await response.json();
      expect(actual.accessibleNotes.map(user => user.id)).to.have.members(['bob']);

      // Bob should have Alice in his recipients
      response = await doRequest(testServer, { verb: 'get', path: '/me', headers: { Cookie: bobCookie } });
      actual = await response.json();
      expect(actual.noteRecipients.map(user => user.id)).to.have.members(['alice']);
    });
  });

  describe('/users', () => {
    it('returns the list of all users (id and email only)', async () => {
      signUpBob();
      signUpAlice();
      const bobCookie = await logInBob();

      const response = await doRequest(
        testServer,
        { verb: 'get', path: '/users', headers: { Cookie: bobCookie } },
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
      const bobCookie = await logInBob();

      const alicePath = app.storage.dataFilePath(aliceId);
      fs.writeFileSync(alicePath, 'this is {not} valid json[]');

      const response = await doRequest(
        testServer,
        { verb: 'get', path: '/users', headers: { Cookie: bobCookie } },
      );
      expect(response.status).to.eq(500);
      const details = await response.json();
      expect(details.error).to.contain(`${aliceId}.json`);
    });
  });

  describe('forgot password', () => {
    const msgInvalidToken = 'Invalid password reset token';
    const msgInvalidNewPassword = 'Invalid new password';

    it('calls trustchaind properly', async () => {
      signUpBob();
      await requestResetBobPassword();
      const actualRequest = app.trustchaindClient.sentRequest;
      const actualEmail = actualRequest.email;
      expect(actualEmail.to_email).to.eq(bobEmail);
      expect(actualEmail.html).to.contains('TANKER_VERIFICATION_CODE');
    });

    const attemptResetPassword = async (passwordResetToken, newPassword) => {
      const body = JSON.stringify({ passwordResetToken, newPassword });
      const headers = { 'Content-Type': 'application/json' };
      return doRequest(
        testServer,
        {
          verb: 'post', path: '/resetPassword', body, headers,
        },
      );
    };

    const assertAttemptFail = async (passwordResetToken, newPassword, msgError) => {
      const answer = await attemptResetPassword(passwordResetToken, newPassword);

      expect(answer.status).to.eq(401);

      const message = await answer.json();

      expect(message).to.eq(msgError);
    };

    const retrieveResetPasswordToken = (userId) => {
      const user = app.storage.get(userId);
      const userResetSecret = sodium.from_base64(user.b64_password_reset_secret);
      return auth.generatePasswordResetToken({
        userId,
        secret: userResetSecret,
      });
    };

    it('can reset password with a token', async () => {
      signUpBob();
      await requestResetBobPassword();

      const passwordResetToken = retrieveResetPasswordToken(bobId);
      const answer = await attemptResetPassword(passwordResetToken, bobNewPassword);
      const { userId, email } = await answer.json();
      expect(userId).to.eq(bobId);
      expect(email).to.eq(bobEmail);
    });

    it('refuses to reset password if the password is emtpy', async () => {
      signUpBob();
      await requestResetBobPassword();

      const passwordResetToken = retrieveResetPasswordToken(bobId);

      assertAttemptFail(passwordResetToken, '', msgInvalidNewPassword);
    });

    it('refuses to reset password if the passwordResetToken is empty', async () => {
      signUpBob();
      await requestResetBobPassword();

      await assertAttemptFail('', bobNewPassword, msgInvalidToken);
    });

    it('refuses to reset password if passwordResetToken can not be parsed', async () => {
      signUpBob();
      await requestResetBobPassword();

      await assertAttemptFail('an invalid token', bobNewPassword, msgInvalidToken);
    });

    it('refuses to reset password if the secret is invalid', async () => {
      signUpBob();
      await requestResetBobPassword();

      const invalidSecret = auth.generateSecret();
      const invalidResetToken = auth.generatePasswordResetToken({
        userId: bobId, secret: invalidSecret,
      });

      await assertAttemptFail(invalidResetToken, bobNewPassword, msgInvalidToken);
    });

    it('refuses to reset password if the userId is not found', async () => {
      signUpBob();
      await requestResetBobPassword();

      const secret = auth.generateSecret();
      const noSuchUserId = 'no such userId';
      const invalidResetToken = auth.generatePasswordResetToken({ userId: noSuchUserId, secret });

      await assertAttemptFail(invalidResetToken, bobNewPassword, msgInvalidToken);
    });

    it('invalidates the secret after the first failure', async () => {
      signUpBob();
      await requestResetBobPassword();

      const firstPasswordResetToken = retrieveResetPasswordToken(bobId);

      const invalidSecret = auth.generateSecret();
      const invalidResetToken = auth.generatePasswordResetToken({
        userId: bobId, secret: invalidSecret,
      });

      // First attempt
      await attemptResetPassword(invalidResetToken, bobNewPassword);

      // Second attempt should fail
      await assertAttemptFail(firstPasswordResetToken, bobNewPassword, msgInvalidToken);
    });

    it('refuses resetPasswordToken reuse', async () => {
      signUpBob();
      await requestResetBobPassword();

      const firstPasswordResetToken = retrieveResetPasswordToken(bobId);

      // First attempt
      await attemptResetPassword(firstPasswordResetToken, bobNewPassword);

      // Second attempt should fail
      await assertAttemptFail(firstPasswordResetToken, bobNewPassword, msgInvalidToken);
    });
  });

  describe('session', () => {
    it('is not authenticated if unknown session id in cookie', async () => {
      signUpBob();
      const bobCookie = await logInBob();
      const unknownSessionId = 's%3AGDrnlrxGCXbV2WpZu4Vlfd51MwMDyK2W.jdWRDhfiHdSJ0Uli9eD7pc2wQ4yYGp2ex0Uz1Qjewzw';
      const invalidCookie = bobCookie.replace(/sessionId=([^;]+);/, `sessionId=${unknownSessionId};`);
      await assertRequest(
        testServer,
        { verb: 'get', path: '/me', headers: { Cookie: invalidCookie } },
        { status: 401 },
      );
    });

    it('is persisted between requests', async () => {
      signUpBob();
      const bobCookie = await logInBob();
      await assertRequest(
        testServer,
        { verb: 'get', path: '/me', headers: { Cookie: bobCookie } },
        { status: 200 },
      );
      await new Promise(resolve => setTimeout(resolve, 100));
      await assertRequest(
        testServer,
        { verb: 'get', path: '/me', headers: { Cookie: bobCookie } },
        { status: 200 },
      );
    });

    it('is destroyed on logout', async () => {
      signUpBob();
      const bobCookie = await logInBob();
      await assertRequest(
        testServer,
        { verb: 'get', path: '/logout', headers: { Cookie: bobCookie } },
        { status: 200 },
      );
      await assertRequest(
        testServer,
        { verb: 'get', path: '/me', headers: { Cookie: bobCookie } },
        { status: 401 },
      );
    });
  });
});
