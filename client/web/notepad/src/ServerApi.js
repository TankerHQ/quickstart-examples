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

  async doRequest(path, fetchOpts) {
    const response = await this.doRequestUnchecked(path, fetchOpts);
    if (!response.ok) {
      this.onFailedRequest(response);
    }
    return response;
  }

  async doRequestUnchecked(path, fetchOpts) {
    const response = await fetch(this.urlFor(path), fetchOpts);
    return response;
  }

  async onFailedRequest(response) {
    const text = await response.text();
    throw new Error(`Request failed: (${response.status}): ${text}`);
  }

  signUp() {
    return this.doRequestUnchecked("/signup");
  }

  login() {
    return this.doRequestUnchecked("/login");
  }

  delete() {
    return this.doRequest("/data", { method: "DELETE" });
  }

  push(content) {
    if (typeof content !== "string") {
      throw new Error(
        `serverApi.push: expecting content as string, got: ${content}. Did you forget to call toBase64?`,
      );
    }

    return this.doRequest("/data", { method: "PUT", body: content });
  }

  async get(userId) {
    // this is allowed to return 404
    const response = await this.doRequestUnchecked(`/data/${userId}`);
    if (response.ok || response.status === 404) {
      return response;
    } else {
      // but anything else is an error:
      this.onFailedRequest(response);
    }
  }

  async getMyData() {
    const response = await this.doRequest("/me");
    return response.json();
  }

  async getUsers() {
    const response = await this.doRequest("/users");
    return response.json();
  }

  async share(recipients) {
    const data = {
      from: this.userId,
      to: recipients,
    };
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify(data);
    await this.doRequest("/share", { headers, body, method: "POST" });
  }
}
