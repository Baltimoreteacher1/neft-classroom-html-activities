// The learning journey as a pure reducer: predict, build, observe, discover, explain, transfer. It never trusts the
// screen: a task is done only when the experience's own check passes on the exact model state, a graded answer is
// compared as an exact value, and success on a new problem counts as independent only on the first try with no hint.
// No DOM, no storage, no randomness (a seed arrives in the session).
import { L, parseRational, seeded } from "./kernel.js";

export const SESSION_VERSION = 1;
export const MAX_TEXT = 500;
export const MAX_HINTS = 3;
export const STEP_KINDS = ["ask", "task", "explain", "transfer", "diagnose"];

export function newSession(exp, { seed = 1, input = null, support = "frames" } = {}) {
  return {
    v: SESSION_VERSION,
    exp: exp.id,
    seed: Math.trunc(seed) >>> 0 || 1,
    support,
    step: 0,
    answers: {},
    tasks: {},
    hints: {},
    tries: {},
    explain: {},
    transfer: {},
    probes: {},
    input,
    errors: exp.detect && input ? errorTagsOf(exp, input) : [],
    done: false,
  };
}

function errorTagsOf(exp, input) {
  const result = exp.detect(input);
  return result && !result.correct && result.tag ? [result.tag] : [];
}

export const currentStep = (exp, session) => exp.steps[Math.min(session.step, exp.steps.length - 1)];

// ---- explanations: read for ideas, never graded -------------------------------------------------------------------
const plain = (text) =>
  String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function ideasIn(text, ideas) {
  const body = plain(text);
  return ideas.filter((idea) => idea.words.some((word) => body.includes(plain(word)))).map((idea) => idea.id);
}

// ---- the problem a transfer step poses right now -------------------------------------------------------------------------
export function transferProblem(step, session, grade = 4) {
  const record = session.transfer[step.id];
  const seed = (session.seed + (record?.round ?? 0) * 7919) >>> 0;
  return step.make(seeded(seed), grade, seed);
}

export function stepDone(exp, session, step = currentStep(exp, session)) {
  switch (step.kind) {
    case "ask":
      return Boolean(session.answers[step.id]) && (step.graded === false || session.answers[step.id].ok);
    case "task":
      return Boolean(session.tasks[step.id]?.done);
    case "explain":
      return Boolean(session.explain[step.id]);
    case "transfer":
      return Boolean(session.transfer[step.id]?.ok);
    case "diagnose":
      return Boolean(session.probes[step.id]);
    default:
      return false;
  }
}

const bump = (map, key) => ({ ...map, [key]: (map[key] || 0) + 1 });
const stepById = (exp, id) => exp.steps.find((s) => s.id === id);

// env: { state, derived } is the live model state for task checks; { grade } picks transfer numbers.
export function reduce(exp, session, action, env = {}) {
  const step = stepById(exp, action.id) || currentStep(exp, session);
  switch (action.type) {
    case "ask": {
      const option = step.options?.find((o) => o.id === action.option);
      if (!option) return session;
      const ok = step.graded === false ? null : Boolean(option.ok);
      const answers = { ...session.answers, [step.id]: { option: option.id, ok } };
      return { ...session, answers, tries: bump(session.tries, step.id) };
    }
    case "task": {
      if (session.tasks[step.id]?.done) return session;
      const result = step.check(env.state, env.derived, session);
      if (!result?.done) return session;
      const tasks = { ...session.tasks, [step.id]: { done: true, hints: session.hints[step.id] || 0, tries: session.tries[step.id] || 0 } };
      return { ...session, tasks };
    }
    case "hint": {
      const used = session.hints[step.id] || 0;
      const total = Math.min(MAX_HINTS, step.hints?.length || 0);
      return used >= total ? session : { ...session, hints: { ...session.hints, [step.id]: used + 1 } };
    }
    case "explain": {
      const text = String(action.text || "").slice(0, MAX_TEXT).trim();
      const picks = Array.isArray(action.picks) ? action.picks.slice(0, 6).map(String) : [];
      if (!text && !picks.length) return session;
      const ideas = ideasIn(text, step.ideas || []);
      const frameOk = (step.frames || []).length && (step.frames || []).every((f, i) => f.ok?.includes(picks[i]));
      const ok = frameOk || ideas.length >= (step.need ?? 1);
      return { ...session, explain: { ...session.explain, [step.id]: { text, picks, ideas, ok } } };
    }
    case "probe": {
      const probe = (step.probes || [])[0];
      const pick = action.option;
      return { ...session, probes: { ...session.probes, [step.id]: { pick, ok: probe ? pick === probe.answer : null } } };
    }
    case "transferTry": {
      const rec = session.transfer[step.id] || { round: 0, tries: 0, hints: 0, ok: false, independent: false };
      if (rec.ok) return session;
      const problem = transferProblem(step, session, env.grade);
      const ok = problem.kind === "answer" ? answerMatches(problem.expect, action.response) : Boolean(problem.check?.(env.state, env.derived));
      const next = { ...rec, tries: rec.tries + 1, ok, independent: ok && rec.tries === 0 && rec.hints === 0 };
      return { ...session, transfer: { ...session.transfer, [step.id]: next } };
    }
    case "transferHint": {
      const rec = session.transfer[step.id] || { round: 0, tries: 0, hints: 0, ok: false };
      const total = transferProblem(step, session, env.grade).hints?.length || 0;
      return rec.ok || rec.hints >= total ? session : { ...session, transfer: { ...session.transfer, [step.id]: { ...rec, hints: rec.hints + 1 } } };
    }
    case "newTransfer": {
      const rec = session.transfer[step.id];
      if (!rec || rec.ok) return session;
      return { ...session, transfer: { ...session.transfer, [step.id]: { round: rec.round + 1, tries: 0, hints: 0, ok: false, independent: false, missed: (rec.missed || 0) + (rec.tries ? 1 : 0) } } };
    }
    case "next": {
      if (!stepDone(exp, session)) return session;
      const step2 = session.step + 1;
      return step2 >= exp.steps.length ? { ...session, step: exp.steps.length - 1, done: true } : { ...session, step: step2 };
    }
    case "back":
      return session.step > 0 ? { ...session, step: session.step - 1, done: false } : session;
    case "input": {
      const clean = (v) => String(v ?? "").trim().slice(0, 10);
      const input = { a: clean(action.a), b: clean(action.b), response: clean(action.response) };
      if (!parseRational(input.a) || !parseRational(input.b) || !parseRational(input.response)) return session;
      return { ...session, input, errors: exp.detect ? errorTagsOf(exp, input) : [], probes: {}, tasks: {}, hints: {}, step: 0 };
    }
    case "repair":
      return { ...session, repaired: true };
    default:
      return session;
  }
}

export function answerMatches(expect, response) {
  const got = parseRational(response);
  const want = parseRational(String(expect));
  return Boolean(got && want && got.eq(want));
}

// ---- evidence: what the learner has actually shown ----------------------------------------------------------------------
export function evidenceOf(exp, session) {
  const asks = exp.steps.filter((s) => s.kind === "ask");
  const predicted = asks.filter((s) => s.revisit || s.graded === false);
  const firstPrediction = predicted[0] ? session.answers[predicted[0].id] : null;
  const tasks = exp.steps.filter((s) => s.kind === "task");
  const taskDone = tasks.filter((s) => session.tasks[s.id]?.done);
  const hintsUsed = Object.values(session.hints).reduce((a, b) => a + b, 0);
  const transferStep = exp.steps.find((s) => s.kind === "transfer");
  const t = transferStep ? session.transfer[transferStep.id] : null;
  const explainSteps = exp.steps.filter((s) => s.kind === "explain");
  const explained = explainSteps.length > 0 && explainSteps.every((s) => session.explain[s.id]?.ok);
  const repairedViaModel = Boolean(session.errors.length) && tasks.length > 0 && taskDone.length === tasks.length;
  const transfer = !t ? "none" : !t.ok ? (t.tries ? "missed" : "none") : t.independent ? "independent" : "scaffolded";
  return {
    predicted: Boolean(firstPrediction),
    predictionRight: firstPrediction ? firstPrediction.ok === true : null,
    built: tasks.length > 0 && taskDone.length === tasks.length,
    constructedAlone: taskDone.length > 0 && taskDone.every((s) => (session.tasks[s.id].hints || 0) === 0),
    hintsUsed: hintsUsed + (t?.hints || 0),
    errors: session.errors,
    repairedViaModel,
    explained,
    transfer,
    demonstrated: transfer === "independent",
    // One plain label per learner, in the order a teacher would care about it.
    label: transfer === "independent" ? "demonstrated" : transfer === "scaffolded" ? "scaffolded" : repairedViaModel ? "repaired" : taskDone.length ? "building" : "started",
  };
}

export const EVIDENCE_TEXT = {
  demonstrated: L("You solved a new problem on your own. That shows you understand it.", "Resolviste un problema nuevo tú solo. Eso muestra que lo entiendes."),
  scaffolded: L("You got there with some help. Try another new one on your own to show it.", "Llegaste con algo de ayuda. Prueba otro nuevo tú solo para mostrarlo."),
  repaired: L("You fixed the idea with the model. Next, show it on a new problem.", "Arreglaste la idea con el modelo. Ahora muéstrala en un problema nuevo."),
  building: L("You are building the idea. Keep going.", "Estás construyendo la idea. Sigue adelante."),
  started: L("You have started. Take the first step.", "Ya empezaste. Da el primer paso."),
};

// A saved session is repaired on read: unknown experiences are dropped, numbers and text are clamped.
export function sanitizeSession(exp, raw) {
  if (!raw || typeof raw !== "object" || raw.exp !== exp.id) return null;
  const int = (v, lo, hi, d) => (Number.isInteger(v) && v >= lo && v <= hi ? v : d);
  const known = new Set(exp.steps.map((s) => s.id));
  const keep = (obj, shape) => Object.fromEntries(Object.entries(obj && typeof obj === "object" ? obj : {}).filter(([k]) => known.has(k)).map(([k, v]) => [k, shape(v)]));
  const base = newSession(exp, { seed: int(raw.seed, 1, 4294967295, 1), input: raw.input && typeof raw.input === "object" ? raw.input : null, support: ["frames", "starter", "free"].includes(raw.support) ? raw.support : "frames" });
  return {
    ...base,
    step: int(raw.step, 0, exp.steps.length - 1, 0),
    done: raw.done === true,
    answers: keep(raw.answers, (v) => ({ option: String(v?.option ?? "").slice(0, 40), ok: v?.ok === null ? null : Boolean(v?.ok) })),
    tasks: keep(raw.tasks, (v) => ({ done: Boolean(v?.done), hints: int(v?.hints, 0, 3, 0), tries: int(v?.tries, 0, 99, 0) })),
    hints: keep(raw.hints, (v) => int(v, 0, 3, 0)),
    tries: keep(raw.tries, (v) => int(v, 0, 99, 0)),
    explain: keep(raw.explain, (v) => ({ text: String(v?.text ?? "").slice(0, MAX_TEXT), picks: Array.isArray(v?.picks) ? v.picks.slice(0, 6).map((p) => String(p).slice(0, 40)) : [], ideas: Array.isArray(v?.ideas) ? v.ideas.slice(0, 8).map((p) => String(p).slice(0, 40)) : [], ok: Boolean(v?.ok) })),
    probes: keep(raw.probes, (v) => ({ pick: String(v?.pick ?? "").slice(0, 20), ok: v?.ok === null ? null : Boolean(v?.ok) })),
    transfer: keep(raw.transfer, (v) => ({ round: int(v?.round, 0, 50, 0), tries: int(v?.tries, 0, 99, 0), hints: int(v?.hints, 0, 3, 0), ok: Boolean(v?.ok), independent: Boolean(v?.independent), missed: int(v?.missed, 0, 50, 0) })),
    errors: Array.isArray(raw.errors) ? raw.errors.slice(0, 6).map((e) => String(e).slice(0, 40)) : base.errors,
    repaired: Boolean(raw.repaired),
  };
}
