// @flow
import * as React from "react";
import { Button, Panel, Well, Alert } from "react-bootstrap";

import Session from "../Session";

type Props = { session: Session, onKeySaved: (SyntheticEvent<>) => any };
type State = { isLoading: boolean, isLoaded: boolean, key: ?string };

class SaveUnlockKey extends React.Component<Props, State> {
  state = { isLoading: false, key: null };

  componentDidMount = async () => {
    this.setState({ isLoading: true });
    const key = await this.props.session.getUnlockKey();
    this.setState({ isLoading: false, isLoaded: true, key });
  };

  render = () => {
    const { isLoading, isLoaded, key } = this.state;
    return (
      <Panel>
        <Panel.Heading id="save-unlock-key-heading">Please save this unlock key</Panel.Heading>
        <Panel.Body className="unlockKey" bsStyle="success">
          {isLoading && <Alert bsStyle="info">Loading...</Alert>}
          <Well id="key-well">{key}</Well>
          <Button id="key-done-button" onClick={this.props.onKeySaved} disabled={!isLoaded}>
            Done
          </Button>
        </Panel.Body>
      </Panel>
    );
  };
}

export default SaveUnlockKey;
