import { rword } from 'npm:rword';
import {
  ClientMessages,
  ClientSetNameMessage,
  ClientSubmitAcronymMessage,
  ClientVoteMessage,
  ServerMessages,
} from '../src/message.ts';
import type { Entry } from '../src/round.ts';
export type BotState = 'connecting' | 'setName' | 'acronym' | 'vote' | 'done';

export class AcroBot {
  #id: string = crypto.randomUUID().split('-')[0];
  #state: BotState = 'connecting';
  #socket: WebSocket;
  #actDelay: number;

  constructor() {
    this.#socket = new WebSocket('ws://localhost:8080');

    this.#socket.addEventListener('open', this.onConnect.bind(this));
    this.#socket.addEventListener('message', this.onMessage.bind(this));
    this.#socket.addEventListener('error', this.onSocketError.bind(this));

    // Delay actions between 0.5 & 3.5 seconds
    this.#actDelay = (0.5 + Math.random()) * 3.5;
    this.log(`interval: ${this.#actDelay}`);
  }

  onConnect() {
    this.#state = 'setName';
    this.setName();
  }

  onSocketError(event: Event) {
    this.#state = 'done';
    this.log('Socket error occured; shutting down bot.');
  }

  act(msg: ClientMessages) {
    setTimeout(() => {
      this.log(`ACTing with type ${msg.type}`);
      this.sendMessage(msg);
    }, this.#actDelay);
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
        // Game begins in acronym round, server expects a `submitAcronym` msg
        this.log(`Acronym received: ${resp.acronym.join(' ')}`);
        this.generateEntry(resp.acronym);
        break;
      case 'entryReceived':
        // Acro submission submitted; waiting for next phase
        this.log('Server received acronym submission.');
        break;
      case 'beginVoting':
        // Voting round has begun
        this.#state = 'vote';
        this.vote(resp.entries);
        break;
      case 'voteReceived':
        // The vote has been received; waiting for next phase
        // TODO: Anything to do here?
        break;
      case 'updateTimer':
        // We don't need to react to the server timer
        break;
      case 'winner':
      case 'gameover':
        //? Is this state really necessary to have? Or maybe it should be renamed?
        this.log(`Received game over: ${JSON.stringify(resp)}`);
        this.#state = 'done';
        this.#socket.close();
        break;
      case 'disconnect':
        // The user has been disconnected from the game for a reason
        this.#state = 'done';
        this.log(`disconnected because: ${resp.reason}`);
        break;
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

  generateEntry(acronym: string[]) {
    const results = [];
    for (const letter of acronym) {
      const entry = rword.generate(1, {
        contains: new RegExp(`^${letter}`, 'i'),
        capitalize: 'first',
      });
      results.push(entry);
    }

    const msg: ClientSubmitAcronymMessage = {
      type: 'submitAcronym',
      acronym: results,
    };

    this.act(msg);
  }

  vote(options: Entry[]) {
    const winnerIdx = Math.floor(Math.random() * options.length);
    const winner = options[winnerIdx];
    this.log(`Voting for ${JSON.stringify(winner)}`);
    const msg: ClientVoteMessage = {
      type: 'vote',
      userVotedFor: winner.uuid,
    };

    this.act(msg);
  }
}
