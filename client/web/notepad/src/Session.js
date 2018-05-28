//@flow
import EventEmitter from "events";
import Tanker, { toBase64, fromBase64, getResourceId } from "@tanker/core";
import ServerApi from "./ServerApi";
import { trustchainId } from "./config";

export default class Session extends EventEmitter {
  serverApi: ServerApi;
  tanker: Tanker;
  resourceId: ?string;
  +userId: string;
  +password: string;

  constructor() {
    super();
    this.serverApi = new ServerApi();
    this.tanker = new Tanker({ trustchainId });
    this.tanker.on("waitingForValidation", () => this.emit("newDevice"));
    this.resourceId = null;
  }

  get userId(): string {
    return this.serverApi.userId;
  }

  get password(): string {
    return this.serverApi.password;
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
    this.serverApi.setUserInfo(userId, password);
    const response = await this.serverApi.signUp();

    if (response.status === 409) throw new Error(`User '${userId}' already exists`);
    if (!response.ok) throw new Error("Server error!");

    const userToken = await response.text();
    return this.openSession(userId, userToken);
  }

  async signIn(userId: string, password: string): Promise<void> {
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

  async getUnlockKey(): Promise<string> {
    return this.tanker.generateAndRegisterUnlockKey();
  }

  async addCurrentDevice(unlockKey: string): Promise<void> {
    return this.tanker.unlockCurrentDevice(unlockKey);
  }

  async saveText(text: string) {
    const recipients = await this.getNoteRecipients();
    const encryptedData = await this.tanker.encrypt(text, { shareWith: recipients });
    const encryptedText = toBase64(encryptedData);
    this.resourceId = getResourceId(encryptedData);
    await this.serverApi.push(toBase64(encryptedText));
  }

  async loadText(): Promise<string> {
    return this.loadTextFromUser(this.userId);
  }

  async loadTextFromUser(userId: string) {
    const response = await this.serverApi.get(userId);

    if (response.status === 404) return "";

    const encryptedText = await response.text();
    const encryptedData = fromBase64(encryptedText);
    return this.tanker.decrypt(encryptedData);
  }

  async getAccessibleNotes(): Promise<Array<string>> {
    return (await this.serverApi.getMyData()).accessibleNotes || [];
  }

  async getNoteRecipients(): Promise<Array<string>> {
    return (await this.serverApi.getMyData()).noteRecipients || [];
  }

  async getUsers() {
    return this.serverApi.getUsers();
  }

  async share(recipients: string[]) {
    if (!this.resourceId) throw new Error("No resource id.");
    await this.tanker.share([this.resourceId], recipients);
    await this.serverApi.share(recipients);
  }

  async delete() {
    return this.serverApi.delete();
  }
}
