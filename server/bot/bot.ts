import { rword } from 'npm:rword';
import {
  ClientMessages,
  ClientSetNameMessage,
  ServerMessages,
} from '../src/message.ts';
export type BotState = 'connecting' | 'setName' | 'acronym' | 'vote' | 'done';

// 1) Create a random interval between 0.5 and 3 seconds to act on each change
//   1.1) Provide an option to act instantly
// 2) On each state, do the expected thing:
//   2.1) `setName`: Come up with a random name
//   2.2) `acronym`: Generate a random answer for acronyms
//   2.3) `vote`: Vote for a random entry, provide an option to vote for me
export class AcroBot {
  #id: string = crypto.randomUUID().split('-')[0];
  #state: BotState = 'connecting';
  #socket: WebSocket;
  #actInternval: number;

  constructor() {
    this.#socket = new WebSocket('ws://localhost:8080');

    this.#socket.addEventListener('open', this.onConnect.bind(this));
    this.#socket.addEventListener('message', this.onMessage.bind(this));

    // Delay actions between 0.5 & 3.5 seconds
    this.#actInternval = Math.floor((0.5 + Math.random()) * 3.5);
  }

  onConnect() {
    this.#state = 'setName';
    this.setName();
  }

  act(msg: ClientMessages) {
    setTimeout(() => {
      this.sendMessage(msg);
    }, this.#actInternval);
  }

  sendMessage(msg: unknown) {
    const serialized = JSON.stringify(msg);
    this.#socket.send(serialized);
  }

  log(msg: string) {
    console.log(`[${this.#id}] ${msg}`);
  }

  getState() {
    return this.#state;
  }

  onMessage(msg: MessageEvent) {
    const resp: ServerMessages = JSON.parse(msg.data);
    switch (resp.type) {
      case 'setName':
        // When sending a `setName` requests succeeds
        this.#state = 'acronym';
        break;
      case 'gameStart':
        // Game begins in acronym round, expects a `submitAcronym` msg
        this.log(`Acronym received: ${resp.acronym.join(' ')}`);
        break;
      case 'entryReceived':
        // Acro submission submitted; waiting for next phase
        // TODO: Anything to do here?
        break;
      case 'beginVoting':
        // Voting round has begun
        this.#state = 'vote';
        this.log(`entries: ${JSON.stringify(resp.entries, null, 2)}`);
      case 'voteReceived':
        // The vote has been received; waiting for next phase
        // TODO: Anything to do here?
        break;
      case 'updateTimer':
        // We don't need to react to the server timer
        break;
      case 'winner':
        // A winner has been decided; effectively a game over.
        // TODO: Anything to do here?
        break;
      case 'gameover':
        //? Is this state really necessary to have? Or maybe it should be renamed?
        break;
      case 'disconnect':
        // The user has been disconnected from the game for a reason
        // TODO: Anything to do here?
        this.log(`disconnected because: ${resp.reason}`);
      case 'userKicked':
      // The user has been disqualified or kicked from the game
      //? How is this different from `disconnect`?
      default:
        this.log(`unkown msg received: ${resp.type}`);
        break;
    }
  }

  setName() {
    const name = rword.generate(1, { capitalize: 'first' });
    const msg: ClientSetNameMessage = {
      type: 'setName',
      name,
    };

    this.act(msg);
  }
}
