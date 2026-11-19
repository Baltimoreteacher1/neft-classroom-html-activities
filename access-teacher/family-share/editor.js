// The edit form of "Share with families": what a teacher can choose before approving. Facts (practice days, skills) are
// shown, never edited. Everything a family reads is authored text chosen here by id; the only free words are the first
// name, the verbatim quote picked from the student's own work, and one short note.
import { el } from "../../access-practice-lab/src/class/dom.js";
import { LIMITS, compose } from "../../access-practice-lab/src/family/story/model.js";
import { DOMAIN_WORD, STARTERS, STARTER_IDS } from "../../access-practice-lab/src/family/story/wording.js";

const field = (id, label, control, hint) =>
  el(
    "div",
    { class: "fsh-field" },
    el("label", { for: id }, label),
    control,
    hint ? el("p", { class: "fine", id: `${id}Hint` }, hint) : "",
  );

const segmented = (name, label, options, current, attr) =>
  el(
    "div",
    { class: "fsh-seg", role: "group", "aria-label": label },
    options.map(([value, text, lang]) =>
      el("button", { type: "button", class: "fsh-seg-btn", [attr]: value, "aria-pressed": String(current === value), lang }, text),
    ),
  );

export const langSegment = (c, current, attr, name) =>
  segmented(name, c.langLabel, [["en", c.langs.en, "en"], ["es", c.langs.es, "es"], ["bi", c.langs.bi, ""]], current, attr);

/** Quote choices: each candidate with the sentence that goes with it, plus "no quote". */
function celebrate(c, evidence, story, S) {
  const none = el(
    "label",
    { class: "fsh-choice" },
    el("input", { type: "radio", name: "fshQuote", value: "", checked: !story.q, "data-fsh-quote": "" }),
    el("span", {}, c.noQuote),
  );
  const items = evidence.candidates.map((cand, i) => {
    const sentence = compose({ ...story, c: cand.c, q: cand.q, m: cand.m }).celebrate.text;
    return el(
      "label",
      { class: "fsh-choice" },
      el("input", { type: "radio", name: "fshQuote", value: String(i), checked: story.q === cand.q, "data-fsh-quote": String(i) }),
      el(
        "span",
        {},
        el("blockquote", { lang: "en" }, `“${cand.q}”`),
        el("span", { class: "fine" }, cand.m === "s" ? c.said : c.wrote, ". ", c.shows, " ", S(sentence.en, sentence.es)),
      ),
    );
  });
  return el(
    "fieldset",
    { class: "fsh-set" },
    el("legend", {}, c.celebrateHeading),
    el("p", { class: "fine" }, c.celebrateHelp),
    evidence.hasWords && evidence.candidates.length ? [...items, none] : el("p", { class: "fsh-quiet" }, c.noWords(evidence.alias)),
    evidence.hasWords && evidence.candidates.length
      ? ""
      : el("a", { class: "btn", href: "#classEvidence" }, c.importLink),
  );
}

function talks(c, story, S) {
  const label = (id) => {
    const st = STARTERS[id];
    const text = S(st.ask.en, st.ask.es).replace(/^(Ask your child to|Ask:|Pregunte:|Pídale que)\s*/, "");
    return `${S(DOMAIN_WORD[st.domain].en, DOMAIN_WORD[st.domain].es)}: ${text.slice(0, 70)}${text.length > 70 ? "…" : ""}`;
  };
  return el(
    "fieldset",
    { class: "fsh-set" },
    el("legend", {}, c.talksHeading),
    [0, 1, 2].map((i) =>
      field(
        `fshTalk${i}`,
        c.talkLabel(i + 1),
        el(
          "select",
          { id: `fshTalk${i}`, "data-fsh-talk": String(i) },
          STARTER_IDS.map((id) => el("option", { value: id, selected: story.s[i] === id }, label(id))),
        ),
      ),
    ),
  );
}

/** Everything but the preview and the approval. */
export function editorNodes(c, evidence, story, S) {
  const facts = compose(story).week;
  return [
    el(
      "div",
      { class: "fsh-facts" },
      el("h4", {}, c.factsHeading),
      el("p", {}, c.facts({ days: story.w })),
      facts.skills.length ? el("p", {}, facts.skills.map((x) => S(x.en, x.es)).join(" · ")) : "",
      el("p", { class: "fine" }, c.factsNote),
    ),
    field(
      "fshName",
      c.nameLabel,
      el("input", { id: "fshName", type: "text", maxlength: String(LIMITS.name), autocomplete: "off", value: story.n, "aria-describedby": "fshNameHint", "data-fsh-name": "" }),
      c.nameHint,
    ),
    el("div", { class: "fsh-field" }, el("span", { class: "fsh-label" }, c.langLabel), langSegment(c, story.l, "data-fsh-lang", "lang")),
    celebrate(c, evidence, story, S),
    talks(c, story, S),
    el(
      "div",
      { class: "fsh-field" },
      el("label", { for: "fshNote" }, c.noteLabel),
      el("textarea", { id: "fshNote", rows: "3", maxlength: String(LIMITS.note), "aria-describedby": "fshNoteHint fshNoteBad", "data-fsh-note": "" }, story.t),
      el("p", { class: "fine", id: "fshNoteHint" }, c.noteHint),
      el("p", { class: "ti-note", id: "fshNoteBad", role: "status", hidden: true }, c.noteRejected),
      el(
        "div",
        { class: "fsh-seg", role: "group", "aria-label": c.noteLang },
        [["en", "English"], ["es", "Español"]].map(([v, t]) =>
          el("button", { type: "button", class: "fsh-seg-btn", "data-fsh-notelang": v, "aria-pressed": String(story.x === v), lang: v }, t),
        ),
      ),
    ),
  ];
}
