const fetch = require('node-fetch');

class TrustchaindClient {
  constructor({ trustchaindUrl, trustchainId, authToken }) {
    this.trustchainId = trustchainId;
    this.authToken = authToken;
    this.trustchaindUrl = trustchaindUrl;
  }

  async sendVerification({ userId, email }) {
    const body = {
      user_id: userId,
      trustchain_id: this.trustchainId,
      email,
      auth: {
        token: this.authToken,
      },
    };
    const response = await fetch(
      `${this.trustchaindUrl}/unlock/sendVerification`,
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
