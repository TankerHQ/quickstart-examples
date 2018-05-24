// @flow
import React from "react";
import Form from "./Form";

type Props = { onSubmit: (login: string, password: string) => Promise<void> };
const Signup = ({ onSubmit }: Props) => (
  <Form typeAction="Sign up" formId="sign-up" onSubmit={onSubmit} />
);

export default Signup;
