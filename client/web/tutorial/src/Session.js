//@flow
import EventEmitter from "events";
import Tanker, { toBase64, fromBase64, getResourceId } from "@tanker/core";
import ServerApi from "./ServerApi";
import { trustchainId } from "./config";

export default class Session extends EventEmitter {
  serverApi: ServerApi;
  tanker: Tanker;
  resourceId: ?string;
  opened: bool;
  +userId: string;
  +password: string;

  constructor() {
    super();
    this.serverApi = new ServerApi();
    this.opened = false;
    this.resourceId = null;
  }

  get userId(): string {
    return this.serverApi.userId;
  }

  get password(): string {
    return this.serverApi.password;
  }

  isOpen(): boolean {
    return this.opened;
  }

  async close(): Promise<void> {
    this.opened = false;
  }

  async openSession(userId: string, userToken: string) {
    this.opened = true;
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

  async addCurrentDevice(unlockKey: string): Promise<void> {

  }

  async getUnlockKey(): Promise<string> {
  }

  async saveText(text: string) {
    const recipients = await this.getNoteRecipients();
    await this.serverApi.push(text);
  }

  async loadText(): Promise<string> {
    return this.loadTextFromUser(this.userId);
  }

  async loadTextFromUser(userId: string) {
    const response = await this.serverApi.get(userId);

    if (response.status === 404) return "";

    const data = await response.text();
    return data;
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
    this.resourceId = this.userId;
    if (!this.resourceId) throw new Error("No resource id.");
    await this.serverApi.share(recipients);
  }

  async delete() {
    return this.serverApi.delete();
  }
}
