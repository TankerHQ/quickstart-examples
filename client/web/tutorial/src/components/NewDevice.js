import * as React from "react";
import { Alert, Button, ControlLabel, FormControl, FormGroup, Panel } from "react-bootstrap";

class NewDevice extends React.Component {
  state = {
    password: "",
    isLoading: false,
    error: null,
  };

  onChange = e => {
    this.setState({ password: e.currentTarget.value });
  };

  onClick = async event => {
    event.preventDefault();

    const { onUnlockDevice } = this.props;
    this.setState({ isLoading: true });
    try {
      await onUnlockDevice(this.state.password);
    } catch (e) {
      this.setState({ isLoading: false, error: e.message });
    }
  };

  render() {
    const { error, password, isLoading } = this.state;

    return (
      <Panel>
        <Panel.Heading id="new-device-heading">First connection on a new device</Panel.Heading>
        <Panel.Body>
          <form className="form-signin">
            {error && <Alert bsStyle="danger">{error}</Alert>}
            <FormGroup>
              <ControlLabel>Please enter your password</ControlLabel>
              <FormControl
                id="password-input"
                type="password"
                value={password}
                onChange={this.onChange}
                required
                autoFocus
              />
              <FormControl.Feedback />
            </FormGroup>
            <Button
              id="unlock-button"
              type="submit"
              bsStyle="primary"
              className="pull-right"
              disabled={isLoading}
              onClick={this.onClick}
            >
              Unlock device
            </Button>
          </form>
        </Panel.Body>
      </Panel>
    );
  }
}
export default NewDevice;
