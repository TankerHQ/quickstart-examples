import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import 'babel-polyfill';
import './index.css';
import App from './App';

import Session from './Session';

const session = new Session();

ReactDOM.render(
  <BrowserRouter>
    <App session={session}/>
  </BrowserRouter>,
  document.getElementById('root')
);
