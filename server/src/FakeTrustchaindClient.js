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
  FakeTrustchaindClient,
};
