import * as React from "react";
import {
  Alert,
  Button,
  ButtonGroup,
  ControlLabel,
  FormGroup,
  FormControl,
  HelpBlock,
} from "react-bootstrap";

export default class Form extends React.Component {
  state = {
    isLoading: false,
    login: "",
    password: "",
    loginError: false,
    passwordError: false,
    serverError: null,
  };

  onClick = async event => {
    event.preventDefault();

    const { isLoading, login, password } = this.state;
    const { onSubmit } = this.props;

    if (isLoading) return;

    if (!login || !password) {
      const loginError = login === "";
      const passwordError = password === "";
      this.setState({ isLoading: false, loginError, passwordError });

      return;
    }

    this.setState({
      isLoading: true,
      loginError: false,
      passwordError: false,
      serverError: null,
    });

    try {
      await onSubmit(login, password);
    } catch (e) {
      console.error(e);
      this.setState({ isLoading: false, serverError: e.message });
    }
  };

  handleLoginChange = e => {
    this.setState({ login: e.target.value });
  };

  handlePasswordChange = e => {
    this.setState({ password: e.target.value });
  };

  render() {
    const { typeAction, formId } = this.props;
    const { login, password, loginError, passwordError, serverError, isLoading } = this.state;

    return (
      <form className="form-signin">
        {serverError && <Alert bsStyle="danger">{serverError}</Alert>}
        <FormGroup controlId={`${formId}-email`} validationState={loginError ? "error" : null}>
          <ControlLabel>Email</ControlLabel>
          <FormControl
            type="text"
            value={login}
            placeholder="Email"
            onChange={this.handleLoginChange}
            required
            autoFocus
          />
          <FormControl.Feedback />
          {loginError && <HelpBlock>This field is required</HelpBlock>}
        </FormGroup>
        <FormGroup
          controlId={`${formId}-password`}
          validationState={passwordError ? "error" : null}
        >
          <ControlLabel>Password</ControlLabel>
          <FormControl
            type="password"
            value={password}
            placeholder="Password"
            onChange={this.handlePasswordChange}
            required
          />
          <FormControl.Feedback />
          {passwordError && <HelpBlock>This field is required</HelpBlock>}
        </FormGroup>
        <ButtonGroup block vertical>
          <Button
            id={`${formId}-submit`}
            type="submit"
            bsStyle="primary"
            disabled={isLoading}
            onClick={this.onClick}
          >
            {typeAction}
          </Button>
        </ButtonGroup>
      </form>
    );
  }
}
