// @flow
import * as React from 'react';
import { Alert, Button, ButtonGroup, ControlLabel, FormGroup, FormControl, HelpBlock } from 'react-bootstrap';

type Props = {
  onSubmit: (login: string, password: string) => Promise<void>,
  typeAction: string,
};

type State = {
  isLoading: bool,
  login: string,
  password: string,
  loginError: bool,
  passwordError: bool,
  serverError: ?string,
};

export default class Form extends React.Component<Props, State> {
  state = {
    isLoading: false,
    login: '',
    password: '',
    loginError: false,
    passwordError: false,
    serverError: null,
  };

  handleLoginChange = (e: SyntheticInputEvent) => {
    this.setState({ login: e.target.value });
  }

  handlePasswordChange = (e: SyntheticInputEvent) => {
    this.setState({ password: e.target.value });
  }

  onClick = async event => {
    event.preventDefault();

    const { isLoading, login, password } = this.state;
    const { onSubmit } = this.props;

    if (isLoading)
      return;

    if (!login || ! password) {
      const loginError = login === '';
      const passwordError = password === '';
      this.setState({ isLoading: false, loginError, passwordError });

      return;
    }

    this.setState({ isLoading: true, loginError: false, passwordError: false, serverError: null });

    try {
      await onSubmit(login, password);
    } catch (e) {
      console.error(e);
      this.setState({ isLoading: false, serverError: e.message });
    }
  }

  render() {
    const { typeAction } = this.props;
    const { login, password, loginError, passwordError, serverError, isLoading } = this.state;

    return (
      <form className="form-signin">
        {serverError && <Alert bsStyle="danger">{serverError}</Alert>}
        <FormGroup controlId={`${typeAction}-userId`} validationState={loginError ? 'error': null}>
          <ControlLabel>Username</ControlLabel>
          <FormControl
            type="text"
            value={login}
            placeholder="Username"
            onChange={this.handleLoginChange}
            required
            autoFocus
          />
          <FormControl.Feedback />
          {loginError && <HelpBlock>This field is required</HelpBlock>}
        </FormGroup>
        <FormGroup controlId={`${typeAction}-password`} validationState={passwordError ? 'error': null}>
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
          <Button type="submit" bsStyle="primary" disabled={isLoading} onClick={this.onClick}>
            {typeAction}
          </Button>
        </ButtonGroup>
      </form>
    );
  }
}
