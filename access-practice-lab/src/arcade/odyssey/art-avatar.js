// art-avatar.js — the Explorer: an original character drawn from a few shapes, with idle, run, jump, fall, land and
// celebrate poses, a trailing scarf, optional cosmetics (scarf colour, cap, trail) and a streak glow trail.
// Cosmetics are earned by playing and never gate learning.
export const SCARVES = Object.freeze({ "": "#e8603c", "od-scarf-gold": "#f4c542", "od-scarf-teal": "#1aa6a0" });
export const TRAILS = Object.freeze({ "od-trail-spark": "#ffd36b", "od-trail-glow": "#7ff4ff" });

export const TRAIL_LEN = 10;
export const makeAvatar = () => ({ phase: 0, tx: new Float32Array(TRAIL_LEN), ty: new Float32Array(TRAIL_LEN), head: 0, acc: 0 });

export const poseOf = (b, level) => {
  if (level.celeT > 0) return "celebrate";
  if (!b.grounded) return b.vy < 0 ? "jump" : "fall";
  if (level.landT > 0) return "land";
  return Math.abs(b.vx) > 24 ? "run" : "idle";
};

/** Feed the trail and the run cycle. `ms` = frame time. */
export function tickAvatar(av, b, ms) {
  av.phase += (Math.abs(b.vx) * ms) / 1000 * 0.052;
  av.acc += ms;
  if (av.acc >= 36) {
    av.acc = 0;
    av.head = (av.head + 1) % TRAIL_LEN;
    av.tx[av.head] = b.x + b.w / 2;
    av.ty[av.head] = b.y + b.h / 2;
  }
}

function limb(ctx, x0, y0, x1, y1, w, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

export function drawTrail(ctx, av, { glow, tier, t }) {
  const color = glow || (tier === "overdrive" ? "#ffd36b" : tier === "blazing" ? "#ff8a5c" : tier === "hot" ? "#ffcf4a" : "");
  if (!color) return;
  for (let i = 1; i < TRAIL_LEN; i += 1) {
    const k = (av.head - i + TRAIL_LEN) % TRAIL_LEN;
    if (!av.tx[k]) continue;
    ctx.globalAlpha = (1 - i / TRAIL_LEN) * (tier === "overdrive" ? 0.6 : 0.4);
    ctx.fillStyle = tier === "overdrive" && i % 2 ? "#7ff4ff" : color;
    ctx.beginPath();
    ctx.arc(av.tx[k], av.ty[k] + Math.sin(t * 6 + i) * 2, (tier === "overdrive" ? 9 : 6) - i * 0.5, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawExplorer(ctx, b, pose, { av, t, scale = 1, look = "", scarf = SCARVES[""], flicker = false }) {
  if (flicker && Math.floor(t * 14) % 2) return; // invulnerability blink
  const run = Math.sin(av.phase);
  const sq = { land: [1.2, 0.8], jump: [0.9, 1.12], fall: [0.95, 1.06] }[pose] || [1, 1 + Math.sin(t * 2.5) * (pose === "idle" ? 0.025 : 0)];
  ctx.save();
  ctx.translate(b.x + b.w / 2, b.y + b.h + 1);
  ctx.scale(b.facing * scale * sq[0], scale * sq[1]);
  const cele = pose === "celebrate";
  const hop = cele ? -Math.abs(Math.sin(t * 9)) * 6 : 0;
  ctx.translate(0, hop);
  // scarf behind
  const trail = Math.min(1, Math.abs(b.vx) / 200 + (pose === "jump" || pose === "fall" ? 0.5 : 0.15));
  ctx.strokeStyle = scarf;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-3, -31);
  for (let i = 1; i <= 3; i += 1) ctx.lineTo(-3 - i * 7 * trail - 2, -31 + Math.sin(t * 9 + i * 1.3) * 3 * i * 0.6 + (pose === "fall" ? -i * 3 : i));
  ctx.stroke();
  // legs
  const stride = pose === "run" ? 9 : 0;
  const lift = (p) => Math.max(0, p) * 6;
  const legs = pose === "jump" ? [[-4, -7], [5, -10]] : pose === "fall" ? [[-7, -1], [7, -1]] : [[-4 + run * stride, -2 - lift(Math.cos(av.phase))], [4 - run * stride, -2 - lift(-Math.cos(av.phase))]];
  for (const [x, y] of legs) limb(ctx, 0, -14, x, y, 5, "#233a63");
  ctx.fillStyle = "#101b33";
  for (const [x, y] of legs) ctx.fillRect(x - 3, y - 2, 7, 4);
  // backpack and torso
  ctx.fillStyle = "#e2a72e";
  ctx.beginPath();
  ctx.roundRect(-14, -29, 8, 13, 3);
  ctx.fill();
  ctx.fillStyle = "#1f4fd8";
  ctx.beginPath();
  ctx.roundRect(-7, -31, 15, 18, 5);
  ctx.fill();
  ctx.fillStyle = "#ffcf4a";
  ctx.fillRect(-7, -19, 15, 3);
  // arms
  const armY = -27;
  if (cele) {
    limb(ctx, 0, armY, 9, armY - 14 + Math.sin(t * 12) * 3, 4, "#f2c9a0");
    limb(ctx, 0, armY, -8, armY - 14 - Math.sin(t * 12) * 3, 4, "#f2c9a0");
  } else if (pose === "jump" || pose === "fall") {
    limb(ctx, 0, armY, 10, armY - (pose === "jump" ? 13 : 9), 4, "#f2c9a0");
    limb(ctx, 0, armY, -9, armY - (pose === "jump" ? 10 : 12), 4, "#f2c9a0");
  } else {
    limb(ctx, 0, armY, 7 - run * 6 * (pose === "run" ? 1 : 0), armY + 12, 4, "#f2c9a0");
    limb(ctx, 0, armY, -5 + run * 6 * (pose === "run" ? 1 : 0), armY + 12, 4, "#f2c9a0");
  }
  // head
  ctx.fillStyle = "#f2c9a0";
  ctx.beginPath();
  ctx.arc(1, -39, 8.5, 0, 7);
  ctx.fill();
  ctx.fillStyle = look === "od-hat-cap" ? "#14315f" : "#5b3b22";
  ctx.beginPath();
  ctx.arc(1, -40, 9, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fill();
  if (look === "od-hat-cap") ctx.fillRect(5, -42, 9, 3);
  // face
  ctx.fillStyle = "#1a1a1a";
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 1.6;
  if (cele) {
    ctx.beginPath();
    ctx.arc(4, -38, 2.2, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-1, -38, 2.2, Math.PI, 0);
    ctx.stroke();
  } else {
    const r = pose === "fall" ? 2.3 : 1.7;
    ctx.beginPath();
    ctx.arc(4.5, -38.5, r, 0, 7);
    ctx.arc(-0.5, -38.5, r, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}
