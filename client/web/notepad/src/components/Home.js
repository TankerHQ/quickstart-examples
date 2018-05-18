// @flow
import React from "react";
import { Panel } from "react-bootstrap";
import { Link } from "react-router-dom";

import Session from "../Session";
import AccessibleNotes from "./AccessibleNotes";

type Props = { session: Session };

type State = {
  accessibleNotes: string[],
  error: ?string,
  isLoading: boolean
};

class Home extends React.Component<Props, State> {
  state: State = {
    accessibleNotes: [],
    isLoading: true,
    error: null
  };

  async componentWillMount() {
    await this.load();
  }

  async load() {
    this.setState({ isLoading: true });
    try {
      const accessibleNotes = await this.props.session.getAccessibleNotes();
      this.setState({ accessibleNotes, error: null, isLoading: false });
    } catch (err) {
      this.setState({
        accessibleNotes: [],
        error: err.toString(),
        isLoading: false
      });
    }
  }

  render() {
    return (
      <Panel>
        <Panel.Heading>My Note</Panel.Heading>
        <Panel.Body>
          <p>
            This is a simple notepad application. You have a single note that you can edit and
            share.
          </p>
          <p>
            <Link to="/edit" href="/edit">
              Edit your note
            </Link>
          </p>
        </Panel.Body>
        <Panel.Heading>Notes shared with me</Panel.Heading>
        <Panel.Body>
          <p>The notes bellow have been shared with you.</p>
          <AccessibleNotes
            error={this.state.error}
            isLoading={this.state.isLoading}
            accessibleNotes={this.state.accessibleNotes}
          />
        </Panel.Body>
      </Panel>
    );
  }
}

export default Home;
