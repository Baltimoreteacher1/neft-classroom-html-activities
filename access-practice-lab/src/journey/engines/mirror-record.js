// Growth Mirror records: the independent summary, the Before -> After -> On my own growth record, and ledger entries.
// Supported practice and independent performance stay separate. Counts only; never a score, level or percentage.
import { analyzeResponse } from "../../lang/analyze.js";
import { analysisOpts, copyOf, featureCounts, kluOf, pair, pickTarget, supportsFromHelps, taskOpts } from "./mirror-core.js";
import { evaluateRevision } from "./mirror-revision.js";

export const INDEPENDENT_SHARE = 0.6;

// ── Growth record and independent summary ───────────────────────────────────────


/**
 * The independent attempt, read against the rule for "shown on my own": no help opened AND at least minWords AND at least
 * ceil(60% of the required moves) made. Anything else is "completed with support" and names ONE supportive next step.
 * Never fails or blocks: the learner always moves forward.
 */
export function independentSummary(text, opts = {}) {
  const { supportsUsed = [], minWords = 0, keyUse = "Explain" } = opts;
  const a = analyzeResponse(String(text || ""), {
    ...analysisOpts(opts.task || {}, keyUse, "independent"),
    ...opts.analysis,
    keyUse,
    stage: "independent",
  });
  const required = a.purpose.moves.filter((m) => m.required);
  const made = required.filter((m) => m.present);
  const needed = Math.ceil(required.length * INDEPENDENT_SHARE);
  const helpOpened = supportsUsed.length > 0;
  const minWordsMet = a.words >= minWords;
  const movesMet = made.length >= needed;
  const independent = !helpOpened && minWordsMet && movesMet;
  const missing = required.filter((m) => !m.present);
  const reasons = [
    helpOpened && "help-opened",
    !minWordsMet && "too-short",
    !movesMet && "moves",
  ].filter(Boolean);
  let nextStep = null;
  const pick = missing[0]?.id || (!minWordsMet ? "develop" : null);
  if (pick) {
    const c = copyOf(pick);
    const move = a.purpose.moves.find((m) => m.id === pick);
    nextStep = {
      moveId: pick,
      label: c.label[0],
      labelEs: c.label[1],
      ask: move?.ask || c.ask[0],
      askEs: c.ask[1],
      why: pair(c.why),
      kind: independent ? "stretch" : "support",
    };
  }
  return {
    status: independent ? "independently-demonstrated" : "completed-with-support",
    independent,
    words: a.words,
    minWords,
    minWordsMet,
    helpOpened,
    required: required.length,
    made: made.length,
    needed,
    madeIds: made.map((m) => m.id),
    missingIds: missing.map((m) => m.id),
    reasons,
    nextStep,
    features: featureCounts(a),
  };
}

const T2 = (en, es) => ({ en, es });
const linesFor = (rev, indep, firstF) => {
  const out = [];
  if (!rev.changed)
    out.push(T2("I kept my first response as it was.", "Dejé mi primera respuesta como estaba."));
  for (const o of rev.observable.filter((x) => x.kind === "move")) {
    const span = o.evidenceSpan ? ` (“${o.evidenceSpan}”)` : "";
    out.push(
      T2(
        `${o.what}: ${o.from} in my first response, ${o.to} in my revision${span}.`,
        `${o.whatEs}: ${o.fromEs} en mi primera respuesta, ${o.toEs} en mi revisión${span}.`,
      ),
    );
  }
  for (const o of rev.observable.filter((x) => x.kind === "feature"))
    out.push(
      T2(
        `${o.what}: ${o.from} then ${o.to} ${o.unit}.`,
        `${o.whatEs}: ${o.fromEs} y luego ${o.toEs}.`,
      ),
    );
  if (indep) {
    const f = indep.features;
    out.push(
      T2(
        `In my new try on my own I made ${f.movesMade} of ${f.movesRequired} moves the task looks for. My first response had ${firstF.movesMade} of ${firstF.movesRequired}.`,
        `En mi nuevo intento por mi cuenta hice ${f.movesMade} de ${f.movesRequired} pasos que busca la tarea. Mi primera respuesta tenía ${firstF.movesMade} de ${firstF.movesRequired}.`,
      ),
    );
    if (f.linkKinds !== firstF.linkKinds)
      out.push(
        T2(
          `Ways I linked ideas: ${firstF.linkKinds} then ${f.linkKinds}.`,
          `Maneras en que conecté ideas: ${firstF.linkKinds} y luego ${f.linkKinds}.`,
        ),
      );
  }
  return out;
};

/**
 * Before -> After -> On my own for one mission. `prior`: { communicate: {text, supportsUsed}, improve: {target, before, after,
 * why, supportsUsed, kept} }; `showResult`: { text, supportsUsed? } or null. `opts`: { keyUse, communicateTask, showTask }.
 * Supported practice (first response, revision) is kept apart from the independent attempt in `separation`.
 */
export function growthRecord(missionId, band, prior, showResult = null, opts = {}) {
  const comm = prior?.communicate;
  const imp = prior?.improve;
  const firstText = String(imp?.before ?? comm?.text ?? "");
  if (!firstText.trim()) return null;
  const keyUse = kluOf(missionId, opts);
  const commTask = opts.communicateTask || opts.tasks?.communicate || {};
  const showTask = opts.showTask || opts.tasks?.show || null;
  const commOpts = analysisOpts(commTask, keyUse);
  const firstA = analyzeResponse(firstText, commOpts);
  const afterText = String(imp?.after ?? firstText);
  const kept = Boolean(imp?.kept) || !imp;
  const targetId = imp?.target || pickTarget(firstA, keyUse, band).id;
  const c = copyOf(targetId);
  const target = { id: targetId, label: c.label[0], labelEs: c.label[1], why: pair(c.why) };
  const rev = kept
    ? { changed: false, targetFixed: false, observable: [], gained: [], lost: [] }
    : evaluateRevision(firstText, afterText, { target: targetId, keyUse, analysis: commOpts });
  const revA = analyzeResponse(afterText, commOpts);
  const firstF = featureCounts(firstA);
  const indep = showResult?.text
    ? independentSummary(showResult.text, {
        supportsUsed: showResult.supportsUsed || [],
        minWords: showTask?.minWords || 0,
        keyUse,
        task: showTask || {},
      })
    : null;
  const revSupports = [...new Set([...(imp?.supportsUsed || []), "feedback"])];
  const record = {
    v: 1,
    missionId,
    band,
    keyUse,
    tasks: { communicate: taskOpts(commTask), show: taskOpts(showTask) },
    first: {
      text: firstText,
      features: firstF,
      supported: (comm?.supportsUsed || []).length > 0,
      supportsUsed: [...(comm?.supportsUsed || [])],
    },
    revision: {
      text: afterText,
      target,
      changed: rev.changed,
      targetFixed: rev.targetFixed,
      observable: rev.observable,
      features: featureCounts(revA),
      supported: true,
      supportsUsed: revSupports,
      why: imp?.why || null,
    },
    independent: indep
      ? {
          text: String(showResult.text),
          features: indep.features,
          supported: indep.helpOpened,
          demonstrated: indep.independent,
          status: indep.status,
          summary: {
            made: indep.made,
            required: indep.required,
            needed: indep.needed,
            minWords: indep.minWords,
            minWordsMet: indep.minWordsMet,
            reasons: indep.reasons,
          },
          nextStep: indep.nextStep,
        }
      : null,
    separation: {
      supportedPractice: [
        { id: "first", supports: [...(comm?.supportsUsed || [])] },
        { id: "revision", supports: revSupports },
      ],
      demonstratedIndependent: Boolean(indep?.independent),
      independentAttempted: Boolean(indep),
    },
  };
  record.changeLines = linesFor(rev, indep, firstF);
  return record;
}

/** Add (or replace) the independent attempt on a record that only holds first + revision. */
export function withIndependent(record, showResult, opts = {}) {
  if (!record || !showResult?.text) return record;
  const prior = {
    communicate: { text: record.first.text, supportsUsed: record.first.supportsUsed },
    improve: {
      target: record.revision.target.id,
      before: record.first.text,
      after: record.revision.text,
      supportsUsed: record.revision.supportsUsed.filter((x) => x !== "feedback"),
      why: record.revision.why,
      kept: !record.revision.changed,
    },
  };
  return growthRecord(record.missionId, record.band, prior, showResult, {
    keyUse: record.keyUse,
    tasks: record.tasks,
    ...opts,
  });
}

/** A record from saved step results (`steps` = a mission's `steps` map, results under `data.result`). Null before Improve is done. */
export function recordFromSteps(missionId, band, steps = {}, opts = {}) {
  const imp = steps.improve?.data?.result;
  if (steps.improve?.status !== "done" || !imp) return null;
  return growthRecord(
    missionId,
    band,
    { communicate: steps.communicate?.data?.result, improve: imp },
    steps.show?.data?.result || null,
    opts,
  );
}

// ── Ledger entries ───────────────────────────────────────────────────────────────

const DOMAIN_OF_MODE = { write: "Writing", speak: "Speaking", discuss: "Speaking" };

/**
 * Partial ledger entry for `appendEntry`. kind "revision": always supported (the feedback is the support), "guided" once
 * a model was opened. kind "transfer": independent only when no help was opened.
 */
export function ledgerEntry(
  kind,
  { missionId, band, text, helps = [], supportsUsed, mode = "write", keyUse, task = {} },
) {
  const klu = kluOf(missionId, { keyUse });
  const opened = kind === "revision" ? helps : supportsUsed || helps;
  const supports = supportsFromHelps(opened);
  const independent = kind === "transfer" && !opened.length;
  const stage =
    kind === "revision"
      ? supports.model
        ? "guided"
        : "supported"
      : independent
        ? "independent"
        : "supported";
  const a = analyzeResponse(
    String(text || ""),
    analysisOpts(task, klu, independent ? "independent" : "supported"),
  );
  return {
    src: "mission",
    task: `${missionId}.${kind === "revision" ? "improve" : "show"}`,
    band,
    domain: DOMAIN_OF_MODE[mode] || "Writing",
    use: klu,
    stage,
    kind,
    supports,
    m: a.ledger,
  };
}

