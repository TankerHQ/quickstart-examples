import React, { Component } from 'react';
import { Button, Col, ControlLabel, FormGroup, FormControl, Grid, InputGroup, PageHeader, Panel, Row } from 'react-bootstrap';
import Tanker, { toBase64, fromBase64 } from '@tanker/core';

import config from './config';
import { getEntry, LogPanel } from './log';

class App extends Component {
  constructor() {
    super();
    this.state = {
      userId: '',
      clearText: '',
      encryptedText: '',
      shareWith: '',
      log: [getEntry('initialize', config.trustchainId)]
    };

    this.tanker = new Tanker(config);
  }

  log = (...args) => {
    const entry = getEntry(...args);
    // prepend so that the most recent entry is at the top of the list
    this.setState({ log: [entry, ...this.state.log] });
  }

  onUserChange = (event) => {
    this.setState({ userId: event.target.value });
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
      const options = shareWith ? { shareWith: [shareWith] } : {};

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

  getToken = async (userId) => {
    // Authenticated request: always pass "Tanker" as password (mock auth)
    let res = await fetch(`http://localhost:8080/login?userId=${encodeURIComponent(userId)}&password=Tanker`);

    // User not found
    if (res.status === 404) {
      res = await fetch(`http://localhost:8080/signup?userId=${encodeURIComponent(userId)}&password=Tanker`);
    }

    return res.text();
  }

  onClose = async () => {
    this.log('closingSession', this.state.userId);

    await this.tanker.close();

    this.log('closedSession', this.state.userId);
  }

  onOpen = async (event) => {
    event.preventDefault();
    const userId = this.state.userId;

    try {
      this.log('openingSession', userId);

      const userToken = await this.getToken(userId);
      await this.tanker.open(userId, userToken);

      this.log('openedSession', userId);
    } catch (e) {
      this.log(e);
      this.log('serverHint');
    }
  }

  render = () => (
    <Grid>
      <Row>
        <Col lgOffset={1} md={12} lg={10}>

          <PageHeader>Tanker demo</PageHeader>

          <Row>
            <Col md={6}>
              <Panel bsStyle="primary">
                <Panel.Heading><Panel.Title componentClass="h5">Application</Panel.Title></Panel.Heading>
                <Panel.Body>
                  <FormGroup controlId="userId">
                    <ControlLabel>Session</ControlLabel>
                    <InputGroup>
                      <FormControl
                        name="userId"
                        placeholder={"User ID, e.g. \"alice-id\""}
                        type="text"
                        value={this.state.userId}
                        onChange={this.onUserChange}
                        onKeyPress={event => {
                          if (event.key === "Enter" && this.state.userId) {
                            if (this.tanker.status === this.tanker.CLOSED) {
                              this.onOpen(event);
                            } else {
                              this.onClose();
                            }
                          }
                        }}
                        disabled={this.tanker.status !== this.tanker.CLOSED}
                      />
                      <InputGroup.Button>
                        {this.tanker.status === this.tanker.CLOSED && (
                          <Button
                            bsStyle="primary"
                            onClick={this.onOpen}
                            disabled={this.state.userId === ''}
                          >
                            Open
                          </Button>
                        )}
                        {this.tanker.status !== this.tanker.CLOSED && (
                          <Button
                            bsStyle="danger"
                            onClick={this.onClose}
                            disabled={this.state.userId === ''}
                          >
                            Close
                          </Button>
                        )}
                      </InputGroup.Button>
                    </InputGroup>
                  </FormGroup>
                  <hr />
                  <FormGroup controlId="clearText">
                    <ControlLabel>Encryption</ControlLabel>
                    <InputGroup>
                      <FormControl
                        name="clearText"
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
                        name="shareWith"
                        value={this.state.shareWith}
                        onChange={this.onShareChange}
                        placeholder="User ID of another user"
                      />
                    </InputGroup>
                  </FormGroup>
                  <hr />
                  <FormGroup controlId="encryptedText">
                    <ControlLabel>Decryption</ControlLabel>
                    <InputGroup>
                      <FormControl
                        name="encryptedText"
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
