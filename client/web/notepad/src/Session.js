import EventEmitter from "events";
import Tanker, { toBase64, fromBase64, getResourceId } from "@tanker/client-browser";
import ServerApi from "./ServerApi";

export default class Session extends EventEmitter {
  constructor() {
    super();
    this.resourceId = null;
    this.serverApi = new ServerApi();
  }

  async initTanker() {
    if (this.tanker) return;
    const config = await this.serverApi.tankerConfig();
    this.tanker = new Tanker(config);
    this.tanker.on("waitingForValidation", () => this.emit("newDevice"));
  }

  get userId() {
    return this.serverApi.userId;
  }

  get password() {
    return this.serverApi.password;
  }

  isOpen() {
    return this.tanker && this.tanker.isOpen();
  }

  async close() {
    await this.tanker.close();
  }

  async openSession(userId, userToken) {
    await this.tanker.open(userId, userToken);
  }

  async signUp(userId, password) {
    await this.initTanker();

    this.serverApi.setUserInfo(userId, password);
    const response = await this.serverApi.signUp();

    if (response.status === 409) throw new Error(`User '${userId}' already exists`);
    if (!response.ok) throw new Error("Server error!");

    const userToken = await response.text();
    return this.openSession(userId, userToken);
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

  async getUnlockKey() {
    return this.tanker.generateAndRegisterUnlockKey();
  }

  async addCurrentDevice(unlockKey) {
    return this.tanker.unlockCurrentDevice(unlockKey);
  }

  async saveText(text) {
    const recipients = await this.getNoteRecipients();
    const encryptedData = await this.tanker.encrypt(text, { shareWith: recipients });
    const encryptedText = toBase64(encryptedData);
    this.resourceId = getResourceId(encryptedData);
    await this.serverApi.push(encryptedText);
  }

  async loadTextFromUser(userId) {
    const response = await this.serverApi.get(userId);

    if (response.status === 404) return "";

    const encryptedText = await response.text();
    const encryptedData = fromBase64(encryptedText);
    const clear = await this.tanker.decrypt(encryptedData);
    return clear;
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
    if (!this.resourceId) throw new Error("No resource id.");
    await this.tanker.share([this.resourceId], recipients);
    await this.serverApi.share(recipients);
  }

  async delete() {
    return this.serverApi.delete();
  }
}
