import { maxBy, partition } from '../deps.ts';
import { Player } from './player.ts';
import {
  ServerBeginGameMessage,
  ServerBeginVotingMessage,
  ServerDisconnectUserMessage,
  ServerEndGameMessage,
  ServerUpdateTimerMessage,
  ServerUserKickedMessage,
  ServerWinnerMessage,
} from './message.ts';
import { generateAcronym } from './acronym.ts';

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
const NUM_READY_PLAYERS = 3; // TODO: Should be 3 in prod
const ACRO_ROUND_TIME = 30; // TODO: Should be 60 in prod
const VOTE_ROUND_TIME = 30; // seconds

const ACRONYM_LENGTH_RANGE = 4;
const ACRONYM_LENGTH_MIN = 3;

/**
 * A `Round` is a single game of Acronymio. It holds all data requires to run the game,
 * transitions between states and deals with messages from/to players.
 */
export class Round {
  #state: GameState = 'waiting';
  #players: Player[] = [];
  #roundTimer = 0; // Interval ID
  #roundTime = 0; // Time for round

  getCurrentState(): GameState {
    return this.#state;
  }

  resetRound() {
    this.#state = 'waiting';
    this.#players = [];
    this.#roundTime = 0;
    clearInterval(this.#roundTimer);
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
    return this.#players
      .filter((p) => p.isReadyToPlay())
      .map((p) => p.getName());
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
      (prev, curr) => (curr.isReadyToPlay() ? prev + 1 : prev),
      0,
    );

    return readyPlayerCount >= readyPlayerThreshold;
  }

  canGameContinue(): boolean {
    return this.#players.length >= NUM_READY_PLAYERS;
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
    const acroLength = Math.floor(
      Math.random() * ACRONYM_LENGTH_RANGE + ACRONYM_LENGTH_MIN,
    );
    const acronym = generateAcronym(acroLength);

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

  checkAcroEntries() {
    const [usersWithoutEntry, usersWithEntry] = partition(
      this.#players,
      (p) => p.getSubmission().length === 0,
    );
    const kickedUsernames = [];
    for (const player of usersWithoutEntry) {
      const msg: ServerDisconnectUserMessage = {
        type: 'disconnect',
        reason: 'No acronym was submitted.',
      };
      player.sendMessage(msg);

      kickedUsernames.push(player.getName());

      this.removePlayer(player.getId());
    }

    // If anyone was kicked, send a message to other users saying so.
    if (kickedUsernames.length) {
      const kickedMessages: ServerUserKickedMessage[] = kickedUsernames.map(
        (username) => ({
          type: 'userKicked',
          username,
          reason: 'No acronym submitted.',
        }),
      );
      for (const player of usersWithEntry) {
        for (const msg of kickedMessages) {
          player.sendMessage(msg);
        }
      }
    }

    // TODO: Can the game still continue?
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
    const votes = this.#players.reduce(
      (results, player) => {
        const id = player.getVote();
        if (!results[id]) {
          results[id] = 0;
        }

        results[id] += 1;

        return results;
      },
      {} as Record<string, number>,
    );

    const voteArray = Object.entries(votes);
    const winningEntry = maxBy(voteArray, (v) => v[1]);
    const winningPlayer = this.#players.find(
      (p) => p.getId() === winningEntry![0],
    );

    if (!winningPlayer) {
      const msg: ServerEndGameMessage = {
        type: 'gameover',
        message: 'No one voted',
      };
      for (const player of this.#players) {
        player.sendMessage(msg);
      }
      this.#state = 'gameover';
      return;
    }

    const msg: ServerWinnerMessage = {
      type: 'winner',
      winner: winningPlayer.getName(),
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
        // console.log(`Currently connected players: ${this.getPlayerCount()}`);
        // for (const player of this.getReadyPlayerNames()) {
        //   console.log(player);
        // }
        // DEBUG OUTPUT

        if (this.checkForReadyGame(NUM_READY_PLAYERS)) {
          this.beginRound();
        }
        break;
      case 'acronym': {
        // check if round is over via timer
        console.log('Acronym round time remaining: ' + this.#roundTime);
        if (this.#roundTime <= 0) {
          clearInterval(this.#roundTimer);
          this.checkAcroEntries();
          if (!this.canGameContinue()) {
            this.#state = 'gameover';
            break;
          }
          this.beginVoting();
        }

        // check if all entries are in
        const receivedAllEntries = this.#players.every(
          (p) => p.getSubmission().length > 0,
        );
        // NOTE: This *might* be false if someone plays but does not submit an answer
        // TODO: We might need a way to 'drop' players from the game from the server here
        if (receivedAllEntries) {
          clearInterval(this.#roundTimer);
          this.beginVoting();
        }
        break;
      }
      case 'voting': {
        // check if round is over via timer
        console.log('Vote round time remaining: ' + this.#roundTime);
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
        console.log('game over!');
        // TODO: Shutdown room/game
        break;
      default:
        console.error('in unknown state');
        break;
    }
  }
}
