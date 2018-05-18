import { Alert, FormControl, Panel } from "react-bootstrap";
import React from "react";

type Props = {
  history: Object,
  match: Object
};

type State = {
  text: string,
  error: ?string,
  isLoading: boolean
};

class ViewNote extends React.Component<Props, State> {
  state = { text: "", error: null, isLoading: true };

  componentWillMount() {
    // FIXME: need to abort if onBackClicked is fired before
    // load is done
    this.load();
  }

  onBackClicked = event => {
    event.preventDefault();
    this.props.history.goBack();
  };

  async load() {
    const { session } = this.props;
    const { friendId } = this.props.match.params;

    this.setState({ isLoading: true });
    try {
      const text = await session.loadTextFromUser(friendId);
      this.setState({ text, error: null, isLoading: false });
    } catch (error) {
      console.error(error);
      this.setState({ text: "", error: error.toString(), isLoading: false });
    }
  }

  render() {
    const { friendId } = this.props.match.params;
    const { text, error, isLoading } = this.state;
    return (
      <div>
        <Panel>
          <Panel.Heading>Note from {friendId}</Panel.Heading>
          <Panel.Body>
            {error && <Alert bsStyle="danger">{error}</Alert>}
            {isLoading && <Alert bsStyle="info">Loading...</Alert>}
            <FormControl disabled componentClass="textarea" value={text} rows="12" />
          </Panel.Body>
          <Panel.Footer>
            <a onClick={this.onBackClicked} href="/">
              &laquo; Back
            </a>
          </Panel.Footer>
        </Panel>
      </div>
    );
  }
}

export default ViewNote;
