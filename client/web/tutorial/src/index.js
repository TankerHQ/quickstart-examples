import React from 'react';
import ReactDOM from 'react-dom';

import Session from './Session';
import App from './components/App';

const session = new Session();

ReactDOM.render(<App session={session}/>, document.getElementById('root'));
