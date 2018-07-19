import React from "react";
import { withRouter } from "react-router-dom";

import {
  Alert,
  Button,
  ControlLabel,
  FormGroup,
  FormControl,
  HelpBlock,
} from "react-bootstrap";

class PasswordResetRequest extends React.Component {
  state = {
    email: this.props.defaultEmail || "",
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

  validateEmail = (/*email*/) => {
    // TODO: add email format validation
    return true;
  }

  render() {
    const { email, errorMessage, formDisabled, successMessage } = this.state;
    const emailValid = this.validateEmail(email);

    return (
      <form>
        {errorMessage && <Alert bsStyle="danger">{errorMessage}</Alert>}
        {successMessage && <Alert bsStyle="success">{successMessage}</Alert>}
        <FormGroup validationState={emailValid ? null : "error"}>
          {!errorMessage && !successMessage && (
            <Alert>Please fill in your email address to receive a password reset link.</Alert>
          )}
          <ControlLabel>Email</ControlLabel>
          <FormControl
            type="text"
            value={email}
            placeholder="Enter your email address"
            onChange={event => this.onEmailChange({ email: event.target.value })}
            disabled={formDisabled}
            required
            autoFocus
          />
          <FormControl.Feedback />
          {!emailValid && <HelpBlock>Please enter a valid email address</HelpBlock>}
        </FormGroup>
        <Button
          id="save-email-button"
          type="submit"
          bsStyle="primary"
          onClick={this.onSubmit}
          disabled={formDisabled || !email || !emailValid}
        >
          Send link
        </Button>
        <Button
          id="cancel-button"
          bsStyle="link"
          onClick={this.navigationHandler("/login")}
          disabled={formDisabled}
        >
          Cancel
        </Button>
      </form>
    );
  }
}

export default withRouter(PasswordResetRequest);
