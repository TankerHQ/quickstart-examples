import EventEmitter from 'events';
import { Tanker, toBase64, fromBase64 } from '@tanker/client-browser';
import ServerApi from './ServerApi';

const { READY, IDENTITY_REGISTRATION_NEEDED, IDENTITY_VERIFICATION_NEEDED } = Tanker.statuses;

const STATUSES = [
  'initializing',
  'closed',
  'open',
  'claim',
  'register',
  'verify',
];

export default class Session extends EventEmitter {
  constructor() {
    super();

    this.resourceId = null;
    this._user = null;

    this.serverApi = new ServerApi();

    this._status = 'initializing';
    this.init();
  }

  async init() {
    // If existing session found (e.g. page reload), open Tanker now
    try {
      if (!this.user) {
        await this.refreshMe();
      }
      if (this.user) {
        this.initTanker();
        return;
      }
    } catch (e) {
      console.error(e);
    }
    this.status = 'closed';
  }

  async initTanker() {
    if (!this.user) throw new Error('Assertion error: cannot start Tanker without a user');

    const config = await this.serverApi.tankerConfig();
    this.tanker = new Tanker(config);

    const result = await this.tanker.start(this.user.identity);

    if (result === READY) {
      await this.triggerClaimIfNeeded();
    } else if (result === IDENTITY_REGISTRATION_NEEDED) {
      this.status = 'register';
    } else if (result === IDENTITY_VERIFICATION_NEEDED) {
      this.status = 'verify';
    } else {
      throw new Error(`Unexpected status ${result}`);
    }
  }

  async triggerClaimIfNeeded() {
    if (!this.user.provisionalIdentity) {
      this.status = 'open';
      return;
    }

    const attachResult = await this.tanker.attachProvisionalIdentity(this.user.provisionalIdentity);

    if (attachResult.status === READY) {
      this.status = 'open';
    } else if (attachResult.status === IDENTITY_VERIFICATION_NEEDED) {
      this.status = 'claim';
    } else {
      throw new Error('Assertion error: invalid status of provisional identity attachement', attachResult.status);
    }
  }

  async claim(verificationCode) {
    await this.tanker.verifyProvisionalIdentity({ email: this.user.email, verificationCode });
    await this.serverApi.claimed();
    await this.refreshMe();
  }

  async handleVerificationCode(verificationCode) {
    if (this.status === 'register') {
      await this.tanker.registerIdentity({ email: this.user.email, verificationCode });
    } else if (this.status === 'verify') {
      await this.tanker.verifyIdentity({ email: this.user.email, verificationCode });
    } else if (this.status === 'claim') {
      await this.claim(verificationCode);
    } else {
      throw new Error('Assertion error: invalid status in handleVerificationCode');
    }

    await this.triggerClaimIfNeeded();
  }

  get status() {
    return this._status;
  }

  set status(newStatus) {
    if (STATUSES.indexOf(newStatus) === -1) { throw new Error(`Invalid status: ${newStatus}`); }
    const prevStatus = this._status;
    this._status = newStatus;
    this.emit('statusChange', [prevStatus, newStatus]);
  }

  get user() {
    return this._user;
  }

  async close() {
    await this.serverApi.logout();
    await this.tanker.stop();
    this._user = null;
    this.status = 'closed';
  }

  async signUp(email, password) {
    const response = await this.serverApi.signUp(email, password);

    if (response.status === 409) throw new Error(`Email '${email}' already taken`);
    if (!response.ok) throw new Error('Server error!');

    this._user = await response.json();

    await this.initTanker();
  }

  async logIn(email, password) {
    let response;
    try {
      response = await this.serverApi.login(email, password);
    } catch (e) {
      console.error(e);
      throw new Error('Cannot contact server');
    }

    if (response.status === 404) throw new Error('User never registered');
    if (response.status === 401) throw new Error('Bad login or password');
    if (!response.ok) throw new Error(`Unexpected error status: ${response.status}`);

    this._user = await response.json();

    await this.initTanker();
  }

  async saveText(text) {
    const recipients = await this.getNoteRecipients();
    const recipientPublicIdentities = recipients.map((user) => user.publicIdentity);
    const encryptedData = await this.tanker.encrypt(text, { shareWithUsers: recipientPublicIdentities });
    const encryptedText = toBase64(encryptedData);
    this.resourceId = await this.tanker.getResourceId(encryptedData);
    await this.serverApi.push(encryptedText);
  }

  async loadTextFromUser(userId) {
    const response = await this.serverApi.getUserData(userId);

    if (response.status === 404) return '';

    const encryptedText = await response.text();
    const encryptedData = fromBase64(encryptedText);
    const clear = await this.tanker.decrypt(encryptedData);
    return clear;
  }

  async getAccessibleNotes() {
    return this.user.accessibleNotes;
  }

  async getNoteRecipients() {
    return this.user.noteRecipients;
  }

  getUsers() {
    return this.serverApi.getUsers();
  }

  async refreshMe() {
    this._user = await this.serverApi.getMe();
  }

  async share(recipientEmails) {
    if (!this.resourceId) throw new Error('No resource id.');
    const recipients = await this.serverApi.getUsersByEmail(recipientEmails);
    await this.tanker.share([this.resourceId], { shareWithUsers: recipients.map((r) => r.publicIdentity) });
    await this.serverApi.share(this.user.id, recipients.map((r) => r.id));
    await this.refreshMe();
  }

  delete() {
    return this.serverApi.delete();
  }

  async changeEmail(newEmail, verificationCode) {
    await this.tanker.setVerificationMethod({ email: newEmail, verificationCode });
    await this.serverApi.changeEmail(newEmail);
    await this.refreshMe();
  }

  async changePassword(oldPassword, newPassword) {
    await this.serverApi.changePassword(oldPassword, newPassword);
  }

  async resetPassword(newPassword, passwordResetToken) {
    const response = await this.serverApi.resetPassword(newPassword, passwordResetToken);
    const { email } = await response.json();
    await this.logIn(email, newPassword);
  }
}
