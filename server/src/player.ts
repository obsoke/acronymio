export class Player {
  #socket: WebSocket;
  #hostname: string;
  #name: string;
  #submission: string[] = [];

  constructor(socket: WebSocket, hostname: string) {
    this.#socket = socket;
    this.#name = '';
    this.#hostname = hostname;
  }

  sendMessage(message: string) {
    this.#socket.send(message);
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

  isReady(): boolean {
    return !!this.#name;
  }
}
