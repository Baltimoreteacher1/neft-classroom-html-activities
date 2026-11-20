// Letter delivery boundary. Local outbox is the only enabled transport; production email/link adapters stop here.
export class OutboxOnlyTransport {
  async send(letter, queue) {
    return queue({ kind: "outbox", id: `letter-${crypto.randomUUID()}`, status: "draft-local", queuedAt: new Date().toISOString(), letter });
  }
}
export class EmailTransport {
  constructor() { this.enabled = false; }
  async send() { throw new Error("STOP: select and authorize an email provider before enabling delivery."); }
}
export class LinkTransport {
  constructor() { this.enabled = false; }
  async createToken() { throw new Error("STOP: approve token storage and a production receipt route before creating family links."); }
}
export const letterTransport = (type = "outbox-only") => type === "email" ? new EmailTransport() : type === "link" ? new LinkTransport() : new OutboxOnlyTransport();
