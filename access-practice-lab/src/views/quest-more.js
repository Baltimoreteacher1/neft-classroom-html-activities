// Language Quest, part 2: the Teacher Mission Hub, family summaries, the Living Language Portfolio and the Creative
// Language Studio. Everything is read from, and written to, this device's quest state. Nothing is uploaded; sharing is
// always an explicit Copy, Print or Download.
import { isRecording } from "../recorder.js";
import { recorderHTML } from "../components.js";
import { BASE, copyText, html, icon, raw, announce } from "../util.js";
import { portraitSVG, sceneSVG } from "../quest/art.js";
import { characterOf, loadMission } from "../quest/content.js";
import { RUNGS, RUNG_COPY, diffWords, wordCount } from "../quest/engine.js";
import { filterCatalog } from "../quest/pathway.js";
import { loadQuest, saveQuest } from "../quest/state.js";
import { createdCounts, domainEs, evidenceText, familySummary, familyText, portfolioEntries, teacherEvidence } from "../quest/summary.js";
import { bi, bs } from "../quest/ui.js";

const href = (p, band = "") => `${BASE}/quest${p ? `/${p}` : ""}${band ? `?grades=${band}` : ""}`;
const dl = (name, text, type = "text/plain") => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
const FOLLOW = {
  Argue: ["arena", "Argument Arena", "Arena de argumentos"], Counter: ["arena", "Argument Arena", "Arena de argumentos"], Narrate: ["mentor", "Mentor Text Explorer", "Explorador de textos modelo"], Describe: ["scenes", "Student-made scenes", "Escenas hechas por estudiantes"],
  Define: ["wordlab", "Word Lab", "Laboratorio de palabras"], Inform: ["newsroom", "Newsroom", "Sala de redacción"], Evaluate: ["newsroom", "Newsroom", "Sala de redacción"], Explain: ["write", "Writing Studio", "Estudio de escritura"],
  Sequence: ["sentences", "Sentence Lab", "Laboratorio de oraciones"], Compare: ["write", "Writing Studio", "Estudio de escritura"], Question: ["detective", "Error Detective", "Detective de errores"], Infer: ["detective", "Error Detective", "Detective de errores"], Negotiate: ["scenarios", "Real-Life Scenarios", "Escenas de la vida real"],
};

// ── Teacher Mission Hub ──────────────────────────────────────────────────────────────────────────────────────────
function teacherHub(ctx, I, cat, qs, h) {
  const q = new URLSearchParams(location.search);
  const f = { q: q.get("q") || "", band: q.get("band") || "", domain: q.get("domain") || "", fn: q.get("fn") || "", world: q.get("world") || "" };
  const list = filterCatalog(cat.missions, f);
  const band = ctx.band === "3-5" ? "3-5" : "6-8";
  const fns = [...new Set(cat.missions.flatMap((m) => m.functions))].sort();
  const t = qs.teacher || {};
  const sel = (key, label, opts) => html`<label class="q-filter">${label}<select data-q-filter="${key}"><option value="">${I.S("All", "Todos")}</option>${opts.map(([v, l]) => html`<option value="${v}" ${f[key] === v ? html`selected` : ""}>${l}</option>`)}</select></label>`;
  return html`${h.crumbs(I, band, I.S("Teacher Mission Hub", "Centro de misiones para docentes"))}
    <header class="panel"><h1 tabindex="-1">${I.T("Teacher Mission Hub", "Centro de misiones para docentes")}</h1>
      <p class="lead">${I.T("Find a mission by grade band, skill or language function, then launch it for the class, project it, or print a guide. Students need no account.", "Encuentra una misión por nivel, destreza o función del lenguaje; luego lánzala para la clase, proyéctala o imprime una guía. Los estudiantes no necesitan cuenta.")}</p>
      <p><a class="btn" href="${href("teacher/evidence", band)}">${icon("evidence")} ${I.T("Evidence on this device", "Evidencia en este dispositivo")}</a></p></header>
    <section class="panel" aria-labelledby="qt-set"><h2 id="qt-set">${I.T("Class settings (this device)", "Ajustes de clase (este dispositivo)")}</h2>
      <p class="fine">${I.T("Settings apply on this device. To set the starting support on student devices, copy a launch link below.", "Los ajustes se aplican en este dispositivo. Para fijar el apoyo inicial en los dispositivos de los estudiantes, copia un enlace de lanzamiento abajo.")}</p>
      <div class="q-filters"><label class="q-filter">${I.T("Starting support", "Apoyo inicial")}<select data-q-setting="start"><option value="">${I.S("Default (sentence frame)", "Predeterminado (marco de oración)")}</option>${RUNGS.map((r) => html`<option value="${r}" ${t.start === r ? html`selected` : ""}>${bs(I, RUNG_COPY[r])}</option>`)}</select></label>
        <label class="q-filter q-check-inline"><input type="checkbox" data-q-setting="fade" ${t.fade === false ? "" : html`checked`} /> ${I.T("Suggest less support after two strong tries", "Sugerir menos apoyo después de dos buenos intentos")}</label></div>
      <fieldset class="q-fn-set"><legend>${I.T("Language functions to emphasize", "Funciones del lenguaje que quieres enfatizar")}</legend>${fns.map((fn) => html`<label class="q-fn"><input type="checkbox" data-q-objective="${fn}" ${(t.objectives || []).includes(fn) ? html`checked` : ""} /> ${fn}</label>`)}</fieldset></section>
    <section class="panel" aria-labelledby="qt-find"><h2 id="qt-find">${I.T("Find a mission", "Encuentra una misión")}</h2>
      <div class="q-filters" role="search"><label class="q-filter">${I.T("Search", "Buscar")}<input type="search" data-q-filter="q" value="${f.q}" /></label>
        ${sel("band", I.T("Grade band", "Nivel"), [["3-5", "3–5"], ["6-8", "6–8"]])}${sel("domain", I.T("Skill", "Destreza"), ["Listening", "Reading", "Speaking", "Writing"].map((d) => [d, I.S(d, domainEs(d))]))}${sel("fn", I.T("Language function", "Función del lenguaje"), fns.map((x) => [x, x]))}${sel("world", I.T("World", "Mundo"), cat.worlds.map((w) => [w.id, bs(I, w.name)]))}</div>
      <p class="fine" role="status">${I.T(`${list.length} of ${cat.missions.length} missions`, `${list.length} de ${cat.missions.length} misiones`)}</p>
      <ul class="q-tlist">${list.map((m) => {
        const w = cat.worlds.find((x) => x.id === m.world);
        return html`<li class="card q-tcard"><h3>${bi(I, m.title)}</h3><p class="fine">${bi(I, w.name)} · ${I.T(`Grades ${m.band.replace("-", "–")}`, `Grados ${m.band.replace("-", "–")}`)} · ${m.minutes} min · ${m.domains.map((d) => I.S(d, domainEs(d))).join(", ")} · ${m.functions.join(", ")}</p><p>${bi(I, m.objective)}</p>
          <div class="q-actions"><a class="btn" href="${href(`mission/${m.id}`, m.band)}">${icon("play")} ${I.T("Open", "Abrir")}</a><a class="btn" href="${href(`mission/${m.id}`, m.band)}${m.band ? "&" : "?"}demo=1">${icon("launch")} ${I.T("Projection mode", "Modo de proyección")}</a><a class="btn" href="${href(`teacher/${m.id}`, m.band)}">${icon("print")} ${I.T("Guide", "Guía")}</a>
            <label class="fine">${I.T("Link starts at", "El enlace empieza en")} <select data-q-linkrung="${m.id}">${RUNGS.map((r) => html`<option value="${r}" ${r === "frame" ? html`selected` : ""}>${bs(I, RUNG_COPY[r])}</option>`)}</select></label>
            <button type="button" class="btn" data-q-act="t-copy" data-id="${m.id}" data-band="${m.band}">${icon("copy")} ${I.T("Copy student link", "Copiar enlace para estudiantes")}</button></div></li>`;
      })}</ul></section>`;
}

async function teacherGuide(ctx, I, cat, h, id) {
  const meta = cat.missions.find((m) => m.id === id);
  if (!meta) return null;
  const m = await loadMission(id);
  const band = m.band;
  const fu = [...new Set(m.functions.map((f) => FOLLOW[f]).filter(Boolean).map((x) => x.join("|")))].map((s) => s.split("|"));
  return {
    title: bs(I, m.title),
    html: html`${h.crumbs(I, band, bs(I, m.title), I.S("Teacher Mission Hub", "Centro de misiones para docentes"))}
      <article class="panel q-guide"><h1 tabindex="-1">${bi(I, m.title)}</h1><p class="fine">${I.T(`Grades ${band.replace("-", "–")} · about ${m.minutes} minutes · ${m.domains.join(", ")} · ${m.keyUses.join(", ")}`, `Grados ${band.replace("-", "–")} · unos ${m.minutes} minutos · ${m.domains.map(domainEs).join(", ")} · ${m.keyUses.join(", ")}`)}</p>
        <div class="q-actions q-noprint"><a class="btn" href="${href(`mission/${m.id}`, band)}">${I.T("Open the mission", "Abrir la misión")}</a><a class="btn" href="${href(`mission/${m.id}`, band)}&demo=1">${I.T("Projection mode", "Modo de proyección")}</a><button type="button" class="btn" data-print>${icon("print")} ${I.T("Print this guide", "Imprimir esta guía")}</button></div>
        <h2>${I.T("Language objective", "Objetivo de lenguaje")}</h2><p>${bi(I, m.objective)}</p>
        <h2>${I.T("Student-friendly directions", "Instrucciones para estudiantes")}</h2><p>${m.narrative}</p><ul>${m.success.map((s) => html`<li>${bi(I, s)}</li>`)}</ul>
        <h2>${I.T("What students do", "Qué hacen los estudiantes")}</h2><ol>${m.stages.map((s) => html`<li><strong>${s.title}</strong><ul>${s.items.map((it) => html`<li>${it.prompt}${it.checks ? html`<br /><span class="fine">${I.T("Checklist: ", "Lista: ")}${it.checks.map((c) => c.label).join("; ")}</span>` : ""}${it.ladder ? html`<br /><span class="fine">${I.T("Frame: ", "Marco: ")}${it.ladder.frame || ""}</span>` : ""}</li>`)}</ul></li>`)}</ol>
        <h2>${I.T("Support ladder", "Escalera de apoyo")}</h2><p class="fine">${I.T("Students start where you or they choose, and can open more support at any time. Opening more support is recorded as extra support. It is never hidden.", "Los estudiantes empiezan donde tú o ellos elijan y pueden abrir más apoyo en cualquier momento. Abrir más apoyo se registra como apoyo adicional y nunca se oculta.")}</p><ol>${RUNGS.map((r) => html`<li>${bs(I, RUNG_COPY[r])}</li>`)}</ol>
        <h2>${I.T("Vocabulary", "Vocabulario")}</h2><ul>${m.vocab.map((v) => html`<li><strong>${v.term}</strong>: ${v.def}</li>`)}</ul>
        <h2>${I.T("Follow-up practice in the lab", "Práctica de seguimiento en el laboratorio")}</h2><ul>${fu.map(([r, en, es]) => html`<li><a href="${BASE}/${r}?grades=${band}">${I.T(en, es)}</a></li>`)}</ul>
        <h2>${I.T("Talk about it at home", "Conversación en casa")}</h2><p>${bi(I, m.family.talk)}</p>
        <p class="fine">${I.T("This mission asks students to produce language. The checklists look for words and structure and cannot judge ideas. They do not assign a WIDA level or an ACCESS score.", "Esta misión pide a los estudiantes producir lenguaje. Las listas buscan palabras y estructura y no pueden juzgar las ideas. No asignan un nivel WIDA ni un puntaje ACCESS.")}</p></article>`,
  };
}

async function evidencePage(ctx, I, cat, qs, h) {
  const band = ctx.band === "3-5" ? "3-5" : "6-8";
  const rows = await Promise.all(Object.entries(qs.runs).map(async ([key, run]) => {
    const m = await loadMission(key.split("#")[0]).catch(() => null);
    return m ? { key, ev: teacherEvidence(m, run) } : null;
  }));
  const list = rows.filter(Boolean);
  return {
    title: I.S("Evidence on this device", "Evidencia en este dispositivo"),
    html: html`${h.crumbs(I, band, I.S("Evidence", "Evidencia"), I.S("Teacher Mission Hub", "Centro de misiones para docentes"))}
      <header class="panel"><h1 tabindex="-1">${I.T("Evidence on this device", "Evidencia en este dispositivo")}</h1>
        <p class="lead">${I.T("What students did on this device: their writing, revisions, supports and next steps. Nothing here was sent anywhere. To see work from another device, ask the student to Download or Copy it from their portfolio.", "Lo que hicieron los estudiantes en este dispositivo: sus textos, revisiones, apoyos y próximos pasos. Nada de esto se envió a ningún lugar. Para ver el trabajo de otro dispositivo, pide al estudiante que lo descargue o copie desde su portafolio.")}</p>
        ${list.length ? html`<button type="button" class="btn" data-q-act="download-evidence">${icon("download")} ${I.T("Download as a file", "Descargar como archivo")}</button>` : ""}</header>
      ${list.length ? list.map(({ key, ev }) => html`<article class="card q-ev"><h2>${ev.title}</h2><p class="fine">${ev.functions.join(", ")} · ${I.T("Support", "Apoyo")}: ${bs(I, RUNG_COPY[ev.rung])}${ev.help ? I.T(" (asked for more)", " (pidió más)") : ""} · ${I.T(`hints ${ev.hints}`, `pistas ${ev.hints}`)} · ${ev.revised ? I.T("revised", "revisó") : I.T("not revised", "no revisó")} · ${ev.completed ? I.T("finished", "terminada") : I.T("in progress", "en curso")}</p>
          ${ev.work.map((w) => html`<details><summary>${w.prompt}</summary>${w.typedRehearsal ? html`<p class="fine">${I.T("Typed rehearsal, not a recording.", "Ensayo escrito, no una grabación.")}</p>` : ""}${w.versions.map((v, i) => html`<p><strong>${I.T(`Version ${i + 1}`, `Versión ${i + 1}`)}</strong> (${v.words} ${I.T("words", "palabras")}${v.selfDeclared?.length ? I.T(`; self-marked: ${v.selfDeclared.join(", ")}`, `; marcado por el estudiante: ${v.selfDeclared.join(", ")}`) : ""})<br />${v.text}</p>`)}${w.sentences ? html`<ol>${Object.values(w.sentences).map((s) => html`<li>${s}</li>`)}</ol>` : ""}</details>`)}
          <p><strong>${I.T("Suggested next step:", "Próximo paso sugerido:")}</strong> ${bi(I, ev.nextStep)}</p>
          <button type="button" class="btn small" data-q-act="copy-evidence" data-key="${key}">${icon("copy")} ${I.T("Copy as text", "Copiar como texto")}</button></article>`) : html`<p class="panel">${I.T("No mission work on this device yet.", "Aún no hay trabajo de misiones en este dispositivo.")}</p>`}`,
    data: list,
  };
}

// ── family summary ────────────────────────────────────────────────────────────────────────────────────────────────
const fam = { sentence: "" };
async function familyPage(ctx, I, cat, qs, h, id) {
  const band = ctx.band === "3-5" ? "3-5" : "6-8";
  const m = cat.missions.find((x) => x.id === id) && (await loadMission(id));
  const key = qs.runs[id] ? id : Object.keys(qs.runs).filter((k) => k.startsWith(`${id}#`)).sort().at(-1);
  const run = key && qs.runs[key];
  if (!m || !run) return { title: I.S("Family summary", "Resumen para la familia"), html: html`<section class="panel"><h1 tabindex="-1">${I.T("No finished mission yet", "Aún no hay una misión terminada")}</h1><p><a class="btn" href="${href("", band)}">${I.T("Go to Language Quest", "Ir a Misión del lenguaje")}</a></p></section>` };
  const lines = Object.values(run.items).flatMap((s) => (s.versions?.at(-1)?.text || "").split(/(?<=[.!?])\s+/)).filter((x) => wordCount(x) >= 5);
  const sum = familySummary(m, run, { includeSentence: fam.sentence });
  const c = createdCounts(m, run);
  return {
    title: I.S("Family summary", "Resumen para la familia"),
    cur: { m, run },
    html: html`${h.crumbs(I, band, I.S("Family summary", "Resumen para la familia"), bs(I, m.title))}
      <article class="panel q-family"><h1 tabindex="-1">${I.T("Family summary", "Resumen para la familia")}</h1>
        <p class="lead">${bi(I, m.title)}</p>
        <h2>${I.T("What we practiced", "Lo que practicamos")}</h2><p>${bi(I, sum.practiced)}</p>
        <h2>${I.T("What was made", "Lo que se creó")}</h2><p>${sum.made.length ? sum.made.map((x) => bi(I, x)).reduce((a, b) => html`${a}; ${b}`) : I.T("A finished mission", "Una misión completa")}</p>
        <h2>${I.T("New words", "Palabras nuevas")}</h2><ul>${sum.vocab.map((v) => html`<li><strong>${v.term}</strong> · ${v.es}</li>`)}</ul>
        <h2>${I.T("Talk about it at home", "Conversación en casa")}</h2><p>${bi(I, sum.talk)}</p>
        <p class="fine">${I.T("You do not need to know the English. Ask in any language you like, and listen.", "No necesitas saber inglés. Pregunta en el idioma que prefieras y escucha.")}</p>
        <h2>${I.T("Try a related activity", "Prueba una actividad relacionada")}</h2><p><a href="${BASE}/${(FOLLOW[m.functions[0]] || ["write"])[0]}?grades=${band}">${I.T((FOLLOW[m.functions[0]] || ["", "Writing Studio"])[1], (FOLLOW[m.functions[0]] || ["", "", "Estudio de escritura"])[2])}</a></p>
        <section class="q-noprint"><h2>${I.T("Share a sentence (optional)", "Compartir una oración (opcional)")}</h2>
          <p class="fine">${I.T("Nothing is shared unless you choose to copy or print. By default this page includes none of the student's writing.", "No se comparte nada a menos que decidas copiar o imprimir. Por defecto esta página no incluye nada del texto del estudiante.")}</p>
          <label>${I.T("Include one sentence the student wrote", "Incluir una oración que escribió el estudiante")} <select data-q-fam="sentence"><option value="">${I.S("None", "Ninguna")}</option>${lines.map((l) => html`<option value="${l}" ${fam.sentence === l ? html`selected` : ""}>${l.slice(0, 90)}</option>`)}</select></label>
          <p class="q-actions"><button type="button" class="btn" data-q-act="fam-copy" data-lang="en">${icon("copy")} ${I.T("Copy in English", "Copiar en inglés")}</button><button type="button" class="btn" data-q-act="fam-copy" data-lang="es">${icon("copy")} ${I.T("Copy in Spanish", "Copiar en español")}</button><button type="button" class="btn" data-print>${icon("print")} ${I.T("Print", "Imprimir")}</button></p>
          <p class="fine">${I.T("The Spanish text was written for this lab and has not yet been reviewed by a native-speaker educator.", "El texto en español se escribió para este laboratorio y todavía no lo ha revisado un educador hablante nativo.")}</p></section>
        ${c.revisions ? "" : ""}</article>`,
  };
}

// ── portfolio ────────────────────────────────────────────────────────────────────────────────────────────────────
async function portfolioPage(ctx, I, cat, qs, h) {
  const band = ctx.band === "3-5" ? "3-5" : "6-8";
  const missions = {};
  await Promise.all([...new Set(Object.keys(qs.runs).map((k) => k.split("#")[0]))].map(async (id) => { missions[id] = await loadMission(id).catch(() => null); }));
  for (const k of Object.keys(missions)) if (!missions[k]) delete missions[k];
  const entries = portfolioEntries(qs, missions);
  const cards = entries.map(({ key, mission, run, ev, picked, reflection }) => {
    const pairs = ev.work.filter((w) => w.versions.length > 1);
    return html`<article class="card q-pf ${picked ? "is-best" : ""}"><h2>${bi(I, mission.title)} ${picked ? html`<span class="q-chip is-independent">${icon("star")} ${I.T("My best work", "Mi mejor trabajo")}</span>` : ""}</h2>
      <p class="fine">${(run.completed || run.started || "").slice(0, 10)} · ${I.T("Support", "Apoyo")}: ${bs(I, RUNG_COPY[run.rung])}${run.helpUsed ? I.T(" (extra support used)", " (se usó apoyo adicional)") : ""} · ${run.completed ? I.T("finished", "terminada") : I.T("in progress", "en curso")}</p>
      ${ev.work.map((w) => html`<details><summary>${w.prompt}</summary>${w.versions.map((v, i) => html`<p><strong>${i === 0 && w.versions.length > 1 ? I.T("First draft", "Primer borrador") : w.versions.length > 1 && i === w.versions.length - 1 ? I.T("Revision", "Revisión") : I.T(`Version ${i + 1}`, `Versión ${i + 1}`)}</strong><br />${v.text}</p>`)}${w.sentences ? html`<ol>${Object.values(w.sentences).map((s) => html`<li>${s}</li>`)}</ol>` : ""}${w.typedRehearsal ? html`<p class="fine">${I.T("Typed rehearsal.", "Ensayo escrito.")}</p>` : ""}</details>`)}
      ${pairs.map((w) => {
        const d = diffWords(w.versions[0].text, w.versions.at(-1).text);
        return html`<div class="q-compare-pair" role="group" aria-label="${I.S("Draft and revision compared", "Borrador y revisión comparados")}"><div><h3>${I.T("First draft", "Primer borrador")}</h3><p>${d.left.map((x) => (x.c ? html`<del>${x.w}</del> ` : `${x.w} `))}</p></div><div><h3>${I.T("Revision", "Revisión")}</h3><p>${d.right.map((x) => (x.c ? html`<mark>${x.w}</mark> ` : `${x.w} `))}</p></div></div><p class="fine">${I.T("Marked words are what changed. Length alone does not make writing better.", "Las palabras marcadas son lo que cambió. Que un texto sea más largo no lo hace mejor.")}</p>`;
      })}
      <label class="q-label" for="pf-r-${key}">${I.T("How did my writing improve? What will I try next?", "¿Cómo mejoró mi escritura? ¿Qué probaré después?")}</label>
      <textarea id="pf-r-${key}" rows="2" class="q-textarea" data-q-pf="reflect" data-key="${key}">${reflection}</textarea>
      <div class="q-actions"><button type="button" class="btn" data-q-act="pf-pick" data-key="${key}" aria-pressed="${String(picked)}">${icon("star")} ${picked ? I.T("Remove from best work", "Quitar de mi mejor trabajo") : I.T("Choose as my best work", "Elegir como mi mejor trabajo")}</button><a class="btn" href="${href(`mission/${mission.id}`, mission.band)}">${I.T("Open the mission", "Abrir la misión")}</a><a class="btn" href="${href(`family/${mission.id}`, mission.band)}">${I.T("Family summary", "Resumen para la familia")}</a></div></article>`;
  });
  const mine = qs.creations || [];
  return {
    title: I.S("My portfolio", "Mi portafolio"),
    html: html`${h.crumbs(I, band, I.S("Portfolio", "Portafolio"))}
      <header class="panel"><h1 tabindex="-1">${I.T("My Language Portfolio", "Mi portafolio de lenguaje")}</h1>
        <p class="lead">${I.T("Your missions, drafts and revisions are saved on this device only. Nobody else can see them unless you copy, print or download them.", "Tus misiones, borradores y revisiones se guardan solo en este dispositivo. Nadie más puede verlos a menos que los copies, imprimas o descargues.")}</p>
        <div class="q-actions"><button type="button" class="btn" data-q-act="pf-copy">${icon("copy")} ${I.T("Copy my best work as text", "Copiar mi mejor trabajo como texto")}</button><button type="button" class="btn" data-q-act="pf-download">${icon("download")} ${I.T("Download everything", "Descargar todo")}</button><button type="button" class="btn" data-print>${icon("print")} ${I.T("Print", "Imprimir")}</button></div></header>
      ${cards.length ? cards : html`<p class="panel">${I.T("No missions yet. Your first finished mission will show up here.", "Aún no hay misiones. Tu primera misión terminada aparecerá aquí.")} <a class="btn" href="${href("world", band)}">${I.T("Explore a world", "Explora un mundo")}</a></p>`}
      ${mine.length ? html`<section class="panel"><h2>${I.T("My creations", "Mis creaciones")}</h2><ul>${mine.map((c) => html`<li><a href="${href(`create/${c.id}`, band)}">${c.title || I.S("Untitled", "Sin título")}</a> <span class="fine">· ${c.format}</span></li>`)}</ul></section>` : ""}`,
    entries,
  };
}

// ── Creative Language Studio ────────────────────────────────────────────────────────────────────────────────────
const FORMATS = {
  story: { en: "Illustrated story", es: "Cuento ilustrado", p35: [["Beginning", "Who is it about, and where?"], ["The problem", "What goes wrong?"], ["What happens", "What does the character try?"], ["The ending", "How is it solved?"]], p68: [["Setup", "Introduce the character and the place."], ["Conflict", "What is the problem?"], ["Rising action", "What makes it harder?"], ["Climax", "The turning point."], ["Resolution", "How does it end, and what changed?"]] },
  comic: { en: "Comic strip", es: "Tira cómica", p35: [["Panel 1", "Set the scene."], ["Panel 2", "Something happens."], ["Panel 3", "A surprise or a problem."], ["Panel 4", "The ending."]], p68: [["Panel 1", "Set the scene."], ["Panel 2", "Introduce the problem."], ["Panel 3", "A reaction."], ["Panel 4", "A twist."], ["Panel 5", "A decision."], ["Panel 6", "The result."]] },
  conversation: { en: "Character conversation", es: "Conversación de personajes", p35: [["Line 1", "Greet and ask."], ["Line 2", "Answer."], ["Line 3", "Ask a follow-up."], ["Line 4", "Answer and say goodbye."]], p68: [["Line 1", "Open the conversation."], ["Line 2", "Respond and explain."], ["Line 3", "Ask for clarification."], ["Line 4", "Clarify."], ["Line 5", "Disagree politely or agree."], ["Line 6", "Close."]] },
  news: { en: "News report", es: "Noticia", p35: [["Headline", "A short title."], ["Who and what", "Who did what?"], ["Details", "When and where?"], ["Ending", "Why does it matter?"]], p68: [["Headline", "A precise title."], ["Lead", "Who, what, when, where."], ["Details", "Give a fact with a number or date."], ["A quote", "Who said it? Use quotation marks."], ["Another view", "Add a different perspective."], ["Wrap-up", "What happens next?"]] },
  interview: { en: "Interview", es: "Entrevista", p35: [["Question 1", "Ask about who or what."], ["Answer 1", "Answer in a full sentence."], ["Question 2", "Ask why or how."], ["Answer 2", "Answer with a reason."]], p68: [["Question 1", "An open question."], ["Answer 1", "Answer with detail."], ["Question 2", "A follow-up."], ["Answer 2", "Explain with a reason."], ["Question 3", "A challenging question."], ["Answer 3", "Answer with evidence."]] },
  persuade: { en: "Persuasive talk", es: "Charla persuasiva", p35: [["My opinion", "What do you think?"], ["Reason 1", "Because..."], ["Reason 2", "Another reason."], ["Closing", "Ask the listener to agree."]], p68: [["Claim", "State your position."], ["Reason", "Why it matters."], ["Evidence", "A fact or example."], ["Other view", "What would someone say against it?"], ["Response", "Answer that view."], ["Closing", "Call to action."]] },
  vocab: { en: "Vocabulary demonstration", es: "Demostración de vocabulario", p35: [["The word", "Write the word."], ["What it means", "Explain in your own words."], ["An example", "Use it in a sentence."], ["A picture in words", "Describe a picture of it."]], p68: [["The word", "Write the word and its parts."], ["Definition", "Explain it in your own words."], ["Example", "Use it in a sentence."], ["Non-example", "Say what it is not."], ["Connections", "Write two related words."]] },
  scene: { en: "Interactive scene description", es: "Descripción de una escena", p35: [["I see", "What can you see?"], ["I hear", "What can you hear?"], ["I feel", "How does it feel?"], ["What is happening", "What is going on?"]], p68: [["Setting", "Where and when?"], ["Sights", "What do you notice?"], ["Sounds", "What do you hear?"], ["Mood", "What feeling does it give?"], ["What happens next", "Predict what happens."]] },
};
const THEMES = ["forest", "beach", "space", "city", "lab", "map", "portal", "forum", "forge", "studio"];
const CAST = ["investigator", "storyteller", "scientist", "editor", "guide", "architect"];
const uid = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const ctext = (c) => `${c.title || ""}\n\n${c.panels.map((p, i) => `${i + 1}. ${p.label}${p.who ? ` (${p.who})` : ""}: ${p.text}`).join("\n")}`;

function studio(ctx, I, cat, qs, h, id) {
  const band = ctx.band === "3-5" ? "3-5" : "6-8";
  const c = (qs.creations || []).find((x) => x.id === id);
  const present = new URLSearchParams(location.search).get("present") === "1";
  if (!c) {
    return html`${h.crumbs(I, band, I.S("Create", "Crear"))}
      <header class="panel"><h1 tabindex="-1">${I.T("Creative Language Studio", "Estudio creativo de lenguaje")}</h1><p class="lead">${I.T("Make something with your own words: a story, comic, conversation, news report, interview, talk, vocabulary demonstration or scene. It stays on this device. You decide if you share it.", "Haz algo con tus propias palabras: un cuento, cómic, conversación, noticia, entrevista, charla, demostración de vocabulario o escena. Se queda en este dispositivo. Tú decides si lo compartes.")}</p>
      <p><a class="btn btn-primary" href="${BASE}/book-studio?grades=${band}">${icon("writing")} ${I.T("Open Book Studio (Full Illustrated Books & Comics)", "Abrir Book Studio (libros ilustrados y cómics completos)")}</a></p></header>
      <section class="panel"><h2>${I.T("Start something new", "Empieza algo nuevo")}</h2><div class="q-grid">${Object.entries(FORMATS).map(([k, f]) => html`<button type="button" class="card q-door" data-q-act="c-new" data-format="${k}">${icon("writing")}<strong>${I.T(f.en, f.es)}</strong><span class="fine">${I.T(`${(band === "3-5" ? f.p35 : f.p68).length} parts`, `${(band === "3-5" ? f.p35 : f.p68).length} partes`)}</span></button>`)}</div></section>
      ${(qs.creations || []).length ? html`<section class="panel"><h2>${I.T("Keep working", "Sigue trabajando")}</h2><ul>${qs.creations.map((x) => html`<li><a href="${href(`create/${x.id}`, band)}">${x.title || I.S("Untitled", "Sin título")}</a> <span class="fine">· ${x.format} · ${x.updated.slice(0, 10)}</span></li>`)}</ul></section>` : ""}`;
  }
  const cast = c.cast.map((k) => cat.characters.find((x) => x.id === k)).filter(Boolean);
  const i = Math.min(Number(new URLSearchParams(location.search).get("p")) || 0, c.panels.length - 1);
  if (present) {
    const p = c.panels[i];
    const ch = cat.characters.find((x) => x.id === p.speaker);
    return html`<section class="q-present" aria-label="${I.S("Presentation", "Presentación")}"><div class="q-world-art">${raw(sceneSVG(p.scene || c.scene, { alt: I.S(`Scene: ${p.scene || c.scene}`, `Escena: ${p.scene || c.scene}`) }))}</div>
      <div class="q-present-text">${ch ? raw(portraitSVG(ch, "happy", { w: 84 })) : ""}<p class="q-present-line" aria-live="polite"><strong>${p.label}</strong><br />${p.text || I.S("(empty)", "(vacío)")}</p></div>
      <div class="q-actions"><a class="btn" href="${href(`create/${c.id}`, band)}&present=1&p=${Math.max(0, i - 1)}" ${i === 0 ? html`aria-disabled="true"` : ""}>${icon("arrow-left")} ${I.T("Previous", "Anterior")}</a><button type="button" class="btn" data-say="${p.text}">${icon("volume")} ${I.T("Hear it", "Escuchar")}</button><a class="btn btn-primary" href="${href(`create/${c.id}`, band)}&present=1&p=${Math.min(c.panels.length - 1, i + 1)}" ${i === c.panels.length - 1 ? html`aria-disabled="true"` : ""}>${I.T("Next", "Siguiente")} ${icon("arrow-right")}</a><a class="btn" href="${href(`create/${c.id}`, band)}">${I.T("Exit presentation", "Salir de la presentación")}</a></div><p class="fine">${i + 1} / ${c.panels.length}</p></section>`;
  }
  const first = c.versions?.[0]?.text;
  const now = ctext(c);
  const d = first && first !== now ? diffWords(first, now) : null;
  const key = `quest:create:${c.id}`;
  return html`${h.crumbs(I, band, c.title || I.S("Untitled", "Sin título"), I.S("Create", "Crear"))}
    <header class="panel"><h1 tabindex="-1">${I.T(FORMATS[c.format].en, FORMATS[c.format].es)}</h1>
      <label class="q-label" for="c-title">${I.T("Title", "Título")}</label><input id="c-title" class="q-input" data-q-c="title" value="${c.title}" />
      <div class="q-filters"><label class="q-filter">${I.T("Scene", "Escena")}<select data-q-c="scene">${THEMES.map((t) => html`<option value="${t}" ${c.scene === t ? html`selected` : ""}>${t}</option>`)}</select></label>
        <fieldset class="q-fn-set"><legend>${I.T("Characters (up to 3)", "Personajes (hasta 3)")}</legend>${CAST.map((k) => html`<label class="q-fn"><input type="checkbox" data-q-cast="${k}" ${c.cast.includes(k) ? html`checked` : ""} /> ${cat.characters.find((x) => x.id === k).name}</label>`)}</fieldset></div></header>
    <section class="q-panels" aria-label="${I.S("Parts", "Partes")}">${c.panels.map((p, n) => html`<article class="card q-panel"><div class="q-panel-art" aria-hidden="true">${raw(sceneSVG(p.scene || c.scene, {}))}${cast.find((x) => x.id === p.speaker) ? html`<div class="q-panel-who">${raw(portraitSVG(cast.find((x) => x.id === p.speaker), "happy", { w: 56 }))}</div>` : ""}</div>
        <h2>${n + 1}. ${p.label}</h2><p class="fine">${p.hint}</p>
        ${cast.length ? html`<label class="q-filter">${I.T("Who says it", "Quién lo dice")}<select data-q-p="speaker" data-n="${n}"><option value="">${I.S("Narrator", "Narrador")}</option>${cast.map((x) => html`<option value="${x.id}" ${p.speaker === x.id ? html`selected` : ""}>${x.name}</option>`)}</select></label>` : ""}
        <textarea class="q-textarea" rows="3" data-q-p="text" data-n="${n}" aria-label="${p.label}">${p.text}</textarea><p class="fine"><span data-q-pwc="${n}">${wordCount(p.text)}</span> ${I.T("words", "palabras")}</p></article>`)}</section>
    <section class="panel"><h2>${I.T("Say it out loud (optional)", "Dilo en voz alta (opcional)")}</h2>${recorderHTML(key, { prompt: ctext(c), recording: isRecording(key), i18n: I })}</section>
    <section class="panel"><h2>${I.T("Revise", "Revisa")}</h2><p>${I.T("Save a version, change something, and compare. Keep what is yours.", "Guarda una versión, cambia algo y compara. Conserva lo que es tuyo.")}</p>
      <button type="button" class="btn" data-q-act="c-version">${I.T("Save a version", "Guardar una versión")} (${c.versions?.length || 0})</button>
      ${d ? html`<div class="q-compare-pair"><div><h3>${I.T("First version", "Primera versión")}</h3><p>${d.left.map((x) => (x.c ? html`<del>${x.w}</del> ` : `${x.w} `))}</p></div><div><h3>${I.T("Now", "Ahora")}</h3><p>${d.right.map((x) => (x.c ? html`<mark>${x.w}</mark> ` : `${x.w} `))}</p></div></div>` : ""}</section>
    <div class="panel q-actions q-noprint"><a class="btn btn-primary" href="${href(`create/${c.id}`, band)}&present=1">${icon("play")} ${I.T("Present", "Presentar")}</a><button type="button" class="btn" data-q-act="c-download">${icon("download")} ${I.T("Download as text", "Descargar como texto")}</button><button type="button" class="btn" data-q-act="c-copy">${icon("copy")} ${I.T("Copy text", "Copiar texto")}</button><button type="button" class="btn" data-print>${icon("print")} ${I.T("Print", "Imprimir")}</button><button type="button" class="btn" data-q-act="c-delete">${I.T("Delete this", "Eliminar esto")}</button></div>
    <p class="fine">${I.T("Saved on this device. Recordings stay in this tab and are never uploaded. There is no public gallery.", "Se guarda en este dispositivo. Las grabaciones se quedan en esta pestaña y nunca se suben. No hay galería pública.")}</p>`;
}

// ── route and events ─────────────────────────────────────────────────────────────────────────────────────────────
let last = null; // the data the current page was built from, for Copy and Download
export async function render(ctx, I, cat, qs, id, sub, h) {
  last = null;
  if (id === "teacher") {
    if (sub === "evidence") {
      const p = await evidencePage(ctx, I, cat, qs, h);
      last = { evidence: p.data };
      return p;
    }
    if (sub) return teacherGuide(ctx, I, cat, h, sub);
    return { title: I.S("Teacher Mission Hub", "Centro de misiones para docentes"), html: teacherHub(ctx, I, cat, qs, h) };
  }
  if (id === "family") {
    const p = await familyPage(ctx, I, cat, qs, h, sub);
    last = { family: p.cur };
    return p;
  }
  if (id === "portfolio") {
    const p = await portfolioPage(ctx, I, cat, qs, h);
    last = { entries: p.entries };
    return p;
  }
  if (id === "create") return { title: I.S("Create", "Crear"), html: studio(ctx, I, cat, qs, h, sub) };
  return null;
}

const slugify = (s) => String(s || "work").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "work";
export function onClick(e, ctx, { questHref }) {
  const el = e.target.closest("[data-q-act]");
  if (!el) return false;
  const act = el.dataset.qAct;
  const qs = loadQuest();
  const band = ctx.band === "3-5" ? "3-5" : "6-8";
  if (act === "t-copy") {
    const rung = document.querySelector(`[data-q-linkrung="${el.dataset.id}"]`)?.value || "frame";
    copyText(`${location.origin}${BASE}/quest/mission/${el.dataset.id}?grades=${el.dataset.band}&rung=${rung}`);
    announce("Link copied.");
    return true;
  }
  if (act === "copy-evidence") {
    const row = last?.evidence?.find((r) => r.key === el.dataset.key);
    if (row) copyText(evidenceText(row.ev));
    announce("Copied.");
    return true;
  }
  if (act === "download-evidence") return (dl("quest-evidence.json", JSON.stringify(last?.evidence?.map((r) => r.ev) || [], null, 2), "application/json"), true);
  if (act === "fam-copy" && last?.family) {
    const s = familySummary(last.family.m, last.family.run, { includeSentence: fam.sentence });
    copyText(familyText(s, el.dataset.lang));
    announce(el.dataset.lang === "es" ? "Copiado." : "Copied.");
    return true;
  }
  if (act === "pf-pick") {
    const set = new Set(qs.picks);
    set.has(el.dataset.key) ? set.delete(el.dataset.key) : set.add(el.dataset.key);
    qs.picks = [...set];
    saveQuest(qs);
    return (ctx.rerender(), true);
  }
  if (act === "pf-copy") {
    const rows = (last?.entries || []).filter((r) => r.picked);
    copyText((rows.length ? rows : last?.entries || []).map((r) => evidenceText(r.ev)).join("\n\n"));
    announce("Copied.");
    return true;
  }
  if (act === "pf-download") return (dl("my-language-portfolio.json", JSON.stringify({ missions: (last?.entries || []).map((r) => ({ ...r.ev, reflection: r.reflection })), creations: qs.creations }, null, 2), "application/json"), true);
  if (act === "c-new") {
    const f = FORMATS[el.dataset.format];
    const tmpl = band === "3-5" ? f.p35 : f.p68;
    const c = { id: uid(), format: el.dataset.format, band, title: "", scene: "forest", cast: [], panels: tmpl.map(([label, hint]) => ({ label, hint, text: "", speaker: "" })), versions: [], updated: new Date().toISOString() };
    (qs.creations ||= []).push(c);
    saveQuest(qs);
    ctx.navigate(`${BASE}/quest/create/${c.id}?grades=${band}`);
    return true;
  }
  const c = (qs.creations || []).find((x) => x.id === ctx.route.sub);
  if (c && ["c-version", "c-download", "c-copy", "c-delete"].includes(act)) {
    if (act === "c-version") {
      (c.versions ||= []).push({ text: ctext(c), at: new Date().toISOString() });
      c.updated = new Date().toISOString();
      saveQuest(qs);
      return (ctx.rerender(), true);
    }
    if (act === "c-download") return (dl(`${slugify(c.title)}.txt`, ctext(c)), true);
    if (act === "c-copy") return (copyText(ctext(c)), announce("Copied."), true);
    if (act === "c-delete") {
      qs.creations = qs.creations.filter((x) => x.id !== c.id);
      saveQuest(qs);
      ctx.navigate(`${BASE}/quest/create?grades=${band}`);
      return true;
    }
  }
  return false;
}

let timer = 0;
export function onChange(e, ctx) {
  const t = e.target;
  const qs = loadQuest();
  const band = ctx.band === "3-5" ? "3-5" : "6-8";
  if (t.dataset.qFilter !== undefined) {
    if (t.type === "search" && e.type === "input") return true;
    const p = new URLSearchParams();
    for (const el of document.querySelectorAll("[data-q-filter]")) if (el.value) p.set(el.dataset.qFilter, el.value);
    p.set("grades", band);
    ctx.navigate(`${BASE}/quest/teacher?${p}`);
    return true;
  }
  if (t.dataset.qSetting) {
    qs.teacher ||= {};
    if (t.dataset.qSetting === "fade") qs.teacher.fade = t.checked;
    else qs.teacher[t.dataset.qSetting] = t.value || undefined;
    saveQuest(qs);
    return true;
  }
  if (t.dataset.qObjective) {
    const set = new Set(qs.teacher?.objectives || []);
    t.checked ? set.add(t.dataset.qObjective) : set.delete(t.dataset.qObjective);
    (qs.teacher ||= {}).objectives = [...set];
    saveQuest(qs);
    return true;
  }
  if (t.dataset.qFam === "sentence") return ((fam.sentence = t.value), true);
  if (t.dataset.qPf === "reflect") {
    qs.reflections[t.dataset.key] = t.value;
    saveQuest(qs);
    return true;
  }
  const c = (qs.creations || []).find((x) => x.id === ctx.route.sub);
  if (c) {
    const save = () => {
      c.updated = new Date().toISOString();
      clearTimeout(timer);
      timer = setTimeout(() => saveQuest(qs), 400);
    };
    if (t.dataset.qC === "title") return ((c.title = t.value), save(), true);
    if (t.dataset.qC === "scene") return ((c.scene = t.value), save(), ctx.rerender(), true);
    if (t.dataset.qCast) {
      const set = new Set(c.cast);
      t.checked ? set.add(t.dataset.qCast) : set.delete(t.dataset.qCast);
      c.cast = [...set].slice(0, 3);
      for (const p of c.panels) if (p.speaker && !c.cast.includes(p.speaker)) p.speaker = "";
      saveQuest(qs);
      return (ctx.rerender(), true);
    }
    if (t.dataset.qP === "text") {
      c.panels[Number(t.dataset.n)].text = t.value;
      const w = document.querySelector(`[data-q-pwc="${t.dataset.n}"]`);
      if (w) w.textContent = String(wordCount(t.value));
      return (save(), true);
    }
    if (t.dataset.qP === "speaker") return ((c.panels[Number(t.dataset.n)].speaker = t.value), save(), ctx.rerender(), true);
  }
  return false;
}
export const unmount = () => clearTimeout(timer);
void characterOf;
