// Provider boundary for the STOP-gated live feature. Mock is usable offline; Cloudflare never sends a request.
export class MockRealtimeProvider {
  async createRoom(options) { return { id: `mock-${options.id}`, options, state: "created" }; }
  async joinToken(room, participant) { return { roomId: room.id, participant, token: `mock-token-${participant}` }; }
  async startRecording(room) { return { ...room, state: "recording", startedAt: Date.now() }; }
  async stopRecording(room) { return { ...room, state: "processing", stoppedAt: Date.now() }; }
  async getRecording(room) { return { id: `${room.id}-recording`, status: "mock-ready", retentionDays: 30 }; }
}

export class CloudflareRealtimeProvider {
  constructor() { this.enabled = false; }
  async createRoom() { throw new Error("STOP: configure and authorize a realtime provider before enabling this adapter."); }
  async joinToken() { throw new Error("STOP: no provider binding is configured."); }
  async startRecording() { throw new Error("STOP: no storage or retention binding is configured."); }
  async stopRecording() { throw new Error("STOP: no provider binding is configured."); }
  async getRecording() { throw new Error("STOP: no object storage is configured."); }
}

export const providerFor = (name = "mock") => name === "mock" ? new MockRealtimeProvider() : new CloudflareRealtimeProvider();
