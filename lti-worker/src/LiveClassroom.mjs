export class LiveClassroom {
  constructor(state, env) {
    this.state = state;
  }
  async fetch(request) {
    if (request.headers.get("Upgrade") === "websocket") {
      const [client, server] = Object.values(new WebSocketPair());
      this.state.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response("Expected WebSocket", { status: 426 });
  }
  async webSocketMessage(ws, msg) {
    this.state.getWebSockets().forEach(client => {
      if (client !== ws) client.send(msg);
    });
  }
}