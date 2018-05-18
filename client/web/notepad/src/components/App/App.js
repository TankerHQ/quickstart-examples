// @flow
import React from "react";

import Session from "../../Session";
import SaveUnlockKey from "../SaveUnlockKey";
import NewDevice from "../NewDevice";
import SessionForm from "../SessionForm";
import Topbar from "../Topbar";
import Notepad from "./Notepad";

import "./App.css";

type Props = { session: Session };
type State = {
  status: "signIn" | "saveKey" | "validateDevice" | "ready",
};

class App extends React.Component<Props, State> {
  state = { status: "signIn" };

  onSignIn = async (login: string, password: string) => {
    const { session } = this.props;
    if (session.isOpen()) {
      console.warn(`Closing previous session opened by ${session.userId}`);
      await session.close();
    }

    session.on("newDevice", () => this.setState({ status: "validateDevice" }));
    await session.login(login, password);
    this.setState({ status: "ready" });
  };

  onSignUp = async (login: string, password: string) => {
    const { session } = this.props;
    if (session.isOpen()) {
      console.warn(`Closing previous session opened by ${session.userId}`);
      await session.close();
    }

    session.on("newDevice", () => this.setState({ status: "validateDevice" }));
    await session.create(login, password);
    this.setState({ status: "saveKey" });
  };

  onSignOut = async () => {
    const { session } = this.props;
    if (session.isOpen()) {
      await session.close();
    }
    this.setState({ status: "signIn" });
  };

  onKeySaved = async () => {
    this.setState({ status: "ready" });
  };

  onUnlockDevice = async (unlockKey: string) => {
    await this.props.session.addCurrentDevice(unlockKey);
    this.setState({ status: "ready" });
  };

  render = () => {
    const { session } = this.props;
    const { status } = this.state;

    return (
      <div className="app">
        <Topbar isOpen={session.isOpen()} userId={session.userId} onSignOut={this.onSignOut} />
        <div className="container">
          {status === "signIn" && <SessionForm onSignIn={this.onSignIn} onSignUp={this.onSignUp} />}
          {status === "saveKey" && <SaveUnlockKey session={session} onKeySaved={this.onKeySaved} />}
          {status === "validateDevice" && <NewDevice onUnlockDevice={this.onUnlockDevice} />}
          {status === "ready" && <Notepad session={session} />}
        </div>
      </div>
    );
  };
}

export default App;
