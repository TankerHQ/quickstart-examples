import React from "react";

import Authentication from "../Authentication";
import NewDevice from "../NewDevice";
import Notepad from "./Notepad";
import Topbar from "../Topbar";
import ServerApi from '../../ServerApi';

import "./App.css";

class App extends React.Component {
  state = { status: "initializing" };

  componentWillMount() {
    const { session } = this.props;
    // App's status will always be synchronized with the session status
    session.on("statusChange", ([, status]) => this.setState({ status }));
  }

  onLogIn = async (email, password) => {
    const { session } = this.props;
    const { status } = this.state;
    if (status === 'open') {
      console.warn(`Closing previous session opened by ${session.user.email}`);
      await session.close();
    }

    await session.logIn(email, password);
  };

  onSignUp = async (email, password) => {
    const { session } = this.props;
    const { status } = this.state;
    if (status === 'open') {
      console.warn(`Closing previous session opened by ${session.user.email}`);
      await session.close();
    }

    await session.signUp(email, password);
  };

  onLogOut = async () => {
    const { session } = this.props;
    const { status } = this.state;
    if (status === 'open') {
      await session.close();
    }
  };

  onPasswordResetRequest = async (email) => {
    const serverApi = new ServerApi();
    await serverApi.requestResetPassword(email);
  }

  onPasswordResetConfirm = async ({ newPassword, passwordResetToken, verificationCode }) => {
    const { session } = this.props;
    await session.resetPassword(newPassword, passwordResetToken, verificationCode);
  }

  onUnlockDevice = async password => {
    await this.props.session.unlockCurrentDevice(password);
  };

  render = () => {
    const { session } = this.props;
    const { status } = this.state;

    return (
      <div className="app">
        <Topbar status={status} email={session.user && session.user.email} onLogOut={this.onLogOut} />
        <div className="container">
          {status === "initializing" && null}
          {status === "open" && <Notepad session={session} />}
          {status === "openingNewDevice" && <NewDevice onUnlockDevice={this.onUnlockDevice} />}
          {status === "closed" && (
            <Authentication
              onLogIn={this.onLogIn}
              onSignUp={this.onSignUp}
              onPasswordResetRequest={this.onPasswordResetRequest}
              onPasswordResetConfirm={this.onPasswordResetConfirm}
            />
          )}
        </div>
      </div>
    );
  };
}

export default App;
