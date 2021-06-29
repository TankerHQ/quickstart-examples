// Load polyfills for IE11 (added Array#find for react-bootstrap)
import 'react-app-polyfill/ie11';
import 'core-js/features/array/find'; // eslint-disable-line import/no-extraneous-dependencies

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import './index.css';

ReactDOM.render(<App />, document.getElementById('root'));
