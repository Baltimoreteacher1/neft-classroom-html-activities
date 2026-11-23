// Word Mastery Challenge — cumulative review across the learner's words. It draws due words first, then
// weak ones, then words to keep fresh; gives each word two different kinds of question, interleaved so
// the same word or type never repeats back to back; brings a missed word back later with a new question;
// and ends with a plain summary of which words are Secure and which need review.
import { STATE_LABEL } from "../contract.js";
import { buildQuestion, available, newMc, QTYPES } from "./questions.js";
import {
  choicesHTML,
  hintButton,
  html,
  icon,
  mcAct,
  mcFeedback,
  mountGame,
  stemHTML,
} from "./kit.js";

export const TITLE = ["Word Mastery Challenge", "Reto de dominio de palabras"];
const LIMIT = { early: 5, "upper-elem": 8, middle: 10, high: 10 };
const asMs = (d) => (typeof d === "number" ? d : d ? Date.parse(d) : NaN);

/** 0 due (or review-needed), 1 weak, 2 applying, 3 secure and not due, 4 not started. Lower is asked first. */
export function masteryGroup(entry, now) {
  if (!entry || entry.state === "new" || entry.seen === 0) return 4;
  const due = asMs(entry.due);
  if (entry.state === "review-needed" || (Number.isFinite(due) && due <= now)) return 0;
  if (entry.state === "learning" || entry.state === "developing" || entry.lapses > 0) return 1;
  if (entry.state === "applying") return 2;
  return 3;
}
const REASON = ["due", "weak", "keep", "keep", "new"];
/** The words a mastery run draws: due first, then weak, then the rest, earliest due date first inside a group. */
export function pickMasteryWords(words, entryOf, now, limit) {
  const rows = words.map((word, order) => {
    const entry = entryOf?.(word.id) || null;
    const due = asMs(entry?.due);
    return {
      word,
      group: masteryGroup(entry, now),
      due: Number.isFinite(due) ? due : Infinity,
      order,
      reason: REASON[masteryGroup(entry, now)],
    };
  });
  rows.sort((a, b) => a.group - b.group || a.due - b.due || a.order - b.order);
  return rows.slice(0, limit);
}

/** Reorder so neighbours differ in word and in type where the items allow it. */
export function interleave(items) {
  const left = [...items];
  const out = [];
  while (left.length) {
    const prev = out[out.length - 1];
    let k = left.findIndex((q) => !prev || (q.wordId !== prev.wordId && q.type !== prev.type));
    if (k < 0) k = left.findIndex((q) => !prev || q.wordId !== prev.wordId);
    if (k < 0) k = 0;
    out.push(left.splice(k, 1)[0]);
  }
  return out;
}

/** Pure engine: picks + the interleaved questions. The first question of a due word is a delayed-retrieval check. */
export function buildMastery(pool, rng, { entryOf, now = Date.now(), limit } = {}) {
  const picks = pickMasteryWords(pool.all, entryOf, now, limit || LIMIT[pool.band] || 8);
  const first = [];
  const second = [];
  for (const p of picks) {
    const types = rng.shuffle(available(p.word, pool));
    const recall = types.filter((t) => t === "def-word" || t === "cloze" || t === "picture");
    const order =
      p.group === 0 && recall.length ? [recall[0], ...types.filter((t) => t !== recall[0])] : types;
    const made = [];
    for (const t of order) {
      const q = buildQuestion(t, p.word, pool, rng, { variant: made.length ? 2 : 1 });
      if (q) made.push(q);
      if (made.length === 2) break;
    }
    if (made[0]) {
      made[0].reason = p.reason;
      if (p.group === 0) made[0].dim = "delay";
      first.push(made[0]);
    }
    if (made[1]) {
      made[1].reason = p.reason;
      second.push(made[1]);
    }
  }
  const qs = interleave([...first, ...second]).map((q, i) => ({ ...q, id: `mastery-${i + 1}` }));
  return { picks: picks.map((p) => ({ id: p.word.id, reason: p.reason, group: p.group })), qs };
}

/** A missed word comes back later with a different kind of question (once per word per run). */
export function requeueFor(pool, rng, q, askedTypes) {
  const word = pool.byId.get(q.wordId);
  const types = rng.shuffle(
    available(word, pool).filter((t) => t !== q.type && !askedTypes.includes(t)),
  );
  for (const t of types) {
    const next = buildQuestion(t, word, pool, rng, { variant: 2 });
    if (next) return { ...next, id: `${q.id}-again`, reason: q.reason, rq: true };
  }
  return null;
}

/** Secure only when the stored state says so and the word had no miss today. */
export function masteryOutcome(picks, log, entryOf) {
  const out = { secure: [], strong: [], review: [] };
  for (const p of picks) {
    const mine = log.filter((e) => e.wordId === p.id);
    if (!mine.length) continue;
    const missed = mine.some((e) => !e.ok);
    const state = entryOf?.(p.id)?.state || "";
    if (missed || state === "review-needed") out.review.push({ id: p.id, state, missed });
    else if (state === "secure") out.secure.push({ id: p.id, state, missed });
    else out.strong.push({ id: p.id, state, missed });
  }
  return out;
}

const REASON_LABEL = {
  due: ["Due for review", "Toca repasar"],
  weak: ["Needs another look", "Necesita otra mirada"],
  keep: ["Keep it fresh", "Mantenla fresca"],
  new: ["New to you", "Nueva para ti"],
};

const spec = {
  id: "word-mastery",
  title: TITLE,
  howTo: [
    [
      "This mix is built from your words. Words that are due come first, then words that need another look.",
      "Esta mezcla usa tus palabras. Primero las que toca repasar.",
    ],
    [
      "Each word gets two different kinds of question. A missed word comes back later in a new way.",
      "Cada palabra tiene dos tipos de pregunta. Una palabra fallada vuelve más tarde.",
    ],
    [
      "Choose an answer. Retry and hints are always fine.",
      "Elige una respuesta. Puedes reintentar y usar pistas.",
    ],
    [
      "At the end you see which words are Secure and which need review.",
      "Al final ves qué palabras están seguras y cuáles necesitan repaso.",
    ],
  ],
  keys: [
    ["1 to 4", ["choose that answer", "elige esa respuesta"]],
    ["Enter", ["go to the next question", "pasa a la siguiente pregunta"]],
  ],

  build(env) {
    const m = buildMastery(env.pool, env.rng, {
      entryOf: env.opts.entryOf,
      now: env.opts.now ?? Date.now(),
    });
    return { ...m, i: 0, mc: newMc(), requeued: [], asked: {}, missed: [] };
  },
  unplayable: (s) => !s.qs.length,
  isDone: (s) => s.i >= s.qs.length,
  progress: (s) => ({ done: Math.min(s.i, s.qs.length), total: s.qs.length }),

  view(s, env) {
    const I = env.I;
    const q = s.qs[s.i];
    return html`<div class="vag-qcard" data-type="${q.type}">
      <p class="vag-qtype">
        ${I.T(...QTYPES[q.type].label)}
        <span class="vag-badge"
          >${icon(q.reason === "due" ? "calendar" : q.reason === "weak" ? "retry" : "star")}${I.T(...REASON_LABEL[q.reason || "keep"])}</span
        >${q.rq ? html` <span class="vag-badge">${icon("replay")}${I.T("Second look", "Segunda mirada")}</span>` : ""}
      </p>
      ${stemHTML(q, env)}${choicesHTML(q, s.mc, env)}
      <div class="vag-actions">
        ${hintButton(s.mc, env)}${s.mc.done ? html`<button type="button" class="btn btn-primary" data-next data-fk="next" data-autofocus>${I.T("Next question", "Siguiente pregunta")}${icon("arrow-right")}</button>` : ""}
      </div>
      ${mcFeedback(q, s.mc, env)}
    </div>`;
  },

  click(el, s, env) {
    const q = s.qs[s.i];
    if (el.closest("[data-next]")) {
      if (!s.mc.done) return false;
      s.i += 1;
      s.mc = newMc();
      return true;
    }
    const before = s.mc.wrong.length;
    const changed = mcAct(el, q, s.mc, env, { kind: q.type });
    if (changed) {
      (s.asked[q.wordId] ||= []).includes(q.type) || s.asked[q.wordId].push(q.type);
      if (!s.mc.done && before === 0 && !q.rq && !s.requeued.includes(q.wordId)) {
        const again = requeueFor(env.pool, env.rng, q, s.asked[q.wordId]);
        if (again) {
          s.requeued.push(q.wordId);
          s.qs.splice(Math.min(s.i + 4, s.qs.length), 0, again);
        }
      }
    }
    return changed;
  },
  key(ev, s) {
    if (ev.key === "Enter" && s.mc.done && !ev.target.closest("button")) {
      s.i += 1;
      s.mc = newMc();
      return true;
    }
    return false;
  },
  extra(s, env) {
    const o = masteryOutcome(s.picks, env.log, env.opts.entryOf);
    return {
      secure: o.secure.map((x) => x.id),
      strong: o.strong.map((x) => x.id),
      needsReview: o.review.map((x) => x.id),
    };
  },
  finishExtra(s, env) {
    const I = env.I;
    const o = masteryOutcome(s.picks, env.log, env.opts.entryOf);
    const row = (x) => {
      const w = env.pool.byId.get(x.id);
      const label =
        x.state && STATE_LABEL[x.state]
          ? I.S(...STATE_LABEL[x.state])
          : I.S("Not set yet", "Sin definir");
      return html`<li>
        <strong>${w.hw}</strong>
        <span class="vag-state"
          >${label}${x.missed ? ` · ${I.S("missed today", "fallada hoy")}` : ""}</span
        >
      </li>`;
    };
    const col = (rows, ic, title, tip) =>
      html`<section class="vag-fin-col">
        <h3>${icon(ic)}${title}</h3>
        ${
          rows.length
            ? html`<ul>
                ${rows.map(row)}
              </ul>`
            : html`<p class="vag-fine">${I.T("None this time.", "Ninguna esta vez.")}</p>`
        }${tip ? html`<p class="vag-fine">${tip}</p>` : ""}
      </section>`;
    return html`<div class="vag-fin-cols vag-mastery-sum">
      ${col(o.secure, "medal", I.T("Secure", "Segura"), "")}
      ${col(o.strong, "check", I.T("Strong today, not Secure yet", "Bien hoy, aún no segura"), I.T("A word becomes Secure after you remember it again after a break of a week or more, in more than one way.", "Una palabra queda segura cuando la recuerdas otra vez tras una semana o más, de más de una manera."))}
      ${col(o.review, "retry", I.T("Needs review", "Necesita repaso"), I.T("These come back in your review plan.", "Estas vuelven en tu plan de repaso."))}
    </div>`;
  },
};

export default {
  id: "word-mastery",
  title: TITLE[0],
  titleEs: TITLE[1],
  blurb:
    "Review words from across your units: due words first, mixed question types, and a clear Secure or needs-review summary.",
  blurbEs: "Repasa palabras de todas tus lecciones, con un resumen claro de seguras y por repasar.",
  purpose: "Bring back the words that are due and see which ones are truly Secure.",
  minGrade: "K",
  maxGrade: "12",
  dims: ["delay", "rec", "mean", "ctx", "morph"],
  mount: (root, opts) => mountGame(root, opts, spec),
  engine: {
    build: buildMastery,
    pick: pickMasteryWords,
    interleave,
    outcome: masteryOutcome,
    requeue: requeueFor,
  },
};
