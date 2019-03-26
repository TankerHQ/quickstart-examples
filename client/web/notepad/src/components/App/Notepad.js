import React from "react";
import { Redirect, Route, Switch } from "react-router";

import Home from "../Home";
import ViewNote from "../ViewNote";
import Share from "../Share";
import Settings from "../Settings";
import Edit from "../Edit";
import Verify from "../Verify";

const Content = ({ session }) => {
  if (session.status === "verify") {
    return <Verify session={session} />;
  }

  return (
    <Switch>
      <Route path="/view/:friendId/:friendEmail" render={props => <ViewNote session={session} {...props} />} />
      <Route path="/edit" render={props => <Edit session={session} {...props} />} />
      <Route path="/share" render={props => <Share session={session} {...props} />} />
      <Route path="/settings" render={props => <Settings session={session} {...props} />} />
      <Route path="/" exact render={props => <Home session={session} {...props} />} />
      <Route path="/" render={() => <Redirect to="/" />} />
    </Switch>
  );
}

export default Content;
