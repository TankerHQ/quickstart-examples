// @flow
import React from 'react';
import { withRouter } from 'react-router';
import { Alert, Button } from 'react-bootstrap';

import Session from '../Session';

type Props = {
  session: Session,
  history: any,
};

class SavePass extends React.Component<Props, {pass: string}> {
  constructor(props: Props) {
    super(props);
    this.state = {
      pass: '',
    };
  }
  componentDidMount = async () => {
    const { session, history } = this.props;
    if (session.isOpen())
      this.setState({ pass: await session.getUnlockKey() });
    else
      history.push('/');
  }

  render() {
    const { history } = this.props;
    return (
      <div>
        <h3>Please save this passphrase</h3>
        <Alert className="passphrase" bsStyle="success">
          {this.state.pass}
        </Alert>
        <Button onClick={() => history.push('/edit/')}>Done</Button>
      </div>
    );
  }
}

export default withRouter(SavePass);
