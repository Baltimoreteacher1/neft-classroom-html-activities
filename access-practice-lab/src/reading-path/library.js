// Original fluency texts and plays. The shared recorder keeps takes in memory until an explicit keep.
import { recorderHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { isRecording, takesFor } from "../recorder.js";
import { keep } from "../audio-store.js";
import { speak, getAvailableVoices } from "../speech.js";
import { BASE, html, announce } from "../util.js";
let data,
  role = "Reader",
  at = 0,
  active = "";
const load = async () =>
  (data ||= await fetch(`${BASE}/content/reading-path/library/texts.json`).then((r) => {
    if (!r.ok) throw new Error("Fluency library unavailable");
    return r.json();
  }));
const key = (item) => `rp:${item.id}:${at}`;
export async function renderLibrary(ctx) {
  await load();
  const I = i18nFor(ctx);
  const item = data.items.find((x) => x.id === ctx.route.sub);
  if (active !== item?.id) {
    at = 0;
    active = item?.id || "";
    role = "Reader";
  }
  const href = (id) => `${BASE}/reading-path/library${id ? `/${id}` : ""}?grades=${ctx.band}`;
  if (!item)
    return {
      title: I.S("Read-aloud library", "Biblioteca de lectura"),
      html: html`<article class="in-page rp-page"><a href="${BASE}/reading-path?grades=${ctx.band}">${I.T("Reading Path", "Camino de lectura")}</a><h1>${I.T("Read-aloud library", "Biblioteca de lectura")}</h1>${[
        ["fiction", "Fiction", "Ficción"],
        ["nonfiction", "Nonfiction", "Textos informativos"],
        ["poetry", "Poetry", "Poesía"],
        ["riddles", "Riddles", "Adivinanzas"],
        ["tongue-twisters", "Tongue twisters", "Trabalenguas"],
        ["plays", "Plays", "Obras teatrales"],
      ].map(
        ([kind, en, es]) =>
          html`<section><h2>${I.T(en, es)}</h2><ul>${data.items.filter((x) => x.kind === kind).map((x) => html`<li><a href="${href(x.id)}">${I.T(x.title.en, x.title.es)}</a></li>`)}</ul></section>`,
      )}</article>`,
    };
  const turn = item.turns?.[at];
  const k = key(item);
  const mine = turn?.part === role;
  return {
    title: I.S(item.title.en, item.title.es),
    html: html`<article class="in-page rp-page"><a href="${href("")}">${I.T("Library", "Biblioteca")}</a><h1>${I.T(item.title.en, item.title.es)}</h1><p lang="en">${item.text.en}</p><details><summary>${I.T("Spanish meaning", "Significado en español")}</summary><p lang="es">${item.text.es}</p></details>${item.kind === "plays" ? html`<label for="rpPart">${I.T("My part", "Mi papel")}</label><select id="rpPart" data-rp-part>${item.parts.map((p) => html`<option ${p === role ? "selected" : ""}>${p}</option>`)}</select><h2>${I.T(`Turn ${at + 1} of ${item.turns.length}`, `Turno ${at + 1} de ${item.turns.length}`)} · ${turn.part}</h2><p lang="en">${turn.en}</p><p>${mine ? I.T("Your turn. Read this line aloud.", "Tu turno. Lee esta línea en voz alta.") : I.T("Hear the other part, then move on.", "Escucha el otro papel y luego sigue.")}</p>${mine ? recorderHTML(k, { recording: isRecording(k), i18n: I }) : html`<button class="btn" data-rp-fluency-hear>${I.T("Hear this part", "Escuchar este papel")}</button>`}${mine && takesFor(k).length ? html`<button class="btn" data-rp-fluency-keep>${I.T("Keep for my teacher", "Guardar para mi docente")}</button><p>${I.T("Saved on this device for up to 30 days. Delete it in Passport.", "Se guarda en este dispositivo hasta 30 días. Puedes borrarlo en el Pasaporte.")}</p>` : ""}<button class="btn" data-rp-fluency-next>${at + 1 < item.turns.length ? I.T("Next turn", "Siguiente turno") : I.T("Read it again", "Leer de nuevo")}</button>` : html`<button class="btn" data-rp-fluency-hear>${I.T("Hear the text", "Escuchar el texto")}</button>${item.answer ? html`<details><summary>${I.T("I am ready to see the answer", "Quiero ver la respuesta")}</summary><p lang="en">${item.answer.en}</p><p lang="es">${item.answer.es}</p></details>` : ""}`}<p class="fine">${I.T("Spanish is machine-assisted, not human-reviewed.", "El español cuenta con ayuda automática; no lo ha revisado una persona.")}</p></article>`,
  };
}
export async function onLibraryClick(e, ctx) {
  const b = e.target.closest("button");
  if (!b) return false;
  const item = data?.items.find((x) => x.id === ctx.route.sub);
  if (!item) return false;
  const I = i18nFor(ctx);
  if (b.hasAttribute("data-rp-fluency-hear")) {
    const voices = getAvailableVoices("en");
    const idx = item.parts?.indexOf(item.turns[at].part) || 0;
    await speak(item.turns?.[at]?.en || item.text.en, {
      voiceURI: voices[idx % Math.max(1, voices.length)]?.voiceURI || "",
      pitch: [1, 0.85, 1.15][idx],
    });
    return true;
  }
  if (b.hasAttribute("data-rp-fluency-next")) {
    at = (at + 1) % item.turns.length;
    await ctx.rerender();
    return true;
  }
  if (b.hasAttribute("data-rp-fluency-keep")) {
    const take = takesFor(key(item)).at(-1);
    const ok = take && (await keep(take, item.id));
    announce(
      ok
        ? I.S("Saved on this device.", "Guardado en este dispositivo.")
        : I.S(
            "Could not save. Try downloading the recording.",
            "No se pudo guardar. Prueba descargar la grabación.",
          ),
    );
    return true;
  }
  return false;
}
export function onLibraryChange(e, ctx) {
  if (!e.target.hasAttribute("data-rp-part")) return;
  role = e.target.value;
  at = 0;
  ctx.rerender();
}
