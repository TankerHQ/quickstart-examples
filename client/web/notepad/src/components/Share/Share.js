import React from 'react';
import {
  Alert, Button, Card, FormGroup, FormLabel, FormControl,
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
      <Card>
        <Card.Header id="share-heading">Share</Card.Header>
        <Card.Body>
          {error && (
            <Alert id="share-error" variant="danger">
              {error}
            </Alert>
          )}
          <FormGroup controlId="share-with-input">
            <FormLabel>Share with</FormLabel>
            <FormControl
              type="text"
              value={emails.join(', ')}
              placeholder="a@email.com, b@email.com, ..."
              onChange={this.onEmailsChange}
              required
              autoFocus
            />
            {!emailsValid && <FormControl.Feedback type="invalid">At least one email address is invalid</FormControl.Feedback>}
          </FormGroup>
          <Button
            id="share-button"
            variant="primary"
            className="pull-right"
            onClick={this.onShareClicked}
            disabled={isSharing || !emailsValid}
          >
            {isSharing ? 'Sharing...' : 'Share'}
          </Button>
        </Card.Body>
        <Card.Footer>
          <a onClick={this.onBackClicked} href="/">
            &laquo; Back
          </a>
        </Card.Footer>
      </Card>
    );
  }
}

export default Share;
