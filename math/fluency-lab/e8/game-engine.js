// Unified math game engine (Enterprise 8). Ten game families share one session: grade and skill selection, challenge
// generation, difficulty that follows the player, a three-rung hint ladder, targeted feedback for known wrong answers,
// a follow-up problem after a miss (never the same item again), age-appropriate reasoning prompts, pause/resume, a
// serialisable snapshot, and honest evidence for the mastery engine. Nothing in a session depends on time: a timer, if a
// family offers one, is a flag that can never change what counts as correct or as completing the game.
import { MathVisualEngine, bi, seeded } from "./engine-core.js";
import "./models.js";
import { equivalent } from "./rational.js";

const FAMILIES = new Map();
export const registerFamily = (family) => {
  if (FAMILIES.has(family.id))
    throw new Error(`Duplicate game family ${family.id}`);
  FAMILIES.set(family.id, Object.freeze(family));
  return family;
};
export const getFamily = (id) => FAMILIES.get(id) || null;
export const listFamilies = () => [...FAMILIES.values()];
export const familiesForGrade = (grade) =>
  listFamilies().filter((f) => f.grades.includes(Number(grade)));

export function shuffle(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------- challenge constructors
// Every challenge: id, concept (for follow-ups), skill (library key for evidence), level 0-2, prompt{en,es}, hints[3],
// explanation{en,es}, and optional distractors [{ value, why{en,es} }] that give targeted feedback and feed error analysis.
export const numeric = (c) => ({
  kind: "numeric",
  level: 1,
  hints: [],
  ...c,
  // A distractor that happens to equal the answer (2 × 2 = 2 + 2) is not a wrong answer: drop it.
  distractors: (c.distractors || []).filter((d) => d.value !== "" && !equivalent(d.value, c.answer)),
  check: (value) => equivalent(value, c.answer, { simplified: Boolean(c.simplified) }),
});
export const choice = (rng, c) => {
  const options = shuffle(
    rng,
    c.options.map((o) => ({ ...o })),
  );
  return {
    kind: "choice",
    level: 1,
    hints: [],
    distractors: [],
    ...c,
    options,
    check: (index) => Boolean(options[Number(index)]?.ok),
  };
};
export const build = (c) => ({
  kind: "build",
  level: 1,
  hints: [],
  distractors: [],
  ...c,
  make: () => new MathVisualEngine(c.model, c.params, { mode: "independent" }),
  check: (engine) => Boolean(c.goal(engine)),
});

const HINT_NONE = bi(
  "Look at the picture and think about what each number means.",
  "Mira la imagen y piensa qué significa cada número.",
);

// ---------------------------------------------------------------- reasoning prompts
const REASONING = ["strategy", "error", "compare", "represent"];
function reasoningChallenge(kind, prev, rng, scaffold) {
  const base = {
    kind: "reason",
    reasoning: kind,
    level: prev.level,
    skill: prev.skill,
    concept: `${prev.concept}:why`,
    id: `${prev.id}:${kind}`,
  };
  const frames =
    scaffold > 0
      ? [
          bi("I started by ___ because ___.", "Empecé con ___ porque ___."),
          bi("This works because ___.", "Esto funciona porque ___."),
        ]
      : [];
  if (kind === "error" && prev.distractors?.length) {
    const d = prev.distractors[0];
    const others = shuffle(
      rng,
      prev.distractors.slice(1).map((x) => x.why),
    ).slice(0, 2);
    const generic = [
      bi(
        "They added instead of multiplying.",
        "Sumaron en lugar de multiplicar.",
      ),
      bi(
        "They copied a number from the problem.",
        "Copiaron un número del problema.",
      ),
    ];
    const options = shuffle(rng, [
      { text: d.why, ok: true },
      ...[...others, ...generic]
        .filter((t) => t.en !== d.why.en)
        .slice(0, 2)
        .map((text) => ({ text, ok: false })),
    ]);
    return {
      ...base,
      prompt: bi(
        `A student answered ${d.value}. What mistake did they make?`,
        `Un estudiante respondió ${d.value}. ¿Qué error cometió?`,
      ),
      options,
      hints: [
        bi(
          "Compare their answer with what the problem asks for.",
          "Compara su respuesta con lo que pide el problema.",
        ),
        HINT_NONE,
        bi(
          "Try their steps yourself and see where they go wrong.",
          "Haz sus pasos tú y mira dónde se equivocan.",
        ),
      ],
      check: (i) => Boolean(options[Number(i)]?.ok),
      explanation: d.why,
    };
  }
  if (
    kind === "compare" &&
    prev.distractors?.length &&
    prev.answer !== undefined
  ) {
    const d = prev.distractors[0];
    const options = shuffle(rng, [
      {
        text: bi(`Student A: ${prev.answer}`, `Estudiante A: ${prev.answer}`),
        ok: true,
      },
      {
        text: bi(`Student B: ${d.value}`, `Estudiante B: ${d.value}`),
        ok: false,
      },
    ]);
    return {
      ...base,
      prompt: bi(
        "Two students solved the same problem. Whose answer is right?",
        "Dos estudiantes resolvieron el mismo problema. ¿Cuál respuesta es correcta?",
      ),
      options,
      hints: [
        HINT_NONE,
        bi(
          "Check each answer in the picture or by working backward.",
          "Comprueba cada respuesta en la imagen o trabajando hacia atrás.",
        ),
        bi(
          "Try the problem yourself first, then compare.",
          "Resuelve el problema tú primero y luego compara.",
        ),
      ],
      check: (i) => Boolean(options[Number(i)]?.ok),
      explanation: prev.explanation,
    };
  }
  if (kind === "represent" && prev.repr?.model) {
    return {
      ...base,
      free: true,
      prompt: bi(
        "Describe how you could show this problem with a picture or a model.",
        "Describe cómo podrías mostrar este problema con una imagen o un modelo.",
      ),
      frames,
      hints: [HINT_NONE, HINT_NONE, HINT_NONE],
      minWords: 4,
    };
  }
  return {
    ...base,
    reasoning: "strategy",
    free: true,
    prompt: bi(
      "How did you think about the last problem? Write at least one full sentence.",
      "¿Cómo pensaste en el último problema? Escribe al menos una oración completa.",
    ),
    frames,
    hints: [HINT_NONE, HINT_NONE, HINT_NONE],
    minWords: 4,
  };
}

// ---------------------------------------------------------------- session
const MAX_TRIES = 2;

export class GameSession {
  constructor({
    family,
    grade,
    seed = 1,
    rounds = 8,
    scaffold = 2,
    options = {},
  }) {
    const fam = typeof family === "string" ? getFamily(family) : family;
    if (!fam) throw new Error(`Unknown game family ${family}`);
    if (!fam.grades.includes(Number(grade)))
      throw new Error(`${fam.id} is not for grade ${grade}`);
    this.family = fam;
    this.grade = Number(grade);
    this.seed = seed;
    this.rounds = Math.max(3, Math.min(20, rounds));
    this.scaffold = scaffold;
    // Preferences never change correctness or completion; `timer` only adds an optional pace note at the end.
    this.options = {
      timer: false,
      sound: true,
      reducedMotion: false,
      ...options,
    };
    this.status = "ready";
    this.level = fam.startLevel?.(this.grade) ?? 1;
    this.rng = seeded(seed * 2246822519 + this.grade);
    this.round = 0;
    this.asked = new Set();
    this.queue = [];
    this.challenge = null;
    this.engine = null;
    this.tool = null;
    this.tries = 0;
    this.hintsUsed = 0;
    this.streak = 0;
    this.explained = 0;
    this.followUps = 0;
    this.history = [];
    this.evidence = [];
    this.reasoning = [];
    this.prev = null;
    this.paceNote = null;
  }

  start() {
    if (this.status !== "ready") return this.challenge;
    this.status = "playing";
    return this.load();
  }
  pause() {
    if (this.status === "playing") this.status = "paused";
    return this.status;
  }
  resume() {
    if (this.status === "paused") this.status = "playing";
    return this.status;
  }

  // Pick the next challenge: a follow-up after a miss first, a reasoning prompt on round 3 and 6, otherwise the family's own.
  load() {
    if (this.round >= this.rounds && !this.queue.length) {
      this.status = "complete";
      this.challenge = null;
      return null;
    }
    let next;
    if (this.queue.length) next = this.queue.shift();
    else if (
      this.prev &&
      [3, 6].includes(this.round) &&
      this.round < this.rounds &&
      !this.reasonedAt?.includes(this.round)
    ) {
      (this.reasonedAt ||= []).push(this.round);
      next = reasoningChallenge(
        REASONING[
          ((this.round / 3 - 1 + this.explained) % REASONING.length) | 0
        ],
        this.prev,
        this.rng,
        this.scaffold,
      );
    } else next = this.fresh();
    this.challenge = next;
    this.engine = next.kind === "build" ? next.make() : null;
    this.tool = next.tool ? new MathVisualEngine(next.tool.model, next.tool.params, { mode: "independent" }) : null;
    this.tries = 0;
    this.hintsUsed = 0;
    return next;
  }

  fresh(concept = null) {
    for (let i = 0; i < 60; i += 1) {
      const c = this.family.make(this.rng, { grade: this.grade, level: this.level, round: this.round, concept, variant: i, seed: this.seed });
      // A follow-up keeps the idea of the missed item; after many tries any new item is accepted rather than looping.
      if (concept && c.concept !== concept && i < 45) continue;
      const key = `${c.id}|${c.prompt.en}`;
      if (!this.asked.has(key)) {
        this.asked.add(key);
        return c;
      }
    }
    throw new Error("Could not generate a new challenge");
  }

  // For build challenges the learner moves the model, then asks to be checked.
  move(action) {
    if (this.status !== "playing" || this.challenge?.kind !== "build")
      return { ok: false };
    return this.engine.dispatch(action);
  }

  // Optional exploration tool beside a question (a function machine to probe, a box plot to read). It never changes the answer.
  useTool(action) {
    return this.status === "playing" && this.tool ? this.tool.dispatch(action) : { ok: false };
  }

  submit(response) {
    if (this.status !== "playing" || !this.challenge)
      return { status: "refused" };
    const c = this.challenge;
    if (c.kind === "numeric" && !String(response ?? "").trim())
      return {
        status: "invalid",
        feedback: bi("Type an answer first.", "Escribe una respuesta primero."),
      };
    if (c.kind === "reason" && c.free) return this.submitFree(response);
    this.tries += 1;
    const ok = c.kind === "build" ? c.check(this.engine) : c.check(response);
    if (ok) return this.finish(true);
    const d =
      c.kind === "numeric"
        ? c.distractors.find((x) => equivalent(response, x.value))
        : null;
    const feedback = d
      ? d.why
      : c.kind === "build"
        ? bi(
            "Not there yet. Look at what the picture and the numbers say now.",
            "Todavía no. Mira lo que dicen ahora la imagen y los números.",
          )
        : bi(
            "Not quite. Use a hint if you want one.",
            "Todavía no. Usa una pista si quieres.",
          );
    if (this.tries >= MAX_TRIES) return this.finish(false, feedback);
    return {
      status: "incorrect",
      feedback,
      tries: this.tries,
      hintOffered: this.hintsUsed < 3,
    };
  }

  submitFree(text) {
    const words = String(text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const filled = !/___/.test(String(text));
    if (words.length < (this.challenge.minWords || 4) || !filled)
      return {
        status: "invalid",
        feedback: bi(
          "Write a full sentence and fill in every blank.",
          "Escribe una oración completa y llena todos los espacios.",
        ),
      };
    this.reasoning.push({
      type: this.challenge.reasoning,
      words: words.length,
      framed: this.scaffold > 0,
    });
    this.explained += 1;
    if (this.explained >= 3 && this.scaffold > 0) this.scaffold -= 1; // frames fade as explanations become independent
    return this.finish(true, null, { reasoning: true });
  }

  hint() {
    if (this.status !== "playing" || !this.challenge) return null;
    const c = this.challenge;
    const rung = Math.min(3, this.hintsUsed + 1);
    this.hintsUsed = rung;
    const text = c.hints[rung - 1] || HINT_NONE;
    // Rung 2 shows the idea in a model; rung 3 is a first step, never the answer.
    return { rung, text, repr: rung === 2 && c.repr ? c.repr : null };
  }

  finish(correct, feedback = null, { reasoning = false } = {}) {
    const c = this.challenge;
    const independent = correct && this.tries <= 1 && this.hintsUsed === 0;
    if (!reasoning && c.kind !== "reason") {
      this.evidence.push({
        skill: c.skill,
        correct,
        independent,
        level: c.level,
        sig: c.id,
        concept: c.concept,
      });
      if (!correct) this.streak = 0;
      else if (independent) this.streak += 1;
      else this.streak = 0;
      // Difficulty follows the player: two clean ones climb a level, a miss steps back one.
      if (independent && this.streak >= 2 && this.level < 2) {
        this.level += 1;
        this.streak = 0;
      }
      if (!correct && this.level > 0) this.level -= 1;
    }
    this.history.push({
      id: c.id,
      kind: c.kind,
      correct,
      independent,
      tries: this.tries,
      hints: this.hintsUsed,
    });
    if (c.kind === "reason" && !reasoning) {
      if (correct) this.reasoning.push({ type: c.reasoning, choice: true });
      this.explained += 1;
    }
    if (!correct && c.kind !== "reason" && !c.followUp && this.followUps < 3) {
      this.followUps += 1;
      // A miss is followed by a DIFFERENT problem on the same idea, never the same item again.
      const follow = this.fresh(c.concept);
      follow.followUp = true;
      this.queue.push(follow);
    }
    if (!reasoning || correct) this.prev = c.kind === "reason" ? this.prev : c;
    if (c.kind !== "reason") this.round += 1;
    const explanation = !correct ? c.explanation : null;
    const result = {
      status: correct ? "correct" : "missed",
      independent,
      feedback,
      explanation,
      hintsUsed: this.hintsUsed,
      tries: this.tries,
    };
    this.settled = result;
    return result;
  }

  // Move on after a settled challenge.
  next() {
    if (!this.settled) return this.challenge;
    this.settled = null;
    return this.load();
  }

  results() {
    const ev = this.evidence;
    const firstTry = ev.filter((e) => e.independent).length;
    return {
      family: this.family.id,
      grade: this.grade,
      rounds: ev.length,
      firstTry,
      supported: ev.filter((e) => e.correct && !e.independent).length,
      missed: ev.filter((e) => !e.correct).length,
      reasoning: this.reasoning.length,
      level: this.level,
      // Stars reward thinking: first tries, supported successes and explanations; never speed.
      stars: ev.length
        ? firstTry / ev.length >= 0.8
          ? 3
          : firstTry / ev.length >= 0.5
            ? 2
            : 1
        : 0,
      evidence: ev.map((e) => ({ ...e })),
      summary: bi(
        `${firstTry} of ${ev.length} on the first try, with ${this.reasoning.length} explanation${this.reasoning.length === 1 ? "" : "s"}.`,
        `${firstTry} de ${ev.length} al primer intento, con ${this.reasoning.length} explicación${this.reasoning.length === 1 ? "" : "es"}.`,
      ),
    };
  }

  snapshot() {
    return JSON.stringify({
      v: 1,
      family: this.family.id,
      grade: this.grade,
      seed: this.seed,
      rounds: this.rounds,
      scaffold: this.scaffold,
      options: this.options,
      status: this.status,
      level: this.level,
      round: this.round,
      evidence: this.evidence,
      reasoning: this.reasoning,
      history: this.history,
      streak: this.streak,
      explained: this.explained,
    });
  }

  // Resume a saved game: finished rounds stay finished and play continues on a new challenge from a re-seeded generator.
  static restore(json) {
    const d = typeof json === "string" ? JSON.parse(json) : json;
    if (!d || d.v !== 1 || !getFamily(d.family))
      throw new Error("Unsupported game snapshot");
    const s = new GameSession({
      family: d.family,
      grade: d.grade,
      seed: d.seed + d.round * 101,
      rounds: d.rounds,
      scaffold: d.scaffold,
      options: d.options,
    });
    Object.assign(s, {
      level: d.level,
      round: d.round,
      evidence: d.evidence,
      reasoning: d.reasoning,
      history: d.history,
      streak: d.streak,
      explained: d.explained,
      status: d.status === "complete" ? "complete" : "paused",
    });
    return s;
  }
}
