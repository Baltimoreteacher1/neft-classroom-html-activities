// Mr. Neft, the guide on the teacher and family pages. He says one line for the place the person is, offers a few
// question buttons that answer instantly from authored text (guide-knowledge.js), and takes a typed question, which
// goes to the AI guide (/api/language-guide). If the AI guide cannot answer, he shows what the Site Guide says.
//
// Everything after the first render happens in place (no re-render), so a live activity beside her keeps its state.
// The listeners are bound once on the document; the markup carries the context (page, step, grade, language).
import { BASE, esc, html, icon, raw } from "../util.js";
import { guideArtSVG } from "./guide-art.js";
import { GUIDE, QUICK, quickAnswer } from "./guide-knowledge.js";
import { buildIndex, searchGuide } from "./site-guide-search.js";
import { tourActivity } from "./tour-bands.js";

const ENDPOINT = "/api/language-guide";
const COPY = {
  role: ["Your Language Page guide", "Su guía de The Language Page"],
  ask: ["Ask me", "Pregúntenme"],
  label: ["Ask Mr. Neft a question", "Pregúntenle a Mr. Neft"],
  placeholder: ["Type a question about the site…", "Escriban una pregunta sobre el sitio…"],
  send: ["Ask", "Preguntar"],
  note: [
    "Typed questions are answered by an AI helper using this site’s own guide, and it can make mistakes. Please do not type student names.",
    "Las preguntas escritas las responde un asistente de IA con la guía de este sitio, y puede equivocarse. Por favor, no escriban nombres de estudiantes.",
  ],
  thinking: ["Mr. Neft is thinking…", "Mr. Neft está pensando…"],
  you: ["You asked", "Ustedes preguntaron"],
  offline: [
    "My AI helper is not available right now, so here is what the Site Guide says:",
    "Mi asistente de IA no está disponible ahora. Esto dice la Guía del sitio:",
  ],
  none: [
    "I could not find that in the Site Guide. Try other words, or open the Site Guide and search there.",
    "No encontré eso en la Guía del sitio. Prueben con otras palabras, o abran la Guía del sitio y busquen allí.",
  ],
  guide: ["Open the Site Guide", "Abrir la Guía del sitio"],
  clear: ["Clear answers", "Borrar respuestas"],
};

const pair = (p, lang) => (lang === "es" ? p[1] : p[0]);
let history = [];
let index = null;

/**
 * The guide panel. `say` is Mr. Neft's line for this place (plain text or html``); `chips` are QUICK ids;
 * `context` is { page, step, pick, domain } and travels with every question. `lang` is "en" | "es".
 */
export function guideHTML({ say, chips = [], context = {}, lang = "en", talking = false }) {
  const act = context.domain && context.pick ? tourActivity(context.pick, context.domain) : null;
  const usable = chips.filter((id) => QUICK[id] && quickAnswer(id, act, lang));
  return html`<aside
    class="pg"
    aria-labelledby="pgName"
    data-pg
    data-pg-page="${context.page || "tour"}"
    data-pg-step="${context.step || ""}"
    data-pg-pick="${context.pick || ""}"
    data-pg-domain="${context.domain || ""}"
    data-pg-lang="${lang}"
  >
    <div class="pg-avatar">${raw(guideArtSVG({ talking }))}</div>
    <div class="pg-main">
      <p class="pg-name" id="pgName">
        <strong>${GUIDE.name}</strong><span>${pair(COPY.role, lang)}</span>
      </p>
      <div class="pg-bubble"><p>${say}</p></div>
      ${
        usable.length
          ? html`<div class="pg-chips" role="group" aria-label="${pair(COPY.ask, lang)}">
              ${usable.map((id) => html`<button type="button" class="pg-chip" data-pg-quick="${id}">${pair(QUICK[id].q, lang)}</button>`)}
            </div>`
          : ""
      }
      <form class="pg-form" data-pg-form>
        <label class="visually-hidden" for="pgQuestion">${pair(COPY.label, lang)}</label>
        <input
          id="pgQuestion"
          name="q"
          type="text"
          maxlength="400"
          autocomplete="off"
          enterkeyhint="send"
          placeholder="${pair(COPY.placeholder, lang)}"
        />
        <button type="submit" class="btn small">${icon("sparkle")}${pair(COPY.send, lang)}</button>
      </form>
      <p class="fine pg-note">${pair(COPY.note, lang)}</p>
      <ol class="pg-thread" aria-live="polite" data-pg-thread></ol>
    </div>
  </aside>`;
}

const ctxOf = (panel) => ({
  page: panel.dataset.pgPage,
  step: panel.dataset.pgStep,
  pick: panel.dataset.pgPick,
  domain: panel.dataset.pgDomain,
  lang: panel.dataset.pgLang === "es" ? "es" : "en",
});

/** Text with this site's links made clickable (only https links to this site; everything else stays text). */
function linkify(text) {
  return esc(text).replace(
    /https:\/\/(?:thelanguagepage\.com|eduwonderlab\.com)(\/[^\s<)"']*)?/g,
    (url, path = "/") => `<a href="${path.replace(/[.,;:]+$/, "")}">${url}</a>`,
  );
}

function addTurn(panel, question, answerHTML, { pending = false } = {}) {
  const thread = panel.querySelector("[data-pg-thread]");
  const { lang } = ctxOf(panel);
  const li = document.createElement("li");
  li.className = "pg-turn";
  li.innerHTML = `<p class="pg-q"><span class="visually-hidden">${esc(pair(COPY.you, lang))}: </span>${esc(question)}</p><div class="pg-a${pending ? " is-pending" : ""}">${answerHTML}</div>`;
  thread.prepend(li);
  while (thread.children.length > 6) thread.lastElementChild.remove();
  if (!panel.querySelector("[data-pg-clear]")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn ghost small pg-clear";
    btn.dataset.pgClear = "";
    btn.textContent = pair(COPY.clear, lang);
    thread.after(btn);
  }
  return li.querySelector(".pg-a");
}

function fallbackHTML(question, lang) {
  index ||= buildIndex();
  const hits = searchGuide(index, question, 3);
  if (!hits.length)
    return `<p>${esc(pair(COPY.none, lang))}</p><p><a href="${BASE}/site-guide?for=teacher">${esc(pair(COPY.guide, lang))}</a></p>`;
  return `<p>${esc(pair(COPY.offline, lang))}</p><ul class="pg-hits">${hits
    .map(
      (h) =>
        `<li><a href="${BASE}${esc(h.route)}">${esc(h.title)}</a><span>${esc(h.excerpt)}</span></li>`,
    )
    .join("")}</ul>`;
}

async function ask(panel, question) {
  const c = ctxOf(panel);
  const out = addTurn(panel, question, `<p>${esc(pair(COPY.thinking, c.lang))}</p>`, {
    pending: true,
  });
  panel.querySelector(".mn-art")?.classList.add("is-talking");
  let answer = "";
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question,
        page: c.page,
        step: c.step,
        grades: c.pick,
        lang: c.lang,
        history,
      }),
    });
    const data = res.ok ? await res.json() : null;
    answer = typeof data?.answer === "string" ? data.answer.trim() : "";
  } catch {}
  out.classList.remove("is-pending");
  panel.querySelector(".mn-art")?.classList.remove("is-talking");
  if (answer) {
    out.innerHTML = answer
      .split(/\n{2,}/)
      .map((p) => `<p>${linkify(p).replace(/\n/g, "<br>")}</p>`)
      .join("");
    history = [...history, { q: question, a: answer }].slice(-3);
  } else out.innerHTML = fallbackHTML(question, c.lang);
}

let bound = false;
/** Bind the guide's listeners once per page load. Safe to call on every render. */
export function bindGuide() {
  if (bound || typeof document === "undefined") return;
  bound = true;
  document.addEventListener("click", (e) => {
    const quick = e.target.closest?.("[data-pg-quick]");
    const clear = e.target.closest?.("[data-pg-clear]");
    const panel = e.target.closest?.("[data-pg]");
    if (!panel) return;
    if (quick) {
      const c = ctxOf(panel);
      const act = c.domain && c.pick ? tourActivity(c.pick, c.domain) : null;
      const id = quick.dataset.pgQuick;
      addTurn(panel, pair(QUICK[id].q, c.lang), `<p>${linkify(quickAnswer(id, act, c.lang))}</p>`);
    } else if (clear) {
      panel.querySelector("[data-pg-thread]").replaceChildren();
      clear.remove();
      history = [];
      panel.querySelector("#pgQuestion")?.focus();
    }
  });
  document.addEventListener("submit", (e) => {
    const form = e.target.closest?.("[data-pg-form]");
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector("input[name=q]");
    const question = input.value.replace(/\s+/g, " ").trim().slice(0, 400);
    if (question.length < 2) return input.focus();
    input.value = "";
    ask(form.closest("[data-pg]"), question);
  });
}
