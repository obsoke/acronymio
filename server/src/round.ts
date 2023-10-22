import { Player } from './player.ts';
import { ServerBeginGameMessage, ServerUpdateTimerMessage } from './message.ts';

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
export type GameState = 'waiting' | 'acronym' | 'voting' | 'gameover';

// Game constants
const NUM_READY_PLAYERS = 1; // NOTE: This is set to 1 for testing; should be 3 in prod
const ACRO_ROUND_TIME = 60; // seconds
const VOTE_ROUND_TIME = 60; // seconds

/**
 * A `Round` is a single game of Acronymio. It holds all data requires to run the game,
 * transitions between states and deals with messages from/to players.
 */
export class Round {
  #state: GameState = 'waiting';
  #players: Player[] = [];

  #roundTimer = 0;
  #roundTime = 0;

  getCurrentState(): GameState {
    return this.#state;
  }

  resetRound() {
    this.#state = 'waiting';
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
    return this.#players.filter((p) => p.isReadyToPlay()).map((p) =>
      p.getName()
    );
  }

  checkForReadyGame(readyPlayerThreshold: number): boolean {
    const readyPlayerCount = this.#players.reduce(
      (prev, curr) => curr.isReadyToPlay() ? prev + 1 : prev,
      0,
    );

    return readyPlayerCount >= readyPlayerThreshold;
  }

  beginRound() {
    // TODO: Generate acronym
    const acronym = ['A', 'B'];

    for (const player of this.#players) {
      const msg: ServerBeginGameMessage = {
        type: 'gameStart',
        acronym,
        timeLeft: ACRO_ROUND_TIME,
      };

      player.sendMessage(msg);
    }

    this.#roundTime = ACRO_ROUND_TIME;
    this.#roundTimer = setInterval(() => {
      this.#roundTime -= 1;

      for (const player of this.#players) {
        const msg: ServerUpdateTimerMessage = {
          type: 'updateTimer',
          time: this.#roundTime,
        };

        player.sendMessage(msg);
      }
    }, 1000);
    this.#state = 'acronym';
  }

  beginVoting() {
    this.#state = 'voting';
  }

  findWinner() {
    // TODO: Find the winner
  }

  gameLoop() {
    switch (this.getCurrentState()) {
      case 'waiting':
        // DEBUG OUTPUT
        console.log(`Currently connected players: ${this.getPlayerCount()}`);
        for (const player of this.getReadyPlayerNames()) {
          console.log(player);
        }
        // DEBUG OUTPUT

        if (this.checkForReadyGame(NUM_READY_PLAYERS)) {
          this.beginRound();
        }
        break;
      case 'acronym': {
        const receivedAllEntries = this.#players.every((p) =>
          p.getSubmission().length > 0
        );
        if (receivedAllEntries) {
          clearInterval(this.#roundTimer);
          this.beginVoting();
        }
        break;
      }
      case 'voting': {
        const receivedAllVotes = this.#players.every((p) => p.hasVoted());
        if (receivedAllVotes) {
          clearInterval(this.#roundTimer);
          this.findWinner();
        }
        break;
      }
      case 'gameover':
        // Nothing to do in this state!
        // TODO: Shutdown room/game
        break;
      default:
        break;
    }
  }
}
