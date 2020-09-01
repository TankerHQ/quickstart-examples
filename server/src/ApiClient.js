const fetch = require('node-fetch');

class ApiClient {
  constructor({ apiUrl, appId, authToken }) {
    this.appId = appId.replace(/\+/, '-').replace(/\//, '_').replace(/=+$/, '');
    this.authToken = authToken;
    this.apiUrl = apiUrl;
  }

  async sendVerification(body) {
    const response = await fetch(
      `${this.apiUrl}/v2/apps/${this.appId}/verification/email`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response;
  }
}

module.exports = {
  ApiClient,
};
