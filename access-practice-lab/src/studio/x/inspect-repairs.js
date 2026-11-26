// Safe, deterministic repairs for Creation Quality Inspector findings. A repair never rewrites instructional
// wording or an answer: it renumbers a typed sequence, drops an exact duplicate, adds the standard per-format
// direction line that already exists in print/strings.js, copies the vocabulary block's spelling, or removes a
// picture that cannot be shown (leaving a teacher note). Everything else stays a finding.

import { plainMath } from "../core/math.js";
import { normalizeActivity, safeImageSrc } from "../core/schema.js";
import { PRINT_STRINGS } from "../print/strings.js";
import { PREFIX } from "./inspect-checks.js";
import { termVariants, vocabTerms } from "./inspect-content.js";
import { mapStrings } from "./inspect-text.js";

const isQ = (b) => b?.type === "question";
const onlyBlock = (work, where) =>
  (work.blocks || []).filter(
    (b) => b && typeof b === "object" && (!where.blockId || b.id === where.blockId),
  );
const renumber = (list, key) => {
  const nums = list.map((x) => PREFIX.exec(x[key] ?? "")?.[2]);
  if (
    list.length < 2 ||
    nums.some((n) => n === undefined) ||
    nums.every((n, i) => Number(n) === i + 1)
  )
    return false;
  list.forEach((x, i) => {
    x[key] = x[key].replace(PREFIX, (_m, a, _n, c) => `${a}${i + 1}${c}`);
  });
  return true;
};

const key = (s) => plainMath(s).toLowerCase().replace(/\s+/g, " ").trim();

function termFixer(term) {
  return (text) => {
    const hits = termVariants(text, term);
    let out = text;
    for (const h of hits.reverse()) {
      const upper =
        h.found[0] !== h.found[0].toLowerCase() && h.found[0] === h.found[0].toUpperCase();
      const start = !out.slice(0, h.index).trim() || /[.!?]\s*$/.test(out.slice(0, h.index));
      const word =
        upper && start && term[0] === term[0].toLowerCase()
          ? term[0].toUpperCase() + term.slice(1)
          : term;
      out = out.slice(0, h.index) + word + out.slice(h.index + h.found.length);
    }
    return out;
  };
}

const NOTE_TEXT =
  "Removed a picture whose source could not be shown (another website, or not a PNG, JPG, WebP or GIF). Add it again from your device. / Se quitó una imagen cuya fuente no se pudo mostrar (otro sitio web, o no es PNG, JPG, WebP ni GIF). Vuelva a agregarla desde su dispositivo.";

const REPAIRS = {
  "renumber-sequence"(work, where, log) {
    if (where.blockId) {
      for (const b of onlyBlock(work, where).filter((x) => isQ(x) && x.format === "error"))
        if (renumber(b.steps || [], "text"))
          log(
            b.id,
            "Renumbered the steps in the order shown.",
            "Se renumeraron los pasos en el orden mostrado.",
          );
      return;
    }
    const qs = work.blocks.filter(isQ);
    if (renumber(qs, "prompt"))
      log(
        "",
        "Renumbered the questions in the order shown.",
        "Se renumeraron las preguntas en el orden mostrado.",
      );
  },

  "trim-duplicate-order-items"(work, where, log) {
    for (const b of onlyBlock(work, where).filter((x) => isQ(x) && x.format === "order")) {
      const seen = new Set();
      const kept = (b.items || []).filter((i) => !seen.has(key(i.text)) && seen.add(key(i.text)));
      if (kept.length === (b.items || []).length || kept.length < 2) continue;
      b.items = kept;
      log(
        b.id,
        "Removed a repeated item from the list to put in order.",
        "Se quitó un elemento repetido de la lista para ordenar.",
      );
    }
  },

  "add-default-directions"(work, where, log) {
    for (const b of onlyBlock(work, where).filter(isQ)) {
      const how = PRINT_STRINGS.how[b.format];
      if (!how || String(b.prompt ?? "").trim()) continue;
      b.prompt = how.en;
      log(
        b.id,
        "Added the standard directions line for this question type.",
        "Se agregó la línea estándar de instrucciones para este tipo de pregunta.",
      );
    }
  },

  "normalize-terminology"(work, where, log) {
    const terms = vocabTerms(normalizeActivity(structuredClone(work)));
    work.blocks = work.blocks.map((b) => {
      if (!b || b.type === "vocab" || (where.blockId && b.id !== where.blockId)) return b;
      let changed = false;
      const out = mapStrings(b, (s) => {
        let t = s;
        for (const term of terms) t = termFixer(term)(t);
        changed ||= t !== s;
        return t;
      });
      if (changed)
        log(
          b.id,
          "Used the vocabulary list's spelling for a vocabulary word.",
          "Se usó la ortografía de la lista de vocabulario para una palabra.",
        );
      return out;
    });
  },

  "remove-invalid-image"(work, where, log) {
    const noteFor = (id, used) => {
      let n = `ni-${String(id).slice(0, 26)}`;
      while (used.has(n)) n += "x";
      used.add(n);
      return { id: n.slice(0, 32), type: "note", text: NOTE_TEXT };
    };
    const used = new Set(work.blocks.map((b) => b?.id));
    // An image block whose source is empty was normalized from an unusable one (validate "bad-image"): same repair.
    const bad = (img) =>
      img && typeof img.src === "string" && img.src.trim() && !safeImageSrc(img.src);
    const out = [];
    for (const b of work.blocks) {
      if (!b || (where.blockId && b.id !== where.blockId)) {
        out.push(b);
        continue;
      }
      if (b.type === "image" && !safeImageSrc(b.src)) {
        out.push(noteFor(b.id, used));
        log(
          b.id,
          "Removed a picture that could not be shown and left a teacher note.",
          "Se quitó una imagen que no se podía mostrar y se dejó una nota para el maestro.",
        );
        continue;
      }
      out.push(b);
      let hit = false;
      if (isQ(b) && bad(b.image)) {
        b.image = null;
        hit = true;
      }
      if (b.type === "vocab")
        for (const v of Array.isArray(b.items) ? b.items : [])
          if (bad(v?.image)) {
            v.image = null;
            hit = true;
          }
      if (hit) {
        out.push(noteFor(b.id, used));
        log(
          b.id,
          "Removed a picture that could not be shown and left a teacher note.",
          "Se quitó una imagen que no se podía mostrar y se dejó una nota para el maestro.",
        );
      }
    }
    work.blocks = out;
  },
};

export const REPAIR_IDS = Object.freeze(Object.keys(REPAIRS));

/**
 * Apply one repair to a copy of `activity`; the input is never changed.
 * @param {object} activity
 * @param {string} repairId one of REPAIR_IDS (a finding's `repair`)
 * @param {{blockId?: string}} where a finding's `where`; with no blockId the repair covers the whole activity
 * @returns {{activity: object, applied: boolean, changes: Array<{blockId: string, message: {en: string, es: string}}>}}
 *   applying the same repair again changes nothing (`applied: false`).
 */
export function applyRepair(activity, repairId, where = {}) {
  const fix = REPAIRS[repairId];
  if (!fix) throw new RangeError(`Unknown repair: ${repairId}`);
  const work = structuredClone(activity);
  if (!Array.isArray(work.blocks)) work.blocks = [];
  const changes = [];
  fix(work, where || {}, (blockId, en, es) => changes.push({ blockId, message: { en, es } }));
  return { activity: normalizeActivity(work), applied: changes.length > 0, changes };
}
