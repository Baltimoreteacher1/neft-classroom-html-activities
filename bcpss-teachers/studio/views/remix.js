// #/remix: Resource Remix. A teacher's own text or objective becomes an editable draft of supports (vocabulary cards with
// confirmed meanings, an evidence investigation, a discussion with frames at every support level, an exit-ticket skeleton,
// language objective ideas). The teacher's words stay exactly as typed, nothing is invented, and nothing leaves the device.
// Finished drafts open in the Resource Studio at #/create?type=remix-<type>&draft=remix.
import { announce, h } from "../core/dom.js";
import {
  REMIX_NOTICE,
  REMIX_TARGETS,
  buildDraft,
  draftToText,
  sendToCreate,
  textPreserved,
} from "../core/remix.js";
import { btn, copyWithNotice } from "./lens-ui.js";
import { editorFor } from "./remix-editors.js";
import {
  MIN_WORDS,
  ensureToolCss,
  gradeSubject,
  loadHandoff,
  privacyBanner,
  statusLine,
  textBox,
  wordCount,
} from "./lens-tools-ui.js";
import { loadCollections } from "./vocab/source.js";

const TARGET_IDS = REMIX_TARGETS.map((t) => t.id);

/** Drop blank list lines so empty rows never reach the printed resource. */
function tidy(d) {
  const keep = (list) => list.filter((s) => String(s).trim());
  const copy = { ...d };
  for (const k of ["criteria", "roles", "suggestions", "listenFor"])
    if (Array.isArray(d[k])) copy[k] = keep(d[k]);
  return copy;
}

export async function render({ root, params = {}, shell }) {
  ensureToolCss();
  const prefs = shell?.prefs?.getPrefs?.() || {};
  const carried = params.from === "lens" ? loadHandoff() : null;
  let target = TARGET_IDS.includes(params.target) ? params.target : "vocab-cards";
  let draft = null;
  let editor = null;
  let source = "";
  let collectionsPromise = null;
  const collectionsOnce = () =>
    (collectionsPromise ||= loadCollections(shell).then((r) => r.collections));

  const status = statusLine();
  const textField = textBox({
    id: "st-rx-text",
    label: "Your text",
    hint: "A passage, a problem or directions you are allowed to use. Type it or paste it.",
    value: carried?.text || "",
  });
  const objField = textBox({
    id: "st-rx-obj",
    label: "Your lesson objective",
    hint: "For example: I can compare two fractions using a number line.",
    rows: 3,
  });
  const picks = gradeSubject("st-rx", {
    grade: params.grade || carried?.grade || prefs.grade || "",
    subject: params.subject || carried?.subject || prefs.subject || "",
  });
  const draftHost = h("div", { class: "st-lt-results" });
  const helpEl = h("p", { class: "st-ll-muted", id: "st-rx-help" });
  const makeBtn = btn("Make my draft", () => makeDraft(), { kind: "primary" });

  const radios = REMIX_TARGETS.map((t) => {
    const input = h("input", {
      type: "radio",
      name: "st-rx-target",
      value: t.id,
      id: `st-rx-t-${t.id}`,
    });
    input.checked = t.id === target;
    input.addEventListener("change", () => choose(t.id));
    return h(
      "label",
      { class: "st-lt-choice", for: input.id },
      input,
      h(
        "span",
        {},
        h("strong", {}, t.label),
        h("span", { class: "st-ll-muted st-lt-choice-help" }, t.help),
      ),
    );
  });

  function inputKind() {
    return REMIX_TARGETS.find((t) => t.id === target).input;
  }

  function syncInputs() {
    const isText = inputKind() === "text";
    textField.el.hidden = !isText;
    objField.el.hidden = isText;
    helpEl.textContent = isText
      ? "This type is made from a text."
      : "This type is made from an objective, not a text.";
  }

  function choose(id) {
    target = id;
    syncInputs();
    if (draft) {
      draft = null;
      draftHost.replaceChildren();
      showEmpty();
      status.say("You chose a different type. Make a new draft when you are ready.");
    }
  }

  function showEmpty() {
    draftHost.replaceChildren(
      h(
        "section",
        { class: "st-ll-card st-lt-empty", "aria-labelledby": "st-rx-empty" },
        h("h2", { id: "st-rx-empty", class: "st-ll-h2" }, "No draft yet"),
        h(
          "p",
          {},
          "Choose what to make, add your text or objective, then choose Make my draft. You can change every part of the draft before you use it.",
        ),
      ),
    );
  }

  function problemsBox() {
    return h("div", { class: "st-lt-problems", id: "st-rx-problems" });
  }

  function paintProblems() {
    const box = draftHost.querySelector("#st-rx-problems");
    if (!box || !editor) return;
    const list = editor.problems();
    box.replaceChildren(
      list.length
        ? h(
            "div",
            { class: "st-ll-notice" },
            h("p", {}, h("strong", {}, "Still needed before this can go to the Resource Studio:")),
            h(
              "ul",
              { class: "st-ll-list" },
              list.map((p) => h("li", {}, p)),
            ),
          )
        : h(
            "p",
            { class: "st-ll-muted" },
            "This draft is ready for the Resource Studio. You can keep editing first.",
          ),
    );
  }

  function renderDraft() {
    const label = REMIX_TARGETS.find((t) => t.id === draft.type).label;
    const heading = h(
      "h2",
      { id: "st-rx-draft", class: "st-ll-h2", tabindex: "-1" },
      `Your draft: ${label}`,
    );
    const kept = textPreserved(source, draft);
    const ctx = {
      changed: paintProblems,
      say: (t) => (status.say(t), announce(t)),
      collections: loaded,
      grade: picks.get().grade,
      subject: picks.get().subject,
    };
    editor = editorFor(draft, ctx);
    draftHost.replaceChildren(
      h(
        "section",
        { class: "st-ll-card", "aria-labelledby": "st-rx-draft" },
        heading,
        kept
          ? h(
              "p",
              { class: "st-lt-kept" },
              h("strong", {}, "Your words are kept exactly as typed. "),
              "The studio does not rewrite your text. Anything it added is marked, and you can change it.",
            )
          : h(
              "p",
              { class: "st-ll-notice", role: "alert" },
              "Your text no longer matches what you typed. Do not use this draft; make it again.",
            ),
        editor.el,
        problemsBox(),
        h(
          "div",
          { class: "st-ll-row" },
          btn("Open in Resource Studio", () => send(), { kind: "primary" }),
          btn("Copy as text", () => copyWithNotice(draftToText(tidy(draft)), "Draft")),
          btn("Start over", () => startOver()),
        ),
        h(
          "p",
          { class: "st-ll-muted" },
          "Opening the Resource Studio keeps this draft in this browser so the next page can read it. It is not sent anywhere.",
        ),
      ),
    );
    paintProblems();
    heading.focus();
  }

  let loaded = [];

  async function makeDraft() {
    const isText = inputKind() === "text";
    const raw = (isText ? textField : objField).ta.value;
    if (wordCount(raw) < MIN_WORDS) {
      status.fail(
        `Add at least ${MIN_WORDS} words ${isText ? "of text" : "to your objective"} first.`,
      );
      (isText ? textField : objField).ta.focus();
      return;
    }
    const vals = picks.get();
    makeBtn.disabled = true;
    root.setAttribute("aria-busy", "true");
    status.say("Making your draft.");
    let warning = "";
    loaded = [];
    if (target === "vocab-cards") {
      try {
        loaded = await collectionsOnce();
      } catch {
        collectionsPromise = null;
        warning =
          "The studio vocabulary could not be loaded, so meanings are blank. Write your own, or try again later.";
      }
    }
    try {
      draft = buildDraft(target, raw, {
        grade: vals.grade,
        subject: vals.subject,
        collections: loaded,
      });
      source = raw;
      renderDraft();
      status.say(
        warning
          ? `Draft ready. ${warning}`
          : "Draft ready. Review each part and edit what you need.",
      );
      if (warning)
        draftHost
          .querySelector(".st-ll-card")
          ?.prepend(h("p", { class: "st-ll-notice", role: "alert" }, warning));
    } catch (err) {
      console.warn("[studio] remix failed", err);
      draft = null;
      status.fail("The draft could not be made.");
      draftHost.replaceChildren(
        h(
          "section",
          { class: "st-ll-card st-ll-error", role: "alert" },
          h("h2", { class: "st-ll-h2" }, "The draft could not be made"),
          h("p", {}, "Your text is still in the box and nothing was lost."),
          btn("Try again", () => makeDraft(), { kind: "primary" }),
        ),
      );
    } finally {
      makeBtn.disabled = false;
      root.removeAttribute("aria-busy");
    }
  }

  function send() {
    const problems = editor.problems();
    if (problems.length) {
      status.fail(`Not ready yet. ${problems.join(" ")}`);
      paintProblems();
      return;
    }
    if (!textPreserved(source, draft)) {
      status.fail("Your text no longer matches what you typed. Make the draft again.");
      return;
    }
    const vals = picks.get();
    const hash = sendToCreate(tidy(draft));
    window.location.hash = `${hash}${vals.grade ? `&grade=${encodeURIComponent(vals.grade)}` : ""}${vals.subject ? `&subject=${encodeURIComponent(vals.subject)}` : ""}`;
  }

  function startOver() {
    draft = null;
    editor = null;
    showEmpty();
    status.say("Draft cleared. Your text is still in the box.");
    (inputKind() === "text" ? textField : objField).ta.focus();
  }

  const form = h(
    "form",
    { class: "st-ll-card st-lt-form", novalidate: "" },
    h(
      "fieldset",
      { class: "st-lt-choices" },
      h("legend", { class: "st-ll-h2" }, "What do you want to make?"),
      radios,
    ),
    textField.el,
    objField.el,
    helpEl,
    picks.el,
    h("div", { class: "st-ll-row" }, makeBtn),
    status.el,
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    makeDraft();
  });

  root.replaceChildren(
    h(
      "section",
      { class: "st-ll st-lt" },
      h("h1", {}, "Resource Remix"),
      h(
        "p",
        { class: "st-lt-lede" },
        "Turn your own text or objective into supports: vocabulary cards, an evidence investigation, a partner discussion with sentence frames, an exit ticket or language objective ideas. You review and edit everything.",
      ),
      privacyBanner(REMIX_NOTICE),
      carried
        ? h(
            "p",
            { class: "st-ll-notice", role: "note" },
            "This text came from the Language Lens. It was brought over on this device only.",
          )
        : null,
      form,
      draftHost,
    ),
  );
  syncInputs();
  showEmpty();
  return () => {
    collectionsPromise = null;
  };
}
