// @flow
import React from 'react';
import Form from './Form';

type Props = { onSubmit: (login: string, password: string) => Promise<void> };
const Signin = ({ onSubmit }: Props) => (
  <Form typeAction="Sign in" formId="sign-in" onSubmit={onSubmit}/>
);

export default Signin;
