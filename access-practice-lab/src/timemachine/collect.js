// Language Time Machine — collect comparable evidence (docs/part2-integration-map.md, system D).
// One list of the learner's own writing and speaking, read from what the lab already keeps: Writing Studio versions,
// Speaking Studio takes, Language World drafts, warm-up sentences, Adventure World artifacts and the feedback loops
// (src/intel/loop.js). Nothing is copied into a second store and nothing here writes: every function is pure given
// the documents passed in, and never changes them.
//
// Rules this module keeps:
//  * A pair is built only when it is fair to compare: the same domain AND (the same task, or the same Key Language
//    Use in a different context). Never across domains, never an item with itself, earlier strictly before later.
//  * Each item keeps its own support context. A revision is always supported; only work with no help is independent.
//  * No number here is a score. Length is never read as growth.
const asArray = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const clean = (v) => String(v ?? "").trim();
const usedAny = (supports) => Object.values(obj(supports)).some(Boolean);
const isDate = (t) => /^\d{4}-\d{2}-\d{2}/.test(String(t || ""));

export const DOMAINS = Object.freeze(["Writing", "Speaking"]);
export const REASONS = Object.freeze({ SAME_TASK: "same-task", SAME_GOAL: "same-goal" });
/** How many pairs one page lists (the newest first). The list is evidence to read, not a count to grow. */
export const MAX_PAIRS = 40;

function item(base) {
  const supports = obj(base.supports);
  const stage = base.stage || "first";
  return {
    id: base.id,
    kind: base.domain === "Speaking" ? "speaking" : "writing",
    taskId: String(base.taskId || ""),
    taskTitle: clean(base.taskTitle) || String(base.taskId || ""),
    prompt: clean(base.prompt),
    keyUse: base.keyUse || "",
    domain: base.domain === "Speaking" ? "Speaking" : "Writing",
    t: String(base.t || ""),
    text: clean(base.text),
    source: base.source === "transcript" ? "transcript" : "typed",
    audioId: base.audioId || "",
    supports,
    independent: stage !== "revision" && !usedAny(supports) && base.independent !== false,
    stage,
    src: base.src,
    teacherNote: clean(base.teacherNote),
    loopId: base.loopId || "",
    attempt: base.attempt || 0,
  };
}

function fromWritingStudio(studio, tasks) {
  const out = [];
  for (const [id, w] of Object.entries(obj(studio?.writing))) {
    const meta = obj(tasks?.writing?.[id]);
    const versions = asArray(w?.versions).filter((v) => clean(v?.text));
    const used = {
      frames: Boolean(w?.used?.frames),
      bank: Boolean(w?.used?.bank),
      model: Boolean(w?.used?.model),
    };
    versions.forEach((v, n) => {
      const revision = n > 0;
      out.push(
        item({
          id: `w:${id}:${v.id || n}`,
          taskId: id,
          taskTitle: meta.title,
          prompt: meta.prompt,
          keyUse: meta.keyUse || "",
          domain: "Writing",
          t: v.t,
          text: v.text,
          supports: revision ? { ...used, coach: true } : used,
          independent: w?.stage ? w.stage === "independent" : undefined,
          stage: revision ? "revision" : "first",
          src: "write",
        }),
      );
    });
  }
  return out;
}

function fromSpeakingStudio(studio, tasks) {
  const out = [];
  for (const [id, s] of Object.entries(obj(studio?.speaking))) {
    const meta = obj(tasks?.speaking?.[id]);
    const used = {
      frames: Boolean(s?.used?.frames),
      bank: Boolean(s?.used?.bank),
      model: Boolean(s?.used?.model),
    };
    asArray(s?.takes).forEach((take, n) => {
      if (!take?.id) return;
      const note = asArray(take.teacherReview)
        .map((r) => (typeof r === "string" ? r : r?.comment || r?.note || ""))
        .filter(Boolean)
        .join(" ");
      out.push(
        item({
          id: `s:${id}:${take.id}`,
          taskId: id,
          taskTitle: meta.title,
          prompt: meta.prompt,
          keyUse: meta.keyUse || "",
          domain: "Speaking",
          t: take.t,
          text: take.transcript,
          source: String(take.transcriptSource || "").startsWith("speech") ? "transcript" : "typed",
          audioId: take.id,
          supports: n > 0 ? { ...used, coach: true } : used,
          independent: s?.stage ? s.stage === "independent" : undefined,
          stage: n > 0 ? "revision" : "first",
          src: "speak",
          teacherNote: note,
        }),
      );
    });
  }
  return out;
}

function fromExhibition(exhibition) {
  const out = [];
  for (const [band, b] of Object.entries(obj(exhibition?.bands)))
    asArray(b?.tasks?.write?.attempts).forEach((a, n) => {
      // The Language World keeps a first attempt (prompt "main") and later attempts on a new prompt ("transfer").
      const transfer = a?.prompt === "transfer";
      const helped = a?.kind !== "independent" || asArray(a?.helpUsed).length > 0;
      asArray(a?.drafts)
        .filter((d) => clean(d?.text))
        .forEach((d, i) =>
          out.push(
            item({
              id: `x:${band}:${n}:${i}`,
              taskId: `exhibition-${band}-write${transfer ? "-new" : ""}`,
              taskTitle: transfer ? "Language World: new task" : "Language World: writing",
              keyUse: "Explain",
              domain: "Writing",
              t: d.at,
              text: d.text,
              supports: i > 0 ? { help: helped, coach: true } : { help: helped },
              stage: i > 0 ? "revision" : transfer ? "transfer" : "first",
              src: "exhibition",
            }),
          ),
        );
    });
  return out;
}

function fromWarmup(warmup) {
  const out = [];
  for (const [k, d] of Object.entries(obj(warmup?.days))) {
    const text = clean(d?.q?.text);
    if (text.split(/\s+/).filter(Boolean).length < 3) continue;
    out.push(
      item({
        id: `q:${k}`,
        taskId: `warmup-${k}`,
        taskTitle: "Daily warm-up sentence",
        domain: "Writing",
        t: d.at || `${k.split("|")[1]}T12:00:00`,
        text,
        src: "warmup",
      }),
    );
  }
  return out;
}

function fromAdventures(adventures) {
  const out = [];
  for (const [world, bands] of Object.entries(obj(adventures)))
    for (const [band, missions] of Object.entries(obj(bands)))
      for (const [mission, e] of Object.entries(obj(missions))) {
        const text = clean(e?.artifact?.text);
        if (!text) continue;
        out.push(
          item({
            id: `a:${world}:${band}:${mission}`,
            taskId: `adventure-${world}-${mission}`,
            taskTitle: e.artifact.title?.en || mission,
            domain: "Writing",
            t: e.artifact.at,
            text,
            src: "adventure",
          }),
        );
      }
  return out;
}

function fromReality(reality) {
  const out = [];
  for (const [key, progress] of Object.entries(obj(reality?.progress))) {
    const attempts = asArray(progress?.attempts);
    attempts.forEach((attempt, n) => {
      if (!clean(attempt?.text) || !isDate(attempt?.t)) return;
      out.push(item({
        id: `r:${key}:${n}`,
        taskId: `reality-${key}`,
        taskTitle: attempt.title || "Language Reality mission",
        keyUse: attempt.keyUse || "Explain",
        domain: "Writing",
        t: attempt.t,
        text: attempt.text,
        supports: { frames: attempt.supportTier !== "C", coach: n > 0 },
        stage: n > 0 ? "revision" : "first",
        src: "reality",
      }));
    });
  }
  return out;
}

const LOOP_STAGE = { response: "first", revision: "revision", transfer: "transfer" };

function fromLoops(intel) {
  const out = [];
  for (const loop of Object.values(obj(intel?.loops))) {
    const task = obj(loop?.task);
    const teacher = loop?.stages?.review?.teacher;
    for (const [stage, kind] of Object.entries(LOOP_STAGE)) {
      const s = loop?.stages?.[stage];
      if (!clean(s?.text)) continue;
      out.push(
        item({
          id: `l:${loop.id}:${stage}`,
          taskId: stage === "transfer" && loop.src !== "time-machine" ? `${task.id}~new` : task.id,
          taskTitle: task.title,
          prompt: stage === "transfer" ? s.prompt || task.prompt : task.prompt,
          keyUse: task.keyUse || "",
          domain: task.domain,
          t: s.t,
          text: s.text,
          source: s.source || (stage === "revision" ? loop.stages.response?.source : "typed"),
          audioId: s.audioId || "",
          supports: stage === "revision" ? { ...obj(s.supports), coach: true } : s.supports,
          independent: stage === "transfer" ? s.independent : undefined,
          stage: kind,
          src: loop.src || "intel",
          teacherNote: teacher?.comment || "",
          loopId: loop.id,
          attempt: loop.attempt || 0,
        }),
      );
    }
  }
  return out;
}

/**
 * Every piece of the learner's own language that can be dated, oldest first.
 * @param {{studio?:object, exhibition?:object, warmup?:object, adventures?:object, intel?:object,
 *          tasks?:{writing?:Record<string,{title,prompt,keyUse}>, speaking?:Record<string,{title,prompt,keyUse}>}}} input
 */
export function collectItems(input = {}) {
  const all = [
    ...fromWritingStudio(input.studio, input.tasks),
    ...fromSpeakingStudio(input.studio, input.tasks),
    ...fromExhibition(input.exhibition),
    ...fromWarmup(input.warmup),
    ...fromAdventures(input.adventures),
    ...fromReality(input.reality),
    ...fromLoops(input.intel),
  ].filter((x) => x.id && isDate(x.t) && (x.text || x.audioId));
  // The same words saved for the same task by two features (a studio version and its loop) are one piece of work.
  const seen = new Set();
  const out = [];
  for (const x of all.sort((a, b) => a.t.localeCompare(b.t) || a.id.localeCompare(b.id))) {
    const key = `${x.domain}|${x.taskId}|${x.text}|${x.audioId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(x);
  }
  return out;
}

/** Why two items may be compared, or "" when they may not. */
export function comparable(a, b) {
  if (!a || !b || a.id === b.id) return "";
  if (a.domain !== b.domain) return "";
  if (!(Date.parse(a.t) < Date.parse(b.t))) return "";
  if (a.text && a.text === b.text && a.audioId === b.audioId) return "";
  if (a.taskId && a.taskId === b.taskId) return REASONS.SAME_TASK;
  if (a.keyUse && a.keyUse === b.keyUse && a.taskId !== b.taskId) return REASONS.SAME_GOAL;
  return "";
}

export const pairId = (a, b) => `${a.id}~~${b.id}`;

function makePair(earlier, later, reason) {
  return {
    id: pairId(earlier, later),
    kind: later.kind,
    domain: later.domain,
    reason,
    keyUse: later.keyUse || earlier.keyUse || "",
    earlier,
    later,
    supports: { earlier: supportContext(earlier), later: supportContext(later) },
  };
}

/** The support context of one item, in the words the lab uses everywhere: independent or supported, and with what. */
export function supportContext(x) {
  const used = Object.entries(obj(x.supports))
    .filter(([, v]) => v)
    .map(([k]) => k);
  return { independent: Boolean(x.independent), stage: x.stage, used };
}

/**
 * Valid pairs, newest later-item first. For each later item: the earliest comparable piece on the same task and the
 * earliest on the same language goal in another context (so a long history gives a few clear pairs, not every
 * combination). `links` ({ [laterTaskId]: earlierItemId }) adds the pair a transfer challenge was made from.
 */
export function buildPairs(items, { links = {} } = {}) {
  const sorted = [...items].sort((a, b) => a.t.localeCompare(b.t));
  const pairs = new Map();
  const add = (a, b) => {
    const reason = comparable(a, b);
    if (reason && !pairs.has(pairId(a, b))) pairs.set(pairId(a, b), makePair(a, b, reason));
  };
  for (const later of sorted) {
    const before = sorted.filter((x) => comparable(x, later));
    const same = before.find((x) => comparable(x, later) === REASONS.SAME_TASK);
    const goal = before.find((x) => comparable(x, later) === REASONS.SAME_GOAL);
    if (same) add(same, later);
    if (goal) add(goal, later);
    // the piece just before it on the same task (a revision next to the draft it came from)
    const prev = before.filter((x) => x.taskId === later.taskId).at(-1);
    if (prev) add(prev, later);
    const origin = links[later.taskId] && sorted.find((x) => x.id === links[later.taskId]);
    if (origin) add(origin, later);
  }
  return [...pairs.values()]
    .sort((x, y) => y.later.t.localeCompare(x.later.t) || x.earlier.t.localeCompare(y.earlier.t))
    .slice(0, MAX_PAIRS);
}

/** Every saved attempt at one task, oldest first: the small timeline (first → revision → new task) of a pair. */
export function historyFor(items, pair) {
  const ids = new Set([pair.earlier.taskId, pair.later.taskId]);
  const loops = new Set([pair.earlier.loopId, pair.later.loopId].filter(Boolean));
  return items
    .filter(
      (x) => x.domain === pair.domain && (ids.has(x.taskId) || (x.loopId && loops.has(x.loopId))),
    )
    .sort((a, b) => a.t.localeCompare(b.t));
}

/** Everything the pages read, in one object. */
export function collect(input = {}, opts = {}) {
  const items = collectItems(input);
  const pairs = buildPairs(items, opts);
  return {
    items,
    pairs,
    writing: pairs.filter((p) => p.kind === "writing"),
    speaking: pairs.filter((p) => p.kind === "speaking"),
    enough: pairs.length > 0,
  };
}

/** The documents the collector reads, loaded from this device. `read(key)` returns a parsed value or null. */
export function readSources(read) {
  const P = "accessPracticeLab:v1";
  const prefs = obj(read(`${P}:prefs`));
  return {
    studio: obj(read(`${P}:studio`)),
    exhibition: obj(read(`${P}:exhibition`)),
    warmup: obj(prefs.warmup),
    adventures: obj(read(`${P}:adventures`)),
    reality: obj(read(`${P}:realityEngine`)),
    intel: obj(read(`${P}:intel`)),
  };
}
