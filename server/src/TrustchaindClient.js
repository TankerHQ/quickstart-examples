const fetch = require('node-fetch');

class TrustchaindClient {
  constructor({ trustchaindUrl, appId, authToken }) {
    this.appId = appId;
    this.authToken = authToken;
    this.trustchaindUrl = trustchaindUrl;
  }

  async sendVerification({ email_data }) {
    const body = {
      auth_token: this.authToken,
      app_id: this.appId,
      email_data,
    };
    const response = await fetch(
      `${this.trustchaindUrl}/verification/email`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
    return response;
  }
}

module.exports = {
  TrustchaindClient,
};
