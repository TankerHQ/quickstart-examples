// @flow

import fetch from 'isomorphic-fetch';
import { appServerUrl } from './client-config';

export default class Api {
  _userId: string;
  _password: string;
  +userId: string;
  +password: string;

  get userId(): string {
    return this._userId;
  }

  get password(): string {
    return this._password;
  }

  setUserInfo(userId: string, password: string): void {
    this._userId = userId;
    this._password = password;
  }

  signUp(): Promise<Response> {
    return fetch(`${appServerUrl}/signup?userId=${this.userId}&password=${this.password}`);
  }

  login(): Promise<Response> {
    return fetch(`${appServerUrl}/login?userId=${this.userId}&password=${this.password}`);
  }

  push(content: string): Promise<Response> {
    if (typeof content !== 'string') {
      throw new Error(`api.push: expecting content as string, got: ${content}. Did you forget to call toBase64?`);
    }
    const uuserId = encodeURIComponent(this.userId);
    const ppassword = encodeURIComponent(this.password);
    return fetch(`${appServerUrl}/${uuserId}/${ppassword}`, { method: 'PUT', body: content });
  }

  async get(): Promise<string> {
    const uuserId = encodeURIComponent(this.userId);
    const ppassword = encodeURIComponent(this.password);
    const response = await fetch(`${appServerUrl}/${uuserId}/${ppassword}`, { method: 'GET' });
    return response.text();
  }
}
