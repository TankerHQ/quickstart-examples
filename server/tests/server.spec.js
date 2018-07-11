const fs = require('fs');
const chai = require('chai');
const fetch = require('node-fetch');
const tmp = require('tmp');
const querystring = require('querystring');

const server = require('../src/server');

const { expect } = chai;

const doRequest = async (testServer, request) => {
  const address = testServer.address();
  const { port } = address;
  const {
    verb, path, query, body, headers,
  } = request;
  const queryString = querystring.stringify(query);
  const url = `http://localhost:${port}${path}?${queryString}`;
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
  let app;
  let testServer;

  const trustchainId = '4bPbtrLr82kNDoaieRDMXIPycLrTynpL7hmIjPGXsWw=';
  const trustchainPrivateKey = '6+Z3FlkU8n1g27/aNF2+3DFOwOXYVZXqiDhuvmF5Lpj0myDj+nNAkKZZxaPE7luhcRMQzTItDyk/zBh21rTyHw==';

  const bobId = 'bob';
  const bobPassword = 'p4ssw0rd';
  const bobPasswordHash = '$argon2id$v=19$m=65536,t=2,p=1$88wT+5X56Ui7EAQMz/wIdw$37pEnuujONgGxa6FudmN9aa0K3TUQbL/tziT30PX7v4';
  const bobToken = 'bobToken';

  const aliceId = 'alice';
  const alicePassword = '4lic3';
  const alicePasswordHash = '$argon2id$v=19$m=65536,t=2,p=1$UNqRSixl3aeit4F7mR+5pw$KKfiAWPyUaDkVefJ77w2XRdb8gafLpR1a2Uqd0zYnlY';
  const aliceToken = 'aliceToken';

  const signUpBob = () => {
    const user = { id: bobId, hashed_password: bobPasswordHash, token: bobToken };
    app.storage.save(user);
  };

  const signUpAlice = () => {
    const user = { id: aliceId, hashed_password: alicePasswordHash, token: aliceToken };
    app.storage.save(user);
  };

  const createBobNote = async (contents) => {
    const user = app.storage.get(bobId);
    user.data = contents;
    app.storage.save(user);
  };


  beforeEach(() => {
    tempPath = tmp.dirSync({ unsafeCleanup: true });
    app = server.setup({
      dataPath: tempPath.name,
      trustchainId,
      trustchainPrivateKey,
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
    expect(json).to.deep.equal({ trustchainId });
  });

  describe('/signup', () => {
    specify('signin up a new user', async () => {
      const userId = 'user_42';
      const password = 'p4ssw0rd';
      const query = { userId, password };

      const response = await assertRequest(
        testServer,
        { verb: 'get', path: '/signup', query },
        { status: 201 },
      );

      const token = await response.text();
      expect(token).to.be.a('string');
    });

    it('returns 400 if userId is missing', async () => {
      const invalidQuery = { password: 'secret' };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/signup', query: invalidQuery },
        { status: 400 },
      );
    });

    it('returns 400 if password is missing', async () => {
      const invalidQuery = { userId: 'bob' };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/signup', query: invalidQuery },
        { status: 400 },
      );
    });

    it('refuses to sign up existing users', async () => {
      const existingUser = { id: 'existing' };
      app.storage.save(existingUser);

      const query = { userId: 'existing' };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/signup', query },
        { status: 400 },
      );
    });
  });

  describe('/password', () => {
    specify('can change password', async () => {
      const newPassword = 'n3wp4ss';
      signUpBob();
      const query = { userId: bobId, password: bobPassword, newPassword };
      await assertRequest(
        testServer,
        { verb: 'put', path: '/password', query },
        { status: 200 },
      );

      const newQuery = { userId: bobId, password: newPassword };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/login', query: newQuery },
        { status: 200 },
      );
    });
  });

  describe('/login', () => {
    specify('signed up users can log in', async () => {
      signUpBob();
      const query = { userId: bobId, password: bobPassword };
      const response = await assertRequest(
        testServer,
        { verb: 'get', path: '/login', query },
        { status: 200 },
      );
      const token = await response.text();
      expect(token).to.equal(bobToken);
    });

    it('refuses to log in with incorrect password', async () => {
      signUpBob();
      const incorrectPassword = 'letmein';
      const query = { userId: bobId, password: incorrectPassword };
      await assertRequest(
        testServer,
        { verb: 'get', path: '/login', query },
        { status: 401 },
      );
    });
  });

  describe('/data', () => {
    specify('put and get', async () => {
      signUpBob();

      const bobNote = 'the note of bob';

      const query = { userId: bobId, password: bobPassword };
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
      const query = { userId: bobId, password: bobPassword };
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
      const query = { userId: bobId, password: bobPassword };
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
      let query = { userId: bobId, password: bobPassword };
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
      query = { userId: aliceId, password: alicePassword };
      let response = await doRequest(testServer, { verb: 'get', path: '/me', query });
      let actual = await response.json();
      expect(actual.accessibleNotes).to.have.members(['bob']);

      // Bob should have Alice in his recipients
      query = { userId: bobId, password: bobPassword };
      response = await doRequest(testServer, { verb: 'get', path: '/me', query });
      actual = await response.json();
      expect(actual.noteRecipients).to.have.members(['alice']);
    });
  });

  describe('/users', () => {
    it('returns the list of all user ids', async () => {
      signUpBob();
      signUpAlice();

      const query = { userId: bobId, password: bobPassword };
      const response = await doRequest(
        testServer,
        { verb: 'get', path: '/users', query },
      );
      const res = await response.json();
      expect(res).to.have.members([bobId, aliceId]);
    });

    it('does not crash if a json file is corrupted', async () => {
      signUpBob();
      signUpAlice();

      const alicePath = app.storage.dataFilePath(aliceId);
      fs.writeFileSync(alicePath, 'this is {not} valid json[]');

      const query = { userId: bobId, password: bobPassword };
      const response = await doRequest(
        testServer,
        { verb: 'get', path: '/users', query },
      );
      expect(response.status).to.eq(500);
      const details = await response.json();
      expect(details.error).to.contain(`${aliceId}.json`);
    });
  });
});
