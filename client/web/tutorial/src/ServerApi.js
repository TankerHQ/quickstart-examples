const appServerUrl = "http://localhost:8080";

export default class Api {
  get email() {
    return this._email;
  }

  get password() {
    return this._password;
  }

  setUserInfo(email, password) {
    this._email = email;
    this._password = password;
  }

  urlFor(path) {
    let queryString = '';
    if (this.email) {
      const escapedEmail = encodeURIComponent(this.email);
      const escapedPassword = encodeURIComponent(this.password);
      queryString = `?email=${escapedEmail}&password=${escapedPassword}`;
    }
    return `${appServerUrl}${path}${queryString}`;
  }

  async doRequest(path, fetchOpts) {
    const response = await this.doRequestUnchecked(path, fetchOpts);
    if (!response.ok) {
      await this.onFailedRequest(response);
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

  async tankerConfig() {
    const res = await this.doRequest("/config");
    return res.json();
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

  async getUserData(userId) {
    // this is allowed to return 404
    const response = await this.doRequestUnchecked(`/data/${userId}`);
    if (response.ok || response.status === 404) {
      return response;
    } else {
      // but anything else is an error:
      this.onFailedRequest(response);
    }
  }

  async getMe() {
    const response = await this.doRequest("/me");
    return response.json();
  }

  async getUsers() {
    const response = await this.doRequest("/users");
    return response.json();
  }

  async share(from, recipients) {
    const data = {
      from,
      to: recipients,
    };
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify(data);
    await this.doRequest("/share", { headers, body, method: "POST" });
  }

  async changeEmail(newEmail) {
    const data = { email: newEmail };
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify(data);
    await this.doRequest("/me/email", { headers, body, method: "PUT" });
    this._email = newEmail;
  }

  async changePassword(oldPassword, newPassword) {
    const data = { oldPassword, newPassword };
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify(data);
    await this.doRequest("/me/password", { headers, body, method: "PUT" });
    this._password = newPassword;
  }
}
