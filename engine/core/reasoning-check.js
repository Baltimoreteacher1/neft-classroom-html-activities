// reasoning-check.js — the ONE client for /api/reasoning/review.
//
// A student writes an explanation; if (and only if) they press the button, the
// paragraph is read once and they get back one named gap and one question.
// Never a score, never the answer. The server (functions/api/reasoning) owns
// those guarantees; this module owns the part a 12-year-old actually touches:
// an opt-in control that is quiet, bilingual, and can never get in the way.
//
// Mounted by: small-group-practice.js (studio), twr-writing.js and go-deeper.js
// (whole-class lessons), peer-exchange.js. Anything that has a <textarea> and a
// prompt can mount it — there is deliberately no second client.
//
// CONTRACT
//   - Opt-in per press. Nothing is sent while a student types.
//   - Stateless. Nothing is stored here or on the server; no name, section or id
//     is ever put in the request.
//   - Never blocks. The control does not disable, gate or score anything. If the
//     service is off, slow, rate-limited or the device is offline, the student
//     sees one plain sentence and keeps writing (Level 0 no-fail).
//   - Respects the server's caps: lengths are clipped to what the API accepts, a
//     press is ignored while one is in flight, there is a short cooldown, a longer
//     one after a 429, and a per-box ceiling so a bored student cannot burn the
//     paid model's budget.
//   - Replies in the student's language (the API takes `language: "en" | "es"`).

import { getPreferredLang } from "./i18n.js";

export const REASONING_ENDPOINT = "/api/reasoning/review";

// Mirrors the caps in functions/api/reasoning/[[path]].js. A test pins them to
// the server source so the two cannot drift apart.
export const LIMITS = Object.freeze({
  response: 1200,
  prompt: 400,
  standard: 40,
  misconception: 120,
  answerShown: 40,
  timeoutMs: 15000,
  cooldownMs: 3000,
  rateLimitCooldownMs: 20000,
  maxChecksPerBox: 6,
});

const DEFAULT_PROMPT = {
  en: "Explain your thinking.",
  es: "Explica tu razonamiento.",
};

const COPY = {
  en: {
    button: "Check my reasoning",
    again: "Check again",
    hint: "Optional. Your writing is read once to give feedback. It is not saved and not graded.",
    empty: "Write a sentence or two about your thinking first, then check it.",
    reading: "Reading your explanation…",
    strengths: "What is working",
    gap: "A missing link",
    question: "Think about this",
    note: "This is coaching, not a grade. Keep writing or move on whenever you like.",
    offline: "You are offline right now. Keep going. You can check your reasoning later.",
    unavailable:
      "The reasoning checker is not available right now. Your writing is still here. Keep going.",
    wait: "Give it a moment, then check again.",
    busy: "A lot of students are asking right now. Wait a moment and try again.",
    capped:
      "You have used the checks for this box. Read your writing out loud to a partner instead.",
  },
  es: {
    button: "Revisa mi razonamiento",
    again: "Revisar otra vez",
    hint: "Opcional. Se lee tu escrito una vez para darte ayuda. No se guarda y no tiene nota.",
    empty: "Primero escribe una o dos oraciones sobre tu razonamiento y luego revísalo.",
    reading: "Leyendo tu explicación…",
    strengths: "Lo que funciona",
    gap: "Un eslabón que falta",
    question: "Piensa en esto",
    note: "Esto es una guía, no una nota. Sigue escribiendo o avanza cuando quieras.",
    offline: "Ahora no tienes conexión. Sigue adelante. Puedes revisar tu razonamiento después.",
    unavailable:
      "El revisor de razonamiento no está disponible ahora. Tu escrito sigue aquí. Sigue adelante.",
    wait: "Dale un momento y revisa otra vez.",
    busy: "Muchos estudiantes están preguntando ahora. Espera un momento e inténtalo otra vez.",
    capped:
      "Ya usaste las revisiones de esta casilla. Mejor lee tu escrito en voz alta a un compañero.",
  },
};

/** @param {unknown} value @returns {"en"|"es"} */
export function normalizeLang(value) {
  return String(value || "")
    .toLowerCase()
    .startsWith("es")
    ? "es"
    : "en";
}

const clip = (value, max) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const text = (value) => (typeof value === "string" ? value.trim() : "");
const resolve = (value) => (typeof value === "function" ? value() : value);

/**
 * The exact body sent to the API: only the fields it reads, each clipped to the
 * server's cap. No identifier of any kind is accepted here.
 */
export function buildReviewBody({
  response,
  prompt,
  standard,
  answerShown,
  misconception,
  level,
  language,
}) {
  const lang = normalizeLang(language);
  const body = {
    prompt: clip(prompt, LIMITS.prompt) || DEFAULT_PROMPT[lang],
    response: clip(response, LIMITS.response),
    language: lang,
  };
  const stdText = clip(standard, LIMITS.standard);
  if (stdText) body.standard = stdText;
  const answer = clip(answerShown, LIMITS.answerShown);
  if (answer) body.answerShown = answer;
  const mis = clip(misconception, LIMITS.misconception);
  if (mis) body.misconception = mis;
  const lvl = Math.round(Number(level));
  if (lvl >= 1 && lvl <= 5) body.level = lvl;
  return body;
}

/**
 * One bounded request. Resolves, never throws:
 *   { ok: true, review: { strengths, gap, question } }
 *   { ok: false, reason: "offline" | "timeout" | "rate-limited" | "unavailable" }
 * @param {object} body  from buildReviewBody
 * @param {{ fetchImpl?: typeof fetch, timeoutMs?: number }} [options]
 */
export async function requestReviewBody(body, { fetchImpl, timeoutMs = LIMITS.timeoutMs } = {}) {
  const doFetch = fetchImpl || (typeof fetch === "function" ? fetch : null);
  if (!doFetch) return { ok: false, reason: "unavailable" };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { ok: false, reason: "offline" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const reply = await doFetch(REASONING_ENDPOINT, {
      method: "POST",
      credentials: "omit",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (reply.status === 429) return { ok: false, reason: "rate-limited" };
    const data = reply.ok ? await reply.json().catch(() => null) : null;
    const question = text(data?.question);
    if (!data?.ok || !question) return { ok: false, reason: "unavailable" };
    return {
      ok: true,
      review: { strengths: text(data.strengths), gap: text(data.gap), question },
    };
  } catch {
    return { ok: false, reason: controller.signal.aborted ? "timeout" : "offline" };
  } finally {
    clearTimeout(timer);
  }
}

const STYLE_ID = "rc-styles";
const CSS = `
.rc{--rc-ink:var(--sg-deep,var(--navy,#12355b));--rc-soft:var(--sg-soft,var(--teal-light,#eaf0f7));--rc-muted:var(--sg-muted,var(--muted,#475569));margin:8px 0 0;color:inherit}
.rc-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.rc-btn{display:inline-flex;flex-direction:column;align-items:flex-start;justify-content:center;min-height:44px;padding:6px 16px;border:2px dashed var(--rc-ink);border-radius:999px;background:transparent;color:var(--rc-ink);font:inherit;font-size:14px;font-weight:700;line-height:1.2;cursor:pointer}
.rc-btn:hover{background:var(--rc-soft)}
.rc-btn:focus-visible{outline:3px solid var(--rc-ink);outline-offset:2px}
.rc-btn[aria-disabled="true"]{opacity:.65;cursor:progress}
.rc-sub{font-size:.8em;font-weight:500;font-style:italic;color:var(--rc-muted)}
.rc-status{margin:0;font-size:13px;color:var(--rc-muted);min-height:1em}
.rc-hint{margin:4px 0 0;font-size:12.5px;color:var(--rc-muted)}
.rc-out{display:grid;gap:8px;margin-top:10px;padding:12px 14px;border-left:4px solid var(--rc-ink);border-radius:0 10px 10px 0;background:var(--rc-soft)}
.rc-out:empty{display:none}
.rc-out p{margin:0;font-size:14.5px;line-height:1.5}
.rc-out b{color:var(--rc-ink)}
.rc-note{font-size:12.5px!important;color:var(--rc-muted)}
:root[data-theme="dark"] .rc{--rc-ink:#c7d7ee;--rc-soft:#1c2740;--rc-muted:#b6c2d6}
@media (prefers-reduced-motion:reduce){.rc *{transition:none!important;animation:none!important}}
`;

function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head || document.documentElement).append(style);
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {string} [cls]
 * @param {string} [content]
 * @returns {HTMLElementTagNameMap[K]}
 */
function node(tag, cls, content) {
  const created = document.createElement(tag);
  if (cls) created.className = cls;
  if (content != null) created.textContent = content;
  return created;
}

const mounted = new WeakMap();
let sequence = 0;

/**
 * Mount the opt-in control for one written-response box. The caller places the
 * returned element (normally right after the textarea). Mounting twice on the
 * same textarea returns the same control.
 *
 * @param {HTMLTextAreaElement} textarea
 * @param {object} [options] each of prompt / standard / answerShown / misconception /
 *   level may be a value or a function returning one, read fresh on every press.
 * @param {string|(()=>string)} [options.prompt]  what the student was asked
 * @param {string|(()=>string)} [options.standard]
 * @param {string|(()=>string)} [options.answerShown]  the item's answer, sent so the
 *   server can refuse any coaching that states it
 * @param {string|(()=>string|null)} [options.misconception]
 * @param {number|(()=>number)} [options.level]  scaffold level 1-5 (1-2 get plainer replies)
 * @param {string} [options.language]  "en" | "es"; defaults to the saved preference
 * @param {typeof fetch} [options.fetchImpl]  test seam
 * @returns {HTMLElement}
 */
export function mountReasoningCheck(textarea, options = {}) {
  const existing = mounted.get(textarea);
  if (existing) return existing;
  ensureStyles();

  const uid = `rc-${++sequence}`;
  const lang = () => normalizeLang(options.language || getPreferredLang());
  const other = () => (lang() === "es" ? "en" : "es");

  const root = node("div", "rc");
  root.dataset.reasoningCheck = "";
  root.dataset.state = "idle";
  const row = node("div", "rc-row");
  const button = node("button", "rc-btn");
  button.type = "button";
  const status = node("p", "rc-status");
  status.id = `${uid}-status`;
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const hint = node("p", "rc-hint", COPY[lang()].hint);
  hint.id = `${uid}-hint`;
  const out = node("div", "rc-out");
  out.id = `${uid}-out`;
  out.setAttribute("role", "status");
  out.setAttribute("aria-live", "polite");
  button.setAttribute("aria-describedby", hint.id);
  row.append(button, status);
  root.append(row, hint, out);

  const paintButton = (key) => {
    const lead = node("span", "", COPY[lang()][key]);
    const sub = node("span", "rc-sub", COPY[other()][key]);
    sub.lang = other();
    button.replaceChildren(lead, sub);
  };
  paintButton("button");

  let busy = false;
  let used = 0;
  let notBefore = 0;
  const setState = (state) => {
    root.dataset.state = state;
    button.setAttribute("aria-disabled", String(state === "reading"));
    button.setAttribute("aria-busy", String(state === "reading"));
  };

  const show = (review) => {
    const c = COPY[lang()];
    out.replaceChildren();
    const line = (cls, label, body) => {
      const p = node("p", cls);
      p.append(node("b", "", `${label}: `), document.createTextNode(body));
      out.append(p);
    };
    if (review.strengths) line("rc-good", c.strengths, review.strengths);
    if (review.gap) line("rc-gap", c.gap, review.gap);
    line("rc-q", c.question, review.question);
    out.append(node("p", "rc-note", c.note));
  };

  const failure = { offline: "offline", timeout: "unavailable", unavailable: "unavailable" };

  button.addEventListener("click", async () => {
    const c = COPY[lang()];
    if (busy) return;
    const response = textarea.value.trim();
    if (!response) {
      status.textContent = c.empty;
      setState("idle");
      return;
    }
    if (used >= LIMITS.maxChecksPerBox) {
      status.textContent = c.capped;
      setState("capped");
      return;
    }
    if (notBefore > Date.now()) {
      status.textContent = c.wait;
      return;
    }
    busy = true;
    used += 1;
    notBefore = Date.now() + LIMITS.cooldownMs;
    setState("reading");
    status.textContent = c.reading;
    const body = buildReviewBody({
      response,
      prompt: resolve(options.prompt),
      standard: resolve(options.standard),
      answerShown: resolve(options.answerShown),
      misconception: resolve(options.misconception),
      level: resolve(options.level),
      language: lang(),
    });
    const result = await requestReviewBody(body, { fetchImpl: options.fetchImpl });
    busy = false;
    if (result.ok) {
      status.textContent = "";
      show(result.review);
      setState("done");
      paintButton("again");
      return;
    }
    if (result.reason === "rate-limited") {
      notBefore = Date.now() + LIMITS.rateLimitCooldownMs;
      status.textContent = c.busy;
    } else {
      status.textContent = c[failure[result.reason]] || c.unavailable;
    }
    setState(result.reason);
  });

  mounted.set(textarea, root);
  return root;
}

export default mountReasoningCheck;
