//@flow
import EventEmitter from "events";
import Tanker, { toBase64, fromBase64, getResourceId } from "@tanker/core";
import Api from "./Api";
import { trustchainId } from "./config";

export default class Session extends EventEmitter {
  api: Api;
  tanker: Tanker;
  +userId: string;
  +password: string;

  constructor() {
    super();
    this.api = new Api();
    this.tanker = new Tanker({ trustchainId });
    this.tanker.on("waitingForValidation", () => this.emit("newDevice"));
  }

  get userId(): string {
    return this.api.userId;
  }

  get password(): string {
    return this.api.password;
  }

  isOpen(): boolean {
    return this.tanker.status === this.tanker.OPEN;
  }

  async close(): Promise<void> {
    await this.tanker.close();
  }

  async openSession(userId: string, userToken: string) {
    await this.tanker.open(userId, userToken);
  }

  async signUp(userId: string, password: string): Promise<void> {
    this.api.setUserInfo(userId, password);
    const response = await this.api.signUp();

    if (response.status === 409) throw new Error(`User '${userId}' already exists`);
    if (!response.ok) throw new Error("Server error!");

    const userToken = await response.text();
    return this.openSession(userId, userToken);
  }

  async signIn(userId: string, password: string): Promise<void> {
    this.api.setUserInfo(userId, password);
    let response;
    try {
      response = await this.api.login();
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

  async addCurrentDevice(unlockKey: string): Promise<void> {
    return this.tanker.unlockCurrentDevice(unlockKey);
  }

  async getUnlockKey(): Promise<string> {
    return this.tanker.generateAndRegisterUnlockKey();
  }

  async saveText(text: string) {
    const recipients = await this.getNoteRecipients();
    const eData = await this.tanker.encrypt(text, { shareWith: recipients });
    await this.api.push(toBase64(eData));
  }

  async loadText(): Promise<string> {
    return this.loadTextFromUser(this.userId);
  }

  async loadTextFromUser(userId: string) {
    const response = await this.api.get(userId);

    if (response.status === 404) return "";

    const data = await response.text();
    const clear = await this.tanker.decrypt(fromBase64(data));
    return clear;
  }

  async getResourceId() {
    const response = await this.api.get(this.userId);

    if (response.status === 404) return null;

    const data = await response.text();
    const resourceId = getResourceId(fromBase64(data));
    return resourceId;
  }

  async getAccessibleNotes(): Promise<Array<string>> {
    return (await this.api.getMyData()).accessibleNotes || [];
  }

  async getNoteRecipients(): Promise<Array<string>> {
    return (await this.api.getMyData()).noteRecipients || [];
  }

  async getUsers() {
    return this.api.getUsers();
  }

  async share(recipients: string[]) {
    const resourceId = await this.getResourceId();
    if (!resourceId) throw new Error("No resource id.");
    await this.tanker.share([resourceId], recipients);
    await this.api.share(recipients);
  }
}
