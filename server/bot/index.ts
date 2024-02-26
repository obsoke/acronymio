import { parseArgs } from 'https://deno.land/std@0.215.0/cli/parse_args.ts';
import { Manager } from './manager.ts';

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

  const manager = new Manager(count);
  manager.process();
}
