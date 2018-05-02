//@flow
import EventEmitter from 'events';
import Tanker, { toBase64, fromBase64 } from '@tanker/core';
import Api from './Api';
import { trustchainId } from './config';

export default class Session extends EventEmitter {
  api: Api;
  tanker: Tanker;
  +userId: string;
  +password: string;

  constructor() {
    super();
    this.api = new Api();
    this.tanker = new Tanker({ trustchainId });
  }

  get userId(): string {
    return this.api.userId;
  }

  get password(): string {
    return this.api.password;
  }

  isOpen(): bool {
    return this.tanker.status === this.tanker.OPEN;
  }

  async close(): Promise<void> {
    await this.tanker.close();
  }

  async create(userId: string, password: string): Promise<void> {
    this.api.setUserInfo(userId, password);
    const response = await this.api.signUp();

    if (response.status === 409)
      throw new Error(`User '${userId}' already exists`);
    if (response.status !== 200)
      throw new Error('Server error!');

    const userToken = await response.text();
    return this.tanker.open(userId, userToken);
  }

  async login(userId: string, password: string): Promise<void> {
    this.api.setUserInfo(userId, password);
    this.tanker.once('waitingForValidation', () => this.emit('newDevice'));
    let response;
    try {
      response = await this.api.login();
    } catch (e) {
      console.error(e);
      throw new Error('Cannot contact server');
    }

    if (response.status === 404)
      throw new Error('User never registered');
    if (response.status === 401)
      throw new Error('Bad login or password');
    if (response.status !== 200)
      throw new Error('It Borked!');

    const userToken = await response.text();
    await this.tanker.open(userId, userToken);
  }

  async addCurrentDevice(unlockKey: string): Promise<void> {
    return this.tanker.unlockCurrentDevice(unlockKey);
  }

  async getUnlockKey(): Promise<string> {
    return this.tanker.generateAndRegisterUnlockKey();
  }

  async saveText(content: string): Promise<void> {
    const eData = await this.tanker.encrypt(content);
    this.api.push(toBase64(eData));
  }

  async loadText(): Promise<string> {
    const data = await this.api.get();
    if (!data || data === '')
      throw new Error('No message stored yet');

    return this.tanker.decrypt(fromBase64(data));
  }
}
