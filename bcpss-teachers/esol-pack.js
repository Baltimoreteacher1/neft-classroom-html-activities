// ESOL Power Pack tab: a research-grounded 5-day language week built from each unit's own
// vocabulary, frame and WIDA Key Language Use. Static/printable sections live here; the
// interactive routines live in esol-pack-games.js.

import {
  dictCompare,
  doctorCheck,
  esc,
  glossaryText,
  ladderCheck,
  ladderTopText,
  renderDictogloss,
  renderDoctor,
  renderGlossary,
  renderLadder,
  renderPassport,
  renderRetrieval,
  retrievalCheck,
  saveGlossaryField,
  setGoal,
  setPassport,
  speak,
  speakSequence,
  stopSpeech,
} from "./esol-pack-games.js";

const TIER_LABEL = { "1_2": "Levels 1–2", "3_4": "Levels 3–4", "5_6": "Levels 5–6" };
const KIND_LABEL = {
  pattern: "Pattern cognate",
  identical: "Identical cognate",
  lookalike: "Look-alike",
  partial: "Partial match",
  bridge: "Meaning bridge",
  "no-cognate": "No look-alike",
};

const state = new WeakMap();

function makeStore(unitId) {
  const key = `bcpss_esol_v1:${unitId}`;
  return {
    get() {
      try {
        return JSON.parse(localStorage.getItem(key) || "{}") || {};
      } catch {
        return {};
      }
    },
    set(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage unavailable: progress stays in memory only */
      }
    },
  };
}

const shell = (id, title, badge, intro, body) => `
  <section class="ep-card" id="ep-${id}" data-ep-section="${id}">
    <header class="ep-card-head">
      <div><h3>${esc(title)}</h3>${badge ? `<span class="ep-badge">${esc(badge)}</span>` : ""}</div>
      <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm ep-noprint" data-ep-action="print" data-section="${id}">Print</button>
    </header>
    ${intro ? `<p class="ep-intro">${esc(intro)}</p>` : ""}
    <div class="ep-body">${body}</div>
  </section>`;

// ── Static sections ───────────────────────────────────────────────────────────

function renderCognates(ctx) {
  const cards = ctx.pack.cognates
    .map(
      (c) => `
    <article class="ep-cog ep-cog-${esc(c.kind)}">
      <h4>${esc(c.term)} ${c.cognate_es ? `<span class="ep-arrow">↔</span> <span lang="es">${esc(c.cognate_es)}</span>` : ""}</h4>
      <p class="ep-sub">${esc(c.def)}</p>
      <p><span class="ep-chip">${esc(KIND_LABEL[c.kind] || c.kind)}</span> ${esc(c.tip)}</p>
      ${c.pronunciation ? `<p class="ep-note">🗣 ${esc(c.pronunciation)}</p>` : ""}
      ${c.false_friend ? `<p class="ep-warn">⚠ False friend: ${esc(c.false_friend)}</p>` : ""}
      <div class="ep-row ep-noprint">
        <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-ep-action="say" data-text="${esc(c.term)}" data-lang="en-US" aria-label="Hear ${esc(c.term)} in English">🔊 English</button>
        ${c.cognate_es ? `<button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-ep-action="say" data-text="${esc(c.cognate_es.split("/")[0])}" data-lang="es-US" aria-label="Hear ${esc(c.cognate_es)} in Spanish">🔊 Español</button>` : ""}
      </div>
    </article>`,
    )
    .join("");
  return `<p class="ep-note">Detective task: say each pair aloud. Which letters change? What rule could you use on a new word? Cognates are a strength, not a shortcut.</p><div class="ep-grid">${cards}</div>`;
}

function renderDoubleDuty(ctx) {
  return `<p class="ep-note">Same word, different job. Have students sort each meaning to the class where they would hear it.</p>
    <div class="ep-grid">${ctx.pack.double_duty
      .map(
        (
          d,
        ) => `<article class="ep-cog"><h4>${esc(d.word)} ${d.in_unit ? `<span class="ep-chip">in this unit</span>` : ""}</h4>
        <ul>${d.senses.map((s) => `<li><strong>${esc(s.ctx)}:</strong> ${esc(s.def)}</li>`).join("")}</ul></article>`,
      )
      .join("")}</div>`;
}

function renderInfoGap(ctx) {
  const g = ctx.pack.info_gap;
  const card = (label, c) => `
    <article class="ep-gapcard">
      <h4>Partner ${label}</h4>
      <p class="ep-sub">I know</p>
      <ul>${c.knows.map((k) => `<li><strong>${esc(k.term)}</strong>: ${esc(k.def)}${k.cognate ? ` <span lang="es">(${esc(k.cognate)})</span>` : ""}</li>`).join("")}</ul>
      <p class="ep-sub">I need to find out</p>
      <ul>${c.needs.map((n) => `<li>${esc(n)}</li>`).join("") || "<li>The sentence frame and one example</li>"}</ul>
    </article>`;
  return `<ul class="ep-rules">${g.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
    <p class="ep-note ep-noprint">Print and cut so each partner sees only their card. Ask using: ${g.question_stems.map((s) => `<span class="ep-chip">${esc(s)}</span>`).join(" ")}</p>
    <div class="ep-grid ep-grid-2">${card("A", g.card_a)}${card("B", g.card_b)}</div>
    <p class="ep-task"><strong>Together:</strong> ${esc(g.task)}</p>`;
}

function renderTalkLine(ctx) {
  const t = ctx.pack.talk_line;
  const stems = t.stems[ctx.wida];
  return `<p class="ep-note">Post the four corners. Read a statement, give 30 seconds of silent think time, then students walk to a corner and justify the choice to a neighbor.</p>
    <ol class="ep-statements">${t.statements.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
    <div class="ep-corners">${t.corners.map((c) => `<span class="ep-corner">${esc(c)}</span>`).join("")}</div>
    <div class="ep-stems"><h4>${esc(TIER_LABEL[ctx.wida])} stems</h4><ul>${Object.values(stems)
      .map((s) => `<li>${esc(s)}</li>`)
      .join("")}</ul></div>
    <div class="ep-row ep-noprint"><button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-ep-action="spin">🎲 Pick a statement</button></div>
    <p class="ep-spin" data-ep-spin aria-live="polite"></p>`;
}

function renderRoutines(ctx) {
  return ctx.pack.routines
    .map(
      (r) =>
        `<article class="ep-routine"><h4>${esc(r.name)}</h4><p class="ep-sub">${esc(r.source)}</p><ol class="ep-steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></article>`,
    )
    .join("");
}

function renderNewcomer(ctx) {
  return `<p class="ep-note">For WIDA Levels 1–2, newcomers and students with interrupted schooling. Silent-period friendly: students show understanding before they produce full sentences, in any language.</p>
    <ul class="ep-menu">${ctx.pack.newcomer.map((n) => `<li><strong>${esc(n.label)}.</strong> ${esc(n.text)}</li>`).join("")}</ul>`;
}

function renderFamily(ctx) {
  const col = (lang, label) =>
    `<div lang="${lang}"><h4>${label}</h4><ol>${ctx.pack.family[lang].map((d) => `<li><strong>${esc(d.day)}.</strong> ${esc(d.text)}</li>`).join("")}</ol></div>`;
  return `<p class="ep-note">Families are language experts. Every task works in any home language.</p><div class="ep-grid ep-grid-2">${col("en", "English")}${col("es", "Español")}</div>`;
}

// ── Layout ────────────────────────────────────────────────────────────────────

const SECTIONS = {
  cognates: [
    "Cognate Detective Board",
    "Day 1",
    "Notice word parts and Spanish–English links.",
    renderCognates,
  ],
  doubleduty: [
    "Double-Duty Words",
    "Day 1",
    "Multiple-meaning academic words that change jobs across subjects.",
    renderDoubleDuty,
  ],
  retrieval: [
    "Spiral Retrieval",
    "Day 1",
    "Spaced practice that brings earlier unit words back.",
    renderRetrieval,
  ],
  dictogloss: [
    "Dictogloss: Listen, Capture, Rebuild",
    "Day 2",
    "Comprehensible input plus pushed output, grounded in this unit.",
    renderDictogloss,
  ],
  infogap: [
    "Info-Gap Jigsaw",
    "Day 3",
    "Partners hold different information, so they must negotiate meaning.",
    renderInfoGap,
  ],
  doctor: [
    "Language Doctor",
    "Day 3",
    "Notice and repair common L1-transfer errors.",
    renderDoctor,
  ],
  ladder: [
    "Sentence Ladder",
    "Day 4",
    "Stretch one kernel sentence a rung at a time.",
    renderLadder,
  ],
  talkline: [
    "Talk Line Debate",
    "Day 4",
    "Take a position and justify it with frames.",
    renderTalkLine,
  ],
  routines: [
    "Subject Language Routines",
    "Day 4",
    "Routines from the discipline, filled with this unit’s language.",
    renderRoutines,
  ],
  passport: [
    "Language Passport",
    "Day 5",
    "Student self-assessment against I-can statements.",
    renderPassport,
  ],
  glossary: [
    "My Home-Language Glossary",
    "Day 5",
    "Translanguaging space to build meaning in every language.",
    renderGlossary,
  ],
  family: [
    "Family Language Mission",
    "Day 5",
    "Three short tasks for home, in English and Spanish.",
    renderFamily,
  ],
};
const ORDER = [
  "cognates",
  "doubleduty",
  "retrieval",
  "dictogloss",
  "infogap",
  "doctor",
  "ladder",
  "talkline",
  "routines",
  "passport",
  "glossary",
  "family",
];

function renderSection(ctx, id) {
  const [title, badge, intro, fn] = SECTIONS[id];
  return shell(id, title, badge, intro, fn(ctx));
}

function renderHero(ctx) {
  const { pack, wida, unit } = ctx;
  const o = pack.objectives;
  const week = pack.week_plan
    .map(
      (
        d,
      ) => `<li class="ep-day"><div><strong>Day ${d.day} · ${esc(d.title)}</strong> <span class="ep-sub">${d.minutes} min</span></div><p>${esc(d.focus)}</p>
      <div class="ep-row ep-noprint">${d.sections
        .filter((s) => SECTIONS[s])
        .map(
          (s) =>
            `<button type="button" class="ep-jump" data-ep-action="jump" data-section="${s}">${esc(SECTIONS[s][0])}</button>`,
        )
        .join("")}</div></li>`,
    )
    .join("");
  return `
    <header class="ep-hero">
      <p class="ep-kicker">ESOL Power Pack · WIDA ${esc(pack.klu)}</p>
      <h2>5-Day Language Week for ${esc(unit.unit_title)}</h2>
      <p class="ep-lead">Routines grounded in second-language acquisition research: comprehensible input, interaction, pushed output, noticing, spaced retrieval and translanguaging. Pair with the Language Connections, Studio and Activities tabs.</p>
      <div class="ep-objectives">
        <h3>Objectives (${esc(TIER_LABEL[wida])})</h3>
        <p><strong>Content:</strong> ${esc(o.content)}</p>
        <p><strong>Language:</strong> ${esc(o.language[wida])}</p>
        <p><strong>Look-for:</strong> ${esc(o.look_fors[wida])}</p>
        ${o.standards.length ? `<p class="ep-sub">Standards: ${o.standards.map(esc).join(", ")}</p>` : ""}
      </div>
      <ol class="ep-week">${week}</ol>
      <details class="ep-details"><summary>Newcomer pathway (WIDA 1–2)</summary>${renderNewcomer(ctx)}</details>
    </header>`;
}

function printSection(card) {
  const w = window.open("", "_blank", "noopener");
  if (!w) return;
  w.document
    .write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(card.querySelector("h3")?.textContent || "ESOL Power Pack")}</title>
    <link rel="stylesheet" href="/bcpss-teachers/bcpss-teachers.css"><link rel="stylesheet" href="/bcpss-teachers/esol-pack.css"></head>
    <body class="ep-printpage"><main class="ep-root">${card.outerHTML}</main></body></html>`);
  w.document.close();
  w.addEventListener("load", () => w.print());
}

function once(ctx, id) {
  if (ctx.state.touched.has(id)) return;
  ctx.state.touched.add(id);
  ctx.onTelemetry?.("esol_routine");
}

function handleClick(ctx, event) {
  const el = event.target.closest("[data-ep-action]");
  if (!el || !ctx.root.contains(el)) return;
  const action = el.dataset.epAction;
  const section = el.closest("[data-ep-section]");
  if (section) once(ctx, section.dataset.epSection);
  const sectionEl = section || ctx.root;

  if (action === "jump")
    ctx.root
      .querySelector(`#ep-${el.dataset.section}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  else if (action === "print") printSection(ctx.root.querySelector(`#ep-${el.dataset.section}`));
  else if (action === "say") speak(el.dataset.text, { lang: el.dataset.lang, rate: 0.85 });
  else if (action === "dict-play") {
    const sentences = ctx.pack.dictogloss.sentences;
    const mode = el.dataset.mode;
    if (mode === "chunks") speakSequence(sentences, 0.9, 1800);
    else {
      stopSpeech();
      speak(ctx.pack.dictogloss.text, { rate: mode === "slow" ? 0.7 : 0.95 });
    }
  } else if (action === "dict-stop") stopSpeech();
  else if (action === "dict-compare") dictCompare(ctx, sectionEl);
  else if (action === "doc-check") doctorCheck(ctx, sectionEl, Number(el.dataset.i));
  else if (action === "ladder-check") ladderCheck(ctx, sectionEl, Number(el.dataset.i));
  else if (action === "ladder-copy") {
    const text = ladderTopText(sectionEl, ctx.pack.ladder.tiers[ctx.wida].rungs.length);
    if (text) navigator.clipboard?.writeText(text).then(() => (el.textContent = "Copied!"));
  } else if (action === "ret-check") retrievalCheck(ctx, sectionEl);
  else if (action === "pp-set") {
    setPassport(ctx, el.dataset.domain, el.dataset.v);
    sectionEl.outerHTML = renderSection(ctx, "passport");
  } else if (action === "gloss-copy")
    navigator.clipboard?.writeText(glossaryText(ctx)).then(() => (el.textContent = "Copied!"));
  else if (action === "spin") {
    const list = ctx.pack.talk_line.statements;
    const pick = list[Math.floor(Math.random() * list.length)];
    sectionEl.querySelector("[data-ep-spin]").textContent = `Statement: ${pick}`;
  }
}

function handleInput(ctx, event) {
  const el = event.target;
  if (el.matches?.("[data-ep-gloss]")) saveGlossaryField(ctx, el);
  else if (el.matches?.("[data-ep-goal]")) setGoal(ctx, el.value);
}

export function renderEsolPack(container, { unit, pack, wida = "3_4", onTelemetry } = {}) {
  if (!container) return;
  const prev = state.get(container);
  if (prev) {
    container.removeEventListener("click", prev.click);
    container.removeEventListener("input", prev.input);
    container.removeEventListener("change", prev.input);
  }
  stopSpeech();
  if (!unit || !pack) {
    container.innerHTML = `<div class="bh-empty">Select a BCPSS unit to open its ESOL Power Pack.</div>`;
    return;
  }
  const ctx = {
    unit,
    pack,
    wida,
    onTelemetry,
    root: container,
    store: makeStore(unit.id),
    state: { doctor: {}, touched: new Set() },
  };
  container.innerHTML = `<div class="ep-root">${renderHero(ctx)}${ORDER.filter(
    (id) => id !== "routines" || pack.routines.length,
  )
    .map((id) => renderSection(ctx, id))
    .join("")}</div>`;
  const click = (e) => handleClick(ctx, e);
  const input = (e) => handleInput(ctx, e);
  container.addEventListener("click", click);
  container.addEventListener("input", input);
  container.addEventListener("change", input);
  state.set(container, { click, input });
}
