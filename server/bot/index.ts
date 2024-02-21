import { parseArgs } from 'https://deno.land/std@0.215.0/cli/parse_args.ts';
import { AcroBot, type BotState } from './bot.ts';

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
    switch (managerState) {
      case 'connecting':
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

        break;
      case 'acronym':
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

        break;
      default:
        break;
    }
  }, 1000);
}
