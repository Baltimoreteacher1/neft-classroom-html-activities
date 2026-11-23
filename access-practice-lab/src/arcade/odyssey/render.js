// render.js — one frame of the Skyline Runner: backdrop layers, the live level, the Explorer, particles and fades.
import { drawBackground, drawMotes } from "./art-bg.js";
import { drawLevel } from "./art-world.js";
import { SCARVES, TRAILS, drawExplorer, drawTrail, poseOf } from "./art-avatar.js";

/** World px visible on screen for a canvas of (w, h) CSS px and a logical view height. */
export const viewOf = (size, diff) => {
  const s = size.h / diff.viewH;
  return { s, vw: size.w / s, vh: diff.viewH };
};

export function drawFrame(g) {
  const { ctx, cache, size, lv, diff, theme: T, t, av, parts, fx, walking, look, tier, shake, fade } = g;
  const { s, vw } = viewOf(size, diff);
  const { dpr, w, h } = size;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBackground(ctx, cache, T, { w, h, s, cam: lv.cam, t, layers: fx.layers, drift: !fx.reduced, still: fx.reduced });
  if (!fx.off) drawMotes(ctx, T, { w, h, t, count: fx.layers >= 4 ? 18 : 8 });
  const sx = shake > 0 && !fx.reduced ? (Math.random() - 0.5) * shake * 10 : 0;
  ctx.setTransform(dpr * s, 0, 0, dpr * s, (-lv.cam.x + sx) * dpr * s, -lv.cam.y * dpr * s);
  const view = { x0: lv.cam.x, x1: lv.cam.x + vw };
  drawLevel(ctx, cache, T, lv, { t, view, dormant: walking, guide: diff.guide });
  if (!fx.off) drawTrail(ctx, av, { glow: TRAILS[look] || "", tier, t });
  const pose = poseOf(lv.body, lv);
  drawExplorer(ctx, lv.body, pose, { av, t, scale: diff.spriteScale, look, scarf: SCARVES[look] || SCARVES[""], flicker: lv.invuln > 0 && !fx.reduced });
  if (!fx.off) parts.draw(ctx);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (fade > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, fade)})`;
    ctx.fillRect(0, 0, w, h);
  }
}
