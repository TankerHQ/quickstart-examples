class FakeApiClient {
  constructor() {
    this.sentBody = null;
  }

  async sendVerification(body) {
    this.sentBody = body;
    return { ok: true };
  }
}

module.exports = {
  FakeApiClient,
};
