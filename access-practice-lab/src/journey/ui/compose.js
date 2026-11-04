// Living Writing UI (engine key "compose"): the writing studio for Communicate and Show.
//   render(task, env) -> html        mount(root, env)
// The learner's draft is never rewritten. "Show my structure" highlights spans of their own words, "Ask a reader" poses one question,
// and "Compare my drafts" says what changed and why it helps. Independent mode hides every one of those and the evidence bank.
import { esc, html, icon, raw, toHtml, wordCount } from "../../util.js";
import { BOXES } from "../engines/compose-notes.js";
import * as W from "../engines/compose.js";

const KINDS = [
  {
    id: "claim",
    label: ["Main idea or claim", "Idea principal o afirmación"],
    short: ["Claim", "Afirmación"],
  },
  { id: "reason", label: ["Reasons and causes", "Razones y causas"], short: ["Reason", "Razón"] },
  { id: "evidence", label: ["Evidence", "Evidencia"], short: ["Evidence", "Evidencia"] },
  { id: "connector", label: ["Linking words", "Palabras de enlace"], short: ["Link", "Enlace"] },
  { id: "precise", label: ["Precise words", "Palabras precisas"], short: ["Precise", "Preciso"] },
];
const ALL_KINDS = Object.fromEntries(KINDS.map((k) => [k.id, true]));
const MIN_ASK_WORDS = 6;
const keyUseOf = (task, env) => task.keyUse || env.mission?.klu || W.keyUseOf(task);

const nested = (env) =>
  Boolean(
    env.data?.compose && typeof env.data.compose === "object" && !("state" in (env.data || {})),
  );
const saved = (env) => (nested(env) ? env.data.compose : env.data || {});
const supportMode = (env) => !env.independent && env.support !== "C";

// ── highlighted mirror ────────────────────────────────────────────────────────
/** The draft as markup with `spans` ({start,end,cls,title}) marked. Overlapping spans share one <mark>. */
export function highlight(text, spans) {
  const src = String(text || "");
  const cuts = [...new Set([0, src.length, ...spans.flatMap((s) => [s.start, s.end])])]
    .filter((n) => n >= 0 && n <= src.length)
    .sort((a, b) => a - b);
  let out = "";
  for (let i = 0; i < cuts.length - 1; i++) {
    const [a, b] = [cuts[i], cuts[i + 1]];
    const on = spans.filter((s) => s.start <= a && s.end >= b);
    const chunk = esc(src.slice(a, b));
    out += on.length
      ? `<mark class="${[...new Set(on.map((s) => s.cls))].join(" ")}" title="${esc([...new Set(on.map((s) => s.title))].join(" / "))}">${chunk}</mark>`
      : chunk;
  }
  return out;
}
const overlaySpans = (analyzed, kinds) =>
  analyzed.overlays
    .filter((o) => kinds[o.kind])
    .map((o) => ({ start: o.start, end: o.end, cls: `jt-ov jt-ov-${o.kind}`, title: o.label }));
const changeSpans = (list, cls) =>
  list.map((s) => ({ start: s.start, end: s.end, cls, title: "" }));

// ── panels ────────────────────────────────────────────────────────────────────
function structurePanel(task, env, data, I) {
  const analyzed = W.analyze(task, data.state.draft, { keyUse: keyUseOf(task, env) });
  const map = W.structureMap(task, analyzed);
  const kinds = data.kinds || ALL_KINDS;
  const chips = KINDS.map(
    (k) =>
      `<button type="button" class="jt-kind jt-kind-${k.id}" aria-pressed="${kinds[k.id] ? "true" : "false"}" data-jt-kind="${k.id}"><span class="jt-swatch" aria-hidden="true"></span>${toHtml(I.T(k.label[0], k.label[1]))} <span class="jt-n">${analyzed.counts[k.id] || 0}</span></button>`,
  ).join("");
  const rows = map.boxes
    .map((b) =>
      b.present
        ? `<li class="is-present">${toHtml(icon("check"))}<span><strong>${toHtml(I.T(b.label[0], b.label[1]))}</strong> <q lang="en">${esc(b.quote)}${b.truncated ? "…" : ""}</q></span></li>`
        : `<li class="is-open">${toHtml(icon("info"))}<span><strong>${toHtml(I.T(b.label[0], b.label[1]))}</strong> <span lang="en">${esc(b.question)}</span></span></li>`,
    )
    .join("");
  return html`<section class="jt-panel jt-structure" aria-labelledby="jt-structure-h">
    <h3 id="jt-structure-h">${I.T("Your structure", "Tu estructura")}</h3>
    <p class="jt-note">
      ${I.T("Highlights mark words you wrote. They show what is on the page, not whether it is true or good.", "Los resaltados marcan palabras que escribiste. Muestran lo que hay en la página, no si es cierto o bueno.")}
    </p>
    <div class="jt-kinds" role="group" aria-label="${I.S("What to highlight", "Qué resaltar")}">
      ${raw(chips)}
    </div>
    <div
      class="jt-mirror"
      tabindex="0"
      role="region"
      lang="en"
      aria-label="${I.S("Your draft with highlights", "Tu borrador con resaltados")}"
      data-jt-mirror
    >
      ${raw(highlight(data.state.draft, overlaySpans(analyzed, kinds)) || `<span class="jt-empty">${esc(I.S("Write something to see its structure.", "Escribe algo para ver su estructura."))}</span>`)}
    </div>
    <p class="jt-shape">
      ${I.T("Shape of this kind of writing:", "Forma de este tipo de texto:")}
      <span lang="en">${esc(map.shape)}</span>
    </p>
    <ul class="jt-map">
      ${raw(rows)}
    </ul>
  </section>`;
}

function readerPanel(data, I) {
  const r = data.reader;
  if (!r) return "";
  const changed = data.state.draft !== r.base;
  return html`<section class="jt-panel jt-reader" aria-labelledby="jt-reader-h">
    <h3 id="jt-reader-h">${icon("conversation")} ${I.T("A reader asks", "Un lector pregunta")}</h3>
    <p class="jt-question" lang="en">${r.question}</p>
    <p class="jt-note">
      ${changed ? I.T("You changed your draft. Compare it with what you had.", "Cambiaste tu borrador. Compáralo con lo que tenías.") : I.T("Change your draft above if you want to answer. It is your choice what to add.", "Cambia tu borrador de arriba si quieres responder. Tú decides qué añadir.")}
    </p>
    <button
      type="button"
      class="btn btn-secondary"
      data-jt-compare
      ${changed ? "" : raw("disabled")}
    >
      ${icon("growth")} ${I.T("Compare my drafts", "Comparar mis borradores")}
    </button>
  </section>`;
}

function comparePanel(task, env, data, I) {
  const c = data.compare;
  if (!c) return "";
  const diff = W.compareVersions(c.before, c.after, { task, keyUse: keyUseOf(task, env) });
  const col = (title, text, spans, cls) =>
    html`<div class="jt-col">
      <h4>${title}</h4>
      <div class="jt-mirror" lang="en" tabindex="0">
        ${raw(highlight(text, changeSpans(spans, cls)))}
      </div>
    </div>`;
  const list = diff.reasons.length
    ? html`<ul class="jt-why">
        ${diff.reasons.map((r) => html`<li class="is-${r.kind}">${r.kind === "check" ? icon("info") : icon("check")}<span>${I.T(r.text, r.es)}</span></li>`)}
      </ul>`
    : html`<p class="jt-note">
        ${diff.unchanged ? I.T("Your draft has not changed yet.", "Tu borrador todavía no cambió.") : I.T("The moves this checker looks for did not change. Try one of the reader's questions.", "Las jugadas que busca este revisor no cambiaron. Prueba con una de las preguntas del lector.")}
      </p>`;
  return html`<section class="jt-panel jt-compare" aria-labelledby="jt-compare-h">
    <h3 id="jt-compare-h">${I.T("Your drafts, side by side", "Tus borradores, lado a lado")}</h3>
    <div class="jt-cols">
      ${col(I.T("Before", "Antes"), c.before, diff.changed.before, "jt-chg jt-chg-del")}${col(I.T("After", "Después"), c.after, diff.changed.after, "jt-chg jt-chg-add")}
    </div>
    <p class="jt-note">
      ${I.T("Highlighted words are the ones that changed.", "Las palabras resaltadas son las que cambiaron.")}
    </p>
    <h4>${I.T("What changed and why it helps", "Qué cambió y por qué ayuda")}</h4>
    ${list}
  </section>`;
}

function panels(task, env, data, I) {
  if (env.independent) return "";
  return html`${data.view ? structurePanel(task, env, data, I) : ""}${readerPanel(data, I)}${comparePanel(task, env, data, I)}`;
}

function organizer(task, env, data, I) {
  const live = supportMode(env);
  const hints = !env.independent;
  const items = (task.organizer || []).map((id) => {
    const box = BOXES[id] || { label: [id, id], ask: ["", ""], starter: "" };
    const used = data.state.organizer?.[id];
    const label = I.T(box.label[0], box.label[1]);
    const ask = hints ? html`<span class="jt-box-ask">${I.T(box.ask[0], box.ask[1])}</span>` : "";
    return live
      ? html`<li>
          <button
            type="button"
            class="jt-box ${used ? "is-used" : ""}"
            data-jt-box="${id}"
            aria-pressed="${used ? "true" : "false"}"
          >
            <span class="jt-box-label">${label}</span>${ask}<span class="jt-box-do"
              >${icon("arrow-right")} ${I.T("Add a starter", "Añadir un comienzo")}</span
            >
          </button>
        </li>`
      : html`<li>
          <div class="jt-box is-static"><span class="jt-box-label">${label}</span>${ask}</div>
        </li>`;
  });
  return html`<aside class="jt-organizer" aria-labelledby="jt-org-h">
    <h3 id="jt-org-h">${I.T("Plan your writing", "Planifica tu escritura")}</h3>
    <ol class="jt-boxes">
      ${items}
    </ol>
  </aside>`;
}

function bankPanel(task, env, I) {
  const bank = task.evidenceBank || [];
  if (env.independent || !bank.length) return "";
  const chips = bank.map((b) => {
    const item = typeof b === "string" ? { text: b } : b;
    return `<button type="button" class="jt-chip" data-jt-insert="${esc(item.text)}" lang="en">${esc(item.text)}</button>`;
  });
  return html`<details class="jt-help" data-jt-help="evidence">
    <summary>${I.T("Evidence bank", "Banco de evidencia")}</summary>
    <p class="jt-chips">${raw(chips.join(""))}</p>
  </details>`;
}

function shell(task, env, data, I) {
  const words = wordCount(data.state.draft);
  const crit = W.doneCriteria(task, data.state);
  const pct = Math.min(100, crit.minWords ? Math.round((words / crit.minWords) * 100) : 100);
  return html`<section class="jt jt-compose d-writing" data-jt="compose" aria-labelledby="jt-title">
    <header class="jt-head">
      <p class="jt-kicker">${icon("writing")} ${I.T("Writing studio", "Taller de escritura")}</p>
      <h2 id="jt-title" class="jt-title" lang="en">${task.prompt}</h2>
      <p class="jt-audience">
        ${icon("user")}
        <strong>${I.T("Your reader:", "Tu lector:")}</strong>
        ${I.T(task.audience[0], task.audience[1])}
      </p>
    </header>
    <div class="jt-studio">
      ${organizer(task, env, data, I)}
      <div class="jt-draft">
        <label class="jt-label" for="jt-draft">${I.T("Your draft", "Tu borrador")}</label>
        <textarea
          id="jt-draft"
          class="jt-input jt-draft-box"
          rows="10"
          lang="en"
          data-jt-draft
          data-nsr-ignore
          spellcheck="false"
          autocomplete="off"
        >
${data.state.draft}</textarea>
        <div class="jt-progress">
          <span class="jt-bar" aria-hidden="true"><i data-jt-bar style="--p:${pct}%"></i></span>
          <p class="jt-count" role="status">
            <span data-jt-count>${words}</span> ${I.T("words", "palabras")} ·
            ${I.T(`goal: about ${crit.minWords}`, `meta: unas ${crit.minWords}`)}
            <span class="jt-saved" data-jt-saved
              >${I.T("Saved on this device", "Guardado en este dispositivo")}</span
            >
          </p>
        </div>
        ${bankPanel(task, env, I)}
        <div class="jt-actions">
          ${env.independent ? "" : html`<button type="button" class="btn btn-secondary" data-jt-structure aria-pressed="${data.view ? "true" : "false"}">${icon("search")} ${I.T("Show my structure", "Mostrar mi estructura")}</button><button type="button" class="btn btn-secondary" data-jt-ask>${icon("conversation")} ${I.T("Ask a reader", "Preguntar a un lector")}</button>`}
          <button
            type="button"
            class="btn btn-primary"
            data-jt-submit
            ${crit.ok && !data.finished ? "" : raw("disabled")}
          >
            ${icon("check")} ${I.T("Submit my writing", "Entregar mi escritura")}
          </button>
        </div>
        <p class="jt-note" role="status" data-jt-msg>
          ${crit.ok ? "" : I.T(`Keep going: your goal is about ${crit.minWords} words.`, `Sigue: tu meta es de unas ${crit.minWords} palabras.`)}
        </p>
      </div>
    </div>
    <div class="jt-panels" data-jt-panels>${panels(task, env, data, I)}</div>
  </section>`;
}

/** The first paint, from saved state. */
export function render(task, env) {
  const d = saved(env);
  return shell(task, env, { ...d, state: d.state || W.init(task) }, env.I);
}

// ── behaviour ─────────────────────────────────────────────────────────────────
export function mount(root, env) {
  const task = env.task || env.pack?.[env.step === "show" ? "show" : "communicate"];
  const I = env.I;
  let data = { ...saved(env), state: saved(env).state || W.init(task) };
  let timer = 0;
  const q = (sel) => root.querySelector(sel);
  const opts = () => ({ keyUse: keyUseOf(task, env), independent: Boolean(env.independent) });

  const save = (patch) => {
    data = { ...data, ...patch };
    env.update?.(nested(env) ? { compose: patch } : patch, { silent: true });
  };
  const help = (id) => {
    if (env.independent || (data.helps || []).includes(id)) return;
    save({ helps: [...(data.helps || []), id] });
    env.help?.(id);
  };
  const paintPanels = () => {
    const box = q("[data-jt-panels]");
    if (box) box.innerHTML = toHtml(panels(task, env, data, I));
  };
  const syncMeter = () => {
    const words = wordCount(data.state.draft);
    const crit = W.doneCriteria(task, data.state);
    const n = q("[data-jt-count]");
    if (n) n.textContent = String(words);
    q("[data-jt-bar]")?.style.setProperty(
      "--p",
      `${Math.min(100, crit.minWords ? Math.round((words / crit.minWords) * 100) : 100)}%`,
    );
    const submit = q("[data-jt-submit]");
    if (submit) submit.disabled = !crit.ok || Boolean(data.finished);
    const msg = q("[data-jt-msg]");
    if (msg)
      msg.textContent = crit.ok
        ? ""
        : I.S(
            `Keep going: your goal is about ${crit.minWords} words.`,
            `Sigue: tu meta es de unas ${crit.minWords} palabras.`,
          );
  };
  const setDraft = (text, { persist = false } = {}) => {
    data = { ...data, state: W.setDraft(data.state, text) };
    syncMeter();
    const cmp = q("[data-jt-compare]");
    if (cmp && data.reader) cmp.disabled = text === data.reader.base;
    const note = q("[data-jt-saved]");
    if (note) note.hidden = true;
    clearTimeout(timer);
    const flush = () => {
      save({ state: data.state });
      if (note) note.hidden = false;
    };
    if (persist) flush();
    else timer = setTimeout(flush, 600);
    if (data.view) {
      const mirror = q("[data-jt-mirror]");
      if (mirror) {
        const a = W.analyze(task, text, opts());
        mirror.innerHTML = highlight(text, overlaySpans(a, data.kinds || ALL_KINDS)) || "";
      }
    }
  };
  const insert = (text) => {
    const box = q("#jt-draft");
    if (!box) return;
    const a = box.selectionStart ?? box.value.length;
    const b = box.selectionEnd ?? a;
    const pad = box.value && !/\s$/.test(box.value.slice(0, a)) ? " " : "";
    box.value = `${box.value.slice(0, a)}${pad}${text}${box.value.slice(b)}`;
    box.focus();
    const at = a + pad.length + text.length;
    box.setSelectionRange(at, at);
    setDraft(box.value, { persist: true });
  };

  function toggleStructure(btn) {
    if (env.independent) return;
    const on = !data.view;
    if (on) help("structure");
    save({
      view: on,
      kinds: data.kinds || ALL_KINDS,
    });
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    paintPanels();
  }
  function askReader() {
    if (env.independent) return;
    const draft = data.state.draft;
    if (wordCount(draft) < MIN_ASK_WORDS) {
      const msg = q("[data-jt-msg]");
      if (msg)
        msg.textContent = I.S(
          "Write a few sentences first, then a reader can ask you something.",
          "Escribe unas oraciones primero y luego un lector podrá preguntarte algo.",
        );
      return;
    }
    help("reader");
    const rq = W.readerQuestion(task, W.analyze(task, draft, opts()), {
      asked: data.state.readerAsked,
    });
    const state = W.markReaderAsked(W.snapshot(data.state, "first draft"), rq.moveId);
    save({
      state,
      reader: { moveId: rq.moveId, question: rq.question, base: draft },
      compare: null,
    });
    paintPanels();
    q("[data-jt-panels] .jt-reader")?.scrollIntoView?.({ block: "nearest" });
    env.announce?.(
      I.S("A reader has a question for you.", "Un lector tiene una pregunta para ti."),
    );
  }
  function compare() {
    const after = data.state.draft;
    const before = data.reader?.base ?? data.state.versions.at(-2)?.text;
    if (before == null) return;
    const state = W.strengthen(data.state, after);
    save({
      state,
      compare: { before, after },
      reader: data.reader ? { ...data.reader, base: after } : null,
    });
    paintPanels();
    q("[data-jt-panels] .jt-compare")?.scrollIntoView?.({ block: "nearest" });
  }
  function submit() {
    const crit = W.doneCriteria(task, data.state);
    if (!crit.ok || data.finished) return;
    const supports = [...(data.helps || [])];
    const analysis = W.analyze(task, data.state.draft, opts()).analysis;
    env.ledger?.(
      W.ledgerEntry({
        task,
        state: data.state,
        missionId: env.missionId,
        step: env.step,
        band: env.band,
        keyUse: keyUseOf(task, env),
        independent: env.independent,
        supports,
        analysis,
      }),
    );
    save({ finished: true });
    q("[data-jt-submit]")?.setAttribute("disabled", "");
    env.done?.({
      text: data.state.draft,
      mode: "write",
      supportsUsed: supports,
      words: crit.words,
      versions: data.state.versions.map((v) => ({ text: v.text, label: v.label, at: v.at })),
    });
  }

  root.addEventListener("click", (e) => {
    const t = e.target.closest?.("button");
    if (!t || !root.contains(t)) return;
    if (t.hasAttribute("data-jt-box")) {
      if (!supportMode(env)) return;
      help("frames");
      const id = t.dataset.jtBox;
      save({ state: W.useBox(data.state, id) });
      t.classList.add("is-used");
      t.setAttribute("aria-pressed", "true");
      insert(W.starterFor(id));
    } else if (t.hasAttribute("data-jt-insert")) {
      help("evidence");
      insert(t.dataset.jtInsert);
    } else if (t.hasAttribute("data-jt-structure")) toggleStructure(t);
    else if (t.hasAttribute("data-jt-kind")) {
      const kinds = { ...(data.kinds || ALL_KINDS) };
      kinds[t.dataset.jtKind] = !kinds[t.dataset.jtKind];
      save({ kinds });
      paintPanels();
      q(`[data-jt-kind="${t.dataset.jtKind}"]`)?.focus();
    } else if (t.hasAttribute("data-jt-ask")) askReader();
    else if (t.hasAttribute("data-jt-compare")) compare();
    else if (t.hasAttribute("data-jt-submit")) submit();
  });
  root.addEventListener(
    "input",
    (e) => e.target.matches?.("[data-jt-draft]") && setDraft(e.target.value),
  );
  root.addEventListener(
    "blur",
    (e) => e.target.matches?.("[data-jt-draft]") && setDraft(e.target.value, { persist: true }),
    true,
  );
  root.addEventListener(
    "toggle",
    (e) => e.target.open && e.target.dataset?.jtHelp && help(e.target.dataset.jtHelp),
    true,
  );
  return () => clearTimeout(timer);
}
