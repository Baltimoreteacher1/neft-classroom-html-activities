// Create · "Use your own file or text": a teacher's Word file, text file or pasted text becomes the starting resource,
// read entirely on this device by the Activity Studio's source workspace (studio/x/ingest*.js: no network, no model,
// nothing logged). Anything ambiguous (an unmarked answer, a broken choice list) is listed for the teacher, never guessed.

import { h } from "../studio/editor/ui.js";

export const UPLOAD_TYPES = ".docx,.txt,.md,.csv,.pdf";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Read one source into an activity. Pure apart from the lazy imports.
 * @param {{name?: string, bytes?: Uint8Array, text?: string}} input
 * @returns {Promise<{ok: true, activity, review: {en,es}[], title} | {ok: false, error: {en, es}}>}
 */
export async function readUpload({ name = "", bytes, text }) {
  const lower = name.toLowerCase();
  const ingest = await import("../studio/x/ingest.js");
  let result;
  if (bytes && bytes.length > MAX_BYTES)
    return {
      ok: false,
      error: { en: "That file is larger than 5 MB.", es: "Ese archivo pesa más de 5 MB." },
    };
  if (lower.endsWith(".pdf")) result = ingest.ingestPdf();
  else if (lower.endsWith(".docx")) {
    const { ingestDocx } = await import("../studio/x/ingest-docx.js");
    result = await ingestDocx(bytes, { filename: name });
  } else {
    const src =
      typeof text === "string" ? text : new TextDecoder().decode(bytes || new Uint8Array());
    result = ingest.ingestText(src, { filename: name || "pasted.txt" });
  }
  if (!result?.ok)
    return {
      ok: false,
      error: result?.error?.en
        ? result.error
        : { en: "Nothing could be read from that.", es: "No se pudo leer nada de eso." },
    };
  const { buildActivityFromIngest } = await import("../studio/x/ingest-build.js");
  const title =
    name
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[-_]+/g, " ")
      .trim()
      .slice(0, 100) || "My resource";
  const built = buildActivityFromIngest(result, {}, { title });
  if (!built.ok || !built.activity)
    return {
      ok: false,
      error: {
        en: "No questions, words or passage could be found in that. Check the format and try again.",
        es: "No se encontraron preguntas, palabras ni lecturas. Revise el formato e intente de nuevo.",
      },
    };
  const review = [...(result.review || []), ...(built.review || [])]
    .map((r) => r.reason || r)
    .filter((r) => r && typeof r.en === "string");
  return { ok: true, activity: built.activity, review, title: built.activity.title || title };
}

/**
 * The upload view inside the Create dialog.
 * @param {{S: Function, lang: string, body: HTMLElement, onActivity: (activity, source, review) => void, back: () => void}} env
 */
export function showUpload(env) {
  const { S, body } = env;
  const msg = h("p.cr-status", { role: "status", "aria-live": "polite" });
  const say = (m) => {
    msg.textContent = m;
  };
  const tr = (p) => (env.lang === "es" ? p.es : p.en);
  const use = async (input) => {
    say(S("Reading…", "Leyendo…"));
    const r = await readUpload(input).catch(() => ({
      ok: false,
      error: { en: "That could not be read.", es: "No se pudo leer." },
    }));
    if (!r.ok) return say(tr(r.error));
    say("");
    env.onActivity(
      r.activity,
      {
        family: "upload",
        ref: (input.name || "pasted").replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 120) || "pasted",
        title: r.title,
      },
      r.review.map(tr),
    );
  };
  const file = h("input.cr-input", {
    type: "file",
    accept: UPLOAD_TYPES,
    "aria-describedby": "cr-up-hint",
  });
  file.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (f) use({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) });
  });
  const area = h("textarea.cr-input.cr-paste", {
    rows: 8,
    "aria-label": S("Paste text", "Pegar texto"),
    placeholder: S(
      "Paste questions, a word list or a passage. Example:\n1. What do seeds need?\nA. Water and sun *\nB. Snow",
      "Pegue preguntas, una lista de palabras o una lectura. Ejemplo:\n1. ¿Qué necesitan las semillas?\nA. Agua y sol *\nB. Nieve",
    ),
  });
  body.replaceChildren(
    h(
      "p.cr-lede",
      S(
        "Start from your own material. It is read on this device only; nothing is uploaded.",
        "Empiece con su propio material. Se lee solo en este dispositivo; no se sube nada.",
      ),
    ),
    h("label.cr-label", S("Word or text file", "Archivo de Word o de texto"), file),
    h(
      "p.cr-fine",
      { id: "cr-up-hint" },
      S(
        "Word (.docx), text (.txt, .md, .csv). For a PDF, copy its text and paste it below.",
        "Word (.docx), texto (.txt, .md, .csv). Para un PDF, copie su texto y péguelo abajo.",
      ),
    ),
    h("label.cr-label", S("Or paste text", "O pegue texto"), area),
    h(
      "div.cr-actions",
      h(
        "button.cr-btn.cr-primary",
        {
          type: "button",
          onclick: () =>
            area.value.trim()
              ? use({ name: "", text: area.value })
              : say(S("Paste some text first.", "Primero pegue texto.")),
        },
        S("Use this text", "Usar este texto"),
      ),
      h("button.cr-btn", { type: "button", onclick: () => env.back() }, S("Back", "Volver")),
    ),
    msg,
  );
}
