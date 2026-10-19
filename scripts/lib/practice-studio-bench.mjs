// The learning-lab bench inside a Practice Studio: contract checks for `bench` in data/practice-studio/<lesson>.json
// (docs/specs/practice-studio-v2.md section 9) and the studio items it becomes. Pure functions.
//
// The mathematics is the labs' own: every goal is checked against curriculum/learning-labs/shared/math.mjs, the same
// module the page runs, by SEARCH — a goal that no setting of its free control reaches fails here, not in a classroom.
import { controls, evaluate, puzzle } from "../../curriculum/learning-labs/shared/math.mjs";
import { itemProblems } from "./practice-studio-data.mjs";

const str = (v, min = 2) => typeof v === "string" && v.trim().length >= min;
const round6 = (n) => Number(n.toFixed(6));
const TIMER = /\b(timer|countdown|count down|beat the clock|against the clock)\b/i;

/** Every setting of control `index` the model allows, in order. */
export function settingsOf(model, index) {
  const f = controls(model)[index];
  const steps = Math.round((f.max - f.min) / f.step);
  return Array.from({ length: steps + 1 }, (_, i) => round6(f.min + i * f.step));
}

const withValue = (values, i, v) => values.map((x, j) => (j === i ? v : x));
const valueAt = (model, i, v) => {
  try {
    return evaluate(model, withValue(model.values, i, v)).value;
  } catch {
    return Number.NaN;
  }
};

/** The settings of the free control that reach goal.target (empty when none does). */
export function targetSolutions(model, goal) {
  return settingsOf(model, goal.free).filter(
    (v) => Math.abs(valueAt(model, goal.free, v) - goal.target) < 1e-6,
  );
}

/** Which of the three goal shapes this is: reach a readout, set controls to exact values, or pass/fail a rule. */
export const goalType = (goal) =>
  goal && "target" in goal
    ? "target"
    : goal && "match" in goal
      ? "match"
      : goal && "pass" in goal
        ? "pass"
        : null;

function modelProblems(model, lab, where) {
  const p = [];
  const bad = (m) => p.push(`${where}: ${m}`);
  if (!model || typeof model !== "object") return [`${where}: model missing`];
  if (lab && model.kind !== lab.model)
    bad(`model kind "${model.kind}" differs from the lab's "${lab.model}"`);
  let fields;
  try {
    fields = controls(model);
  } catch (e) {
    return [...p, `${where}: ${e.message}`];
  }
  if (!Array.isArray(model.values) || model.values.length !== fields.length)
    return [...p, `${where}: needs ${fields.length} values`];
  model.values.forEach((v, i) => {
    const f = fields[i];
    const onGrid = Math.abs((v - f.min) / f.step - Math.round((v - f.min) / f.step)) < 1e-7;
    if (!(v >= f.min && v <= f.max && onGrid))
      bad(`value ${i} (${v}) is outside "${f.label}" ${f.min}-${f.max} step ${f.step}`);
  });
  try {
    evaluate(model, model.values);
  } catch (e) {
    bad(`the model does not evaluate: ${e.message}`);
  }
  return p;
}

function goalProblems(model, goal, where) {
  const p = [];
  const bad = (m) => p.push(`${where}.goal: ${m}`);
  const type = goalType(goal);
  const fields = controls(model);
  const start = evaluate(model, model.values);
  if (type === "target") {
    if (!Number.isFinite(goal.target)) return [`${where}.goal: target must be a number`];
    if (!Number.isInteger(goal.free) || goal.free < 0 || goal.free >= fields.length)
      return [`${where}.goal: free must be a control index`];
    if (fields[goal.free].min === fields[goal.free].max) bad("the free control is fixed");
    if (Math.abs(start.value - goal.target) < 1e-6) bad("the model already starts at the target");
    if (!targetSolutions(model, goal).length)
      bad(
        `no setting of "${fields[goal.free].label}" reaches ${goal.target} (the readout is ${start.label})`,
      );
  } else if (type === "match") {
    const entries = Object.entries(goal.match || {});
    if (!entries.length) bad("match needs at least one control index");
    for (const [k, v] of entries) {
      const i = Number(k);
      if (!Number.isInteger(i) || !fields[i]) bad(`match index "${k}" is not a control`);
      else if (!settingsOf(model, i).includes(round6(v)))
        bad(`match value ${v} is not a setting of control ${i}`);
    }
    if (entries.length && entries.every(([k, v]) => model.values[Number(k)] === v))
      bad("the model already starts on the match");
  } else if (type === "pass") {
    if (model.kind !== "inequality") bad("pass goals are for inequality models");
    if (typeof goal.pass !== "boolean") bad("pass must be true or false");
    else if (start.pass === goal.pass) bad("the model already starts on the requested outcome");
  } else bad("needs target+free, match, or pass");
  return p;
}

const hintsHold = (h) =>
  Array.isArray(h) && h.length >= 2 && h.length <= 3 && h.every((x) => str(x, 4));

function taskProblems(task, model, where, { stretch }) {
  const p = [];
  const bad = (m) => p.push(`${where}: ${m}`);
  if (!task || typeof task !== "object") return [`${where}: missing`];
  for (const f of ["q", "qEs", "x", "xEs"]) if (!str(task[f], 12)) bad(`${f} must be a sentence`);
  if (task.q === task.qEs || task.x === task.xEs) bad("the Spanish sibling is the English text");
  if (String(task.q).split(/\s+/).length > 55)
    bad("q is over 55 words; a Grade 6 reader needs it shorter");
  if (!hintsHold(task.h) || !hintsHold(task.hEs))
    bad("needs hint ladders h[] and hEs[] of 2-3 hints each");
  if (TIMER.test(`${task.q} ${task.x} ${(task.h || []).join(" ")}`))
    bad("timer language is banned");
  if (/\d\s[x*]\s\d/.test(`${task.q} ${task.x} ${(task.h || []).join(" ")}`))
    bad('use "×" between numbers');
  if (stretch && !str(task.miss, 12))
    bad("a stretch task needs a `miss` line that says what to reconsider");
  if (task.miss && !str(task.missEs, 12)) bad("miss needs missEs");
  p.push(...goalProblems(model, task.goal, where));
  // A hint may not state the answer: the control setting that solves a target goal.
  if (goalType(task.goal) === "target" && Number.isInteger(task.goal.free)) {
    for (const v of targetSolutions(model, task.goal)) {
      const rx = new RegExp(`(^|[^\\d.])${String(v).replace(".", "\\.")}([^\\d]|$)`);
      if (String(v).length >= 2 && (task.h || []).some((h) => rx.test(h)))
        bad(`a hint states the answer (${v})`);
    }
  }
  return p;
}

const tokenIn = (text, v) =>
  new RegExp(`(^|[^\\d.])${String(v).replace(".", "\\.")}([^\\d]|$)`).test(String(text));
/** How a solving value may be written in a Grade 6 explanation: 5.5, 5 1/2 or 11/2. */
function writtenForms(v) {
  const forms = [String(v)];
  if (!Number.isInteger(v))
    for (let d = 2; d <= 12; d++) {
      const n = Math.round(Math.abs(v) * d);
      if (Math.abs(Math.abs(v) - n / d) < 1e-9) {
        const sign = v < 0 ? "-" : "";
        const whole = Math.floor(n / d);
        forms.push(`${sign}${whole} ${n % d}/${d}`, `${sign}${n}/${d}`);
        break;
      }
    }
  return forms;
}
const mentions = (text, v) => writtenForms(v).some((f) => tokenIn(text, f));
const fields = (task) => [task.q, task.x, task.miss, ...(task.h || [])].filter(Boolean).join(" ");

/**
 * Design checks on a goal: not solved by one click past the start or by pushing a slider to its end, and the readout the page
 * prints at the start does not already show the solving value.
 */
function reasoningProblems(model, task, where) {
  const p = [];
  const goal = task.goal;
  if (goalType(goal) !== "target") return p;
  const start = evaluate(model, model.values);
  const grid = settingsOf(model, goal.free);
  const from = grid.indexOf(round6(model.values[goal.free]));
  for (const v of targetSolutions(model, goal)) {
    const at = grid.indexOf(v);
    if (Math.abs(at - from) < 2)
      p.push(
        `${where}.goal: the solving value ${v} is within one step of the start; a single click solves it`,
      );
    if (at === 0 || at === grid.length - 1)
      p.push(
        `${where}.goal: the solving value ${v} is at the end of its slider; pushing to the end solves it`,
      );
    if (
      (String(v).length >= 2 || !Number.isInteger(v)) &&
      tokenIn(`${start.equation} ${start.note}`, v)
    )
      p.push(`${where}.goal: the starting readout already prints the solving value ${v}`);
  }
  // the explanation shown after success must name the value that solved it (a stale x after a re-author is the failure this catches)
  const sols = targetSolutions(model, goal);
  if (sols.length && !sols.some((v) => mentions(task.x, v) && mentions(task.xEs, v)))
    p.push(
      `${where}.x/xEs: the explanation does not state the solving value (${sols.join(" or ")}) in both languages`,
    );
  // text that names the readout "Output" must be about a model that calls it that
  if (/\bOutput\b/.test(fields(task)) && start.label !== "Output")
    p.push(`${where}: text says "Output" but this model's readout is "${start.label}"`);
  return p;
}

/** The mission builds nine puzzles per model (3 destinations x 3 levels). Each must be plannable, not a coin flip. */
export function missionProblems(model, where) {
  const p = [];
  if (
    ["inequality"].includes(model.kind) ||
    (model.kind === "coordinates" && ["reflect", "symmetry"].includes(model.mode))
  )
    return p;
  const targets = new Set();
  for (let level = 0; level < 3; level++)
    for (let round = 0; round < 3; round++) {
      const q = puzzle(model, round, level);
      const tag = `${where}.mission r${round} L${level}`;
      // a balance always aims at 0; what differs from one puzzle to the next is the value that balances it
      // every value the puzzle sets must be one the page's own controls accept, or the build is refused as "invalid input"
      controls(model).forEach((c, i) => {
        for (const [name, vals] of [
          ["start", q.start],
          ["goal", q.goal],
        ])
          if (!(vals[i] >= c.min - 1e-9 && vals[i] <= c.max + 1e-9))
            p.push(
              `${tag}: the ${name} sets "${c.label}" to ${vals[i]}, outside ${c.min}-${c.max}`,
            );
      });
      targets.add(round6(model.kind === "balance" ? q.goal[q.free] : q.target));
      if (Math.abs(evaluate(model, q.start).value - q.target) < 1e-6)
        p.push(`${tag}: starts already solved`);
      // a regular polygon's area is irrational for every side count but 4: the page says "approximately" and the lesson rounds
      if (
        !(model.kind === "area" && model.mode === "polygon") &&
        Math.abs(q.target * 100 - Math.round(q.target * 100)) > 1e-6
      )
        p.push(`${tag}: the target ${q.target} is a repeating decimal a student cannot plan`);
      const f = controls(model)[q.free];
      const sols = settingsOf(model, q.free).filter(
        (v) => Math.abs(evaluate(model, withValue(q.start, q.free, v)).value - q.target) < 1e-6,
      );
      if (sols.length > 4)
        p.push(`${tag}: ${sols.length} settings of "${f.label}" solve it (guessing, not planning)`);
    }
  if (targets.size < 3)
    p.push(
      `${where}.mission: the nine puzzles share ${targets.size} target(s); they should differ`,
    );
  return [...new Set(p)];
}

/** Problems with data/practice-studio/<id>.json -> bench. `labs` is data/learning-labs.json (optional). */
export function benchProblems(id, bench, labs = null) {
  const p = [];
  const where = `${id}.bench`;
  if (!bench || typeof bench !== "object") return [`${where}: missing`];
  const lab = labs?.labs?.find((l) => l.id === bench.lab);
  if (labs) {
    if (!lab) p.push(`${where}.lab: "${bench.lab}" is not a learning lab`);
    else if (!lab.lessons.includes(id))
      p.push(`${where}.lab: "${bench.lab}" does not cover lesson ${id}`);
  }
  const mp = modelProblems(bench.model, lab, `${where}.model`);
  p.push(...mp);
  if (mp.length) return p;
  p.push(...taskProblems(bench.explore, bench.model, `${where}.explore`, { stretch: false }));
  p.push(...taskProblems(bench.stretch, bench.model, `${where}.stretch`, { stretch: true }));
  p.push(...reasoningProblems(bench.model, bench.explore, `${where}.explore`));
  p.push(...reasoningProblems(bench.model, bench.stretch, `${where}.stretch`));
  p.push(...missionProblems(bench.model, where));
  if (
    bench.explore?.goal &&
    bench.stretch?.goal &&
    JSON.stringify(bench.explore.goal) === JSON.stringify(bench.stretch.goal)
  )
    p.push(`${where}: explore and stretch share one goal`);
  for (const name of ["investigate", "create"]) {
    const it = bench[name];
    p.push(...itemProblems({ k: "wr", ...it }, `${where}.${name}`));
  }
  const m = bench.mission;
  if (!m || !str(m.finale, 3)) p.push(`${where}.mission: needs a finale (the lab's game name)`);
  else if (["q", "qEs", "x", "xEs"].some((f) => f in m))
    p.push(
      `${where}.mission: its text is generated from the model (what the game really asks); remove q, qEs, x, xEs`,
    );
  return p;
}

/**
 * What the mission game actually asks, said from the model so the text can never promise more than the game does. The expedition
 * unlocks ONE control (or, for a reflection, one coordinate), states a target, and checks the build only when the student tests it.
 */
export function missionText(model) {
  const x = {
    en: "You planned each build from the relationship, tested it, and revised your plan when a test missed.",
    es: "Planeaste cada construcción a partir de la relación, la probaste y revisaste tu plan cuando una prueba falló.",
  };
  if (model.kind === "balance")
    return {
      q: {
        en: "At each stop, set the candidate value of x so both sides of the equation are equal. Plan the value, then test it.",
        es: "En cada parada, ajusta el valor candidato de x para que los dos lados de la ecuación sean iguales. Planea el valor y luego pruébalo.",
      },
      x,
    };
  if (model.kind === "inequality")
    return {
      q: {
        en: "At each stop, find a test value that the rule lets in or turns away, as the stop asks. Test the boundary number first.",
        es: "En cada parada, halla un valor de prueba que la regla deje pasar o rechace, según pida la parada. Prueba primero el número límite.",
      },
      x,
    };
  if (model.kind === "coordinates" && ["reflect", "symmetry"].includes(model.mode))
    return {
      q: {
        en: "At each stop, move one point to the reflection of the other across the axis the stop names. Plan its coordinates, then test.",
        es: "En cada parada, mueve un punto a la reflexión del otro sobre el eje que nombra la parada. Planea sus coordenadas y luego prueba.",
      },
      x,
    };
  return {
    q: {
      en: "At each stop, plan the one unlocked control so the model reaches the target, then test your build.",
      es: "En cada parada, planea el único control desbloqueado para que el modelo llegue a la meta y luego prueba tu construcción.",
    },
    x,
  };
}

const stripEs = ({ miss, missEs, ...rest }) => ({ ...rest, ...(miss ? { miss, missEs } : {}) });

/** The studio items a bench contributes: { practice: { before, after }, challenge: { before, after } } for the right section. */
export function benchItems(bench) {
  const lab = (id, task, level) => ({
    k: "lab",
    id,
    lab: bench.lab,
    model: bench.model,
    level,
    ...stripEs(task),
  });
  const text = missionText(bench.model);
  const mission = (id, level) => ({
    k: "mission",
    id,
    lab: bench.lab,
    model: bench.model,
    level,
    finale: bench.mission.finale,
    q: text.q.en,
    qEs: text.q.es,
    x: text.x.en,
    xEs: text.x.es,
  });
  return {
    // Practice section 4 ("new numbers every time"): explore the model, write what you found, then the mission.
    practice: {
      before: [
        lab("lab-explore", bench.explore, "core"),
        { k: "wr", id: "lab-investigate", ...bench.investigate },
      ],
      after: [mission("lab-mission", "core")],
    },
    // Challenge section 3 (the lab): a stretch target first, then design and explain, then the stretch mission.
    challenge: {
      before: [lab("lab-stretch", bench.stretch, "stretch")],
      after: [{ k: "wr", id: "lab-create", ...bench.create }, mission("lab-mission", "stretch")],
    },
  };
}
