// Language Time Machine — the evidence a teacher reads: what can be compared, what changed (with quotes), the
// support history, revision activity, independent work in a new context, and suggested next instruction.
// Pure: it reads the collected items, pairs and comparisons and returns plain data and plain text.
//
// Rules this module keeps:
//  * No growth score, percentage, level or label. Sections list pieces of work, dates and quoted words.
//  * Every suggestion names the evidence that triggered it.
//  * The packet a learner shares carries no name: the class review queue already knows the alias.
import { detect } from "../lang/errors.js";
import { REASON_LABEL, STAGE_LABEL, supportLabel } from "./compare.js";
import { supportContext } from "./collect.js";
import { hasReflection, reflectionLines } from "./reflect.js";

const day = (t) => String(t || "").slice(0, 10);
const short = (t, n = 90) => (String(t).length > n ? `${String(t).slice(0, n - 1)}…` : String(t));

/** Suggested next instruction. Each: { id, text:[en,es], because:[en,es] } where `because` names the evidence. */
export function suggestions({ items, pairs, comparisons = {}, tm = { reflections: {} } }) {
  const out = [];
  const add = (id, text, because) =>
    out.some((s) => s.id === id) || out.push({ id, text, because });
  const uses = [...new Set(pairs.map((p) => p.keyUse).filter(Boolean))];

  for (const use of uses) {
    const mine = items.filter((x) => x.keyUse === use);
    const own = mine.filter((x) => x.stage === "transfer" && x.independent);
    if (!own.length) {
      const latest = mine.at(-1);
      add(
        `transfer-${use}`,
        [
          `Give one ${use} task in a new context with no supports, to see what the learner does alone.`,
          `Den una tarea de ${use} en un contexto nuevo sin apoyos, para ver qué hace el estudiante sin ayuda.`,
        ],
        [
          `None of the ${mine.length} ${use} pieces is independent work in a new context. The most recent is “${short(latest.taskTitle)}” (${day(latest.t)}, ${supportLabel(supportContext(latest))[0]}).`,
          `Ninguna de las ${mine.length} piezas de ${use} es trabajo independiente en un contexto nuevo. La más reciente es “${short(latest.taskTitle)}” (${day(latest.t)}, ${supportLabel(supportContext(latest))[1]}).`,
        ],
      );
    }
  }

  for (const p of pairs) {
    if (p.earlier.independent && !p.later.independent && p.later.stage !== "revision")
      add(
        `fade-${p.later.taskId}`,
        [
          "Repeat the later task with the supports closed before reading the pair as a change.",
          "Repitan la tarea posterior con los apoyos cerrados antes de leer el par como un cambio.",
        ],
        [
          `“${short(p.later.taskTitle)}” (${day(p.later.t)}) was done ${supportLabel(supportContext(p.later))[0]}; the earlier piece (${day(p.earlier.t)}) was done on the learner's own.`,
          `“${short(p.later.taskTitle)}” (${day(p.later.t)}) se hizo ${supportLabel(supportContext(p.later))[1]}; la pieza anterior (${day(p.earlier.t)}) se hizo sin ayuda.`,
        ],
      );
    // A pattern that is in both pieces is a teaching point, quoted from the later one.
    if (p.earlier.text && p.later.text) {
      const before = new Set(
        detect(p.earlier.text)
          .filter((e) => e.confidence !== "check")
          .map((e) => e.id),
      );
      const still = detect(p.later.text).find(
        (e) => e.confidence !== "check" && before.has(e.id) && p.later.text.includes(e.text),
      );
      if (still)
        add(
          `pattern-${still.id}`,
          [
            `Teach a short lesson on this pattern: ${still.name}.`,
            `Enseñen una lección corta sobre este patrón (en inglés): ${still.name}.`,
          ],
          [
            `It appears in both pieces. In the later one (${day(p.later.t)}): “${still.text}”.`,
            `Aparece en las dos piezas. En la posterior (${day(p.later.t)}): “${still.text}”.`,
          ],
        );
    }
    const c = comparisons[p.id];
    if (c?.comparable && !c.changes.length)
      add(
        `confer-${p.id}`,
        [
          "Read the two pieces together with the learner and ask what they would change.",
          "Lean las dos piezas junto con el estudiante y pregunten qué cambiaría.",
        ],
        [
          `The rule-based comparison found no change it could quote between ${day(p.earlier.t)} and ${day(p.later.t)} on “${short(p.later.taskTitle)}”.`,
          `La comparación con reglas no encontró ningún cambio que pudiera citar entre ${day(p.earlier.t)} y ${day(p.later.t)} en “${short(p.later.taskTitle)}”.`,
        ],
      );
    if (
      p.kind === "speaking" &&
      [p.earlier, p.later].some((x) => x.source === "transcript" && !x.verified)
    )
      add(
        "listen-together",
        [
          "Listen to the recordings with the learner and confirm the words before using the transcript as evidence.",
          "Escuchen las grabaciones con el estudiante y confirmen las palabras antes de usar la transcripción como evidencia.",
        ],
        [
          `The words for “${short(p.later.taskTitle)}” came from speech recognition and the learner has not confirmed them.`,
          `Las palabras de “${short(p.later.taskTitle)}” vienen del reconocimiento de voz y el estudiante no las ha confirmado.`,
        ],
      );
    if (!hasReflection(tm.reflections?.[p.id]))
      add(
        "reflect",
        [
          "Ask the four reflection questions about one pair (what improved, what helped, what is hard, the next goal).",
          "Hagan las cuatro preguntas de reflexión sobre un par (qué mejoró, qué ayudó, qué es difícil, la próxima meta).",
        ],
        [
          `The pair on “${short(p.later.taskTitle)}” (${day(p.earlier.t)} and ${day(p.later.t)}) has no reflection yet.`,
          `El par de “${short(p.later.taskTitle)}” (${day(p.earlier.t)} y ${day(p.later.t)}) todavía no tiene reflexión.`,
        ],
      );
  }
  return out.slice(0, 6);
}

/** Everything the evidence view shows. */
export function buildEvidence({ items, pairs, comparisons = {}, tm }) {
  const paired = new Set(pairs.flatMap((p) => [p.earlier.id, p.later.id]));
  const used = items.filter((x) => paired.has(x.id));
  return {
    enough: pairs.length > 0,
    pairs,
    comparisons,
    supportHistory: used.map((x) => ({ item: x, context: supportContext(x) })),
    revisions: used.filter((x) => x.stage === "revision"),
    transfers: items.filter((x) => x.stage === "transfer"),
    suggestions: pairs.length ? suggestions({ items, pairs, comparisons, tm }) : [],
  };
}

const block = (label, x) =>
  [
    `${label} — ${day(x.t)} — ${STAGE_LABEL[x.stage]?.[0] || x.stage} — ${supportLabel(supportContext(x))[0]}${x.kind === "speaking" ? (x.source === "transcript" && !x.verified ? " — words from speech recognition, not confirmed (may contain errors)" : " — words typed or confirmed by the learner") : ""}`,
    `Task: ${x.taskTitle}${x.prompt && x.prompt !== x.taskTitle ? ` — ${short(x.prompt, 200)}` : ""}`,
    x.text || "(no words saved for this recording)",
  ].join("\n");

/**
 * The plain-text evidence packet a learner shares with their teacher: both texts, dates, task, support context for
 * each, the change statements with their quotes, and the reflection. No name, no score.
 */
export function packetText(pair, comparison, reflection, max = 3900) {
  const parts = [
    `LANGUAGE TIME MACHINE — ${pair.domain} — ${REASON_LABEL[pair.reason]?.[0] || pair.reason}${pair.keyUse ? ` — ${pair.keyUse}` : ""}`,
    block("EARLIER", pair.earlier),
    block("LATER", pair.later),
  ];
  const changes = comparison?.changes || [];
  parts.push(
    changes.length
      ? `WHAT CHANGED (each line quotes the learner's words):\n${changes
          .map(
            (c) =>
              `- ${c.text[0]}${c.beforeQuote ? ` Earlier: “${c.beforeQuote}”` : ""}${c.afterQuote ? ` Later: “${c.afterQuote}”` : ""}`,
          )
          .join("\n")}`
      : "WHAT CHANGED: the rule-based comparison found nothing it could quote. Please read both pieces.",
  );
  parts.push("How much was written or said is not counted as a change.");
  const lines = reflectionLines(reflection);
  if (lines.length) parts.push(`MY REFLECTION:\n${lines.map((l) => `- ${l}`).join("\n")}`);
  return parts.join("\n\n").slice(0, max);
}

export const packetLabel = (pair) =>
  `Time Machine: ${short(pair.later.taskTitle, 50)}`.slice(0, 80);
