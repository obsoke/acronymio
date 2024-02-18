import { rword } from 'npm:rword';
import { parseArgs } from 'https://deno.land/std@0.215.0/cli/parse_args.ts';
import { ClientSetNameMessage, ServerMessages } from '../src/message.ts';

type BotState = 'connecting' | 'setName' | 'acronym' | 'vote' | 'done';

// TODO: AcroBot should connect to the WebSocket and:
// 1) Create a random interval between 0.5 and 3 seconds to act on each change
//   1.1) Provide an option to act instantly
// 2) On each state, do the expected thing:
//   2.1) `setName`: Come up with a random name
//   2.2) `acronym`: Generate a random answer for acronyms
//   2.3) `vote`: Vote for a random entry, provide an option to vote for me
class AcroBot {
  #id: string = crypto.randomUUID().split('-')[0];
  #state: BotState = 'connecting';
  #socket: WebSocket;

  constructor() {
    this.#socket = new WebSocket('ws://localhost:8080');

    this.#socket.addEventListener('open', this.onConnect.bind(this));
    this.#socket.addEventListener('message', this.onMessage.bind(this));
  }

  onConnect() {
    this.#state = 'setName';
    this.setName();
  }

  setName() {
    const name = 'Foo';
    const msg: ClientSetNameMessage = {
      type: 'setName',
      name,
    };

    this.sendMessage(msg);
  }

  getState() {
    return this.#state;
  }

  onMessage(msg: MessageEvent) {
    const resp: ServerMessages = JSON.parse(msg.data);
    switch (resp.type) {
      case 'setName':
        this.#state = 'acronym';
        break;
      case 'gameStart':
        this.log(`Acronym received: ${resp.acronym.join(' ')}`);
        break;
      case 'beginVoting':
        this.#state = 'vote';
        this.log(`entries: ${JSON.stringify(resp.entries, null, 2)}`);
      case 'updateTimer':
        // don't log
        break;
      default:
        this.log(`received msg ${resp.type}`);
        break;
    }
  }

  sendMessage(msg: unknown) {
    const serialized = JSON.stringify(msg);
    this.#socket.send(serialized);
  }

  log(msg: string) {
    console.log(`[${this.#id}] ${msg}`);
  }

  act() {
  }
}

if (import.meta.main) {
  main();
}

function main() {
  const args = parseArgs(Deno.args);
  if (!args.count) {
    console.error('--count=N flag required.');
    Deno.exit(1);
  }
  const { count } = args;
  console.info(`[MANAGER!] Starting up ${count} bots...`);

  const bots: AcroBot[] = [];
  let managerState: Exclude<BotState, 'setName'> = 'connecting';

  const start = Temporal.Now.instant();
  for (let i = 0; i < count; ++i) {
    const bot = new AcroBot();
    bots.push(bot);
  }

  // set up state processor to tick once per second
  setInterval(() => {
    if (managerState === 'connecting') {
      // In the 'connecting' state, we are both waiting for the bots to connect
      // and waiting for their names to be set.
      const doneNames = bots.every((b) => b.getState() === 'acronym');
      if (doneNames) {
        const since = Temporal.Now.instant().since(start);
        console.info(
          `[MANAGER!] Moving to "acronym" phase (${
            since.toLocaleString('en-US', {
              day: 'numeric',
              hour: 'numeric',
            })
          })`,
        );
        managerState = 'acronym';
        // TODO: Start acronym phase
      }
    } else if (managerState === 'acronym') {
      // In the 'acronym' state, we wait for the bots to move to the voting phase
      const doneAcro = bots.every((b) => b.getState() === 'vote');
      if (doneAcro) {
        const since = Temporal.Now.instant().since(start);
        console.info(
          `[MANAGER!] Moving to "vote" phase (${
            since.toLocaleString('en-US', {
              day: 'numeric',
              hour: 'numeric',
            })
          })`,
        );
        managerState = 'vote';
        // TODO: Start vote phase
      }
    }
  }, 1000);
}
