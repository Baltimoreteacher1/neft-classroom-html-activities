// Language Quest read-outs built only from what a run recorded: the family summary, the teacher's evidence sheet and the
// portfolio entries. Each one states facts (what was practiced, how much support, whether the learner revised) and a next
// step drawn from a stated rule. None of them scores, grades or names a proficiency level.
import { RUNG_COPY, missionProgress, wordCount } from "./engine.js";

const DOMAIN_ES = { Listening: "comprensión auditiva", Reading: "lectura", Speaking: "expresión oral", Writing: "escritura" };
export const domainEs = (d) => DOMAIN_ES[d] || d;

/** What this learner made in a run: counts only, never the text. */
export function createdCounts(mission, run) {
  let writes = 0;
  let speaks = 0;
  let revisions = 0;
  for (const s of mission.stages) {
    for (const it of s.items) {
      const st = run.items?.[it.id];
      if (!st) continue;
      if (it.kind === "write" && it.reviseOf) revisions += st.versions?.length > 1 ? 1 : 0;
      else if (it.kind === "write" && st.versions?.length) writes += 1;
      if (it.kind === "story" && st.sentences) (writes += 1);
      if (it.kind === "speak" && (st.took || st.typed)) speaks += 1;
    }
  }
  return { writes, speaks, revisions };
}

/**
 * Family summary: optional, bilingual, written from the mission's own `family` block. It never includes the learner's
 * words unless `includeSentence` is passed (the learner chose to copy one line). Spanish here is unreviewed by a native
 * speaker and is flagged in docs/language-page/human-required.md.
 */
export function familySummary(mission, run, { includeSentence = "" } = {}) {
  const c = createdCounts(mission, run);
  const made = [];
  if (c.writes) made.push({ en: `${c.writes} piece${c.writes > 1 ? "s" : ""} of writing`, es: `${c.writes} texto${c.writes > 1 ? "s" : ""} escrito${c.writes > 1 ? "s" : ""}` });
  if (c.speaks) made.push({ en: `${c.speaks} speaking practice${c.speaks > 1 ? "s" : ""}`, es: `${c.speaks} práctica${c.speaks > 1 ? "s" : ""} de expresión oral` });
  if (c.revisions) made.push({ en: "a revision that improved the first draft", es: "una revisión que mejoró el primer borrador" });
  return {
    title: mission.title,
    practiced: mission.family.skill,
    made,
    talk: mission.family.talk,
    vocab: mission.family.vocab,
    support: RUNG_COPY[run.rung] || RUNG_COPY.frame,
    sentence: includeSentence ? includeSentence.slice(0, 280) : "",
    domains: mission.domains,
  };
}
export const familyText = (sum, lang = "en") => {
  const pick = (p) => (lang === "es" ? p.es || p.en : p.en);
  const head = lang === "es" ? "Resumen para la familia" : "Family summary";
  const lines = [
    `${head}: ${pick(sum.title)}`,
    `${lang === "es" ? "Practicó" : "Practiced"}: ${pick(sum.practiced)}`,
    `${lang === "es" ? "Creó" : "Made"}: ${sum.made.map(pick).join("; ") || (lang === "es" ? "una misión completa" : "a finished mission")}`,
    `${lang === "es" ? "Palabras nuevas" : "New words"}: ${sum.vocab.map((v) => (lang === "es" ? `${v.term} (${v.es})` : v.term)).join(", ")}`,
    `${lang === "es" ? "Conversación en casa" : "Talk about it at home"}: ${pick(sum.talk)}`,
  ];
  if (sum.sentence) lines.push(`${lang === "es" ? "Una oración que escribió" : "A sentence they wrote"}: ${sum.sentence}`);
  return lines.join("\n");
};

/**
 * Teacher evidence for one run: student response, revision history, supports used, completion and a specific next step.
 * The next step is chosen by the first rule that fits (listed in `nextStep`) so a teacher can see why it was suggested.
 */
export function teacherEvidence(mission, run) {
  const prog = missionProgress(mission, run);
  const writes = [];
  for (const s of mission.stages)
    for (const it of s.items) {
      const st = run.items?.[it.id];
      if (!["write", "speak", "story"].includes(it.kind) || !st) continue;
      writes.push({
        id: it.id,
        kind: it.kind,
        prompt: it.prompt,
        versions: (st.versions || []).map((v) => ({ text: v.text, words: wordCount(v.text), met: v.met, selfDeclared: v.selfDeclared, at: v.at })),
        typedRehearsal: it.kind === "speak" ? Boolean(st.typed) && !st.took : false,
        recorded: it.kind === "speak" ? Boolean(st.took) : false,
        self: st.self || [],
        sentences: st.sentences || null,
      });
    }
  const revised = writes.some((w) => w.versions.length > 1);
  return {
    mission: mission.id,
    title: mission.title.en,
    functions: mission.functions,
    keyUses: mission.keyUses,
    objective: mission.objective.en,
    rung: run.rung,
    help: Boolean(run.helpUsed),
    hints: run.hints || 0,
    progress: prog,
    revised,
    completed: run.completed || "",
    work: writes,
    nextStep: nextStep(run, revised, prog),
  };
}
export function nextStep(run, revised, prog) {
  if (!prog.complete) return { en: "Not finished yet. Ask the student which stage feels hardest, then offer one support from the ladder.", es: "Aún no termina. Pregunte qué etapa le resulta más difícil y ofrezca un apoyo de la escalera." };
  if (run.helpUsed) return { en: `Asked for extra support at "${RUNG_COPY[run.rung].en}". Repeat a related mission at the same rung before fading.`, es: `Pidió apoyo adicional en "${RUNG_COPY[run.rung].es}". Repita una misión parecida en el mismo nivel antes de reducir el apoyo.` };
  if (!revised) return { en: "Finished without revising. Ask for one change that makes a reason or detail clearer, then compare the two drafts.", es: "Terminó sin revisar. Pida un cambio que aclare una razón o un detalle y compare los dos borradores." };
  if (run.rung !== "independent") return { en: "Finished and revised without extra help. Try the next rung down on a related function.", es: "Terminó y revisó sin ayuda adicional. Pruebe el siguiente nivel con menos apoyo en una función parecida." };
  return { en: "Finished on their own and revised. Try an unfamiliar context or a higher grade-band mission.", es: "Terminó por su cuenta y revisó. Pruebe un contexto nuevo o una misión de un nivel superior." };
}
export const evidenceText = (ev) =>
  [
    `${ev.title} (${ev.functions.join(", ")}; ${ev.keyUses.join(", ")})`,
    `Objective: ${ev.objective}`,
    `Support: ${RUNG_COPY[ev.rung].en}${ev.help ? " (asked for more help)" : ""}; hints: ${ev.hints}; revised: ${ev.revised ? "yes" : "no"}`,
    ...ev.work.flatMap((w) => [
      `-- ${w.prompt}`,
      ...(w.typedRehearsal ? ["(typed rehearsal, not a recording)"] : []),
      ...w.versions.map((v, i) => `Version ${i + 1} (${v.words} words): ${v.text}`),
    ]),
    `Next step: ${ev.nextStep.en}`,
  ].join("\n");

/** Portfolio rows: one per finished or in-progress run, newest first. */
export function portfolioEntries(st, missionsById) {
  return Object.entries(st.runs)
    .map(([key, run]) => {
      const id = key.split("#")[0];
      const mission = missionsById[id];
      if (!mission) return null;
      const ev = teacherEvidence(mission, run);
      return { key, mission, run, ev, picked: st.picks.includes(key), reflection: st.reflections[key] || "" };
    })
    .filter(Boolean)
    .sort((a, b) => (b.run.completed || b.run.started || "").localeCompare(a.run.completed || a.run.started || ""));
}
