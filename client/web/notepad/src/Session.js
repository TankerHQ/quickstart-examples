import EventEmitter from "events";
import Tanker, { toBase64, fromBase64, getResourceId } from "@tanker/client-browser";
import ServerApi from "./ServerApi";

export default class Session extends EventEmitter {
  constructor() {
    super();

    this.resourceId = null;
    this.userId = null;
    this.verificationCode = null;

    this.serverApi = new ServerApi();
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
        this.emit('newDevice');
      }
    });
  }

  get email() {
    return this.serverApi.email;
  }

  isOpen() {
    return this.tanker && this.tanker.isOpen();
  }

  async close() {
    this.userId = null;
    this.serverApi.setUserInfo(null, null);
    await this.tanker.close();
  }

  async openSession(userId, userToken) {
    await this.tanker.open(userId, userToken);
  }

  async signUp(email, password) {
    await this.initTanker();

    this.serverApi.setUserInfo(email, password);
    const response = await this.serverApi.signUp();

    if (response.status === 409) throw new Error(`Email '${email}' already taken`);
    if (!response.ok) throw new Error("Server error!");

    const user = await response.json();
    this.userId = user.id;

    await this.openSession(user.id, user.token);
    await this.tanker.setupUnlock({ password, email });
  }

  async logIn(email, password) {
    await this.initTanker();

    this.serverApi.setUserInfo(email, password);
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

    const user = await response.json();
    this.userId = user.id;

    await this.openSession(user.id, user.token);
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
}
