// world.js — one live platform sequence: the physics world, the Explorer, pickups, hazards, checkpoints, gates, exits
// and the camera. DOM-free, so the unit tests play whole screens (with the Auto-walk driver) without a browser.
//
// The world reports what happened as a queue of small events ({ t: "jump" | "land" | "shard" | "bump" | "checkpoint" |
// "gate" | "exit" | "fell" }); index.js turns them into sound, particles, announcements and academic gates.
import { makeBody, physFor, prepPlatform, standOn, step, syncPlatforms } from "./physics.js";
import { bridgePlatforms } from "./levels.js";
import { autopilot, makeAutopilot, worldFor } from "./reach.js";
import { physicsOf } from "./difficulty.js";

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const GATE_REACH = 64; // px from a dais' right edge at which its gate console wakes
const R_SHARD = 26;

export class Level {
  /** @param {{seq: object, diff: object, run: {gates: Array, cp: ?object, taken: string[]}}} o */
  constructor({ seq, diff, run }) {
    this.seq = seq;
    this.diff = diff;
    this.phys = physFor(physicsOf(diff));
    const { w, routes } = worldFor(seq, run.gates || []);
    this.w = w;
    this.routes = routes;
    this.kinds = seq.gates.map((_, i) => run.gates?.[i] || null);
    this.body = makeBody(0, 0, this.phys);
    this.shards = seq.shards.map((s) => ({ ...s, got: (run.taken || []).includes(s.id) }));
    this.hazards = [...seq.hazards, ...seq.gates.map((g) => g.wisp).filter(Boolean)].map((h) => ({ ...h, y0: h.y }));
    this.cpActive = new Set();
    this.cp = null;
    this.lastSafe = null;
    this.ev = [];
    this.t = 0;
    this.invuln = 0;
    this.fallen = false;
    this.pending = run.pending ?? null;
    this.done = false;
    this.landT = 0;
    this.celeT = 0;
    this.ap = makeAutopilot();
    this.cam = { x: 0, y: 0 };
    const cp = run.cp && this.w.plats[run.cp.plat] ? run.cp : null; // a save from another layout is ignored, not trusted
    this.placeAt(cp);
    if (cp) this.cp = { ...cp };
    for (const c of seq.checkpoints) if (cp && cp.plat === c.plat) this.cpActive.add(c.plat);
    this.snapCamera(640, diff.viewH);
  }

  placeAt(spot) {
    const p = spot ? this.w.plats[spot.plat] : this.w.plats[this.seq.spawn.plat];
    standOn(this.body, p, spot ? spot.x : this.seq.spawn.x, spot ? spot.plat : this.seq.spawn.plat);
    this.lastSafe = { plat: this.body.plat, x: this.body.x };
  }

  /** Power a gate: add its bridge platforms to the sim and to the live routes. kind "full" | "segments". */
  power(gi, kind) {
    if (this.kinds[gi]) return false;
    const g = this.seq.gates[gi];
    const ids = bridgePlatforms(g, kind).map((p) => {
      this.w.plats.push(prepPlatform(p, this.w.plats.length));
      return this.w.plats.length - 1;
    });
    for (const r of [this.routes.main, this.routes.high])
      if (r) r.splice(r.indexOf(g.dais) + 1, 0, ...ids);
    syncPlatforms(this.w);
    this.kinds[gi] = kind;
    this.pending = null;
    this.celeT = 1.2;
    this.setCheckpoint(g.dais, g.x0 - 40);
    return true;
  }

  setCheckpoint(plat, x) {
    const p = this.w.plats[plat];
    this.cp = { plat, x: Math.round(clamp(x, p.x + 8, p.x + p.w - 8 - this.body.w)) };
  }

  /** Where a fall puts the Explorer back: "safe" = the last ledge stood on (free), "checkpoint" = the last checkpoint (or the start). */
  respawn(kind) {
    this.placeAt(kind === "safe" ? this.lastSafe : this.cp);
    this.fallen = false;
    this.invuln = 1.2;
    this.ap.wait = 0;
  }

  /** Per-frame simulation. `inp` = { left, right, jump, jumpPressed }. `dormant`: hazards are asleep (the Explorer is auto-walking). */
  step(ms, inp, dormant = false) {
    if (this.fallen || this.done) return;
    const dt = ms / 1000;
    const b = this.body;
    this.t += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.landT = Math.max(0, this.landT - dt);
    this.celeT = Math.max(0, this.celeT - dt);
    step(this.w, b, inp, dt, this.phys);
    if (b.ev & 1) this.ev.push({ t: "jump" });
    if (b.ev & 2) {
      this.landT = 0.14;
      this.ev.push({ t: "land", v: b.landV });
    }
    b.ev = 0;
    if (b.fell) {
      this.fallen = true;
      b.fell = false;
      this.ev.push({ t: "fell" });
      return;
    }
    if (b.grounded) this.track();
    this.pickups();
    for (const h of this.hazards) h.y = h.bob ? h.y0 + 8 * Math.sin(this.t * 2 + (h.phase || 0)) : h.y0;
    if (!dormant && this.invuln <= 0) this.collide();
    if (b.grounded) this.triggers();
  }

  track() {
    const b = this.body;
    const p = this.w.plats[b.plat];
    if (p && p.safe && !p.mv && b.x >= p.x + 6 && b.x + b.w <= p.x + p.w - 6) this.lastSafe = { plat: b.plat, x: b.x };
  }

  pickups() {
    const b = this.body;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    for (const s of this.shards) {
      if (s.got) continue;
      const dx = cx - s.x;
      const dy = cy - s.y;
      if (dx * dx + dy * dy <= R_SHARD * R_SHARD) {
        s.got = true;
        this.ev.push({ t: "shard", s });
      }
    }
  }

  collide() {
    const b = this.body;
    for (const h of this.hazards) {
      const hy = h.y;
      if (b.x + b.w - 5 > h.x && b.x + 5 < h.x + h.w && b.y + b.h - 5 > hy && b.y + 5 < hy + h.h) {
        const dir = b.x + b.w / 2 < h.x + h.w / 2 ? -1 : 1;
        b.vx = dir * 240;
        b.vy = -330;
        b.grounded = false;
        b.plat = -1;
        b.coyote = 0.06;
        this.invuln = 1.1;
        this.ev.push({ t: "bump", h });
        return;
      }
    }
  }

  triggers() {
    const b = this.body;
    const p = this.w.plats[b.plat];
    if (!p) return;
    const cps = this.seq.checkpoints;
    for (let i = 0; i < cps.length; i += 1) {
      if (cps[i].plat === b.plat && !this.cpActive.has(b.plat)) {
        this.cpActive.add(b.plat);
        this.setCheckpoint(b.plat, b.x);
        this.ev.push({ t: "checkpoint", id: cps[i].id });
      }
    }
    const gates = this.seq.gates;
    for (let i = 0; i < gates.length; i += 1)
      if (!this.kinds[i] && this.pending === null && gates[i].dais === b.plat && b.x + b.w >= p.x + p.w - GATE_REACH) {
        this.pending = i;
        this.ev.push({ t: "gate", g: i });
      }
    if (b.plat === this.seq.exit.plat && b.x + b.w / 2 >= this.seq.exit.x - 28 && this.kinds.every(Boolean)) {
      this.done = true;
      this.celeT = 1.5;
      this.ev.push({ t: "exit" });
    }
  }

  /** The Auto-walk driver for this frame (uses the live route, so powered bridges are followed). */
  drive(ms) {
    return autopilot(this.ap, this.w, this.body, this.routes.main, this.phys, ms / 1000);
  }

  /** Camera with look-ahead and smoothing. Reduced motion: no look-ahead and a tighter follow. */
  snapCamera(viewW, viewH) {
    const b = this.body;
    this.cam.x = clamp(b.x - viewW * 0.38, 0, Math.max(0, this.seq.width - viewW));
    this.cam.y = clamp(b.y - viewH * 0.62, 60, this.seq.killY - viewH);
  }
  follow(ms, viewW, viewH, reduced = false) {
    const b = this.body;
    const look = reduced ? 0 : b.facing * 70 + b.vx * 0.12;
    const tx = clamp(b.x + b.w / 2 + look - viewW * 0.5, 0, Math.max(0, this.seq.width - viewW));
    const ty = clamp(b.y + b.h / 2 - viewH * 0.58, 60, this.seq.killY - viewH);
    const k = 1 - Math.exp(-(ms / 1000) * (reduced ? 14 : 5.5));
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * (1 - Math.exp(-(ms / 1000) * 3.5));
  }

  /** Numbers for the canvas' text alternative: how far along the route, what is next, what is left. */
  status() {
    const b = this.body;
    const route = this.routes.main;
    const here = b.grounded ? route.indexOf(b.plat) : -1;
    const idx = here >= 0 ? here : Math.max(0, route.findIndex((id) => this.w.plats[id].x + this.w.plats[id].w > b.x + b.w) - 1);
    const next = this.w.plats[route[Math.min(route.length - 1, idx + 1)]];
    const cur = this.w.plats[route[idx]];
    const gap = next && cur ? Math.max(0, Math.round((next.x - (cur.x + cur.w)) / 32)) : 0;
    const left = this.shards.filter((s) => !s.got && !s.high).length;
    const gates = this.kinds.filter((k) => !k).length;
    return { index: idx + 1, count: route.length, gap, rise: next && cur ? Math.round((cur.y - next.y) / 32) : 0, shardsLeft: left, gatesLeft: gates, airborne: !b.grounded, checkpoint: Boolean(this.cp), mover: Boolean(next?.mv), exitX: this.seq.exit.x - b.x };
  }
}
