import EventEmitter from "events";
import Tanker, { toBase64, fromBase64, getResourceId } from "@tanker/client-browser";
import ServerApi from "./ServerApi";

const STATUSES = [
  "initializing",
  "closed",
  "open",
  "openingNewDevice"
];

export default class Session extends EventEmitter {
  constructor() {
    super();

    this.resourceId = null;
    this.verificationCode = null;

    this.serverApi = new ServerApi();

    this._status = "initializing";
    this.init();
  }

  async init() {
    await this.initTanker();

    // If existing session found (e.g. page reload), open Tanker now
    try {
      const user = await this.serverApi.getMe();
      await this.tanker.open(user.id, user.token);
      this.status = "open";
    } catch (e) {
      this.status = "closed";
    }
  }

  async initTanker() {
    if (this.tanker) return;
    const config = await this.serverApi.tankerConfig();
    this.tanker = new Tanker(config);
    this.tanker.on("unlockRequired", () => {
      if (this.verificationCode) {
        this.tanker.unlockCurrentDevice({ verificationCode: this.verificationCode });
        // prevent re-use
        this.verificationCode = null;
      } else {
        this.status = "openingNewDevice";
      }
    });
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

  get email() {
    return this.serverApi.email;
  }

  get userId() {
    return this.serverApi.userId;
  }

  async close() {
    await this.serverApi.logout();
    await this.tanker.close();
    this.status = "closed";
  }

  async signUp(email, password) {
    const response = await this.serverApi.signUp(email, password);

    if (response.status === 409) throw new Error(`Email '${email}' already taken`);
    if (!response.ok) throw new Error("Server error!");

    const user = await response.json();

    await this.tanker.open(user.id, user.token);
    await this.tanker.setupUnlock({ password, email });

    this.status = "open";
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

    const user = await response.json();

    await this.tanker.open(user.id, user.token);

    this.status = "open";
  }

  async unlockCurrentDevice(password) {
    await this.tanker.unlockCurrentDevice({ password });
  }

  async saveText(text) {
    const recipients = await this.getNoteRecipients();
    const recipientIds = recipients.map(user => user.id);
    const encryptedData = await this.tanker.encrypt(text, { shareWith: recipientIds });
    const encryptedText = toBase64(encryptedData);
    this.resourceId = getResourceId(encryptedData);
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
    return (await this.serverApi.getMe()).accessibleNotes;
  }

  async getNoteRecipients() {
    return (await this.serverApi.getMe()).noteRecipients;
  }

  getUsers() {
    return this.serverApi.getUsers();
  }

  async share(recipients) {
    if (!this.resourceId) throw new Error("No resource id.");
    await this.tanker.share([this.resourceId], recipients);
    await this.serverApi.share(this.userId, recipients);
  }

  delete() {
    return this.serverApi.delete();
  }

  async changeEmail(newEmail) {
    await this.serverApi.changeEmail(newEmail);
    await this.tanker.updateUnlock({ email: newEmail });
  }

  async changePassword(oldPassword, newPassword) {
    await this.serverApi.changePassword(oldPassword, newPassword);
    await this.tanker.updateUnlock({ password: newPassword });
  }

  async resetPassword(newPassword, passwordResetToken, verificationCode) {
    const answer = await this.serverApi.resetPassword(newPassword, passwordResetToken);
    const jsonResponse = await answer.json();
    const { email } = jsonResponse;
    this.verificationCode = verificationCode;
    await this.logIn(email, newPassword);
    await this.tanker.updateUnlock({ password: newPassword });
  }
}
