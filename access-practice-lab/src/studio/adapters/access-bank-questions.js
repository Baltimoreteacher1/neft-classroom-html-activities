// ACCESS Practice Lab bank items -> lp-activity/1 question blocks. One bank item = one question, never split or dropped.
// Mapping (chosen so core/check.js can grade the key exactly as the bank does):
//   multiple-choice, listening-response -> choice          multiple-select -> multi
//   ordering -> order (items listed in the key order)      drag-drop -> sort (zones = groups, tokens = items)
//   matching -> match (one-to-one); sort when the bank has extra right-hand choices (so none are lost)
//   dropdown -> choice (one blank) or blank (several blanks, the choices are listed in the question)
//   speaking-response, constructed-response -> short (open response, never auto-graded)

import { shorten, text } from "./util.js";

const EXPLAIN_MAX = 800;
const LABEL_MAX = 80;
const FRAME_MAX = 300;

const optionsOf = (item) => item.options.map((o) => ({ id: o.id, text: text(o.text) }));
const textOf = (list, id) => list.find((o) => o.id === id)?.text ?? "";

function choice(item) {
  return { format: "choice", options: optionsOf(item), answer: item.answer };
}
function multi(item) {
  return { format: "multi", options: optionsOf(item), answers: [...item.answer] };
}
function order(item) {
  const { items, answer } = item.ordering;
  return { format: "order", items: answer.map((id) => ({ id, text: text(textOf(items, id)) })) };
}
function dragDrop(item) {
  const { tokens, zones, answer } = item.dragDrop;
  return {
    format: "sort",
    categories: zones.map((z) => ({ id: z.id, label: text(z.label) })),
    items: tokens.map((tk) => ({ id: tk.id, text: text(tk.text), category: answer[tk.id] })),
  };
}

function matching(item, flags) {
  const { left, right, answer } = item.matching;
  const oneToOne =
    right.length === left.length && new Set(Object.values(answer)).size === left.length;
  if (oneToOne)
    return {
      format: "match",
      pairs: left.map((l) => ({
        id: l.id,
        left: text(l.text),
        right: text(textOf(right, answer[l.id])),
      })),
    };
  if (right.every((r) => text(r.text).length <= LABEL_MAX))
    return {
      format: "sort",
      categories: right.map((r) => ({ id: r.id, label: text(r.text) })),
      items: left.map((l) => ({ id: l.id, text: text(l.text), category: answer[l.id] })),
    };
  // Long right-hand choices cannot be group labels: keep the pairs, and say which extras stay in the note.
  flags.add("match-extra-dropped");
  const used = new Set(Object.values(answer));
  return {
    format: "match",
    pairs: left.map((l) => ({
      id: l.id,
      left: text(l.text),
      right: text(textOf(right, answer[l.id])),
    })),
    extra: right.filter((r) => !used.has(r.id)).map((r) => text(r.text)),
  };
}

const blankAnswer = (v, flags) => {
  const a = text(v);
  if (!/[|\]]/.test(a)) return a;
  flags.add("dropdown-sanitized");
  return a.replace(/\s*\|\s*/g, " / ").replace(/\]/g, ")");
};

function dropdown(item, flags) {
  const { template, blanks } = item.dropdown;
  const ids = Object.keys(blanks).sort((a, b) => Number(a) - Number(b));
  if (ids.length === 1) {
    const b = blanks[ids[0]];
    const options = b.options.map((o, i) => ({ id: `o${i + 1}`, text: text(o) }));
    return {
      format: "choice",
      options,
      answer: options.find((o) => o.text === text(b.answer))?.id ?? "",
      lead: template.replace(/\{\d+\}/g, "_____"),
    };
  }
  const keyed = template.replace(
    /\{(\d+)\}/g,
    (_, n) => `[[${blankAnswer(blanks[n].answer, flags)}]]`,
  );
  const same = ids.every(
    (i) => blanks[i].options.join("\u0001") === blanks[ids[0]].options.join("\u0001"),
  );
  const lead = same
    ? `Choose from: ${blanks[ids[0]].options.join(", ")}.`
    : ids.map((i) => `Blank ${i}: ${blanks[i].options.join(", ")}.`).join("\n");
  return { format: "blank", text: keyed, bank: false, lead };
}

function speaking(item) {
  const { checklist, exemplar } = item.speaking;
  return {
    format: "short",
    kind: "explain",
    rubric: checklist.map(text),
    sample: `What a strong response shows:\n${exemplar.map(text).join("\n")}`,
  };
}
function writing(item) {
  const { checklist, exemplar, minWords, maxWords } = item.constructed;
  return {
    format: "short",
    kind: "write",
    minWords,
    rubric: checklist.map(text),
    sample: `What a strong response shows:\n${exemplar.map(text).join("\n")}`,
    tail: `Write ${minWords} to ${maxWords} words.`,
  };
}

const BUILD = {
  "multiple-choice": choice,
  "listening-response": choice,
  "multiple-select": multi,
  ordering: order,
  matching,
  dropdown,
  "drag-drop": dragDrop,
  "speaking-response": speaking,
  "constructed-response": writing,
};

export const BANK_ITEM_TYPES = Object.freeze(Object.keys(BUILD));

/** Why-not lines for the wrong choices of a choice/multi item, quoted so a shuffled order cannot change their meaning. */
function whyNot(item) {
  if (!item.distractors || !item.options) return "";
  const lines = item.options
    .filter((o) => item.distractors[o.id])
    .map((o) => `"${text(o.text)}": ${text(item.distractors[o.id])}`);
  return lines.length ? `Why the other choices are not correct:\n${lines.join("\n")}` : "";
}

const trimSentence = (s) => s.replace(/\s+$/, "");

/**
 * @returns {{question: object, support: string[], misconceptions: string, flags: Set<string>}}
 * `support` is teacher-only text for the question's note block (mentor example, long wrong-answer reasons, extras).
 */
export function questionFor(item, number) {
  const build = BUILD[item.type];
  if (!build) throw new Error(`unsupported-item-type:${item.type}`);
  const flags = new Set();
  const core = build(item, flags);
  const { lead, tail, extra, ...fields } = core;
  const support = [];
  const base = text(item.explanation);
  const reasons = whyNot(item);
  const full = reasons ? (base ? `${base}\n\n${reasons}` : reasons) : base;
  let explanation = full;
  if (full.length > EXPLAIN_MAX) {
    explanation = base.slice(0, EXPLAIN_MAX);
    support.push(`Question ${number}, wrong-answer reasons from the bank:\n${reasons}`);
    if (base.length > EXPLAIN_MAX) support.push(`Question ${number}, full explanation:\n${base}`);
  }
  const stem = text(item.stem);
  const prompt = [stem, lead, tail].filter(Boolean).join("\n\n");
  if (item.support?.model)
    support.unshift(
      `Question ${number}, mentor example (not shown to students): ${text(item.support.model)}`,
    );
  if (extra?.length)
    support.push(
      `Question ${number}, extra right-hand choices in the bank that this copy does not show: ${extra.join(" | ")}`,
    );
  const misc = Object.entries(item.meta?.misconceptions || {}).map(([id, why]) =>
    item.options ? `"${textOf(item.options, id)}": ${why}` : `${id}: ${why}`,
  );
  if (misc.length) support.push(`Question ${number}, likely misconceptions: ${misc.join("; ")}`);
  const frameFull = text(item.support?.frame);
  const frame = shorten(frameFull, FRAME_MAX);
  if (frame !== frameFull) support.push(`Question ${number}, full sentence frame (too long for the frame field): ${frameFull}`);
  const skill = text(item.meta?.functions?.[0]).slice(0, 80);
  return {
    question: {
      type: "question",
      id: item.id,
      prompt,
      hint: text(item.support?.clue),
      frame,
      explanation: trimSentence(explanation),
      skill,
      ...fields,
    },
    support,
    misconceptions: Object.values(item.meta?.misconceptions || {})
      .map(text)
      .join("; "),
    flags,
  };
}
