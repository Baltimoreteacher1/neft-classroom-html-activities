// Resource Studio (#/create): choose a resource, fill it from a lesson or vocabulary set, preview and edit it,
// then print it or download it as Word. Everything is built in this browser; nothing is uploaded.
import { h } from "../core/dom.js";
import { readHandoff } from "../core/remix.js";
import { SUBJECTS, GRADES, GRADE_LABEL, bandOf } from "../data/taxonomy.js";
import { loadRenderVisual, prepareDoc } from "../print/export.js";
import { templateById } from "../print/templates.js";
import { exportBar } from "./create/actions.js";
import { contentPicker } from "./create/content.js";
import { field, heading, resourcePicker, select, settingsForm } from "./create/controls.js";
import { createPreview } from "./create/preview.js";
import { remixDocument } from "./create/remix-doc.js";
import { loadSource, makeDocument } from "./create/source.js";
import { resolveType, stateFromParams, stateToQuery } from "./create/state.js";

const SHEETS = ["./create/create.css", "../print/print.css"];
const REMIX_NAME = {
  "vocab-cards": "vocabulary cards",
  evidence: "text to evidence",
  "exit-ticket": "exit ticket",
  discussion: "academic discussion",
  "language-objective": "language objective ideas",
};

function loadSheets() {
  for (const rel of SHEETS) {
    const href = new URL(rel, import.meta.url).href;
    if (!document.querySelector(`link[data-st-cr-css="${rel}"]`))
      document.head.append(h("link", { rel: "stylesheet", href, "data-st-cr-css": rel }));
  }
}

export async function render({ root, params, shell }) {
  loadSheets();
  const cls = params.class ? shell.classes.getClass(params.class) : null;
  const st = stateFromParams(
    params,
    shell.prefs.getPrefs(),
    cls ? shell.classes.dominantTier(cls) : null,
  );
  const remixDraft = st.draft ? readHandoff()?.draft || null : null;
  let items = [];
  let listError = false;
  try {
    items = await shell.catalog.manifest();
  } catch {
    listError = true;
  }

  let data = { lesson: null, vocab: null, entries: [], error: "" };
  let visuals = null;
  let token = 0;
  let firstLoad = true;
  const getVisuals = async () => (visuals ||= { renderVisual: await loadRenderVisual() });

  const noticeBox = h("div", { class: "st-cr-notices" });
  const staleBox = h("div", { class: "st-cr-stale", hidden: true });
  const preview = createPreview({});
  const exports = exportBar({
    getDoc: () => preview.doc(),
    getVisuals,
    onDone: (kind, doc) => {
      const tpl = templateById(st.templateId);
      shell.library.addRecent({
        kind: "part",
        id: `create:${doc.template}:${doc.meta.lessonId || doc.meta.vocabId || "topic"}`,
        title: doc.title,
        label: tpl?.label || doc.title,
        href: `#/create?${new URLSearchParams(stateToQuery(st))}`,
      });
    },
  });

  const onChange = (what) => {
    if (what === "template" || what === "source") settings.redraw();
    if (["grade", "subject"].includes(what)) {
      picker.redraw();
      content.redraw();
    }
    if (what === "source" || what === "entries") content.redraw();
    if (preview.hasEdits()) return markStale();
    refresh(what === "source");
  };
  const picker = resourcePicker(st, onChange);
  const content = contentPicker({ st, items, listError, onChange });
  const settings = settingsForm(st, onChange);

  function markStale() {
    const rebuild = h(
      "button",
      { class: "st-btn st-btn-primary", type: "button" },
      "Rebuild and replace my edits",
    );
    const keep = h("button", { class: "st-btn", type: "button" }, "Keep my edits");
    rebuild.addEventListener("click", () => {
      staleBox.hidden = true;
      refresh(true, true);
    });
    keep.addEventListener("click", () => {
      staleBox.hidden = true;
    });
    staleBox.hidden = false;
    staleBox.replaceChildren(
      h(
        "div",
        { class: "st-notice", role: "alert" },
        h(
          "p",
          {},
          "You changed a setting, but you have also edited the text. Rebuilding would replace your edits.",
        ),
        h("p", { class: "st-row" }, rebuild, keep),
      ),
    );
  }

  function showNotice(n) {
    noticeBox.replaceChildren();
    if (!n) return;
    const kids = [h("p", {}, n.text)];
    if (n.action === "retry") {
      const b = h("button", { class: "st-btn", type: "button" }, "Try again");
      b.addEventListener("click", () => refresh(true, true));
      kids.push(h("p", { class: "st-row" }, b));
    }
    if (n.action === "pick-content") {
      const b = h("button", { class: "st-btn", type: "button" }, "Choose content");
      b.addEventListener("click", () =>
        (root.querySelector("#st-cr-q") || root.querySelector("#st-cr-s2"))?.focus(),
      );
      kids.push(h("p", { class: "st-row" }, b));
    }
    noticeBox.append(
      h(
        "div",
        { class: `st-notice${n.kind === "info" ? " st-notice-info" : ""}`, role: "status" },
        kids,
      ),
    );
  }

  function remixResult() {
    if (!st.grade) return { notice: { kind: "info", text: "Choose a grade so the resource can be sized for your students." } };
    return remixDocument(remixDraft, { grade: st.grade, subject: st.subject || "interdisciplinary", band: bandOf(st.grade) });
  }

  async function refresh(reload, force = false) {
    const mine = ++token;
    if (!force && preview.hasEdits() && !reload) return;
    if (reload && !remixDraft) {
      noticeBox.replaceChildren(
        h("p", { class: "st-loading", role: "status" }, "Loading your content"),
      );
      data = await loadSource(shell.catalog, st);
      if (mine !== token) return;
      content.redraw(data);
      const src = data.lesson || data.vocab;
      if (src && ((!st.grade && src.grade) || (!st.subject && src.subject))) {
        if (!st.grade && src.grade) st.grade = String(src.grade);
        if (!st.subject && src.subject) st.subject = src.subject;
        picker.redraw();
        settings.redraw();
      }
      if (firstLoad && !st.templateId && data.lesson) {
        firstLoad = false;
        const first = (data.lesson.printables || [])
          .map((p) => resolveType(p).templateId)
          .find(Boolean);
        if (first) {
          st.templateId = first;
          picker.redraw();
          settings.redraw();
        }
      }
    }
    firstLoad = false;
    const { renderVisual } = await getVisuals();
    if (mine !== token) return;
    const r = remixDraft ? remixResult() : makeDocument(st, data);
    staleBox.hidden = true;
    if (r.doc) {
      const working = prepareDoc(r.doc);
      showNotice(null);
      preview.show(working, { renderVisual });
      exports.setReady(working);
      shell.setTitle(`${working.title} - Resource Studio`);
    } else {
      preview.hide();
      exports.setReady(null);
      showNotice(r.notice || { kind: "info", text: r.error || "Choose a resource to begin." });
    }
    shell.replaceHash(
      `#/create${Object.keys(stateToQuery(st)).length ? `?${new URLSearchParams(stateToQuery(st))}` : ""}`,
    );
  }

  const side = remixDraft
    ? h("form", { class: "st-cr-form", onsubmit: (e) => e.preventDefault() }, remixSide())
    : h(
        "form",
        {
          class: "st-cr-form",
          onsubmit: (e) => e.preventDefault(),
          "aria-label": "Resource settings",
        },
        picker.el,
        content.el,
        settings.el,
      );

  function remixSide() {
    const set = (key) => (v) => {
      st[key] = v;
      refresh(false, true);
    };
    return h(
      "section",
      { class: "st-step", "aria-labelledby": "st-cr-s0" },
      heading("st-cr-s0", "1", "Your Remix draft"),
      h(
        "p",
        {},
        `This is your ${REMIX_NAME[remixDraft.type] || "draft"}, made from the text you supplied. Your words are used exactly as typed.`,
      ),
      h(
        "p",
        { class: "st-hint" },
        h("a", { href: "#/remix" }, "Back to Remix to change the draft"),
      ),
      field(
        "st-cr-grade",
        "Grade",
        select(
          "st-cr-grade",
          GRADES.map((g) => ({ v: g, label: GRADE_LABEL[g] })),
          st.grade,
          set("grade"),
          "Choose a grade",
        ),
      ),
      field(
        "st-cr-subject",
        "Subject",
        select(
          "st-cr-subject",
          SUBJECTS.map((s) => ({ v: s.id, label: s.short })),
          st.subject,
          set("subject"),
          "Any subject",
        ),
      ),
    );
  }

  const main = h("div", { class: "st-cr-main" }, noticeBox, staleBox, exports.el, preview.el);
  preview.hide();
  root.replaceChildren(
    h(
      "div",
      { class: "st-cr" },
      h("h1", {}, "Resource Studio"),
      h(
        "p",
        { class: "st-lede" },
        "Make a printable resource from a lesson or vocabulary set. Pictures, supports and answer keys come with it, and everything stays in this browser.",
      ),
      h("div", { class: "st-cr-grid" }, side, main),
    ),
  );

  if (st.draft && !remixDraft)
    showNotice({
      kind: "warn",
      text: "The Remix draft was not found on this device. Open Remix, build the draft again and send it here.",
    });
  else await refresh(true);
  return () => preview.destroy();
}
