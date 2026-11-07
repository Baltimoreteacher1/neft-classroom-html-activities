// Teacher-led small-group speaking routines suggested from class evidence (Lexia "Assessment Without Testing").
//
// Input: the Teacher Hub roster (students imported from share codes, each with an evidence ledger). Output:
// groups of at most four students who share one speaking need, each with an authored routine the teacher
// leads. Rules: a suggestion prints the counts that triggered it; students with no evidence are listed as
// "no speaking evidence yet", never guessed into a need; nothing here is a level or a score; routines have no
// clock or speed target. Pure logic; access-teacher/speaking-groups.js draws it.

import { CONTENT_BANDS, codeBand } from "../bands.js";

export const GROUP_MAX = 4;
export const SHORT_SECONDS = 20;
export const ARGUE_USES = ["Argue", "Explain"];

const s = (en, es) => ({ en, es });

/** Authored routines, one per need. Teacher-led, about ten minutes, no timers. */
export const ROUTINES = {
  start: {
    title: s(
      "Picture talk: name it, tell about it, say why",
      "Hablar de una imagen: nombrar, describir, decir por qué",
    ),
    why: s("Fewer than two speaking tries saved.", "Menos de dos intentos orales guardados."),
    steps: [
      s(
        "Show one picture. Model one sentence: “I see ___.”",
        "Muestre una imagen. Modele una oración: “I see ___.”",
      ),
      s(
        "Each student names one thing, then adds one describing word.",
        "Cada estudiante nombra una cosa y luego agrega una palabra que la describa.",
      ),
      s(
        "Partners ask “Why?” and answer with “because ___”.",
        "En parejas preguntan “Why?” y responden con “because ___”.",
      ),
      s(
        "Each student says their best sentence to the group.",
        "Cada estudiante dice su mejor oración al grupo.",
      ),
    ],
    frames: ["I see ___.", "It is ___ because ___."],
    listen: s(
      "Listen for: a whole sentence and one reason.",
      "Escuche: una oración completa y una razón.",
    ),
  },
  fade: {
    title: s(
      "Frame fade: say it with the frame, then without",
      "Retirar el apoyo: decirlo con la estructura y luego sin ella",
    ),
    why: s(
      "Speaking tries saved, but every one used help.",
      "Hay intentos orales guardados, pero todos usaron ayuda.",
    ),
    steps: [
      s(
        "Post one frame. Each student answers the prompt with it.",
        "Muestre una estructura. Cada estudiante responde la pregunta con ella.",
      ),
      s(
        "Cover half the frame. Students answer again.",
        "Tape la mitad de la estructura. Responden otra vez.",
      ),
      s(
        "Remove the frame. Students answer a new, similar prompt.",
        "Quite la estructura. Responden una pregunta nueva y parecida.",
      ),
      s(
        "Students name which part they said on their own.",
        "Cada estudiante dice qué parte dijo por su cuenta.",
      ),
    ],
    frames: ["In my opinion, ___ because ___.", "One example is ___."],
    listen: s(
      "Listen for: the same idea said with less help.",
      "Escuche: la misma idea dicha con menos ayuda.",
    ),
  },
  extend: {
    title: s("Say more: reason, example, wrap-up", "Decir más: razón, ejemplo, cierre"),
    why: s(
      "Recorded answers are short (median under 20 seconds of speech).",
      "Las respuestas grabadas son cortas (mediana de menos de 20 segundos de habla).",
    ),
    steps: [
      s(
        "Model a short answer, then the same answer with a reason and an example.",
        "Modele una respuesta corta y luego la misma respuesta con una razón y un ejemplo.",
      ),
      s(
        "Each student gives a short answer to a new prompt.",
        "Cada estudiante da una respuesta corta a una pregunta nueva.",
      ),
      s(
        "A partner asks “Can you give an example?” and the speaker adds one.",
        "Un compañero pregunta “Can you give an example?” y quien habla agrega uno.",
      ),
      s(
        "Speakers finish with “So, ___.” to wrap up.",
        "Quien habla termina con “So, ___.” para cerrar.",
      ),
    ],
    frames: ["For example, ___.", "So, ___."],
    listen: s(
      "Listen for: more ideas, not faster talk.",
      "Escuche: más ideas, no hablar más rápido.",
    ),
  },
  argue: {
    title: s(
      "Agree or disagree: claim, reason, response",
      "De acuerdo o en desacuerdo: afirmación, razón, respuesta",
    ),
    why: s(
      "No speaking evidence yet for Argue or Explain.",
      "Todavía no hay evidencia oral para Argumentar o Explicar.",
    ),
    steps: [
      s(
        "Read one short claim aloud (for example: “School should start later.”).",
        "Lea en voz alta una afirmación corta (por ejemplo: “School should start later.”).",
      ),
      s(
        "Each student says “I agree” or “I disagree” with one reason.",
        "Cada estudiante dice “I agree” o “I disagree” con una razón.",
      ),
      s(
        "The next student responds to the last speaker before giving a reason.",
        "El siguiente estudiante responde a quien habló antes de dar su razón.",
      ),
      s(
        "The group names the strongest reason and why.",
        "El grupo nombra la razón más fuerte y por qué.",
      ),
    ],
    frames: ["I agree with ___ because ___.", "I see it differently because ___."],
    listen: s(
      "Listen for: a reason tied to the claim, and a response to a classmate.",
      "Escuche: una razón conectada con la afirmación y una respuesta a un compañero.",
    ),
  },
  coach: {
    title: s("Peer coach: lead the routine", "Compañero guía: dirigir la rutina"),
    why: s(
      "Three or more speaking tries on their own.",
      "Tres o más intentos orales por su cuenta.",
    ),
    steps: [
      s(
        "Give each student a prompt card.",
        "Entregue a cada estudiante una tarjeta con una pregunta.",
      ),
      s(
        "One student asks the prompt and listens; the other answers.",
        "Un estudiante hace la pregunta y escucha; el otro responde.",
      ),
      s(
        "The listener names one strength and asks one follow-up question.",
        "Quien escucha nombra una fortaleza y hace una pregunta más.",
      ),
      s("Switch roles with a new card.", "Cambien de papel con otra tarjeta."),
    ],
    frames: ["What I liked was ___.", "Can you tell me more about ___?"],
    listen: s(
      "Listen for: follow-up questions that keep the talk going.",
      "Escuche: preguntas que mantienen la conversación.",
    ),
  },
};

export const NEED_ORDER = ["start", "fade", "extend", "argue", "coach"];

const median = (xs) => {
  if (!xs.length) return null;
  const v = [...xs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/** Speaking evidence for one student: counts only. */
export function speakingEvidence(student) {
  const entries = (student?.ledger?.entries || []).filter(
    (e) => e && (e.src === "speaking" || e.domain === "Speaking"),
  );
  const first = entries.filter((e) => e.kind !== "revision");
  const independent = first.filter((e) => e.stage === "independent").length;
  const seconds = first.map((e) => e.m?.spk?.speech).filter((v) => typeof v === "number");
  const uses = new Set(first.map((e) => e.use).filter(Boolean));
  return {
    tries: first.length,
    independent,
    medianSpeech: median(seconds),
    timed: seconds.length,
    uses: [...uses],
  };
}

/** The one need the evidence points to, in priority order, with the counts behind it. */
export function needOf(ev) {
  if (ev.tries < 2) return "start";
  if (ev.independent === 0) return "fade";
  if (ev.timed >= 2 && ev.medianSpeech !== null && ev.medianSpeech < SHORT_SECONDS) return "extend";
  if (!ev.uses.some((u) => ARGUE_USES.includes(u))) return "argue";
  if (ev.independent >= 3) return "coach";
  return "extend";
}

/**
 * Suggested groups for one section (or the whole roster). Students with no speaking entries at all are
 * returned separately so the teacher sees them; they are not assigned a need.
 */
export function suggestGroups(students = []) {
  const byNeed = new Map(NEED_ORDER.map((n) => [n, []]));
  const noEvidence = [];
  for (const st of students) {
    const ev = speakingEvidence(st);
    const all = st?.ledger?.entries || [];
    if (!all.length) {
      noEvidence.push(st.alias);
      continue;
    }
    byNeed.get(needOf(ev)).push({ alias: st.alias, band: codeBand(st.band), ev });
  }
  const groups = [];
  for (const need of NEED_ORDER) {
    // A group never mixes grade bands: a kindergartener and an eighth grader do not share a routine.
    for (const band of CONTENT_BANDS) {
      const members = byNeed
        .get(need)
        .filter((m) => m.band === band)
        .sort((a, b) => a.alias.localeCompare(b.alias));
      for (let i = 0; i < members.length; i += GROUP_MAX)
        groups.push({ need, band, routine: ROUTINES[need], members: members.slice(i, i + GROUP_MAX) });
    }
  }
  return { groups, noEvidence: noEvidence.sort() };
}
