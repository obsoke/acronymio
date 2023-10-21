if (import.meta.main) {
  startServer();
}

function startServer() {
  Deno.serve((req, info) => {
    console.log('>> REQUEST RECEIVED');
    if (req.headers.get('upgrade') != 'websocket') {
      return new Response(null, { status: 501 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.addEventListener('open', (_ev) => {
      console.log('>> CLIENT CONNECTED!');
      const { hostname } = info.remoteAddr;
      console.log('>> HOSTNAME:', hostname);
    });
    socket.addEventListener('close', (_ev) => {
      console.log(`>> CLIENT ${info.remoteAddr.hostname} HAS DISCONNECTED`);
    });
    socket.addEventListener('message', onMessageReceived);
    socket.addEventListener('error', onError);

    return response;
  });
}

function onMessageReceived(_event: MessageEvent) {
  console.log('>> MESSAGE RECEIVED');
}

function onError(_event: Event) {
  console.log('>> ERROR');
}
