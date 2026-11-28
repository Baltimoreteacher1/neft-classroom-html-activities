// Math Literacy & Fluency: interactive grade page. Untimed on purpose. Progress is saved on this device only.
import { FACT, SKILL, WP, draw, rng } from "./gen.mjs";

const data = JSON.parse(document.getElementById("ml-data").textContent);
const root = document.getElementById("app");
const KEY = `ml:v1:${data.id}`;
let memory = {};
const store = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      return memory;
    }
  },
  save(v) {
    memory = v;
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {
      /* private mode: progress lasts until the page closes */
    }
  },
};
const state = Object.assign({ unit: 0, es: false, done: {}, text: {}, goal: {}, marks: {}, fresh: {} }, store.load());
const save = () => store.save(state);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const tableFor = (k) => (SKILL[k] ? SKILL : FACT[k] ? FACT : null);

/* ---- answer checking: numeric where the key is numeric, text otherwise ---- */
function toNumber(s) {
  s = String(s).toLowerCase().replace(/[$,%°\s]+(?=\d)/g, "").replace(/[$,%°]/g, "").replace(/−/g, "-").trim();
  const m = /^(-?\d+(?:\.\d+)?)(?:\s+(\d+)\/(\d+)|\/(\d+))?/.exec(s);
  if (!m) return null;
  let v = Number(m[1]);
  if (m[2]) v += (v < 0 ? -1 : 1) * (Number(m[2]) / Number(m[3]));
  else if (m[4]) v = Number(m[1]) / Number(m[4]);
  return v;
}
export function same(student, key) {
  const k = String(key).trim();
  const s = String(student).trim();
  if (!s) return false;
  if (/:/.test(k) || /^[a-z' ]+$/i.test(k)) return s.toLowerCase().replace(/[^a-z0-9:' ]/g, "").replace(/\s+/g, " ") === k.toLowerCase().replace(/[^a-z0-9:' ]/g, "").replace(/\s+/g, " ");
  const a = toNumber(s);
  const b = toNumber(k);
  return a != null && b != null && Math.abs(a - b) < 1e-9;
}

/* ---- text helpers ---- */
function markText(text, q, { numbers, question }) {
  let html = esc(text);
  if (question && q) html = html.replace(esc(q), `<mark class="mark">${esc(q)}</mark>`);
  if (numbers) html = html.replace(/(\$?\d[\d,]*(?:\.\d+)?(?:\/\d+)?%?)/g, '<mark class="mark">$1</mark>');
  return html;
}
const READS = (role) => ({
  retell: ["Read 1: Retell it. What is the story about?", "Read 2: Circle the numbers. Underline what they count.", "Read 3: Say the question in your own words."],
  numbers: ["Read 1: What is happening?", "Read 2: Circle each number and underline its unit.", "Read 3: What is the question asking for?"],
  extra: ["Read 1: What is happening?", "Read 2: Circle the numbers. Cross out any the question does not need.", "Read 3: What is the question asking for?"],
  draw: ["Read 1: What is happening?", "Read 2: Draw it on paper. Label each part.", "Read 3: What is the question asking for?"],
})[role];

/* ---- rendering ---- */
function unitTotal(u) {
  return u.vocab.length + 3 + 3 + u.fact.length + u.skill.length;
}
function unitDone(ui) {
  const p = `u${ui}:`;
  return Object.keys(state.done).filter((k) => k.startsWith(p) && state.done[k]).length;
}
function overall() {
  const total = data.units.reduce((n, u) => n + unitTotal(u), 0);
  const done = data.units.reduce((n, _, i) => n + Math.min(unitDone(i), unitTotal(data.units[i])), 0);
  return Math.round((done / total) * 100);
}

function itemHTML(ui, kind, i, it) {
  const id = `u${ui}:${kind}:${i}`;
  const v = state.text[id] ?? "";
  return `<li><div class="q">${esc(it.q)}</div>
    <div class="row"><label class="sr" for="${id}">Your answer</label><input type="text" id="${id}" data-answer="${id}" data-key="${esc(it.a)}" value="${esc(v)}" autocomplete="off" inputmode="text">
    <button class="btn alt" type="button" data-act="check" data-id="${id}">Check</button></div>
    <div class="fb ${state.done[id] ? "ok" : ""}" id="fb-${id}" role="status">${state.done[id] ? "Yes! That is correct." : ""}</div></li>`;
}

function unitHTML(ui) {
  const u = data.units[ui];
  const vocab = u.vocab
    .map(
      (w, i) => `<article class="word"><div class="t">${esc(w.term)}</div>
      <div class="es es-only">En español: <span class="es">${esc(w.es)}</span></div>
      <p>${esc(w.def)}</p><p class="note">Example: ${esc(w.ex)}</p>
      <div class="row"><label for="u${ui}:v:${i}" class="note">My own sentence:</label>
      <input type="text" id="u${ui}:v:${i}" data-save="u${ui}:v:${i}" value="${esc(state.text[`u${ui}:v:${i}`] ?? "")}" style="width:100%"></div>
      <button class="btn alt" type="button" data-act="toggle" data-id="u${ui}:w:${i}" aria-pressed="${!!state.done[`u${ui}:w:${i}`]}">${state.done[`u${ui}:w:${i}`] ? "✓ I can use this word" : "I can use this word"}</button></article>`,
    )
    .join("");
  const wps = u.wp
    .map((p, i) => {
      const id = `u${ui}:p:${i}`;
      const m = state.marks[id] || {};
      const reads = READS(p.role)
        .map((t, k) => `<li><label><input type="checkbox" data-act="read" data-id="${id}:r${k}" ${state.marks[`${id}:r${k}`] ? "checked" : ""}> <span>${esc(t)}</span></label></li>`)
        .join("");
      return `<div class="prob"><h3>Problem ${i + 1}</h3>
        <p class="txt" id="txt-${id}">${markText(p.text, p.question, m)}</p>
        <div class="row noprint"><button class="btn alt" type="button" data-act="mark" data-id="${id}" data-what="numbers" aria-pressed="${!!m.numbers}">Highlight the numbers</button>
        <button class="btn alt" type="button" data-act="mark" data-id="${id}" data-what="question" aria-pressed="${!!m.question}">Highlight the question</button></div>
        <ul class="reads">${reads}</ul>
        <p class="frame">${esc(p.frame)}</p>
        <div class="row"><label class="sr" for="${id}">Your answer</label><input type="text" id="${id}" data-answer="${id}" data-key="${esc(p.a)}" value="${esc(state.text[id] ?? "")}" autocomplete="off">
        <button class="btn alt" type="button" data-act="check" data-id="${id}" data-hint="${esc(u.strategy.move)}">Check</button></div>
        <div class="fb ${state.done[id] ? "ok" : ""}" id="fb-${id}" role="status">${state.done[id] ? "Yes! That is correct." : ""}</div></div>`;
    })
    .join("");
  const q = u.quick;
  const qid = `u${ui}:q`;
  const choices = q.vocab.choices
    .map((c, i) => `<button class="btn alt" type="button" data-act="pick" data-id="${qid}:v" data-pick="${c[0]}" data-key="${q.vocab.a}">${esc(c)}</button>`)
    .join("");
  const goalBtns = [1, 2, 3, 4].map((n) => `<button type="button" data-act="goal" data-unit="${ui}" data-n="${n}" aria-pressed="${state.goal[ui] === n}">${n}</button>`).join("");
  return `
  <section aria-labelledby="h-${ui}">
    <h2 id="h-${ui}">Unit ${u.index}: ${esc(u.title)}</h2>
    <p><span class="pill">${esc(u.domain)}</span></p>
    <div class="strategy"><strong>Reading move for this unit: ${esc(u.strategy.name)}.</strong> ${esc(u.strategy.move)}</div>
    <h2>1. Word wall</h2><div class="words">${vocab}</div>
    <h2>2. Read it. Say it. Solve it.</h2>${wps}
    <h2>3. Math talk and write</h2>
    <div class="card"><p><strong>${esc(u.talk.prompt)}</strong></p><p class="frame">${esc(u.talk.frame)}</p>
      <label for="u${ui}:talk" class="sr">Your response</label><textarea id="u${ui}:talk" data-save="u${ui}:talk">${esc(state.text[`u${ui}:talk`] ?? "")}</textarea>
      <label class="row"><input type="checkbox" data-act="read" data-id="u${ui}:said" ${state.marks[`u${ui}:said`] ? "checked" : ""}> <span>I said my answer out loud to a partner.</span></label></div>
    <h2>4. Fact fluency</h2><p class="note">Untimed. Aim for accuracy first. Speed comes from knowing the facts, not from rushing.</p>
    <ul class="items" id="facts-${ui}">${u.fact.map((it, i) => itemHTML(ui, "f", i, it)).join("")}</ul>
    <button class="btn alt" type="button" data-act="fresh" data-unit="${ui}" data-set="fact">New fact set</button>
    <h2>5. Skill fluency</h2>
    <ul class="items" id="skills-${ui}">${u.skill.map((it, i) => itemHTML(ui, "s", i, it)).join("")}</ul>
    <button class="btn alt" type="button" data-act="fresh" data-unit="${ui}" data-set="skill">New skill set</button>
    <h2>6. Quick check</h2>
    <div class="card"><p><strong>${esc(q.vocab.q)}</strong></p><div class="row">${choices}</div><div class="fb ${state.done[`${qid}:v`] ? "ok" : ""}" id="fb-${qid}:v" role="status">${state.done[`${qid}:v`] ? "Yes! That is correct." : ""}</div>
      <ul class="items" style="margin-top:1rem">${itemHTML(ui, "qs", 0, q.skill).replaceAll(`u${ui}:qs:0`, `${qid}:s`)}</ul>
      <div class="prob"><p class="txt">${esc(q.wp.text)}</p><p class="frame">${esc(q.wp.frame)}</p>
      <div class="row"><label class="sr" for="${qid}:w">Your answer</label><input type="text" id="${qid}:w" data-answer="${qid}:w" data-key="${esc(q.wp.a)}" value="${esc(state.text[`${qid}:w`] ?? "")}"><button class="btn alt" type="button" data-act="check" data-id="${qid}:w">Check</button></div>
      <div class="fb ${state.done[`${qid}:w`] ? "ok" : ""}" id="fb-${qid}:w" role="status">${state.done[`${qid}:w`] ? "Yes! That is correct." : ""}</div></div></div>
    <h2>How am I doing?</h2><p class="note">1 = I need help. 2 = I am getting there. 3 = I can do it. 4 = I can teach it.</p>
    <div class="goal" role="group" aria-label="Rate yourself 1 to 4">${goalBtns}</div>
  </section>`;
}

function shell() {
  const tabs = data.units.map((u, i) => `<button role="tab" type="button" id="tab-${i}" aria-selected="${i === state.unit}" data-act="unit" data-unit="${i}">${u.index}. ${esc(u.title)}</button>`).join("");
  root.innerHTML = `<div class="row noprint"><label class="row"><input type="checkbox" id="es" ${state.es ? "checked" : ""}> <span>Show Spanish word help (Ayuda en español)</span></label></div>
    <div class="row noprint" style="gap:1rem"><div style="flex:1;min-width:12rem"><div class="bar" aria-hidden="true"><i id="barfill"></i></div></div><div id="pct" role="status"></div><button class="btn alt" type="button" data-act="reset">Start over</button></div>
    <div id="resetbox" class="noprint"></div>
    <div class="tabs noprint" role="tablist" aria-label="Units">${tabs}</div><div id="unit" role="tabpanel" tabindex="-1">${unitHTML(state.unit)}</div>`;
  document.body.classList.toggle("show-es", state.es);
  refresh();
}
function refresh() {
  const p = overall();
  const f = document.getElementById("barfill");
  if (f) f.style.width = `${p}%`;
  const t = document.getElementById("pct");
  if (t) t.textContent = `${p}% of this grade finished`;
}

function regen(ui, set) {
  const u = data.units[ui];
  const spec = set === "fact" ? u.factSpec : u.skillSpec;
  const seed = (Math.random() * 2 ** 31) | 0;
  const list = draw(tableFor(spec[0]), spec[0], spec[1], rng(seed), 8);
  u[set] = list;
  const kind = set === "fact" ? "f" : "s";
  for (const k of Object.keys(state.done)) if (k.startsWith(`u${ui}:${kind}:`)) delete state.done[k];
  for (const k of Object.keys(state.text)) if (k.startsWith(`u${ui}:${kind}:`)) delete state.text[k];
}

root.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.save) state.text[t.dataset.save] = t.value;
  else if (t.dataset.answer) state.text[t.dataset.answer] = t.value;
  save();
});
root.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "es") {
    state.es = t.checked;
    document.body.classList.toggle("show-es", state.es);
    save();
  } else if (t.dataset.act === "read") {
    state.marks[t.dataset.id] = t.checked;
    save();
  }
});
root.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.dataset?.answer) root.querySelector(`[data-act=check][data-id="${e.target.dataset.answer}"]`)?.click();
});
root.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const act = b.dataset.act;
  const id = b.dataset.id;
  if (act === "unit") {
    state.unit = Number(b.dataset.unit);
    save();
    shell();
    document.getElementById("unit").focus({ preventScroll: false });
  } else if (act === "check") {
    const input = document.getElementById(id);
    const fb = document.getElementById(`fb-${id}`);
    if (same(input.value, input.dataset.key)) {
      state.done[id] = true;
      fb.className = "fb ok";
      fb.textContent = "Yes! That is correct.";
    } else {
      fb.className = "fb no";
      fb.textContent = input.value.trim() ? `Not yet. Read the question again and try once more.${b.dataset.hint ? ` Try this: ${b.dataset.hint}` : ""}` : "Type an answer first.";
    }
    save();
    refresh();
  } else if (act === "pick") {
    const fb = document.getElementById(`fb-${id}`);
    if (b.dataset.pick === b.dataset.key) {
      state.done[id] = true;
      fb.className = "fb ok";
      fb.textContent = "Yes! That is correct.";
    } else {
      fb.className = "fb no";
      fb.textContent = "Not yet. Look at the word again and think about where you used it.";
    }
    save();
    refresh();
  } else if (act === "toggle") {
    state.done[id] = !state.done[id];
    b.setAttribute("aria-pressed", String(!!state.done[id]));
    b.textContent = state.done[id] ? "✓ I can use this word" : "I can use this word";
    save();
    refresh();
  } else if (act === "mark") {
    const m = (state.marks[id] = state.marks[id] || {});
    m[b.dataset.what] = !m[b.dataset.what];
    const [u, , i] = id.split(":");
    const p = data.units[Number(u.slice(1))].wp[Number(i)];
    document.getElementById(`txt-${id}`).innerHTML = markText(p.text, p.question, m);
    b.setAttribute("aria-pressed", String(!!m[b.dataset.what]));
    save();
  } else if (act === "goal") {
    state.goal[b.dataset.unit] = Number(b.dataset.n);
    for (const x of b.parentElement.children) x.setAttribute("aria-pressed", String(x === b));
    save();
  } else if (act === "fresh") {
    regen(Number(b.dataset.unit), b.dataset.set);
    save();
    shell();
  } else if (act === "reset") {
    document.getElementById("resetbox").innerHTML = `<div class="card" role="alert"><p>Start over? This clears your answers on this device.</p><div class="row"><button class="btn" type="button" data-act="reset-yes">Yes, start over</button><button class="btn alt" type="button" data-act="reset-no">Keep my work</button></div></div>`;
  } else if (act === "reset-no") {
    document.getElementById("resetbox").innerHTML = "";
  } else if (act === "reset-yes") {
    state.done = {};
    state.text = {};
    state.goal = {};
    state.marks = {};
    save();
    location.reload();
  }
});

shell();
