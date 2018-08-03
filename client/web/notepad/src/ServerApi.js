const appServerUrl = "http://127.0.0.1:8080";

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

  async doRequest(path, requestOpts) {
    const response = await this.doRequestUnchecked(path, requestOpts);
    if (!response.ok) {
      await this.onFailedRequest(response);
    }
    return response;
  }

  async doRequestUnchecked(path, requestOpts) {
    const fetchOpts = requestOpts;

    if (requestOpts) {
      const {raw , json} = requestOpts;

      if (raw)
        fetchOpts.body = raw;
      else if (json) {
        fetchOpts.body = JSON.stringify(json)
        fetchOpts.headers = { "Content-Type": "application/json" };
      }
    }

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

    return this.doRequest("/data", { method: "PUT", raw: content });
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
    await this.doRequest("/share", { json: data, method: "POST" });
  }

  async changeEmail(newEmail) {
    const data = { email: newEmail };
    await this.doRequest("/me/email", { json: data, method: "PUT" });
    this._email = newEmail;
  }

  async changePassword(oldPassword, newPassword) {
    const data = { oldPassword, newPassword };
    await this.doRequest("/me/password", { json: data, method: "PUT" });
    this._password = newPassword;
  }

  async resetPassword(passwordResetToken, newPassword) {
    const data = JSON.stringify({ passwordResetToken, newPassword });
    return this.doRequest("/resetPassword", { json: data, method: "POST" });
  }

  async requestResetPassword(email) {
    const data = { email };
    await this.doRequest("/requestResetPassword", { json: data, method: "POST" });
  }
}
