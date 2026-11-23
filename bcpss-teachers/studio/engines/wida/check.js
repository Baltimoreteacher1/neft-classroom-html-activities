// Pure scoring for objective WIDA practice tasks. No DOM. Results are INSTRUCTIONAL INDICATORS only:
// "3 of 4 correct on this task", never a level, band or WIDA score.

export const TYPES_BY_DOMAIN = {
  Listening: ["listen-select", "listen-sequence", "listen-label", "listen-notes"],
  Speaking: ["speak-describe", "speak-explain", "speak-compare", "speak-argue"],
  Reading: ["read-select", "read-evidence", "read-sort", "read-multitext"],
  Writing: ["write-expand", "write-explain", "write-paragraph", "write-revise"],
};
export const ALL_TYPES = Object.values(TYPES_BY_DOMAIN).flat();
export const DOMAIN_OF_TYPE = Object.fromEntries(
  Object.entries(TYPES_BY_DOMAIN).flatMap(([d, ts]) => ts.map((t) => [t, d])),
);
export const OBJECTIVE_TYPES = new Set([...TYPES_BY_DOMAIN.Listening, ...TYPES_BY_DOMAIN.Reading]);

export const DISCLAIMER = "Original WIDA-aligned practice. Not an official WIDA or ACCESS score or prediction.";

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Whole-word / whole-phrase match of any accepted answer inside a typed note. */
export function noteMatches(text, accept = []) {
  const t = ` ${norm(text)} `;
  return accept.some((a) => {
    const k = norm(a);
    return k && t.includes(` ${k} `);
  });
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const unscored = { scored: false, answered: false, correct: 0, total: 0, ok: false, detail: [] };

/** Task has anything to check automatically? (listen-notes without any `accept` row is unscored.) */
export function isScored(task) {
  if (!OBJECTIVE_TYPES.has(task.type)) return false;
  if (task.type === "listen-notes") return (task.organizer?.rows || []).some((r) => r.accept?.length);
  return true;
}

/** True when the response has been touched enough to count as an answer. */
export function isAnswered(task, r = {}) {
  switch (task.type) {
    case "listen-select":
    case "read-select":
      return task.multi ? (r.picks || []).length > 0 : !!r.pick;
    case "listen-sequence":
      return Array.isArray(r.order) && r.order.length === task.items.length && !!r.moved;
    case "listen-label":
      return task.slots.some((s) => r.map?.[s.id]);
    case "listen-notes":
      return (task.organizer?.rows || []).some((row) => (r.rows?.[row.id] || "").trim());
    case "read-evidence":
      return !!r.pick || (r.evidence || []).length > 0;
    case "read-sort":
      return task.items.some((i) => r.placed?.[i.id]);
    case "read-multitext":
      return task.statements.some((s) => r.map?.[s.id]);
    default:
      return false;
  }
}

/** scoreTask(task, response) -> {scored, answered, correct, total, ok, detail:[{id, ok}]} */
export function scoreTask(task, r = {}) {
  if (!isScored(task)) return { ...unscored, answered: isAnswered(task, r) };
  const answered = isAnswered(task, r);
  let detail = [];
  switch (task.type) {
    case "listen-select":
    case "read-select": {
      if (task.multi) {
        const picks = r.picks || [];
        const right = picks.filter((p) => task.answers.includes(p)).length;
        const wrong = picks.length - right;
        const correct = Math.max(0, right - wrong);
        detail = task.answers.map((id) => ({ id, ok: picks.includes(id) }));
        return { scored: true, answered, correct, total: task.answers.length, ok: sameSet(picks, task.answers), detail };
      }
      const ok = r.pick === task.answer;
      return { scored: true, answered, correct: ok ? 1 : 0, total: 1, ok, detail: [{ id: task.id, ok }] };
    }
    case "listen-sequence": {
      const order = r.order || [];
      detail = task.answer.map((id, i) => ({ id, ok: order[i] === id }));
      const correct = detail.filter((d) => d.ok).length;
      return { scored: true, answered, correct, total: task.answer.length, ok: correct === task.answer.length, detail };
    }
    case "listen-label": {
      detail = task.slots.map((s) => ({ id: s.id, ok: r.map?.[s.id] === s.answer }));
      const correct = detail.filter((d) => d.ok).length;
      return { scored: true, answered, correct, total: task.slots.length, ok: correct === task.slots.length, detail };
    }
    case "listen-notes": {
      const rows = task.organizer.rows.filter((row) => row.accept?.length);
      detail = rows.map((row) => ({ id: row.id, ok: noteMatches(r.rows?.[row.id], row.accept) }));
      const correct = detail.filter((d) => d.ok).length;
      return { scored: true, answered, correct, total: rows.length, ok: correct === rows.length, detail };
    }
    case "read-evidence": {
      const claimOk = r.pick === task.answer;
      const evOk = sameSet(r.evidence || [], task.evidence.answers);
      detail = [
        { id: "answer", ok: claimOk },
        { id: "evidence", ok: evOk },
      ];
      const correct = detail.filter((d) => d.ok).length;
      return { scored: true, answered, correct, total: 2, ok: correct === 2, detail };
    }
    case "read-sort": {
      detail = task.items.map((i) => ({ id: i.id, ok: r.placed?.[i.id] === i.category }));
      const correct = detail.filter((d) => d.ok).length;
      return { scored: true, answered, correct, total: task.items.length, ok: correct === task.items.length, detail };
    }
    case "read-multitext": {
      detail = task.statements.map((s) => ({ id: s.id, ok: r.map?.[s.id] === s.answer }));
      const correct = detail.filter((d) => d.ok).length;
      return { scored: true, answered, correct, total: task.statements.length, ok: correct === task.statements.length, detail };
    }
    default:
      return { ...unscored, answered };
  }
}

/** "3 of 4 correct on this task" (null for unscored tasks). The ONLY form in which objective results are reported. */
export function indicatorLine(score) {
  if (!score?.scored || !score.answered) return null;
  return `${score.correct} of ${score.total} correct on this task`;
}

/** Deterministic scramble that never equals the correct order. */
export function scrambleOrder(ids, seedText) {
  const n = ids.length;
  let seed = [...String(seedText)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) || 1;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let attempt = 0; attempt < 20; attempt++) {
    const a = [...ids];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.some((x, i) => x !== ids[i])) return a;
  }
  return [...ids.slice(1), ids[0]];
}

/** Word-level diff for the "compare drafts" view: marks words in `b` that are not in `a`. */
export function diffWords(a, b) {
  const aw = new Set(String(a).toLowerCase().split(/\s+/).filter(Boolean));
  return String(b)
    .split(/(\s+)/)
    .map((tok) => ({ text: tok, added: /\S/.test(tok) && !aw.has(tok.toLowerCase()) }));
}

export const wordCount = (s) => (String(s || "").trim().match(/\S+/g) || []).length;

const textOf = (list, id) => list?.find((x) => x.id === id)?.text ?? id;

/** Plain-language correct answer for results and the teacher view (objective tasks only). */
export function answerText(task) {
  switch (task.type) {
    case "listen-select":
    case "read-select":
      return task.multi ? task.answers.map((a) => textOf(task.options, a)).join(" / ") : textOf(task.options, task.answer);
    case "listen-sequence":
      return task.answer.map((id, i) => `${i + 1}. ${textOf(task.items, id)}`).join(" ");
    case "listen-label":
      return task.slots.map((s) => `${s.marker} = ${textOf(task.bank, s.answer)}`).join("; ");
    case "listen-notes":
      return task.organizer.rows.filter((r) => r.accept?.length).map((r) => `${r.label}: ${r.accept[0]}`).join("; ");
    case "read-evidence":
      return `${textOf(task.options, task.answer)} Evidence: ${task.evidence.answers.map((a) => textOf(task.evidence.choices, a)).join(" / ")}`;
    case "read-sort":
      return task.items.map((i) => `${i.text} = ${task.categories.find((c) => c.id === i.category)?.label || i.category}`).join("; ");
    case "read-multitext":
      return task.statements.map((s) => `${s.text} = ${s.answer === "both" ? "both texts" : `Text ${s.answer}`}`).join("; ");
    default:
      return "";
  }
}
