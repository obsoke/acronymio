import { Player } from './player.ts';
import { Round } from './round.ts';

if (import.meta.main) {
  startWebSocketServer();
  setInterval(gameLoop, 1000);
}

// NOTE: For PoC purposes, there is only a single game room
const round = new Round();

function startWebSocketServer() {
  Deno.serve((req, info) => {
    console.log('>> REQUEST RECEIVED');
    if (req.headers.get('upgrade') != 'websocket') {
      return new Response(null, { status: 501 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    const { hostname } = info.remoteAddr;
    let player: Player; // easy access to this socket's Player

    socket.addEventListener('open', (_ev) => {
      console.log('>> CLIENT CONNECTED!');
      console.log('>> HOSTNAME:', hostname);
      const pl = new Player(socket, hostname);
      player = pl;
      round.addPlayer(pl);
    });
    socket.addEventListener('close', (_ev) => {
      console.log(`>> CLIENT ${info.remoteAddr.hostname} HAS DISCONNECTED`);
      round.removePlayer(hostname);
    });
    socket.addEventListener('message', (_ev) => {
      processMessage(_ev.data, player);
    });
    socket.addEventListener('error', (_ev) => {
      console.log('>> ERROR');
    });

    return response;
  });
}

type SetNameMessage = {
  type: 'setName';
  name: string;
};

type SubmitAcronymMessage = {
  type: 'submitAcronym';
  acronym: string[];
};

type VoteMessage = {
  type: 'vote';
  selection: string[];
};

type WinnerMessage = {
  type: 'winner';
  winner: string;
};

type Messages =
  | SetNameMessage
  | SubmitAcronymMessage
  | VoteMessage
  | WinnerMessage;

function processMessage(data: string, sender: Player) {
  try {
    const msg: Messages = JSON.parse(data);

    if (msg.type === 'setName') {
      console.log(`GOT NAME SET MSG WITH NAME ${msg.name}`);
      sender.setName(msg.name);
      // TODO: send message to let player know we are waiting for game to start
    } else if (msg.type === 'submitAcronym') {
      // TODO: Validate that submission matches the given acronym; if not, send an error to client
      sender.setSubmission(msg.acronym);
      // TODO: send message to let player know we are waiting for all submissions to be entered, or round time to end
    } else {
      console.warn(`>> UNKOWN MESSAGE: ${data}`);
    }
  } catch (e) {
    console.error('>> UNABLE TO PARSE MESSAGE INTO POJO: ', e);
  }
}

const NUM_READY_PLAYERS = 1; // NOTE: This is set to 1 for testing; should be 3 in prod
function gameLoop() {
  switch (round.getCurrentState()) {
    case 'waiting':
      // DEBUG OUTPUT
      console.log(`Currently connected players: ${round.getPlayerCount()}`);
      for (const player of round.getReadyPlayerNames()) {
        console.log(player);
      }
      // DEBUG OUTPUT

      if (round.checkForReadyGame(NUM_READY_PLAYERS)) {
        round.startGame();
      }
      break;
    case 'acronym':
      break;
    case 'judging':
      break;
    case 'gameover':
      break;
    default:
      break;
  }
}
