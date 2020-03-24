import React from 'react';
import {
  Alert, Button, Card, FormLabel, FormControl, FormGroup,
} from 'react-bootstrap';

const validateCode = (code) => typeof code === 'string' && code.match(/^\d{8}$/);

class Verify extends React.Component {
  state = {
    code: '',
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
    await this.props.session.handleVerificationCode(code);
  }

  render() {
    const {
      code, error, isLoading, isLoaded, isSaving,
    } = this.state;
    const codeValid = validateCode(code);
    const { user } = this.props.session;
    const disabled = isLoading || !isLoaded || isSaving || !codeValid;

    return (
      <Card>
        <Card.Header id="identity-heading">Identity verification needed</Card.Header>
        <Card.Body>
          {isLoading && <Alert variant="warning">Sending verification code to {user.email}...</Alert>}
          {isLoaded && !error && <Alert variant="success">Verification code sent to {user.email}. Please fill it in below:</Alert>}
          {error && (
            <Alert id="edit-error" variant="danger">
              {error}
            </Alert>
          )}
          <form>
            <FormGroup>
              <FormLabel>Verification code</FormLabel>
              <FormControl
                type="text"
                value={code}
                placeholder="··· ··· ···"
                onChange={this.onCodeChange}
                isInvalid={!!error}
                required
                autoFocus
              />
              {error && <FormControl.Feedback type="invalid">The code is invalid</FormControl.Feedback>}
            </FormGroup>
            <Button
              id="submit-button"
              variant="success"
              onClick={this.onSubmit}
              disabled={disabled}
            >
              Submit
            </Button>
          </form>
        </Card.Body>
      </Card>
    );
  }
}

export default Verify;
