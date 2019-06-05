import React, { Component } from 'react';
import { Button, Col, ControlLabel, FormGroup, FormControl, Grid, InputGroup, PageHeader, Panel, Row } from 'react-bootstrap';
import * as emailValidator from 'email-validator';
import Tanker, { toBase64, fromBase64, errors } from '@tanker/client-browser';

import { getEntry, LogPanel } from './log';

const {
  STOPPED,
  READY,
  IDENTITY_REGISTRATION_NEEDED,
  IDENTITY_VERIFICATION_NEEDED
} = Tanker.statuses;

const serverRoot = `http://${window.location.hostname}:8080`;

const doRequest = (url, options = {}) => fetch(url, { credentials: 'include', ...options });

class App extends Component {
  constructor() {
    super();
    this.state = {
      email: '',
      clearText: '',
      encryptedText: '',
      shareWith: '',
      loading: true,
      log: []
    };
  }

  componentDidMount = () => {
    this.initApiClient();
    this.initTanker();
  }

  initApiClient = async () => {
    this.log('initApiClient', serverRoot);
  }

  initTanker = async () => {
    try {
      const res = await doRequest(`${serverRoot}/config`);
      const config = await res.json();
      this.tanker = new Tanker(config);
      this.log('initTanker', config.trustchainId);
      this.setState({ loading: false });
    } catch (e) {
      this.log(e);

      // Could it be that the server is not started yet?
      if (!(e instanceof errors.TankerError)) {
        this.log('serverHint');
      }
    }
  }

  log = (...args) => {
    const entry = getEntry(...args);
    // prepend so that the most recent entry is at the top of the list
    this.setState({ log: [entry, ...this.state.log] });
  }

  onEmailChange = (event) => {
    this.setState({ email: event.target.value });
  }

  onClearTextChange = (event) => {
    this.setState({ clearText: event.target.value });
  }

  onEncryptedTextChange = (event) => {
    this.setState({ encryptedText: event.target.value });
  }

  onShareChange = (event) => {
    this.setState({ shareWith: event.target.value });
  }

  onEncrypt = async () => {
    try {
      const { clearText, shareWith } = this.state;

      const options = {};
      if (shareWith) {
        const publicIdentity = await this.fetchPublicIdentity(shareWith);
        options.shareWithUsers = [publicIdentity];
      }

      this.log('encryption', clearText, shareWith);

      const binary = await this.tanker.encrypt(clearText, options);
      const base64 = toBase64(binary);

      this.setState({
        encryptedText: base64,
        clearText: '',
        shareWith: ''
      });

      this.log('encryptionSuccess', base64);
    } catch (e) {
      this.log(e);
    }
  }

  onDecrypt = async () => {
    try {
      this.log('decryption', this.state.encryptedText);

      const binary = fromBase64(this.state.encryptedText, { timeout: 1000 });
      const clear = await this.tanker.decrypt(binary);

      this.setState({
        clearText: clear,
        encryptedText: ''
      });

      this.log('decryptionSuccess', clear);
    } catch (e) {
      this.log(e);
    }
  }

  fetchPublicIdentity = async (email) => {
    const response = await doRequest(`${serverRoot}/users?email[]=${email}`);
    const users = await response.json();
    if (users.length !== 1)
      throw new Error(`Could not find user with email ${email} on the server`);
    return users[0].publicIdentity;
  }

  onStop = async () => {
    this.log('stop');
    await this.tanker.stop();
    this.log('stopped');

    this.log('signOut', this.state.email);
    await doRequest(`${serverRoot}/logout`);
    this.log('signedOut', this.state.email);
  }

  onStart = async (event) => {
    event.preventDefault();

    const email = this.state.email;
    const password = 'Tanker'; // Note: this is for demo only
    const passphrase = 'Secret'; // Note: this is for demo only

    const body = JSON.stringify({ email, password });
    const headers = { 'Content-Type': 'application/json' };
    const method = 'post';

    let user;

    try {
      let res = await doRequest(`${serverRoot}/login`, { body, headers, method });

      // User signed in
      if (res.status === 200) {
        this.log('signIn', email, password);
        user = await res.json();

        this.log('signedIn', email);

      // User does not exist, need to sign up
      } else if (res.status === 404) {
        this.log('signUp', email, password);

        res = await doRequest(`${serverRoot}/signup`, { body, headers, method });
        if (res.status !== 201)
          throw new Error(`Could not sign up to the server, status: ${res.status}, error: ${(await res.json()).error}`);

        user = await res.json();

        this.log('signedUp', email);

      } else {
        throw new Error(`Could not authenticate to the server, status: ${res.status}, error: ${(await res.json()).error}`);
      }

      this.log('start');
      const status = await this.tanker.start(user.identity);
      this.log('started', this.tanker.status, this.tanker.statusName);

      if (status === IDENTITY_REGISTRATION_NEEDED) {
        this.log('registerIdentity', passphrase);
        await this.tanker.registerIdentity({ passphrase });
        this.log('registeredIdentity');
      } else if (status === IDENTITY_VERIFICATION_NEEDED) {
        this.log('verifyIdentity', passphrase);
        await this.tanker.verifyIdentity({ passphrase });
        this.log('verifiedIdentity');
      }

      this.log('ready', this.tanker.status, this.tanker.statusName);
    } catch (e) {
      this.log(e);
    }
  }

  render = () => {
    const { clearText, encryptedText, email, loading, log, shareWith } = this.state;
    
    const sessionButtonDisabled = email === '' || !emailValidator.validate(email) || [STOPPED, READY].indexOf(this.tanker.status) === -1;
    const encryptButtonDisabled = sessionButtonDisabled || clearText === '' || (!!shareWith && !emailValidator.validate(shareWith));

    return (
      <Grid>
        <Row>
          <Col lgOffset={1} md={12} lg={10}>

            <PageHeader>Tanker API Observer</PageHeader>

            <Row>
              <Col md={6}>
                <Panel bsStyle="primary">
                  <Panel.Heading><Panel.Title componentClass="h5">Application</Panel.Title></Panel.Heading>
                  <Panel.Body>
                    <FormGroup>
                      <ControlLabel>Session</ControlLabel>
                      <InputGroup>
                        <FormControl
                          id="email"
                          placeholder={'Email address, e.g. "alice@example.com"'}
                          type="text"
                          value={email}
                          onChange={this.onEmailChange}
                          onKeyPress={event => {
                            if (!sessionButtonDisabled && event.key === 'Enter' && email) {
                              if (this.tanker.status === READY) {
                                this.onStop();
                              } else {
                                this.onStart(event);
                              }
                            }
                          }}
                          disabled={loading || this.tanker.status !== STOPPED}
                        />
                        <InputGroup.Button>
                          {(loading || this.tanker.status !== READY) && (
                            <Button
                              bsStyle="primary"
                              onClick={this.onStart}
                              disabled={sessionButtonDisabled}
                            >
                              Start
                            </Button>
                          )}
                          {!loading && this.tanker.status === READY && (
                            <Button
                              bsStyle="danger"
                              onClick={this.onStop}
                              disabled={sessionButtonDisabled}
                            >
                              Stop
                            </Button>
                          )}
                        </InputGroup.Button>
                      </InputGroup>
                    </FormGroup>
                    <hr />
                    <FormGroup>
                      <ControlLabel>Encryption</ControlLabel>
                      <InputGroup>
                        <FormControl
                          id="clearText"
                          placeholder="Clear message to encrypt"
                          value={clearText}
                          onChange={this.onClearTextChange}
                          onKeyPress={event => {
                            if (event.key === "Enter" && clearText) {
                              this.onEncrypt();
                            }
                          }}
                        />
                        <InputGroup.Button>
                          <Button
                            bsStyle="primary"
                            onClick={this.onEncrypt}
                            disabled={encryptButtonDisabled}
                          >
                            Encrypt
                          </Button>
                        </InputGroup.Button>
                      </InputGroup>
                      <InputGroup style={{ marginTop: '.5em' }}>
                        <InputGroup.Addon>Share with:</InputGroup.Addon>
                        <FormControl
                          id="shareWith"
                          name="shareWith"
                          value={shareWith}
                          onChange={this.onShareChange}
                          placeholder="Email address of another user"
                        />
                      </InputGroup>
                    </FormGroup>
                    <hr />
                    <FormGroup>
                      <ControlLabel>Decryption</ControlLabel>
                      <InputGroup>
                        <FormControl
                          id="encryptedText"
                          placeholder="Encrypted message to decrypt"
                          value={encryptedText}
                          onChange={this.onEncryptedTextChange}
                          onKeyPress={event => {
                            if (event.key === "Enter" && encryptedText) {
                              this.onDecrypt();
                            }
                          }}
                        />
                        <InputGroup.Button>
                          <Button
                            bsStyle="primary"
                            onClick={this.onDecrypt}
                            disabled={encryptedText === ''}
                          >
                            Decrypt
                          </Button>
                        </InputGroup.Button>
                      </InputGroup>
                    </FormGroup>
                  </Panel.Body>
                </Panel>
              </Col>
              <Col md={6}>
                <LogPanel entries={log} />
              </Col>
            </Row>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default App;
