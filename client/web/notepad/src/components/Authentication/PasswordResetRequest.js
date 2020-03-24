import React from 'react';
import { withRouter } from 'react-router-dom';

import {
  Alert,
  Button,
  FormLabel,
  FormGroup,
  FormControl,
} from 'react-bootstrap';

class PasswordResetRequest extends React.Component {
  state = {
    email: this.props.defaultEmail || '',
    errorMessage: null,
    successMessage: null,
    formDisabled: false,
  }

  onSubmit = async (event) => {
    event.preventDefault();

    const { email } = this.state;
    this.setState({ formDisabled: true });

    try {
      await this.props.onSubmit(email);
      this.setState({ successMessage: `Email successfully sent to ${email}. Check your inbox!` });
    } catch (e) {
      this.setState({ errorMessage: e.message, formDisabled: false });
    }
  }

  onEmailChange = (changes) => {
    this.setState({ ...changes });
  }

  navigationHandler = (path) => {
    const { history } = this.props;

    return (event) => {
      event.preventDefault();
      history.replace(path);
    };
  }

  // TODO: add email format validation
  validateEmail = (/* email */) => true

  render() {
    const {
      email, errorMessage, formDisabled, successMessage,
    } = this.state;
    const emailValid = this.validateEmail(email);

    return (
      <form>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}
        <FormGroup controlId="newEmailFormGroup">
          {!errorMessage && !successMessage && (
            <Alert>Please fill in your email address to receive a password reset link.</Alert>
          )}
          <FormLabel>Email</FormLabel>
          <FormControl
            type="text"
            value={email}
            placeholder="Enter your email address"
            onChange={(event) => this.onEmailChange({ email: event.target.value })}
            isInvalid={!emailValid}
            disabled={formDisabled}
            required
            autoFocus
          />
          {!emailValid && <FormControl.Feedback type="invalid">Please enter a valid email address</FormControl.Feedback>}
        </FormGroup>
        <Button
          id="save-email-button"
          type="submit"
          variant="primary"
          onClick={this.onSubmit}
          disabled={formDisabled || !email || !emailValid}
        >
          Send link
        </Button>
        <Button
          id="cancel-button"
          variant="link"
          onClick={this.navigationHandler('/login')}
          disabled={formDisabled}
        >
          Cancel
        </Button>
      </form>
    );
  }
}

export default withRouter(PasswordResetRequest);
