import * as React from "react";
import { Button, Panel, Well, Alert } from "react-bootstrap";

class SaveUnlockKey extends React.Component {
  state = { isLoading: false, isLoaded: false, key: null };

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
          <Button
            bsStyle="primary"
            id="key-done-button"
            className="pull-right"
            onClick={this.props.onKeySaved}
            disabled={!isLoaded}
          >
            Done
          </Button>
        </Panel.Body>
      </Panel>
    );
  };
}

export default SaveUnlockKey;
