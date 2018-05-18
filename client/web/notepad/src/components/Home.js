// @flow
import React from "react";
import { Button, ButtonGroup, Panel } from "react-bootstrap";
import { Link } from "react-router-dom";

import Session from "../Session";
import AccessibleNotes from "./AccessibleNotes";

type Props = { session: Session };

type State = {
  accessibleNotes: string[],
  error: ?string,
  isLoading: boolean,
  isLoaded: boolean,
};

class Home extends React.Component<Props, State> {
  state: State = {
    accessibleNotes: [],
    isLoading: true,
    isLoaded: false,
    error: null,
  };

  async componentWillMount() {
    await this.load();
  }

  load = async () => {
    this.setState({ isLoading: true });
    try {
      const accessibleNotes = await this.props.session.getAccessibleNotes();
      this.setState({ accessibleNotes, error: null, isLoading: false, isLoaded: true });
    } catch (err) {
      this.setState({
        accessibleNotes: [],
        error: err.toString(),
        isLoading: false,
        isLoaded: true,
      });
    }
  };

  render() {
    return (
      <Panel>
        <Panel.Heading id="my-note-heading">My Note</Panel.Heading>
        <Panel.Body>
          <p>
            This is a simple notepad application. You have a single note that you can edit and
            share.
          </p>
          <p>
            <Link id="edit-link" to="/edit" href="/edit">
              Edit your note
            </Link>
          </p>
        </Panel.Body>
        <Panel.Heading id="shared-with-me-heading">
          <div style={{ display: "flex" }}>
            <span style={{ alignSelf: "center" }}>Notes shared with me</span>
            <div style={{ flexGrow: "1", justifyContent: "flex-end", display: "flex" }}>
              <Button id="refresh-button" onClick={this.load}>
                Refresh
              </Button>
            </div>
          </div>
        </Panel.Heading>
        <Panel.Body>
          <p>The notes bellow have been shared with you.</p>
          <AccessibleNotes
            error={this.state.error}
            isLoading={this.state.isLoading}
            isLoaded={this.state.isLoaded}
            accessibleNotes={this.state.accessibleNotes}
          />
        </Panel.Body>
      </Panel>
    );
  }
}

export default Home;
