// Load polyfills for IE11 (added Array#find for react-bootstrap)
import 'react-app-polyfill/ie11';
import 'core-js/features/array/find'; // eslint-disable-line import/no-extraneous-dependencies

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Tanker } from '@tanker/client-browser';

import Session from './Session';
import App from './components/App';

const session = new Session();

/* eslint-disable-next-line */
console.log(`Tanker version: ${Tanker.version}`);

ReactDOM.render(
  <BrowserRouter>
    <App session={session} />
  </BrowserRouter>,
  document.getElementById('root'),
);
