/* =============================================================================
 * Teach the Machine — page controller (vanilla ES module, no build step).
 * -----------------------------------------------------------------------------
 * The student teaches an AI learner that holds ONE wrong idea — by default the
 * one the class is actually making most this week (/api/class-pulse). The
 * learner only lets the idea go when the explanation covers every item in its
 * rubric, and that rubric is on screen the whole time as a live checklist. The
 * checklist is the scoring model made visible: nothing is hidden from the
 * student about how they are being judged.
 *
 * NO countdowns and no failure state anywhere in this file — platform rule. A
 * student can always keep explaining.
 *
 * Degradation:
 *   /api/class-pulse missing or suppressed -> curriculum-default rotation drawn
 *   from /data/curriculum-nervous-system.json. Both fetches missing -> the tag
 *   list baked into personas.js. There is no error screen.
 *   /api/teach-machine unreachable -> the same scripted persona the Function
 *   falls back to, run locally from personas.js probes.
 * ========================================================================== */

import {
  PERSONAS,
  SENTENCE_STARTERS,
  TAGS,
  evaluateTurns,
  isKnownTag,
  nextProbe,
} from "./personas.js";

const LANG_KEY = "nt_ttm.lang";
const PULSE_URL = "/api/class-pulse?days=7";
const GRAPH_URL = "/data/curriculum-nervous-system.json";
const API_URL = "/api/teach-machine";

const I18N = {
  en: {
    back: "Back to curriculum",
    title: "Teach the Machine",
    lede: "Your learner is a Grade 6 student who is stuck on one idea. You are the teacher. You are judged on how well you explain — never on getting an answer right.",
    whyPulse: "This is the mistake our class has been making most this week",
    whyDefault: "This is this week's practice focus",
    whyMetaPulse: (share) =>
      `About ${share}% of the mix-ups our class logged in the last 7 days. Counts only — no names are ever collected.`,
    whyMetaDefault:
      "Not enough class data has built up yet to name a top mistake, so today's learner comes from the curriculum's own list.",
    standardLine: (ids) => `Standard: ${ids}`,
    checklist: "What my learner still doesn't get",
    checklistHint:
      "Tick these off by explaining them. Your learner will not change its mind until all of them are covered.",
    progress: (done, total) => `${done} of ${total} ideas covered`,
    starters: "Sentence starters",
    wordbank: "Word bank",
    entryLabel: "Type your explanation here",
    placeholder: "Explain it the way you'd explain it to a friend. Say why, not just what.",
    send: "Teach it",
    sending: "Sending…",
    restart: "Start over",
    you: "You",
    thinking: "thinking…",
    winTitle: "Your learner gets it.",
    winSub:
      "It just said the idea back in its own words. That only happens when the explanation actually worked.",
    scKicker: "I taught the machine",
    scTitle: (name) => `I taught ${name} something real`,
    scLine: (label) => `The mix-up I cleared up: ${label}`,
    scFoot: (date, std) => `${date} · ${std} · Neft Teacher Grade 6 Math`,
    copy: "Copy summary",
    copied: "Copied!",
    print: "Print / save",
    modelAnswer: "Teacher: one model explanation",
    footer:
      "Nothing you type is saved or shared. Your learner is a character, not a real classmate, and the mistake it holds comes from anonymous counts across the whole class.",
    offlineNote:
      "Your learner is running in offline mode right now — it still asks real questions.",
    emptyEntry: "Write a sentence or two first, then teach it.",
  },
  es: {
    back: "Volver al currículo",
    title: "Enseña a la Máquina",
    lede: "Tu aprendiz es un estudiante de 6.º grado atorado en una idea. Tú eres el maestro. Te evalúan por lo bien que explicas — nunca por acertar una respuesta.",
    whyPulse: "Este es el error que nuestra clase ha cometido más esta semana",
    whyDefault: "Este es el enfoque de práctica de esta semana",
    whyMetaPulse: (share) =>
      `Cerca del ${share}% de las confusiones registradas en la clase en los últimos 7 días. Solo conteos — nunca se recogen nombres.`,
    whyMetaDefault:
      "Todavía no hay suficientes datos de la clase para nombrar un error principal, así que el aprendiz de hoy viene de la lista del currículo.",
    standardLine: (ids) => `Estándar: ${ids}`,
    checklist: "Lo que mi aprendiz todavía no entiende",
    checklistHint:
      "Márcalos explicándolos. Tu aprendiz no cambiará de opinión hasta que estén todos cubiertos.",
    progress: (done, total) => `${done} de ${total} ideas cubiertas`,
    starters: "Inicios de oración",
    wordbank: "Banco de palabras",
    entryLabel: "Escribe tu explicación aquí",
    placeholder: "Explícalo como se lo explicarías a un amigo. Di el porqué, no solo el qué.",
    send: "Enseñar",
    sending: "Enviando…",
    restart: "Empezar de nuevo",
    you: "Tú",
    thinking: "pensando…",
    winTitle: "¡Tu aprendiz lo entendió!",
    winSub:
      "Acaba de decir la idea con sus propias palabras. Eso solo pasa cuando la explicación de verdad funcionó.",
    scKicker: "Le enseñé a la máquina",
    scTitle: (name) => `Le enseñé algo real a ${name}`,
    scLine: (label) => `La confusión que aclaré: ${label}`,
    scFoot: (date, std) => `${date} · ${std} · Matemáticas de 6.º grado, Neft Teacher`,
    copy: "Copiar resumen",
    copied: "¡Copiado!",
    print: "Imprimir / guardar",
    modelAnswer: "Maestro: una explicación modelo",
    footer:
      "Nada de lo que escribes se guarda ni se comparte. Tu aprendiz es un personaje, no un compañero real, y el error que sostiene viene de conteos anónimos de toda la clase.",
    offlineNote:
      "Tu aprendiz está funcionando sin conexión en este momento — igual hace preguntas de verdad.",
    emptyEntry: "Escribe una o dos oraciones primero, y luego enséñale.",
  },
};

const state = {
  lang: readLang(),
  tag: "",
  persona: null,
  /** [{ role: "learner" | "student" | "opening", text }] */
  turns: [],
  understanding: { addressed: [], missing: [], convinced: false },
  pulse: null,
  fromPulse: false,
  standards: [],
  busy: false,
  offline: false,
  won: false,
};

const el = (id) => document.getElementById(id);

/* ── Language ────────────────────────────────────────────────────────────── */

function readLang() {
  try {
    return localStorage.getItem(LANG_KEY) === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}

function writeLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode — the toggle still works for this session */
  }
}

const t = () => I18N[state.lang];

/* ── Choosing today's learner ────────────────────────────────────────────── */

function dayIndex() {
  const now = new Date();
  const start = Date.UTC(now.getFullYear(), 0, 0);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - start) / 86400000);
}

async function getJson(url) {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Prefer the class's top misconception; otherwise rotate through the
 * curriculum's own misconception list. Never returns nothing.
 */
async function pickTag() {
  const [pulse, graph] = await Promise.all([getJson(PULSE_URL), getJson(GRAPH_URL)]);
  state.pulse = pulse;

  if (pulse && pulse.ok && !pulse.suppressed && Array.isArray(pulse.tags)) {
    const top = pulse.tags.find((row) => row && isKnownTag(row.tag));
    if (top) {
      state.fromPulse = true;
      state.standards = Array.isArray(top.standards) ? top.standards : [];
      state.pulseShare = Math.round((Number(top.share) || 0) * 100);
      return top.tag;
    }
  }

  const rotation = graph && graph.misconceptions ? Object.keys(graph.misconceptions) : [];
  const usable = rotation.filter((tag) => isKnownTag(tag));
  const list = usable.length ? usable : TAGS;
  const tag = list[dayIndex() % list.length];
  const entry = graph && graph.misconceptions ? graph.misconceptions[tag] : null;
  state.standards = entry && Array.isArray(entry.standards) ? entry.standards : [];
  return tag;
}

/* ── Rendering ───────────────────────────────────────────────────────────── */

function setText(id, value) {
  const node = el(id);
  if (node) node.textContent = value;
}

function renderChrome() {
  const s = t();
  document.documentElement.lang = state.lang;
  const back = document.querySelector('[data-i18n="back"]');
  if (back) back.textContent = s.back;
  setText("lang-en", "EN");
  setText("lang-es", "ES");
  el("lang-en").setAttribute("aria-pressed", String(state.lang === "en"));
  el("lang-es").setAttribute("aria-pressed", String(state.lang === "es"));

  document.title =
    state.lang === "es" ? "Enseña a la Máquina — Neft Teacher" : "Teach the Machine — Neft Teacher";
  document.querySelector(".hero h1").textContent = s.title;
  document.querySelector(".hero .lede").textContent = s.lede;

  setText("starters-label", s.starters);
  setText("wordbank-label", s.wordbank);
  setText("entry-label", s.entryLabel);
  el("entry").setAttribute("placeholder", s.placeholder);
  el("entry").setAttribute("aria-label", s.entryLabel);
  setText("send", state.busy ? s.sending : s.send);
  setText("restart", s.restart);
  setText("checklist-heading", s.checklist);
  setText("checklist-hint", s.checklistHint);
  setText("win-heading", s.winTitle);
  setText("win-sub", s.winSub);
  setText("copy-summary", s.copy);
  setText("print-summary", s.print);
  setText("model-answer-label", s.modelAnswer);
  setText("footer-note", s.footer);
  setText("source-note", state.offline ? s.offlineNote : "");
}

function renderWhy() {
  const s = t();
  const p = state.persona;
  setText("why-kicker", state.fromPulse ? s.whyPulse : s.whyDefault);
  const label = state.lang === "es" ? `«${p.wrongIdeaEs}»` : `“${p.wrongIdea}”`;
  setText("why-text", label);
  const meta = state.fromPulse ? s.whyMetaPulse(state.pulseShare || 0) : s.whyMetaDefault;
  const stds = (state.standards.length ? state.standards : p.standards).join(", ");
  setText("why-meta", `${meta} ${stds ? s.standardLine(stds) : ""}`.trim());
}

function renderLearnerHead() {
  const p = state.persona;
  setText("avatar", p.persona.name.slice(0, 1));
  setText("learner-heading", p.persona.name);
  setText("learner-blurb", state.lang === "es" ? p.persona.blurbEs : p.persona.blurb);
}

function messageText(turn) {
  if (turn.role !== "opening") return turn.text;
  return state.lang === "es" ? state.persona.openingLineEs : state.persona.openingLine;
}

/* Both live regions below are updated INCREMENTALLY on purpose. Wiping and
 * rebuilding an aria-live container makes a screen reader re-read the entire
 * conversation (or the whole checklist) on every single render, which would
 * make the page unusable with a reader. A full rebuild only happens on a
 * language switch, and the region is muted while it happens. */
const logState = { count: 0, lang: null };

function appendMessage(log, turn) {
  const s = t();
  const div = document.createElement("div");
  div.className = `msg ${turn.role === "student" ? "msg-student" : "msg-learner"}`;
  const label = document.createElement("span");
  label.className = "msg-who";
  label.textContent = turn.role === "student" ? s.you : state.persona.persona.name;
  const body = document.createElement("span");
  body.textContent = messageText(turn);
  div.append(label, body);
  log.append(div);
}

function renderLog(pending) {
  const log = el("log");
  const rebuild = logState.lang !== state.lang || logState.count > state.turns.length;
  if (rebuild) {
    log.setAttribute("aria-live", "off");
    log.textContent = "";
    logState.count = 0;
  }
  const placeholder = log.querySelector(".msg-thinking");
  if (placeholder) placeholder.remove();

  for (let i = logState.count; i < state.turns.length; i += 1) appendMessage(log, state.turns[i]);
  logState.count = state.turns.length;

  if (pending) {
    const div = document.createElement("div");
    div.className = "msg msg-learner msg-thinking";
    div.textContent = `${state.persona.persona.name} ${t().thinking}`;
    log.append(div);
  }
  if (rebuild) {
    logState.lang = state.lang;
    log.setAttribute("aria-live", "polite");
  }
}

const checkState = { lang: null, count: 0 };

function renderChecklist() {
  const s = t();
  const list = el("checklist");
  const items = state.persona.mustAddress;
  const done = new Set(state.understanding.addressed);
  const rebuild = checkState.lang !== state.lang || checkState.count !== items.length;

  if (rebuild) {
    list.setAttribute("aria-live", "off");
    list.textContent = "";
    for (const item of items) {
      const li = document.createElement("li");
      li.dataset.id = item.id;
      const box = document.createElement("span");
      box.className = "check-box";
      box.setAttribute("aria-hidden", "true");
      box.textContent = "✓";
      const text = document.createElement("span");
      text.className = "check-text";
      li.append(box, text);
      list.append(li);
    }
    checkState.lang = state.lang;
    checkState.count = items.length;
  }

  items.forEach((item, i) => {
    const li = list.children[i];
    if (!li) return;
    const isDone = done.has(item.id);
    const cls = `check-item${isDone ? " done" : ""}`;
    if (li.className !== cls) li.className = cls;
    const label = state.lang === "es" ? item.es : item.en;
    const next = isDone ? `${label} — ✓` : label;
    const text = li.querySelector(".check-text");
    if (text.textContent !== next) text.textContent = next;
  });

  if (rebuild) list.setAttribute("aria-live", "polite");

  const pct = items.length ? Math.round((done.size / items.length) * 100) : 0;
  setText("progress-text", s.progress(done.size, items.length));
  el("bar").setAttribute("aria-valuenow", String(pct));
  el("bar-fill").style.width = `${pct}%`;
}

function renderStarters() {
  const row = el("starters");
  row.querySelectorAll("button").forEach((b) => b.remove());
  for (const starter of SENTENCE_STARTERS) {
    const text = state.lang === "es" ? starter.es : starter.en;
    row.append(makeChip(text, "chip", `${text} `));
  }
}

function renderWordBank() {
  const row = el("wordbank");
  row.querySelectorAll("button").forEach((b) => b.remove());
  const words = state.lang === "es" ? state.persona.wordBankEs : state.persona.wordBank;
  for (const word of words) {
    row.append(makeChip(word, "chip chip-word", `${word} `));
  }
}

function makeChip(label, className, insert) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = className;
  btn.textContent = label;
  btn.addEventListener("click", () => insertAtCursor(insert));
  return btn;
}

function insertAtCursor(text) {
  const box = el("entry");
  const start = box.selectionStart ?? box.value.length;
  const end = box.selectionEnd ?? box.value.length;
  const before = box.value.slice(0, start);
  const after = box.value.slice(end);
  const spacer = before && !/\s$/.test(before) ? " " : "";
  box.value = `${before}${spacer}${text}${after}`;
  const caret = (before + spacer + text).length;
  box.focus();
  box.setSelectionRange(caret, caret);
}

function renderWin() {
  const s = t();
  const p = state.persona;
  const panel = el("win");
  if (!state.understanding.convinced) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  setText("sc-kicker", s.scKicker);
  setText("sc-title", s.scTitle(p.persona.name));
  setText("sc-line", s.scLine(state.lang === "es" ? p.wrongIdeaEs : p.wrongIdea));
  const list = el("sc-list");
  list.textContent = "";
  for (const item of p.mustAddress) {
    const li = document.createElement("li");
    li.textContent = state.lang === "es" ? item.es : item.en;
    list.append(li);
  }
  const date = new Date().toLocaleDateString(state.lang === "es" ? "es" : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const stds = (state.standards.length ? state.standards : p.standards).join(", ");
  setText("sc-foot", s.scFoot(date, stds));
  setText("model-answer-text", state.lang === "es" ? p.workedEs : p.worked);
}

function renderAll(pending) {
  renderChrome();
  renderWhy();
  renderLearnerHead();
  renderLog(pending);
  renderChecklist();
  renderStarters();
  renderWordBank();
  renderWin();
}

/* ── Conversation ────────────────────────────────────────────────────────── */

function localEvaluation() {
  return evaluateTurns(state.tag, state.turns);
}

/** The same scripted learner the Pages Function falls back to, run in-page. */
function localReply(evaluation) {
  const es = state.lang === "es";
  const p = state.persona;
  if (evaluation.convinced) {
    const ideas = p.mustAddress.map((i) => (es ? i.es : i.en)).join(es ? "; y " : "; and ");
    return es
      ? `Ya lo veo. Si lo digo con mis palabras: ${ideas}. Por eso mi idea de antes no funcionaba. ¡Gracias!`
      : `Oh — I see it now. In my own words: ${ideas}. That is why my old idea did not work. Thank you!`;
  }
  const asked = state.turns.filter((x) => x.role === "learner").map((x) => x.text);
  const probe = nextProbe(state.tag, evaluation, asked, state.lang);
  let lead;
  if (evaluation.giveaways.length) {
    lead = es
      ? "Puedo repetir esas palabras, pero todavía no me lo imagino."
      : "I can repeat those words, but I still cannot picture it.";
  } else if (evaluation.addressed.length) {
    lead = es ? "Bien, eso me ayudó un poco." : "Okay, that part helped a little.";
  } else {
    lead = es ? "Mmm, todavía no lo veo." : "Hmm, I still do not see it.";
  }
  return `${lead} ${probe}`.trim();
}

function localCoaching(evaluation) {
  const es = state.lang === "es";
  if (evaluation.giveaways.length) {
    return es
      ? "Dijiste el paso. Ahora di POR QUÉ ese paso tiene sentido."
      : "You said the step. Now say WHY that step makes sense.";
  }
  const next = state.persona.mustAddress.find((i) => evaluation.missing.includes(i.id));
  if (!next) {
    return es
      ? "Ya cubriste todo. Añade un ejemplo pequeño para rematarlo."
      : "You have covered everything. Add one tiny example to seal it.";
  }
  return es ? `Todavía falta explicar: ${next.es}.` : `Still to explain: ${next.en}.`;
}

function setBusy(on) {
  state.busy = on;
  el("send").disabled = on;
  setText("send", on ? t().sending : t().send);
}

async function submitExplanation(text) {
  state.turns.push({ role: "student", text });
  // Tick the checklist immediately from the local evaluator so the student sees
  // their own progress without waiting on the network.
  const local = localEvaluation();
  state.understanding = {
    addressed: local.addressed,
    missing: local.missing,
    convinced: false,
  };
  setBusy(true);
  renderAll(true);

  const payload = {
    tag: state.tag,
    lang: state.lang,
    turns: state.turns
      .filter((turn) => turn.role !== "opening")
      .slice(-12)
      .map((turn) => ({ role: turn.role, text: turn.text.slice(0, 1200) })),
  };

  let data = null;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) data = await res.json();
  } catch {
    data = null;
  }

  if (data && data.ok && typeof data.reply === "string" && data.reply) {
    state.offline = data.source === "offline";
    state.turns.push({ role: "learner", text: data.reply });
    const u = data.understanding || {};
    const ids = state.persona.mustAddress.map((i) => i.id);
    const addressed = Array.isArray(u.addressed)
      ? u.addressed.filter((id) => ids.includes(id))
      : [];
    const merged = [...new Set([...local.addressed, ...addressed])];
    const stillMissing = ids.filter((id) => !merged.includes(id));
    state.understanding = {
      addressed: merged,
      // Same floor the Function applies: if the local rubric is fully covered
      // the student has earned the win even if the model stayed stubborn.
      convinced: (u.convinced === true || local.convinced) && stillMissing.length === 0,
      missing: stillMissing,
    };
    setText("coach", typeof data.coaching === "string" ? data.coaching : "");
  } else {
    // No backend at all: the learner still works, driven by personas.js.
    state.offline = true;
    const evaluation = localEvaluation();
    state.turns.push({ role: "learner", text: localReply(evaluation) });
    state.understanding = {
      addressed: evaluation.addressed,
      missing: evaluation.missing,
      convinced: evaluation.convinced,
    };
    setText("coach", localCoaching(evaluation));
  }

  setBusy(false);
  const justWon = state.understanding.convinced && !state.won;
  state.won = state.won || state.understanding.convinced;
  renderAll(false);

  if (justWon) {
    reportMastery();
    const heading = el("win-heading");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }
}

/** Reuse the platform emitter if it is present; never invent an event name. */
function reportMastery() {
  try {
    if (window.NTtelemetry && typeof window.NTtelemetry.track === "function") {
      window.NTtelemetry.track("mastery_reached", {
        activity: "teach-the-machine",
        tag: state.tag,
      });
    }
  } catch {
    /* telemetry must never break the page */
  }
}

function summaryText() {
  const s = t();
  const p = state.persona;
  const lines = [
    s.scKicker.toUpperCase(),
    s.scTitle(p.persona.name),
    s.scLine(state.lang === "es" ? p.wrongIdeaEs : p.wrongIdea),
    "",
    ...p.mustAddress.map((i) => `• ${state.lang === "es" ? i.es : i.en}`),
  ];
  return lines.join("\n");
}

/* ── Wiring ──────────────────────────────────────────────────────────────── */

function resetConversation() {
  state.turns = [{ role: "opening", text: "" }];
  state.understanding = {
    addressed: [],
    missing: state.persona.mustAddress.map((i) => i.id),
    convinced: false,
  };
  state.won = false;
  setText("coach", "");
  el("entry").value = "";
  renderAll(false);
}

function wire() {
  el("lang-en").addEventListener("click", () => switchLang("en"));
  el("lang-es").addEventListener("click", () => switchLang("es"));

  el("composer").addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.busy) return;
    const box = el("entry");
    const text = box.value.trim();
    if (!text) {
      setText("coach", t().emptyEntry);
      box.focus();
      return;
    }
    box.value = "";
    setText("coach", "");
    submitExplanation(text.slice(0, 1200));
  });

  el("restart").addEventListener("click", resetConversation);

  el("copy-summary").addEventListener("click", async () => {
    const text = summaryText();
    try {
      await navigator.clipboard.writeText(text);
      setText("copy-summary", t().copied);
      setTimeout(() => setText("copy-summary", t().copy), 1600);
    } catch {
      // Clipboard blocked: select the card so the student can copy by hand.
      const range = document.createRange();
      range.selectNodeContents(el("summary"));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  el("print-summary").addEventListener("click", () => window.print());
}

function switchLang(lang) {
  if (state.lang === lang) return;
  state.lang = lang;
  writeLang(lang);
  renderAll(false);
  setText("coach", "");
}

async function init() {
  const tag = await pickTag();
  state.tag = isKnownTag(tag) ? tag : TAGS[0];
  state.persona = PERSONAS[state.tag];
  resetConversation();
  wire();
}

init();
