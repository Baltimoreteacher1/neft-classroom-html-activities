// Experience compiler, step 4 — VALIDATE. Pure: the engine's own validateMission (src/sim/schema.js) plus the
// compiler's checks. `errors` block publishing; `warnings` are the instructor's call. Every finding has a code, the
// place it is about and a sentence in English and Spanish.
// What it rejects or flags: invalid mission states, missing objectives, facts that are not in the source ("not from
// your text"), broken branches, missing art, unreachable scenes, Key Language Use / WIDA references that the lab's
// catalog does not have, interactions that are not accessible, and tasks with no real language production.
import { WIDA_LANGUAGE_EXPECTATIONS } from "../acc/wida/catalog.js";
import { KEY_LANGUAGE_USES } from "../lang/klu.js";
import { numbersIn, sentences as splitSentences, tokenize } from "../lang/text.js";
import { LANGUAGE_TASKS, validateMission } from "../sim/schema.js";
import { overlap } from "./extract.js";
import { reachOutcomes } from "./play.js";

export const MAX_DEF_BYTES = 120 * 1024;
export const TRACE_MIN = 0.6;
export const MIN_TASK_WORDS = 5;
const STANDARD_OF = {
  Science: "ELD-SC",
  Mathematics: "ELD-MA",
  "Social Studies": "ELD-SS",
  "Language Arts": "ELD-LA",
};
const CLUSTER_OF = { "3-5": ["4-5"], "6-8": ["6-8"], all: ["2-3", "4-5", "6-8"] };
export const SUBJECTS = Object.freeze([
  "Science",
  "Social Studies",
  "Language Arts",
  "Mathematics",
  "Other",
]);

/** Catalog ids (src/acc/wida/catalog.js) for a subject, grade band and Key Language Use; [] when there is none. */
export function standardsFor({ subject, band, keyUse }) {
  const standard = STANDARD_OF[subject] || "ELD-SI";
  const clusters = CLUSTER_OF[band] || CLUSTER_OF["6-8"];
  return WIDA_LANGUAGE_EXPECTATIONS.filter(
    (e) =>
      e.standard === standard &&
      e.keyUse === keyUse &&
      clusters.some((c) => e.gradeCluster === c || (e.gradeClusters || []).includes(c)),
  ).map((e) => e.id);
}

/** Is every sentence of `text` found in the source? Returns { ok, score, missing: [sentence] }. */
export function traceText(text, sourceSentences, from) {
  const all = sourceSentences.map((s) => (typeof s === "string" ? s : s.text));
  const claimed = Array.isArray(from) ? from.map((i) => all[i]).filter(Boolean) : [];
  const parts = splitSentences(String(text || ""))
    .map((s) => s.text)
    .filter((t) => tokenize(t).length >= 3);
  const missing = [];
  let worst = 1;
  // A number is a fact in itself: every number in a sentence must stand in the source sentence(s) it matches, so
  // "dropped from 8 to 3" rewritten as "from 8 to 9" is caught even though nearly every word still overlaps.
  const numbers = (list) => new Set(list.flatMap((t) => numbersIn(t).map((n) => n.value)));
  const numbersFit = (part, list) => {
    const have = numbers(list);
    return numbersIn(part).every((n) => have.has(n.value));
  };
  for (const part of parts) {
    let score = claimed.length && numbersFit(part, claimed) ? overlap(part, claimed) : 0;
    if (score < TRACE_MIN)
      for (const s of all) if (numbersFit(part, [s])) score = Math.max(score, overlap(part, [s]));
    worst = Math.min(worst, score);
    if (score < TRACE_MIN) missing.push(part);
  }
  return { ok: missing.length === 0, score: worst, missing };
}

/** Every source-derived text in a definition: [{ key, where: [en, es], text, from }]. */
export function sourcedTexts(def) {
  const out = [];
  for (const e of def.evidence || [])
    out.push({
      key: `evidence:${e.id}`,
      where: [`Evidence "${e.title?.[0]}"`, `Evidencia "${e.title?.[1]}"`],
      text: e.body?.[0],
      from: e.from,
    });
  for (const c of def.characters || [])
    for (const t of c.topics || []) {
      out.push({
        key: `answer:${c.id}:${t.id}`,
        where: [
          `${c.name}'s answer to "${t.ask?.[0]}"`,
          `La respuesta de ${c.name} a "${t.ask?.[1]}"`,
        ],
        text: t.answer?.[0],
        from: t.from,
      });
      if (t.clarify)
        out.push({
          key: `clarify:${c.id}:${t.id}`,
          where: [
            `${c.name}'s follow-up answer to "${t.ask?.[0]}"`,
            `La respuesta adicional de ${c.name} a "${t.ask?.[1]}"`,
          ],
          text: t.clarify.answer?.[0],
          from: t.clarify.from,
        });
    }
  for (const v of def.vocabulary || [])
    out.push({
      key: `vocabulary:${v.term}`,
      where: [`The meaning of "${v.term}"`, `El significado de "${v.term}"`],
      text: v.meaning?.[0],
      from: v.from,
    });
  return out;
}

const condText = (def, c) => {
  if (!c) return ["always", "siempre"];
  const name = (list, id) => (def[list] || []).find((x) => x.id === id);
  const both = (parts, en, es) => [
    parts.map((p) => p[0]).join(en),
    parts.map((p) => p[1]).join(es),
  ];
  if (c.all)
    return both(
      c.all.map((x) => condText(def, x)),
      " AND ",
      " Y ",
    );
  if (c.any)
    return both(
      c.any.map((x) => condText(def, x)),
      " OR ",
      " O ",
    );
  if ("not" in c) {
    const t = condText(def, c.not);
    return [`NOT (${t[0]})`, `NO (${t[1]})`];
  }
  if (c.flag) return [`"${c.flag[0]}" is ${c.flag[1]}`, `"${c.flag[0]}" es ${c.flag[1]}`];
  if ("has" in c)
    return [
      `holds "${name("evidence", c.has)?.title?.[0] || c.has}"`,
      `tiene "${name("evidence", c.has)?.title?.[1] || c.has}"`,
    ];
  if ("evidence" in c)
    return [
      `has collected ${c.evidence} or more pieces of evidence`,
      `reunió ${c.evidence} o más evidencias`,
    ];
  if ("done" in c || "resolved" in c) {
    const id = c.done || c.resolved;
    return [`finished the "${id}" task`, `terminó la tarea "${id}"`];
  }
  if (c.chose) {
    const o = (name("tasks", c.chose[0])?.options || []).find((x) => x.id === c.chose[1]);
    return [`chose "${o?.label?.[0] || c.chose[1]}"`, `eligió "${o?.label?.[1] || c.chose[1]}"`];
  }
  if ("talked" in c)
    return [
      `talked with ${name("characters", c.talked)?.name || c.talked}`,
      `habló con ${name("characters", c.talked)?.name || c.talked}`,
    ];
  if (c.cited)
    return [
      `cited ${c.cited[1]} or more pieces of evidence`,
      `citó ${c.cited[1]} o más evidencias`,
    ];
  if (c.support)
    return [
      `cited ${c.support[1]} or more pieces of evidence that support the chosen explanation`,
      `citó ${c.support[1]} o más evidencias que apoyan la explicación elegida`,
    ];
  if (c.strong)
    return [
      `cited ${c.strong[1]} or more pieces of strong supporting evidence`,
      `citó ${c.strong[1]} o más evidencias fuertes que la apoyan`,
    ];
  if ("act" in c)
    return [
      `reached the part "${name("acts", c.act)?.title?.[0] || c.act}"`,
      `llegó a la parte "${name("acts", c.act)?.title?.[1] || c.act}"`,
    ];
  return ["(unknown condition)", "(condición desconocida)"];
};
/** A condition in plain words, [en, es], for the branch inspector. */
export const conditionText = (def, cond) => condText(def, cond);

const SCORE_WORDS =
  /\b(?:score[sd]?|\d+ points?|earn(?:ed)? points|your grade|graded|proficien\w+|timer|countdown|streak|ranking|puntaje|\d+ puntos|calificaci[oó]n|cron[oó]metro)\b/i;

/**
 * @param {object} def     a mission definition
 * @param {{ art?: string[], looks?: string[], reach?: boolean }} [options] known art keys of the sim art module;
 *        `reach: false` skips the scripted play (used while typing; the Check tab always runs it)
 * @returns {{ ok, errors, warnings, trace, branches, stats }}
 */
export function validateExperience(def, { art = null, looks = null, reach = true } = {}) {
  const errors = [];
  const warnings = [];
  const add = (list, code, where, en, es) => list.push({ code, where, text: [en, es] });
  const base = validateMission(def);
  for (const m of base.errors)
    add(errors, "schema", m.split(":")[0], m, `Estructura no válida: ${m}`);
  for (const m of base.warnings) {
    const broken = /^outcome /.test(m);
    add(
      broken ? errors : warnings,
      broken ? "broken-branch" : "unused",
      m.split(":")[0],
      m,
      broken ? `Final imposible: ${m}` : `Sin usar: ${m}`,
    );
  }
  if (!def || typeof def !== "object")
    return { ok: false, errors, warnings, trace: {}, branches: [], stats: {} };
  const list = (v) => (Array.isArray(v) ? v : []);

  const bytes = JSON.stringify(def).length;
  if (bytes > MAX_DEF_BYTES)
    add(
      errors,
      "too-large",
      "experience",
      `The experience is ${Math.round(bytes / 1024)} KB; the limit is 120 KB. Shorten the source text or remove evidence.`,
      `La experiencia pesa ${Math.round(bytes / 1024)} KB; el límite es 120 KB. Acorta el texto o quita evidencia.`,
    );

  // objectives
  for (const k of ["language", "content"]) {
    const en = def.objectives?.[k]?.[0] || "";
    if (tokenize(en).length < 4)
      add(
        errors,
        "missing-objective",
        `objectives.${k}`,
        `The ${k} objective is missing or too short to guide the work.`,
        `Falta el objetivo de ${k === "language" ? "lenguaje" : "contenido"} o es demasiado corto.`,
      );
  }

  // standards mapping
  const uses = new Set([...list(def.keyUses), ...list(def.tasks).map((t) => t.keyUse)]);
  for (const u of uses)
    if (!KEY_LANGUAGE_USES.includes(u))
      add(
        errors,
        "unknown-key-use",
        "keyUses",
        `"${u}" is not a Key Language Use the lab knows (Narrate, Inform, Explain, Argue).`,
        `"${u}" no es un Uso Clave del Lenguaje que el laboratorio conoce (Narrar, Informar, Explicar, Argumentar).`,
      );
  const standards = standardsFor({
    subject: def.subject,
    band: def.band,
    keyUse: list(def.keyUses)[0],
  });
  if (!standards.length && KEY_LANGUAGE_USES.includes(list(def.keyUses)[0]))
    add(
      warnings,
      "no-standard",
      "keyUses",
      `The lab's WIDA catalog has no entry for ${def.subject} + ${def.keyUses[0]} in this grade band, so this experience will not be tagged to a standard.`,
      `El catálogo WIDA del laboratorio no tiene una entrada para ${def.subject} + ${def.keyUses[0]} en este grupo de grados; la experiencia no llevará etiqueta de estándar.`,
    );

  // source accuracy
  const trace = {};
  const source = splitSentences(def.source?.text || "").map((s) => s.text.replace(/\s+/g, " "));
  if (!source.length)
    add(
      errors,
      "no-source",
      "source",
      "The experience has lost its source text, so its facts cannot be checked.",
      "La experiencia perdió su texto fuente; no se pueden comprobar sus datos.",
    );
  else
    for (const item of sourcedTexts(def)) {
      const t = traceText(item.text, source, item.from);
      trace[item.key] = t;
      if (!t.ok)
        add(
          warnings,
          "not-from-source",
          item.key,
          `${item.where[0]}: not from your text — "${t.missing[0]}"`,
          `${item.where[1]}: no viene de tu texto — "${t.missing[0]}"`,
        );
    }

  // assets
  if (art)
    for (const s of list(def.scenes))
      if (!art.includes(s.art))
        add(
          errors,
          "missing-art",
          `scene:${s.id}`,
          `Scene "${s.title?.[0]}" uses a picture ("${s.art}") the simulation does not have.`,
          `La escena "${s.title?.[1]}" usa una imagen ("${s.art}") que la simulación no tiene.`,
        );
  if (looks)
    for (const c of list(def.characters))
      if (!looks.includes(c.look))
        add(
          errors,
          "missing-art",
          `character:${c.id}`,
          `${c.name} uses a portrait ("${c.look}") the simulation does not have.`,
          `${c.name} usa un retrato ("${c.look}") que la simulación no tiene.`,
        );

  // accessibility
  for (const s of list(def.scenes)) {
    const labels = new Set();
    for (const h of list(s.hotspots)) {
      const en = String(h.label?.[0] || "").trim();
      if (en.length < 3 || !String(h.label?.[1] || "").trim())
        add(
          errors,
          "no-label",
          `hotspot:${s.id}:${h.id}`,
          `A spot in "${s.title?.[0]}" has no name, so a screen reader or keyboard user cannot tell what it opens.`,
          `Un punto de "${s.title?.[1]}" no tiene nombre; quien use lector de pantalla o teclado no sabrá qué abre.`,
        );
      else if (labels.has(en))
        add(
          warnings,
          "same-label",
          `hotspot:${s.id}:${h.id}`,
          `Two spots in "${s.title?.[0]}" are both called "${en}".`,
          `Dos puntos de "${s.title?.[1]}" se llaman "${h.label[1]}".`,
        );
      labels.add(en);
    }
  }
  for (const e of list(def.evidence))
    if (e.kind === "audio" && (e.transcript === false || tokenize(e.body?.[0] || "").length < 3))
      add(
        errors,
        "no-transcript",
        `evidence:${e.id}`,
        `The recorded message "${e.title?.[0]}" has no transcript.`,
        `El mensaje grabado "${e.title?.[1]}" no tiene transcripción.`,
      );

  // real language production
  const lang = list(def.tasks).filter((t) => LANGUAGE_TASKS.includes(t.type));
  for (const t of lang) {
    if (!(t.minWords >= MIN_TASK_WORDS))
      add(
        errors,
        "thin-task",
        `task:${t.id}`,
        `The "${t.id}" task asks for fewer than ${MIN_TASK_WORDS} words, which is not real language production.`,
        `La tarea "${t.id}" pide menos de ${MIN_TASK_WORDS} palabras; eso no es producción real de lenguaje.`,
      );
    if (tokenize(t.prompt?.[0] || "").length < 5)
      add(
        errors,
        "thin-task",
        `task:${t.id}`,
        `The "${t.id}" task has no real prompt.`,
        `La tarea "${t.id}" no tiene una consigna real.`,
      );
  }
  for (const [type, en, es] of [
    ["speak", "a spoken explanation", "una explicación oral"],
    ["write", "a written response", "una respuesta escrita"],
    ["revise", "a revision", "una revisión"],
    ["transfer", "an independent transfer task", "una tarea de transferencia independiente"],
  ])
    if (!lang.some((t) => t.type === type))
      add(warnings, "no-task", `tasks.${type}`, `There is no ${en}.`, `No hay ${es}.`);
  for (const t of list(def.tasks))
    if (SCORE_WORDS.test(`${t.prompt?.[0]} ${t.prompt?.[1]}`))
      add(
        errors,
        "score-language",
        `task:${t.id}`,
        `The "${t.id}" prompt talks about scores, points, levels or timers. The lab never uses them.`,
        `La consigna "${t.id}" habla de puntajes, puntos, niveles o cronómetros. El laboratorio nunca los usa.`,
      );
  for (const o of list(def.outcomes))
    if (SCORE_WORDS.test(`${o.title?.[0]} ${o.text?.[0]} ${o.title?.[1]} ${o.text?.[1]}`))
      add(
        errors,
        "score-language",
        `outcome:${o.id}`,
        `The ending "${o.title?.[0]}" reads like a grade. An ending is a story consequence.`,
        `El final "${o.title?.[1]}" parece una calificación. Un final es una consecuencia de la historia.`,
      );

  // the conflict
  const explanations = list(def.explanations);
  const misread = explanations.find((x) => x.check);
  if (explanations.length < 2)
    add(
      warnings,
      "no-conflict",
      "explanations",
      "There are fewer than two competing explanations, so there is nothing for learners to decide.",
      "Hay menos de dos explicaciones en competencia; los estudiantes no tienen nada que decidir.",
    );
  else if (misread && !list(def.evidence).some((e) => list(e.contradicts).includes(misread.id)))
    add(
      errors,
      "misreading-unchecked",
      `explanation:${misread.id}`,
      "No evidence contradicts the misreading, so a learner could never find out it is wrong.",
      "Ninguna evidencia contradice la lectura equivocada; un estudiante nunca podría descubrir que es incorrecta.",
    );

  // branches: can a scripted learner finish, and which endings does it reach?
  let branches = list(def.outcomes).map((o, i, all) => ({
    id: o.id,
    title: o.title,
    when: conditionText(def, o.when),
    fallback: i === all.length - 1,
    reachable: null,
  }));
  if (reach && base.ok) {
    const r = reachOutcomes(def);
    branches = branches.map((b) => ({
      ...b,
      reachable: r.outcomes[b.id]?.reachable || false,
      steps: r.outcomes[b.id]?.steps || 0,
    }));
    if (!r.completable)
      add(
        errors,
        "cannot-finish",
        "experience",
        `A learner cannot finish this experience: play stops in "${(def.scenes.find((s) => s.id === r.runs[0]?.stuck)?.title || [r.runs[0]?.stuck])[0]}".`,
        `Un estudiante no puede terminar esta experiencia: se detiene en "${(def.scenes.find((s) => s.id === r.runs[0]?.stuck)?.title || [0, r.runs[0]?.stuck])[1]}".`,
      );
    else {
      const reached = branches.filter((b) => b.reachable);
      if (list(def.outcomes).length > 1 && reached.length < 2)
        add(
          errors,
          "one-ending",
          "outcomes",
          "Every path leads to the same ending, so a learner's choices change nothing.",
          "Todos los caminos llevan al mismo final; las decisiones del estudiante no cambian nada.",
        );
      for (const b of branches)
        if (!b.reachable && !b.fallback)
          add(
            warnings,
            "branch-not-reached",
            `outcome:${b.id}`,
            `No scripted path reached the ending "${b.title?.[0]}".`,
            `Ningún camino de prueba llegó al final "${b.title?.[1]}".`,
          );
    }
  }

  const stats = {
    scenes: list(def.scenes).length,
    characters: list(def.characters).length,
    evidence: list(def.evidence).length,
    artifacts: list(def.evidence).filter((e) => e.kind !== "testimony").length,
    listen: list(def.evidence).some((e) => e.kind === "audio"),
    read: list(def.evidence).some((e) => e.kind === "document" || e.kind === "data"),
    tasks: Object.fromEntries(
      ["compare", "decide", "speak", "write", "revise", "transfer"].map((t) => [
        t,
        list(def.tasks).filter((x) => x.type === t).length,
      ]),
    ),
    standards,
    bytes,
  };
  return { ok: errors.length === 0, errors, warnings, trace, branches, stats };
}
