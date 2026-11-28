// Browser runtime for the PFA pages. Concatenated after generators.js, math-visuals.js, strings.js
// and problem-view.js into one inline module by scripts/pfa/build-pfa-bundle.mjs, so the names those
// files define (generate, matches, renderVisual, UI, t, bi, genBody, workedExample, genCheck, h) are
// in scope here. No network requests, no external libraries.

import { generate, lineAccepts, matches } from "./generators.js";
import { CODE_RE, decodeInsight, encodeInsight, TAG_LIST } from "./insight-code.js";
import { bi, genBody, genCheck, h, workedExample } from "./problem-view.js";
import { t, UI } from "./strings.js";

const doc = document;
const root = doc.documentElement;
const DATA = JSON.parse(doc.getElementById("pfa-data")?.textContent || "{}");
const LESSON = DATA.lessonId || "x";

// Storage wrapper: localStorage when allowed, memory when blocked (private mode, school policy).
const storage = {
  _memory: {},
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      this._memory[key] = value;
    }
  },
  get(key, def = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch {
      return this._memory[key] ?? def;
    }
  },
  del(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      delete this._memory[key];
    }
  },
};
const lang = () => (root.lang === "es" ? "es" : "en");
const L = (o) => (o ? (o[lang()] ?? o.en) : "");
const reduced = () =>
  root.classList.contains("reduce-motion") ||
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- preferences ---------------------------------------------------------------------------
function setLang(l) {
  root.lang = l;
  storage.set("ewl_pfa_lang", l);
  for (const b of doc.querySelectorAll("[data-set-lang]"))
    b.setAttribute("aria-pressed", String(b.dataset.setLang === l));
  speechSynthesis?.cancel?.();
}
function setSize(n) {
  root.classList.remove("text-lg", "text-xl");
  if (n === 1) root.classList.add("text-lg");
  if (n === 2) root.classList.add("text-xl");
  storage.set("ewl_pfa_size", n);
  const b = doc.querySelector('[data-act="text-size"]');
  if (b) b.setAttribute("aria-pressed", String(n > 0));
}
function setMotion(on) {
  root.classList.toggle("reduce-motion", on);
  storage.set("ewl_pfa_motion", on);
  const b = doc.querySelector('[data-act="motion"]');
  if (b) b.setAttribute("aria-pressed", String(on));
}

// ---- read aloud (Web Speech API; hidden when unsupported) -------------------------------------
const canSpeak = "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
function visibleText(el) {
  const clone = el.cloneNode(true);
  for (const n of clone.querySelectorAll(
    `.lang-${lang() === "en" ? "es" : "en"}, svg, button, .sr, script`,
  ))
    n.remove();
  return clone.textContent.replace(/\s+/g, " ").replace(/×/g, " times ").trim();
}
function say(text) {
  if (!canSpeak || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang() === "es" ? "es-US" : "en-US";
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

// ---- live region ------------------------------------------------------------------------------
const live = doc.getElementById("pfa-live");
const announce = (msg) => {
  if (!live) return;
  live.textContent = "";
  setTimeout(() => {
    live.textContent = msg;
  }, 30);
};

// ---- worked-example player --------------------------------------------------------------------
function initPlayer(pl) {
  const items = [...pl.querySelectorAll(".steps li")];
  const marks = [...pl.querySelectorAll(".mv .mv-step")].sort(
    (a, b) => Number(a.dataset.step) - Number(b.dataset.step),
  );
  const status = pl.querySelector(".player-status");
  const pips = [...pl.querySelectorAll(".pip")];
  const n = items.length;
  let i = n; // fully shown until the student asks to step through it
  let timer = null;
  const playBtn = pl.querySelector('[data-player="play"]');
  function render() {
    items.forEach((li, k) => {
      li.classList.toggle("is-hidden", k >= i);
      li.classList.toggle(
        "is-current",
        k === i - 1 && i < n + 1 && pl.classList.contains("is-stepping"),
      );
      li.setAttribute("aria-hidden", String(k >= i));
    });
    const share = n ? Math.ceil((marks.length * i) / n) : marks.length;
    marks.forEach((m, k) => m.classList.toggle("is-hidden", k >= share));
    pips.forEach((p, k) => {
      p.classList.toggle("is-on", k < i);
      if (k === i - 1) p.setAttribute("aria-current", "step");
      else p.removeAttribute("aria-current");
    });
    if (status) status.textContent = t("stepOf", lang(), { i: Math.max(1, i), n });
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    if (playBtn) {
      playBtn.setAttribute("aria-pressed", "false");
      playBtn.querySelector(".lbl").innerHTML = bi("play");
    }
  }
  function go(k) {
    pl.classList.add("is-stepping");
    i = Math.max(1, Math.min(n, k));
    render();
    const li = items[i - 1];
    if (li) {
      const text = visibleText(li);
      announce(`${t("stepOf", lang(), { i, n })}. ${text}`);
      if (pl.dataset.narrate === "1") say(text);
    }
  }
  pl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-player]");
    if (!b) return;
    const a = b.dataset.player;
    if (a === "pip") {
      stop();
      go(Number(b.dataset.k));
    }
    if (a === "next") go(i + 1);
    if (a === "prev") go(i - 1);
    if (a === "again" || a === "replay") {
      stop();
      go(1);
    }
    if (a === "narrate") {
      const on = pl.dataset.narrate !== "1";
      pl.dataset.narrate = on ? "1" : "0";
      b.setAttribute("aria-pressed", String(on));
      if (on && items[i - 1]) say(visibleText(items[i - 1]));
      else speechSynthesis?.cancel?.();
    }
    if (a === "play") {
      if (timer) return stop();
      if (i >= n || !pl.classList.contains("is-stepping")) go(1);
      b.setAttribute("aria-pressed", "true");
      b.querySelector(".lbl").innerHTML = bi("pause");
      // Reduced motion: still steps (no information lost) but each frame appears instantly.
      timer = setInterval(() => (i >= n ? stop() : go(i + 1)), 2600);
    }
  });
  render();
}

// ---- homework problems ------------------------------------------------------------------------
const KEY = `ewl_pfa_${LESSON}_hw`;
// v2: number-line and table items joined the sets (2026-11-27), which renumbered problem ids, so a
// v1 save could mark the wrong problem solved. Older saves are discarded, never misapplied.
const STATE_VERSION = 2;
const saved = storage.get(KEY, null);
const state =
  saved && saved.v === STATE_VERSION ? saved : { v: STATE_VERSION, p: {}, conf: null, done: false };
const problems = DATA.problems || {};
const counted = Object.keys(problems).filter((id) => problems[id].counted !== false);
let streak = 0;
let extraSeed = Date.now() % 100000;

function save() {
  storage.set(KEY, state);
  // Canvas SCORM bridge, only when a page is launched inside it (existing public API, unchanged).
  if (typeof window.reportScore === "function") {
    try {
      window.reportScore(Math.round((100 * scoreFirstTry()) / Math.max(1, counted.length)));
    } catch {}
  }
}
const scoreFirstTry = () =>
  counted.filter((id) => state.p[id]?.ok && state.p[id]?.tries === 1).length;
function updateProgress() {
  const done = counted.filter((id) => state.p[id]?.ok).length;
  const fill = doc.querySelector(".progress-fill");
  if (fill) fill.style.transform = `scaleX(${counted.length ? done / counted.length : 0})`;
  const lab = doc.querySelector(".progress-label");
  if (lab) lab.innerHTML = bi("progress", "span", { done, total: counted.length });
  const bar = doc.querySelector(".progress-track");
  if (bar) bar.setAttribute("aria-valuenow", String(done));
  doc.dispatchEvent(new CustomEvent("pfa:progress"));
}

function readValue(card, d) {
  if (d.kind === "mc" || d.kind === "mc-gen" || d.kind === "error") {
    const r = card.querySelector("input[type=radio]:checked");
    return r ? r.value : null;
  }
  if (d.kind === "select")
    return [...card.querySelectorAll("input[type=checkbox]")].map((c) => c.checked);
  if (d.kind === "match") return card._pairs || {};
  if (d.kind === "explain") return card.querySelector("textarea")?.value || "";
  if (d.kind === "table")
    return [...card.querySelectorAll("input[data-blank]")].map((x) => x.value);
  if (d.kind === "line") {
    const r = card.querySelector(".nl-range");
    return r?.dataset.moved ? r.value : "";
  }
  return card.querySelector("input[type=text]")?.value || "";
}

function judge(d, v) {
  if (d.kind === "mc" || d.kind === "error")
    return { ok: v != null && Number(v) === d.correct, chosen: v };
  if (d.kind === "mc-gen")
    return { ok: v != null && matches(d.answerType, d.answer, v), chosen: v };
  if (d.kind === "select") return { ok: Array.isArray(v) && v.every((x, i) => x === d.correct[i]) };
  if (d.kind === "match")
    return { ok: d.pairs.every((_, i) => v[i] === i) && Object.keys(v).length === d.pairs.length };
  if (d.kind === "explain") return { ok: v.trim().split(/\s+/).length >= 8 };
  if (d.kind === "table") {
    const cells = d.blanks.map((a, i) => matches("number", a, v[i]));
    return { ok: cells.every(Boolean), cells };
  }
  if (d.kind === "line") return { ok: lineAccepts(d, v) };
  return { ok: matches(d.answerType, d.answer, v) };
}

// The misconception tag of a wrong answer, when the answer matches a known mistake.
function wrongTag(d, v) {
  if (d.kind === "mc" && v != null) return d.tags?.[Number(v)] || null;
  if ((d.kind === "entry" || d.kind === "mc-gen" || d.kind === "line") && d.known) {
    const hit = d.known.find((k) => matches(d.answerType, k.value, v));
    return hit?.tag || null;
  }
  return null;
}

// Wrong-answer feedback that names the misconception when the answer matches a known one.
function misconceptionFeedback(d, v) {
  if (d.kind === "mc" && v != null) return d.why?.[Number(v)] || null;
  if ((d.kind === "entry" || d.kind === "mc-gen" || d.kind === "line") && d.known) {
    const hit = d.known.find((k) => matches(d.answerType, k.value, v));
    return hit ? hit.why : null;
  }
  return null;
}

const ICON_OK =
  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_ERR =
  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 6v8M12 18v.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';

function showFeedback(card, ok, extraHtml) {
  const fb = card.querySelector(".feedback");
  fb.className = `feedback is-on ${ok ? "ok" : "err"}`;
  fb.innerHTML = `<span class="fb-icon">${ok ? ICON_OK : ICON_ERR}</span><div><strong>${bi(ok ? "correct" : "notYet")}</strong>${extraHtml || ""}</div>`;
  announce(visibleText(fb));
}

function showHint(card, d, level, pid) {
  const slot = card.querySelector(".hint-slot");
  if (!slot) return;
  let body;
  let title;
  if (level === 1) {
    title = "hint1";
    body = `<p>${bi(d.hints?.conceptual || { en: "", es: "" })}</p>`;
  } else if (level === 2) {
    title = "hint2";
    body = `<p>${bi(d.hints?.procedural || { en: "", es: "" })}</p>`;
  } else {
    title = "hint3";
    const seed = (hashSeed(pid) + 7919 * level) % 100000;
    body = `<p class="hint-note">${bi("hint3Note")}</p>${workedExample(d.similarSpec || DATA.similar, seed)}`;
  }
  slot.innerHTML = `<div class="hint" role="note">${DATA.guideThink || ""}<h4>${bi(title)}</h4>${body}</div>`;
  announce(visibleText(slot));
}
function hashSeed(s) {
  let x = 0;
  for (const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return x;
}

function burst(card) {
  if (reduced()) return;
  const b = doc.createElement("span");
  b.className = "burst";
  for (let k = 0; k < 10; k++) {
    const i = doc.createElement("i");
    const a = (k / 10) * Math.PI * 2;
    i.style.setProperty("--dx", `${Math.cos(a) * 40}px`);
    i.style.setProperty("--dy", `${Math.sin(a) * 40}px`);
    b.append(i);
  }
  card.append(b);
  setTimeout(() => b.remove(), 800);
}

function check(card) {
  const pid = card.dataset.pid;
  const d = problems[pid] || card._data;
  if (!d) return;
  const v = readValue(card, d);
  const empty =
    v == null ||
    v === "" ||
    (Array.isArray(v) && d.kind === "select" && !v.some(Boolean)) ||
    (Array.isArray(v) && d.kind === "table" && v.every((x) => !String(x).trim()));
  if (empty) {
    announce(L(UI.yourAnswer));
    card.querySelector("input,textarea,button.chip")?.focus();
    return;
  }
  const rec = (state.p[pid] ||= { tries: 0, ok: false });
  if (rec.ok && !card._extra) return;
  const res = judge(d, v);
  rec.tries += 1;
  rec.v = typeof v === "string" ? v.slice(0, 120) : v;
  if (d.kind === "explain") {
    if (!res.ok) {
      showFeedback(card, false, `<p>${bi("needMore")}</p>`);
      return;
    }
    rec.ok = true;
    showFeedback(card, true, `<p><strong>${bi("model")}:</strong> ${bi(d.model)}</p>`);
  } else if (res.ok) {
    rec.ok = true;
    card.classList.add("is-correct");
    const sol = d.solution
      ? `<details class="reveal"><summary>${bi("why")}</summary><div class="reveal-body">${bi({ en: (d.solution.en || []).join(" "), es: (d.solution.es || []).join(" ") }, "p")}</div></details>`
      : "";
    const fix =
      d.kind === "error" && d.fix ? `<p><strong>${bi("fixIt")}:</strong> ${bi(d.fix)}</p>` : "";
    showFeedback(card, true, fix + sol);
    if (rec.tries === 1) {
      streak += 1;
      if (streak >= 3) {
        burst(card);
        const s = doc.querySelector(".streak");
        if (s) {
          s.hidden = false;
          s.innerHTML = bi("streak", "span", { n: streak });
        }
      }
    } else streak = 0;
    for (const el of card.querySelectorAll("input,textarea"))
      el.setAttribute("aria-invalid", "false");
  } else {
    streak = 0;
    card.classList.remove("shake");
    void card.offsetWidth;
    if (!reduced()) card.classList.add("shake");
    const mis = misconceptionFeedback(d, v);
    // Remember WHICH mistake this was (as a TAG_LIST index, to keep the save small) for the
    // finish-card coach and the class code. Only answers that match a known mistake count.
    const tag = wrongTag(d, v);
    if (tag && !card._extra) {
      const ti = TAG_LIST.indexOf(tag);
      if (ti >= 0) rec.m = [...(rec.m || []), ti].slice(-3);
    }
    let extra = mis ? `<p>${bi(mis)}</p>` : "";
    if (d.kind === "table") {
      const right = res.cells.filter(Boolean).length;
      extra += `<p>${bi({ en: `${right} of ${res.cells.length} cells are right. Fix the cells outlined in red.`, es: `${right} de ${res.cells.length} casillas están bien. Corrige las casillas marcadas en rojo.` })}</p>`;
      card
        .querySelectorAll("input[data-blank]")
        .forEach((el, i) => el.setAttribute("aria-invalid", String(!res.cells[i])));
    } else {
      for (const el of card.querySelectorAll("input[type=text],textarea"))
        el.setAttribute("aria-invalid", "true");
    }
    showFeedback(card, false, extra);
    showHint(card, d, Math.min(3, rec.tries), pid);
  }
  if (!card._extra) {
    save();
    updateProgress();
  }
}

// Match: tap-to-pair, with pointer drag that snaps onto a target. Keyboard: Enter/Space on chips.
function initMatch(card) {
  card._pairs = card._pairs || {};
  let sel = null;
  const lefts = [...card.querySelectorAll('.chip[data-side="l"]')];
  const rights = [...card.querySelectorAll('.chip[data-side="r"]')];
  function paint() {
    for (const l of lefts) {
      const r = card._pairs[l.dataset.i];
      l.classList.toggle("is-paired", r != null);
      l.querySelector(".pair-tag").textContent =
        r != null
          ? String.fromCharCode(65 + Number(rights.findIndex((x) => Number(x.dataset.i) === r)))
          : "";
    }
    rights.forEach((r, k) => {
      const paired = Object.values(card._pairs).includes(Number(r.dataset.i));
      r.classList.toggle("is-paired", paired);
      r.querySelector(".pair-tag").textContent = String.fromCharCode(65 + k);
    });
  }
  function pick(chip) {
    if (chip.dataset.side === "l") {
      sel = chip;
      for (const l of lefts) l.setAttribute("aria-pressed", String(l === chip));
    } else if (sel) {
      for (const k of Object.keys(card._pairs))
        if (card._pairs[k] === Number(chip.dataset.i)) delete card._pairs[k];
      card._pairs[sel.dataset.i] = Number(chip.dataset.i);
      sel.setAttribute("aria-pressed", "false");
      announce(`${visibleText(sel)} → ${visibleText(chip)}`);
      sel = null;
      paint();
    }
  }
  card.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip && !card._dragged) pick(chip);
    card._dragged = false;
  });
  for (const l of lefts) {
    l.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const sx = e.clientX;
      const sy = e.clientY;
      let moved = false;
      const move = (ev) => {
        const dx = ev.clientX - sx;
        const dy = ev.clientY - sy;
        if (!moved && Math.hypot(dx, dy) < 8) return;
        moved = true;
        l.classList.add("is-dragging");
        l.style.transform = `translate(${dx}px, ${dy}px)`;
      };
      const up = (ev) => {
        removeEventListener("pointermove", move);
        removeEventListener("pointerup", up);
        l.classList.remove("is-dragging");
        l.style.transform = "";
        if (!moved) return;
        card._dragged = true;
        const target = doc
          .elementFromPoint(ev.clientX, ev.clientY)
          ?.closest('.chip[data-side="r"]');
        if (target && card.contains(target)) {
          sel = l;
          pick(target);
          target.animate?.([{ transform: "scale(1.06)" }, { transform: "scale(1)" }], {
            duration: reduced() ? 0 : 220,
            easing: "ease-out",
          });
        }
      };
      addEventListener("pointermove", move);
      addEventListener("pointerup", up);
    });
  }
  paint();
}

// "Try a similar problem": extra practice card from the lesson's generator, never counted.
function addSimilar(afterCard, opts = {}) {
  extraSeed = (extraSeed * 1103515245 + 12345) % 100000;
  const origin = problems[afterCard.dataset.pid] || afterCard._data || {};
  const spec = opts.spec || origin.similarSpec || DATA.similar;
  const p = opts.problem || generate(spec, extraSeed);
  const pid = `x${extraSeed}`;
  const card = doc.createElement("article");
  card.className = "problem extra";
  card.dataset.pid = pid;
  card._extra = true;
  card._data = {
    ...genCheck(p),
    hints: origin.review ? origin.hints : DATA.lessonHints,
    similarSpec: spec,
  };
  card.setAttribute("aria-labelledby", `${pid}-h`);
  card.innerHTML = `<div class="p-top"><span class="p-num" aria-hidden="true">+</span><h3 id="${pid}-h" class="sr">${bi("extra")}</h3><span>${bi("extra")}</span></div>${opts.note ? `<p class="tier-note">${bi(opts.note)}</p>` : ""}${genBody(p, pid)}<div class="actions"><button class="btn primary" type="button" data-act="check">${bi("check")}</button></div><div class="feedback" id="${pid}-fb" aria-live="off"></div><div class="hint-slot"></div>`;
  afterCard.after(card);
  card.querySelector("input,button")?.focus();
}

// Number line: the native range input is the control; the SVG handle mirrors it (transform only).
function initLine(card) {
  const range = card.querySelector(".nl-range");
  const svg = card.querySelector(".nl-visual svg");
  if (!range || !svg) return;
  const [x0, x1, v0, v1] = (svg.getAttribute("data-scale") || "30,610,0,1").split(",").map(Number);
  const sx = (v) => x0 + ((v - v0) / (v1 - v0)) * (x1 - x0);
  const ns = "http://www.w3.org/2000/svg";
  const handle = doc.createElementNS(ns, "circle");
  handle.setAttribute("class", "mv-handle");
  handle.setAttribute("cx", String(sx(0)));
  handle.setAttribute("cy", "60");
  handle.setAttribute("r", "11");
  handle.setAttribute("aria-hidden", "true");
  svg.append(handle);
  const out = card.querySelector(".nl-value");
  const paint = () => {
    const v = Number(range.value);
    handle.style.transform = `translateX(${sx(v) - sx(0)}px)`;
    if (out) out.textContent = String(v).replace("-", "−");
  };
  range.addEventListener("input", () => {
    range.dataset.moved = "1";
    paint();
  });
  // Tapping the drawn line moves the point there too.
  svg.addEventListener("click", (e) => {
    const box = svg.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * Number(svg.viewBox.baseVal.width || 640);
    const step = Number(range.step) || 1;
    const raw = v0 + ((x - x0) / (x1 - x0)) * (v1 - v0);
    const v = Math.max(
      Number(range.min),
      Math.min(Number(range.max), Math.round(raw / step) * step),
    );
    range.value = String(v);
    range.dataset.moved = "1";
    paint();
    range.focus();
  });
  card._paintLine = paint;
  paint();
}

function restore() {
  for (const card of doc.querySelectorAll(".problem[data-pid]")) {
    const pid = card.dataset.pid;
    const rec = state.p[pid];
    const d = problems[pid];
    if (!rec || !d) continue;
    if (rec.v != null) {
      if (d.kind === "match" && typeof rec.v === "object") card._pairs = { ...rec.v };
      else if (d.kind === "select" && Array.isArray(rec.v))
        card.querySelectorAll("input[type=checkbox]").forEach((c, i) => (c.checked = !!rec.v[i]));
      else if (d.kind === "explain") card.querySelector("textarea").value = rec.v;
      else if (d.kind === "table" && Array.isArray(rec.v))
        card.querySelectorAll("input[data-blank]").forEach((el, i) => (el.value = rec.v[i] ?? ""));
      else if (d.kind === "line") {
        const r = card.querySelector(".nl-range");
        if (r) {
          r.value = String(rec.v);
          r.dataset.moved = "1";
          card._paintLine?.();
        }
      } else if (["mc", "error", "mc-gen"].includes(d.kind)) {
        const r = [...card.querySelectorAll("input[type=radio]")].find(
          (x) => x.value === String(rec.v),
        );
        if (r) r.checked = true;
      } else {
        const inp = card.querySelector("input[type=text]");
        if (inp) inp.value = rec.v;
      }
    }
    if (rec.ok) {
      card.classList.add("is-correct");
      const fb = card.querySelector(".feedback");
      fb.className = "feedback is-on ok";
      fb.innerHTML = `<span class="fb-icon">${ICON_OK}</span><div><strong>${bi("correct")}</strong></div>`;
    }
  }
  if (state.conf) {
    const r = doc.querySelector(`input[name="conf"][value="${state.conf}"]`);
    if (r) r.checked = true;
  }
  const rt = doc.getElementById("reflect-text");
  if (rt && state.reflect) rt.value = state.reflect;
}

function countUp(el, to) {
  if (reduced()) {
    el.textContent = String(to);
    return;
  }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 900);
    el.textContent = String(Math.round(to * k));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function confetti(host) {
  if (reduced()) return;
  const box = doc.createElement("div");
  box.className = "confetti";
  const colors = ["#1fa6a2", "#f2c15b", "#17324d", "#e3f4f3"];
  for (let k = 0; k < 36; k++) {
    const i = doc.createElement("i");
    i.style.left = `${(k * 97) % 100}%`;
    i.style.background = colors[k % 4];
    i.style.setProperty("--dx", `${((k * 37) % 120) - 60}px`);
    i.style.animationDelay = `${(k % 6) * 0.03}s`;
    box.append(i);
  }
  host.append(box);
  setTimeout(() => box.remove(), 1500);
}

function finish() {
  const sec = doc.getElementById("finish");
  if (!sec) return;
  state.done = true;
  save();
  sec.hidden = false;
  const first = scoreFirstTry();
  const total = counted.length;
  countUp(sec.querySelector(".score-num"), first);
  sec.querySelector(".score-total").textContent = String(total);
  const revisit = counted.filter((id) => !(state.p[id]?.ok && state.p[id]?.tries === 1));
  const list = sec.querySelector(".revisit");
  list.innerHTML = revisit.length
    ? revisit
        .map((id) => `<li><a href="#p-${h(id)}">${bi("problem")} ${h(problems[id].n)}</a></li>`)
        .join("")
    : `<li>${bi("nothingToRevisit")}</li>`;
  const card = sec.querySelector(".teacher-card");
  card.querySelector(".tc-date").textContent = new Date().toLocaleDateString(
    lang() === "es" ? "es-US" : "en-US",
  );
  card.querySelector(".tc-score").textContent = `${first} / ${total}`;
  card.querySelector(".tc-conf").textContent = state.conf ? `${state.conf} / 4` : "—";
  card.querySelector(".tc-revisit").textContent = revisit.length
    ? revisit.map((id) => problems[id].n).join(", ")
    : "—";
  renderCoach(sec);
  const tags = mistakeTags()
    .slice(0, 3)
    .map(([tag]) => tag);
  const review = Object.keys(problems).filter(
    (id) => problems[id].review && state.p[id]?.ok && state.p[id]?.tries === 1,
  ).length;
  const code = encodeInsight({
    lessonId: LESSON,
    score: first,
    total,
    conf: state.conf,
    revisit: revisit.map((id) => problems[id].n),
    tags,
    review,
  });
  const codeEl = sec.querySelector(".code");
  if (codeEl) codeEl.textContent = code;
  confetti(sec);
  doc.dispatchEvent(new CustomEvent("pfa:finish"));
  sec.querySelector("h2")?.focus();
}

// Which misconceptions the wrong answers matched, most frequent first.
function mistakeTags() {
  const count = {};
  for (const id of Object.keys(state.p))
    for (const i of state.p[id].m || []) {
      const tag = TAG_LIST[i];
      if (tag) count[tag] = (count[tag] || 0) + 1;
    }
  return Object.entries(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
function renderCoach(sec) {
  const body = sec.querySelector(".coach-body");
  if (!body) return;
  const top = mistakeTags()
    .filter(([tag]) => DATA.tips?.[tag])
    .slice(0, 2);
  body.innerHTML = top.length
    ? `<p>${bi("coachIntro")}</p>${top
        .map(
          ([tag, n]) =>
            `<div class="coach-item"><h4>${bi(DATA.tips[tag].label)}</h4><p class="tier-note">${bi("coachSeen", "span", { n })}</p><p>${bi(DATA.tips[tag].student)}</p><button class="btn primary" type="button" data-act="coach-try" data-tag="${h(tag)}">${bi(DATA.tips[tag].tempt ? "coachTry" : "similar")}</button></div>`,
        )
        .join("")}`
    : `<p>${bi("coachNone")}</p>`;
}
// A fresh problem whose wrong answers include THIS mistake, so the student meets the trap again with
// the coaching fresh in mind. Falls back to an ordinary similar problem when no generator makes it.
function coachTry(btn) {
  const tag = btn.dataset.tag;
  const specs = [
    DATA.similar,
    ...Object.values(problems)
      .map((d) => d.similarSpec)
      .filter(Boolean),
  ].filter(Boolean);
  const item = btn.closest(".coach-item");
  const start = 1 + (Date.now() % 500);
  if (DATA.tips?.[tag]?.tempt)
    for (const spec of specs)
      for (let k = 0; k < 400; k++) {
        const p = generate(spec, start + k);
        if ((p.distractors || []).some((x) => x.tag === tag))
          return addSimilar(item, { spec, problem: p, note: "coachTryNote" });
      }
  // No generator here builds this mistake in: an ordinary similar problem, with no claim about it.
  return addSimilar(item);
}

// ---- class insights (teacher page) --------------------------------------------------------------
function pct(a, b) {
  return b ? Math.round((100 * a) / b) : 0;
}
function insights(text) {
  const out = doc.getElementById("ins-out");
  if (!out) return;
  const found = [];
  const bad = [];
  text.split(/\r?\n/).forEach((line, k) => {
    for (const m of line.matchAll(CODE_RE)) {
      const r = decodeInsight(m[0]);
      if (r.ok) found.push(r);
      else bad.push({ line: k + 1, code: m[0] });
    }
  });
  if (!found.length && !bad.length) {
    out.innerHTML = `<section class="section"><p>${bi("insNone")}</p></section>`;
    announce(L(UI.insNone));
    return;
  }
  const byLesson = {};
  for (const r of found) (byLesson[r.lessonId] ||= []).push(r);
  const sections = Object.entries(byLesson)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([lid, rs]) => insightSection(lid, rs))
    .join("");
  const invalid = bad.length
    ? `<section class="section ins-invalid"><h2>${bi("insInvalid")}</h2><p class="tier-note">${bi("insInvalidNote")}</p><ul>${bad.map((b) => `<li>${bi({ en: "Line", es: "Línea" })} ${b.line}: <code>${h(b.code)}</code></li>`).join("")}</ul></section>`
    : "";
  out.innerHTML = sections + invalid;
  out.querySelector("h2")?.focus();
}
function insightSection(lid, rs) {
  const L1 = DATA.lessons?.[lid];
  const n = rs.length;
  const avg = Math.round(rs.reduce((s, r) => s + pct(r.score, r.total), 0) / n);
  const confs = rs.filter((r) => r.conf);
  const conf = confs.length
    ? (confs.reduce((s, r) => s + r.conf, 0) / confs.length).toFixed(1)
    : "—";
  const review = (rs.reduce((s, r) => s + r.review, 0) / n).toFixed(1);
  const bins = [0, 0, 0, 0];
  for (const r of rs) bins[Math.min(3, Math.floor(pct(r.score, r.total) / 25))]++;
  const binLabel = ["0–24%", "25–49%", "50–74%", "75–100%"];
  const maxBin = Math.max(1, ...bins);
  const spread = `<ul class="ins-bars">${bins.map((b, i) => `<li><span class="ins-bar-label">${binLabel[i]}</span><span class="ins-bar"><span class="ins-bar-fill" style="width:${(100 * b) / maxBin}%"></span></span><span class="ins-bar-n">${b}</span></li>`).join("")}</ul>`;
  const miss = {};
  for (const r of rs) for (const p of r.revisit) miss[p] = (miss[p] || 0) + 1;
  const missList = Object.entries(miss)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 6)
    .map(
      ([p, c]) =>
        `<li>${bi("problem")} ${h(p)}: ${bi(c === 1 ? "insStudent1" : "insStudentsN", "span", { n: c })} (${pct(c, n)}%)</li>`,
    )
    .join("");
  const mc = {};
  for (const r of rs) for (const tag of r.tags) mc[tag] = (mc[tag] || 0) + 1;
  const miscList = Object.entries(mc)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([tag, c]) => {
      const tx = DATA.tax?.[tag];
      return `<li class="ins-misc"><h4>${tx ? bi(tx.label) : h(tag)} <span class="ins-count">${bi(c === 1 ? "insStudent1" : "insStudentsN", "span", { n: c })}</span></h4>${tx?.watch ? `<p><strong>${bi("insWatch")}:</strong> <span lang="en">${h(tx.watch)}</span></p>` : ""}</li>`;
    })
    .join("");
  const title = L1 ? bi(L1.title) : "";
  return `<section class="section ins-lesson" aria-labelledby="ins-${h(lid)}"><h2 id="ins-${h(lid)}" tabindex="-1"><span>${bi({ en: `Lesson ${lid}`, es: `Lección ${lid}` })}: ${title}</span></h2>
<div class="ins-tiles"><div class="ins-tile"><span class="ins-big">${n}</span><span>${bi("insStudents")}</span></div><div class="ins-tile"><span class="ins-big">${avg}%</span><span>${bi("insAverage")}</span></div><div class="ins-tile"><span class="ins-big">${conf}</span><span>${bi("insConf")} (1–4)</span></div><div class="ins-tile"><span class="ins-big">${review}</span><span>${bi("insReview")} (0–2)</span></div></div>
<h3>${bi("insSpread")}</h3>${spread}
<h3>${bi("insRevisit")}</h3><p class="tier-note">${bi("insRevisitNote")}</p>${missList ? `<ul>${missList}</ul>` : `<p>—</p>`}
<h3>${bi("insMisc")}</h3>${miscList ? `<ul class="ins-misc-list">${miscList}</ul>` : `<p>${bi("insNoMisc")}</p>`}
<p class="no-print"><a class="btn quiet" href="/lessons/${h(lid)}/practice">${bi("insOpen")}</a></p></section>`;
}

// Shared with client-premium.js, which is concatenated after this file into the same module.
export const runtime = {
  LESSON,
  storage,
  state,
  problems,
  counted,
  announce,
  reduced,
  lang,
  confetti,
};

// ---- boot ------------------------------------------------------------------------------------
function boot() {
  root.classList.remove("no-js");
  root.classList.add("js");
  const params = new URLSearchParams(location.search);
  setLang(
    params.get("lang") === "es"
      ? "es"
      : params.get("lang") === "en"
        ? "en"
        : storage.get("ewl_pfa_lang", root.lang || "en"),
  );
  setSize(storage.get("ewl_pfa_size", 0));
  setMotion(!!storage.get("ewl_pfa_motion", false));
  if (!canSpeak)
    for (const b of doc.querySelectorAll("[data-say],[data-act='say'],[data-player='narrate']"))
      b.hidden = true;

  doc.addEventListener("click", (e) => {
    const b = e.target.closest("[data-set-lang],[data-act],[data-say]");
    if (!b) return;
    if (b.dataset.setLang) return setLang(b.dataset.setLang);
    if (b.dataset.say) {
      const target = doc.querySelector(b.dataset.say);
      if (target) say(visibleText(target));
      return;
    }
    const card = b.closest(".problem");
    switch (b.dataset.act) {
      case "text-size":
        return setSize((storage.get("ewl_pfa_size", 0) + 1) % 3);
      case "motion":
        return setMotion(!root.classList.contains("reduce-motion"));
      case "print":
        return print();
      case "check":
        return check(card);
      case "hint": {
        const rec = (state.p[card.dataset.pid] ||= { tries: 0, ok: false });
        rec.hintLevel = Math.min(3, (rec.hintLevel || 0) + 1);
        return showHint(
          card,
          problems[card.dataset.pid] || card._data,
          rec.hintLevel,
          card.dataset.pid,
        );
      }
      case "say":
        return say(visibleText(card.querySelector(".p-prompt") || card));
      case "similar":
        return addSimilar(card);
      case "finish":
        return finish();
      case "coach-try":
        return coachTry(b);
      case "copy-code": {
        const code = doc.querySelector("#finish .code")?.textContent || "";
        navigator.clipboard?.writeText(code).then(
          () => {
            b.querySelector(".lbl").innerHTML = bi("copied");
            announce(L(UI.copied));
          },
          () => prompt("", code),
        );
        return;
      }
      case "ins-show":
        return insights(doc.getElementById("ins-codes")?.value || "");
      case "ins-sample": {
        const ta = doc.getElementById("ins-codes");
        if (ta) ta.value = (DATA.sample || []).join("\n");
        insights(ta?.value || "");
        const out = doc.getElementById("ins-out");
        out?.insertAdjacentHTML(
          "afterbegin",
          `<p class="section tier-note">${bi("insSampleNote")}</p>`,
        );
        return;
      }
      case "reset": {
        const dlg = doc.getElementById("reset-dialog");
        if (dlg?.showModal) dlg.showModal();
        return;
      }
      case "reset-yes":
        storage.del(KEY);
        location.reload();
        return;
      case "reset-no":
        doc.getElementById("reset-dialog")?.close();
        return;
      case "copy": {
        const url = new URL(b.dataset.url, location.origin).href;
        navigator.clipboard?.writeText(url).then(
          () => {
            b.querySelector(".lbl").innerHTML = bi("copied");
            announce(L(UI.copied));
          },
          () => prompt("", url),
        );
        return;
      }
    }
  });
  doc.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches?.(".problem input[type=text]")) {
      e.preventDefault();
      check(e.target.closest(".problem"));
    }
  });
  doc.addEventListener("change", (e) => {
    if (e.target.name === "conf") {
      state.conf = Number(e.target.value);
      save();
    }
  });
  doc.getElementById("reflect-text")?.addEventListener("input", (e) => {
    state.reflect = e.target.value.slice(0, 600);
    save();
  });

  for (const pl of doc.querySelectorAll(".player")) initPlayer(pl);
  for (const card of doc.querySelectorAll('.problem[data-type="match"]')) initMatch(card);
  for (const card of doc.querySelectorAll('.problem[data-type="line"]')) initLine(card);
  restore();
  updateProgress();

  // Staggered entrance as problems scroll in (opacity/transform only).
  if ("IntersectionObserver" in window && !reduced()) {
    const io = new IntersectionObserver((entries) => {
      let k = 0;
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.style.setProperty("--d", `${k++ * 0.06}s`);
        en.target.classList.add("enter");
        io.unobserve(en.target);
      }
    });
    for (const c of doc.querySelectorAll(".problem")) io.observe(c);
  }
}
boot();
