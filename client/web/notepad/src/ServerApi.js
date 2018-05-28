const appServerUrl = "http://localhost:8080";

export default class Api {
  get userId() {
    return this._userId;
  }

  get password() {
    return this._password;
  }

  setUserInfo(userId, password) {
    this._userId = userId;
    this._password = password;
  }

  urlFor(path) {
    const queryString = `userId=${encodeURIComponent(this.userId)}&password=${encodeURIComponent(
      this.password,
    )}`;
    return `${appServerUrl}${path}?${queryString}`;
  }

  signUp() {
    return fetch(this.urlFor("/signup"));
  }

  login() {
    return fetch(this.urlFor("/login"));
  }

  delete() {
    return fetch(this.urlFor("/data"), { method: "DELETE" });
  }

  push(content) {
    if (typeof content !== "string") {
      throw new Error(
        `serverApi.push: expecting content as string, got: ${content}. Did you forget to call toBase64?`,
      );
    }

    return fetch(this.urlFor("/data"), { method: "PUT", body: content });
  }

  async get(userId) {
    return fetch(this.urlFor(`/data/${userId}`));
  }

  async getMyData() {
    const headers = { "Content-Type": "application/json" };
    const response = await fetch(this.urlFor("/me"), { headers });
    if (!response.ok) throw new Error("Request failed: " + response.status);
    return response.json();
  }

  async getUsers() {
    const headers = { "Content-Type": "application/json" };
    const response = await fetch(this.urlFor("/users"), { headers });
    if (!response.ok) throw new Error("Request failed: " + response.status);
    return response.json();
  }

  async share(recipients) {
    const data = {
      from: this.userId,
      to: recipients,
    };
    const headers = { "Content-Type": "application/json" };
    const response = await fetch(this.urlFor("/share"), {
      headers,
      body: JSON.stringify(data),
      method: "POST",
    });
    if (!response.ok) throw new Error("Request failed: " + response.status);
  }
}
