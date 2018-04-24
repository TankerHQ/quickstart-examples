// @flow

import React from 'react';
import { FormGroup, FormControl, ControlLabel, Button, Alert, type SyntheticInputEvent } from 'react-bootstrap';

type Props = {
  onSubmit: (login: string, password: string) => Promise<void>,
  typeAction: string,
};

type State = {
  login: string,
  password: string,
  isLoading: bool,
  error: ?string,
};

export default class Form extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      login: '',
      password: '',
      isLoading: false,
      error: null,
    };
  }

  handleLoginChange = (e: SyntheticInputEvent) => {
    this.setState({ login: e.target.value });
  }

  handlePasswordChange = (e: SyntheticInputEvent) => {
    this.setState({ password: e.target.value });
  }

  onClick = async () => {
    const { isLoading, login, password } = this.state;
    const { onSubmit } = this.props;
    if (isLoading)
      return;
    if (login.length === 0 || password === 0) {
      this.setState({ isLoading: false, error: 'Login or password too short' });
      return;
    }
    this.setState({ isLoading: true, error: null });
    try {
      await onSubmit(login, password);
    } catch (ex) {
      this.setState({ error: ex.message });
      this.setState({ isLoading: false });
    }
  }


  render() {
    const { typeAction } = this.props;
    const { login, password, error, isLoading } = this.state;

    return (
      <form action="#" className="form-signin">
        <FormGroup
          controlId={`${typeAction}-userId`}
        >
          <ControlLabel>Email address</ControlLabel>
          <FormControl
            type="text"
            value={login}
            placeholder="brigitte@laposte.net"
            onChange={this.handleLoginChange}
            required
            autoFocus
          />
          <FormControl.Feedback />
        </FormGroup>
        <FormGroup
          controlId={`${typeAction}-password`}
        >
          <ControlLabel>Password</ControlLabel>
          <FormControl
            type="password"
            value={password}
            placeholder="password"
            onChange={this.handlePasswordChange}
            required
          />
          <FormControl.Feedback />
        </FormGroup>
        <Button type="submit" disabled={isLoading} onClick={this.onClick}>
          {typeAction}
        </Button>
        {error && <Alert bsStyle="danger">{error}</Alert>}
      </form>
    );
  }
}
