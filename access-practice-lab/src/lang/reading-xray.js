// Reading X-Ray: authored lenses over Reading Room passages. Pure logic, no DOM, no storage.
//
// Data lives in content/reading-room/xray.json, one entry per lesson, pinned to the lesson revision. Every annotation
// points at text by sentence id ("p2:1", the same ids splitSentences gives the evidence picker) plus an exact phrase
// (`t`, case-sensitive, whole words, `n`th occurrence). Nothing is guessed at runtime: if an anchor does not resolve,
// validateXray reports it and the lens leaves it out.
//
// Lenses: pronoun (reference word -> earlier noun phrase), connections (signal word + the two ideas it links),
// evidence (sentences that support a question's answer, shown only after the learner has worked the question) and
// structure (one role and a bilingual gist per paragraph). Authoring rules are enforced by tools/lp-reading-xray.test.mjs.
import { splitSentences } from "../reading-room-check.js";

export const LENSES = ["pronoun", "connection", "evidence", "structure"];

/** Reference words the pronoun lens may annotate (lower case). "there" is a place reference word. */
export const PRONOUNS = new Set(
  "he him his she her hers it its they them their theirs this these that those we us our i me my you your there".split(
    " ",
  ),
);

/** Connection kinds: labels for the two linked ideas (from, to) and the sentence that explains the link. */
export const KINDS = {
  "cause-effect": {
    label: ["Cause and effect", "Causa y efecto"],
    from: ["Cause", "Causa"],
    to: ["Effect", "Efecto"],
    arrow: true,
    line: (s, f, t) => [
      `“${s}” shows cause and effect. Cause: “${f}”. Effect: “${t}”.`,
      `“${s}” muestra causa y efecto. Causa: “${f}”. Efecto: “${t}”.`,
    ],
  },
  contrast: {
    label: ["Contrast", "Contraste"],
    from: ["One side", "Un lado"],
    to: ["Other side", "Otro lado"],
    arrow: false,
    line: (s, f, t) => [
      `“${s}” shows a contrast between “${f}” and “${t}”.`,
      `“${s}” muestra un contraste entre “${f}” y “${t}”.`,
    ],
  },
  sequence: {
    label: ["Time order", "Orden en el tiempo"],
    from: ["First", "Primero"],
    to: ["Then", "Después"],
    arrow: true,
    line: (s, f, t) => [
      `“${s}” shows time order. First: “${f}”. Then: “${t}”.`,
      `“${s}” muestra el orden en el tiempo. Primero: “${f}”. Después: “${t}”.`,
    ],
  },
  example: {
    label: ["Example", "Ejemplo"],
    from: ["Idea", "Idea"],
    to: ["Example", "Ejemplo"],
    arrow: true,
    line: (s, f, t) => [
      `“${s}” introduces an example. Idea: “${f}”. Example: “${t}”.`,
      `“${s}” presenta un ejemplo. Idea: “${f}”. Ejemplo: “${t}”.`,
    ],
  },
};

/** Paragraph roles for the structure lens. */
export const ROLES = {
  heading: ["Heading", "Título"],
  context: ["Context", "Contexto"],
  beginning: ["Beginning", "Comienzo"],
  middle: ["Middle", "Desarrollo"],
  end: ["End", "Final"],
  problem: ["Problem", "Problema"],
  solution: ["Solution", "Solución"],
  claim: ["Claim", "Afirmación"],
  reason: ["Reason", "Razón"],
  evidence: ["Evidence", "Evidencia"],
  example: ["Example", "Ejemplo"],
  hypothesis: ["Guess to test", "Suposición para comprobar"],
  description: ["Description", "Descripción"],
  comparison: ["Comparison", "Comparación"],
  process: ["Process", "Proceso"],
  limit: ["Limits", "Límites"],
  conclusion: ["Conclusion", "Conclusión"],
  "next-step": ["Next step", "Paso siguiente"],
};

/** Question types whose evidence can open: closed types after a supported answer, open responses after a self-check. */
const CLOSED = new Set([
  "choice",
  "connector",
  "multi",
  "hotText",
  "evidence",
  "cloze",
  "order",
  "sort",
]);
const OPEN = new Set(["short"]);
const ID = /^[a-z0-9-]+$/;

// ---------- sentences and anchors ----------

/** Every sentence of a lesson keyed by id ("p2:1"), with its paragraph index and reading order. */
export function sentenceIndex(lesson) {
  const map = new Map();
  let order = 0;
  (lesson.paragraphs || []).forEach((p, pIndex) => {
    splitSentences(p.text).forEach((text, si) => {
      map.set(`${p.id}:${si}`, {
        key: `${p.id}:${si}`,
        pid: p.id,
        pIndex,
        si,
        text,
        order: order++,
      });
    });
  });
  return map;
}

const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Character range of the nth whole-word, case-sensitive occurrence of `t` in `text`, or null. */
export function findPhrase(text, t, n = 1) {
  if (!t) return null;
  const re = new RegExp(`(?<![A-Za-z0-9])${escRe(t)}(?![A-Za-z0-9])`, "g");
  let m;
  let seen = 0;
  while ((m = re.exec(text))) {
    if (++seen === n) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}

/** An anchor {s, t?, n?} resolved against the lesson, or null. No `t` means the whole sentence. */
export function resolveAnchor(index, anchor) {
  const sentence = anchor && index.get(anchor.s);
  if (!sentence) return null;
  const range = anchor.t
    ? findPhrase(sentence.text, anchor.t, anchor.n || 1)
    : { start: 0, end: sentence.text.length };
  if (!range) return null;
  return { ...sentence, ...range, phrase: sentence.text.slice(range.start, range.end) };
}

const before = (a, b) => a.order < b.order || (a.order === b.order && a.end <= b.start);
const sameRange = (a, b) => a.key === b.key && a.start === b.start && a.end === b.end;

// ---------- evidence gate ----------

/** May the learner see the evidence for this question yet? Never before an attempt; never on an unsupported miss. */
export function evidenceUnlocked(activity, ans) {
  if (!activity || !ans) return false;
  if (CLOSED.has(activity.type)) return Boolean(ans.checked && (ans.correct || ans.revealed));
  if (OPEN.has(activity.type)) return Boolean(ans.selfChecked && String(ans.text || "").trim());
  return false;
}

/** Paragraphs the lesson's own key says hold this question's evidence (empty when it names none). */
export function keyParagraphs(activity) {
  if (activity.type === "evidence") return activity.answerIds || [];
  return activity.evidenceIds || [];
}

// ---------- validation ----------

/** Every problem with one lesson's X-Ray entry. Empty array = valid. */
export function validateXray(lesson, entry) {
  const errors = [];
  const where = (s) => `${lesson.id}: ${s}`;
  if (!entry) return [where("no X-Ray entry")];
  if (entry.revision !== lesson.revision)
    errors.push(where(`entry is for revision ${entry.revision}, lesson is ${lesson.revision}`));
  const index = sentenceIndex(lesson);
  const ids = new Set();
  const useId = (id, kind) => {
    if (!ID.test(String(id || "")))
      errors.push(where(`${kind} id "${id}" must be lower-case letters, digits, dashes`));
    else if (ids.has(id)) errors.push(where(`duplicate id "${id}"`));
    ids.add(id);
  };
  const ranges = { pronoun: [], connection: [] };
  const anchor = (a, label, lens, button) => {
    const r = resolveAnchor(index, a);
    if (!r) errors.push(where(`${label}: anchor ${JSON.stringify(a)} does not exist in the text`));
    else if (lens) ranges[lens].push({ ...r, button, label });
    return r;
  };

  for (const link of entry.pronouns || []) {
    useId(link.id, "pronoun");
    const at = anchor(link.at, `pronoun ${link.id}`, "pronoun", true);
    const ref = anchor(link.ref, `pronoun ${link.id} referent`, "pronoun", false);
    if (!at || !ref) continue;
    if (!PRONOUNS.has(at.phrase.toLowerCase()))
      errors.push(where(`pronoun ${link.id}: "${at.phrase}" is not a reference word`));
    if (!before(ref, at))
      errors.push(
        where(`pronoun ${link.id}: referent "${ref.phrase}" must come before "${at.phrase}"`),
      );
    if (ref.pIndex < at.pIndex - 1)
      errors.push(
        where(`pronoun ${link.id}: referent must be in the same or the previous paragraph`),
      );
    if (!ref.phrase.split(/\s+/).some((w) => !PRONOUNS.has(w.toLowerCase().replace(/[^a-z]/g, ""))))
      errors.push(where(`pronoun ${link.id}: referent "${ref.phrase}" is not a noun phrase`));
  }

  for (const c of entry.connections || []) {
    useId(c.id, "connection");
    if (!KINDS[c.kind]) errors.push(where(`connection ${c.id}: unknown kind "${c.kind}"`));
    const sig = anchor(c.signal, `connection ${c.id} signal`, "connection", true);
    const from = anchor(c.from, `connection ${c.id} from`, "connection", false);
    const to = anchor(c.to, `connection ${c.id} to`, "connection", false);
    if (!sig || !from || !to) continue;
    if (sameRange(from, to))
      errors.push(where(`connection ${c.id}: the two ideas are the same text`));
    const ps = [sig.pIndex, from.pIndex, to.pIndex];
    if (Math.max(...ps) - Math.min(...ps) > 1)
      errors.push(
        where(`connection ${c.id}: signal and ideas must sit in one paragraph or two neighbours`),
      );
  }

  // Inside one lens, marks in a sentence must be disjoint or nested, and nothing may sit inside a button.
  for (const [lens, list] of Object.entries(ranges)) {
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.key !== b.key || a.end <= b.start || b.end <= a.start) continue;
        if (sameRange(a, b)) {
          if (a.button || b.button)
            errors.push(where(`${lens}: ${a.label} and ${b.label} cover the same words`));
          continue;
        }
        const aInB = a.start >= b.start && a.end <= b.end;
        const bInA = b.start >= a.start && b.end <= a.end;
        if (!aInB && !bInA)
          errors.push(where(`${lens}: ${a.label} and ${b.label} overlap without nesting`));
        else if ((aInB && b.button) || (bInA && a.button))
          errors.push(where(`${lens}: ${aInB ? a.label : b.label} sits inside a tappable word`));
      }
  }

  const activities = new Map((lesson.activities || []).map((a) => [a.id, a]));
  for (const [aid, keys] of Object.entries(entry.evidence || {})) {
    const a = activities.get(aid);
    if (!a) {
      errors.push(where(`evidence for unknown question "${aid}"`));
      continue;
    }
    if (!CLOSED.has(a.type) && !OPEN.has(a.type))
      errors.push(
        where(`evidence for "${aid}": question type ${a.type} has no attempt to wait for`),
      );
    if (!Array.isArray(keys) || !keys.length) errors.push(where(`evidence for "${aid}" is empty`));
    if (new Set(keys).size !== keys.length)
      errors.push(where(`evidence for "${aid}" repeats a sentence`));
    const allowed = keyParagraphs(a);
    for (const k of keys || []) {
      const s = index.get(k);
      if (!s) errors.push(where(`evidence for "${aid}": sentence ${k} does not exist`));
      else if (allowed.length && !allowed.includes(s.pid))
        errors.push(
          where(
            `evidence for "${aid}": ${k} is outside the paragraphs the answer key names (${allowed.join(", ")})`,
          ),
        );
    }
  }

  const structure = entry.structure || [];
  const pids = (lesson.paragraphs || []).map((p) => p.id);
  if (structure.length && structure.map((x) => x.p).join() !== pids.join())
    errors.push(where(`structure must list every paragraph once, in order (${pids.join(", ")})`));
  for (const row of structure) {
    if (!ROLES[row.role]) errors.push(where(`structure ${row.p}: unknown role "${row.role}"`));
    const en = String(row.gist?.en || "").trim();
    const es = String(row.gist?.es || "").trim();
    if (!en || !es) errors.push(where(`structure ${row.p}: gist needs English and Spanish`));
    else if (en === es)
      errors.push(where(`structure ${row.p}: Spanish gist is a copy of the English`));
  }
  return errors;
}

// ---------- what each lens shows ----------

/** Which lenses have data for this entry (evidence counts even while every question is still locked). */
export function availableLenses(entry) {
  if (!entry) return [];
  return LENSES.filter((lens) =>
    lens === "pronoun"
      ? entry.pronouns?.length
      : lens === "connection"
        ? entry.connections?.length
        : lens === "evidence"
          ? Object.keys(entry.evidence || {}).length
          : entry.structure?.length,
  );
}

/** Resolved links for a lens, in reading order, each with its bilingual explanation. Unresolvable links are dropped. */
export function lensLinks(lesson, entry, lens) {
  const index = sentenceIndex(lesson);
  if (lens === "pronoun")
    return (entry.pronouns || [])
      .map((link) => {
        const at = resolveAnchor(index, link.at);
        const ref = resolveAnchor(index, link.ref);
        if (!at || !ref) return null;
        return {
          id: link.id,
          at,
          ref,
          line: [
            `“${at.phrase}” refers to “${ref.phrase}”.`,
            `“${at.phrase}” se refiere a “${ref.phrase}”.`,
          ],
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.at.order - b.at.order || a.at.start - b.at.start);
  if (lens === "connection")
    return (entry.connections || [])
      .map((c) => {
        const kind = KINDS[c.kind];
        const signal = resolveAnchor(index, c.signal);
        const from = resolveAnchor(index, c.from);
        const to = resolveAnchor(index, c.to);
        if (!kind || !signal || !from || !to) return null;
        return {
          id: c.id,
          kind: c.kind,
          signal,
          from,
          to,
          line: kind.line(signal.phrase, from.phrase, to.phrase),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.signal.order - b.signal.order || a.signal.start - b.signal.start);
  return [];
}

/** Evidence rows for every annotated question, in lesson order; sentences only for unlocked questions. */
export function evidenceRows(lesson, entry, answers = {}) {
  const index = sentenceIndex(lesson);
  return (lesson.activities || [])
    .filter((a) => entry.evidence?.[a.id])
    .map((a) => {
      const open = evidenceUnlocked(a, answers[a.id]);
      return {
        id: a.id,
        prompt: a.prompt,
        open,
        sentences: open ? entry.evidence[a.id].map((k) => index.get(k)).filter(Boolean) : [],
      };
    });
}

/**
 * Marks for one lens, grouped by sentence id. A mark is {start, end, tag, attrs}; identical ranges merge their ids.
 * Locked evidence never produces a mark, so the answer is not in the page before the learner has tried.
 */
export function lensMarks(lesson, entry, lens, answers = {}) {
  const marks = new Map();
  const add = (r, tag, name, id) => {
    const list = marks.get(r.key) || [];
    let m = list.find((x) => x.start === r.start && x.end === r.end && x.tag === tag);
    if (!m) {
      m = { start: r.start, end: r.end, tag, attrs: {} };
      list.push(m);
    }
    m.attrs[name] = [...(m.attrs[name] || []), id];
    marks.set(r.key, list);
  };
  if (lens === "pronoun")
    for (const link of lensLinks(lesson, entry, lens)) {
      add(link.at, "button", "data-rx-pron", link.id);
      add(link.ref, "span", "data-rx-ref", link.id);
    }
  if (lens === "connection")
    for (const c of lensLinks(lesson, entry, lens)) {
      add(c.signal, "button", "data-rx-sig", c.id);
      add(c.from, "span", "data-rx-from", c.id);
      add(c.to, "span", "data-rx-to", c.id);
    }
  if (lens === "evidence")
    for (const row of evidenceRows(lesson, entry, answers))
      for (const s of row.sentences)
        add({ key: s.key, start: 0, end: s.text.length }, "span", "data-rx-ev", row.id);
  return marks;
}

const escHtml = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Sentence text as HTML with nested marks. `describedBy` is the id of the hint every tappable word points at. */
export function renderSentence(text, marks = [], describedBy = "") {
  const sorted = [...marks].sort((a, b) => a.start - b.start || b.end - a.end);
  let i = 0;
  const walk = (from, to) => {
    let out = "";
    let at = from;
    while (i < sorted.length && sorted[i].start < to) {
      const m = sorted[i++];
      out += escHtml(text.slice(at, m.start));
      const attrs = Object.entries(m.attrs)
        .map(([k, v]) => ` ${k}="${escHtml(v.join(" "))}"`)
        .join("");
      const inner = walk(m.start, m.end);
      out +=
        m.tag === "button"
          ? `<button type="button" class="rx-anchor"${attrs} aria-expanded="false"${describedBy ? ` aria-describedby="${describedBy}"` : ""}>${inner}</button>`
          : `<span class="rx-span"${attrs}>${inner}</span>`;
      at = m.end;
    }
    return out + escHtml(text.slice(at, to));
  };
  return walk(0, text.length);
}
