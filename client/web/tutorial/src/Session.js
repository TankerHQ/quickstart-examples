//@flow
import EventEmitter from 'events';
import Tanker, { toBase64, fromBase64 } from '@tanker/core';
import Api from './Api';
import { trustchainId } from './config';

export default class Session extends EventEmitter {
  api: Api;
  // [[
  // FIXME: remove this attribute
  opened: bool;
  // ]]
  tanker: Tanker;
  +userId: string;
  +password: string;

  constructor() {
    super();
    this.api = new Api();
    // [[
    // FIXME: create a new tanker object with the trustchainId
    // this.tanker = ...;
    // ]]
    this.opened = false;
  }

  get userId(): string {
    return this.api.userId;
  }

  get password(): string {
    return this.api.password;
  }

  isOpen(): bool {
    // [[
    // FIXME: Check Tanker status
    return this.opened;
    // ]]
  }

  async close(): Promise<void> {
    // [[
    // FIXME: Close Tanker session
    this.opened = false;
    // ]]
  }

  async create(userId: string, password: string): Promise<void> {
    this.api.setUserInfo(userId, password);
    const response = await this.api.signUp();

    if (response.status === 409)
      throw new Error(`User '${userId}' already exists`);
    if (response.status !== 200)
      throw new Error('Server error!');

    const userToken = await response.text();
    // [[
    // FIXME: Open Tanker session with userId and userToken
    this.opened = true;
    await true ;
    // ]]
  }

  async login(userId: string, password: string): Promise<void> {
    this.api.setUserInfo(userId, password);
    // [[
    // FIXME: connect the waitingForValidation event of the Tanker session
    // to the 'newDevice' event of this class
    // ]]
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
    // [[
    // FIXME: Open Tanker session with userId and userToken
    this.opened = true;
    await true;
    // ]]
  }

  async addCurrentDevice(unlockKey: string): Promise<void> {
    // [[
    // FIXME: use tanker to unlock the current device with the key
    await true;
    // ]]
  }

  async getUnlockKey(): Promise<string> {
    // [[
    // FIXME: use tanker to generate and register a unlock key
    return 'this is the unlock key';
    // ]]
  }

  async saveText(content: string): Promise<void> {
    // [[
    // FIXME: use tanker to encrypt the text as binary data, then
    // encode the data and send it to the server
    const data = content;
    this.api.push(data);
    // ]]
  }

  async loadText(): Promise<string> {
    const response = await this.api.get();

    if (response.status === 404)
      return '';

    const data = await response.text();
    // [[
    // FIXME: use fromBase64 to get binary data from the
    // response of the server and use tanker to decrypt it.
    return data;
    // ]]
  }
}
