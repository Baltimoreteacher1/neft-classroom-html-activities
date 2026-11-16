// Language Expeditions explore mode: inside a land the learner steers the explorer along the trail (arrow keys or
// A / D, the on-screen buttons held or tapped), jumps (Up, W or Space) for collectibles that float high, and opens
// each stop by reaching its lamp (Enter or the Open button). "Walk me to the next stop" stays for anyone who would
// rather not steer, and it is the QA plan's step. Collectibles are for fun: they are counted, never scored.
//
// The loop mutates state.x and state.got in place and repaints the scene and the walk panel directly, without a
// re-render, so a held button keeps its pointer and focus. Both are saved with the next real action (Open, a land
// button). Reduced motion keeps steering (the learner moves the explorer) but drops the walk bob and the twinkle.
import { html } from "./engine.js";
import { H, aim, gateX, gems, stopX, trailX } from "./language-expeditions-world.js";
import { newGearHTML } from "./language-expeditions-feel-gear.js"; // feel: gear
import { feelDrive, soundBtnHTML } from "./language-expeditions-feel-pad.js"; // feel: pad, gamepad, sound

const SPEED = 950; // world units per second
const JUMP_V = 1500; // jump launch speed; peak = JUMP_V^2 / (2 * GRAV), about 270 units
const GRAV = 4200;
const REACH = 230; // how close to a lamp or the gate counts as arrived
const TAP = 0.35; // seconds one keyboard press or tap of a walk button moves
const HERO_TOP = 510; // the explorer spans these world heights when standing (see .lexp-hero in games-m.css)
const HERO_FOOT = 810;

const slots = (k) => (k < 2 ? 3 : 2);
export const bounds = (k) => [trailX(k) - 200, gateX(k) + 150];
/** The next place the explorer is heading in land k: the next unfinished stop, or the gate. */
export const targetX = (s, k = s.land) => {
  const L = s.lands[k];
  return L.i < L.acts.length ? stopX(k, L.i, slots(k)) : gateX(k);
};
export const isNear = (s) => Math.abs(s.x - targetX(s)) < REACH;
/** Old saves have neither field; a land change puts the explorer at the trailhead or the last lamp it reached. */
export function ensure(s) {
  if (!Array.isArray(s.got)) s.got = [];
  const [lo, hi] = bounds(s.land);
  if (typeof s.x !== "number" || s.x < lo || s.x > hi) {
    const L = s.lands[s.land];
    s.x =
      L.i > 0
        ? L.i < L.acts.length
          ? stopX(s.land, L.i - 1, slots(s.land))
          : targetX(s)
        : trailX(s.land);
  }
  return s;
}

const GEM = {
  "3-5": ["fireflies", "luciérnagas"],
  "6-8": ["signal sparks", "chispas de señal"],
};
const countText = (I, b, got, total) =>
  I.T(
    `${GEM[b][0][0].toUpperCase()}${GEM[b][0].slice(1)} gathered here: ${got} of ${total}`,
    `${GEM[b][1][0].toUpperCase()}${GEM[b][1].slice(1)} reunidas aquí: ${got} de ${total}`,
  );
const statusText = (I, near, where) =>
  near
    ? I.T(
        `You reached ${where.en}. Press Enter or Open.`,
        `Llegaste a ${where.es}. Pulsa Enter o Abrir.`,
      )
    : I.T(`Walk to ${where.en}.`, `Camina hasta ${where.es}.`);

/** Where the explorer is heading, in both languages. */
export const whereOf = (s, land, a) =>
  a
    ? { en: `the stop "${a.title.en}"`, es: `la parada «${a.title.es}»` }
    : { en: `the gate of ${land.name.en}`, es: `la puerta de ${land.name.es}` };

export function walkHTML(s, land, a, env, b) {
  const I = env.I;
  const near = isNear(s);
  const where = whereOf(s, land, a);
  const mine = gems(b).filter((g) => g.land === s.land);
  const got = mine.filter((g) => s.got.includes(g.id)).length;
  return html`<div
    class="lexp-panel lexp-walk lexp-dom-${land.domain}"
    data-mechanic="four-land-expedition"
  >
    <p class="lexp-tag">${I.T(land.name.en, land.name.es)} · ${I.T("explore", "explora")}</p>
    <h2 class="lexp-head" tabindex="-1">
      ${I.T(`Explore ${land.name.en}`, `Explora ${land.name.es}`)}
    </h2>
    <p class="lexp-guide">
      ${I.T(
        `Walk the trail and gather the ${GEM[b][0]}. Jump for the high ones. Reach the glowing lamp to open the next stop.`,
        `Recorre el sendero y reúne las ${GEM[b][1]}. Salta para alcanzar las altas. Llega a la lámpara encendida para abrir la siguiente parada.`,
      )}
    </p>
    <div
      class="lexp-pad"
      role="group"
      aria-label="${I.S("Move the explorer", "Mueve al explorador")}"
    >
      <button type="button" class="btn lexp-pad-btn" data-lexp-move="-1">
        <span aria-hidden="true">◀</span> ${I.T("Back", "Atrás")}
      </button>
      <button type="button" class="btn lexp-pad-btn" data-lexp-jump>
        <span aria-hidden="true">▲</span> ${I.T("Jump", "Saltar")}
      </button>
      <button type="button" class="btn lexp-pad-btn" data-lexp-move="1">
        ${I.T("Ahead", "Adelante")} <span aria-hidden="true">▶</span>
      </button>
    </div>
    <p class="lexp-walk-status" role="status" data-lexp-status>${statusText(I, near, where)}</p>
    <div class="gs-actions">
      <button
        type="button"
        class="btn btn-primary btn-big"
        data-lexp-open
        ${near ? "" : "disabled"}
      >
        ${a ? I.T(`Open: ${a.title.en}`, `Abrir: ${a.title.es}`) : I.T("Open the gate", "Abrir la puerta")}
      </button>
      <button type="button" class="btn" data-lexp-go>
        ${I.T(a ? "Walk me to the next stop" : "Walk me to the gate", a ? "Llévame a la siguiente parada" : "Llévame a la puerta")}
      </button>
    </div>
    <p class="lexp-count" data-lexp-count>${countText(I, b, got, mine.length)}</p>
    ${newGearHTML(s, env)}${soundBtnHTML(I)}
    <p class="lexp-keys-help">
      ${I.T("Keys: ← → or A D to walk · ↑, W or Space to jump · Enter to open.", "Teclas: ← → o A D para caminar · ↑, W o Espacio para saltar · Enter para abrir.")}
    </p>
  </div>`;
}

const typing = (t) => t?.closest?.("input, textarea, select, [contenteditable]");
const onControl = (t) => t?.closest?.("button, a, summary");

/** Starts steering in walk mode. `live.x` follows the explorer so a later re-render resumes from the same spot. */
export function drive(root, scene, s, env, b, live, where) {
  const I = env.I;
  const hero = scene.querySelector(".lexp-hero");
  const ui = {
    open: root.querySelector("[data-lexp-open]"),
    status: root.querySelector("[data-lexp-status]"),
    count: root.querySelector("[data-lexp-count]"),
  };
  const [lo, hi] = bounds(s.land);
  const mine = gems(b).filter((g) => g.land === s.land);
  const held = { l: false, r: false };
  let tap = 0;
  let tapDir = 0;
  let jy = 0;
  let vy = 0;
  let last = 0;
  let raf = 0;
  let near = isNear(s);
  scene.classList.add("is-driving");
  // feel: gamepad, phone trail controls and sound share this loop's steering.
  const fx = feelDrive(root, b, I, { jump: () => jump(), open: () => near && ui.open?.click() });

  const jump = () => {
    if (jy > 0) return;
    vy = JUMP_V;
    jy = 0.01;
  };
  const refresh = () => {
    if (ui.open) ui.open.disabled = !near;
    fx.near(near); // feel: phone Open button
    if (ui.status) ui.status.innerHTML = statusText(I, near, where);
    if (ui.count) {
      const got = mine.filter((g) => s.got.includes(g.id)).length;
      ui.count.innerHTML = countText(I, b, got, mine.length);
    }
  };
  const frame = (t) => {
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0);
    last = t;
    if (tap > 0) tap -= dt;
    const pd = fx.poll(); // feel: gamepad
    const dir = (held.r ? 1 : 0) - (held.l ? 1 : 0) || pd || (tap > 0 ? tapDir : 0);
    if (dir) {
      s.x = Math.min(hi, Math.max(lo, s.x + dir * SPEED * dt));
      hero?.classList.toggle("is-back", dir < 0);
    }
    hero?.classList.toggle("is-walking", Boolean(dir) && jy === 0);
    if (jy > 0) {
      vy -= GRAV * dt;
      jy = Math.max(0, jy + vy * dt);
      if (jy === 0) vy = 0;
    }
    hero?.style.setProperty("--lexp-jump", `${((jy * scene.clientHeight) / H).toFixed(1)}px`);
    aim(scene, s.x);
    live.x = s.x;
    let dirty = false;
    for (const g of mine) {
      if (s.got.includes(g.id) || Math.abs(g.x - s.x) > 75) continue;
      if (g.y > HERO_TOP - jy - 40 && g.y < HERO_FOOT - jy) {
        s.got.push(g.id);
        scene.querySelector(`[data-gem="${g.id}"]`)?.classList.add("is-got");
        dirty = true;
        fx.gathered(); // feel: chime
      }
    }
    const n = isNear(s);
    if (n !== near) {
      near = n;
      dirty = true;
    }
    if (dirty) refresh();
    raf = requestAnimationFrame(frame);
  };

  const down = (e) => {
    if (typing(e.target)) return;
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") held.l = true;
    else if (k === "ArrowRight" || k === "d" || k === "D") held.r = true;
    else if (k === "ArrowUp" || k === "w" || k === "W" || (k === " " && !onControl(e.target)))
      jump();
    else if (k === "Enter" && !onControl(e.target) && near) ui.open?.click();
    else return;
    e.preventDefault();
  };
  const up = (e) => {
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") held.l = false;
    if (k === "ArrowRight" || k === "d" || k === "D") held.r = false;
  };
  // Walk buttons: hold to keep walking (pointer); a keyboard press or a quick tap moves one step.
  const press = (e) => {
    const btn = e.target.closest?.("[data-lexp-move], [data-lexp-jump]");
    if (!btn) return;
    if (btn.hasAttribute("data-lexp-jump")) return jump();
    btn.setPointerCapture?.(e.pointerId);
    if (btn.dataset.lexpMove === "1") held.r = true;
    else held.l = true;
  };
  const release = () => {
    held.l = false;
    held.r = false;
  };
  const keyClick = (e) => {
    const btn = e.target.closest?.("[data-lexp-move], [data-lexp-jump]");
    if (!btn || e.detail !== 0) return; // pointer clicks were already handled by press/release
    if (btn.hasAttribute("data-lexp-jump")) return jump();
    tapDir = Number(btn.dataset.lexpMove) || 0;
    tap = TAP;
  };
  // feel: the panel pad and the phone trail controls over the scene share the same handlers.
  const pads = root.querySelectorAll(".lexp-pad, .lexp-feel-tpad");
  document.addEventListener("keydown", down);
  document.addEventListener("keyup", up);
  window.addEventListener("blur", release);
  for (const pad of pads) {
    pad.addEventListener("pointerdown", press);
    pad.addEventListener("pointerup", release);
    pad.addEventListener("pointercancel", release);
    pad.addEventListener("lostpointercapture", release);
    pad.addEventListener("click", keyClick);
  }
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    fx.stop(); // feel
    document.removeEventListener("keydown", down);
    document.removeEventListener("keyup", up);
    window.removeEventListener("blur", release);
    hero?.classList.remove("is-walking");
    hero?.style.removeProperty("--lexp-jump");
    scene.classList.remove("is-driving");
  };
}
