import React from 'react';
import {
  Button, Panel, Alert, FormGroup, ControlLabel, FormControl, HelpBlock,
} from 'react-bootstrap';
import * as emailValidator from 'email-validator';

const parseEmails = (string) => {
  const emails = string.split(/[, ]+/);
  const emailsValid = emails.reduce((v, email) => v && emailValidator.validate(email), true);
  return { emails, emailsValid };
};

class Share extends React.Component {
  state = {
    emails: [], // the new selection
    emailsValid: true,
    isSharing: false,
    error: null,
  };

  onEmailsChange = (e) => {
    const { emails, emailsValid } = parseEmails(e.target.value);
    this.setState({ emails, emailsValid });
  };

  onBackClicked = (event) => {
    event.preventDefault();
    this.props.history.push('/edit');
  };

  onShareClicked = async () => {
    const { session } = this.props;
    const { emails } = this.state;
    this.setState({ error: null, isSharing: true });
    try {
      await session.share(emails);
      this.setState({ isSharing: false });
      this.props.history.push('/edit');
    } catch (err) {
      console.error(err);
      this.setState({ error: err.toString(), isSharing: false });
    }
  };

  render() {
    const {
      emails, emailsValid, error, isSharing,
    } = this.state;
    return (
      <Panel>
        <Panel.Heading id="share-heading">Share</Panel.Heading>
        <Panel.Body>
          {error && (
            <Alert id="share-error" bsStyle="danger">
              {error}
            </Alert>
          )}
          <FormGroup controlId="share-with-input">
            <ControlLabel>Share with</ControlLabel>
            <FormControl
              type="text"
              value={emails.join(', ')}
              placeholder="a@email.com, b@email.com, ..."
              onChange={this.onEmailsChange}
              required
              autoFocus
            />
            <FormControl.Feedback />
            {!emailsValid && <HelpBlock>At least one email address is invalid</HelpBlock>}
          </FormGroup>
          <Button
            id="share-button"
            bsStyle="primary"
            className="pull-right"
            onClick={this.onShareClicked}
            disabled={isSharing || !emailsValid}
          >
            {isSharing ? 'Sharing...' : 'Share'}
          </Button>
        </Panel.Body>
        <Panel.Footer>
          <a onClick={this.onBackClicked} href="/">
            &laquo; Back
          </a>
        </Panel.Footer>
      </Panel>
    );
  }
}

export default Share;
