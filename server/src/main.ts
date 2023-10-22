import { Player } from './player.ts';
import { Round, State } from './round.ts';

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

    socket.addEventListener('open', (_ev) => {
      console.log('>> CLIENT CONNECTED!');
      console.log('>> HOSTNAME:', hostname);
      const player = new Player(socket, hostname);
      round.addPlayer(player);
      socket.send('hi');
    });
    socket.addEventListener('close', (_ev) => {
      console.log(`>> CLIENT ${info.remoteAddr.hostname} HAS DISCONNECTED`);
      round.removePlayer(hostname);
    });
    socket.addEventListener('message', (_ev) => {
      processMessage(_ev.data);
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

type Messages = SetNameMessage | SubmitAcronymMessage | VoteMessage;

function processMessage(data: string) {
  try {
    const msg: Messages = JSON.parse(data);

    if (msg.type === 'setName') {
      // set the user's name
      console.log(`GOT NAME SET MSG WITH NAME ${msg.name}`);
    } else if (msg.type === 'submitAcronym') {
      // set user's acronym
    } else {
      console.warn(`>> UNKOWN MESSAGE: ${data}`);
    }
  } catch (e) {
    console.error('>> UNABLE TO PARSE MESSAGE INTO POJO: ', e);
  }
}

function gameLoop() {
}
