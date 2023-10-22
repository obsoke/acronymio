import { Player } from './player.ts';

/*
 * What are the game states?
 *
 * waiting: waiting for N players before the game can begin. when all players are ready, we move to..
 *
 * acronym: generate acronym, send it to players and start a countdown. players then submit their entries.
 * WHEN: all entries have been received OR timer expires, we move to the next state:
 *
 * judging: the submitted acronyms are sent to the players and they vote on which they like the best. another time begins
 * WHEN: all judgements have been received OR timer expires, we move the final state:
 *
 * gameover: the winner is revealed, the game has concluded!
 */
export type State = 'waiting' | 'acronym' | 'judging' | 'gameover';

/**
 * A `Round` is a single game of Acronymio. It holds all data requires to run the game,
 * transitions between states and deals with messages from/to players.
 */
export class Round {
  #state: State = 'waiting';
  #players: Player[] = [];

  getCurrentState(): State {
    return this.#state;
  }

  addPlayer(player: Player) {
    this.#players.push(player);
  }

  removePlayer(playerHostname: string) {
    this.#players = this.#players.filter((p) =>
      p.getHostname() != playerHostname
    );
  }

  getPlayerCount(): number {
    return this.#players.length;
  }

  getReadyPlayerNames(): string[] {
    return this.#players.filter((p) => p.isReady()).map((p) => p.getName());
  }

  checkForReadyGame(readyPlayerThreshold: number): boolean {
    const readyPlayerCount = this.#players.reduce(
      (prev, curr) => curr.isReady() ? prev + 1 : prev,
      0,
    );

    return readyPlayerCount >= readyPlayerThreshold;
  }

  startGame() {
    // TODO: Generate acronym
    // TODO: Send acronym to all players
    this.#state = 'acronym';
  }
}
