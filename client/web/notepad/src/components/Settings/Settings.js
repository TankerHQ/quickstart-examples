import React from "react";
import {
  Alert,
  Button,
  FormGroup,
  FormControl,
  HelpBlock,
  Panel
} from "react-bootstrap";
import * as emailValidator from "email-validator";

const cleanEmail = { newEmail: "" };
const cleanMessages = { errorMessage: null, successMessage: null };
const cleanPassword = { newPassword: "", newPasswordConfirmation: "", oldPassword: "" };

const defaultState = {
  changeInProgress: false,
  ...cleanEmail,
  ...cleanMessages,
  ...cleanPassword,
  editMode: "none", // "email", "password"
};

class Settings extends React.Component {
  state = { ...defaultState };

  onBackClicked = (event) => {
    event.preventDefault();
    this.props.history.push("/");
  };

  onCancel = (event) => {
    event.preventDefault();
    this.setState({ ...defaultState });
  }

  onEmailEdit = (event) => {
    event.preventDefault();
    this.setState({ ...cleanMessages, ...cleanPassword, editMode: "email" });
  };

  onPasswordEdit = (event) => {
    event.preventDefault();
    this.setState({ ...cleanMessages, ...cleanEmail, editMode: "password" });
  };

  onEmailChange = (emailChanges) => {
    this.setState({ ...cleanMessages, ...emailChanges });
  };

  onPasswordChange = (passwordChanges) => {
    this.setState({ ...cleanMessages, ...passwordChanges });
  };

  onEmailSave = async (event) => {
    event.preventDefault();
    const { session } = this.props;
    const { newEmail } = this.state;
    this.setState({ changeInProgress: true });
    try {
      await session.changeEmail(newEmail);
      const successMessage = `Successfully saved your new email address: ${newEmail}`;
      this.setState({ ...defaultState, editMode: "email", successMessage });
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
      const successMessage = `Successfully saved your new password`;
      this.setState({ ...defaultState, editMode: "password", successMessage });
    } catch (e) {
      console.error(e);
      this.setState({ changeInProgress: false, errorMessage: e.message });
    }
  }

  validateEmail = () => {
    const { session } = this.props;
    const { newEmail } = this.state;
    if (!emailValidator.validate(newEmail)) {
      return [false, "Invalid email address"];
    }
    if (newEmail === session.email) {
      return [false, "This is already your current email address"];
    }
    return [true, null];
  };

  validatePassword = () => {
    const { oldPassword, newPassword, newPasswordConfirmation } = this.state;
    if (!!oldPassword && oldPassword === newPassword) {
      return [false, "The new password is not different from the old one"];
    }
    if (newPassword !== newPasswordConfirmation) {
      return [false, "The new password and its confirmation do not match"];
    }
    return [true, null];
  }

  render() {
    const { session } = this.props;

    const {
      changeInProgress, editMode, errorMessage, newEmail,
      oldPassword, newPassword, newPasswordConfirmation,
      successMessage
    } = this.state;

    const passwordEmpty = !oldPassword || !newPassword || !newPasswordConfirmation;
    const emailEmpty = !newEmail;

    const [emailValid, emailError] = this.validateEmail();
    const [passwordValid, passwordError] = this.validatePassword();

    return (
      <Panel>
        <Panel.Heading id="settings-heading">Settings</Panel.Heading>
        <Panel.Body id="settings-body">
          {/* --------- EMAIL --------- */}
          <section>
            <h2>Email address</h2>
            {editMode === "email" && (
              <form>
                {errorMessage && <Alert bsStyle="danger">{errorMessage}</Alert>}
                {successMessage && <Alert bsStyle="success">{successMessage}</Alert>}
                <FormGroup validationState={!!newEmail && !emailValid ? "error" : null}>
                  <FormControl
                    type="text"
                    id="new-email-input"
                    value={newEmail}
                    placeholder="Enter your new email address"
                    onChange={event => this.onEmailChange({ newEmail: event.target.value })}
                    autoFocus
                    required
                  />
                  <FormControl.Feedback />
                  {!!newEmail && !emailValid && <HelpBlock>{emailError}</HelpBlock>}
                </FormGroup>
                <Button
                  id="save-email-button"
                  type="submit"
                  bsStyle="primary"
                  onClick={this.onEmailSave}
                  disabled={changeInProgress || emailEmpty || !emailValid}
                >
                  Save
                </Button>
                <Button
                  id="cancel-button"
                  bsStyle="link"
                  onClick={this.onCancel}
                  disabled={changeInProgress}
                >
                  Cancel
                </Button>
              </form>
            )}
            {editMode !== "email" && (
              <FormGroup>
                <span>{session.email} &mdash; </span>
                <Button
                  id="edit-email-button"
                  className="edit-link"
                  bsStyle="link"
                  onClick={this.onEmailEdit}
                  display={editMode === "email" ? "none" : "initial"}
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
            {editMode === "password" && (
              <form>
                {errorMessage && <Alert bsStyle="danger">{errorMessage}</Alert>}
                {successMessage && <Alert bsStyle="success">{successMessage}</Alert>}
                <FormGroup>
                  <FormControl
                    type="password"
                    id="old-password-input"
                    value={oldPassword}
                    placeholder="Enter your current password"
                    onChange={event => this.onPasswordChange({ oldPassword: event.target.value })}
                    autoFocus
                    required
                  />
                </FormGroup>
                <FormGroup validationState={passwordValid ? null : "error"}>
                  <FormControl
                    type="password"
                    id="new-password-input"
                    value={newPassword}
                    placeholder="Enter your new password"
                    onChange={event => this.onPasswordChange({ newPassword: event.target.value })}
                    required
                  />
                </FormGroup>
                <FormGroup validationState={passwordValid ? null : "error"}>
                  <FormControl
                    type="password"
                    id="password-confirmation-input"
                    value={newPasswordConfirmation}
                    placeholder="Confirm your new password"
                    onChange={event => this.onPasswordChange({ newPasswordConfirmation: event.target.value })}
                    required
                  />
                  <FormControl.Feedback />
                  {!passwordValid && <HelpBlock>{passwordError}</HelpBlock>}
                </FormGroup>
                <Button
                  id="save-password-button"
                  type="submit"
                  bsStyle="primary"
                  onClick={this.onPasswordSave}
                  disabled={changeInProgress || passwordEmpty || !passwordValid}
                >
                  Save
                </Button>
                <Button
                  id="cancel-button"
                  bsStyle="link"
                  onClick={this.onCancel}
                  disabled={changeInProgress}
                >
                  Cancel
                </Button>
              </form>
            )}
            {editMode !== "password" && (
              <FormGroup>
                <Button
                  id="edit-password-button"
                  className="edit-link"
                  bsStyle="link"
                  onClick={this.onPasswordEdit}
                  display={editMode === "password" ? "none" : "initial"}
                  disabled={changeInProgress}
                >
                  Change your password
                </Button>
              </FormGroup>
            )}
          </section>
        </Panel.Body>
        <Panel.Footer>
          <a onClick={this.onBackClicked} href="/">
            &laquo; Back
          </a>
        </Panel.Footer>
      </Panel>
    );
  }
}

export default Settings;
