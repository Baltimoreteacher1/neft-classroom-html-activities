// Connected Learning Engine — adaptive recommendations for ONE objective, from evidence only.
//
// Inputs are what the learner did: Speaking/Writing/loop entries in the ledger for this objective (what they said
// or wrote, whether the source was cited, whether ideas were linked, supports opened, revisions), Reading/Listening
// results on this objective's ACCESS items, and the teacher's priority (the objective of an assigned pathway wins).
// Rules kept here:
//   * a recommendation is always an activity linked to the SAME objective in the skill graph (graph.isLinked);
//     the objective is never changed here;
//   * every recommendation carries a reason that names the evidence it came from (counts, never a level or score);
//   * with fewer than MIN_EVIDENCE relevant pieces of work it says there is not enough evidence yet and offers the
//     pathway's next stage instead of guessing;
//   * supported work is never counted as independent work.
import { isLinked, objectiveById, resolveKey } from "./graph.js";
import { builtInDef } from "./pathways.js";

export const MIN_EVIDENCE = 3;
const RECENT = 3;
const PRODUCED = /^(speaking|writing|intel:)/;

const used = (supports) => Object.values(supports || {}).some(Boolean);

/**
 * The learner's work that counts for this objective.
 * @returns {{ produced: object[], reads: object[], revisions: number, total: number }}
 */
export function relevantEvidence(objective, snap) {
  const taskIds = new Set(objective.activities.map((a) => a.id));
  const loopById = new Map((snap.loops || []).map((l) => [l.id, l]));
  const produced = [];
  let revisions = 0;
  for (const e of snap.ledger || []) {
    if (!PRODUCED.test(String(e.src || "")) || !objective.evidence.ledger.includes(e.src)) continue;
    const loop = e.src.startsWith("intel:") ? loopById.get(e.attempt) : null;
    // A loop that names another objective belongs to that objective, whatever its Key Language Use.
    const mine = loop
      ? loop.objective
        ? loop.objective === objective.id
        : e.use === objective.keyUse
      : taskIds.has(e.task) || e.use === objective.keyUse;
    if (!mine) continue;
    if (e.kind === "revision") {
      revisions += 1;
      continue;
    }
    const m = e.m || {};
    produced.push({
      id: e.id,
      t: e.t,
      src: e.src,
      task: e.task,
      independent: e.stage === "independent" && !used(e.supports),
      words: Number(m.words) || 0,
      cites: Number.isFinite(m.cites) ? m.cites : null,
      link: Number.isFinite(m.link) ? m.link : null,
      academic: Number.isFinite(m.academic) ? m.academic : null,
    });
  }
  produced.sort((a, b) => String(a.t).localeCompare(String(b.t)));
  const reads = [];
  for (const a of objective.activities) {
    if (a.kind !== "access" || !["Reading", "Listening"].includes(a.domain)) continue;
    const res = snap.record?.(a.band, a.domain, a.level)?.results?.[a.id];
    if (!res || typeof res.ok !== "boolean") continue;
    reads.push({
      id: a.id,
      key: a.key,
      t: res.date || "",
      ok: res.ok,
      independent: res.ok && !res.supportUsed && (res.tries || 1) === 1,
    });
  }
  reads.sort((a, b) => String(a.t).localeCompare(String(b.t)));
  return { produced, reads, revisions, total: produced.length + reads.length };
}

const plural = (n, one, many) => (n === 1 ? one : many);
const pick = (objective, key, data) => {
  const ref = key && isLinked(objective.id, key) ? resolveKey(key, data) : null;
  return ref ? { key, route: ref.route, title: ref.title, kind: ref.kind } : null;
};

/**
 * The next activity for an objective, with its evidence. `state` is progress.pathwayState (optional) so the
 * pathway's own next stage can be offered; `rejected` are need ids the teacher turned off; `followUp` is the
 * teacher's chosen follow-up key.
 * @returns {{ objective, enough, need, activity:{key,route,title,kind}|null, reason:string[], evidence:{counted,of,kind,ids}, linked:boolean }}
 */
export function recommend(
  objectiveId,
  snap,
  { state = null, rejected = [], followUp = "", band = "6-8", data = {} } = {},
) {
  const objective = objectiveById(objectiveId);
  if (!objective) return null;
  const ev = relevantEvidence(objective, snap);
  const nextLinked = state?.stages.find(
    (s) => s.state !== "done" && !s.stage.optional && isLinked(objective.id, s.stage.key),
  );
  const nextStage = nextLinked
    ? {
        key: nextLinked.stage.key,
        route: nextLinked.stage.route,
        title: nextLinked.stage.title,
        kind: nextLinked.stage.kind,
        stageId: nextLinked.stage.id,
      }
    : null;
  const firstFor = () => {
    const a = objective.activities.find(
      (x) => !x.band || x.band === band,
    );
    return pick(objective, a?.key, data);
  };
  const out = (need, activity, reason, evidence, enough = true) => ({
    objective: objective.id,
    enough,
    need,
    activity,
    reason,
    evidence,
    linked: Boolean(activity && (isLinked(objective.id, activity.key) || activity.key === "t")),
  });
  if (ev.total < MIN_EVIDENCE) {
    const activity = nextStage || firstFor();
    return out(
      null,
      activity,
      [
        `There is not enough evidence yet: ${ev.total} ${plural(ev.total, "piece", "pieces")} of work on this goal so far (${MIN_EVIDENCE} are needed before a suggestion). Keep going with the next step: ${activity?.title[0] || ""}.`,
        `Todavía no hay suficiente evidencia: ${ev.total} ${plural(ev.total, "trabajo", "trabajos")} sobre esta meta hasta ahora (se necesitan ${MIN_EVIDENCE} antes de una sugerencia). Sigue con el siguiente paso: ${activity?.title[1] || ""}.`,
      ],
      {
        counted: ev.total,
        of: MIN_EVIDENCE,
        kind: "count",
        ids: [...ev.produced.map((p) => p.id), ...ev.reads.map((r) => r.id)],
      },
      false,
    );
  }
  const need = (id) =>
    rejected.includes(id) ? null : objective.needs.find((n) => n.id === id) || null;
  const recentReads = ev.reads.slice(-RECENT);
  const missed = recentReads.filter((r) => !r.ok);
  const fe = need("find-evidence");
  if (fe && recentReads.length >= 2 && missed.length >= 2) {
    const activity = pick(objective, fe.activity, data);
    return out(
      fe.id,
      activity,
      [
        `In ${missed.length} of your last ${recentReads.length} reading and listening tries for this goal, the answer was not right yet. Practice with: ${activity.title[0]}.`,
        `En ${missed.length} de tus últimos ${recentReads.length} intentos de lectura y escucha para esta meta, la respuesta todavía no era correcta. Practica con: ${activity.title[1]}.`,
      ],
      {
        counted: missed.length,
        of: recentReads.length,
        kind: "reads-missed",
        ids: missed.map((r) => r.id),
      },
    );
  }
  const recent = ev.produced.filter((p) => p.words > 0).slice(-RECENT);
  const feature = (field, id, en, es) => {
    const n = need(id);
    const measured = recent.filter((p) => p[field] !== null);
    const lacking = measured.filter((p) => p[field] === 0);
    if (!n || measured.length < 2 || lacking.length < 2) return null;
    const activity = pick(objective, n.activity, data);
    return out(
      n.id,
      activity,
      [
        `${en(lacking.length, measured.length)} Practice with: ${activity.title[0]}.`,
        `${es(lacking.length, measured.length)} Practica con: ${activity.title[1]}.`,
      ],
      { counted: lacking.length, of: measured.length, kind: id, ids: lacking.map((p) => p.id) },
    );
  };
  const byFeature =
    feature(
      "cites",
      "cite-source",
      (a, b) =>
        `You gave your idea but did not point to the source in ${a} of your last ${b} tries.`,
      (a, b) => `Diste tu idea pero no señalaste la fuente en ${a} de tus últimos ${b} intentos.`,
    ) ||
    feature(
      "link",
      "link-ideas",
      (a, b) =>
        `You wrote or said your ideas without a linking word in ${a} of your last ${b} tries.`,
      (a, b) =>
        `Escribiste o dijiste tus ideas sin una palabra de enlace en ${a} de tus últimos ${b} intentos.`,
    ) ||
    feature(
      "academic",
      "precise-words",
      (a, b) => `You used none of the topic’s own words in ${a} of your last ${b} tries.`,
      (a, b) => `No usaste palabras propias del tema en ${a} de tus últimos ${b} intentos.`,
    );
  if (byFeature) return byFeature;
  const supported = recent.filter((p) => !p.independent);
  const transferOpen = state?.stages.find((s) => s.stage.kind === "transfer" && s.state !== "done");
  if (recent.length >= 2 && supported.length >= 2 && supported.length === recent.length) {
    const activity = transferOpen
      ? {
          key: "t",
          route: "",
          title: transferOpen.stage.title,
          kind: "transfer",
          stageId: transferOpen.stage.id,
        }
      : nextStage || pick(objective, objective.stretch, data);
    return out(
      "more-independent",
      activity,
      [
        `You used help in ${supported.length} of your last ${recent.length} tries, and ${ev.revisions} ${plural(ev.revisions, "revision", "revisions")}. Try this one with the help closed: ${activity.title[0]}.`,
        `Usaste ayuda en ${supported.length} de tus últimos ${recent.length} intentos, y ${ev.revisions} ${plural(ev.revisions, "revisión", "revisiones")}. Prueba esto con la ayuda cerrada: ${activity.title[1]}.`,
      ],
      {
        counted: supported.length,
        of: recent.length,
        kind: "supported",
        ids: supported.map((p) => p.id),
      },
    );
  }
  const own = ev.produced.filter((p) => p.independent);
  if (own.length >= MIN_EVIDENCE && !nextStage) {
    const activity = pick(objective, followUp, data) || pick(objective, objective.stretch, data);
    return out(
      "stretch",
      activity,
      [
        `You did ${own.length} tasks for this goal on your own. Try a longer one for the same goal: ${activity.title[0]}.`,
        `Hiciste ${own.length} tareas para esta meta por tu cuenta. Prueba una más larga para la misma meta: ${activity.title[1]}.`,
      ],
      {
        counted: own.length,
        of: ev.produced.length,
        kind: "independent",
        ids: own.map((p) => p.id),
      },
    );
  }
  const activity =
    nextStage || pick(objective, followUp, data) || pick(objective, objective.stretch, data);
  return out(
    "continue",
    activity,
    [
      `You have ${ev.total} pieces of work on this goal (${own.length} on your own, ${ev.revisions} ${plural(ev.revisions, "revision", "revisions")}). Next: ${activity.title[0]}.`,
      `Tienes ${ev.total} trabajos sobre esta meta (${own.length} por tu cuenta, ${ev.revisions} ${plural(ev.revisions, "revisión", "revisiones")}). Sigue con: ${activity.title[1]}.`,
    ],
    {
      counted: ev.total,
      of: ev.total,
      kind: "count",
      ids: [...ev.produced.map((p) => p.id), ...ev.reads.map((r) => r.id)],
    },
  );
}

/**
 * Which objective to recommend for. A pathway the teacher assigned wins; then the pathway the learner is on.
 * `assignments` is the class list ({ id, title, path }); `runs` the progress store.
 * @returns {{ objective:string, source:"teacher"|"pathway", runKey:string, path:string } | null}
 */
export function priorityObjective({ assignments = [], runs = { runs: {}, active: "" } } = {}) {
  for (const a of assignments) {
    const m = /\/pathways\/([a-z0-9-]+)(?:\?(.*))?$/.exec(String(a?.path || ""));
    if (!m) continue;
    const run = Object.values(runs.runs || {}).find((r) => String(a.id || "") === `pw:${r.key}`.slice(0, 40));
    const named = m[1] === "c" ? new URLSearchParams(m[2] || "").get("o") : builtInDef(m[1])?.objective;
    const objective = run?.objective || (objectiveById(named) ? named : "");
    if (objective) return { objective, source: "teacher", runKey: run?.key || "", path: a.path };
  }
  const run = runs.runs?.[runs.active];
  return run
    ? { objective: run.objective, source: "pathway", runKey: run.key, path: run.back || "" }
    : null;
}
