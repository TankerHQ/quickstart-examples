const fetch = require('node-fetch');

class TrustchaindClient {
  constructor({ trustchaindUrl, trustchainId, authToken }) {
    this.trustchainId = trustchainId;
    this.authToken = authToken;
    this.trustchaindUrl = trustchaindUrl;
  }

  async sendVerification({ email_data }) {
    const body = {
      auth_token: this.authToken,
      trustchain_id: this.trustchainId,
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

class FakeTrustchaindClient {
  constructor() {
    this.sentRequest = null;
  }

  async sendVerification(request) {
    this.sentRequest = request;
    return { ok: true };
  }
}

module.exports = {
  TrustchaindClient,
  FakeTrustchaindClient,
};
