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
    const queryString = `userId=${encodeURIComponent(
      this.userId
    )}&password=${encodeURIComponent(this.password)}`;
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
      throw new Error(
        `api.push: expecting content as string, got: ${content}. Did you forget to call toBase64?`
      );
    }

    return fetch(this.urlFor('/data'), {method: 'PUT', body: content});
  }

  async get(user): Promise<string> {
    return fetch(this.urlFor(`/data/${user}`));
  }

  async getMyData() {
    const headers = {'Content-Type': 'application/json'};
    const response = await fetch(this.urlFor('/me'), {headers});
    if (!response.ok) throw new Error('Request failed: ' + response.status);
    return response.json();
  }

  async getUsers() {
    const headers = {'Content-Type': 'application/json'};
    const response = await fetch(this.urlFor('/users'), {headers});
    if (!response.ok) throw new Error('Request failed: ' + response.status);
    return response.json();
  }

  async share(recipients) {
    const data = {
      from: this.userId,
      to: recipients,
    };
    const headers = {'Content-Type': 'application/json'};
    const response = await fetch(this.urlFor('/share'), {
      headers,
      body: JSON.stringify(data),
      method: 'POST',
    });
    if (!response.ok) throw new Error('Request failed: ' + response.status);
  }
}
