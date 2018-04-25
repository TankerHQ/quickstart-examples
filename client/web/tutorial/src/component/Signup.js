// @flow

import React from 'react';
import { withRouter } from 'react-router';

import Session from '../Session';

import Form from './form';

type Props = {
  session: Session,
  history: any,
};

class Signup extends React.Component<Props> {
  handleSignUp = async (login: string, password: string) => {
    const { session, history } = this.props;
    if (session.isOpen()) {
      console.log(`Closing previous session opened by ${session.userId}`);
      await session.close();
    }
    await session.create(login, password);
    history.push('/savekey/');
  }

  render() {
    return (
      <Form typeAction="Signup" onSubmit={this.handleSignUp} />
    );
  }
}
export default withRouter(Signup);
