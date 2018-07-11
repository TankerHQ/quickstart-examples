import EventEmitter from "events";
import Tanker, { toBase64, fromBase64, getResourceId } from "@tanker/client-browser";
import ServerApi from "./ServerApi";

export default class Session extends EventEmitter {

  constructor() {
    super();
    this.resourceId = null;
    this.serverApi = new ServerApi();
    // FIXME: get rid of this.opened
    this.opened = false;
  }

  async initTanker() {
    if (this.tanker) return;
    const config = await this.serverApi.tankerConfig();
    // FIXME: construct this.tanker
    // FIXME: handle waitingForValidation event
  }

  get userId() {
    return this.serverApi.userId;
  }

  get password() {
    return this.serverApi.password;
  }

  isOpen() {
    // FIXME: check if tanker session is opened
    return this.opened;
  }

  async close() {
    // FIXME: close tanker session
    this.opened = false;
  }

  async openSession(userId, userToken) {
    // FIXME: open tanker session
    this.opened = true;
  }

  async signUp(userId, password) {
    await this.initTanker();

    this.serverApi.setUserInfo(userId, password);
    const response = await this.serverApi.signUp();

    if (response.status === 409) throw new Error(`User '${userId}' already exists`);
    if (!response.ok) throw new Error("Server error!");

    const userToken = await response.text();
    await this.openSession(userId, userToken);
    // FIXME: setup the password to unlock additional devices
  }

  async signIn(userId, password) {
    await this.initTanker();

    this.serverApi.setUserInfo(userId, password);
    let response;
    try {
      response = await this.serverApi.login();
    } catch (e) {
      console.error(e);
      throw new Error("Cannot contact server");
    }

    if (response.status === 404) throw new Error("User never registered");
    if (response.status === 401) throw new Error("Bad login or password");
    if (!response.ok) throw new Error("Unexpected error status: " + response.status);

    const userToken = await response.text();
    await this.openSession(userId, userToken);
  }

  async unlockCurrentDevice(password) {
    // FIXME: unlock current device using the password
  }

  async saveText(text) {
    const recipients = await this.getNoteRecipients();
    // FIXME: encrypt text
    // FIXME: update this.resourceId
    // FIXME: push encrypted text, base64-endoced
    await this.serverApi.push(text);
  }

  async loadTextFromUser(userId) {
    const response = await this.serverApi.get(userId);

    if (response.status === 404) return "";

    const data = await response.text();
    // FIXME: decrypt data
    // FIXME: return text from base64-encoded data
    return data;
  }

  async getAccessibleNotes() {
    return (await this.serverApi.getMyData()).accessibleNotes || [];
  }

  async getNoteRecipients() {
    return (await this.serverApi.getMyData()).noteRecipients || [];
  }

  async getUsers() {
    return this.serverApi.getUsers();
  }

  async share(recipients) {
    // FIXME: remove this line
    this.resourceId = this.userId;
    if (!this.resourceId) throw new Error("No resource id.");
    // FIXME: share [this.resourceId] with the recipients
    await this.serverApi.share(recipients);
  }

  async delete() {
    return this.serverApi.delete();
  }
}
