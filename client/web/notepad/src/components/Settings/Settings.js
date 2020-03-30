import React from 'react';
import {
  Alert,
  Button,
  Card,
  FormGroup,
  FormControl,
} from 'react-bootstrap';
import * as emailValidator from 'email-validator';

const cleanEmail = { newEmail: '', verificationCode: '', verificationCodeSent: false };
const cleanMessages = { errorMessage: null, successMessage: null };
const cleanPassword = { newPassword: '', newPasswordConfirmation: '', oldPassword: '' };

const defaultState = {
  changeInProgress: false,
  ...cleanEmail,
  ...cleanMessages,
  ...cleanPassword,
  editMode: 'none', // "email", "password"
};

class Settings extends React.Component {
  state = { ...defaultState };

  onBackClicked = (event) => {
    event.preventDefault();
    this.props.history.push('/');
  };

  onCancel = (event) => {
    event.preventDefault();
    this.setState({ ...defaultState });
  }

  onEmailEdit = (event) => {
    event.preventDefault();
    this.setState({ ...cleanMessages, ...cleanPassword, editMode: 'email' });
  };

  onPasswordEdit = (event) => {
    event.preventDefault();
    this.setState({ ...cleanMessages, ...cleanEmail, editMode: 'password' });
  };

  onEmailChange = (emailChanges) => {
    this.setState({ ...cleanMessages, ...emailChanges });
  };

  onVerificationCodeChange = (verifCodeChanges) => {
    this.setState({ ...cleanMessages, ...verifCodeChanges });
  };

  onPasswordChange = (passwordChanges) => {
    this.setState({ ...cleanMessages, ...passwordChanges });
  };

  onEmailButtonClick = async (event) => {
    event.preventDefault();
    const { session } = this.props;
    const { verificationCodeSent, newEmail } = this.state;
    if (!verificationCodeSent) {
      await session.serverApi.requestVerificationCode(newEmail);
      this.setState({ verificationCodeSent: true });
    } else {
      await this.onEmailSave();
    }
  };

  onEmailSave = async () => {
    const { session } = this.props;
    const { newEmail, verificationCode } = this.state;
    this.setState({ changeInProgress: true });
    try {
      await session.changeEmail(newEmail, verificationCode);
      const successMessage = `Successfully saved your new email address: ${newEmail}`;
      this.setState({
        ...defaultState, editMode: 'email', successMessage, verificationCodeSent: false, verificationCode: '',
      });
    } catch (e) {
      console.error(e);
      this.setState({ changeInProgress: false, errorMessage: e.message });
    }
  }

  onPasswordSave = async (event) => {
    event.preventDefault();
    const { session } = this.props;
    const { oldPassword, newPassword } = this.state;
    this.setState({ changeInProgress: true });
    try {
      await session.changePassword(oldPassword, newPassword);
      const successMessage = 'Successfully saved your new password';
      this.setState({ ...defaultState, editMode: 'password', successMessage });
    } catch (e) {
      console.error(e);
      this.setState({ changeInProgress: false, errorMessage: e.message });
    }
  }

  validateEmail = () => {
    const { session } = this.props;
    const { newEmail } = this.state;
    if (!emailValidator.validate(newEmail)) {
      return [false, 'Invalid email address'];
    }
    if (newEmail === session.user.email) {
      return [false, 'This is already your current email address'];
    }
    return [true, null];
  };

  validatePassword = () => {
    const { oldPassword, newPassword, newPasswordConfirmation } = this.state;
    if (!!oldPassword && oldPassword === newPassword) {
      return [false, 'The new password is not different from the old one'];
    }
    if (newPassword !== newPasswordConfirmation) {
      return [false, 'The new password and its confirmation do not match'];
    }
    return [true, null];
  }

  render() {
    const { session } = this.props;

    const {
      changeInProgress, editMode, errorMessage, newEmail,
      oldPassword, newPassword, newPasswordConfirmation,
      successMessage, verificationCodeSent, verificationCode,
    } = this.state;

    const passwordEmpty = !oldPassword || !newPassword || !newPasswordConfirmation;
    const emailEmpty = !newEmail;

    const [emailValid, emailError] = this.validateEmail();
    const [passwordValid, passwordError] = this.validatePassword();

    return (
      <Card>
        <Card.Header id="settings-heading">Settings</Card.Header>
        <Card.Body id="settings-body">
          {/* --------- EMAIL --------- */}
          <section>
            <h2>Email address</h2>
            {editMode === 'email' && (
              <form>
                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                {successMessage && <Alert variant="success">{successMessage}</Alert>}
                <FormGroup>
                  <FormControl
                    type="text"
                    id="new-email-input"
                    value={newEmail}
                    placeholder="Enter your new email address"
                    onChange={(event) => this.onEmailChange({ newEmail: event.target.value })}
                    isInvalid={!!newEmail && !emailValid}
                    autoFocus
                    required
                  />
                  {!!newEmail && !emailValid && <FormControl.Feedback type="invalid">{emailError}</FormControl.Feedback>}
                </FormGroup>
                {verificationCodeSent && (
                  <FormGroup>
                    <FormControl
                      type="text"
                      id="new-email-verification-code"
                      value={verificationCode}
                      placeholder="Enter your verification code"
                      onChange={(event) => this.onVerificationCodeChange({ verificationCode: event.target.value })}
                      isInvalid={!!newEmail && !emailValid}
                      autoFocus
                      required
                    />
                    {!!newEmail && !emailValid && <FormControl.Feedback type="invalid">{emailError}</FormControl.Feedback>}
                  </FormGroup>
                )}
                <Button
                  id="save-email-button"
                  type="submit"
                  variant="primary"
                  onClick={this.onEmailButtonClick}
                  disabled={changeInProgress || emailEmpty || !emailValid}
                >
                  Save
                </Button>
                <Button
                  id="cancel-button"
                  variant="link"
                  onClick={this.onCancel}
                  disabled={changeInProgress}
                >
                  Cancel
                </Button>
              </form>
            )}
            {editMode !== 'email' && (
              <FormGroup>
                <span>{session.user.email} &mdash; </span>
                <Button
                  id="edit-email-button"
                  className="edit-link"
                  variant="link"
                  onClick={this.onEmailEdit}
                  display={editMode === 'email' ? 'none' : 'initial'}
                  disabled={changeInProgress}
                >
                  Change your email address
                </Button>
              </FormGroup>
            )}
          </section>
          {/* --------- PASSWORD --------- */}
          <section>
            <h2>Password</h2>
            {editMode === 'password' && (
              <form>
                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                {successMessage && <Alert variant="success">{successMessage}</Alert>}
                <FormGroup>
                  <FormControl
                    type="password"
                    id="old-password-input"
                    value={oldPassword}
                    placeholder="Enter your current password"
                    onChange={(event) => this.onPasswordChange({ oldPassword: event.target.value })}
                    autoFocus
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <FormControl
                    type="password"
                    id="new-password-input"
                    value={newPassword}
                    placeholder="Enter your new password"
                    onChange={(event) => this.onPasswordChange({ newPassword: event.target.value })}
                    isInvalid={!passwordValid}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <FormControl
                    type="password"
                    id="password-confirmation-input"
                    value={newPasswordConfirmation}
                    placeholder="Confirm your new password"
                    onChange={(event) => this.onPasswordChange({ newPasswordConfirmation: event.target.value })}
                    isInvalid={!passwordValid}
                    required
                  />
                  {!passwordValid && <FormControl.Feedback type="invalid">{passwordError}</FormControl.Feedback>}
                </FormGroup>
                <Button
                  id="save-password-button"
                  type="submit"
                  variant="primary"
                  onClick={this.onPasswordSave}
                  disabled={changeInProgress || passwordEmpty || !passwordValid}
                >
                  Save
                </Button>
                <Button
                  id="cancel-button"
                  variant="link"
                  onClick={this.onCancel}
                  disabled={changeInProgress}
                >
                  Cancel
                </Button>
              </form>
            )}
            {editMode !== 'password' && (
              <FormGroup>
                <Button
                  id="edit-password-button"
                  className="edit-link"
                  variant="link"
                  onClick={this.onPasswordEdit}
                  display={editMode === 'password' ? 'none' : 'initial'}
                  disabled={changeInProgress}
                >
                  Change your password
                </Button>
              </FormGroup>
            )}
          </section>
        </Card.Body>
        <Card.Footer>
          <a onClick={this.onBackClicked} href="/">
            &laquo; Back
          </a>
        </Card.Footer>
      </Card>
    );
  }
}

export default Settings;
