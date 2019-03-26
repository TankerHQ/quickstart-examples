import React from "react";
import { Alert, Button, ControlLabel, FormControl, FormGroup, HelpBlock, Panel } from "react-bootstrap";

const validateCode = (code) => typeof code === 'string' && code.match(/^\d{8}$/);

class Verify extends React.Component {
  state = {
    code: "",
    error: null,
    isLoading: true,
    isLoaded: false,
    isSaving: false,
  };

  async componentDidMount() {
    await this.load();
  }

  load = async () => {
    this.setState({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.props.session.serverApi.requestVerificationCode();
      this.setState({ isLoading: false, isLoaded: true });
    } catch (e) {
      console.error(e);
      this.setState({ error: e.toString(), isLoading: false, isLoaded: true });
    }
  }

  onCodeChange = async (e) => {
    const code = e.target.value.trim();
    this.setState({ code });
  }

  onSubmit = async () => {
    const { code } = this.state;
    await this.props.session.claim(code);
  }

  render() {
    const { code, error, isLoading, isLoaded, isSaving } = this.state;
    const codeValid = validateCode(code);
    const { user } = this.props.session;
    const disabled = isLoading || !isLoaded || isSaving || !codeValid;

    return (
      <Panel>
        <Panel.Heading id="identity-heading">Identity verification needed</Panel.Heading>
        <Panel.Body>
          {isLoading && <Alert bsStyle="warning">Sending verification code to {user.email}...</Alert>}
          {isLoaded && !error && <Alert bsStyle="success">Verification code sent to {user.email}. Please fill it in below:</Alert>}
          {error && (
            <Alert id="edit-error" bsStyle="danger">
              {error}
            </Alert>
          )}
          <form>
            <FormGroup validationState={error ? "error" : null}>
              <ControlLabel>Verification code</ControlLabel>
              <FormControl
                type="text"
                value={code}
                placeholder="··· ··· ···"
                onChange={this.onCodeChange}
                required
                autoFocus
              />
              <FormControl.Feedback />
              {error && <HelpBlock>The code is invalid</HelpBlock>}
            </FormGroup>
            <Button
              id="submit-button"
              bsStyle="success"
              onClick={this.onSubmit}
              disabled={disabled}
            >
              Submit
            </Button>
          </form>
        </Panel.Body>
      </Panel>
    );
  }
}

export default Verify;
