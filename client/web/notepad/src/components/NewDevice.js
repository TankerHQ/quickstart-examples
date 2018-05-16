// @flow
import * as React from "react";
import { Alert, Button, ControlLabel, FormControl, FormGroup, Panel } from "react-bootstrap";

type Props = {
  onUnlockDevice: string => Promise<*>
};

type State = {
  unlockKey: string,
  isLoading: boolean,
  error: ?string
};

class NewDevice extends React.Component<Props, State> {
  state = {
    unlockKey: "",
    isLoading: false,
    error: null
  };

  onChange = (e: SyntheticInputEvent<HTMLTextAreaElement>) => {
    this.setState({ unlockKey: e.currentTarget.value });
  };

  onClick = async () => {
    const { onUnlockDevice } = this.props;
    this.setState({ isLoading: true });
    try {
      await onUnlockDevice(this.state.unlockKey);
    } catch (e) {
      this.setState({ isLoading: false, error: e.message });
    }
  };

  render() {
    const { error, unlockKey, isLoading } = this.state;

    return (
      <Panel>
        <Panel.Heading>First connection on a device</Panel.Heading>
        <Panel.Body>
          <form action="#" className="form-signin">
            {error && <Alert bsStyle="danger">{error}</Alert>}
            <FormGroup>
              <ControlLabel>Please enter your unlock Key</ControlLabel>
              <FormControl
                componentClass="textarea"
                value={unlockKey}
                onChange={this.onChange}
                required
                autoFocus
              />
              <FormControl.Feedback />
            </FormGroup>
            <Button bsStyle="primary" className="pull-right" disabled={isLoading} onClick={this.onClick}>
              Unlock device
            </Button>
          </form>
        </Panel.Body>
      </Panel>
    );
  }
}
export default NewDevice;
