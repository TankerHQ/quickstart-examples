import 'react-app-polyfill/ie11';
import "core-js/stable";
import "regenerator-runtime/runtime";
import '@babel/register';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import './index.css';

ReactDOM.render(<App />, document.getElementById('root'));
