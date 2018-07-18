import React from "react";

import NewDevice from "../NewDevice";
import SessionForm from "../SessionForm";
import Topbar from "../Topbar";
import Notepad from "./Notepad";

import "./App.css";

class App extends React.Component {
  state = { status: "signIn" };

  componentWillMount() {
    const { session } = this.props;
    session.on("newDevice", () => this.setState({ status: "validateDevice" }));
  }

  onSignIn = async (login, password) => {
    const { session } = this.props;
    if (session.isOpen()) {
      console.warn(`Closing previous session opened by ${session.email}`);
      await session.close();
    }

    await session.signIn(login, password);
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

  onSignOut = async () => {
    const { session } = this.props;
    if (session.isOpen()) {
      await session.close();
    }
    this.setState({ status: "signIn" });
  };

  onUnlockDevice = async password => {
    await this.props.session.unlockCurrentDevice(password);
  };

  render = () => {
    const { session } = this.props;
    const { status } = this.state;

    return (
      <div className="app">
        <Topbar isOpen={session.isOpen()} email={session.email} onSignOut={this.onSignOut} />
        <div className="container">
          {status === "signIn" && <SessionForm onSignIn={this.onSignIn} onSignUp={this.onSignUp} />}
          {status === "validateDevice" && <NewDevice onUnlockDevice={this.onUnlockDevice} />}
          {status === "ready" && <Notepad session={session} />}
        </div>
      </div>
    );
  };
}

export default App;
