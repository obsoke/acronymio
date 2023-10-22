import type { ServerMessages } from './message.ts';

export class Player {
  #id = crypto.randomUUID();
  #socket: WebSocket;
  #hostname: string;
  #name: string;
  #submission: string[] = [];
  #votedFor: string = '';

  constructor(socket: WebSocket, hostname: string) {
    this.#socket = socket;
    this.#name = '';
    this.#hostname = hostname;
  }

  sendMessage(message: ServerMessages) {
    this.#socket.send(JSON.stringify(message));
  }

  setSubmission(submission: string[]) {
    this.#submission = submission;
  }

  getSubmission(): string[] {
    return this.#submission;
  }

  getHostname(): string {
    return this.#hostname;
  }

  setName(name: string) {
    this.#name = name;
  }

  getName(): string {
    return this.#name;
  }

  isReadyToPlay(): boolean {
    return !!this.#name;
  }

  hasVoted(): boolean {
    return !!this.#votedFor;
  }
}
