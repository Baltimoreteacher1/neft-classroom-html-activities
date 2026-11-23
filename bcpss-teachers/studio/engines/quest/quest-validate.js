// Validator for vocab-quest activities (rules in engines/vocab-quest.schema.md). Pure.
// validateQuest(activity, entries) -> string[] (empty means valid). `entries` is the resolved entry array.
import { TIER_IDS } from "../../data/taxonomy.js";
import { STAGE_KINDS, hasWord, partsOf } from "./quest-logic.js";

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const EMOJI = /\p{Extended_Pictographic}/u;
const BAD =
  /\b(lorem ipsum|TODO|TBD|coming soon|placeholder|countdown|timer|stopwatch|beat the clock)\b/i;
const KINDS = ["picture-word", "meaning", "cloze", "type-word", "word-parts", "say-write"];
const ID = /^[a-z0-9-]+$/;
const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];

function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}
/** Every piece of text a visual would print or announce (structural keys such as kind and icon names are not text). */
const SKIP = new Set([
  "kind",
  "icon",
  "name",
  "bg",
  "fill",
  "stroke",
  "palette",
  "t",
  "color",
  "d",
  "style",
]);
function visualText(spec, out = []) {
  if (typeof spec === "string") out.push(spec);
  else if (Array.isArray(spec)) spec.forEach((x) => visualText(x, out));
  else if (spec && typeof spec === "object")
    for (const [k, v] of Object.entries(spec)) if (!SKIP.has(k)) visualText(v, out);
  return out;
}

export function validateQuest(a, entries = []) {
  const out = [];
  const bad = (m) => out.push(m);
  if (a?.engine !== "vocab-quest") return ["engine must be vocab-quest"];
  if (!isStr(a.id) || !ID.test(a.id)) bad("id must be kebab-case");
  for (const f of ["title", "intro"]) if (!isStr(a[f])) bad(`${f} required`);
  if (!GRADES.includes(String(a.grade))) bad("grade must be K-8");
  if (!Array.isArray(a.standards) || !a.standards.length) bad("standards required");
  if (typeof a.minutes !== "number" || a.minutes < 8 || a.minutes > 40)
    bad("minutes must be 8..40");
  if (!!a.collection === !!a.entries) bad("exactly one of collection / entries");
  if (a.collection && !ID.test(a.collection)) bad("collection id must be kebab-case");
  const byId = new Map(entries.map((e) => [e.id, e]));
  if (byId.size !== entries.length) bad("entry ids must be unique");
  for (const e of entries) {
    if (!/^[a-z0-9-]+$/.test(e.id || "")) bad(`entry ${e.id}: id must be kebab-case`);
    if (e.id?.includes(".")) bad(`entry ${e.id}: id may not contain a dot`);
    if (!isStr(e.word) || !isStr(e.def) || !isStr(e.pos) || !isStr(e.pron))
      bad(`entry ${e.id}: word, pos, pron and def required`);
    else if (hasWord(e.def, e.word)) bad(`entry ${e.id}: def contains the word`);
    if (!e.visual && !isStr(e.noVisualReason))
      bad(`entry ${e.id}: visual or noVisualReason required`);
    if (e.visual && (!e.visual.kind || !isStr(e.visual.alt)))
      bad(`entry ${e.id}: visual needs kind and alt`);
    if (!isStr(e.academicSentence)) bad(`entry ${e.id}: academicSentence required`);
  }
  if (a.frames)
    for (const t of TIER_IDS)
      if (!Array.isArray(a.frames[t]) || a.frames[t].some((f) => !isStr(f)))
        bad(`frames.${t} must be an array of strings`);
  if (
    !a.reflection?.prompt ||
    TIER_IDS.some((t) => !Array.isArray(a.reflection.frames?.[t]) || !a.reflection.frames[t].length)
  )
    bad("reflection needs a prompt and at least one frame per tier");

  const stages = a.stages || [];
  if (stages.length !== 5 || stages.some((s, i) => s.kind !== STAGE_KINDS[i]))
    bad(`stages must be exactly 5 in order: ${STAGE_KINDS.join(", ")}`);
  const sid = new Set();
  const used = new Set();
  for (const s of stages) {
    const w = `stage ${s.id}`;
    if (!isStr(s.id) || !ID.test(s.id) || sid.has(s.id))
      bad(`${w}: id missing, malformed or duplicate`);
    sid.add(s.id);
    if (!isStr(s.title) || !isStr(s.intro)) bad(`${w}: title and intro required`);
    if (s.passMark != null && (s.passMark < 0.5 || s.passMark > 1))
      bad(`${w}: passMark must be 0.5..1`);
    const ids = s.entryIds || [];
    if (s.kind !== "revisit" && (ids.length < 3 || ids.length > 10))
      bad(`${w}: entryIds needs 3..10 ids`);
    if (s.kind === "revisit" && ids.length && (ids.length < 3 || ids.length > 10))
      bad(`${w}: entryIds needs 3..10 ids`);
    for (const id of ids) {
      if (!byId.has(id)) bad(`${w}: entryId "${id}" does not resolve`);
      if (s.kind !== "revisit") used.add(id);
    }
    if (s.kind === "revisit") continue;
    for (const k of s.kinds || []) if (!KINDS.includes(k)) bad(`${w}: unknown kind "${k}"`);
    const kinds =
      s.kinds ||
      {
        see: ["picture-word"],
        "use-in-context": ["cloze"],
        retrieve: ["type-word"],
        apply: ["say-write"],
      }[s.kind] ||
      [];
    for (const id of ids) {
      const e = byId.get(id);
      if (!e) continue;
      if (kinds.includes("picture-word") && !e.visual)
        bad(`${w}: picture-word needs a visual on "${id}"`);
      if (kinds.includes("cloze") && !hasWord(e.context, e.word))
        bad(`${w}: cloze needs the word in the context of "${id}"`);
      if (kinds.includes("word-parts") && !partsOf(e))
        bad(`${w}: word-parts parts do not spell "${id}"`);
      if (kinds.includes("say-write") && !isStr(e.practice?.speakWrite))
        bad(`${w}: say-write needs practice.speakWrite on "${id}"`);
    }
    for (const it of s.items || []) {
      const e = byId.get(it.entryId);
      const iw = `${w} item ${it.id || it.entryId}`;
      if (!e) {
        bad(`${iw}: entryId does not resolve`);
        continue;
      }
      if (it.kind === "sentence-choice") {
        if (!Array.isArray(it.choices) || it.choices.length !== 3)
          bad(`${iw}: needs exactly 3 choices`);
        else {
          if (!Number.isInteger(it.answer) || it.answer < 0 || it.answer > 2)
            bad(`${iw}: answer must be 0..2`);
          if (it.choices.some((c) => !hasWord(c, e.word)))
            bad(`${iw}: the word must appear in every choice`);
          if (new Set(it.choices).size !== 3) bad(`${iw}: choices must differ`);
        }
        if (!Array.isArray(it.hints) || it.hints.length !== 3 || it.hints.some((x) => !isStr(x)))
          bad(`${iw}: needs 3 hints`);
        else
          for (const hn of it.hints) {
            if (hn.toLowerCase().includes(e.def.toLowerCase()))
              bad(`${iw}: a hint repeats the definition`);
            for (const c of it.choices || [])
              if (hn.includes(c)) bad(`${iw}: a hint repeats a choice`);
          }
        if (!isStr(it.why)) bad(`${iw}: why required`);
        for (const m of it.misconceptions || [])
          if (
            !Number.isInteger(m.pick) ||
            m.pick === it.answer ||
            !/^[a-z0-9-]+$/.test(m.tag || "") ||
            !isStr(m.hint)
          )
            bad(`${iw}: misconception needs a wrong pick index, a kebab-case tag and a hint`);
      } else if (it.kind === "cloze") {
        if (it.sentence && (it.sentence.match(/___/g) || []).length !== 1)
          bad(`${iw}: sentence needs exactly one ___`);
        if (it.sentence && hasWord(it.sentence, e.word))
          bad(`${iw}: the sentence must not contain the word`);
      } else bad(`${iw}: authored kind must be sentence-choice or cloze`);
    }
  }
  const quizzed = new Set(stages.slice(0, 4).flatMap((s) => s.entryIds || []));
  for (const id of quizzed) {
    const e = byId.get(id);
    if (e?.visual && hasWord(visualText(e.visual).join(" "), e.word))
      bad(
        `entry ${id}: the visual text or alt contains the word (pictures are shown in picture-word and type-word items)`,
      );
  }
  if (a.vocabIds) {
    const u = new Set(stages.flatMap((s) => s.entryIds || []));
    if (a.vocabIds.length !== u.size || a.vocabIds.some((i) => !u.has(i)))
      bad("vocabIds must equal the union of stage entryIds");
  }
  for (const s of strings({ ...a, entries: undefined })) {
    if (EMOJI.test(s)) bad(`emoji in "${s.slice(0, 30)}"`);
    if (BAD.test(s)) bad(`placeholder or timer wording in "${s.slice(0, 40)}"`);
  }
  for (const e of entries)
    for (const s of strings(e)) if (EMOJI.test(s)) bad(`emoji in entry ${e.id}`);
  return out;
}
