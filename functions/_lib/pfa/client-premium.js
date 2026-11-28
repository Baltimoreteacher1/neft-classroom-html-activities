// Browser half of the premium layer (markup in premium.js). Concatenated AFTER client-runtime.js into
// the same inline module by scripts/pfa/build-pfa-bundle.mjs, so it runs once the runtime has booted
// and reads the runtime's state through `runtime`. Everything is progressive: without this script the
// pages still work, and nothing here is printed. Motion is transform/opacity and respects reduced().

import { runtime } from "./client-runtime.js";
import { bi } from "./problem-view.js";
import { t, UI } from "./strings.js";

const pdoc = document;
const RT = runtime;
const Lx = (o) => (o ? (o[RT.lang()] ?? o.en) : "");

// ---- homework trail and medals ------------------------------------------------------------------
const trailStops = [...pdoc.querySelectorAll(".trail-stop[data-pid]")];
const prevStatus = {};
let medalsReady = false;

function stopStatus(pid) {
  const rec = RT.state.p[pid];
  if (rec?.ok) return rec.tries === 1 ? "first" : "done";
  return rec?.tries ? "trying" : "new";
}
const STATUS_KEY = {
  new: "trailNotStarted",
  trying: "trailTrying",
  done: "trailSolved",
  first: "trailFirstTry",
};

function paintTrail() {
  for (const li of trailStops) {
    const st = stopStatus(li.dataset.pid);
    li.classList.toggle("is-done", st === "done" || st === "first");
    li.classList.toggle("is-first", st === "first");
    li.classList.toggle("is-trying", st === "trying");
    if (prevStatus[li.dataset.pid] && prevStatus[li.dataset.pid] !== st && !RT.reduced()) {
      li.classList.remove("pop");
      void li.offsetWidth;
      li.classList.add("pop");
    }
    if (prevStatus[li.dataset.pid] !== st)
      li.querySelector(".trail-state").innerHTML = bi(STATUS_KEY[st]);
    prevStatus[li.dataset.pid] = st;
  }
  const next = trailStops.find((li) => !li.classList.contains("is-done"));
  for (const li of trailStops) li.classList.toggle("is-next", li === next);
  paintMedals();
}

function tierComplete(tier) {
  const stops = trailStops.filter((li) => li.classList.contains(`t${tier}`));
  return stops.length > 0 && stops.every((li) => RT.state.p[li.dataset.pid]?.ok);
}

function paintMedals() {
  for (const tier of [1, 2, 3]) {
    const earned = tierComplete(tier);
    for (const m of pdoc.querySelectorAll(`.medal[data-tier="${tier}"]`)) {
      const was = m.classList.contains("is-earned");
      m.classList.toggle("is-earned", earned);
      m.classList.toggle("is-locked", !earned);
      m.querySelector(".medal-state").innerHTML = bi(earned ? "medalHave" : "medalLocked");
      if (earned && !was && medalsReady && !RT.reduced()) m.classList.add("just-earned");
    }
    for (const g of pdoc.querySelectorAll(`.trail-gate[data-tier="${tier}"]`))
      g.classList.toggle("is-earned", earned);
    const card = pdoc.querySelector(`[data-tier-done="${tier}"]`);
    if (card) {
      const wasHidden = card.hidden;
      card.hidden = !earned;
      if (earned && wasHidden && medalsReady) {
        if (!RT.reduced()) card.classList.add("just-earned");
        RT.announce(Lx(UI[`medalEarned${tier}`]));
      }
    }
  }
  medalsReady = true;
}

// ---- finish: ring of how it went ---------------------------------------------------------------
const CIRC = 2 * Math.PI * 46;
function paintRing() {
  const wrap = pdoc.querySelector("#finish .ring-wrap");
  if (!wrap) return;
  const total = RT.counted.length || 1;
  const a = RT.counted.filter((id) => RT.state.p[id]?.ok && RT.state.p[id].tries === 1).length;
  const b = RT.counted.filter((id) => RT.state.p[id]?.ok && RT.state.p[id].tries > 1).length;
  const c = RT.counted.length - a - b;
  const la = (CIRC * a) / total;
  const lb = (CIRC * b) / total;
  const ra = wrap.querySelector(".ring-a");
  const rb = wrap.querySelector(".ring-b");
  ra.setAttribute("stroke-dasharray", `${la} ${CIRC}`);
  rb.setAttribute("stroke-dasharray", `${lb} ${CIRC}`);
  rb.setAttribute("stroke-dashoffset", String(-la));
  wrap.querySelector(".ring-num").textContent = `${a + b}/${RT.counted.length}`;
  wrap.querySelector(".rl-a").textContent = String(a);
  wrap.querySelector(".rl-b").textContent = String(b);
  wrap.querySelector(".rl-c").textContent = String(c);
  const sec = pdoc.getElementById("finish");
  sec.classList.remove("is-celebrating");
  void sec.offsetWidth;
  if (!RT.reduced()) sec.classList.add("is-celebrating");
}

// ---- scratch pad ---------------------------------------------------------------------------------
const PENS = [
  ["navy", "#17324D", "penNavy"],
  ["teal", "#177B78", "penTeal"],
  ["amber", "#D9A23A", "penAmber"],
];
function toolBtn(act, label, svgPath, pressed = null) {
  return `<button class="tool-pad" type="button" data-pad="${act}"${pressed == null ? "" : ` aria-pressed="${pressed}"`}><svg viewBox="0 0 24 24" class="ico" aria-hidden="true" focusable="false">${svgPath}</svg><span class="sr">${bi(label)}</span></button>`;
}
function openPad(btn) {
  const card = btn.closest(".problem");
  let pad = card.querySelector(".pad");
  if (pad) {
    pad.hidden = !pad.hidden;
    btn.setAttribute("aria-expanded", String(!pad.hidden));
    if (!pad.hidden) pad._fit();
    return;
  }
  pad = pdoc.createElement("div");
  pad.className = "pad no-print";
  const pens = PENS.map(([k, col, label], i) =>
    toolBtn(
      `pen-${k}`,
      label,
      `<circle cx="12" cy="12" r="7" fill="${col}" stroke="currentColor" stroke-width="1.5"/>`,
      i === 0,
    ),
  ).join("");
  pad.innerHTML = `<div class="pad-tools" role="toolbar" aria-label="${UI.sketchTools.en}">${pens}${toolBtn("eraser", "eraser", '<path d="M4 16l8-8 6 6-6 6H8zM12 20h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>', false)}<span class="pad-sep" aria-hidden="true"></span>${toolBtn("grid", "gridPad", '<path d="M4 4h16v16H4zM4 10h16M4 15h16M10 4v16M15 4v16" fill="none" stroke="currentColor" stroke-width="1.6"/>', true)}${toolBtn("undo", "undo", '<path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')}${toolBtn("clear", "clearPad", '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>')}${toolBtn("close", "closePad", '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>')}</div><div class="pad-paper is-grid"><canvas role="img" aria-label="${t("sketchPad", RT.lang(), { n: btn.dataset.n })}"></canvas></div>`;
  card.querySelector(".actions").after(pad);
  btn.setAttribute("aria-expanded", "true");
  initPad(pad, btn);
}

function initPad(pad, opener) {
  const canvas = pad.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const strokes = [];
  let pen = PENS[0][1];
  let erase = false;
  let live = null;
  function fit() {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }
  function drawStroke(s) {
    const pts = s.pts;
    if (!pts.length) return;
    ctx.globalCompositeOperation = s.erase ? "destination-out" : "source-over";
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, s.w / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    // Quadratic curves through the midpoints: smooth ink without a library.
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const mid0 = i > 1 ? { x: (pts[i - 2].x + p0.x) / 2, y: (pts[i - 2].y + p0.y) / 2 } : p0;
      const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      ctx.lineWidth = s.erase ? 22 : s.w * (0.6 + 0.8 * (p1.p ?? 0.5));
      ctx.beginPath();
      ctx.moveTo(mid0.x, mid0.y);
      ctx.quadraticCurveTo(p0.x, p0.y, mid1.x, mid1.y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokes) drawStroke(s);
  }
  const at = (e) => {
    const box = canvas.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top, p: e.pressure || 0.5 };
  };
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    canvas.setPointerCapture(e.pointerId);
    live = { color: pen, erase, w: 3.2, pts: [at(e)] };
    strokes.push(live);
    redraw();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!live) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs) live.pts.push(at(ev));
    redraw();
  });
  const end = () => {
    live = null;
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  pad.querySelector(".pad-tools").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pad]");
    if (!b) return;
    const a = b.dataset.pad;
    if (a.startsWith("pen-") || a === "eraser") {
      erase = a === "eraser";
      if (!erase) pen = PENS.find(([k]) => `pen-${k}` === a)[1];
      for (const x of pad.querySelectorAll('[data-pad^="pen-"],[data-pad="eraser"]'))
        x.setAttribute("aria-pressed", String(x === b));
    }
    if (a === "grid") {
      const on = pad.querySelector(".pad-paper").classList.toggle("is-grid");
      b.setAttribute("aria-pressed", String(on));
    }
    if (a === "undo") {
      strokes.pop();
      redraw();
    }
    if (a === "clear") {
      strokes.length = 0;
      redraw();
    }
    if (a === "close") {
      pad.hidden = true;
      opener.setAttribute("aria-expanded", "false");
      opener.focus();
    }
  });
  pad._fit = fit;
  addEventListener("resize", () => !pad.hidden && fit());
  fit();
}

// ---- family guide: tonight's plan, plant, try meter ---------------------------------------------
const FKEY = `ewl_pfa_${RT.LESSON}_fam`;
const planSec = pdoc.querySelector(".fam-plan");
const fam = (() => {
  const s = RT.storage.get(FKEY, null);
  return s && s.v === 1 && Array.isArray(s.s)
    ? s
    : { v: 1, s: [false, false, false, false], t: [] };
})();

function paintPlan(celebrate = false) {
  if (!planSec) return;
  const done = fam.s.filter(Boolean).length;
  planSec.dataset.stage = String(done);
  for (const b of planSec.querySelectorAll(".plan-done")) {
    const on = !!fam.s[Number(b.dataset.k)];
    b.setAttribute("aria-pressed", String(on));
    b.closest(".plan-step").classList.toggle("is-done", on);
  }
  const meter = planSec.querySelector(".plan-meter");
  const all = done === fam.s.length;
  meter.innerHTML = all ? bi("planAll") : bi("planMeter", "span", { done, n: fam.s.length });
  planSec.classList.toggle("is-bloomed", all);
  if (all && celebrate) RT.confetti(planSec);
}
function setStep(k, on) {
  fam.s[k] = on;
  RT.storage.set(FKEY, fam);
  paintPlan(on);
}

const tryDetails = [...pdoc.querySelectorAll(".try-section details.reveal")];
function paintTried() {
  const m = pdoc.querySelector(".tried-meter");
  if (!m || !tryDetails.length) return;
  m.hidden = false;
  const done = fam.t.length;
  m.innerHTML = `<span class="tried-dots" aria-hidden="true">${tryDetails.map((_, i) => `<i class="${fam.t.includes(i) ? "on" : ""}"></i>`).join("")}</span>${bi("tried", "span", { done, n: tryDetails.length })}`;
}
tryDetails.forEach((d, i) =>
  d.addEventListener("toggle", () => {
    if (!d.open || fam.t.includes(i)) return;
    fam.t.push(i);
    RT.storage.set(FKEY, fam);
    paintTried();
    if (fam.t.length === tryDetails.length && !fam.s[2]) setStep(2, true);
  }),
);

// ---- family guide: conversation deck -------------------------------------------------------------
function initDeck(ul) {
  const cards = [...ul.children];
  if (cards.length < 2) return;
  let i = 0;
  const wrap = pdoc.createElement("div");
  wrap.className = "deck";
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-roledescription", "carousel");
  wrap.setAttribute("aria-label", UI.famTalk.en);
  ul.before(wrap);
  wrap.append(ul);
  ul.classList.add("is-deck");
  const nav = pdoc.createElement("div");
  nav.className = "deck-nav no-print";
  nav.innerHTML = `<button class="btn quiet" type="button" data-deck="prev"><svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><span class="sr">${bi("deckPrev")}</span></button><span class="deck-count" aria-live="polite"></span><button class="btn primary" type="button" data-deck="next"><span>${bi("deckNext")}</span><svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button><p class="tier-note deck-hint">${bi("deckHint")}</p>`;
  wrap.append(nav);
  function paint() {
    cards.forEach((li, k) => {
      const depth = (k - i + cards.length) % cards.length;
      li.dataset.depth = String(Math.min(depth, 3));
      const cur = depth === 0;
      li.toggleAttribute("inert", !cur);
      li.setAttribute("aria-hidden", String(!cur));
    });
    nav.querySelector(".deck-count").innerHTML = bi("deckOf", "span", {
      i: i + 1,
      n: cards.length,
    });
  }
  function go(step) {
    i = (i + step + cards.length) % cards.length;
    paint();
  }
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("[data-deck]");
    if (b) go(b.dataset.deck === "next" ? 1 : -1);
  });
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  });
  // Swipe: the top card follows the finger (transform only) and flies on past 60px.
  ul.addEventListener("pointerdown", (e) => {
    const top = cards[i];
    if (!top.contains(e.target) || e.button > 0) return;
    const sx = e.clientX;
    let dx = 0;
    top.classList.add("is-dragging");
    const move = (ev) => {
      dx = ev.clientX - sx;
      top.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
    };
    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      top.classList.remove("is-dragging");
      top.style.transform = "";
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  });
  paint();
}

// ---- family unit path and unit meters ---------------------------------------------------------------
function lessonDone(lid) {
  const s = RT.storage.get(`ewl_pfa_${lid}_fam`, null);
  return !!(s && Array.isArray(s.s) && s.s.length && s.s.every(Boolean));
}
function paintUnitPaths() {
  for (const li of pdoc.querySelectorAll(".map-stop[data-lid]")) {
    const done = lessonDone(li.dataset.lid);
    li.classList.toggle("is-done", done);
    li.querySelector(".trail-state").innerHTML = bi(done ? "mapDone" : "mapNotYet");
  }
  for (const m of pdoc.querySelectorAll(".map-meter[data-lids]")) {
    const lids = m.dataset.lids.split(",").filter(Boolean);
    const done = lids.filter(lessonDone).length;
    m.innerHTML = `<span class="map-bar" aria-hidden="true"><span style="transform:scaleX(${lids.length ? done / lids.length : 0})"></span></span>${bi("mapMeter", "span", { done, n: lids.length })}`;
  }
}

// ---- boot ------------------------------------------------------------------------------------------
function premiumBoot() {
  if (trailStops.length) {
    paintTrail();
    pdoc.addEventListener("pfa:progress", paintTrail);
    pdoc.addEventListener("pfa:finish", paintRing);
  }
  pdoc.addEventListener("click", (e) => {
    const b = e.target.closest('[data-act="sketch"],[data-act="plan"]');
    if (!b) return;
    if (b.dataset.act === "sketch") openPad(b);
    else setStep(Number(b.dataset.k), b.getAttribute("aria-pressed") !== "true");
  });
  paintPlan();
  paintTried();
  for (const ul of pdoc.querySelectorAll("ul[data-deck]")) initDeck(ul);
  paintUnitPaths();
  pdoc.addEventListener("animationend", (e) => {
    if (e.animationName === "pop-node") e.target.closest?.(".pop")?.classList.remove("pop");
    // The shine is the last beat of an earned medal; clear the class after it so it can replay.
    if (e.animationName === "shine")
      e.target.closest?.(".just-earned")?.classList.remove("just-earned");
  });
}
premiumBoot();
