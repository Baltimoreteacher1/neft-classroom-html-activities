// Plan & Respond — "Virtual lab": one hands-on lab for the unit's subject, plus a model-sentence builder for every unit.
//   Math: compare and scale two amounts (bars, table, sentence)   Science: plan a fair test, then claim / evidence / reasoning
//   ELA: build sentences with because / but / so and add details  Social Studies: match the reason and the result
// Language comes from the unit's own frames, connectors, writing practice and mentor sentence. Nothing is saved or sent.

import { blanks as printBlanks, doc, FOOT, openPrint, unitLine } from "./companion-print.js";
import { blanks, esc, shuffle, termsIn, vstate } from "./util.js";
import { chainFlow } from "./visuals.js";

const ID = "labs";

const LABS = {
  ratio: {
    title: "Compare and scale",
    hint: "Build two amounts, scale them up, see what stays the same",
  },
  cer: { title: "Fair test and evidence", hint: "Plan a test, then claim, evidence and reasoning" },
  sentence: {
    title: "Sentence lab",
    hint: "Join ideas with because, but and so, then add details",
  },
  cause: { title: "Reason and result", hint: "Match why it happened and what happened next" },
  mentor: {
    title: "Build the model sentence",
    hint: "Put the parts in order, then see each part's job",
  },
};
const SUBJECT_LAB = { Math: "ratio", Science: "cer", ELA: "sentence", "Social Studies": "cause" };

/** The labs for a unit: its subject's lab, then the model-sentence builder (when the unit has a mentor sentence). */
export function labsFor(detail) {
  const ids = [SUBJECT_LAB[detail.unit.subject] || "sentence"];
  if ((detail.studio?.mentor?.chunks || []).length >= 2) ids.push("mentor");
  return ids.map((id) => ({ id, ...LABS[id] }));
}

const strip = (s) => String(s || "").replace(/[.!?]+\s*$/, "");
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// ── Math: compare and scale ─────────────────────────────────────────────────

export function ratioModel(a, b, k, la = "A", lb = "B") {
  const g = gcd(a, b);
  return {
    rows: Array.from({ length: k }, (_, i) => ({ times: i + 1, a: a * (i + 1), b: b * (i + 1) })),
    simplest: [a / g, b / g],
    sentence: `For every ${a} ${la}, there are ${b} ${lb}.`,
    scaled: `With ${k} ${k === 1 ? "group" : "groups"} there are ${a * k} ${la} and ${b * k} ${lb}.`,
  };
}

function ratioSvg(a, b, k) {
  const gap = 8;
  const u = Math.min(30, (580 - (k - 1) * gap) / (Math.max(a, b) * k));
  const row = (n, y, fills) => {
    let out = "";
    for (let g = 0; g < k; g++)
      for (let j = 0; j < n; j++) {
        const x = g * (n * u + gap) + j * u;
        out += `<rect class="cp-pop" style="animation-delay:${(g * n + j) * 18}ms" x="${x.toFixed(1)}" y="${y}" width="${(u - 2).toFixed(1)}" height="28" rx="3" fill="${fills[g % 2]}"/>`;
      }
    return out;
  };
  return `<svg class="cp-svg" viewBox="0 0 600 76" role="img" aria-label="Two bars. The top bar has ${a * k} blocks and the bottom bar has ${b * k} blocks, in ${k} groups.">${row(a, 4, ["#1e3a5f", "#4a6fa5"])}${row(b, 42, ["#2a7f7a", "#5fb3ad"])}</svg>`;
}

const stepper = (field, label, v) =>
  `<div class="cp-stepper" role="group" aria-label="${label}"><span class="cp-label">${label}</span><button type="button" class="cp-btn" data-cp-act="${ID}:dec" data-cp-arg="${field}" aria-label="Fewer ${label}">−</button><output>${v}</output><button type="button" class="cp-btn" data-cp-act="${ID}:inc" data-cp-arg="${field}" aria-label="More ${label}">+</button></div>`;

function ratioLab(st, detail, vs) {
  const { a, b, k, la, lb } = vs.r;
  const m = ratioModel(a, b, k, la, lb);
  const frames = detail.studio.frames[`l${st.level}`] || [];
  return `
    <div class="cp-card">
      <p class="cp-muted">Make two amounts. Then make more groups of the same amounts and see what stays the same.</p>
      <div class="cp-lab-controls">${stepper("a", "Amount A in one group", a)}${stepper("b", "Amount B in one group", b)}${stepper("k", "Number of groups", k)}</div>
      <div class="cp-lab-controls"><div class="cp-pair"><label class="cp-label" for="cpLa">Name for A</label><input id="cpLa" class="cp-select" data-cp-in="${ID}:la" value="${esc(la)}" maxlength="24" autocomplete="off"></div><div class="cp-pair"><label class="cp-label" for="cpLb">Name for B</label><input id="cpLb" class="cp-select" data-cp-in="${ID}:lb" value="${esc(lb)}" maxlength="24" autocomplete="off"></div></div>
      ${ratioSvg(a, b, k)}
      <table class="cp-table"><caption class="cp-muted">Ratio table</caption><thead><tr><th scope="col">Groups</th><th scope="col">${esc(la)}</th><th scope="col">${esc(lb)}</th></tr></thead><tbody>${m.rows.map((r) => `<tr><td>${r.times}</td><td>${r.a}</td><td>${r.b}</td></tr>`).join("")}</tbody></table>
      <p class="cp-say" role="status"><b>${esc(m.sentence)}</b> ${esc(m.scaled)} The ratio is still ${m.simplest[0]} to ${m.simplest[1]} when it is written in its simplest form.</p>
      ${frames.length ? `<h5>Say it with a sentence frame</h5><ul class="cp-plain">${frames.map((f) => `<li>${blanks(f)}</li>`).join("")}</ul>` : ""}
      <button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:print">Print this ratio sheet</button>
    </div>`;
}

// ── Science: fair test + claim / evidence / reasoning ───────────────────────

const CER_FIELDS = [
  ["change", "What will I change? (one thing)"],
  ["measure", "What will I measure?"],
  ["same", "What will stay the same?"],
  ["claim", "Claim: my answer to the question"],
  ["ev1", "Evidence 1: what I saw or measured"],
  ["ev2", "Evidence 2: another thing I saw or measured"],
  ["reason", "Reasoning: why the evidence supports the claim"],
];
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

/** Light checks on what was typed: the unit words used and a changed-thing / measured-thing mix-up. Never a grade. */
export function cerCheck(fields, detail) {
  const all = CER_FIELDS.map(([k]) => fields[k] || "").join(" ");
  const used = termsIn(all, detail.studio.vocab).map((v) => v.term);
  const notes = [];
  if (norm(fields.change) && norm(fields.change) === norm(fields.measure))
    notes.push(
      "What you change and what you measure look the same. In a fair test they are different things.",
    );
  if (norm(fields.change) && norm(fields.same).split(" ").includes(norm(fields.change)))
    notes.push("The thing you change is also listed as staying the same.");
  const empty = CER_FIELDS.filter(([k]) => !norm(fields[k])).length;
  return { used, notes, empty };
}

function cerLab(st, detail, vs) {
  const res = vs.checked ? cerCheck(vs.cer, detail) : null;
  const frames = detail.studio.frames[`l${st.level}`] || [];
  return `
    <div class="cp-card">
      <p class="cp-prompt"><b>Question:</b> ${esc(detail.studio.essential_question)}</p>
      ${CER_FIELDS.map(([k, label]) => `<label class="cp-label" for="cpc-${k}">${label}</label><textarea id="cpc-${k}" class="cp-textarea" rows="2" data-cp-in="${ID}:cer.${k}" autocomplete="off" spellcheck="false">${esc(vs.cer[k] || "")}</textarea>`).join("")}
      <p class="cp-chips">${detail.studio.vocab.map((v) => `<span>${esc(v.term)}</span>`).join("")}</p>
      <p class="cp-muted">Use these unit words. Your writing stays on this device.</p>
      ${frames.length ? `<h5>Sentence frames</h5><ul class="cp-plain">${frames.map((f) => `<li>${blanks(f)}</li>`).join("")}</ul>` : ""}
      <div class="cp-actions"><button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:check">Check my words</button><button type="button" class="cp-btn" data-cp-act="${ID}:print">Print my organizer</button></div>
      ${res ? `<div class="cp-note" role="status">${res.used.length ? `Unit words you used: ${res.used.map(esc).join(", ")}.` : "No unit words used yet."}${res.empty ? ` ${res.empty} box${res.empty === 1 ? " is" : "es are"} still empty.` : ""}${res.notes.map((n) => ` ${esc(n)}`).join("")}</div>` : ""}
    </div>`;
}

// ── ELA: sentence lab ───────────────────────────────────────────────────────

/** One authored kernel joined to its because / but / so clause with the right punctuation. */
export function joinSentence(item, connector) {
  const clause = item[connector];
  if (!clause) return "";
  return `${strip(item.kernel)}${connector === "because" ? "" : ","} ${connector} ${clause}`;
}

function sentenceLab(st, detail, vs) {
  const items = detail.writing.bbs;
  const item = items[vs.s.i] || items[0];
  const exp = detail.writing.expand[vs.s.e] || detail.writing.expand[0];
  const partKeys = Object.keys(exp.parts);
  const chosen = partKeys.filter((k) => vs.s.parts.includes(k));
  const done = chosen.length === partKeys.length;
  const chip = (act, arg, label, on) =>
    `<button type="button" class="cp-chip" data-cp-act="${ID}:${act}" data-cp-arg="${arg}" aria-pressed="${on}">${esc(label)}</button>`;
  return `
    <div class="cp-card">
      <h4>Join two ideas</h4>
      <div class="cp-chiprow cp-chiprow--tight">${items.map((_, i) => chip("sitem", i, `Sentence ${i + 1}`, i === vs.s.i)).join("")}</div>
      <p class="cp-question">${esc(strip(item.kernel))}…</p>
      <div class="cp-chiprow">${["because", "but", "so"]
        .filter((c) => item[c])
        .map((c) => chip("sconn", c, c, vs.s.conn === c))
        .join("")}</div>
      ${vs.s.conn ? `<p class="cp-say cp-fadein" role="status">${esc(joinSentence(item, vs.s.conn))}</p><p class="cp-muted">${{ because: "because gives the reason.", but: "but shows something different or unexpected.", so: "so shows what happened as a result." }[vs.s.conn]}</p>` : `<p class="cp-muted">Pick a linking word to finish the sentence.</p>`}
    </div>
    <div class="cp-card">
      <h4>Add details</h4>
      <div class="cp-chiprow cp-chiprow--tight">${detail.writing.expand.map((_, i) => chip("eitem", i, `Short sentence ${i + 1}`, i === vs.s.e)).join("")}</div>
      <p class="cp-question">${esc(exp.kernel)}</p>
      <div class="cp-chiprow">${partKeys.map((k) => chip("epart", k, `Add: ${k}`, vs.s.parts.includes(k))).join("")}</div>
      <ul class="cp-plain">${chosen.map((k) => `<li><b>${esc(k)}:</b> ${esc(exp.parts[k])}</li>`).join("")}</ul>
      ${done ? `<p class="cp-say cp-fadein" role="status">${esc(exp.model)}</p>` : `<p class="cp-muted">Add every detail to see the full sentence.</p>`}
    </div>`;
}

// ── Social Studies: reason and result ───────────────────────────────────────

/** Multiple choice for one authored cause-and-effect item. Distractors are the other items' clauses. */
export function causeOptions(detail, i) {
  const items = detail.writing.bbs;
  const item = items[i];
  const make = (key) => {
    const distinct = [...new Set(items.map((x) => x[key]).filter(Boolean))];
    const opts = shuffle(distinct, `${detail.unit.id}:${i}:${key}`);
    return { options: opts, answer: opts.indexOf(item[key]) };
  };
  return { kernel: item.kernel, because: make("because"), so: make("so") };
}

function causeLab(st, detail, vs) {
  const items = detail.writing.bbs;
  const i = clamp(vs.c.i, 0, items.length - 1);
  const o = causeOptions(detail, i);
  const pick = (key, label) => {
    const picked = vs.c[`${i}:${key}`];
    const right = picked === o[key].answer;
    return `<fieldset class="cp-field"><legend>${label}</legend><div class="cp-chiprow">${o[key].options.map((t, oi) => `<button type="button" class="cp-chip" data-cp-act="${ID}:cpick" data-cp-arg="${key}:${oi}" aria-pressed="${picked === oi}">${esc(strip(t))}</button>`).join("")}</div>${picked === undefined ? "" : `<p class="cp-note" role="status">${right ? "Yes, that fits." : "Not quite. Read the sentence again and try another."}</p>`}</fieldset>`;
  };
  const both = vs.c[`${i}:because`] === o.because.answer && vs.c[`${i}:so`] === o.so.answer;
  const item = items[i];
  return `
    <div class="cp-card">
      <div class="cp-chiprow cp-chiprow--tight">${items.map((_, n) => `<button type="button" class="cp-chip" data-cp-act="${ID}:citem" data-cp-arg="${n}" aria-pressed="${n === i}">Event ${n + 1}</button>`).join("")}</div>
      ${chainFlow({ because: vs.c[`${i}:because`] === o.because.answer ? strip(item.because) : "", event: strip(o.kernel), so: vs.c[`${i}:so`] === o.so.answer ? strip(item.so) : "" })}
      ${pick("because", "Why did it happen? It happened because…")}
      ${pick("so", "What happened next? So…")}
      ${both ? `<p class="cp-say cp-fadein" role="status">${esc(`${strip(item.kernel)} because ${strip(item.because)}, so ${item.so}`)}</p>` : ""}
    </div>`;
}

// ── Every subject: build the model sentence ─────────────────────────────────

export function mentorChunks(detail) {
  return detail.studio.mentor.chunks.map((c, i) => ({ ...c, i }));
}

function mentorLab(st, detail, vs) {
  const chunks = mentorChunks(detail);
  if (!vs.m.order)
    vs.m.order = shuffle(
      chunks.map((c) => c.i),
      `${detail.unit.id}:m:${vs.m.round}`,
    );
  const order = vs.m.order;
  const right = order.every((v, p) => v === p);
  const rows = order
    .map((ci, p) => {
      const c = chunks[ci];
      const job = vs.m.checked
        ? `<small class="${ci === p ? "cp-ok" : "cp-fix"}">${ci === p ? "In place. " : "Not here yet. "}${esc(c.role)}.</small>`
        : "";
      return `<li class="cp-item"><div class="cp-item-main"><b>${esc(c.text)}</b>${job}</div><div class="cp-item-actions"><button type="button" class="cp-btn" data-cp-act="${ID}:mup" data-cp-arg="${p}" aria-label="Move up: ${esc(c.text)}" ${p === 0 ? "disabled" : ""}>↑</button><button type="button" class="cp-btn" data-cp-act="${ID}:mdown" data-cp-arg="${p}" aria-label="Move down: ${esc(c.text)}" ${p === order.length - 1 ? "disabled" : ""}>↓</button></div></li>`;
    })
    .join("");
  return `
    <div class="cp-card">
      <p class="cp-muted">These parts make one sentence. Put them in order. Then check.</p>
      <ol class="cp-list">${rows}</ol>
      <div class="cp-actions"><button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:mcheck">Check the order</button><button type="button" class="cp-btn" data-cp-act="${ID}:mshuffle">Shuffle again</button></div>
      ${vs.m.checked ? (right ? `<p class="cp-say cp-fadein" role="status">${esc(detail.studio.mentor.text)}</p>` : `<p class="cp-note" role="status">Not all parts are in place yet. Read each part aloud and ask: what comes first?</p>`) : ""}
    </div>`;
}

// ── Shell ───────────────────────────────────────────────────────────────────

const DRAW = {
  ratio: ratioLab,
  cer: cerLab,
  sentence: sentenceLab,
  cause: causeLab,
  mentor: mentorLab,
};

function state(st, detail) {
  const vs = vstate(st, ID, {});
  vs.r ??= { a: 2, b: 3, k: 2, la: "part A", lb: "part B" };
  vs.cer ??= {};
  vs.s ??= { i: 0, conn: null, e: 0, parts: [] };
  vs.c ??= { i: 0 };
  vs.m ??= { round: 0, checked: false, order: null };
  vs.lab ??= labsFor(detail)[0].id;
  return vs;
}

export function render(st, detail) {
  const vs = state(st, detail);
  const labs = labsFor(detail);
  if (!labs.some((l) => l.id === vs.lab)) vs.lab = labs[0].id;
  return `
    <div class="cp-labs">
      <fieldset class="cp-field"><legend>Pick a lab</legend><div class="cp-chiprow">${labs.map((l) => `<button type="button" class="cp-chip" data-cp-act="${ID}:lab" data-cp-arg="${l.id}" aria-pressed="${l.id === vs.lab}">${esc(l.title)}<small>${esc(l.hint)}</small></button>`).join("")}</div></fieldset>
      ${DRAW[vs.lab](st, detail, vs)}
    </div>`;
}

export function act(st, action, arg, ctx) {
  const detail = ctx.detail;
  const vs = state(st, detail);
  const items = detail.writing?.bbs || [];
  switch (action) {
    case "lab":
      vs.lab = arg;
      return true;
    case "inc":
    case "dec": {
      const lim = { a: [1, 12], b: [1, 12], k: [1, 6] }[arg];
      vs.r[arg] = clamp(vs.r[arg] + (action === "inc" ? 1 : -1), lim[0], lim[1]);
      return true;
    }
    case "check":
      vs.checked = true;
      return true;
    case "sitem":
      vs.s.i = Number(arg);
      vs.s.conn = null;
      return true;
    case "sconn":
      vs.s.conn = arg;
      return true;
    case "eitem":
      vs.s.e = Number(arg);
      vs.s.parts = [];
      return true;
    case "epart":
      vs.s.parts = vs.s.parts.includes(arg)
        ? vs.s.parts.filter((p) => p !== arg)
        : [...vs.s.parts, arg];
      return true;
    case "citem":
      vs.c.i = clamp(Number(arg), 0, Math.max(0, items.length - 1));
      return true;
    case "cpick": {
      const [key, oi] = arg.split(":");
      vs.c[`${vs.c.i}:${key}`] = Number(oi);
      return true;
    }
    case "mup":
    case "mdown": {
      const p = Number(arg);
      const q = action === "mup" ? p - 1 : p + 1;
      if (vs.m.order && q >= 0 && q < vs.m.order.length)
        [vs.m.order[p], vs.m.order[q]] = [vs.m.order[q], vs.m.order[p]];
      vs.m.checked = false;
      return true;
    }
    case "mcheck":
      vs.m.checked = true;
      return true;
    case "mshuffle":
      vs.m = { round: vs.m.round + 1, checked: false, order: null };
      return true;
    case "print":
      openPrint(labDoc(detail, vs, st.level), `lab-${detail.unit.id}.html`);
      return false;
    default:
      return false;
  }
}

/** Field input: text boxes update state without a redraw (so typing keeps focus); name boxes redraw on change. */
export function input(st, field, value, _kind, ctx) {
  const vs = state(st, ctx.detail);
  if (field.startsWith("cer.")) {
    vs.cer[field.slice(4)] = value;
    return false;
  }
  if (field === "la" || field === "lb") {
    // Applied on the next redraw (a stepper press). Redrawing on blur would swallow that press.
    vs.r[field] = value.trim() || (field === "la" ? "part A" : "part B");
    return false;
  }
  return false;
}

export function labDoc(detail, vs, level) {
  const unit = detail.unit;
  if (vs.lab === "cer") {
    const rows = CER_FIELDS.map(
      ([k, label]) =>
        `<h3>${esc(label)}</h3><div class="lines">${vs.cer[k] ? `<p>${esc(vs.cer[k])}</p>` : "<div></div><div></div>"}</div>`,
    ).join("");
    return doc(
      `Evidence organizer - ${unit.unit_title}`,
      `<div class="head"><div><h1>Fair test and evidence</h1><div class="meta">${unitLine(unit)}</div></div><div class="name">Name <span></span></div></div><p class="q">${esc(detail.studio.essential_question)}</p>${rows}`,
      FOOT,
    );
  }
  const { a, b, k, la, lb } = vs.r;
  const m = ratioModel(a, b, k, la, lb);
  return doc(
    `Ratio sheet - ${unit.unit_title}`,
    `<div class="head"><div><h1>Compare and scale</h1><div class="meta">${unitLine(unit)}</div></div><div class="name">Name <span></span></div></div>
     <p class="q">${esc(m.sentence)}</p>
     <table style="border-collapse:collapse;width:60%"><tr><th style="border:1pt solid #111">Groups</th><th style="border:1pt solid #111">${esc(la)}</th><th style="border:1pt solid #111">${esc(lb)}</th></tr>${m.rows.map((r) => `<tr><td style="border:1pt solid #111;padding:4pt">${r.times}</td><td style="border:1pt solid #111">${r.a}</td><td style="border:1pt solid #111">${r.b}</td></tr>`).join("")}</table>
     <p>${esc(m.scaled)} Simplest form: ${m.simplest[0]} to ${m.simplest[1]}.</p>
     <h2>Say it</h2><ol class="frames">${(detail.studio.frames[`l${level}`] || []).map((f) => `<li>${printBlanks(f)}</li>`).join("")}</ol>`,
    FOOT,
  );
}
