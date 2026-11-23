// One editor per Resource Remix draft type. Each edits the draft from core/remix.js in place and reports what is still
// missing before the draft can go to the Resource Studio. The teacher's own text (draft.source, context sentences,
// evidence sentences) is shown but never made editable here, so it stays exactly as typed.
import { h } from "../core/dom.js";
import { buildVocabCards, confirmedCards, evidenceProblems } from "../core/remix.js";
import { TIERS } from "../data/taxonomy.js";
import { btn, chip, listEditor, visualBox } from "./lens-ui.js";

const TIER_LABEL = Object.fromEntries(TIERS.map((t) => [t.id, t.label]));
let uid = 0;
const nextId = (p) => `${p}${(uid += 1)}`;

function field(label, control, hint) {
  const id = nextId("st-rx-f");
  control.id = id;
  return h(
    "div",
    { class: "st-lt-field" },
    h("label", { for: id }, label),
    hint ? h("p", { class: "st-ll-muted st-lt-hint" }, hint) : null,
    control,
  );
}

function textarea(value, onInput, rows = 2) {
  const ta = h("textarea", { class: "st-ll-input", rows: String(rows) });
  ta.value = value || "";
  ta.addEventListener("input", () => onInput(ta.value));
  return ta;
}

function textInput(value, onInput) {
  const el = h("input", { type: "text", class: "st-ll-input", autocomplete: "off" });
  el.value = value || "";
  el.addEventListener("input", () => onInput(el.value));
  return el;
}

function framesBlock(frames) {
  return h(
    "div",
    { class: "st-lt-tiers" },
    Object.entries(frames).map(([tier, f]) =>
      h(
        "div",
        { class: "st-lt-tier" },
        h("h4", {}, TIER_LABEL[tier] || tier),
        h(
          "ul",
          { class: "st-ll-list" },
          (Array.isArray(f) ? f : [f]).map((x) => h("li", {}, x)),
        ),
      ),
    ),
  );
}

const quote = (text) => h("q", { class: "st-lt-example" }, text);

function vocabCards(draft, ctx) {
  const list = h("ul", { class: "st-lt-cards" });
  const empty = h(
    "p",
    { class: "st-ll-muted" },
    "No key words were found. Add the words you want to teach below.",
  );
  const paint = () => {
    list.replaceChildren(
      ...draft.cards.map((c) => {
        const def = textarea(c.def, (v) => {
          c.def = v;
          ctx.changed();
        });
        const ok = h("input", { type: "checkbox" });
        ok.checked = c.confirmed;
        ok.addEventListener("change", () => {
          c.confirmed = ok.checked;
          ctx.changed();
        });
        const defId = nextId("st-rx-d");
        def.id = defId;
        return h(
          "li",
          { class: "st-ll-card st-lt-card" },
          h("h3", {}, c.word),
          c.defFrom
            ? h(
                "p",
                { class: "st-ll-muted" },
                `Definition filled in from the studio collection "${c.defFrom}". Read it and change it if it does not fit your class.`,
              )
            : h("p", { class: "st-ll-muted" }, "No studio definition was found. Write your own."),
          h("label", { for: defId }, `Meaning of "${c.word}"`),
          def,
          c.visual
            ? visualBox(c.visual)
            : c.noVisualReason
              ? h("p", { class: "st-ll-muted" }, `No picture: ${c.noVisualReason}.`)
              : null,
          c.es
            ? h(
                "p",
                {},
                `Spanish in the studio: ${c.es.word} `,
                c.es.verified
                  ? chip("Verified", { tone: "ok" })
                  : chip("Needs review", { tone: "review" }),
              )
            : null,
          c.contextSentence ? h("p", {}, "In your text: ", quote(c.contextSentence)) : null,
          h(
            "label",
            { class: "st-ll-check" },
            ok,
            h("span", {}, `I checked this meaning and want this card`),
          ),
          btn(
            `Remove ${c.word}`,
            () => {
              draft.cards.splice(draft.cards.indexOf(c), 1);
              paint();
              ctx.changed();
              ctx.say(`${c.word} removed.`);
            },
            { small: true },
          ),
        );
      }),
    );
    empty.hidden = draft.cards.length > 0;
  };
  const addId = nextId("st-rx-add");
  const add = h("input", { id: addId, type: "text", class: "st-ll-input", autocomplete: "off" });
  const addWord = () => {
    const w = add.value.trim();
    if (!w) return;
    if (draft.cards.some((c) => c.word.toLowerCase() === w.toLowerCase())) {
      ctx.say(`${w} is already a card.`);
      return;
    }
    const made = buildVocabCards(draft.source, {
      grade: ctx.grade,
      subject: ctx.subject,
      collections: ctx.collections,
      extraTerms: [w],
      limit: 1,
    }).cards[0];
    made.id = nextId("card-x");
    draft.cards.push(made);
    add.value = "";
    paint();
    ctx.changed();
    ctx.say(`${w} added.`);
  };
  add.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWord();
    }
  });
  paint();
  return {
    el: h(
      "div",
      {},
      empty,
      list,
      h(
        "div",
        { class: "st-lt-add" },
        h("label", { for: addId }, "Add a word to teach"),
        h("div", { class: "st-ll-row" }, add, btn("Add word", addWord)),
      ),
      h(
        "p",
        { class: "st-ll-muted" },
        "Only cards you check, with a meaning written, go on the printed cards.",
      ),
    ),
    problems: () =>
      confirmedCards(draft).length ? [] : ["Check at least one card and write its meaning."],
  };
}

function evidence(draft, ctx) {
  let n = draft.claims.length;
  const rows = h("ol", { class: "st-lt-evidence" });
  const claimLabel = (c, i) => `Claim ${i + 1}: ${c.text.slice(0, 50) || "(empty)"}`;
  const paintRows = () => {
    const claims = draft.claims.filter((c) => c.text.trim());
    for (const e of draft.evidence)
      if (e.supports && !claims.some((c) => c.id === e.supports)) e.supports = null;
    rows.replaceChildren(
      ...draft.evidence.map((e) => {
        const use = h("input", { type: "checkbox" });
        use.checked = e.use;
        const sel = h("select", {
          class: "st-ll-input",
          "aria-label": `Which claim does this sentence support? ${e.text.slice(0, 40)}`,
        });
        sel.append(h("option", { value: "" }, "Choose a claim"));
        claims.forEach((c) => {
          const o = h("option", { value: c.id }, claimLabel(c, draft.claims.indexOf(c)));
          if (e.supports === c.id) o.selected = true;
          sel.append(o);
        });
        sel.hidden = !e.use;
        use.addEventListener("change", () => {
          e.use = use.checked;
          if (!e.use) e.supports = null;
          sel.hidden = !e.use;
          ctx.changed();
        });
        sel.addEventListener("change", () => {
          e.supports = sel.value || null;
          ctx.changed();
        });
        return h(
          "li",
          { class: "st-lt-evrow" },
          h("label", { class: "st-ll-check" }, use, h("span", {}, e.text)),
          sel,
        );
      }),
    );
  };
  const question = textInput(draft.question, (v) => {
    draft.question = v;
    ctx.changed();
  });
  const claims = listEditor({
    items: draft.claims,
    label: "Claims",
    newItem: () => ({ id: `c${(n += 1)}`, text: "" }),
    onChange: (items) => {
      draft.claims = items.map((i) => ({ id: i.id, text: i.text }));
      paintRows();
      ctx.changed();
    },
  });
  paintRows();
  return {
    el: h(
      "div",
      {},
      field(
        "Question to investigate",
        question,
        "Optional. It becomes the title of the printed investigation.",
      ),
      h("h3", {}, "Claims students could make"),
      draft.claims.length
        ? null
        : h(
            "p",
            { class: "st-ll-muted" },
            "Add one or more claims below, written in your own words.",
          ),
      claims,
      h("h3", {}, "Sentences from your text"),
      h(
        "p",
        { class: "st-ll-muted" },
        "Tick the sentences that count as evidence, then choose the claim each one supports. The sentences are exactly as you typed them.",
      ),
      rows,
    ),
    problems: () => evidenceProblems(draft),
  };
}

function exitTicket(draft, ctx) {
  const tiers = Object.keys(draft.frames).map((t) =>
    field(
      `Sentence frame, ${TIER_LABEL[t] || t}`,
      textInput(draft.frames[t], (v) => {
        draft.frames[t] = v;
        ctx.changed();
      }),
    ),
  );
  return {
    el: h(
      "div",
      {},
      field(
        "Task for students",
        textarea(draft.prompt, (v) => ((draft.prompt = v), ctx.changed()), 3),
        "Made from your objective. Change it so it says what you want students to do.",
      ),
      field(
        "Your question (optional)",
        textarea(draft.itemText, (v) => ((draft.itemText = v), ctx.changed()), 3),
        "Write the content question yourself. The studio does not write it for you.",
      ),
      h("h3", {}, `Success criteria (${draft.functionLabel.toLowerCase()})`),
      listEditor({
        items: draft.criteria.map((t, i) => ({ id: `k${i}`, text: t })),
        label: "Criteria",
        newItem: () => ({ id: nextId("k"), text: "" }),
        onChange: (items) => ((draft.criteria = items.map((i) => i.text)), ctx.changed()),
      }),
      h("h3", {}, "Sentence frames by support level"),
      h(
        "p",
        { class: "st-ll-muted" },
        "The frames change the language support. The task stays the same at every level.",
      ),
      ...tiers,
    ),
    problems: () => (draft.prompt.trim() ? [] : ["Write the task for students."]),
  };
}

function discussion(draft, ctx) {
  return {
    el: h(
      "div",
      {},
      field(
        "Discussion question",
        textarea(draft.question, (v) => ((draft.question = v), ctx.changed()), 3),
      ),
      h("p", { class: "st-ll-muted" }, `Pattern: ${draft.structure}`),
      h("h3", {}, "Partner roles"),
      listEditor({
        items: draft.roles.map((t, i) => ({ id: `r${i}`, text: t })),
        label: "Roles",
        newItem: () => ({ id: nextId("r"), text: "" }),
        onChange: (items) => ((draft.roles = items.map((i) => i.text)), ctx.changed()),
      }),
      field(
        "Listen for these words (separate with commas)",
        textInput(
          draft.listenFor.join(", "),
          (v) => (
            (draft.listenFor = v
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)),
            ctx.changed()
          ),
        ),
      ),
      h("h3", {}, "Sentence frames by support level"),
      framesBlock(draft.frames),
      h("h3", {}, "Your text"),
      h("pre", { class: "st-lt-source" }, draft.source),
    ),
    problems: () => (draft.question.trim() ? [] : ["Write the discussion question."]),
  };
}

function languageObjective(draft, ctx) {
  return {
    el: h(
      "div",
      {},
      h("p", {}, "Your objective: ", quote(draft.source)),
      h("h3", {}, "Language objective ideas"),
      listEditor({
        items: draft.suggestions.map((t, i) => ({ id: `o${i}`, text: t })),
        label: "Ideas",
        newItem: () => ({ id: nextId("o"), text: "" }),
        onChange: (items) => ((draft.suggestions = items.map((i) => i.text)), ctx.changed()),
      }),
      h("p", { class: "st-ll-muted" }, `${draft.note} Closest Key Language Use: ${draft.klu}.`),
    ),
    problems: () => (draft.suggestions.some((s) => s.trim()) ? [] : ["Keep at least one idea."]),
  };
}

const EDITORS = {
  "vocab-cards": vocabCards,
  evidence,
  "exit-ticket": exitTicket,
  discussion,
  "language-objective": languageObjective,
};

/** editorFor(draft, ctx) -> { el, problems() }. ctx: { changed, say, collections, grade, subject }. */
export const editorFor = (draft, ctx) => EDITORS[draft.type](draft, ctx);
