import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { getTankerVersion } from '@tanker/client-browser';

import Session from "./Session";
import App from "./components/App";

const session = new Session();

/* eslint-disable-next-line */
console.log(`Tanker version: ${getTankerVersion()}`);

ReactDOM.render(
  <BrowserRouter>
    <App session={session} />
  </BrowserRouter>,
  document.getElementById("root"),
);
