import { AcroBot, type BotState } from './bot.ts';

type ManagerState = Exclude<BotState, 'setName'>;

export class Manager {
  #state: ManagerState = 'connecting';
  #bots: AcroBot[] = [];
  #startTime: Temporal.Instant;
  #updateInterval = 1000; // in ms

  constructor(botCount: number) {
    this.#startTime = Temporal.Now.instant();

    for (let i = 0; i < botCount; ++i) {
      const bot = new AcroBot();
      this.#bots.push(bot);
    }
  }

  process() {
    setInterval(() => {
      const areBotsDone = this.#bots.every((b) => b.getState() === 'done');
      if (areBotsDone) {
        console.log('[MANAGER!] Done!');
        Deno.exit(0);
      }
      switch (this.#state) {
        case 'connecting':
          // In the 'connecting' state, we are both waiting for the bots to connect
          // and waiting for their names to be set.
          const doneNames = this.#bots.every((b) => b.getState() === 'acronym');
          if (doneNames) {
            this.#changeState('acronym');
            // TODO: Start acronym phase
          }

          break;
        case 'acronym':
          // In the 'acronym' state, we wait for the bots to move to the voting phase
          const doneAcro = this.#bots.every((b) => b.getState() === 'vote');
          if (doneAcro) {
            this.#changeState('vote');
            // TODO: Start vote phase
          }

          break;
        default:
          break;
      }
    }, this.#updateInterval);
  }

  #changeState(nextState: ManagerState) {
    const since = Temporal.Now.instant().since(this.#startTime);
    console.log(
      `[MANAGER!] Moving to "${nextState}" phase (${
        since.toLocaleString('en-US', {
          day: 'numeric',
          hour: 'numeric',
        })
      })`,
    );

    this.#state = nextState;
  }
}
