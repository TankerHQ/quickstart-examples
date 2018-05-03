// @flow
const appServerUrl = 'http://localhost:8080';

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

  urlFor(path) {
    const queryString = `userId=${encodeURIComponent(this.userId)}&password=${encodeURIComponent(this.password)}`;
    return `${appServerUrl}${path}?${queryString}`;
  }

  signUp(): Promise<Response> {
    return fetch(this.urlFor('/signup'));
  }

  login(): Promise<Response> {
    return fetch(this.urlFor('/login'));
  }

  push(content: string): Promise<Response> {
    if (typeof content !== 'string') {
      throw new Error(`api.push: expecting content as string, got: ${content}. Did you forget to call toBase64?`);
    }

    return fetch(this.urlFor('/data'), { method: 'PUT', body: content });
  }

  async get(): Promise<string> {
    return fetch(this.urlFor('/data'));
  }
}
