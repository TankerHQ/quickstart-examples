// @flow
import React from 'react';
import { Alert, Button, ControlLabel, FormControl, FormGroup, Modal, type SyntheticInputEvent } from 'react-bootstrap';
import { withRouter } from 'react-router';

import Session from '../Session';

type Props = {
  session: Session,
  show: bool,
};

type State = {
  passphrase: string,
  isLoading: bool,
  error: ?string,
  show: bool,
};

class NewDevice extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      passphrase: '',
      isLoading: false,
      error: null,
      show: props.show,
    };
  }

  handlePassphrase = (e: SyntheticInputEvent) => {
    this.setState({ passphrase: e.target.value });
  }

  onClick = async () => {
    const { session } = this.props;
    this.setState({ isLoading: true });
    try {
      await session.addCurrentDevice(this.state.passphrase);
      this.setState({ show: false });
    } catch (e) {
      this.setState({ error: e.message });
    }
    this.setState({ isLoading: false });
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.show !== prevState.show) {
      const { show } = nextProps;
      const newState = { ...prevState, show };
      return newState;
    }
    return null;
  }

  getValidationState() {
    const { passphrase } = this.state;
    if (passphrase.length === 0) return 'error';
    if (passphrase.length >= 323) return 'success';
    return 'warning';
  }

  render() {
    const { show, error, passphrase, isLoading } = this.state;

    return (
      <Modal show={show}>
        <Modal.Header>
          <Modal.Title>
            Device unlocking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form action="#" className="form-signin">
            <FormGroup validationState={this.getValidationState()}>
              <ControlLabel>Unlock Key</ControlLabel>
              <FormControl
                componentClass="textarea"
                value={passphrase}
                onChange={this.handlePassphrase}
                required
                autoFocus
              />
              <FormControl.Feedback />
            </FormGroup>
            {error && <Alert bsStyle="danger">{error}</Alert>}
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="primary" disabled={isLoading} onClick={this.onClick}>
            Unlock device
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
export default withRouter(NewDevice);
