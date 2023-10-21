if (import.meta.main) {
  startWebSocketServer();
  setInterval(gameLoop, 1000);
}

class Player {
  #socket: WebSocket;

  constructor(socket: WebSocket) {
    this.#socket = socket;
  }

  sendMessage(message: string) {
    this.#socket.send(message);
  }
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

/*
 * What are the game states?
 *
 * waiting: waiting for N players before the game can begin
 * acronym: generate acronym, send it to players and start a countdown
 */
function gameLoop() {
  console.log('State of room: ', room);
}
