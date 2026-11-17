// Teacher Hub: download any bank activity as a Word file or a print/PDF page, WITH its answer key. This is the only
// place an answer-key edition exists: access-teacher/ is behind the site's auth middleware, and the student
// download menu (access-practice-lab/src/download/menu.js) never builds a key. The key comes from
// src/download/answer-key.js (the same document model the student file uses, plus the answers on their own page).
// Mounts its own section after the content library (one line in index.html), folds with the other sections
// (hub-folds.js), writes nothing to storage. English, Spanish or bilingual from the lab language preference
// (or ?lang=es|bi): ustedes for adults.
import { bandLabel, bandLabelEs } from "/access-practice-lab/src/bands.js";
import { loadIndex } from "/access-practice-lab/src/content.js";
import { langMode, makeI18n } from "/access-practice-lab/src/i18n.js";
import { DOMAIN_META, TIERS, html, icon, toHtml } from "/access-practice-lab/src/util.js";

const PREFS_KEY = "accessPracticeLab:v1:prefs";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function modeNow() {
  const q = new URLSearchParams(location.search).get("lang");
  if (["en", "es", "bi"].includes(q)) return q;
  try {
    return langMode(JSON.parse(localStorage.getItem(PREFS_KEY) || "null") || {});
  } catch {
    return "en";
  }
}

const state = { band: "", domain: "", level: "", id: "" };

const opt = (value, label, selected) =>
  html`<option value="${value}" ${selected ? html`selected` : ""}>${label}</option>`;

function panelHTML(I, index) {
  const bands = Object.keys(index.bands);
  if (!bands.includes(state.band)) state.band = bands[bands.length - 1];
  const domains = index.bands[state.band].domains;
  if (!domains[state.domain]) state.domain = Object.keys(domains)[0];
  const levels = domains[state.domain].levels;
  if (!levels[state.level]) state.level = Object.keys(levels)[0];
  const rows = levels[state.level].activities;
  if (!rows.some((r) => r[0] === state.id)) state.id = rows[0]?.[0] || "";
  const tierName = (lv) => {
    const t = TIERS[String(lv).slice(-1)];
    return t ? I.S(`${lv} · ${t.name}`, `${lv} · ${t.es}`) : lv;
  };
  return html`<h2 id="activityDownloadsTitle" tabindex="-1">
      ${icon("download")}
      ${I.T("Activity downloads with answer keys", "Descargas de actividades con clave de respuestas")}
    </h2>
    <p class="fine">
      ${I.T(
        "Choose any activity and download it as a Word file or a print/PDF page. The student page has no answers; the answer-key edition adds the answers and sample responses on their own page. Students can download the student page from every activity and room.",
        "Elijan cualquier actividad y descárguenla como archivo de Word o como página para imprimir o PDF. La página del estudiante no tiene respuestas; la edición con clave agrega las respuestas y respuestas de ejemplo en una página aparte. Los estudiantes pueden descargar la página del estudiante desde cada actividad y cada sala.",
      )}
    </p>
    <div class="hub-filters row-actions" data-actdl-form>
      <label class="field"
        ><span>${I.T("Grades", "Grados")}</span>
        <select data-actdl="band">
          ${bands.map((b) => opt(b, I.S(bandLabel(b), bandLabelEs(b)), b === state.band))}
        </select></label
      >
      <label class="field"
        ><span>${I.T("Skill", "Destreza")}</span>
        <select data-actdl="domain">
          ${Object.keys(domains).map((d) => opt(d, I.S(DOMAIN_META[d]?.name || d, DOMAIN_META[d]?.es || d), d === state.domain))}
        </select></label
      >
      <label class="field"
        ><span>${I.T("Support level", "Nivel de apoyo")}</span>
        <select data-actdl="level">
          ${Object.keys(levels).map((l) => opt(l, tierName(l), l === state.level))}
        </select></label
      >
      <label class="field"
        ><span>${I.T("Activity", "Actividad")}</span>
        <select data-actdl="id">
          ${rows.map((r) => opt(r[0], r[1], r[0] === state.id))}
        </select></label
      >
    </div>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-actdl-go="key-docx">
        ${icon("download")}
        ${I.T("Download activity with answer key (Word)", "Descargar actividad con clave de respuestas (Word)")}
      </button>
      <button type="button" class="btn" data-actdl-go="key-pdf">
        ${icon("print")}
        ${I.T("Answer key: print or save as PDF", "Clave de respuestas: imprimir o guardar como PDF")}
      </button>
      <button type="button" class="btn" data-actdl-go="student-docx">
        ${icon("download")}
        ${I.T("Student page only (Word)", "Solo la página del estudiante (Word)")}
      </button>
    </div>
    <p class="fine" role="status" data-actdl-status></p>`;
}

async function build(kind, I) {
  const [{ findActivity }, model, keyMod, docx, room] = await Promise.all([
    import("/access-practice-lab/src/content.js"),
    import("/access-practice-lab/src/download/model.js"),
    import("/access-practice-lab/src/download/answer-key.js"),
    import("/access-practice-lab/src/download/docx.js"),
    import("/access-practice-lab/src/views/room.js"),
  ]);
  const found = await findActivity(state.id, { band: state.band, domain: state.domain });
  if (!found?.activity) throw new Error(`activity ${state.id} not found`);
  const lang = I.bilingual ? "bi" : I.spanish ? "es" : "en";
  const opts = {
    band: found.band,
    domain: found.domain,
    level: found.level,
    lang,
    url: `${location.origin}${room.activityHref(found.domain, found.level, found.activity.id)}`,
  };
  const doc = kind.startsWith("key")
    ? keyMod.answerKeyDocument(found.activity, opts)
    : model.activityDocument(found.activity, opts);
  return { doc, toDocx: docx.toDocx };
}

function save(bytes, name) {
  const url = URL.createObjectURL(new Blob([bytes], { type: DOCX }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function mountActivityDownloads(root = document) {
  let section = root.getElementById("activityDownloads");
  if (!section) {
    section = Object.assign(document.createElement("section"), {
      id: "activityDownloads",
      className: "th-sec lab-main",
    });
    section.setAttribute("aria-labelledby", "activityDownloadsTitle");
    const after = root.getElementById("accContent");
    if (after) after.after(section);
    else (root.getElementById("hub") || document.body).before(section);
  }
  const I = makeI18n(modeNow());
  let index = null;
  const draw = () => {
    // Whole-section render, like the other hub panels: hub-folds.js rebuilds the fold and keeps it open.
    section.innerHTML = toHtml(panelHTML(I, index));
  };
  const status = (text) => {
    const el = section.querySelector("[data-actdl-status]");
    if (el) el.textContent = text;
  };
  section.addEventListener("change", (e) => {
    const field = e.target.closest?.("[data-actdl]")?.dataset.actdl;
    if (!field) return;
    state[field] = e.target.value;
    draw();
    section.querySelector(`[data-actdl="${field}"]`)?.focus();
  });
  section.addEventListener("click", async (e) => {
    const go = e.target.closest?.("[data-actdl-go]")?.dataset.actdlGo;
    if (!go) return;
    const win = go === "key-pdf" ? window.open("", "_blank") : null;
    status(I.S("Preparing the file…", "Preparando el archivo…"));
    try {
      const { doc, toDocx } = await build(go, I);
      if (go === "key-pdf") {
        const { openPrintView } = await import("/access-practice-lab/src/download/print.js");
        if (!win) throw new Error("pop-up blocked");
        openPrintView(win, doc, {
          print: I.S("Print or save as PDF", "Imprimir o guardar como PDF"),
          close: I.S("Close", "Cerrar"),
          howTo: I.S(
            "To make a PDF, press Print and choose “Save as PDF”.",
            "Para hacer un PDF, pulsen Imprimir y elijan “Guardar como PDF”.",
          ),
        });
        status(
          I.S(
            "The print view is open in a new tab.",
            "La vista para imprimir está abierta en una pestaña nueva.",
          ),
        );
      } else {
        save(toDocx(doc), `${doc.slug}.docx`);
        status(I.S("Word file downloaded.", "Archivo de Word descargado."));
      }
    } catch (err) {
      console.warn("activity download", err);
      if (win) win.close();
      status(
        String(err?.message).includes("pop-up")
          ? I.S(
              "Allow pop-ups for this site to open the print view.",
              "Permitan las ventanas emergentes de este sitio para abrir la vista para imprimir.",
            )
          : I.S(
              "The file could not be built. Try again.",
              "No se pudo crear el archivo. Inténtenlo otra vez.",
            ),
      );
    }
  });
  section.innerHTML = `<h2 id="activityDownloadsTitle" tabindex="-1">${I.S("Activity downloads with answer keys", "Descargas de actividades con clave de respuestas")}</h2><p class="acc-hint">${I.S("Loading the activity list…", "Cargando la lista de actividades…")}</p>`;
  return loadIndex()
    .then((idx) => {
      index = idx;
      draw();
    })
    .catch(() =>
      status(
        I.S("The activity list could not load.", "No se pudo cargar la lista de actividades."),
      ),
    );
}
