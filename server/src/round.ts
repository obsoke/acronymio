// import { maxBy } from '$std/collections/max_by.ts';
import { maxBy } from 'https://deno.land/std@0.204.0/collections/max_by.ts';
import { Player } from './player.ts';
import {
  ServerBeginGameMessage,
  ServerBeginVotingMessage,
  ServerUpdateTimerMessage,
  ServerWinnerMessage,
} from './message.ts';

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

export type Entry = { uuid: string; entry: string };

type Votes = Record<string, number>;

// Game constants
const NUM_READY_PLAYERS = 8; // NOTE: This is set to 1 for testing; should be 3 in prod
const ACRO_ROUND_TIME = 60; // seconds
const VOTE_ROUND_TIME = 30; // seconds

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

  removePlayer(playerId: string) {
    this.#players = this.#players.filter((p) => p.getId() != playerId);
  }

  getPlayerCount(): number {
    return this.#players.length;
  }

  getReadyPlayerNames(): string[] {
    return this.#players.filter((p) => p.isReadyToPlay()).map((p) =>
      p.getName()
    );
  }

  getAllEntries(): Entry[] {
    const entries: Entry[] = [];
    for (const player of this.#players) {
      entries.push({ uuid: player.getId(), entry: player.getSubmission() });
    }
    return entries;
  }

  checkForReadyGame(readyPlayerThreshold: number): boolean {
    const readyPlayerCount = this.#players.reduce(
      (prev, curr) => curr.isReadyToPlay() ? prev + 1 : prev,
      0,
    );

    return readyPlayerCount >= readyPlayerThreshold;
  }

  startTimer(initialTime: number) {
    this.#roundTime = initialTime;
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
  }

  beginRound() {
    // TODO: Generate acronym
    const acronym = ['S', 'E', 'B', 'T'];

    for (const player of this.#players) {
      const msg: ServerBeginGameMessage = {
        type: 'gameStart',
        acronym,
        timeLeft: ACRO_ROUND_TIME,
      };

      player.sendMessage(msg);
    }

    this.startTimer(ACRO_ROUND_TIME);
    this.#state = 'acronym';
  }

  beginVoting() {
    // We want to send all entries EXCEPT the one the user has submitted to each user
    const allEntries = this.getAllEntries();
    for (const player of this.#players) {
      const msg: ServerBeginVotingMessage = {
        type: 'beginVoting',
        entries: allEntries.filter((e) => e.uuid !== player.getId()),
        timeLeft: ACRO_ROUND_TIME,
      };

      player.sendMessage(msg);
    }

    this.startTimer(VOTE_ROUND_TIME);
    this.#state = 'voting';
  }

  findWinner() {
    const votes = this.#players.reduce((results, player) => {
      const id = player.getVote();
      if (!results[id]) {
        results[id] = 0;
      }

      results[id] += 1;

      return results;
    }, {} as Record<string, number>);

    const voteArray = Object.entries(votes);
    const winningEntry = maxBy(voteArray, (v) => v[1]);
    const winningPlayer = this.#players.find((p) =>
      p.getId() === winningEntry![0]
    );

    const msg: ServerWinnerMessage = {
      type: 'winner',
      winner: winningPlayer!.getName(),
    };

    for (const player of this.#players) {
      player.sendMessage(msg);
    }

    this.#state = 'gameover';
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
        // check if round is over via timer
        if (this.#roundTime <= 0) {
          clearInterval(this.#roundTimer);
          this.beginVoting();
        }

        // check if all entries are in
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
        // check if round is over via timer
        if (this.#roundTime <= 0) {
          clearInterval(this.#roundTimer);
          this.findWinner();
        }

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
