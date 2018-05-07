// @flow
import React from 'react';

import Session from '../../Session';
import Edit from '../Edit';
import SaveUnlockKey from '../SaveUnlockKey';
import NewDevice from '../NewDevice';
import SessionForm from '../SessionForm';
import Topbar from '../Topbar';
import Home from '../Home';
import Friend from '../Friend';
import Share from '../Share';

import './App.css';

type Props = { session: Session };
type State = { panel: 'sessionForm' | 'saveKey' | 'validateDevice' | 'edit' | 'home' };

class App extends React.Component<Props, State> {
  state = { panel: 'sessionForm' }

  onSignin = async (login: string, password: string) => {
    const { session } = this.props;
    if (session.isOpen()) {
      console.log(`Closing previous session opened by ${session.userId}`);
      return session.close();
    }

    session.once('newDevice', () => this.setState({ panel: 'validateDevice' }));
    await session.login(login, password);
    this.setState({ panel: 'home' });
  }

  onSignup = async (login: string, password: string) => {
    const { session } = this.props;
    if (session.isOpen()) {
      console.log(`Closing previous session opened by ${session.userId}`);
      await session.close();
    }

    await session.create(login, password);
    this.setState({ panel: 'saveKey' });
  }

  onSignout = async () => {
    const { session } = this.props;
    if (session.isOpen()) {
      await session.close();
      this.setState({ panel: 'sessionForm' });
    }
  }

  onKeySaved = async () => {
    this.setState({ panel: 'home' });
  }

  onUnlockDevice = async (unlockKey: string) => {
    await this.props.session.addCurrentDevice(unlockKey);
    this.setState({ panel: 'home' });
  }

  onEdit = () => {
    this.setState({ panel: 'edit' });
  }

  onFriend = (friend) => {
    this.setState({ panel: 'friend', friend });
  }

  onHome = () => {
    this.setState({ panel: 'home' });
  }

  onShare = (resourceId) => {
    this.setState({ panel: 'share', resourceId });
  }

  render = () => {
    const { session } = this.props;
    const { panel, friend, resourceId } = this.state;

    return (
      <div className="app">
        <Topbar isOpen={session.isOpen()} userId={session.userId} onSignout={this.onSignout} />
        <div className="container">
          {panel === 'sessionForm' && <SessionForm onSignin={this.onSignin} onSignup={this.onSignup} />}
          {panel === 'saveKey' && <SaveUnlockKey session={session} onKeySaved={this.onKeySaved} />}
          {panel === 'validateDevice' && <NewDevice onUnlockDevice={this.onUnlockDevice} />}
          {panel === 'home' && <Home session={session} onEdit={this.onEdit} onFriend={this.onFriend} />}
          {panel === 'edit' && <Edit session={session} onHome={this.onHome} onShare={this.onShare} />}
          {panel === 'friend' && <Friend session={session} friend={friend} onHome={this.onHome} />}
          {panel === 'share' && <Share session={session} onEdit={this.onEdit} resourceId={resourceId}/>}
        </div>
      </div>
    );
  }
}

export default App;
