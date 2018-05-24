import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import Session from "./Session";
import App from "./components/App";

const session = new Session();

ReactDOM.render(
  <BrowserRouter>
    <App session={session} />
  </BrowserRouter>,
  document.getElementById("root"),
);
