// The shared engine behind the four flagship Language Games (/language-games): Language Escape Room, Evidence
// Detective, Conversation Quest and Newsroom Challenge. Pure functions over plain data, no DOM, so node tests drive it.
//
// A game has two bands ("3-5", "6-8"); a band has chapters (rooms, cases, encounters, assignments) that unlock in
// order; a chapter has evidence documents and steps. Three step types carry every mechanic:
//   choose  pick one option (interpret evidence, pick the best conclusion, choose a line or a register)
//   sort    put each item in a category, optionally with a reason (relevant/irrelevant, fact/opinion)
//   write   produce language (explain, defend, answer a counterclaim, say a line, write a headline or lead),
//           checked by rules in checks.js
// Help steps up after each miss: clue → rule → model. The answer is never shown before the third miss. Choosing an
// option may set story flags (`sets`), and a step or story line may depend on them (`when`), so a choice in one
// encounter changes later ones. No timers, scores or points: progress is chapters opened and the learner's own work.
import { checkChoose, checkSort, checkWrite } from "./checks.js";
import { GAME as CONVERSATION } from "./conversation-quest.js";
import { GAME as ESCAPE } from "./escape-room.js";
import { GAME as DETECTIVE } from "./evidence-detective.js";
import { GAME as NEWSROOM } from "./newsroom-challenge.js";

export const BANDS = ["3-5", "6-8"];
export const bandOf = (b) => (b === "3-5" ? "3-5" : "6-8");
export const GAMES = [ESCAPE, DETECTIVE, CONVERSATION, NEWSROOM];
export const gameById = (id) => GAMES.find((g) => g.id === id) || null;
export const STEP_TYPES = ["choose", "sort", "write"];
export const DOC_KINDS = [
  "note",
  "schedule",
  "map",
  "diagram",
  "chart",
  "interview",
  "witness",
  "record",
  "photo",
];

// ── state ────────────────────────────────────────────────────────────────────
// { [gameId]: { [band]: { ch: { [chapterId]: ChapterState }, flags: {}, last: chapterId } } }
// ChapterState = { at: step index, steps: { [stepId]: StepState }, done: bool, flags: {} snapshot at start }
// StepState = { tries, ok, shown, help, picked, answers, text, last: result }
export function bandState(all, gameId, band) {
  all[gameId] ||= {};
  all[gameId][band] ||= { ch: {}, flags: {}, last: "" };
  return all[gameId][band];
}
export function chapterState(bs, chapterId) {
  bs.ch[chapterId] ||= { at: 0, steps: {}, done: false, flags: { ...bs.flags } };
  return bs.ch[chapterId];
}
export const stepState = (cs, stepId) => {
  cs.steps[stepId] ||= { tries: 0, ok: false, shown: false, help: false };
  return cs.steps[stepId];
};

/** A step is active when every flag it names has that value (flags captured when the chapter began). */
export const matches = (when, flags = {}) =>
  !when || Object.entries(when).every(([k, v]) => flags[k] === v);
export const activeSteps = (chapter, flags = {}) =>
  chapter.steps.filter((s) => matches(s.when, flags));
/** The story line for a chapter part: the first variant whose `when` matches, else the plain text. */
export const storyLine = (chapter, part, flags = {}) =>
  (chapter[`${part}By`] || []).find((v) => matches(v.when, flags))?.text || chapter[part] || "";

export const chaptersOf = (game, band) => game.bands[bandOf(band)].chapters;
export function isUnlocked(game, band, bs, index) {
  if (index <= 0) return true;
  const prev = chaptersOf(game, band)[index - 1];
  return Boolean(bs.ch[prev.id]?.done);
}

/** Progress for the hub and game map: { done, total, next: chapter|null, nextIndex, started, complete }. */
export function progressOf(game, band, bs) {
  const chapters = chaptersOf(game, band);
  const done = chapters.filter((c) => bs.ch[c.id]?.done).length;
  const nextIndex = chapters.findIndex((c) => !bs.ch[c.id]?.done);
  return {
    done,
    total: chapters.length,
    nextIndex,
    next: nextIndex >= 0 ? chapters[nextIndex] : null,
    started: Object.keys(bs.ch).length > 0,
    complete: done === chapters.length,
  };
}

// ── checking and the help ladder ─────────────────────────────────────────────
const RULE_PREFIX = ["Here is the rule: ", "La regla: "];

/**
 * Check one attempt and advance the step's state. `input`: choose → option id; sort → { [itemId]: { cat, reason } };
 * write → text. Returns the result shown to the learner:
 *   { ok, level: "right" | "clue" | "rule" | "model" | "empty", msg: [en, es], wrong?: [itemIds], missing?, sets? }
 * Level "model" means the third miss: a choose/sort step is then complete with the answer shown (supported); a write
 * step shows the model and stays open until the learner's own text passes.
 */
export function attempt(step, ss, input, prompt = step.prompt) {
  let res;
  if (step.type === "choose") {
    const r = checkChoose(step, input);
    const opt = step.options.find((o) => o.id === input);
    if (!opt)
      return { ok: false, level: "empty", msg: ["Choose one first.", "Primero elige una."] };
    ss.picked = input;
    if (r.ok)
      res = { ok: true, level: "right", msg: [opt.why || step.explain, ""], sets: opt.sets };
    else {
      ss.tries += 1;
      const why = opt.why || "";
      if (ss.tries === 1) res = { ok: false, level: "clue", msg: [why, ""] };
      else if (ss.tries === 2)
        res = {
          ok: false,
          level: "rule",
          msg: [`${why} ${RULE_PREFIX[0]}${step.rule[0]}`, `${RULE_PREFIX[1]}${step.rule[1]}`],
        };
      else {
        const right = step.options.find((o) => o.ok);
        ss.shown = true;
        ss.picked = right.id;
        res = {
          ok: true,
          level: "model",
          msg: [`The best answer is “${right.text}”. ${step.explain || ""}`, ""],
          sets: right.sets,
        };
      }
    }
    if (res.ok) ss.ok = true;
  } else if (step.type === "sort") {
    ss.answers = { ...(ss.answers || {}), ...(input || {}) };
    const missingItem = step.items.find(
      (it) => !ss.answers[it.id]?.cat || (step.reasons && it.reason && !ss.answers[it.id]?.reason),
    );
    if (missingItem)
      return {
        ok: false,
        level: "empty",
        msg: [
          "Place every item first (and choose a reason where asked).",
          "Primero coloca cada elemento (y elige una razón donde se pide).",
        ],
      };
    const r = checkSort(step, ss.answers);
    if (r.ok)
      res = {
        ok: true,
        level: "right",
        msg: [step.explain || "Every item is in the right place.", ""],
      };
    else {
      ss.tries += 1;
      if (ss.tries < 3)
        res = {
          ok: false,
          level: ss.tries === 1 ? "clue" : "rule",
          wrong: r.wrong,
          msg:
            ss.tries === 1
              ? [
                  `${r.wrong.length} of ${step.items.length} need another look. Read the clue under each one.`,
                  `${r.wrong.length} de ${step.items.length} necesitan otra mirada. Lee la pista debajo de cada uno.`,
                ]
              : [`${RULE_PREFIX[0]}${step.rule[0]}`, `${RULE_PREFIX[1]}${step.rule[1]}`],
        };
      else {
        ss.shown = true;
        for (const it of step.items) ss.answers[it.id] = { cat: it.cat, reason: it.reason };
        res = {
          ok: true,
          level: "model",
          wrong: r.wrong,
          msg: [`Here is where each one belongs. ${step.explain || ""}`, ""],
        };
      }
    }
    if (res.ok) ss.ok = true;
  } else {
    const text = String(input || "");
    ss.text = text;
    const r = checkWrite(text, step.check, prompt);
    if (r.ok) {
      ss.ok = true;
      res = {
        ok: true,
        level: "right",
        msg: [step.praise || "That does the job: it uses what you found and explains it.", ""],
        found: r.found,
      };
    } else if (r.missing[0]?.kind === "empty")
      res = { ok: false, level: "empty", msg: r.missing[0].clue, missing: r.missing };
    else {
      ss.tries += 1;
      const first = r.missing[0].clue;
      if (ss.tries === 1) res = { ok: false, level: "clue", msg: first, missing: r.missing };
      else if (ss.tries === 2)
        res = {
          ok: false,
          level: "rule",
          msg: [
            `${first[0]} ${RULE_PREFIX[0]}${step.rule[0]}`,
            `${first[1]} ${RULE_PREFIX[1]}${step.rule[1]}`,
          ],
          missing: r.missing,
        };
      else {
        ss.shown = true;
        res = {
          ok: false,
          level: "model",
          msg: [
            `${first[0]} Read the model below, then write your own version.`,
            `${first[1]} Lee el modelo de abajo y escribe tu propia versión.`,
          ],
          missing: r.missing,
        };
      }
    }
  }
  ss.last = res;
  return res;
}

/** Ledger fields for one attempt (the view writes it with appendEntry). */
export function ledgerEntry(game, band, chapter, step, ss, res) {
  const domain =
    step.domain ||
    (step.type === "write"
      ? step.say
        ? "Speaking"
        : "Writing"
      : step.type === "choose" && step.say
        ? "Speaking"
        : "Reading");
  return {
    src: "flagship",
    task: `${game.id}:${chapter.id}:${step.id}`,
    band: bandOf(band),
    domain,
    use: step.use || game.use,
    stage: ss.help || ss.shown ? "supported" : "independent",
    kind: ss.tries > (res.ok ? 0 : 1) ? "revision" : "first",
    supports: { spanish: !!ss.help, model: !!ss.shown },
    m: {
      ok: res.ok ? 1 : 0,
      game: game.id,
      chapter: chapter.id,
      type: step.type,
      level: res.level,
      words:
        step.type === "write"
          ? String(ss.text || "")
              .split(/\s+/)
              .filter(Boolean).length
          : undefined,
    },
  };
}

/** Move a chapter forward after a step is complete; marks the chapter done after its last active step. */
export function advance(bs, chapter, cs) {
  const steps = activeSteps(chapter, cs.flags);
  while (cs.at < steps.length && cs.steps[steps[cs.at].id]?.ok) cs.at += 1;
  if (cs.at >= steps.length && !cs.done) {
    cs.done = true;
    return true;
  }
  return false;
}

/** Apply story flags set by a choice: they hold for every later chapter (and the rest of this one). */
export function applyFlags(bs, cs, sets) {
  if (!sets) return;
  Object.assign(bs.flags, sets);
  Object.assign(cs.flags, sets);
}

// ── the completion artifact ──────────────────────────────────────────────────
/** The learner's own work, chapter by chapter: [{ chapter, entries: [{ label, text }] }] (write steps marked `keep`). */
export function artifactOf(game, band, bs) {
  return chaptersOf(game, band)
    .filter((c) => bs.ch[c.id])
    .map((c) => {
      const cs = bs.ch[c.id];
      const entries = activeSteps(c, cs.flags)
        .filter((s) => s.keep && cs.steps[s.id]?.ok && cs.steps[s.id]?.text)
        .map((s) => ({ label: s.keep, text: cs.steps[s.id].text.trim() }));
      return {
        chapter: c,
        done: !!cs.done,
        outro: cs.done ? storyLine(c, "outro", cs.flags) : "",
        entries,
      };
    });
}

// ── read-aloud text ──────────────────────────────────────────────────────────
/** Everything a document says, as one string for read-aloud. */
export function docText(doc) {
  const t = [doc.title];
  if (doc.from) t.push(`From ${doc.from}.`);
  if (doc.lines) t.push(...doc.lines);
  if (doc.cols) t.push(...doc.rows.map((r) => r.map((c, i) => `${doc.cols[i]}: ${c}`).join(", ")));
  if (doc.places) t.push(...(doc.notes || []));
  if (doc.parts) t.push(...doc.parts.map((p) => `${p.label}: ${p.text}`));
  if (doc.bars) t.push(...doc.bars.map((b) => `${b.label}: ${b.value} ${doc.unit || ""}`.trim()));
  if (doc.qa)
    t.push(...doc.qa.flatMap((x) => [`Question: ${x.q}`, `${doc.who || "Answer"}: ${x.a}`]));
  if (doc.said) t.push(`${doc.who}${doc.role ? `, ${doc.role}` : ""}, said: ${doc.said}`);
  if (doc.rows && !doc.cols) t.push(...doc.rows.map(([k, v]) => `${k}: ${v}`));
  if (doc.caption) t.push(doc.caption);
  if (doc.source) t.push(`Source: ${doc.source}`);
  return t.filter(Boolean).join(". ").replace(/\.\./g, ".");
}

// ── content validation (tests and authors) ───────────────────────────────────
const pair = (v) =>
  Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "string" && x.trim());
/** Every problem found in one game's content; [] when it is complete. */
export function validateGame(game) {
  const out = [];
  const bad = (where, what) => out.push(`${game.id}${where ? ` ${where}` : ""}: ${what}`);
  for (const k of ["id", "use"]) if (!game[k]) bad("", `missing ${k}`);
  for (const k of ["title", "tagline", "noun", "verb"])
    if (!pair(game[k])) bad("", `${k} must be [en, es]`);
  const ids = new Set();
  for (const band of BANDS) {
    const b = game.bands?.[band];
    if (!b) {
      bad(band, "missing band");
      continue;
    }
    if (!b.premise || !b.premiseEs) bad(band, "premise and premiseEs required");
    if (b.chapters.length !== game.chapters)
      bad(band, `needs ${game.chapters} chapters, has ${b.chapters.length}`);
    const setFlags = new Set();
    for (const c of b.chapters) {
      const at = `${band} ${c.id}`;
      if (ids.has(c.id)) bad(at, "duplicate chapter id");
      ids.add(c.id);
      for (const k of ["title", "intro", "introEs", "outro"]) if (!c[k]) bad(at, `missing ${k}`);
      if (!Array.isArray(c.art) || !c.art.length) bad(at, "art: [background, character] required");
      const docIds = new Set();
      for (const d of c.docs || []) {
        if (!DOC_KINDS.includes(d.kind)) bad(at, `doc ${d.id} has unknown kind ${d.kind}`);
        if (!d.id || !d.title) bad(at, "every doc needs id and title");
        docIds.add(d.id);
      }
      for (const v of [...(c.introBy || []), ...(c.outroBy || [])])
        for (const f of Object.keys(v.when || {}))
          if (!setFlags.has(f))
            bad(at, `story variant reads flag ${f} that no earlier choice sets`);
      const stepIds = new Set();
      for (const s of c.steps) {
        const where = `${at} ${s.id}`;
        if (!s.id || stepIds.has(s.id)) bad(where, "step id missing or duplicate");
        stepIds.add(s.id);
        if (!STEP_TYPES.includes(s.type)) bad(where, `unknown type ${s.type}`);
        if (!s.prompt) bad(where, "prompt required");
        if (!s.help || !/[áéíóúñ¿¡]|\b(la|el|de|que|los|las|una|para|tu)\b/i.test(s.help))
          bad(where, "help must be Spanish");
        if (!pair(s.rule)) bad(where, "rule must be [en, es]");
        for (const id of s.docs || [])
          if (!docIds.has(id)) bad(where, `refers to doc ${id} that this chapter lacks`);
        for (const f of Object.keys(s.when || {}))
          if (!setFlags.has(f)) bad(where, `reads flag ${f} that no earlier choice sets`);
        if (s.type === "choose") {
          if (!s.options || s.options.length < 3) bad(where, "choose needs at least 3 options");
          else {
            if (!s.options.some((o) => o.ok)) bad(where, "no correct option");
            for (const o of s.options) {
              if (!o.id || !o.text) bad(where, "option needs id and text");
              if (!o.ok && !o.why) bad(where, `wrong option ${o.id} needs a why`);
              for (const f of Object.keys(o.sets || {})) setFlags.add(f);
            }
            if (!s.explain) bad(where, "explain required (shown when right or revealed)");
            const right = s.options.filter((o) => o.ok).map((o) => o.text.toLowerCase());
            for (const o of s.options.filter((x) => !x.ok))
              for (const r of right)
                if (r.length > 6 && o.why.toLowerCase().includes(r))
                  bad(where, `why of ${o.id} states the answer`);
          }
        }
        if (s.type === "sort") {
          if (!s.cats || s.cats.length < 2 || !s.cats.every((x) => x.id && pair(x.label)))
            bad(where, "sort needs 2+ cats with [en, es] labels");
          if (!s.items || s.items.length < 4) bad(where, "sort needs at least 4 items");
          else {
            for (const cat of s.cats || [])
              if (!s.items.some((i) => i.cat === cat.id)) bad(where, `no item in ${cat.id}`);
            for (const i of s.items) {
              if (!pair(i.clue)) bad(where, `item ${i.id} clue must be [en, es]`);
              if (s.reasons && !s.reasons.some((r) => r.id === i.reason))
                bad(where, `item ${i.id} reason not in reasons`);
            }
          }
        }
        if (s.type === "write") {
          const spec = s.check || {};
          if (!s.model) bad(where, "write needs a model");
          else {
            const m = checkWrite(s.model, spec, s.prompt);
            if (!m.ok)
              bad(where, `model fails its own check: ${m.missing.map((x) => x.kind).join(", ")}`);
          }
          if (checkWrite("", spec, s.prompt).ok) bad(where, "an empty answer passes");
          if (checkWrite(s.prompt, spec, s.prompt).ok) bad(where, "copying the prompt passes");
          for (const idea of spec.ideas || [])
            if (!idea.any?.length || !pair(idea.clue))
              bad(where, "every idea needs any[] and clue [en, es]");
          if (!s.frame) bad(where, "write needs a frame (shown with the rule)");
        }
      }
      if (!c.steps.length) bad(at, "no steps");
    }
  }
  return out;
}
