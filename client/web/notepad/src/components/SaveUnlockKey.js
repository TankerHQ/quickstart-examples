// @flow
import * as React from 'react';
import { Button, Panel, Well } from 'react-bootstrap';

import Session from '../Session';

type Props = { session: Session, onKeySaved: SyntheticEvent => any };
type State = { isLoading: bool, key?: string };

class SaveUnlockKey extends React.Component<Props, State> {
  state = { isLoading: false };

  componentDidMount = async () => {
    this.setState({ isLoading: true });
    const key = await this.props.session.getUnlockKey();
    this.setState({ isLoading: false, key });
  }

  render = () => (
    <Panel>
      <Panel.Heading>Please save this unlock key</Panel.Heading>
      <Panel.Body className="unlockKey" bsStyle="success">
        <Well>{this.state.key}</Well>
        <Button onClick={this.props.onKeySaved}>Done</Button>
      </Panel.Body>
    </Panel>
  )
}

export default SaveUnlockKey;
