// Language Expeditions rules: the shape of a band (four lands in WIDA domain order), the activity types each land
// may use, the lab's rule-based writing checks and the content validator run by tools/validate-access-game-studio.mjs.
import { detect } from "../lang/errors.js";
import { countWords, hasPhrase } from "../lang/scaffold-check.js";
import { hasPic, hasSpots } from "./language-expeditions-art.js";

export const ORDER = ["listening", "reading", "speaking", "writing"];
export const TYPES = {
  listening: ["listen-picture", "listen-place", "listen-choice"],
  reading: ["read-picture", "read-order", "read-choice"],
  speaking: ["speak"],
  writing: ["write"],
};
export const FULL = { listening: 3, reading: 3, speaking: 2, writing: 2 };
export const QUICK = { listening: 2, reading: 2, speaking: 1, writing: 1 };
const bi = (o) => Boolean(o?.en?.trim?.() && o?.es?.trim?.());

/** The lab's rule-based writing checks. Each names what to fix; nothing here is a score. */
export function checkWriting(text, a) {
  const t = String(text || "").trim();
  const words = countWords(t);
  const sentences = t.split(/[.!?]+(?:\s|$)/).filter((x) => countWords(x) >= 2).length;
  const used = (a.need || []).filter((w) => hasPhrase(t, w));
  const conventions =
    Boolean(t) && /[.!?]["”']?$/.test(t) && !detect(t, { only: ["capital-punct"] }).length;
  const out = [
    {
      id: "words",
      ok: words >= a.minWords,
      en: `At least ${a.minWords} words (you have ${words}).`,
      es: `Al menos ${a.minWords} palabras (tienes ${words}).`,
    },
    {
      id: "sentences",
      ok: sentences >= a.minSentences,
      en: `At least ${a.minSentences} sentence${a.minSentences > 1 ? "s" : ""} (you have ${sentences}).`,
      es: `Al menos ${a.minSentences} ${a.minSentences > 1 ? "oraciones" : "oración"} (tienes ${sentences}).`,
    },
  ];
  if (a.needCount)
    out.push({
      id: "connector",
      ok: used.length >= a.needCount,
      en:
        a.needCount > 1
          ? `Use at least ${a.needCount} of these words: ${a.need.join(", ")}.`
          : `Use ${a.need.map((w) => `“${w}”`).join(" or ")}.`,
      es:
        a.needCount > 1
          ? `Usa al menos ${a.needCount} de estas palabras: ${a.need.join(", ")}.`
          : `Usa ${a.need.map((w) => `“${w}”`).join(" o ")}.`,
    });
  out.push({
    id: "conventions",
    ok: conventions,
    en: "Each sentence starts with a capital letter and ends with a period, question mark or exclamation point.",
    es: "Cada oración empieza con mayúscula y termina con punto, signo de interrogación o de exclamación.",
  });
  return out;
}

/** Content problems for the whole game file (both bands). */
export function validateContent(doc) {
  const errs = [];
  const ids = new Set();
  for (const band of ["3-5", "6-8"]) {
    const B = doc.bands?.[band];
    if (!B) {
      errs.push(`${band}: missing`);
      continue;
    }
    if (!bi(B.adventure) || !bi(B.intro) || !bi(B.glow))
      errs.push(`${band}: adventure, intro and glow must be bilingual`);
    if ((B.lands || []).map((l) => l.domain).join() !== ORDER.join())
      errs.push(`${band}: lands must be ${ORDER.join(", ")} in order`);
    (B.lands || []).forEach((land) => {
      const at = `${band}/${land.id}`;
      if (!bi(land.name) || !bi(land.intro) || !bi(land.gate))
        errs.push(`${at}: name, intro and gate text must be bilingual`);
      if (land.acts?.length !== FULL[land.domain])
        errs.push(`${at}: needs ${FULL[land.domain]} activities`);
      (land.acts || []).forEach((a) =>
        errs.push(...actErrors(a, `${at}/${a.id}`, land.domain, ids)),
      );
    });
  }
  return errs;
}

// teacher: exported so a teacher-written stop is checked by the same rules as authored content.
export function actErrors(a, at, domain, ids) {
  const e = [];
  if (ids.has(a.id)) e.push(`${at}: duplicate id`);
  ids.add(a.id);
  if (!TYPES[domain]?.includes(a.type))
    e.push(`${at}: type ${a.type} does not belong to ${domain}`);
  if (!bi(a.title) || !bi(a.guide)) e.push(`${at}: title and guide must be bilingual`);
  if (domain === "listening" && !bi(a.say)) e.push(`${at}: listening needs a bilingual "say"`);
  if (domain === "reading") {
    if (a.say) e.push(`${at}: reading is never read aloud (no "say")`);
    if (!a.passage?.trim()) e.push(`${at}: reading needs a passage`);
  }
  if (domain === "listening" || domain === "reading") {
    if (!bi(a.hint) || !bi(a.explain) || a.hint?.en === a.explain?.en)
      e.push(`${at}: needs a bilingual hint and a different explanation`);
    const list =
      a.type === "read-order"
        ? a.items
        : a.type === "listen-place"
          ? a.spots
          : a.choices || a.options;
    if (!Array.isArray(list) || list.length < 3) e.push(`${at}: needs at least three choices`);
    else if (
      a.type !== "read-order" &&
      !(Number.isInteger(a.answer) && a.answer >= 0 && a.answer < list.length)
    )
      e.push(`${at}: answer out of range`);
    (a.choices || []).forEach((c) => {
      if (!hasPic(c.art) || !bi(c.alt))
        e.push(`${at}: picture ${c.art} needs art and a bilingual description`);
    });
    (a.items || []).forEach((c) => {
      if ((c.art && !hasPic(c.art)) || !bi(c.label))
        e.push(`${at}: order item needs a bilingual label (and known art)`);
    });
    (a.spots || []).forEach((p) => {
      if (!bi(p.label) || !(p.x >= 0 && p.x <= 360 && p.y >= 0 && p.y <= 200))
        e.push(`${at}: spot needs a bilingual label inside the 360 x 200 scene`);
    });
    if (a.type === "listen-place" && !hasSpots(a.scene)) e.push(`${at}: unknown scene ${a.scene}`);
    if (a.options && a.options.some((o) => !bi(o))) e.push(`${at}: options must be bilingual`);
    if (a.question && !bi(a.question)) e.push(`${at}: question must be bilingual`);
  }
  if (domain === "speaking" || domain === "writing") {
    if (!hasPic(a.art)) e.push(`${at}: unknown art ${a.art}`);
    if (!bi(a.prompt) || !bi(a.model) || !a.frame)
      e.push(`${at}: needs a bilingual prompt and model, and a frame`);
    if (!a.checks?.length || a.checks.some((c) => !bi(c)))
      e.push(`${at}: needs a bilingual self-check`);
    if (!a.bank?.length) e.push(`${at}: needs a word bank`);
  }
  if (domain === "writing") {
    if (!(a.minWords > 0 && a.minSentences > 0)) e.push(`${at}: needs minWords and minSentences`);
    const failed = checkWriting(a.model?.en, a).filter((c) => !c.ok);
    if (failed.length)
      e.push(`${at}: the model fails its own checks (${failed.map((c) => c.id).join(", ")})`);
  }
  return e;
}
