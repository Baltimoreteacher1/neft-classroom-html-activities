// Compile a one-lesson graphic-novel spec (graphic-novels/axiom-city/_engine/books/<lesson>.json) into the shell's
// content.js, the page text and the art spec. The spec is the single source: pages, gates, answer key, art prompts.
// Contract and authoring guide: docs/lesson-book-spec.md.
import { evaluateExpression, parseAnswerValue } from "../../scripts/lib/rational.mjs";

export const SIZES = { cover: [640, 896], wide: [1024, 576], tall: [576, 768], square: [768, 768] };
const ICONS = ["#sig-pow", "#sig-tile", "#sig-graph", "#sig-table", "#sig-ops", "#sig-flask", "#sig-swap", "#sig-watch"];
const CELL_CLASS = { full: "panel gn-panel panel3d", half: "panel gn-panel gn-half", third: "panel gn-panel gn-third", "two-thirds": "panel gn-panel gn-two-thirds" };
const POS = {
  tl: "top:6px;left:6px;max-width:70%",
  tr: "top:6px;right:6px;max-width:70%",
  bl: "bottom:6px;left:6px;max-width:70%",
  br: "bottom:6px;right:6px;max-width:70%",
  top: "top:6px;left:6px;right:6px;max-width:none",
  bottom: "bottom:6px;left:6px;right:6px;max-width:none",
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => esc(s).replace(/"/g, "&quot;");

/* ---------- pages ---------- */

function cell(c, companion) {
  const parts = [`<div class="${CELL_CLASS[c.size || "full"]}">${c.art ? `\${globalThis.ART(${JSON.stringify(c.art)})}` : ""}`];
  if (c.loc) parts.push(`<div class="caption loc">${c.loc}</div>`);
  for (const b of c.balloons || []) {
    const cls = ["balloon", b.who.toUpperCase() === companion.toUpperCase() ? "vex gn-side" : "", b.tail === "r" ? "tail-r" : ""]
      .filter(Boolean)
      .join(" ");
    parts.push(`<div class="${cls}" style="${POS[b.pos || "tl"]}"><span class="who">${esc(b.who.toUpperCase())}</span>${b.t}</div>`);
  }
  if (c.sfx) parts.push(`<div class="sfx" style="${POS[c.sfx.pos || "tl"].split(";").slice(0, 2).join(";")}">${esc(c.sfx.t)}</div>`);
  if (c.sign)
    parts.push(
      `<div class="gn-sign gn-${c.sign.style || "chalk"}" data-gn-skip style="left:${c.sign.x || "60%"};top:${c.sign.y || "44%"}">${c.sign.t}</div>`,
    );
  parts.push("</div>");
  return parts.join("\n      ");
}

function comic(cells, caption, companion) {
  const inner = (cells || []).map((c) => cell(c, companion)).join("\n    ");
  const cap = caption ? `\n    <div class="caption">${caption}</div>` : "";
  return `\n  <div class="gn-comic">\n    ${inner}${cap}\n  </div>`;
}

export function pageHtml(p, companion) {
  return comic(p.cells, p.caption, companion);
}

function titleHtml(spec, companion) {
  const t = spec.coverTitle.replace(/<br>/g, " ");
  return `\n  <div style="text-align:center;margin-top:8px"><div class="kicker">EduWonderLab Presents</div>\n  <h2 class="splashtitle" style="margin:8px 0">${t}</h2>\n  <div class="caption" style="display:inline-block">${spec.intro.caption}</div></div>${comic(spec.intro.cells, "", companion)}`;
}

function journalHtml(spec, world) {
  const j = spec.journal;
  const rows = j.rows.map(([b, t]) => `    <div class="jrow"><b>${b}</b><span>${t}</span></div>`).join("\n");
  return `\n  <h2 class="splashtitle" style="font-size:1.4rem">${world.journalTitle}</h2>\n  <div class="journal"><h4>${j.heading}</h4>\n${rows}\n  </div>\n  <div class="caption">${j.quote}</div>`;
}

function certHtml(spec, world, next) {
  return `\n  <div id="certificate">\n    <div class="kicker">${world.brand} · EduWonderLab</div>\n    <h3>READER CERTIFICATE</h3>\n    <p style="font:600 .9rem Georgia,serif">This certifies that</p>\n    <input id="certName" maxlength="40" placeholder="write your name" aria-label="Your name for the certificate">\n    <p style="font:600 .9rem Georgia,serif">completed <b>Lesson ${spec.lesson}: ${spec.title}</b> and proved mastery: ${spec.cert}.</p>\n    <div class="certbadges" id="certBadges"></div>\n    <button class="gatecheck" id="printCert" style="align-self:center">PRINT CERTIFICATE</button>\n  </div>${next ? `\n  <div class="caption" style="text-align:center">Next episode: <a href="${next.href}">${esc(next.title)}</a> (Lesson ${next.lesson}).</div>` : ""}`;
}

/* ---------- gate answer key (generated from the items, never typed twice) ---------- */

const plain = (h) => String(h).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");

function itemKey(it) {
  if (it.type === "choice") {
    const ok = it.options.find((o) => o.ok);
    const traps = it.options.filter((o) => !o.ok).map((o) => `${plain(o.t)} — ${plain(o.fb || "")}`);
    return `${plain(it.q)} → ${plain(ok.t)} (traps: ${traps.join("; ")})`;
  }
  if (it.type === "number") {
    const traps = (it.fb || []).map((f) => `${f.eq} — ${plain(f.msg)}`);
    return `${plain(it.label)} ${it.answer}${traps.length ? ` (traps: ${traps.join("; ")})` : ""}`;
  }
  if (it.type === "order") return `${plain(it.q)} → ${it.answer.map((id) => plain(it.cards.find((c) => c.id === id).t)).join(", ")}`;
  if (it.type === "multi") return `${plain(it.q)} → ${it.options.filter((o) => o.ok).map((o) => plain(o.t)).join(", ")}`;
  if (it.type === "grid") return `${plain(it.q)} → ${it.answer.map((p) => `(${p[0]}, ${p[1]})`).join(" ")}`;
  if (it.type === "numberline") {
    const a = it.answer;
    return `${plain(it.q)} → ${a.value}${it.inequality ? `, ${a.closed ? "closed" : "open"} circle, ray ${a.dir}` : ""}`;
  }
  return "";
}

/* ---------- audit: structure plus exact arithmetic ---------- */

/** Problems with a spec that no build can fix. Empty array means the spec is sound. */
export function auditSpec(spec) {
  const out = [];
  const bad = (m) => out.push(`${spec.lesson}: ${m}`);
  const artIds = new Set([...(spec.panels || []).map((p) => p.id), "cover"]);
  const cellsOf = [...(spec.intro?.cells || []), ...(spec.win?.cells || []), ...(spec.pages || []).flatMap((p) => p.cells || [])];
  for (const c of cellsOf) if (c.art && !artIds.has(c.art)) bad(`cell uses art "${c.art}" that has no panel`);
  const used = new Set(cellsOf.map((c) => c.art));
  used.add("cover");
  for (const id of artIds) if (!used.has(id)) bad(`panel "${id}" is never used by a page`);
  const gates = spec.gates || [];
  if (gates.length < 3) bad("needs 3 gates and a boss gate");
  const gateIds = new Set(gates.map((g) => g.id));
  for (const p of spec.pages || []) if (p.gate && !gateIds.has(p.gate)) bad(`page names missing gate ${p.gate}`);
  for (const g of gates) {
    if (!Array.isArray(g.hints) || g.hints.length !== 2) bad(`${g.id}: exactly two hints (conceptual, procedural)`);
    if (!g.worked?.steps?.length || !g.worked.q || g.worked.a === undefined) bad(`${g.id}: worked example needs steps, q, a`);
    if (!(g.items || []).length) bad(`${g.id}: no items`);
    (g.items || []).forEach((it, i) => {
      const at = `${g.id}.${i + 1}`;
      if (it.type === "choice") {
        if (it.options.filter((o) => o.ok).length !== 1) bad(`${at}: exactly one correct option`);
        for (const o of it.options) if (!o.ok && !o.fb) bad(`${at}: wrong option "${plain(o.t)}" needs named feedback`);
        if (it.options.length < 3) bad(`${at}: at least 3 options`);
      } else if (it.type === "number") {
        const exact = it.calc === undefined ? null : evaluateExpression(String(it.calc));
        const stated = parseAnswerValue(String(it.answer));
        if (it.calc === undefined) bad(`${at}: number item needs "calc", an expression that recomputes the answer`);
        else if (exact === null) bad(`${at}: calc "${it.calc}" is not evaluable`);
        else if (stated === null || !exact.eq(stated)) bad(`${at}: calc "${it.calc}" = ${exact} but answer is ${it.answer}`);
        for (const f of it.fb || []) {
          const v = parseAnswerValue(String(f.eq));
          if (v && stated && v.eq(stated)) bad(`${at}: feedback for ${f.eq} equals the right answer`);
        }
      } else if (it.type === "order") {
        if (new Set(it.answer).size !== it.cards.length || !it.answer.every((id) => it.cards.some((c) => c.id === id))) bad(`${at}: answer must list every card once`);
      } else if (it.type === "multi") {
        if (!it.options.some((o) => o.ok) || it.options.every((o) => o.ok)) bad(`${at}: needs right and wrong options`);
      } else if (it.type === "grid") {
        if (!it.answer?.length) bad(`${at}: grid needs answer points`);
        else if (it.answer.some((p) => Math.abs(p[0]) > it.range || Math.abs(p[1]) > it.range)) bad(`${at}: answer outside grid range`);
      } else if (it.type === "numberline") {
        const a = it.answer;
        if (a.value < it.min || a.value > it.max) bad(`${at}: answer off the line`);
        if (it.calc !== undefined) {
          const e = evaluateExpression(String(it.calc));
          const s = parseAnswerValue(String(a.value));
          if (!e || !s || !e.eq(s)) bad(`${at}: calc "${it.calc}" does not equal ${a.value}`);
        }
      } else bad(`${at}: unknown item type "${it.type}"`);
    });
  }
  const words = (s) => String(s).split(/\s+/).length;
  for (const p of spec.panels || []) {
    if (words(p.alt) < 6) bad(`panel ${p.id}: alt needs 6+ words`);
    if (/\b(image|picture|illustration) of\b/i.test(p.alt)) bad(`panel ${p.id}: alt must not say "image of"`);
  }
  return out;
}

/* ---------- content.js ---------- */

// The runtime every book carries. It reads GATE_SPECS (plain data) so no per-book gate code exists to drift.
const RUNTIME = String.raw`
function mkfeed(el, msg, ok) { el.textContent = msg; el.className = "gatefeedback " + (ok ? "good" : "bad"); }
const GN_NUM = (s) => {
  let t = String(s).trim().replace(/[−–—]/g, "-").replace(/[$%]/g, "").replace(/,(?=\d{3}\b)/g, "").replace(/\s+/g, " ").trim();
  let m = t.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) return (m[1] ? -1 : 1) * (+m[2] + +m[3] / +m[4]);
  m = t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (m) return +m[1] / +m[2];
  t = t.replace(/\s+/g, "");
  return /^-?\d*\.?\d+$/.test(t) ? parseFloat(t) : NaN;
};
const GN_EQ = (a, b) => Math.abs(a - b) < 1e-9;
function gnChoice(it, body, st) {
  const box = document.createElement("div");
  box.innerHTML = '<div class="gn-q">' + it.q + '</div><div class="choicebtns">' + it.options.map((o, i) => '<button class="choicebtn" aria-pressed="false" data-i="' + i + '">' + o.t + "</button>").join("") + "</div>";
  body.appendChild(box);
  box.querySelectorAll(".choicebtns button").forEach((b) => b.addEventListener("click", () => {
    box.querySelectorAll(".choicebtns button").forEach((x) => x.setAttribute("aria-pressed", "false"));
    b.setAttribute("aria-pressed", "true"); st.pick = +b.dataset.i; st.api.sound("blip");
  }));
  return () => {
    if (st.pick === undefined) return "Answer every question in this gate.";
    const o = it.options[st.pick]; return o.ok ? "" : o.fb;
  };
}
function gnNumber(it, body, st) {
  const row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:6px 0";
  row.innerHTML = '<span style="font:900 1.05rem Arial Black,Arial;color:var(--navy)">' + it.label + '</span><input class="numin" inputmode="decimal" aria-label="' + (it.aria || "your answer") + '">';
  body.appendChild(row);
  const inp = row.querySelector("input");
  return () => {
    const v = GN_NUM(inp.value); const want = GN_NUM(it.answer);
    inp.className = "numin " + (GN_EQ(v, want) ? "ok" : "no");
    if (isNaN(v)) return it.fbEmpty || "Type a number for every answer box.";
    if (GN_EQ(v, want)) return "";
    for (const f of it.fb || []) if (GN_EQ(v, GN_NUM(f.eq))) return f.msg;
    return it.fbDefault || "Not yet. Check your steps and try again.";
  };
}
function gnOrder(it, body, st) {
  const box = document.createElement("div"); const seq = [];
  const paint = () => box.querySelectorAll(".choicebtns button").forEach((b) => { const k = seq.indexOf(b.dataset.id); b.setAttribute("aria-pressed", k >= 0 ? "true" : "false"); b.dataset.n = k >= 0 ? k + 1 : ""; b.querySelector("i").textContent = k >= 0 ? " #" + (k + 1) : ""; });
  box.innerHTML = '<div class="gn-q">' + it.q + '</div><div class="choicebtns">' + it.cards.map((c) => '<button class="choicebtn" aria-pressed="false" data-id="' + c.id + '">' + c.t + "<i></i></button>").join("") + "</div>";
  body.appendChild(box);
  box.querySelectorAll(".choicebtns button").forEach((b) => b.addEventListener("click", () => { const k = seq.indexOf(b.dataset.id); if (k >= 0) seq.splice(k, 1); else seq.push(b.dataset.id); paint(); st.api.sound("blip"); }));
  return () => {
    if (seq.length < it.cards.length) return "Tap all " + it.cards.length + " cards in order. Tap a card again to take it back.";
    return seq.join() === it.answer.join() ? "" : it.fb;
  };
}
function gnMulti(it, body, st) {
  const box = document.createElement("div");
  box.innerHTML = '<div class="gn-q">' + it.q + '</div><div class="choicebtns">' + it.options.map((o, i) => '<button class="choicebtn" aria-pressed="false" data-i="' + i + '">' + o.t + "</button>").join("") + "</div>";
  body.appendChild(box);
  box.querySelectorAll(".choicebtns button").forEach((b) => b.addEventListener("click", () => { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); st.api.sound("blip"); }));
  return () => {
    const on = [...box.querySelectorAll(".choicebtns button")].map((b) => b.getAttribute("aria-pressed") === "true");
    for (let i = 0; i < it.options.length; i++) if (on[i] && !it.options[i].ok) return it.options[i].fb || it.fbExtra;
    for (let i = 0; i < it.options.length; i++) if (!on[i] && it.options[i].ok) return it.fbMiss;
    return "";
  };
}
function gnGrid(it, body, st) {
  const R = it.range, S = 24, W = (2 * R + 2) * S, pts = [];
  const X = (x) => (x + R + 1) * S, Y = (y) => (R + 1 - y) * S;
  let g = "";
  for (let i = -R; i <= R; i++) { g += '<line x1="' + X(i) + '" y1="' + Y(-R) + '" x2="' + X(i) + '" y2="' + Y(R) + '" stroke="' + (i === 0 ? "#17324D" : "#c8d3df") + '" stroke-width="' + (i === 0 ? 2.5 : 1) + '"/><line x1="' + X(-R) + '" y1="' + Y(i) + '" x2="' + X(R) + '" y2="' + Y(i) + '" stroke="' + (i === 0 ? "#17324D" : "#c8d3df") + '" stroke-width="' + (i === 0 ? 2.5 : 1) + '"/>'; if (i && i % 2 === 0) g += '<text x="' + X(i) + '" y="' + (Y(0) + 14) + '" font-size="10" text-anchor="middle" fill="#24323F">' + i + '</text><text x="' + (X(0) - 6) + '" y="' + (Y(i) + 3) + '" font-size="10" text-anchor="end" fill="#24323F">' + i + "</text>"; }
  let hit = ""; for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) hit += '<circle class="gp" data-x="' + x + '" data-y="' + y + '" cx="' + X(x) + '" cy="' + Y(y) + '" r="11" fill="transparent" tabindex="0" role="button" aria-label="point ' + x + ", " + y + '"/>';
  const box = document.createElement("div");
  box.innerHTML = '<div class="gn-q">' + it.q + '</div><svg class="gategrid" viewBox="0 0 ' + W + " " + W + '" style="width:100%;max-width:' + Math.min(W, 380) + 'px;background:#fff;border:3px solid var(--navy);border-radius:8px" role="group" aria-label="coordinate grid">' + g + '<g class="dots"></g>' + hit + '</svg><div class="gn-gridnote" style="font:600 .85rem Segoe UI">Tap a spot to place a point. Tap it again to remove it.</div>';
  body.appendChild(box);
  const dots = box.querySelector(".dots");
  const draw = () => { dots.innerHTML = pts.map((p) => '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="6" fill="var(--coral)" stroke="var(--navy)" stroke-width="2"/>').join(""); };
  box.querySelectorAll(".gp").forEach((c) => { const go = () => { const p = [+c.dataset.x, +c.dataset.y]; const k = pts.findIndex((q) => q[0] === p[0] && q[1] === p[1]); if (k >= 0) pts.splice(k, 1); else pts.push(p); draw(); st.api.sound("blip"); }; c.addEventListener("click", go); c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }); });
  return () => {
    if (!pts.length) return "Place the point" + (it.answer.length > 1 ? "s" : "") + " on the grid first.";
    const key = (p) => p[0] + "," + p[1], want = it.answer.map(key).sort().join("|"), got = pts.map(key).sort().join("|");
    if (got === want) return "";
    for (const f of it.fb || []) if (pts.some((p) => key(p) === f.at.join(","))) return f.msg;
    return it.fbDefault || "Not quite. Check each coordinate: x first, then y.";
  };
}
function gnLine(it, body, st) {
  const S = 36, n = Math.round((it.max - it.min) / it.step), W = n * S + 40, state = { value: undefined, closed: true, dir: "right" };
  const X = (v) => 20 + ((v - it.min) / it.step) * S;
  let g = '<line x1="20" y1="50" x2="' + (W - 20) + '" y2="50" stroke="#17324D" stroke-width="3"/>', hit = "";
  for (let i = 0; i <= n; i++) { const v = +(it.min + i * it.step).toFixed(6); g += '<line x1="' + X(v) + '" y1="42" x2="' + X(v) + '" y2="58" stroke="#17324D" stroke-width="2"/><text x="' + X(v) + '" y="78" font-size="11" text-anchor="middle" fill="#24323F">' + (it.labels && it.labels[i] !== undefined ? it.labels[i] : v) + "</text>"; hit += '<circle class="lp" data-v="' + v + '" cx="' + X(v) + '" cy="50" r="15" fill="transparent" tabindex="0" role="button" aria-label="mark ' + v + '"/>'; }
  const box = document.createElement("div");
  box.innerHTML = '<div class="gn-q">' + it.q + '</div>' + (it.inequality ? '<div class="choicebtns"><button class="choicebtn" data-c="closed" aria-pressed="true">Closed circle (includes it)</button><button class="choicebtn" data-c="open" aria-pressed="false">Open circle (not included)</button><button class="choicebtn" data-d="left" aria-pressed="false">Ray points left</button><button class="choicebtn" data-d="right" aria-pressed="true">Ray points right</button></div>' : "") + '<svg viewBox="0 0 ' + W + ' 96" style="width:100%;max-width:' + W + 'px;background:#fff;border:3px solid var(--navy);border-radius:8px" role="group" aria-label="number line">' + g + '<g class="mk"></g>' + hit + '</svg>';
  body.appendChild(box);
  const mk = box.querySelector(".mk");
  const draw = () => { if (state.value === undefined) { mk.innerHTML = ""; return; } const x = X(state.value); let s = ""; if (it.inequality) { const to = state.dir === "right" ? W - 14 : 14; s += '<line x1="' + x + '" y1="50" x2="' + to + '" y2="50" stroke="var(--coral)" stroke-width="6"/>'; } s += '<circle cx="' + x + '" cy="50" r="8" fill="' + (it.inequality && !state.closed ? "#fff" : "var(--coral)") + '" stroke="var(--navy)" stroke-width="3"/>'; mk.innerHTML = s; };
  box.querySelectorAll(".lp").forEach((c) => { const go = () => { state.value = +c.dataset.v; draw(); st.api.sound("blip"); }; c.addEventListener("click", go); c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }); });
  box.querySelectorAll("[data-c],[data-d]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.c) { state.closed = b.dataset.c === "closed"; box.querySelectorAll("[data-c]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false")); } else { state.dir = b.dataset.d; box.querySelectorAll("[data-d]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false")); } draw(); }));
  return () => {
    if (state.value === undefined) return "Tap the number line to place your mark.";
    const a = it.answer;
    if (!GN_EQ(state.value, a.value)) { for (const f of it.fb || []) if (GN_EQ(state.value, f.at)) return f.msg; return it.fbDefault || "That mark is not in the right place. Check the number again."; }
    if (it.inequality) { if (state.closed !== a.closed) return a.closed ? it.fbClosed : it.fbOpen; if (state.dir !== a.dir) return it.fbDir; }
    return "";
  };
}
const GN_ITEMS = { choice: gnChoice, number: gnNumber, order: gnOrder, multi: gnMulti, grid: gnGrid, numberline: gnLine };
function gnRun(spec, body, api) {
  body.innerHTML = "";
  const checks = spec.items.map((it) => GN_ITEMS[it.type](it, body, { api }));
  api.onCheck(() => { for (const c of checks) { const m = c(); if (m) return api.fail(m); } api.pass(spec.pass); });
}
const GATES = {};
for (const s of GATE_SPECS) GATES[s.id] = { title: s.title, icon: s.icon, prompt: s.prompt, hints: s.hints, worked: s.worked, render(body, api) { gnRun(s, body, api); } };
`;

export function compileContent(spec, world) {
  const companion = world.companion.name;
  const gates = spec.gates.map((g, i) => ({ ...g, icon: g.icon || ICONS[i % ICONS.length] }));
  const pages = [{ ch: `Lesson ${spec.lesson} · ${spec.title}`, html: titleHtml(spec, companion) }];
  for (const p of spec.pages) pages.push({ ch: p.ch, ...(p.gate ? { gate: p.gate } : {}), html: pageHtml(p, companion) });
  if (spec.win) pages.push({ ch: spec.win.ch, html: pageHtml(spec.win, companion) });
  pages.push({ ch: `End Matter · ${world.journalName}`, html: journalHtml(spec, world) });
  pages.push({ ch: "End Matter · Certificate", html: certHtml(spec, world, spec.next) });
  const badges = gates.map((g) => ({ id: g.id, icon: g.icon, label: g.badge }));
  const teacher = {
    suggested: spec.teacher.suggested,
    standards: spec.teacher.standards,
    answers: gates.map((g) => [g.id === "boss" ? "Boss" : `Gate ${g.id.slice(1)}`, g.items.map(itemKey).join(" | ")]),
  };
  const volume = { num: spec.num, slug: `l${spec.lesson.replace("-", "")}${spec.world.replace(/-/g, "").slice(0, 3)}`, title: spec.title, unit: `Lesson ${spec.lesson} · ${spec.topic}`, accent: world.theme.accent, nextTeaser: spec.next ? `LESSON ${spec.next.lesson} — ${spec.next.title.toUpperCase()}` : "" };
  const gateSpecs = gates.map((g) => ({ id: g.id, title: g.title, icon: g.icon, prompt: g.prompt, hints: g.hints, worked: g.worked, items: g.items, pass: g.pass }));
  return [
    // object-literal keys, as in every other book: tools/lib/gn-layer.mjs reads `unit: "..."` to find the lesson
    `const VOLUME = {\n${Object.entries(volume).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`).join("\n")}\n};`,
    `const BADGES = ${JSON.stringify(badges, null, 2)};`,
    `const GATE_SPECS = ${JSON.stringify(gateSpecs, null, 2).replace(/</g, "\\u003c")};`,
    RUNTIME.trim(),
    // html becomes a template literal so `${globalThis.ART("id")}` (written by cell()) runs in the browser.
    `const PAGES = ${JSON.stringify(pages, null, 2).replace(/"html": "((?:[^"\\]|\\.)*)"/g, (_m, s) => `"html": \`${JSON.parse(`"${s}"`).replace(/\\/g, "\\\\").replace(/`/g, "\\`")}\``)};`,
    `const TEACHER = ${JSON.stringify(teacher, null, 2)};`,
  ].join("\n\n");
}

/* ---------- art spec ---------- */

export function panelsJson(spec, world) {
  const panels = [];
  const seed0 = spec.num;
  const all = [{ id: "cover", ...spec.cover, size: SIZES.cover }, ...spec.panels];
  all.forEach((p, i) =>
    panels.push({
      id: p.id,
      size: typeof p.size === "string" ? SIZES[p.size] : p.size || SIZES.wide,
      seed: p.seed || seed0 + i + 1,
      prompt: p.prompt,
      alt: p.alt,
      ...(p.faces ? { faces: p.faces } : {}),
    }),
  );
  return {
    book: `${spec.world}-l${spec.lesson}-${spec.slug}`,
    generated: "from _engine/books/" + spec.lesson + ".json by tools/build-lesson-books.mjs — edit the spec, not this file",
    generator: { model: "gemini-3.1-flash-image" },
    pack: { scale: 0.85, quality: 78, maxBytes: 2500000, maxWidth: 3200 },
    fragments: world.fragments,
    panels,
  };
}

export { attr };
