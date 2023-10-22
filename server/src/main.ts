if (import.meta.main) {
  startWebSocketServer();
  setInterval(gameLoop, 1000);
}

class Player {
  #socket: WebSocket;
  #submission: string = '';

  constructor(socket: WebSocket) {
    this.#socket = socket;
  }

  sendMessage(message: string) {
    this.#socket.send(message);
  }

  setSubmission(submission: string) {
    this.#submission = submission;
  }

  getSubmission(): string {
    return this.#submission;
  }
}

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
type State = 'waiting' | 'acronym' | 'judging' | 'gameover';

/**
 * A `Round` is a single game of Acronymio. It holds all data requires to run the game,
 * transitions between states and deals with messages from/to players.
 */
class Round {
  #state: State = 'waiting';
  // #players:
}

const room: Record<string, Player> = {};

function startWebSocketServer() {
  Deno.serve((req, info) => {
    console.log('>> REQUEST RECEIVED');
    if (req.headers.get('upgrade') != 'websocket') {
      return new Response(null, { status: 501 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    const { hostname } = info.remoteAddr;

    socket.addEventListener('open', (_ev) => {
      console.log('>> CLIENT CONNECTED!');
      console.log('>> HOSTNAME:', hostname);
      const player = new Player(socket);
      room[hostname] = player;
      socket.send('hi');
    });
    socket.addEventListener('close', (_ev) => {
      console.log(`>> CLIENT ${info.remoteAddr.hostname} HAS DISCONNECTED`);
      delete room[hostname];
    });
    socket.addEventListener('message', (_ev) => {
      console.log('>> MESSAGE RECEIVED: ', _ev.data);
    });
    socket.addEventListener('error', (_ev) => {
      console.log('>> ERROR');
    });

    return response;
  });
}

function gameLoop() {
  console.log('State of room: ', room);
}
