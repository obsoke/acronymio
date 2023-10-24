import type { ServerMessages } from './message.ts';

export class Player {
  #id: string;
  #socket: WebSocket;
  #hostname: string;
  #name: string;
  #submission: string = '';
  #votedFor: string = '';

  constructor(socket: WebSocket, hostname: string, uuid: string) {
    this.#socket = socket;
    this.#name = '';
    this.#hostname = hostname;
    this.#id = uuid;
  }

  getId(): string {
    return this.#id;
  }

  sendMessage(message: ServerMessages) {
    this.#socket.send(JSON.stringify(message));
  }

  setSubmission(submission: string) {
    this.#submission = submission;
  }

  getSubmission(): string {
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

  setVote(voteId: string) {
    this.#votedFor = voteId;
  }

  getVote(): string {
    return this.#votedFor;
  }

  hasVoted(): boolean {
    return !!this.#votedFor;
  }
}
