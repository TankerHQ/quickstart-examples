import React, { Component } from 'react';
import { Button, Col, ControlLabel, FormGroup, FormControl, Grid, InputGroup, PageHeader, Panel, Row } from 'react-bootstrap';
import Tanker, { toBase64, fromBase64, errors } from '@tanker/client-browser';

import { getEntry, LogPanel } from './log';

const serverRoot = 'http://localhost:8080';

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
    this.initTanker();
  }

  initTanker = async () => {
    try {
      const res = await fetch(`${serverRoot}/config`);
      const config = await res.json();
      this.tanker = new Tanker(config);
      this.log('initialize', config.trustchainId);
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
        const id = await this.getUserId(shareWith);
        options.shareWith = [id];
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

  authenticate = async (email, password) => {
    const eEmail = encodeURIComponent(email);
    const ePassword = encodeURIComponent(password);

    // Authenticated request: always pass "Tanker" as password (mock auth)
    let res = await fetch(`${serverRoot}/login?email=${eEmail}&password=${ePassword}`);

    // User not found
    if (res.status === 404) {
      res = await fetch(`${serverRoot}/signup?email=${eEmail}&password=${ePassword}`);
    }

    return res.json();
  }

  getUserId = async (email) => {
    const password = 'Tanker';
    const { id } = await this.authenticate(email, password);
    return id;
  }

  onClose = async () => {
    this.log('closingSession', this.state.email);

    await this.tanker.close();

    this.log('closedSession', this.state.email);
  }

  onOpen = async (event) => {
    event.preventDefault();

    const email = this.state.email;
    const password = 'Tanker'; // Note: this is for demo only

    this.log('openingSession', email, password);

    const user = await this.authenticate(email, password);
    await this.tanker.open(user.id, user.token);

    this.log('openedSession', email);
  }

  render = () => (
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
                        placeholder={"Email address, e.g. \"alice@example.com\""}
                        type="text"
                        value={this.state.email}
                        onChange={this.onEmailChange}
                        onKeyPress={event => {
                          if (event.key === "Enter" && this.state.email) {
                            if (this.tanker.status === this.tanker.CLOSED) {
                              this.onOpen(event);
                            } else {
                              this.onClose();
                            }
                          }
                        }}
                        disabled={this.state.loading || this.tanker.status !== this.tanker.CLOSED}
                      />
                      <InputGroup.Button>
                        {(this.state.loading || this.tanker.status === this.tanker.CLOSED) && (
                          <Button
                            bsStyle="primary"
                            onClick={this.onOpen}
                            disabled={this.state.email === ''}
                          >
                            Open
                          </Button>
                        )}
                        {!this.state.loading && this.tanker.status !== this.tanker.CLOSED && (
                          <Button
                            bsStyle="danger"
                            onClick={this.onClose}
                            disabled={this.state.email === ''}
                          >
                            Close
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
                        value={this.state.clearText}
                        onChange={this.onClearTextChange}
                        onKeyPress={event => {
                          if (event.key === "Enter" && this.state.clearText) {
                            this.onEncrypt();
                          }
                        }}
                      />
                      <InputGroup.Button>
                        <Button
                          bsStyle="primary"
                          onClick={this.onEncrypt}
                          disabled={this.state.clearText === ''}
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
                        value={this.state.shareWith}
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
                        value={this.state.encryptedText}
                        onChange={this.onEncryptedTextChange}
                        onKeyPress={event => {
                          if (event.key === "Enter" && this.state.encryptedText) {
                            this.onDecrypt();
                          }
                        }}
                      />
                      <InputGroup.Button>
                        <Button
                          bsStyle="primary"
                          onClick={this.onDecrypt}
                          disabled={this.state.encryptedText === ''}
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
              <LogPanel entries={this.state.log} />
            </Col>
          </Row>
        </Col>
      </Row>
    </Grid>
  )
}

export default App;
