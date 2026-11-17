// Language Choice Boards and Talk Table: shared rules. Pure data and functions, no DOM (Node tests import it).
//
//   Choice Boards (content/choice-boards.json): one 3×3 board per content band and WIDA Key Language Use. The domain
//   order of the nine squares is fixed (BOARD_DOMAINS) so every row, column and diagonal mixes skills. A learner
//   picks any three in a row; nothing is timed or scored.
//   Talk Table (content/talk-table.json): bilingual conversation cards per band and Key Language Use, for a family
//   table or a class opener. Home language first is welcome.
// Progress stays on this device: which squares are done, the learner's own notes, which cards were talked about.
import { CONTENT_BANDS } from "../bands.js";
import { KEY_LANGUAGE_USES } from "./klu.js";

export { KEY_LANGUAGE_USES };

export const BOARD_DOMAINS = Object.freeze([
  "Listening",
  "Reading",
  "Speaking",
  "Writing",
  "Create",
  "Listening",
  "Reading",
  "Speaking",
  "Writing",
]);

/** The eight ways to make three in a row, as square indexes 0-8. */
export const LINES = Object.freeze([
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]);

/** Each Key Language Use in words a child understands, with the lab icon and the domain color it borrows. */
export const KLU_KIDS = Object.freeze({
  Narrate: {
    slug: "narrate",
    name: ["Tell what happened", "Cuenta lo que pasó"],
    hint: [
      "Put events in order: first, next, last.",
      "Ordena los hechos: primero, después, al final.",
    ],
    icon: "road",
    tone: "speaking",
  },
  Inform: {
    slug: "inform",
    name: ["Share what you know", "Comparte lo que sabes"],
    hint: [
      "Say what it is, its parts, and how it compares.",
      "Di qué es, sus partes y cómo se compara.",
    ],
    icon: "library",
    tone: "reading",
  },
  Explain: {
    slug: "explain",
    name: ["Tell how and why", "Explica cómo y por qué"],
    hint: ["Give the steps, or the cause and the effect.", "Da los pasos, o la causa y el efecto."],
    icon: "bulb",
    tone: "listening",
  },
  Argue: {
    slug: "argue",
    name: ["Take a side", "Toma una postura"],
    hint: [
      "Say what you think, give reasons, answer the other side.",
      "Di lo que piensas, da razones y responde al otro lado.",
    ],
    icon: "conversation",
    tone: "writing",
  },
});

export const DOMAIN_KIDS = Object.freeze({
  Listening: { name: ["Listen", "Escucha"], icon: "listening", tone: "listening" },
  Reading: { name: ["Read", "Lee"], icon: "reading", tone: "reading" },
  Speaking: { name: ["Speak", "Habla"], icon: "speaking", tone: "speaking" },
  Writing: { name: ["Write", "Escribe"], icon: "writing", tone: "writing" },
  Create: { name: ["Create", "Crea"], icon: "sparkle", tone: "brand" },
});

/** "narrate" → "Narrate"; anything else → "". */
export const kluFromSlug = (slug) =>
  KEY_LANGUAGE_USES.find((k) => KLU_KIDS[k].slug === String(slug || "").toLowerCase()) || "";

const asIndexList = (list) =>
  [...new Set((Array.isArray(list) ? list : []).map(Number))]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < 9)
    .sort((a, b) => a - b);

/** Lines finished with these done squares, and whether the board is full. */
export function boardStatus(done) {
  const set = new Set(asIndexList(done));
  const lines = LINES.filter((line) => line.every((i) => set.has(i)));
  return { done: set.size, lines, bingo: lines.length > 0, full: set.size === 9 };
}

/** Squares that would finish a line right now: a gentle "one more for three in a row" hint. */
export function nearWins(done) {
  const set = new Set(asIndexList(done));
  const out = new Set();
  for (const line of LINES) {
    const open = line.filter((i) => !set.has(i));
    if (open.length === 1) out.add(open[0]);
  }
  return [...out].sort((a, b) => a - b);
}

// ── device progress ────────────────────────────────────────────────────────
export const CHOICE_KEY = "accessPracticeLab:v1:choiceBoards";
export const TALK_KEY = "accessPracticeLab:v1:talkTable";
const MAX_NOTE = 1200;

const boardKey = (band, klu) => `${band}:${klu}`;

/** Read the stored choice-board record defensively: { [band:klu]: { done: [i], notes: { [i]: text } } }. */
export function cleanChoice(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, val] of Object.entries(raw)) {
    const [band, klu] = key.split(":");
    if (
      !CONTENT_BANDS.includes(band) ||
      !KEY_LANGUAGE_USES.includes(klu) ||
      !val ||
      typeof val !== "object"
    )
      continue;
    const notes = {};
    for (const [i, text] of Object.entries(val.notes || {})) {
      const n = Number(i);
      if (Number.isInteger(n) && n >= 0 && n < 9 && typeof text === "string" && text.trim())
        notes[n] = text.slice(0, MAX_NOTE);
    }
    out[key] = { done: asIndexList(val.done), notes };
  }
  return out;
}

export const boardRecord = (all, band, klu) => all[boardKey(band, klu)] || { done: [], notes: {} };

/** A copy of `all` with square `i` marked done (or not). */
export function setSquareDone(all, band, klu, i, isDone) {
  const rec = boardRecord(all, band, klu);
  const done = new Set(rec.done);
  if (isDone) done.add(Number(i));
  else done.delete(Number(i));
  return { ...all, [boardKey(band, klu)]: { ...rec, done: asIndexList([...done]) } };
}

export function setSquareNote(all, band, klu, i, text) {
  const rec = boardRecord(all, band, klu);
  const notes = { ...rec.notes };
  const clean = String(text || "").slice(0, MAX_NOTE);
  if (clean.trim()) notes[Number(i)] = clean;
  else delete notes[Number(i)];
  return { ...all, [boardKey(band, klu)]: { ...rec, notes } };
}

/** Read the stored Talk Table record: { talked: { [cardId]: ISO date } }. */
export function cleanTalk(raw) {
  const talked = {};
  const src =
    raw && typeof raw === "object" && raw.talked && typeof raw.talked === "object"
      ? raw.talked
      : {};
  for (const [id, iso] of Object.entries(src)) {
    if (/^[a-z0-9-]{3,40}$/.test(id) && /^\d{4}-\d{2}-\d{2}$/.test(String(iso)))
      talked[id] = String(iso);
  }
  return { talked };
}

/** The cards of one band, optionally one Key Language Use, in a stable order, each tagged with its `klu`. */
export function deckFor(talk, band, klu = "") {
  const byKlu = talk?.bands?.[band] || {};
  const uses = klu && KEY_LANGUAGE_USES.includes(klu) ? [klu] : KEY_LANGUAGE_USES;
  // Interleave the uses so "All cards" alternates kinds of talk instead of eight stories in a row.
  const lists = uses.map((u) => (byKlu[u] || []).map((c) => ({ ...c, klu: u })));
  const out = [];
  for (let i = 0; lists.some((l) => i < l.length); i += 1)
    for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

const dayNumber = (iso) => Math.floor(Date.parse(`${iso}T12:00:00Z`) / 864e5) || 0;

/**
 * Tonight's card: the same card all day (so a family and a teacher see the same one), skipping cards already talked
 * about until the deck runs out. `skip` moves forward through the remaining cards.
 */
export function cardFor(deck, talked = {}, iso = "2026-01-01", skip = 0) {
  if (!deck.length) return null;
  const fresh = deck.filter((c) => !talked[c.id]);
  const pool = fresh.length ? fresh : deck;
  const start = dayNumber(iso) % pool.length;
  return pool[(start + Math.max(0, Number(skip) || 0)) % pool.length];
}

/** How many different days had a talk in the seven days ending `iso`. */
export function talkDaysThisWeek(talked = {}, iso = "2026-01-01") {
  const end = dayNumber(iso);
  return new Set(
    Object.values(talked).filter((d) => end - dayNumber(d) >= 0 && end - dayNumber(d) < 7),
  ).size;
}

// ── content checks (tools/choice-talk.test.mjs) ───────────────────────────
const pair = (v) =>
  Array.isArray(v) && v.length === 2 && v.every((s) => typeof s === "string" && s.trim());

/** Problems in content/choice-boards.json; an empty list means the file is sound. */
export function checkBoards(data) {
  const errors = [];
  const ids = new Set();
  for (const band of CONTENT_BANDS) {
    for (const klu of KEY_LANGUAGE_USES) {
      const board = data?.bands?.[band]?.[klu];
      const where = `${band}/${klu}`;
      if (!board) {
        errors.push(`${where}: missing board`);
        continue;
      }
      if (!pair(board.theme)) errors.push(`${where}: theme`);
      if (!Array.isArray(board.squares) || board.squares.length !== 9) {
        errors.push(`${where}: needs 9 squares`);
        continue;
      }
      board.squares.forEach((sq, i) => {
        const at = `${where}#${i + 1}`;
        if (!sq.id || ids.has(sq.id)) errors.push(`${at}: id missing or repeated`);
        ids.add(sq.id);
        if (sq.domain !== BOARD_DOMAINS[i])
          errors.push(`${at}: domain ${sq.domain} should be ${BOARD_DOMAINS[i]}`);
        for (const f of ["title", "task", "frame", "lookFor"])
          if (!pair(sq[f])) errors.push(`${at}: ${f}`);
        if (pair(sq.frame) && !sq.frame.every((s) => s.includes("___")))
          errors.push(`${at}: frame needs ___`);
        if (!(Number.isInteger(sq.minutes) && sq.minutes >= 3 && sq.minutes <= 10))
          errors.push(`${at}: minutes`);
        if ((sq.domain === "Listening") !== Boolean(sq.listen?.trim?.()))
          errors.push(`${at}: listen text`);
        if ((sq.domain === "Reading") !== Boolean(sq.read?.trim?.()))
          errors.push(`${at}: read text`);
      });
    }
  }
  return errors;
}

/** Problems in content/talk-table.json. */
export function checkTalk(data) {
  const errors = [];
  const ids = new Set();
  const questions = new Set();
  for (const band of CONTENT_BANDS) {
    for (const klu of KEY_LANGUAGE_USES) {
      const cards = data?.bands?.[band]?.[klu];
      const where = `${band}/${klu}`;
      if (!Array.isArray(cards) || cards.length < 6) {
        errors.push(`${where}: needs at least 6 cards`);
        continue;
      }
      cards.forEach((c, i) => {
        const at = `${where}#${i + 1}`;
        if (!/^[a-z0-9-]{3,40}$/.test(c.id || "") || ids.has(c.id)) errors.push(`${at}: id`);
        ids.add(c.id);
        for (const f of ["q", "starter", "followUp"]) if (!pair(c[f])) errors.push(`${at}: ${f}`);
        if (pair(c.starter) && !c.starter.every((s) => s.includes("___")))
          errors.push(`${at}: starter needs ___`);
        if (pair(c.q)) {
          const key = c.q[0].trim().toLowerCase();
          if (questions.has(key)) errors.push(`${at}: repeated question`);
          questions.add(key);
        }
        const words = Array.isArray(c.words) ? c.words : [];
        if (
          words.length < 2 ||
          words.length > 3 ||
          !words.every((w) => w?.en?.trim() && w?.es?.trim())
        )
          errors.push(`${at}: words`);
      });
    }
  }
  return errors;
}

// ── passport summaries (src/views/passport-more.js) ───────────────────────
export const BOARD_LINES_NOTE = Object.freeze([
  "These count practice you chose. They are not stamps, scores or levels.",
  "Esto cuenta la práctica que elegiste. No son sellos, puntajes ni niveles.",
]);

/** Squares done and three-in-a-row lines across this band's four boards, from the raw stored JSON text. */
export function choiceSummary(rawText, band) {
  let parsed = {};
  try {
    parsed = JSON.parse(rawText || "{}");
  } catch {}
  const all = cleanChoice(parsed);
  let squares = 0;
  let lines = 0;
  for (const klu of KEY_LANGUAGE_USES) {
    const st = boardStatus(boardRecord(all, band, klu).done);
    squares += st.done;
    lines += st.lines.length;
  }
  return { squares, lines };
}

/** Cards talked about (all bands) and different talk days in the last seven days. */
export function talkSummary(rawText, iso) {
  let parsed = {};
  try {
    parsed = JSON.parse(rawText || "{}");
  } catch {}
  const { talked } = cleanTalk(parsed);
  return { cards: Object.keys(talked).length, week: talkDaysThisWeek(talked, iso) };
}
