import React from "react";

import Authentication from "../Authentication";
import NewDevice from "../NewDevice";
import Notepad from "./Notepad";
import Topbar from "../Topbar";

import "./App.css";

class App extends React.Component {
  state = { status: "logIn" };

  componentWillMount() {
    const { session } = this.props;
    session.on("newDevice", () => this.setState({ status: "validateDevice" }));
  }

  onLogIn = async (login, password) => {
    const { session } = this.props;
    if (session.isOpen()) {
      console.warn(`Closing previous session opened by ${session.email}`);
      await session.close();
    }

    await session.logIn(login, password);
    this.setState({ status: "ready" });
  };

  onSignUp = async (login, password) => {
    const { session } = this.props;
    if (session.isOpen()) {
      console.warn(`Closing previous session opened by ${session.email}`);
      await session.close();
    }

    await session.signUp(login, password);
    this.setState({ status: "ready" });
  };

  onLogOut = async () => {
    const { session } = this.props;
    if (session.isOpen()) {
      await session.close();
    }
    this.setState({ status: "logIn" });
  };

  onPasswordResetRequest = async () => {
    // TODO: implement feature!
    await new Promise(resolve => setTimeout(resolve, 1000));
    //throw new Error("Oops");
  }

  onPasswordResetConfirm = async () => {
    // TODO: implement feature!
    await new Promise(resolve => setTimeout(resolve, 1000));
    //throw new Error("Oops");
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
