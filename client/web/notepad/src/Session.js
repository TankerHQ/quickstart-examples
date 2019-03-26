import EventEmitter from "events";
import { Tanker, toBase64, fromBase64 } from "@tanker/client-browser";
import ServerApi from "./ServerApi";

const STATUSES = [
  "initializing",
  "closed",
  "open",
  "verify",
];

// TODO: get from "@tanker/client-browser";
const SIGN_IN_RESULT = Object.freeze({
  OK: 1,
  IDENTITY_VERIFICATION_NEEDED: 2,
  IDENTITY_NOT_REGISTERED: 3,
});

export default class Session extends EventEmitter {
  constructor() {
    super();

    this.resourceId = null;
    this._user = null;

    this.serverApi = new ServerApi();

    this._status = "initializing";
    this.init();
  }

  async init() {
    await this.initTanker();

    // If existing session found (e.g. page reload), open Tanker now
    try {
      if (!this.user) {
        await this.refreshMe();
      }
      if (this.user) {
        const result = await this.tanker.signIn(this.user.identity);
        if (result !== SIGN_IN_RESULT.OK)
          throw new Error('AssertionError session mismatch');
        this.status = this.user.provisionalIdentity ? "verify" : "open";
        return;
      }
    } catch (e) {
      console.error(e);
    }
    this.status = "closed";
  }

  async initTanker() {
    if (this.tanker) return;
    const config = await this.serverApi.tankerConfig();
    this.tanker = new Tanker(config);
  }

  get status() {
    return this._status;
  }

  set status(newStatus) {
    if (STATUSES.indexOf(newStatus) === -1) { throw new Error(`Invalid status: ${newStatus}`)}
    const prevStatus = this._status;
    this._status = newStatus;
    this.emit("statusChange", [prevStatus, newStatus]);
  }

  get user() {
    return this._user;
  }

  async close() {
    await this.serverApi.logout();
    await this.tanker.signOut();
    this._user = null;
    this.status = "closed";
  }

  async signUp(email, password) {
    const response = await this.serverApi.signUp(email, password);

    if (response.status === 409) throw new Error(`Email '${email}' already taken`);
    if (!response.ok) throw new Error("Server error!");

    this._user = await response.json();
    await this.tanker.signUp(this.user.identity, { password, email });

    this.status = this.user.provisionalIdentity ? "verify" : "open";
  }

  async logIn(email, password) {
    let response;
    try {
      response = await this.serverApi.login(email, password);
    } catch (e) {
      console.error(e);
      throw new Error("Cannot contact server");
    }


    if (response.status === 404) throw new Error("User never registered");
    if (response.status === 401) throw new Error("Bad login or password");
    if (!response.ok) throw new Error("Unexpected error status: " + response.status);

    this._user = await response.json();
    await this.tanker.signIn(this.user.identity, { password });

    this.status = this.user.provisionalIdentity ? "verify" : "open";
  }

  async saveText(text) {
    const recipients = await this.getNoteRecipients();
    const recipientPublicIdentities = recipients.map(user => user.publicIdentity);
    const encryptedData = await this.tanker.encrypt(text, { shareWithUsers: recipientPublicIdentities });
    const encryptedText = toBase64(encryptedData);
    this.resourceId = await this.tanker.getResourceId(encryptedData);
    await this.serverApi.push(encryptedText);
  }

  async loadTextFromUser(userId) {
    const response = await this.serverApi.getUserData(userId);

    if (response.status === 404) return "";

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
    if (!this.resourceId) throw new Error("No resource id.");
    const recipients = await this.serverApi.getUsersByEmail(recipientEmails);
    await this.tanker.share([this.resourceId], { shareWithUsers: recipients.map(r => r.publicIdentity) });
    await this.serverApi.share(this.user.id, recipients.map(r => r.id));
    await this.refreshMe();
  }

  delete() {
    return this.serverApi.delete();
  }

  async changeEmail(newEmail) {
    await this.serverApi.changeEmail(newEmail);
    await this.tanker.registerUnlock({ email: newEmail });
    await this.refreshMe();
  }

  async changePassword(oldPassword, newPassword) {
    await this.serverApi.changePassword(oldPassword, newPassword);
    await this.tanker.registerUnlock({ password: newPassword });
  }

  async resetPassword(newPassword, passwordResetToken, verificationCode) {
    const response = await this.serverApi.resetPassword(newPassword, passwordResetToken);
    const { email, identity } = await response.json();
    await this.tanker.signIn(identity, { verificationCode });
    await this.tanker.registerUnlock({ password: newPassword });
    await this.tanker.signOut();
    await this.logIn(email, newPassword);
  }

  async claim(verificationCode) {
    await this.tanker.claimProvisionalIdentity(this.user.provisionalIdentity, verificationCode);
    await this.serverApi.claimed();
    await this.refreshMe();
    this.status = "open";
  }
}
