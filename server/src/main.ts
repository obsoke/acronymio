import { Player } from "./player.ts";
import { Round } from "./round.ts";
import { processMessage } from "./message.ts";

if (import.meta.main) {
  startWebSocketServer();
  setInterval(gameLoop, 1000);
}

// NOTE: For PoC purposes, there is only a single game room
const round = new Round();

function startWebSocketServer() {
  Deno.serve({ port: 8080, hostname: "0.0.0.0" }, (req, info) => {
    console.log(">> REQUEST RECEIVED");
    if (req.headers.get("upgrade") != "websocket") {
      return new Response(null, { status: 501 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    const { hostname } = info.remoteAddr;
    const uuid = crypto.randomUUID();
    let player: Player; // easy access to this socket's Player, is there a better way to do this?

    socket.addEventListener("open", (_ev) => {
      console.log(">> CLIENT CONNECTED!");
      const pl = new Player(socket, hostname, uuid);
      player = pl;
      round.addPlayer(pl);
    });
    socket.addEventListener("close", (_ev) => {
      console.log(
        `>> CLIENT ${hostname} + ${uuid} HAS DISCONNECTED`,
      );
      round.removePlayer(uuid);

      // DEBUG STUFF
      // TODO: What to do if player count hits 0?
      if (round.getPlayerCount() === 0) {
        round.resetRound();
      }
    });
    socket.addEventListener("message", (_ev) => {
      processMessage(_ev.data, player);
    });
    socket.addEventListener("error", (_ev) => {
      console.log(">> ERROR");
    });

    return response;
  });
}

function gameLoop() {
  round.gameLoop();
}
