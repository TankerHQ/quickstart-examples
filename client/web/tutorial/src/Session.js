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
      // FIXME: open a tanker session
      this.status = "open";
    } catch (e) {
      this.status = "closed";
    }
  }

  async initTanker() {
    if (this.tanker) return;
    const config = await this.serverApi.tankerConfig();
    // FIXME: construct this.tanker
    // FIXME: handle the 'unlockRequired' event
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
    // FIXME: close tanker session
    this.status = "closed";
  }

  async signUp(email, password) {
    const response = await this.serverApi.signUp(email, password);

    if (response.status === 409) throw new Error(`Email '${email}' already taken`);
    if (!response.ok) throw new Error("Server error!");

    const user = await response.json();

    // FIXME: open a tanker session
    // FIXME: setup the email and password to unlock additional devices

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

    // FIXME: open a tanker session

    this.status = "open";
  }

  async unlockCurrentDevice(password) {
    // FIXME: unlock current device using the password
  }

  async saveText(text) {
    const recipients = await this.getNoteRecipients();
    const recipientIds = recipients.map(user => user.id);
    // FIXME: encrypt text
    // FIXME: update this.resourceId
    // FIXME: push encrypted text, base64-encoded
    await this.serverApi.push(text);
  }

  async loadTextFromUser(userId) {
    const response = await this.serverApi.getUserData(userId);

    if (response.status === 404) return "";

    const data = await response.text();
    // FIXME: decrypt data from base64-encoded response text
    return data;
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
    // FIXME: remove this line
    this.resourceId = this.userId;
    if (!this.resourceId) throw new Error("No resource id.");
    // FIXME: share [this.resourceId] with the recipients
    await this.serverApi.share(this.userId, recipients);
  }

  delete() {
    return this.serverApi.delete();
  }

  async changeEmail(newEmail) {
    await this.serverApi.changeEmail(newEmail);
    // FIXME: update the unlock email
  }

  async changePassword(oldPassword, newPassword) {
    await this.serverApi.changePassword(oldPassword, newPassword);
    // FIXME: update the unlock password
  }

  async resetPassword(newPassword, passwordResetToken, verificationCode) {
    const answer = await this.serverApi.resetPassword(newPassword, passwordResetToken);
    const jsonResponse = await answer.json();
    const { email } = jsonResponse;
    this.verificationCode = verificationCode;
    await this.logIn(email, newPassword);
    // FIXME: update the unlock password
  }
}
