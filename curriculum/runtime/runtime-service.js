import { normalizeLanguage } from "./runtime-config.js";

const COPY = Object.freeze({
  en: Object.freeze({
    listen: "Listen for the mathematical idea, not just the answer.",
    explain: "I represented ___ because ___.",
    notice: "What do you notice? What stays the same?",
    support: "Show it with a model, say it with a partner, then write it.",
  }),
  es: Object.freeze({
    listen: "Escucha la idea matemática, no solamente la respuesta.",
    explain: "Representé ___ porque ___.",
    notice: "¿Qué notas? ¿Qué permanece igual?",
    support: "Muéstralo con un modelo, dilo con un compañero y luego escríbelo.",
  }),
});

const LABS = Object.freeze({
  numberTheory: ["Factor Forge", "Split a composite into factor branches until every leaf is prime."],
  decimals: ["Place-Value Lens", "Align quantities on a place-value rail before calculating."],
  fractions: ["Fraction Studio", "Partition and group a bar model before using symbols."],
  ratios: ["Ratio Mixer", "Scale both quantities together and compare equivalent batches."],
  percents: ["Hundred Lab", "Connect the whole, the part, and the rate on a 100-grid."],
  expressions: ["Expression Machine", "Change one input and observe which terms respond."],
  equations: ["Balance Bench", "Apply the same operation to both sides of a balance."],
  statistics: ["Data Observatory", "Move points and watch center, spread, and shape change."],
  integers: ["Coordinate Navigator", "Trace signed distance from zero before plotting."],
  geometry: ["Shape Decomposer", "Cut and rearrange shapes without changing total area."],
  volume: ["Layer Builder", "Build one cube layer, then connect layers to volume."],
  general: ["Model Workshop", "Represent the situation, test a move, and explain what changed."],
});

export function resolveFamily(lesson, workflow) {
  const text = `${lesson?.title || ""} ${lesson?.standard || ""}`.toLowerCase();
  return workflow.familyRules.find(({ pattern }) => new RegExp(pattern, "i").test(text))?.family || "general";
}

export function findLesson(lessons, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return lessons[0];
  return lessons.find(({ id }) => id.toLowerCase() === needle) ||
    lessons.find(({ title, objective, standard }) => `${title} ${objective} ${standard}`.toLowerCase().includes(needle)) ||
    lessons[0];
}

export function compileRuntime({ lesson, workflow, supports, language = "en", minutes = 45, intent = "" }) {
  const safeLanguage = normalizeLanguage(language);
  const family = resolveFamily(lesson, workflow);
  const guidance = workflow.families[family] || workflow.families.general;
  const support = supports.families?.[family] || supports.families?.general || {};
  const [labName, labPrompt] = LABS[family] || LABS.general;
  const sequence = Number(minutes) >= 75 ? workflow.sequences.minutes90 : workflow.sequences.minutes45;
  return {
    id: `${lesson.id}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    lesson,
    family,
    language: safeLanguage,
    intent: String(intent || "Build understanding and collect reasoning evidence.").slice(0, 180),
    guidance,
    support,
    sequence,
    copy: COPY[safeLanguage],
    lab: { name: labName, prompt: labPrompt, interaction: family },
    invariants: { standard: lesson.standard, objective: lesson.objective, assessment: guidance.successCriteria },
  };
}

export function adaptClassroom(counts, guidance) {
  const values = { secure: 0, developing: 0, stuck: 0, ...counts };
  const total = Object.values(values).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  const stuckShare = total ? values.stuck / total : 0;
  if (!total) return { level: "observe", move: "Collect one anonymous response from every learner.", total };
  if (stuckShare >= 0.35) return { level: "reteach", move: guidance.responseMove, total };
  if (values.developing + values.stuck > values.secure) return { level: "bridge", move: `Re-model, then use: ${guidance.successCriteria}`, total };
  return { level: "extend", move: "Ask students to compare two valid strategies and defend which is more efficient.", total };
}

export function modelReasoning(evidence, guidance) {
  const text = String(evidence || "").trim().slice(0, 600);
  const lower = text.toLowerCase();
  const signals = ["because", "therefore", "so", "porque", "entonces"].filter((word) => lower.includes(word));
  const representation = /model|diagram|table|line|tree|grid|modelo|diagrama|tabla/.test(lower);
  const status = !text ? "not-yet-observed" : signals.length && representation ? "connected" : signals.length ? "explained" : "emerging";
  return {
    status,
    confidence: !text ? 0 : Math.min(0.9, 0.35 + signals.length * 0.15 + (representation ? 0.2 : 0)),
    observed: text || "No evidence entered yet.",
    inference: status === "connected" ? "The response connects a representation to a claim." : "More evidence is needed before assigning a stable misconception.",
    nextPrompt: guidance.responseMove,
  };
}

export function reviewLesson(runtime) {
  const { lesson, guidance, support, lab } = runtime;
  return [
    ["Mathematics", Boolean(lesson.standard), `Preserve ${lesson.standard}; verify every model matches the objective.`],
    ["Pedagogy", Boolean(guidance.prerequisite), `Begin from: ${guidance.prerequisite}`],
    ["Misconceptions", Boolean(guidance.misconception), guidance.responseMove],
    ["Accessibility", true, "Use keyboard-operable controls, text alternatives, and multiple representations."],
    ["WIDA / TWR", Boolean(lesson.languageObjective), lesson.languageObjective || runtime.copy.explain],
    ["Family connection", Boolean(lesson.resources?.familyPage), "Share the family page in the selected English/Spanish mode."],
    ["Toolmaker", Boolean(lab.name), `Generated interface: ${lab.name}.`],
  ].map(([role, passed, finding]) => ({ role, passed, confidence: passed ? 0.92 : 0.58, finding }));
}

export function clusterStrategies(entries) {
  const groups = { visual: [], symbolic: [], verbal: [], other: [] };
  for (const entry of entries.map((value) => String(value).trim()).filter(Boolean)) {
    const lower = entry.toLowerCase();
    const group = /draw|model|diagram|grid|line|visual|dibu/.test(lower) ? "visual" :
      /equation|factor|multiply|divide|symbol|ecuaci/.test(lower) ? "symbolic" :
      /explain|said|because|porque|word/.test(lower) ? "verbal" : "other";
    groups[group].push(entry.slice(0, 180));
  }
  return Object.entries(groups).filter(([, items]) => items.length).map(([name, items]) => ({ name, count: items.length, examples: items.slice(0, 2) }));
}

export function proposeRevision(runtime, reasoning, adaptation) {
  return {
    status: "awaiting-teacher-approval",
    evidence: `${reasoning.status}; class signal: ${adaptation.level}`,
    proposal: adaptation.move,
    preserved: runtime.invariants,
  };
}

export function forkRuntime(runtime, theme) {
  const safeTheme = String(theme || "community problem-solving").trim().slice(0, 100);
  return {
    ...runtime,
    id: `${runtime.lesson.id}-fork-${Date.now()}`,
    createdAt: new Date().toISOString(),
    fork: { theme: safeTheme, changed: ["context", "examples", "visual framing"] },
    lab: { ...runtime.lab, prompt: `${runtime.lab.prompt} Use a ${safeTheme} context.` },
    invariants: { ...runtime.invariants },
  };
}
