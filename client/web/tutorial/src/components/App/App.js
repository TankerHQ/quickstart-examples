import React from "react";

import Authentication from "../Authentication";
import NewDevice from "../NewDevice";
import Notepad from "./Notepad";
import Topbar from "../Topbar";
import ServerApi from '../../ServerApi';

import "./App.css";

class App extends React.Component {
  state = { status: "logIn" };

  componentWillMount() {
    const { session } = this.props;
    session.on("newDevice", () => this.setState({ status: "validateDevice" }));
  }

  onLogIn = async (email, password) => {
    const { session } = this.props;
    if (session.isOpen()) {
      console.warn(`Closing previous session opened by ${session.email}`);
      await session.close();
    }

    await session.logIn(email, password);
    this.setState({ status: "ready" });
  };

  onSignUp = async (email, password) => {
    const { session } = this.props;
    if (session.isOpen()) {
      console.warn(`Closing previous session opened by ${session.email}`);
      await session.close();
    }

    await session.signUp(email, password);
    this.setState({ status: "ready" });
  };

  onLogOut = async () => {
    const { session } = this.props;
    if (session.isOpen()) {
      await session.close();
    }
    this.setState({ status: "logIn" });
  };

  onPasswordResetRequest = async (email) => {
    const serverApi = new ServerApi();
    await serverApi.requestResetPassword(email);
  }

  onPasswordResetConfirm = async ({ newPassword, passwordResetToken, verificationCode }) => {
    const serverApi = new ServerApi();
    const answer = await serverApi.resetPassword(passwordResetToken, newPassword);
    const jsonResponse = await answer.json();
    const { email } = jsonResponse;
    this.props.session.verificationCode = verificationCode;
    await this.props.session.logIn(email, newPassword);
    this.setState({ status: "ready" });
  }

  onUnlockDevice = async password => {
    await this.props.session.unlockCurrentDevice(password);
  };

  render = () => {
    const { session } = this.props;
    const { status } = this.state;

    return (
      <div className="app">
        <Topbar isOpen={session.isOpen()} email={session.email} onLogOut={this.onLogOut} />
        <div className="container">
          {status === "logIn" && (
            <Authentication
              onLogIn={this.onLogIn}
              onSignUp={this.onSignUp}
              onPasswordResetRequest={this.onPasswordResetRequest}
              onPasswordResetConfirm={this.onPasswordResetConfirm}
            />
          )}
          {status === "validateDevice" && <NewDevice onUnlockDevice={this.onUnlockDevice} />}
          {status === "ready" && <Notepad session={session} />}
        </div>
      </div>
    );
  };
}

export default App;
