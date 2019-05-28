const appServerUrl = `http://${window.location.hostname}:8080`;

export default class Api {
  urlFor(path) {
    return `${appServerUrl}${path}`;
  }

  async doRequest(path, requestOpts = {}) {
    const response = await this.doRequestUnchecked(path, requestOpts);
    if (!response.ok) {
      await this.onFailedRequest(response);
    }
    return response;
  }

  async doRequestUnchecked(path, requestOpts = {}) {
    const { raw, json, ...fetchOpts } = requestOpts;

    fetchOpts.credentials = "include"; // cross-domain auth cookies

    if (raw)
      fetchOpts.body = raw;
    else if (json) {
      fetchOpts.body = JSON.stringify(json)
      fetchOpts.headers = { "Content-Type": "application/json" };
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

  authenticate(path, email, password) {
    return this.doRequestUnchecked(path, { method: "POST", json: { email, password } });
  }

  login(email, password) {
    return this.authenticate('/login', email, password);
  }

  signUp(email, password) {
    return this.authenticate('/signup', email, password);
  }

  async logout() {
    await this.doRequest("/logout");
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
    const me = await response.json();
    return me;
  }

  async getUsers() {
    const response = await this.doRequest("/users");
    return response.json();
  }

  async getUsersByEmail(emails) {
    const emailQuery = emails.map(email => `email[]=${encodeURIComponent(email)}`).join('&');
    const response = await this.doRequest(`/users?${emailQuery}`);
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
  }

  async changePassword(oldPassword, newPassword) {
    const data = { oldPassword, newPassword };
    await this.doRequest("/me/password", { json: data, method: "PUT" });
  }

  async resetPassword(newPassword, passwordResetToken) {
    const data = { passwordResetToken, newPassword };
    return this.doRequest("/resetPassword", { json: data, method: "POST" });
  }

  async requestResetPassword(email) {
    const data = { email };
    await this.doRequest("/requestResetPassword", { json: data, method: "POST" });
  }

  async requestResetVerificationCode(passwordResetToken) {
    const data = { passwordResetToken };
    await this.doRequest("/requestVerificationCode", { json: data, method: "POST" });
  }

  async requestVerificationCode(email = "") {
    await this.doRequest("/me/requestVerificationCode", { json: { email }, method: "POST" });
  }

  async claimed() {
    await this.doRequest("/me/claimed", { json: {}, method: "POST" });
  }
}
