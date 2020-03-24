import * as React from 'react';
import {
  Alert,
  Button,
  ButtonGroup,
  FormLabel,
  FormGroup,
  FormControl,
} from 'react-bootstrap';
import * as emailValidator from 'email-validator';

export default class Form extends React.Component {
  state = {
    isLoading: false,
    email: '',
    password: '',
    emailError: false,
    passwordError: false,
    serverError: null,
  };

  onSubmit = async (event) => {
    event.preventDefault();

    const { isLoading, email, password } = this.state;
    const { onSubmit } = this.props;

    if (isLoading) return;

    const emailError = !email || !emailValidator.validate(email);
    const passwordError = password === '';

    if (emailError || passwordError) {
      this.setState({ isLoading: false, emailError, passwordError });
      return;
    }

    this.setState({
      isLoading: true,
      emailError: false,
      passwordError: false,
      serverError: null,
    });

    try {
      await onSubmit(email, password);
    } catch (e) {
      console.error(e);
      this.setState({ isLoading: false, serverError: e.message });
    }
  };

  handleLoginChange = (e) => {
    this.setState({ email: e.target.value });
  };

  handlePasswordChange = (e) => {
    this.setState({ password: e.target.value });
  };

  render() {
    const { typeAction, formId } = this.props;
    const {
      email, password, emailError, passwordError, serverError, isLoading,
    } = this.state;

    return (
      <form className="form-login">
        {serverError && <Alert variant="danger">{serverError}</Alert>}
        <FormGroup controlId={`${formId}-email`}>
          <FormLabel>Email</FormLabel>
          <FormControl
            type="text"
            value={email}
            placeholder="Email"
            onChange={this.handleLoginChange}
            isInvalid={!!emailError}
            required
            autoFocus
          />
          {emailError && <FormControl.Feedback type="invalid">This email address is invalid</FormControl.Feedback>}
        </FormGroup>
        <FormGroup
          controlId={`${formId}-password`}
        >
          <FormLabel>Password</FormLabel>
          <FormControl
            type="password"
            value={password}
            placeholder="Password"
            onChange={this.handlePasswordChange}
            isInvalid={!!passwordError}
            required
          />
          {passwordError && <FormControl.Feedback type="invalid">This field is required</FormControl.Feedback>}
        </FormGroup>
        <ButtonGroup>
          <Button
            id={`${formId}-submit`}
            type="submit"
            variant="primary"
            disabled={isLoading}
            onClick={this.onSubmit}
          >
            {typeAction}
          </Button>
        </ButtonGroup>
      </form>
    );
  }
}
