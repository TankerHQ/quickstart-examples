import React from 'react';
// import { Link } from "react-router-dom";

import Form from './Form';

const Login = ({ onSubmit }) => (
  <div>
    <Form typeAction="Log in" formId="log-in" onSubmit={onSubmit} />
    {/* TEMPORARY: hide until 2-step account recovery implemented
      <Link id="forgot-password-link" to="/request-password-reset" href="/request-password-reset">
        Forgot password?
      </Link>
    */}
  </div>
);

export default Login;
