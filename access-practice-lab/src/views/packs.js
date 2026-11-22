import { BASE, announce, html, storage } from "../util.js";
import { i18nFor } from "../i18n.js";
import { ACCESS_LAB_FLAGS } from "../lang/feature-flags.js";
import { printSheet } from "../print-sheet.js";

let packPromise;
let topicId = "school";
let mode = "browse";
let matchDeck = [];
let selected = [];
let matched = new Set();
let bingoCells = [];
const loadPack = () => (packPromise ||= fetch(`${BASE}/content/packs/survival-vocabulary.json`).then((r) => { if (!r.ok) throw new Error("Vocabulary pack could not load."); return r.json(); }));
const mix = (items) => [...items].sort(() => Math.random() - 0.5);
const words = (pack) => pack.topics.flatMap((t) => t.words.map((w) => ({ ...w, topic: t.id })));
const EXTENDED_PACKS = ["all-about-me", "new-arrival-school", "speaking-listening-cards", "sentence-building", "independent-menus", "scaffold-packs", "parents-carers", "learner-progress-tracker"];
const loadExtended = (id) => fetch(`${BASE}/content/packs/${encodeURIComponent(id)}.json`).then((r) => { if (!r.ok) throw new Error("This pack could not load."); return r.json(); });
const pairText = (p, es) => p?.[es ? "es" : "en"] || "";
const aboutMeValues = () => { try { return JSON.parse(storage.get("accessPracticeLab:v1:all-about-me") || "{}"); } catch { return {}; } };
function extendedPackHTML(pack, I) {
  const title = pairText(pack.title, I.spanish);
  const printable = (heading, rows) => html`<button class="btn" type="button" data-pack-print-extended="${heading}">${I.T("Print", "Imprimir")} · ${heading}</button><div class="lp-extended-print" data-print-content="${heading}"><h1>${heading}</h1>${rows}</div>`;
  if (pack.id === "all-about-me") { const saved = aboutMeValues(); return html`<p>${I.T("Your writing stays on this device. Enter only information you choose to save.", "Tu texto queda en este dispositivo. Escribe solo la información que quieras guardar.")}</p><div class="lp-extended-grid">${pack.printables.map((sheet) => html`<section class="panel"><h2>${pairText(sheet.title, I.spanish)}</h2>${sheet.prompts.map((p, i) => html`<label>${p}<input type="text" maxlength="80" data-about-me-field="${sheet.id}:${i}" value="${saved[`${sheet.id}:${i}`] || ""}"></label>`)}<button class="btn" data-about-me-save="${sheet.id}" type="button">${I.T("Save to this device", "Guardar en este dispositivo")}</button>${printable(pairText(sheet.title, I.spanish), sheet.prompts.map((p, i) => html`<p><strong>${p}</strong> ${saved[`${sheet.id}:${i}`] || "____________________________"}</p>`))}</section>`)}</div>`; }
  if (pack.id === "new-arrival-school") return html`<section class="panel"><h2>${I.T("School routines", "Rutinas escolares")}</h2><div class="lp-extended-grid">${pack.routines.map((routine) => html`<section><h3>${routine}</h3>${pack.phrases.filter((p) => p.routine === routine).map((p) => html`<p><span lang="en">${p.en}</span><br><span lang="es">${p.es}</span><button class="btn small" type="button" data-pack-say-en="${p.en}">${I.T("Hear phrase", "Escuchar frase")}</button></p>`)}</section>`)}</div><h2>${I.T("Welcome letter", "Carta de bienvenida")}</h2><p lang="en">${pack.welcome.en}</p><p lang="es">${pack.welcome.es}</p><h2>${I.T("School map labels", "Etiquetas para el mapa escolar")}</h2>${printable(title, pack.mapLabels.map((x) => html`<p>${x}: __________________</p>`))}</section>`;
  if (pack.cards) return html`<p>${I.T(`${pack.cards.length} speaking cards · 3 for each Key Language Use and band.`, `${pack.cards.length} tarjetas para hablar · 3 por uso clave del lenguaje y grado.`)}</p><label class="field">${I.T("Band", "Grado")}<select data-pack-band><option value="K-2">K-2</option><option value="3-5">3-5</option><option value="6-8">6-8</option></select></label><div class="lp-extended-grid">${pack.cards.map((c) => html`<article class="panel" data-pack-card-band="${c.band}"><p class="eyebrow">${c.klu} · ${c.band}</p><h2>${c.prompt}</h2><p>${c.sentenceFrame}</p></article>`)}</div><button class="btn" type="button" data-pack-print-extended="${title}">${I.T("Print speaking cards", "Imprimir tarjetas para hablar")}</button>`;
  if (pack.functions) return html`<div class="lp-extended-grid">${pack.functions.map((f) => html`<section class="panel"><h2>${f.function}</h2>${f.frames.map((frame) => html`<p class="frame-strip">${frame}</p>`)}</section>`)}</div>${printable(title, pack.functions.flatMap((f) => f.frames.map((x) => html`<p>${f.function}: ${x}</p>`)))}`;
  if (pack.menus) return html`<div class="lp-extended-grid">${pack.menus.map((m) => html`<section class="panel"><h2>${pairText(m.title, I.spanish)}</h2><ol>${m.choices.map((c) => html`<li>${c}</li>`)}</ol></section>`)}</div>${printable(title, pack.menus.map((m) => html`<section><h2>${pairText(m.title, I.spanish)}</h2><ol>${m.choices.map((c) => html`<li>${c}</li>`)}</ol></section>`))}`;
  if (pack.subjects) return html`<div class="lp-extended-grid">${pack.subjects.map((s) => html`<section class="panel"><h2>${s.subject}</h2>${s.bands.map((b) => html`<h3>${b.band}</h3><p><strong>${I.T("Word bank", "Banco de palabras")}:</strong> ${b.wordBank.join(", ")}</p><p>${b.frame}</p>`)}</section>`)}</div>`;
  if (pack.pages) return html`<div class="lp-extended-grid">${pack.pages.map((p) => html`<section class="panel"><h2 lang="en">${p.title.en}</h2><p lang="en">${p.body.en}</p><h3 lang="es">${p.title.es}</h3><p lang="es">${p.body.es}</p></section>`)}</div>${printable(title, pack.pages.map((p) => html`<section><h2>${p.title.en} / ${p.title.es}</h2><p lang="en">${p.body.en}</p><p lang="es">${p.body.es}</p></section>`))}`;
  if (pack.domains) return html`<p>${I.T("No levels or scores. Mark goals you have practiced.", "Sin niveles ni puntajes. Marca las metas que has practicado.")}</p>${pack.domains.map((d) => html`<section class="panel"><h2>${d.domain}</h2>${d.goals.map((g) => html`<label><input type="checkbox" data-progress-goal="${d.domain}:${g.en}"> ${pairText(g, I.spanish)}</label>`)}</section>`)}${printable(title, pack.domains.map((d) => html`<section><h2>${d.domain}</h2>${d.goals.map((g) => html`<p>□ ${g.en} / ${g.es}</p>`)}</section>`))}`;
  return html`<p>${I.T("Pack unavailable.", "Paquete no disponible.")}</p>`;
}

function printCards(list, title) {
  return html`<article class="lp-pack-print"><h1>${title}</h1>${Array.from({ length: Math.ceil(list.length / 6) }, (_, page) => html`<ol class="lp-pack-six">${list.slice(page * 6, page * 6 + 6).map((w) => html`<li><img src="${w.picture}" alt="" /><strong lang="en">${w.en}</strong><span lang="es">${w.es}</span></li>`)}</ol>`)}</article>`;
}
function printLabels(list, title) {
  return html`<article class="lp-pack-print"><h1>${title}</h1><div class="lp-pack-labels">${list.map((w) => html`<p><strong lang="en">${w.en}</strong><br /><span lang="es">${w.es}</span></p>`)}</div></article>`;
}
function printWall(list, title) {
  const letters = [...new Set(list.map((w) => w.en[0].toLocaleUpperCase()))].sort();
  return html`<article class="lp-pack-print"><h1>${title}</h1><div class="lp-pack-wall">${letters.map((letter) => html`<section><h2>${letter}</h2><ul>${list.filter((w) => w.en[0].toLocaleUpperCase() === letter).map((w) => html`<li><img src="${w.picture}" alt="" /><strong>${w.en}</strong> · <span lang="es">${w.es}</span></li>`)}</ul></section>`)}</div></article>`;
}
const makeBingoCells = (list) => { const cells = mix(list).slice(0, 24); cells.splice(12, 0, null); return cells; };
function printBingo(cells, title, I) {
  return html`<section class="panel lp-bingo-view"><h2>${title}</h2><p>${I.T("English / Spanish · FREE", "Inglés / español · LIBRE")}</p><div class="lp-pack-bingo">${cells.map((w) => html`<div>${w ? html`<img src="${w.picture}" alt="" /><strong>${w.en}</strong><span lang="es">${w.es}</span>` : html`<strong>${I.T("FREE", "LIBRE")}</strong>`}</div>`)}</div><button type="button" class="btn no-print" data-pack-print-bingo>${I.T("Print bingo card", "Imprimir tarjeta de bingo")}</button></section>`;
}
function matchGame(I) {
  return html`<section class="panel" aria-labelledby="packMatchTitle"><h2 id="packMatchTitle">${I.T("Picture match", "Une las imágenes")}</h2><p>${I.T("Match each picture to its English word. Untimed practice.", "Une cada imagen con su palabra en inglés. Práctica sin cronómetro.")}</p><div class="lp-pack-match">${matchDeck.map((card, i) => html`<button type="button" class="lp-pack-match-card${selected.includes(i) || matched.has(card.id) ? " is-open" : ""}" data-pack-match="${i}" aria-pressed="${selected.includes(i) || matched.has(card.id)}">${selected.includes(i) || matched.has(card.id) ? (card.picture ? html`<img src="${card.picture}" alt="" />` : html`<span>${card.en}</span>`) : I.T("Show card", "Mostrar tarjeta")}</button>`)}</div><p role="status" aria-live="polite">${I.T(`${matched.size} of ${matchDeck.length / 2} pairs matched.`, `${matched.size} de ${matchDeck.length / 2} parejas unidas.`)}</p></section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  if (!ACCESS_LAB_FLAGS.newcomerPacksEnabled) return { title: I.T("Vocabulary pack", "Paquete de vocabulario"), html: html`<section class="panel"><h1>${I.T("Not available", "No disponible")}</h1></section>` };
  if (!ctx.route.id) return { title: I.T("Newcomer resources", "Recursos para recién llegados"), html: html`<article class="lp-newcomer-pack"><h1 tabindex="-1">${I.T("Newcomer resources", "Recursos para recién llegados")}</h1><p class="lead">${I.T("Printable and on-device materials for school, language practice and family connection.", "Materiales imprimibles y locales para la escuela, practicar el idioma y conectar con la familia.")}</p><div class="lp-extended-grid">${[["survival-vocabulary", "Survival vocabulary", "Vocabulario esencial"], ["all-about-me", "All about me", "Todo sobre mí"], ["new-arrival-school", "New arrival at school", "Nueva llegada a la escuela"], ["speaking-listening-cards", "Speaking and listening cards", "Tarjetas para hablar y escuchar"], ["sentence-building", "Sentence building", "Construcción de oraciones"], ["independent-menus", "Independent choice menus", "Menús de opciones independientes"], ["scaffold-packs", "Scaffold packs", "Paquetes de apoyos"], ["parents-carers", "Guide for families", "Guía para familias"], ["learner-progress-tracker", "My learning tracker", "Mi registro de aprendizaje"]].map(([id, en, es]) => html`<a class="panel" href="${BASE}/packs/${id}"><h2>${I.T(en, es)}</h2><span>${I.T("Open resource", "Abrir recurso")} →</span></a>`)}</div></article>` };
  const extendedId = EXTENDED_PACKS.includes(ctx.route.id) ? ctx.route.id : "";
  if (extendedId) {
    try {
      const pack = await loadExtended(extendedId);
      return { title: pairText(pack.title, I.spanish), html: html`<article class="lp-newcomer-pack"><p class="eyebrow">${I.T("Newcomer resources", "Recursos para recién llegados")}</p><h1 tabindex="-1">${pairText(pack.title, I.spanish)}</h1><p class="fine">${I.T("Original material. Spanish has not had human review.", "Material original. El español aún no ha tenido revisión humana.")}</p>${extendedPackHTML(pack, I)}</article>` };
    } catch (error) { return { title: I.T("Newcomer pack", "Paquete para recién llegados"), html: html`<section class="panel" role="alert"><h1>${error.message}</h1></section>` }; }
  }
  try {
    const pack = await loadPack();
    const topic = pack.topics.find((t) => t.id === topicId) || pack.topics[0];
    const topicWords = topic.words;
    return {
      title: I.T(pack.title.en, pack.title.es),
      html: html`<article class="lp-newcomer-pack">
        <p class="eyebrow">${I.T("Newcomer practice", "Práctica para recién llegados")}</p>
        <h1 tabindex="-1">${I.T(pack.title.en, pack.title.es)}</h1>
        <p class="lead">${I.T("144 useful words across 12 school and community topics. Listen, practice, and print at home or school.", "144 palabras útiles en 12 temas escolares y comunitarios. Escucha, practica e imprime en casa o en la escuela.")}</p>
        <p class="fine">${I.T("Original English and Spanish content. The Spanish text has not had human review.", "Contenido original en inglés y español. El texto en español aún no ha sido revisado por una persona.")}</p>
        <div class="row-actions"><label class="field"><span>${I.T("Topic", "Tema")}</span><select data-pack-topic>${pack.topics.map((t) => html`<option value="${t.id}" ${t.id === topic.id ? "selected" : ""}>${I.T(t.title.en, t.title.es)}</option>`)}</select></label>
          <button class="btn" type="button" data-pack-match-start>${I.T("Play picture match", "Jugar a unir imágenes")}</button>
          <button class="btn" type="button" data-pack-bingo>${I.T("Make a bingo card", "Crear una tarjeta de bingo")}</button>
          <button class="btn" type="button" data-pack-print="cards">${I.T("Print 6-up cards", "Imprimir tarjetas (6 por página)")}</button>
          <button class="btn" type="button" data-pack-print="labels">${I.T("Print labels", "Imprimir etiquetas")}</button>
          <button class="btn" type="button" data-pack-print="wall">${I.T("Print word wall", "Imprimir muro de palabras")}</button>
        </div>
        ${mode === "match" ? matchGame(I) : mode === "bingo" ? printBingo(bingoCells, I.T("Vocabulary bingo", "Bingo de vocabulario"), I) : html`<section class="lp-pack-words" aria-label="${I.S("Vocabulary words", "Palabras de vocabulario")}">${topicWords.map((w) => html`<article class="panel"><img src="${w.picture}" alt="" width="96" height="72" /><h2 lang="en">${w.en}</h2><p lang="es">${w.es}</p><div class="row-actions"><button class="btn small" type="button" data-pack-say-en="${w.en}">${I.T("Hear English", "Escuchar en inglés")}</button><button class="btn small" type="button" data-pack-say-es="${w.es}">${I.T("Hear Spanish", "Escuchar en español")}</button></div></article>`)}</section>`}
        ${(await import("./visual-anchor-labs.js")).visualAnchorLabsHTML(ctx)}
      </article>`,
    };
  } catch (error) {
    return { title: I.T("Vocabulary pack", "Paquete de vocabulario"), html: html`<section class="panel" role="alert"><h1>${error.message}</h1></section>` };
  }
}

export async function onChange(e, ctx) {
  const select = e.target.closest?.("[data-pack-topic]");
  if (select) { topicId = select.value; mode = "browse"; ctx.rerender(); return; }
  const band = e.target.closest?.("[data-pack-band]");
  if (band) document.querySelectorAll("[data-pack-card-band]").forEach((card) => { card.hidden = card.dataset.packCardBand !== band.value; });
}

export async function onClick(e, ctx, I = i18nFor(ctx)) {
  const { onVisualAnchorClick } = await import("./visual-anchor-labs.js");
  if (onVisualAnchorClick(e, ctx)) return true;
  const saveMe = e.target.closest?.("[data-about-me-save]");
  if (saveMe) {
    const values = aboutMeValues();
    document.querySelectorAll("[data-about-me-field]").forEach((field) => { if (field.dataset.aboutMeField.startsWith(`${safeKey(saveMe.dataset.aboutMeSave)}:`)) values[field.dataset.aboutMeField] = field.value.slice(0, 80); });
    storage.set("accessPracticeLab:v1:all-about-me", JSON.stringify(values));
    announce(I.T("Saved in Passport on this device.", "Guardado en el Pasaporte de este dispositivo."));
    return true;
  }
  const extendedPrint = e.target.closest?.("[data-pack-print-extended]");
  if (extendedPrint) { const section = extendedPrint.closest("section, article")?.querySelector(`[data-print-content="${CSS.escape(extendedPrint.dataset.packPrintExtended)}"]`) || document.querySelector(".lp-extended-print"); if (section) await printSheet(section.outerHTML); return true; }
  const sayEn = e.target.closest?.("[data-pack-say-en]");
  if (sayEn) { import("../speech.js").then(({ speak }) => speak(sayEn.dataset.packSayEn, { lang: "en-US" })); return true; }
  const sayEs = e.target.closest?.("[data-pack-say-es]");
  if (sayEs) { import("../speech.js").then(({ speakSpanish }) => speakSpanish(sayEs.dataset.packSayEs)); return true; }
  if (e.target.closest?.("[data-pack-match-start]")) {
    const pack = await loadPack();
    const chosen = mix(pack.topics.find((t) => t.id === topicId)?.words || []).slice(0, 6);
    matchDeck = mix(chosen.flatMap((w) => [{ id: w.id, picture: w.picture }, { id: w.id, en: w.en }]));
    selected = []; matched = new Set(); mode = "match"; ctx.rerender(); return true;
  }
  const match = e.target.closest?.("[data-pack-match]");
  if (match) {
    const i = Number(match.dataset.packMatch);
    if (!selected.includes(i) && !matched.has(matchDeck[i].id)) selected.push(i);
    if (selected.length === 2) {
      const [a, b] = selected;
      if (matchDeck[a].id === matchDeck[b].id) { matched.add(matchDeck[a].id); selected = []; }
      else setTimeout(() => { selected = []; ctx.rerender(); }, 700);
    }
    ctx.rerender(); return true;
  }
  if (e.target.closest?.("[data-pack-bingo]")) {
    const pack = await loadPack(); bingoCells = makeBingoCells(words(pack)); mode = "bingo"; ctx.rerender(); return true;
  }
  if (e.target.closest?.("[data-pack-print-bingo]")) {
    await printSheet(printBingo(bingoCells, I.T("Vocabulary bingo", "Bingo de vocabulario"), I));
    return true;
  }
  const print = e.target.closest?.("[data-pack-print]");
  if (print) {
    const pack = await loadPack();
    const all = words(pack);
    const sheet = print.dataset.packPrint === "cards" ? printCards(all, I.T(pack.title.en, pack.title.es)) : print.dataset.packPrint === "labels" ? printLabels(all, I.T("Labels · English and Spanish", "Etiquetas · inglés y español")) : printWall(all, I.T("Word wall · English and Spanish", "Muro de palabras · inglés y español"));
    await printSheet(sheet); return true;
  }
  return false;
}

const safeKey = (s) => String(s || "").replace(/[^a-z0-9-]/gi, "").slice(0, 48);
