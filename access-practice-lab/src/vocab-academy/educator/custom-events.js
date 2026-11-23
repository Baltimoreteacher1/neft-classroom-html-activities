// Teacher: the custom unit builder's events (clicks, changes, inputs). Screens are custom-screens.js; pure logic is custom.js.
import { ACTIVITY_TYPES, fitsGrade } from "../activities/index.js";
import { SHIPPED_GRADES } from "../contract.js";
import { getUnit, getWord } from "../data.js";
import { loadProgress } from "../store.js";
import { presetById } from "./ui-supports.js";
import { setRegion } from "./kit.js";
import {
  MAX_WORDS,
  blankWord,
  buildUnit,
  deleteCustom,
  draftFromList,
  draftFromRecords,
  exportUnitText,
  getCustom,
  listCustom,
  parseGlyphs,
  parseWordList,
  saveCustom,
  unitsFromFile,
  validateUnit,
} from "./custom.js";
import { C, blankDraft, corpus, draft, say } from "./custom-screens.js";

// ── events ────────────────────────────────────────────────────────────────────
const merge = (list, words) => {
  const seen = new Set(list.map((w) => `${w.hw.toLowerCase()}|${w.pos}`));
  const add = words.filter((w) => !seen.has(`${w.hw.toLowerCase()}|${w.pos}`));
  return [...list, ...add].slice(0, MAX_WORDS);
};
const unitFieldSet = (f, v) => {
  const d = draft();
  d[f] = v;
};
const download = (name, text) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

export const CLICKS = new Set([
  "make-cards",
  "find-topic",
  "use-topic",
  "do-search",
  "add-id",
  "clone-load",
  "add-blank",
  "remove",
  "up",
  "down",
  "act-all",
  "save",
  "check",
  "new",
  "export",
  "print",
  "delete",
  "delete-yes",
  "delete-no",
]);
export const CHANGES = new Set([
  "source",
  "paste",
  "topic",
  "search",
  "search-grade",
  "clone-grade",
  "clone-unit",
  "word-field",
  "unit-field",
  "activity",
  "supports",
  "import",
]);
export const INPUTS = new Set(["paste", "topic", "search", "word-field", "unit-field"]);

export async function customClick(e, ctx, va) {
  const b = e.target.closest?.("[data-vc]");
  const I = va.I;
  const act = b.dataset.vc;
  const d = draft();
  const i = Number(b.dataset.i);
  const { index, byHw: map } = await corpus();
  C.msg = null;
  if (act === "make-cards") {
    const items = parseWordList(C.paste);
    if (!items.length)
      return say(
        I.S("Paste or type some words first.", "Primero pega o escribe algunas palabras."),
        "warn",
      );
    const words = await draftFromList(items, map, getWord);
    d.words = merge(d.words, words);
    C.paste = "";
    C.checked = false;
    return ctx.rerender();
  }
  if (act === "find-topic" || act === "use-topic") {
    const t = C.topic.trim().toLowerCase();
    if (!t) return say(I.S("Type a topic first.", "Primero escribe un tema."), "warn");
    if (act === "use-topic") {
      if (!d.theme) d.theme = C.topic.trim();
      if (!d.title) d.title = C.topic.trim();
      return ctx.rerender();
    }
    const terms = t.split(/\s+/).filter((x) => x.length > 2);
    const units = SHIPPED_GRADES.flatMap((g) => index.grades?.[g]?.units || []).filter((u) =>
      terms.some((x) => `${u.title} ${u.theme}`.toLowerCase().includes(x)),
    );
    C.hits = units
      .flatMap((u) =>
        u.words.map((w) => ({ ...w, grade: index.words?.[w.id]?.grade || u.id.slice(1, 2) })),
      )
      .slice(0, 40);
    say(
      C.hits.length
        ? ""
        : I.S(
            "No published lesson matches that topic. Use the topic as your theme and add your own words.",
            "Ninguna lección publicada coincide con ese tema. Usa el tema como tu tema y agrega tus propias palabras.",
          ),
      "warn",
    );
    return ctx.rerender();
  }
  if (act === "do-search") {
    const q = C.search.trim().toLowerCase();
    C.hits = q
      ? Object.entries(index.words || {})
          .filter(
            ([, w]) =>
              String(w.hw).toLowerCase().includes(q) &&
              (!C.searchGrade || w.grade === C.searchGrade),
          )
          .slice(0, 30)
          .map(([id, w]) => ({ id, ...w }))
      : [];
    say(
      C.hits.length || !q
        ? ""
        : I.S(
            "No published word matches. Add it as a blank card and write it yourself.",
            "Ninguna palabra publicada coincide. Agrégala como tarjeta en blanco y escríbela tú.",
          ),
      "warn",
    );
    return ctx.rerender();
  }
  if (act === "add-id") {
    const found = (await getWord(b.dataset.id))?.word;
    if (found) d.words = merge(d.words, draftFromRecords([found]));
    return ctx.rerender();
  }
  if (act === "clone-load") {
    const unit = C.cloneUnit ? await getUnit(C.cloneUnit) : null;
    if (!unit) return say(I.S("Choose a lesson to copy.", "Elige una lección para copiar."), "warn");
    C.draft = {
      ...blankDraft(),
      title: `${unit.title} (copy)`.slice(0, 70),
      grade: unit.grade,
      theme: unit.theme || "",
      objectives: (unit.objectives || []).join("\n"),
      words: draftFromRecords(unit.words).slice(0, MAX_WORDS),
    };
    C.editing = "";
    C.checked = false;
    return ctx.rerender();
  }
  if (act === "add-blank") {
    if (d.words.length < MAX_WORDS) d.words.push(blankWord());
    return ctx.rerender();
  }
  if (act === "remove") d.words.splice(i, 1);
  else if (act === "up" && i > 0) [d.words[i - 1], d.words[i]] = [d.words[i], d.words[i - 1]];
  else if (act === "down" && i < d.words.length - 1)
    [d.words[i + 1], d.words[i]] = [d.words[i], d.words[i + 1]];
  else if (act === "act-all")
    d.activities = ACTIVITY_TYPES.filter((t) => fitsGrade(t, d.grade)).map((t) => t.id);
  else if (act === "check" || act === "save") {
    C.checked = true;
    const r = validateUnit(d);
    C.saveMsg = "";
    if (!r.ok) {
      ctx.rerender();
      setTimeout(() => document.getElementById("vatCAlert")?.focus(), 60);
      return;
    }
    const unit = act === "save" ? buildUnit(d, { id: C.editing, taken: listCustom().map((u) => u.id) }) : null;
    if (unit) {
      const res = saveCustom(unit);
      C.editing = unit.id;
      C.saveMsg =
        res.state === "saved"
          ? I.S("Saved to your Teacher Library.", "Guardado en tu Biblioteca docente.")
          : I.S(
              "This device could not save. Export the lesson file to keep it.",
              "Este dispositivo no pudo guardar. Exporta el archivo de la lección para conservarla.",
            );
    } else C.saveMsg = I.S("This lesson is ready to save.", "Esta lección está lista para guardar.");
    return ctx.rerender();
  } else if (act === "new") {
    C.draft = blankDraft();
    C.editing = "";
    C.checked = false;
  } else if (act === "export") {
    const u = getCustom(b.dataset.id);
    if (u)
      download(`vocabulary-academy-${u.id.replace(/[^a-z0-9-]/gi, "_")}.json`, exportUnitText(u));
    return;
  } else if (act === "print") {
    C.printId = b.dataset.id;
    ctx.rerender();
    document.body.classList.add("vat-printing-list");
    addEventListener("afterprint", () => document.body.classList.remove("vat-printing-list"), {
      once: true,
    });
    return setTimeout(() => globalThis.print?.(), 80);
  } else if (act === "delete") C.pendingDelete = b.dataset.id;
  else if (act === "delete-no") C.pendingDelete = "";
  else if (act === "delete-yes") {
    deleteCustom(b.dataset.id);
    C.pendingDelete = "";
    if (C.editing === b.dataset.id) {
      C.draft = blankDraft();
      C.editing = "";
    }
  } else return;
  ctx.rerender();
}

export async function customChange(e, ctx, va) {
  const el = e.target.closest?.("[data-vc]");
  const act = el.dataset.vc;
  const d = draft();
  if (act === "source") {
    C.source = el.value;
    C.hits = [];
    return ctx.rerender();
  }
  if (act === "paste") C.paste = el.value;
  else if (act === "topic") C.topic = el.value;
  else if (act === "search") C.search = el.value;
  else if (act === "search-grade") C.searchGrade = el.value;
  else if (act === "clone-grade") {
    C.cloneGrade = el.value;
    C.cloneUnit = "";
    return ctx.rerender();
  } else if (act === "clone-unit") C.cloneUnit = el.value;
  else if (act === "unit-field") {
    unitFieldSet(el.dataset.f, el.value);
    if (el.dataset.f === "grade") ctx.rerender();
  } else if (act === "word-field") {
    const w = d.words[Number(el.dataset.i)];
    if (!w) return;
    if (el.dataset.f === "glyphs") {
      w.glyphsText = el.value;
      w.glyphs = parseGlyphs(el.value);
    } else w[el.dataset.f] = el.value;
  } else if (act === "activity") {
    const set = new Set(d.activities);
    el.checked ? set.add(el.dataset.id) : set.delete(el.dataset.id);
    d.activities = [...set];
  } else if (act === "supports")
    d.supports = el.value ? { ...presetById(el.value), preset: el.value } : null;
  else if (act === "import") {
    const f = el.files?.[0];
    if (!f) return;
    let units = [];
    try {
      units = unitsFromFile(JSON.parse(await f.text()));
    } catch {
      units = [];
    }
    if (!units.length)
      return say(
        va.I.S(
          "That file has no custom lessons this builder can read.",
          "Ese archivo no tiene lecciones personalizadas que este creador pueda leer.",
        ),
        "warn",
      );
    const existing = new Set(loadProgress().custom ? Object.keys(loadProgress().custom) : []);
    for (const u of units) saveCustom(u);
    ctx.rerender();
    return say(
      va.I.S(
        `Loaded ${units.length} unit(s) (${units.filter((u) => existing.has(u.id)).length} replaced a copy you already had).`,
        `Se cargaron ${units.length} unidad(es) (${units.filter((u) => existing.has(u.id)).length} reemplazaron una copia que ya tenías).`,
      ),
      "ok",
    );
  }
}
