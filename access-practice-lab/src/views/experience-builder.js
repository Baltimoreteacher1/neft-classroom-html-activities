// Experience Builder (/experience-builder, /experience-builder/new, /experience-builder/<key>/<step>?tab=<section>):
// an instructor turns their own text into an editable, PLAYABLE simulation. Steps: material and settings → the
// visual editor (scenes, people, evidence, tasks, supports and feedback, endings, check) → preview as a student →
// assign. The pipeline is src/compiler/ (extract → design → generate → validate), deterministic and offline.
// Rules it keeps: every change is validated at once and saved as a draft on this device
// (accessPracticeLab:v1:experiences); the last changes can be undone; only a valid experience can be published;
// nothing here is a score, a level or a timer; the instructor's text leaves the device only when they publish, and
// then only if "show source" is ticked.
import { getBook, listBooks } from "../book/db.js";
import { bookText, countWords } from "../book/model.js";
import { compileExperience } from "../compiler/compile.js";
import { assignHTML } from "../compiler/editor-assign.js";
import { download, publish, unpublish } from "../compiler/editor-class.js";
import { blankInput, loadPassages, readUpload, sourceStepHTML } from "../compiler/editor-inputs.js";
import { OP_ERRORS, applyOp } from "../compiler/editor-ops.js";
import {
  newPreview,
  previewAct,
  previewAsk,
  previewHTML,
  previewOpen,
  previewTopic,
} from "../compiler/editor-preview.js";
import { STEPS, barHTML, editHTML, home, homeHTML, noteHTML, stepHref } from "../compiler/editor-shell.js";
import { checkHTML } from "../compiler/editor-ui.js";
import { cleanSource } from "../compiler/extract.js";
import { sampleInput } from "../compiler/sample-ecosystem.js";
import {
  deleteDraft,
  experienceApi,
  exportDraft,
  getDraft,
  importDraft,
  knownClasses,
  loadDrafts,
  playPath,
  saveDraft,
} from "../compiler/store.js";
import { validateExperience } from "../compiler/validate.js";
import { crumbsHTML } from "../components.js";
import { loadDomain } from "../content.js";
import { i18nFor } from "../i18n.js";
import { tokenize } from "../lang/text.js";
import { ART_IDS, LOOKS } from "../sim/art.js";
import { lineFor, matchTopic } from "../sim/characters.js";
import { evidenceOf } from "../sim/schema.js";
import { speak } from "../speech.js";
import { BASE, announce, html } from "../util.js";

const ASSETS = { art: [...ART_IDS], looks: Object.keys(LOOKS) };
const MAX_UNDO = 20;
const fresh = () => ({
  key: "",
  entry: null,
  report: null,
  undo: [],
  note: null,
  input: blankInput(),
  pick: { band: "", passages: null, books: null },
  dialogue: null,
  preview: null,
  session: null,
  assign: { busy: false, msg: null, ok: false, code: "" },
});
let ui = fresh();
let sim; // the simulation player module (src/sim/ui.js), loaded on first preview; null when it cannot load

async function loadPlayer() {
  if (sim === undefined) sim = await import("../sim/ui.js").catch(() => null);
  return sim;
}
const check = (def) => validateExperience(def, ASSETS);

/** Bring the draft of this route into memory (once per key). */
function open(key) {
  if (ui.key === key && ui.entry) return true;
  const entry = getDraft(key);
  if (!entry) return false;
  const input = entry.input || {
    source: {
      title: entry.def.source?.title || "",
      text: entry.def.source?.text || "",
      kind: "text",
    },
    settings: {
      ...blankInput().settings,
      ...(entry.def.compiled?.settings || {}),
      supports: { ...blankInput().settings.supports, ...(entry.def.supports || {}) },
    },
  };
  ui = {
    ...fresh(),
    key,
    entry,
    input: JSON.parse(JSON.stringify(input)),
    report: check(entry.def),
    assign: { busy: false, msg: null, ok: false, code: entry.published?.code || "" },
  };
  return true;
}
function persist() {
  const ok = saveDraft(ui.key, ui.entry);
  if (!ok)
    ui.note = {
      tone: "bad",
      text: [
        "This device could not save the draft (storage is full or blocked). Export it as a file so it is not lost.",
        "Este dispositivo no pudo guardar el borrador (el almacenamiento está lleno o bloqueado). Expórtelo como archivo para no perderlo.",
      ],
    };
  return ok;
}

async function previewStepHTML(ctx, I, tab) {
  const { def } = ui.entry;
  if (!ui.report.errors.every((e) => e.code !== "schema" && e.code !== "broken-branch"))
    return html`<section class="panel">
      <p class="xb-status is-bad" role="status">
        ${I.T("The preview needs a valid experience. Fix what is listed here first.", "La vista previa necesita una experiencia válida. Primero corrija lo que aparece aquí.")}
      </p>
      ${checkHTML(I, ui.report)}
    </section>`;
  const player = await loadPlayer();
  const mode = tab === "steps" || !player ? "steps" : "player";
  const modes = html`<nav
    class="xb-tabs"
    aria-label="${I.S("Preview modes", "Modos de vista previa")}"
  >
    ${player ? html`<a class="xb-tab ${mode === "player" ? "is-on" : ""}" href="${stepHref(ui.key, "preview")}" data-xb-pvmode="player">${I.T("As a student sees it", "Como lo ve un estudiante")}</a>` : ""}
    <a
      class="xb-tab ${mode === "steps" ? "is-on" : ""}"
      href="${stepHref(ui.key, "preview", "steps")}"
      data-xb-pvmode="steps"
      >${I.T("Plain walk-through", "Recorrido sencillo")}</a
    >
  </nav>`;
  if (mode === "player") {
    if (!ui.session || ui.session.def !== def)
      ui.session = player.createSession(def, {
        preview: true,
        band: def.band === "3-5" ? "3-5" : "6-8",
      });
    return html`${modes}
      <p class="fine">
        ${I.T("Preview: the real player on your current draft. Nothing here is saved to a learner's record.", "Vista previa: el reproductor real con su borrador actual. Nada de esto se guarda en el registro de un estudiante.")}
        <button type="button" class="btn small ghost" data-xb-act="pv-reset">
          ${I.T("Start the preview again", "Empezar la vista previa otra vez")}
        </button>
      </p>
      <div class="xb-player" data-xb-player>
        ${player.playerHTML(ctx, def, ui.session.state, { session: ui.session })}
      </div>`;
  }
  ui.preview ||= newPreview(def);
  return html`${modes}${previewHTML(I, def, ui.preview, playPath(ui.key))}`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const { id, sub, tab } = ctx.route;
  const title = I.S("Experience Builder", "Creador de experiencias");
  const crumb = (rest) =>
    crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/`],
      [title, rest ? home : null],
      ...(rest ? [[rest, null]] : []),
    ]);
  if (!id) {
    if (ui.key) ui = { ...fresh(), note: ui.note };
    return {
      title,
      html: html`${crumb()}
        <div class="xb">${homeHTML(I, ui)}</div>`,
    };
  }
  if (id === "new") {
    if (ui.key) ui = fresh();
    return {
      title,
      html: html`${crumb(I.S("New experience", "Experiencia nueva"))}
        <div class="xb">
          <h1 tabindex="-1">
            ${I.T("A new experience from your text", "Una experiencia nueva a partir de su texto")}
          </h1>
          <div class="row-actions">
            <button type="button" class="btn small" data-xb-act="example">
              ${I.T("Try the ecosystem example", "Probar el ejemplo del ecosistema")}
            </button>
          </div>
          ${ui.note ? noteHTML(I, ui) : ""}${sourceStepHTML(I, ui)}
        </div>`,
    };
  }
  if (!open(id)) {
    ui = {
      ...fresh(),
      note: {
        tone: "bad",
        text: [
          "That experience is not on this device.",
          "Esa experiencia no está en este dispositivo.",
        ],
      },
    };
    return {
      title,
      html: html`${crumb()}
        <div class="xb">${homeHTML(I, ui)}</div>`,
    };
  }
  const step = STEPS.some(([s]) => s === sub) ? sub : "edit";
  const body =
    step === "source"
      ? html`<p class="fine">
            ${I.T("Change the material or the settings, then build again. Building again replaces the scenes, people and evidence; you can undo it.", "Cambie el material o los ajustes y vuelva a crear. Al crear otra vez se reemplazan las escenas, las personas y la evidencia; puede deshacerlo.")}
          </p>
          ${sourceStepHTML(I, ui)}`
      : step === "preview"
        ? await previewStepHTML(ctx, I, tab)
        : step === "assign"
          ? assignHTML(I, ui, knownClasses(), location.origin)
          : editHTML(I, ui, tab);
  return {
    title: `${ui.entry.def.title[0]} · ${title}`,
    html: html`${crumb(I.S(...ui.entry.def.title))}
      <div class="xb">${barHTML(I, ui, step)}${body}</div>`,
  };
}

// ── changes ──────────────────────────────────────────────────────────────────
function setDef(def, { undo = true } = {}) {
  if (undo) {
    ui.undo.push(ui.entry.def);
    if (ui.undo.length > MAX_UNDO) ui.undo.shift();
  }
  ui.entry = { ...ui.entry, def };
  ui.report = check(def);
  ui.preview = null;
  ui.session = null;
  ui.dialogue = null;
  persist();
}
function apply(ctx, op) {
  const I = i18nFor(ctx);
  const res = applyOp(ui.entry.def, op);
  if (res.error)
    ui.note = {
      tone: "bad",
      text: OP_ERRORS[res.error] || [
        `That change could not be made (${res.error}).`,
        `No se pudo hacer ese cambio (${res.error}).`,
      ],
    };
  else {
    ui.note = null;
    setDef(res.def);
    const n = ui.report.errors.length;
    announce(
      n
        ? I.S(
            `Saved. ${n} to fix: ${ui.report.errors[0].text[0]}`,
            `Guardado. ${n} por corregir: ${ui.report.errors[0].text[1]}`,
          )
        : I.S("Saved. Still valid and playable.", "Guardado. Sigue válida y jugable."),
      { toast: false },
    );
  }
  ctx.rerender();
}

function compile(ctx) {
  const input = JSON.parse(JSON.stringify(ui.input));
  const out = compileExperience({ ...input, id: ui.key || undefined }, ASSETS);
  if (!out.def) {
    ui.note = { tone: "bad", text: out.report.errors[0].text };
    return ctx.rerender();
  }
  const again = Boolean(ui.key && ui.entry);
  const undo = again ? [...ui.undo, ui.entry.def].slice(-MAX_UNDO) : [];
  ui = {
    ...fresh(),
    key: out.key,
    entry: { ...(again ? ui.entry : {}), def: out.def, input },
    input,
    report: out.report,
    undo,
  };
  persist();
  ctx.navigate(stepHref(out.key, "edit"));
}

function setInput(path, value) {
  const [group, field] = path.split(".");
  ui.input[group][field] = field === "minutes" ? Number(value) : value;
}
const argOf = (el) => {
  try {
    return JSON.parse(el.getAttribute("data-xb-arg") || "{}");
  } catch {
    return {};
  }
};

export function onInput(e, ctx) {
  const el = e.target;
  const path = el?.getAttribute?.("data-xb-in");
  if (!path) {
    if (ctx.route.sub === "preview" && ui.session && sim) sim.onPlayerInput?.(e, ctx, ui.session);
    return;
  }
  setInput(path, el.value);
  if (path === "source.text") {
    const n = tokenize(el.value).length;
    const out = document.getElementById("xbWords");
    if (out) out.textContent = i18nFor(ctx).S(`${n} words`, `${n} palabras`);
  }
}

export async function onChange(e, ctx) {
  const el = e.target;
  const I = i18nFor(ctx);
  if (!el?.getAttribute) return;
  if (el.hasAttribute("data-xb-in")) return setInput(el.getAttribute("data-xb-in"), el.value);
  if (el.hasAttribute("data-xb-domain")) {
    const d = el.getAttribute("data-xb-domain");
    const set = new Set(ui.input.settings.domains);
    if (el.checked) set.add(d);
    else set.delete(d);
    ui.input.settings.domains = [...set];
    return;
  }
  if (el.hasAttribute("data-xb-support")) {
    ui.input.settings.supports[el.getAttribute("data-xb-support")] = el.checked;
    return;
  }
  if (el.hasAttribute("data-xb-file")) {
    const res = await readUpload(el.files?.[0]);
    if (res.ok) ui.input.source = res.source;
    ui.note = res.ok
      ? {
          tone: "ok",
          text: [
            "The file was read as plain text. Check it below, then build.",
            "El archivo se leyó como texto. Revíselo abajo y luego cree la experiencia.",
          ],
        }
      : { tone: "bad", text: res.text };
    return ctx.rerender();
  }
  if (el.hasAttribute("data-xb-bank-band")) {
    ui.pick.band = el.value;
    ui.pick.passages = el.value
      ? await loadPassages(el.value, { loadDomain }).catch(() => [])
      : null;
    return ctx.rerender();
  }
  if (el.hasAttribute("data-xb-bank")) {
    const p = (ui.pick.passages || []).find((x) => x.id === el.value);
    if (p) ui.input.source = { title: p.title, text: p.text, kind: "text" };
    return ctx.rerender();
  }
  if (el.hasAttribute("data-xb-book")) {
    const book = el.value ? await getBook(el.value).catch(() => null) : null;
    if (book)
      ui.input.source = {
        title: book.title || "",
        text: cleanSource(bookText(book, { pageLabel: () => "" })),
        kind: "text",
      };
    return ctx.rerender();
  }
  if (el.hasAttribute("data-xb-import")) {
    const file = el.files?.[0];
    const res =
      file && file.size <= 200 * 1024
        ? importDraft(await file.text().catch(() => ""))
        : { ok: false };
    if (!res.ok) {
      ui.note = {
        tone: "bad",
        text: [
          "That file is not an experience this builder can open.",
          "Ese archivo no es una experiencia que este creador pueda abrir.",
        ],
      };
      return ctx.rerender();
    }
    saveDraft(res.key, res.entry);
    return ctx.navigate(stepHref(res.key, "edit", "check"));
  }
  if (el.hasAttribute("data-xb-op") && ui.entry) {
    const value = el.type === "checkbox" ? el.checked : el.value;
    return apply(ctx, { type: el.getAttribute("data-xb-op"), ...argOf(el), value });
  }
  if (el.hasAttribute("data-xb-class")) ui.assign.code = el.value;
  else if (ctx.route.sub === "preview" && ui.session && sim)
    sim.onPlayerChange?.(e, ctx, ui.session);
}

const ACTIONS = {
  example(ctx) {
    ui = { ...fresh(), input: sampleInput() };
    if (ctx.route.id === "new") ctx.rerender();
    else ctx.navigate(`${home}/new`);
  },
  compile,
  op: (ctx, arg) => apply(ctx, arg),
  undo(ctx) {
    const prev = ui.undo.pop();
    if (!prev) return;
    setDef(prev, { undo: false });
    ui.note = { tone: "ok", text: ["The last change was undone.", "Se deshizo el último cambio."] };
    ctx.rerender();
  },
  "add-spot"(ctx, { scene }) {
    const [kind, target] = String(
      document.querySelector(`[data-xb-spot="${scene}"]`)?.value || "",
    ).split(":");
    apply(ctx, { type: "hotspot.add", scene, kind, target });
  },
  "add-evidence"(ctx) {
    apply(ctx, {
      type: "evidence.add",
      kind: document.querySelector("[data-xb-new-evidence]")?.value || "document",
    });
  },
  ask(ctx, { character }) {
    const question = document.querySelector(`[data-xb-ask="${character}"]`)?.value || "";
    const c = ui.entry.def.characters.find((x) => x.id === character);
    const hit = matchTopic(c, question);
    const topic = hit.topic ? c.topics.find((t) => t.id === hit.topic) : null;
    ui.dialogue = {
      character,
      question,
      topic: topic?.id || "",
      ask: topic?.ask || null,
      line: topic
        ? lineFor(ui.entry.def, { type: "answer", character, topic: topic.id }).text
        : c.fallback,
    };
    ctx.rerender();
  },
  async books(ctx) {
    const books = await listBooks().catch(() => []);
    ui.pick.books = books
      .map((b) => ({
        id: b.id,
        title: typeof b.title === "string" ? b.title : b.title?.en || "Book",
        words: countWords(b),
      }))
      .filter((b) => b.words > 0);
    ctx.rerender();
  },
  delete(ctx, { key }) {
    deleteDraft(key);
    ui = {
      ...fresh(),
      note: {
        tone: "ok",
        text: [
          "The experience was deleted from this device.",
          "La experiencia se borró de este dispositivo.",
        ],
      },
    };
    ctx.rerender();
  },
  export() {
    download(
      `${
        ui.entry.def.title[0]
          .replace(/[^\w]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 50) || "experience"
      }.json`,
      exportDraft(ui.key, ui.entry),
    );
  },
  publish: (ctx) => publish(ctx, ui, persist),
  unpublish: (ctx) => unpublish(ctx, ui, persist),
  async "copy-link"(ctx) {
    const link = document.getElementById("xbLink")?.value || "";
    const ok = await navigator.clipboard?.writeText(link).then(
      () => true,
      () => false,
    );
    announce(
      i18nFor(ctx).S(
        ok ? "Link copied." : "Select the link and copy it.",
        ok ? "Enlace copiado." : "Seleccione el enlace y cópielo.",
      ),
    );
  },
  // the plain walk-through
  "pv-reset"(ctx) {
    sim?.stopPlayer?.(ui.session);
    ui.preview = null;
    ui.session = null;
    ctx.rerender();
  },
  "pv-open"(ctx, { id }) {
    previewOpen(ui.entry.def, ui.preview, id);
    ctx.rerender();
  },
  "pv-topic"(ctx, { character, topic, clarify }) {
    previewTopic(ui.entry.def, ui.preview, character, topic, clarify);
    ctx.rerender();
  },
  "pv-ask"(ctx, { character }) {
    previewAsk(
      ui.entry.def,
      ui.preview,
      character,
      document.querySelector("[data-xb-pv-ask]")?.value || "",
    );
    ctx.rerender();
  },
  "pv-listen"(ctx, { id }) {
    speak(evidenceOf(ui.entry.def, id).body[0]);
  },
  "pv-compare"(ctx, { task }) {
    const q = (s) => document.querySelector(s)?.value;
    previewAct(ui.entry.def, ui.preview, {
      type: "compare",
      task,
      pair: Number(q("[data-xb-pv-pair]")),
      relation: q("[data-xb-pv-relation]"),
      stronger: q("[data-xb-pv-stronger]"),
      reason: q("[data-xb-pv-reason]"),
    });
    ctx.rerender();
  },
  "pv-decide"(ctx, { task }) {
    const option = document.querySelector("[data-xb-pv-option]:checked")?.value;
    const cited = [...document.querySelectorAll("[data-xb-pv-cite]:checked")].map((x) => x.value);
    if (previewAct(ui.entry.def, ui.preview, { type: "decide", task, option, cited, reason: "" }))
      ui.preview.open = null;
    ctx.rerender();
  },
  "pv-submit"(ctx, { task }) {
    if (
      previewAct(ui.entry.def, ui.preview, {
        type: "submit",
        task,
        text: document.querySelector("[data-xb-pv-text]")?.value || "",
      })
    )
      ui.preview.open = null;
    ctx.rerender();
  },
};

export function onClick(e, ctx) {
  const btn = e.target?.closest?.("[data-xb-act]");
  if (!btn) {
    if (ctx.route.sub === "preview" && ui.session && sim && e.target?.closest?.("[data-xb-player]"))
      return sim.onPlayerClick?.(e, ctx, ui.session);
    return false;
  }
  if (btn.disabled) return true;
  const run = ACTIONS[btn.getAttribute("data-xb-act")];
  if (!run) return false;
  if (!["undo", "op", "ask"].includes(btn.getAttribute("data-xb-act"))) ui.note = null;
  run(ctx, argOf(btn));
  return true;
}
