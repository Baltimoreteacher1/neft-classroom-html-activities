// Book Studio writing coach: a "Writing coach" panel in the editor's inspector. Eight buttons, each a way for the coach
// to ASK (Brainstorm, Organize, Expand a sentence, Genre questions, Picture description help), POINT (Clarity check)
// or OFFER (Better words, Spanish meaning). Nothing it says lands in the book unless the learner presses "Use this
// word"; every suggestion is a card the learner can dismiss. Rules shared with the server: coach-rules.js.
//
// Privacy (PLATFORM.md rule 3, decided by Joel 2026-11-16): OFF until the learner turns it on in Book settings, and
// hidden when the learner's class says the teacher turned it off. A press sends only what that button needs (this
// page's words, ONE chosen sentence or word, the page headings for Organize, a picture's catalogue name) to this
// site's own /api/book-coach. No name, no pictures or recordings, no identifiers; nothing is kept. Without a model or
// without the internet, Brainstorm, Organize, Expand, Genre and Picture fall back to built-in tips, labelled as such.
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { sentences } from "../lang/text.js";
import { storage } from "../util.js";
import { ART } from "./art.js";
import {
  LIMITS,
  OFFLINE_ACTIONS,
  PROMPT_VERSION,
  offlineCoach,
  purposeOf,
  validateRequest,
  wordCountOf,
} from "./coach-rules.js";
import { bkIcon } from "./icons.js";
import { pick, plainText, readingOrder, textToHtml } from "./model.js";
import { esc } from "./render.js";
import { sanitizeHtml } from "./sanitize.js";
import { templateById } from "./templates.js";

export const COACH_PREF = "accessPracticeLab:v1:book-coach";
const API = "/api/book-coach";
const MAX_CARDS = 4;

const ACTIONS = [
  [
    "brainstorm",
    "Brainstorm",
    "Ideas",
    "Ask me questions to find ideas for this page",
    "Hazme preguntas para encontrar ideas para esta página",
  ],
  [
    "organize",
    "Organize",
    "Organizar",
    "Look at the order of my pages",
    "Mira el orden de mis páginas",
  ],
  [
    "expand",
    "Expand a sentence",
    "Ampliar una oración",
    "Help me add detail to one sentence",
    "Ayúdame a agregar detalles a una oración",
  ],
  [
    "vocabulary",
    "Better words",
    "Mejores palabras",
    "Suggest more precise words for words I used",
    "Sugiere palabras más precisas para las que usé",
  ],
  [
    "clarity",
    "Clarity check",
    "Revisar claridad",
    "What will a reader notice in my writing?",
    "¿Qué notará un lector en mi escritura?",
  ],
  [
    "genre",
    "Genre questions",
    "Preguntas del género",
    "Questions for revising this kind of writing",
    "Preguntas para revisar este tipo de escritura",
  ],
  [
    "picture",
    "Describe a picture",
    "Describir una imagen",
    "Help me write my picture description",
    "Ayúdame a escribir la descripción de mi imagen",
  ],
  [
    "translate",
    "Spanish meaning",
    "Significado en español",
    "Explain a word I wrote, in Spanish",
    "Explica en español una palabra que escribí",
  ],
];
const actionName = (E, a) => {
  const row = ACTIONS.find((r) => r[0] === a);
  return E.I.S(row[1], row[2]);
};

const loadPref = () => {
  try {
    return JSON.parse(storage.get(COACH_PREF) || "{}")?.on === true;
  } catch {
    return false;
  }
};
const savePref = (on) => storage.set(COACH_PREF, JSON.stringify({ on }));

/** Start the coach for one editor. Returns a cleanup function. */
export function mountCoach(E) {
  E.coach = {
    on: loadPref(),
    allowed: true,
    cards: [],
    note: "",
    busy: null,
    pageId: null,
    pick: null,
    sel: null,
  };
  // A joined class decides: the teacher can turn the coach off for the class (class setting `aiCoach`).
  (async () => {
    let link = null;
    try {
      const mod = await import("../class/link.js");
      link = mod.loadLink();
      if (!link) return;
      E.coach.allowed = false; // fail closed until the class answers
      E.renderInspector();
      const me = await mod.api.whoAmI(link);
      // A class that no longer knows this learner (deleted class, removed student) is no class.
      E.coach.allowed = me.ok
        ? me.aiCoach !== false
        : me.httpStatus === 401 || me.httpStatus === 404;
    } catch {
      if (link) E.coach.allowed = false;
    }
    E.renderInspector();
  })();
  const onSel = () => {
    const sel = window.getSelection?.();
    if (!sel || sel.isCollapsed) return;
    const node = sel.anchorNode?.parentElement?.closest?.("[data-text-of]");
    if (!node || !E.root.contains(node)) return;
    E.coach.sel = {
      text: sel.toString().replace(/\s+/g, " ").trim().slice(0, LIMITS.sentence),
      pageId: E.core.page().id,
    };
  };
  document.addEventListener("selectionchange", onSel);
  return () => document.removeEventListener("selectionchange", onSel);
}

// ── what a button sends ──────────────────────────────────────────────────────────────────────────────────────

const pageTexts = (page) =>
  readingOrder(page)
    .filter((e) => e.type === "text" || e.type === "bubble")
    .map((e) => plainText(e.html))
    .filter(Boolean);

/** The selected text box's words, else this page's words. */
function currentText(E) {
  const el = E.core.selectedEl();
  if (el && (el.type === "text" || el.type === "bubble")) return plainText(el.html);
  return pageTexts(E.core.page()).join("\n");
}

const purpose = (E) => purposeOf(templateById(E.core.S.book.templateId), E.core.S.book.kind);
const promptOf = (E) => {
  const p = E.core.page().prompt;
  return p ? pick(p, "en") : "";
};
const selection = (E) => (E.coach.sel?.pageId === E.core.page().id ? E.coach.sel.text : "");

function headingOf(page) {
  const els = readingOrder(page).filter((e) => e.type === "text" || e.type === "bubble");
  const h = els.find((e) => e.role === "heading" || e.role === "title") || els[0];
  // A heading, or the first few words of the page: never the page's writing.
  return h ? plainText(h.html).split(/\s+/).slice(0, 8).join(" ").slice(0, LIMITS.heading) : "";
}

function pictureTarget(E) {
  const isPic = (e) => e && (e.type === "art" || e.type === "image" || e.type === "drawing");
  const sel = E.core.selectedEl();
  return isPic(sel) ? sel : E.core.page().elements.find(isPic) || null;
}

/** { payload } or { need: message } when the learner has to choose or write something first. */
function buildPayload(E, action, extra = {}) {
  const tr = E.I.S;
  const text = currentText(E);
  if (action === "brainstorm")
    return { payload: { title: E.core.S.book.title, prompt: promptOf(E), purpose: purpose(E) } };
  if (action === "organize") {
    const pages = E.core.S.book.pages.map((p) => ({ heading: headingOf(p) }));
    return pages.length < 2
      ? {
          need: tr(
            "Add another page first; Organize looks at the order of your pages.",
            "Agrega otra página primero; Organizar mira el orden de tus páginas.",
          ),
        }
      : { payload: { pages, purpose: purpose(E) } };
  }
  if (action === "expand") {
    const sentence = extra.sentence || (wordCountOf(selection(E)) >= 3 ? selection(E) : "");
    if (sentence) return { payload: { sentence } };
    const list = sentences(pageTexts(E.core.page()).join("\n\n"))
      .map((s) => s.text)
      .filter((s) => wordCountOf(s) >= 3 && s.length <= LIMITS.sentence)
      .slice(0, 8);
    if (!list.length)
      return {
        need: tr(
          "Write a sentence on this page first, then ask the coach about it.",
          "Escribe primero una oración en esta página y luego pregúntale al asesor.",
        ),
      };
    E.coach.pick = { action, list };
    return { need: "" };
  }
  if (action === "vocabulary" || action === "clarity" || action === "genre") {
    if (text.length > LIMITS.text)
      return {
        need: tr(
          "This page has more than 2,000 characters. Select one text box and try again.",
          "Esta página tiene más de 2,000 caracteres. Selecciona un cuadro de texto e inténtalo de nuevo.",
        ),
      };
    if (wordCountOf(text) < (action === "genre" ? 1 : 3))
      return {
        need: tr(
          "Write a few words on this page first.",
          "Escribe primero algunas palabras en esta página.",
        ),
      };
    return { payload: { text, purpose: purpose(E), prompt: promptOf(E) } };
  }
  if (action === "picture") {
    const el = pictureTarget(E);
    if (!el)
      return {
        need: tr(
          "Add a picture or a drawing to this page first.",
          "Agrega primero una imagen o un dibujo a esta página.",
        ),
      };
    const art = el.type === "art" ? ART.find((a) => a.key === el.art) : null;
    E.coach.pictureId = el.id;
    return {
      payload: {
        kind: el.type === "art" ? "art" : el.type === "image" ? "photo" : "drawing",
        name: art?.en || "",
        prompt: promptOf(E),
      },
    };
  }
  // translate: a word or short phrase the learner wrote on this page
  const phrase = (extra.phrase || selection(E)).trim();
  if (!phrase || wordCountOf(phrase) > LIMITS.phraseWords) {
    E.coach.pick = { action: "translate" };
    return { need: phrase ? tr("Choose up to 6 words.", "Elige hasta 6 palabras.") : "" };
  }
  const onPage = pageTexts(E.core.page()).join(" ").toLowerCase().includes(phrase.toLowerCase());
  if (!onPage)
    return {
      need: tr(
        "Choose a word or phrase that is on this page.",
        "Elige una palabra o frase que esté en esta página.",
      ),
    };
  return { payload: { phrase } };
}

// ── asking ──────────────────────────────────────────────────────────────────────────────────────────────────

async function ask(action, payload, lang) {
  let res;
  try {
    res = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, payload, lang }),
    });
  } catch {
    return { ok: false, offline: true };
  }
  const data = await res.json().catch(() => null);
  if (res.ok && data?.ok && data.result)
    return { ok: true, source: data.source, result: data.result };
  return { ok: false, limited: res.status === 429, offline: res.status >= 500 || res.status === 0 };
}

/** Spanish meaning from the Word Lab bank (no network), for one word the learner wrote. */
async function localGloss(phrase) {
  try {
    const { WORDS } = await import("../content/wordlab-words.js");
    const w = WORDS.find((x) => x.w.toLowerCase() === phrase.toLowerCase());
    return w ? { es: `${w.e}: ${w.de}`, en: w.d } : null;
  } catch {
    return null;
  }
}

function record(E, action, source, card) {
  try {
    const ledger = loadLedger();
    appendEntry(ledger, {
      src: "book-coach",
      task: `book-coach:${action}`,
      domain: "Writing",
      use: purpose(E),
      stage: "supported",
      kind: "first",
      supports: { coach: true },
      m: { action, items: (card.items || []).length },
      feedbackSource: source === "ai" ? "ai" : "local-rule",
      modelVersion: source === "ai" ? card.model || null : null,
      promptVersion: PROMPT_VERSION,
    });
    saveLedger(ledger);
  } catch {}
}

function toItems(action, result) {
  if (result.questions) return result.questions.map((q) => ({ text: q }));
  if (result.question) return [{ text: result.question }];
  if (result.words) return result.words.map((w) => ({ word: w.word, for: w.for, means: w.means }));
  if (result.observations)
    return [
      ...result.observations.map((o) => ({ kind: o.kind, quote: o.quote, text: o.note })),
      { kind: "next", text: result.next },
    ];
  if (action === "translate") return [{ es: result.es, en: result.en }];
  return [];
}

let seq = 0;
export async function runAction(E, action, extra = {}) {
  const tr = E.I.S;
  const lang = E.ctx.prefs?.lang === "es" ? "es" : "en";
  E.coach.note = "";
  E.coach.pick = null;
  const built = buildPayload(E, action, extra);
  if (!built.payload) {
    E.coach.note = built.need || "";
    E.renderInspector();
    E.root
      .querySelector("[data-bk-coach-pick] button, [data-bk-coach-phrase]")
      ?.focus({ preventScroll: true });
    if (built.need) E.say(built.need);
    return;
  }
  const v = validateRequest({ action, payload: built.payload, lang });
  if (!v.ok) {
    E.coach.note = tr(
      "The coach cannot read that. Try a shorter piece of writing.",
      "El asesor no puede leer eso. Prueba con un texto más corto.",
    );
    E.renderInspector();
    return;
  }
  E.coach.busy = action;
  E.renderInspector();
  const res = await ask(action, v.payload, lang);
  E.coach.busy = null;
  let card = null;
  if (res.ok) card = { source: "ai", model: res.source, items: toItems(action, res.result) };
  else {
    let local = OFFLINE_ACTIONS.includes(action) ? offlineCoach(action, v.payload, lang) : null;
    if (!local && action === "translate") local = await localGloss(v.payload.phrase);
    if (local) {
      card = { source: "local", items: toItems(action, local) };
      E.coach.note = res.limited
        ? tr(
            "The AI coach is resting for a while, so these are built-in tips.",
            "El asesor con IA está descansando un rato, así que estos son consejos incorporados.",
          )
        : tr(
            "The AI coach is not available right now, so these are built-in tips.",
            "El asesor con IA no está disponible ahora, así que estos son consejos incorporados.",
          );
    } else
      E.coach.note = res.limited
        ? tr(
            "The AI coach is resting for a while. Try again later.",
            "El asesor con IA está descansando un rato. Inténtalo más tarde.",
          )
        : tr(
            "The AI coach is not available right now. Try again later; you can keep writing on your own.",
            "El asesor con IA no está disponible ahora. Inténtalo más tarde; puedes seguir escribiendo por tu cuenta.",
          );
  }
  if (card) {
    card.id = `c${++seq}`;
    card.action = action;
    if (action === "picture") card.targetId = E.coach.pictureId;
    if (action === "translate") card.phrase = v.payload.phrase;
    if (action === "expand") card.sentence = v.payload.sentence;
    E.coach.cards = [card, ...E.coach.cards].slice(0, MAX_CARDS);
    record(E, action, card.source, card);
  }
  E.renderInspector();
  if (card) {
    E.root.querySelector(`[data-coach-card="${card.id}"]`)?.focus({ preventScroll: true });
    E.say(
      tr(
        `${actionName(E, action)}: ${card.items.length} suggestions.`,
        `${actionName(E, action)}: ${card.items.length} sugerencias.`,
      ),
    );
  } else E.say(E.coach.note);
}

// ── "Use this word": the only path from the coach into the book, and only on the learner's press ─────────────

function replaceFirst(html, from, to) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}])${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`,
    "iu",
  );
  const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode())
    if (re.test(n.nodeValue)) {
      n.nodeValue = n.nodeValue.replace(re, (m) =>
        /^\p{Lu}/u.test(m) ? to[0].toUpperCase() + to.slice(1) : to,
      );
      return sanitizeHtml(tpl.innerHTML);
    }
  return null;
}

function useWord(E, item) {
  const tr = E.I.S;
  const sel = E.core.selectedEl();
  const els = E.core.page().elements.filter((e) => e.type === "text" || e.type === "bubble");
  const order = sel && els.includes(sel) ? [sel, ...els.filter((e) => e !== sel)] : els;
  for (const el of order) {
    const html = replaceFirst(el.html || textToHtml(""), item.for, item.word);
    if (html) {
      E.flushTyping();
      E.core.update(el.id, { html });
      item.used = true;
      E.renderInspector();
      E.say(
        tr(
          `Changed “${item.for}” to “${item.word}”. Undo changes it back.`,
          `Se cambió «${item.for}» por «${item.word}». Deshacer lo regresa.`,
        ),
      );
      return;
    }
  }
  E.say(
    tr(`“${item.for}” is not on this page any more.`, `«${item.for}» ya no está en esta página.`),
  );
}

// ── events (called from editor-panels.js) ──────────────────────────────────────────────────────────────────

export function onCoachClick(E, e) {
  const t = e.target;
  if (!E.coach) return false;
  const run = t.closest("[data-bk-coach]");
  if (run) {
    if (!E.coach.busy) runAction(E, run.dataset.bkCoach);
    return true;
  }
  const pickBtn = t.closest("[data-bk-coach-sentence]");
  if (pickBtn) {
    const s = E.coach.pick?.list?.[Number(pickBtn.dataset.bkCoachSentence)];
    if (s) runAction(E, "expand", { sentence: s });
    return true;
  }
  if (t.closest("[data-bk-coach-phrase-go]")) {
    const phrase = E.root.querySelector("[data-bk-coach-phrase]")?.value || "";
    runAction(E, "translate", { phrase });
    return true;
  }
  const dismiss = t.closest("[data-bk-coach-dismiss]");
  if (dismiss) {
    const [cid, i] = dismiss.dataset.bkCoachDismiss.split(":");
    const card = E.coach.cards.find((c) => c.id === cid);
    if (card) {
      if (i === "all") card.items = [];
      else card.items[Number(i)].gone = true;
      if (card.items.every((x) => x.gone)) E.coach.cards = E.coach.cards.filter((c) => c !== card);
    }
    E.renderInspector();
    E.say(E.I.S("Suggestion dismissed.", "Sugerencia descartada."));
    (
      E.root.querySelector("[data-coach-card] button") || E.root.querySelector("[data-bk-coach]")
    )?.focus({ preventScroll: true });
    return true;
  }
  const use = t.closest("[data-bk-coach-use]");
  if (use) {
    const [cid, i] = use.dataset.bkCoachUse.split(":");
    const item = E.coach.cards.find((c) => c.id === cid)?.items[Number(i)];
    if (item?.word) useWord(E, item);
    return true;
  }
  const describe = t.closest("[data-bk-coach-describe]");
  if (describe) {
    E.select(describe.dataset.bkCoachDescribe);
    E.root.querySelector('[data-bk-prop="alt"]')?.focus({ preventScroll: true });
    return true;
  }
  if (t.closest("[data-bk-coach-settings]")) {
    // Book settings live on the page panel: leave the selected element first.
    if (!E.root.querySelector("[data-bk-coach-toggle]")) E.select(null, { focus: false });
    const box = E.root.querySelector("[data-bk-coach-toggle]");
    box?.closest("details")?.setAttribute("open", "");
    box?.focus({ preventScroll: true });
    box?.scrollIntoView({ block: "center" });
    return true;
  }
  return false;
}

export function onCoachChange(E, e) {
  if (!e.target.matches("[data-bk-coach-toggle]")) return false;
  E.coach.on = e.target.checked;
  savePref(E.coach.on);
  E.renderInspector();
  E.root.querySelector("[data-bk-coach-toggle]")?.focus({ preventScroll: true });
  E.say(
    E.coach.on
      ? E.I.S("Writing coach on.", "Asesor de escritura activado.")
      : E.I.S("Writing coach off.", "Asesor de escritura desactivado."),
  );
  return true;
}

// ── markup ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Book settings: the on/off switch and exactly what it sends. Empty when the class turned the coach off. */
export function coachSettingHTML(E) {
  const tr = E.I.S;
  if (!E.coach?.allowed) return "";
  return `<div class="bk-coach-setting">
    <label class="bk-coach-switch"><input type="checkbox" data-bk-coach-toggle data-nsr-ignore ${E.coach.on ? "checked" : ""} /> <span>${esc(tr("Use the writing coach (AI)", "Usar el asesor de escritura (IA)"))}</span></label>
    <p class="fine bk-coach-notice" data-bk-coach-notice>${esc(
      tr(
        "Off until you turn it on. The coach asks questions and suggests words; it never writes your book. Only when you press a coach button, it sends the words of this page (or the sentence or word you chose; your page headings for Organize; a picture's name, never the picture) to this site's coach (/api/book-coach). No name, pictures, recordings or anything that identifies you. Nothing is kept; the site only counts how many questions arrive each hour. You can always write without it.",
        "Está apagado hasta que lo actives. El asesor hace preguntas y sugiere palabras; nunca escribe tu libro. Solo cuando presionas un botón del asesor, envía las palabras de esta página (o la oración o palabra que elegiste; los títulos de tus páginas para Organizar; el nombre de una imagen, nunca la imagen) al asesor de este sitio (/api/book-coach). Sin nombre, imágenes, grabaciones ni nada que te identifique. No se guarda nada; el sitio solo cuenta cuántas preguntas llegan cada hora. Siempre puedes escribir sin él.",
      ),
    )}</p>
  </div>`;
}

function itemHTML(E, card, item, i) {
  const tr = E.I.S;
  if (item.gone) return "";
  const x = `<button type="button" class="bk-tbtn bk-coach-x" data-bk-coach-dismiss="${card.id}:${i}" aria-label="${esc(tr("Dismiss this suggestion", "Descartar esta sugerencia"))}" title="${esc(tr("Dismiss", "Descartar"))}">${bkIcon("close")}</button>`;
  let body;
  if (item.word)
    body = `<p><strong>${esc(item.word)}</strong> ${esc(tr(`for “${item.for}”`, `en lugar de «${item.for}»`))}</p><p class="fine">${esc(item.means)}</p>${
      item.used
        ? `<p class="fine">${bkIcon("check")} ${esc(tr("Used. Undo changes it back.", "Usada. Deshacer la regresa."))}</p>`
        : `<button type="button" class="btn small" data-bk-coach-use="${card.id}:${i}">${esc(tr("Use this word", "Usar esta palabra"))}</button>`
    }`;
  else if (item.es !== undefined)
    body = `<p lang="es">${esc(item.es)}</p>${item.en ? `<p class="fine" lang="en">${esc(item.en)}</p>` : ""}`;
  else if (item.kind === "next")
    body = `<p><strong>${esc(tr("Next step:", "Siguiente paso:"))}</strong> ${esc(item.text)}</p>`;
  else if (item.kind)
    body = `<p><span class="bk-coach-kind is-${item.kind}">${esc(item.kind === "strength" ? tr("Strength", "Fortaleza") : tr("Try", "Prueba"))}</span> <q>${esc(item.quote)}</q></p><p>${esc(item.text)}</p>`;
  else body = `<p>${esc(item.text)}</p>`;
  return `<li class="bk-coach-item">${body}${x}</li>`;
}

function cardHTML(E, card) {
  const tr = E.I.S;
  const src =
    card.source === "ai"
      ? `<span class="bk-coach-src is-ai">${bkIcon("feedback")} ${esc(tr("AI coach", "Asesor con IA"))}</span>`
      : `<span class="bk-coach-src is-local">${bkIcon("book")} ${esc(tr("Built-in tips (no AI)", "Consejos incorporados (sin IA)"))}</span>`;
  const about = card.sentence
    ? `<p class="fine">${esc(tr("Your sentence:", "Tu oración:"))} <q>${esc(card.sentence)}</q></p>`
    : card.phrase
      ? `<p class="fine">${esc(tr("Your words:", "Tus palabras:"))} <q>${esc(card.phrase)}</q></p>`
      : "";
  const after =
    card.action === "picture" && card.targetId
      ? `<button type="button" class="btn small" data-bk-coach-describe="${card.targetId}">${esc(tr("Write my description", "Escribir mi descripción"))}</button>`
      : card.action === "expand" || card.action === "brainstorm" || card.action === "genre"
        ? `<p class="fine">${esc(tr("Answer in your own words on the page.", "Responde con tus propias palabras en la página."))}</p>`
        : "";
  return `<article class="bk-coach-card" data-coach-card="${card.id}" data-source="${card.source}" tabindex="-1" aria-label="${esc(actionName(E, card.action))}">
    <header class="bk-coach-card-head"><h3>${esc(actionName(E, card.action))}</h3>${src}
      <button type="button" class="bk-tbtn bk-coach-x" data-bk-coach-dismiss="${card.id}:all" aria-label="${esc(tr("Dismiss all these suggestions", "Descartar todas estas sugerencias"))}" title="${esc(tr("Dismiss all", "Descartar todo"))}">${bkIcon("close")}</button></header>
    ${about}<ul class="bk-coach-items">${card.items.map((it, i) => itemHTML(E, card, it, i)).join("")}</ul>${after}
  </article>`;
}

function pickHTML(E) {
  const tr = E.I.S;
  const p = E.coach.pick;
  if (!p) return "";
  if (p.action === "expand")
    return `<div class="bk-coach-pick" data-bk-coach-pick><p class="bk-label">${esc(tr("Choose one of your sentences (or select words on the page):", "Elige una de tus oraciones (o selecciona palabras en la página):"))}</p><ul>${p.list
      .map(
        (s, i) =>
          `<li><button type="button" class="bk-coach-sentence" data-bk-coach-sentence="${i}">${esc(s)}</button></li>`,
      )
      .join("")}</ul></div>`;
  return `<div class="bk-coach-pick" data-bk-coach-pick><label class="bk-field"><span>${esc(tr("A word or short phrase from this page (or select it on the page)", "Una palabra o frase corta de esta página (o selecciónala en la página)"))}</span><input type="text" maxlength="${LIMITS.phrase}" data-bk-coach-phrase data-nsr-ignore /></label><button type="button" class="btn small" data-bk-coach-phrase-go>${esc(tr("Explain in Spanish", "Explicar en español"))}</button></div>`;
}

/** The "Writing coach" section of the inspector. Empty when the class turned it off. */
export function coachSectionHTML(E) {
  const tr = E.I.S;
  const c = E.coach;
  if (!c?.allowed) return "";
  const pageId = E.core.page().id;
  if (c.pageId !== pageId) {
    c.pageId = pageId;
    c.cards = [];
    c.pick = null;
    c.note = "";
  }
  const title = `${bkIcon("feedback")} ${esc(tr("Writing coach", "Asesor de escritura"))}`;
  if (!c.on)
    return `<details class="bk-sec bk-coach" data-bk-coach-panel open><summary>${title}</summary><div class="bk-sec-body"><p class="fine">${esc(tr("The writing coach is off. It can ask you questions about your writing; it never writes for you.", "El asesor de escritura está apagado. Puede hacerte preguntas sobre tu escritura; nunca escribe por ti."))}</p><button type="button" class="btn small" data-bk-coach-settings>${bkIcon("settings")} ${esc(tr("Turn it on in Book settings", "Actívalo en Ajustes del libro"))}</button></div></details>`;
  const buttons = ACTIONS.map(
    ([id, en, es, hintEn, hintEs]) =>
      `<button type="button" class="bk-coach-btn" data-bk-coach="${id}" ${c.busy ? "disabled" : ""} title="${esc(tr(hintEn, hintEs))}"><span>${esc(tr(en, es))}</span>${c.busy === id ? `<span class="fine">${esc(tr("Thinking…", "Pensando…"))}</span>` : ""}</button>`,
  ).join("");
  return `<details class="bk-sec bk-coach" data-bk-coach-panel open><summary>${title}</summary><div class="bk-sec-body">
    <p class="fine">${esc(tr("The coach asks questions and suggests words. You decide what to write.", "El asesor hace preguntas y sugiere palabras. Tú decides qué escribir."))}</p>
    <div class="bk-coach-grid" role="group" aria-label="${esc(tr("Writing coach", "Asesor de escritura"))}">${buttons}</div>
    ${pickHTML(E)}
    <p class="bk-coach-note" role="status" data-bk-coach-note>${esc(c.note)}</p>
    <div class="bk-coach-cards" data-bk-coach-cards>${c.cards.map((card) => cardHTML(E, card)).join("")}</div>
  </div></details>`;
}
