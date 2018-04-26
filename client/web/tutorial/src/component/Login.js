// @flow
import React from 'react';
import { withRouter } from 'react-router';

import Session from '../Session';
import Form from './form';
import NewDevice from './NewDevice';

type Props = {
  session: Session,
  history: any,
};

type State = {
  isNewDevice: bool,
};

class Login extends React.Component<Props, State> {
  state: State = {
    isNewDevice: false,
  }
  handleLogin = async (userId: string, password: string) => {
    const { session, history } = this.props;
    if (session.isOpen()) {
      console.log(`Closing previous session opened by ${session.userId}`);
      return session.close();
    }
    session.once('newDevice', () => this.setState({ isNewDevice: true }));
    await session.login(userId, password);
    history.push('edit/', { password });
  }

  render() {
    const { isNewDevice } = this.state;
    const { session } = this.props;

    return (
      <div>
        <NewDevice session={session} show={isNewDevice}/>
        <Form typeAction="Login" onSubmit={this.handleLogin}/>
      </div>
    );
  }
}
export default withRouter(Login);
