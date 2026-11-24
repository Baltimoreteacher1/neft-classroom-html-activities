// Writing Lab: "Customize for my class". A teacher edits the task, sentence starters, transitions and extra words;
// edits are saved on this device and travel to students as ?c=<code> (shared/bcpss/writing-custom.js — the same
// format the printed packets read). No server storage, no student data.
import {
  applyCustom,
  decodeCustom,
  encodeCustom,
  sanitizeCustom,
} from "/shared/bcpss/writing-custom.js";
import { copyText, storeGet, storeSet } from "../language-studio/studio-core.js";
import { LEVEL_INFO, feedback, h, wl } from "./wl-core.js";

const LEVELS = ["l1_2", "l3_4", "l5_6"];
const key = () => `bcpss-writing-custom:${wl.unitId}`;

/** Call once after the unit loads: applies a shared link (?c=) or this device's saved edits to wl.w. */
export function initCustom(params) {
  wl.base = wl.w;
  const fromLink = decodeCustom(params.get("c"));
  if (fromLink) storeSet(key(), fromLink);
  wl.custom = fromLink || sanitizeCustom(storeGet(key()));
  wl.w = applyCustom(wl.base, wl.custom);
}

/** The ?c= value for links and printables ("" when nothing is customized). */
export const customParam = () => (wl.custom ? encodeCustom(wl.custom) : "");

function setCustom(next) {
  wl.custom = sanitizeCustom(next);
  storeSet(key(), wl.custom);
  wl.w = applyCustom(wl.base, wl.custom);
}

// One item per line (commas are kept: transitions like "First," carry them).
const lines = (s) =>
  String(s || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

function field(label, value, { rows = 2, hint = "", id }) {
  const area = h("textarea", { id, class: "wl-input", rows: String(rows) });
  area.value = value || "";
  return {
    area,
    el: h(
      "div",
      { class: "wl-field" },
      h("label", { for: id, class: "wl-field__label" }, label),
      hint ? h("p", { class: "wl-field__hint" }, hint) : null,
      area,
    ),
  };
}

/** The editor screen (route: ?step=customize). `done()` returns to the overview. */
export function customizeView(done) {
  const b = wl.base;
  const c = wl.custom || {};
  const fb = feedback();
  const f = {};
  const levelBlock = (name, title, src, cur, hint) =>
    h(
      "fieldset",
      { class: "wl-cust__group" },
      h("legend", null, title),
      hint ? h("p", { class: "wl-field__hint" }, hint) : null,
      ...LEVELS.map((l) => {
        f[`${name}_${l}`] = field(
          `${LEVEL_INFO[l].name} · ${LEVEL_INFO[l].wida}`,
          cur?.[l] || src[l],
          { id: `wlc-${name}-${l}`, rows: name === "prompt" ? 3 : 2 },
        );
        return f[`${name}_${l}`].el;
      }),
    );
  f.title = field("Assignment title", c.title || b.title, { id: "wlc-title", rows: 1 });
  f.note = field("Note to students (optional)", c.note || "", {
    id: "wlc-note",
    rows: 2,
    hint: "Shown at the top of the Writing Lab and on the printed packet.",
  });
  f.starters = field(
    "Topic-sentence starters (one per line)",
    (c.starters || b.spo.starters.map((s) => s.text)).join("\n"),
    { id: "wlc-starters", rows: 4 },
  );
  f.transitions = field(
    "Transition words (one per line)",
    (c.transitions || b.transitions).join("\n"),
    { id: "wlc-trans", rows: 4 },
  );
  f.words = field("Extra word-bank words (one per line, optional)", (c.words || []).join("\n"), {
    id: "wlc-words",
    rows: 3,
    hint: "Added to the unit words students can tap while drafting.",
  });

  const collect = () => {
    const pick = (name) => Object.fromEntries(LEVELS.map((l) => [l, f[`${name}_${l}`].area.value]));
    // Store only what differs from the authored version, so an unchanged field keeps following future updates.
    const diffLevels = (name, src) => {
      const v = pick(name);
      const out = {};
      for (const l of LEVELS) if (v[l].trim() && v[l].trim() !== src[l]) out[l] = v[l];
      return Object.keys(out).length ? out : undefined;
    };
    const diffList = (val, src) => {
      const v = lines(val);
      return v.join("|") === src.join("|") ? undefined : v;
    };
    return {
      title: f.title.area.value.trim() !== b.title ? f.title.area.value : undefined,
      note: f.note.area.value,
      prompt: diffLevels("prompt", b.prompt),
      topic: diffLevels("topic", b.spo.topic),
      conclusion: diffLevels("conclusion", b.spo.conclusion),
      starters: diffList(
        f.starters.area.value,
        b.spo.starters.map((s) => s.text),
      ),
      transitions: diffList(f.transitions.area.value, b.transitions),
      words: lines(f.words.area.value),
    };
  };
  const studentLink = () => {
    const p = new URLSearchParams({ unit: wl.unitId });
    const code = customParam();
    if (code) p.set("c", code);
    return `${location.origin}${location.pathname}?${p}`;
  };
  const save = h("button", { type: "button", class: "st-btn st-btn--primary" }, "Save changes");
  save.addEventListener("click", () => {
    setCustom(collect());
    fb.set(
      wl.custom
        ? "Saved on this device. Copy the student link to share this version."
        : "No changes from the original.",
      "ok",
    );
  });
  const share = h("button", { type: "button", class: "st-btn" }, "Copy student link");
  share.addEventListener("click", async () => {
    setCustom(collect());
    const ok = await copyText(studentLink());
    fb.set(
      ok
        ? "Link copied. Students who open it get this version (paste it in Canvas or Google Classroom)."
        : `Copy this link: ${studentLink()}`,
      "ok",
    );
  });
  const reset = h(
    "button",
    { type: "button", class: "st-btn st-btn--ghost" },
    "Restore the original",
  );
  reset.addEventListener("click", () => {
    setCustom(null);
    done();
  });
  const back = h("button", { type: "button", class: "st-btn" }, "← Back to the Writing Lab");
  back.addEventListener("click", () => {
    setCustom(collect());
    done();
  });

  return h(
    "article",
    { class: "wl-step wl-cust" },
    h(
      "header",
      { class: "wl-step__head" },
      h("p", { class: "wl-eyebrow" }, "For teachers"),
      h("h1", { tabindex: "-1", id: "wlStepTitle" }, "Customize for my class"),
      h(
        "p",
        { class: "wl-step__why" },
        "Change the task, the sentence starters and the word banks. Your version is saved on this device and travels to students with the student link; printed packets follow it too.",
      ),
    ),
    h(
      "div",
      { class: "wl-step__body" },
      f.title.el,
      f.note.el,
      levelBlock("prompt", "Writing task by level", b.prompt, c.prompt),
      levelBlock(
        "topic",
        "Topic-sentence frame by level",
        b.spo.topic,
        c.topic,
        "Use [brackets] for the blanks students fill in.",
      ),
      levelBlock(
        "conclusion",
        "Concluding-sentence frame by level",
        b.spo.conclusion,
        c.conclusion,
        "Use [brackets] for the blanks students fill in.",
      ),
      f.starters.el,
      f.transitions.el,
      f.words.el,
      fb,
    ),
    h(
      "footer",
      { class: "wl-step__nav" },
      back,
      h("div", { class: "wl-cust__actions" }, reset, share, save),
    ),
  );
}
