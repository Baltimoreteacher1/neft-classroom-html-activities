// My Passport: "How I work" (supports, gradual release, confidence) and the family letter.
// Both read only this device's saved work, show counts and plain sentences, and never a level or score.
import { calibration } from "../lang/calibration.js";
import { buildLetter } from "../lang/family-letter.js";
import { STAGE_LABEL, fadeTrajectory, fadeYou } from "../lang/fade.js";
import { supportsReport } from "../lang/supports-report.js";
import { html, icon } from "../util.js";

const MAX_STEPS = 8;
let letterLang = "";

/** "How I work": the supports I opened, how my help is changing, and how sure I was. */
export function howIWorkHTML(I, { entries = [], records = [] } = {}) {
  const report = supportsReport({ entries, records });
  const fade = fadeTrajectory(entries);
  const cal = calibration(records);
  const k = cal.cells;
  return html`<section class="pass-card" aria-labelledby="passHow">
    <h2 id="passHow">${icon("growth")} ${I.T("How I work", "Cómo trabajo")}</h2>
    ${
      report.lines.length
        ? html`<ul class="pass-lines">
            ${report.lines.map((l) => html`<li>${I.T(l.en, l.es)}</li>`)}
          </ul>`
        : html`<p class="fine">
            ${I.T("Do a few speaking or writing tasks and this will show which supports you used.", "Haz algunas tareas de hablar o escribir y aquí verás qué apoyos usaste.")}
          </p>`
    }
    ${
      fade.length
        ? html`<h3 class="pass-sub">${I.T("My help over time", "Mi ayuda con el tiempo")}</h3>
            <ul class="pass-lines">
              ${fade.map(
                (row) =>
                  html`<li>
                    <strong>${row.use}</strong>
                    <span
                      class="fade-steps"
                      role="img"
                      aria-label="${row.sequence
                        .slice(-MAX_STEPS)
                        .map((s) => I.S(STAGE_LABEL[s].en, STAGE_LABEL[s].es))
                        .join(", ")}"
                    >
                      ${row.sequence.slice(-MAX_STEPS).map((s) => html`<span class="fade-step is-${s}" aria-hidden="true" title="${I.S(STAGE_LABEL[s].en, STAGE_LABEL[s].es)}">${STAGE_LABEL[s].en[0]}</span>`)}
                    </span>
                    <span class="fine"
                      >${I.T(fadeYou(row).en, fadeYou(row).es)}</span
                    >
                  </li>`,
              )}
            </ul>`
        : ""
    }
    ${
      cal.enough
        ? html`<h3 class="pass-sub">${I.T("How sure I was", "Qué tan seguro o segura estaba")}</h3>
            <dl class="pass-mini">
              <div>
                <dt>${I.T("Sure and right", "Seguro o segura y acerté")}</dt>
                <dd>${k.sureRight}</dd>
              </div>
              <div>
                <dt>${I.T("Sure but not right", "Seguro o segura pero no acerté")}</dt>
                <dd>${k.sureWrong}</dd>
              </div>
              <div>
                <dt>${I.T("Guessed and right", "Adiviné y acerté")}</dt>
                <dd>${k.guessRight}</dd>
              </div>
            </dl>
            <p class="fine">
              ${I.T("Answers you guessed come back for review. Answers you were sure about but missed are worth a second look.", "Las respuestas que adivinaste vuelven para repasarlas. Las que creías seguras pero fallaste merecen una segunda mirada.")}
            </p>`
        : ""
    }
  </section>`;
}

const letterBody = (letter) =>
  html`<article class="fam-letter" lang="${letter.lang}">
    <h3>${letter.title}</h3>
    <p class="fine">${letter.date}</p>
    <p>${letter.greeting}</p>
    ${letter.sections.map(
      (s) =>
        html`<h4>${s.h}</h4>
          ${s.p.map((p) => html`<p>${p}</p>`)}`,
    )}
    <p>${letter.closing}</p>
    <p class="fine">${letter.note}</p>
  </article>`;

/** The family letter: choose a language, preview it, print it or save it as a PDF. */
export function familyLetterHTML(I, source) {
  const mode = letterLang || (I.bilingual ? "both" : I.spanish ? "es" : "en");
  const letter = buildLetter(source);
  const pick = (id, en, es) =>
    html`<button
      type="button"
      class="cat-chip"
      data-letter-lang="${id}"
      aria-pressed="${mode === id}"
    >
      ${I.T(en, es)}
    </button>`;
  return html`<section class="panel fam-letter-wrap" aria-labelledby="famLetterTitle">
    <h2 id="famLetterTitle">
      ${icon("mail")} ${I.T("Letter for my family", "Carta para mi familia")}
    </h2>
    <p class="fine no-print">
      ${I.T("A one-page note about what I practiced and one thing to try at home. It uses only the work saved on this device. Print it or save it as a PDF.", "Una nota de una página sobre lo que practiqué y algo para probar en casa. Usa solo el trabajo guardado en este dispositivo. Imprímela o guárdala como PDF.")}
    </p>
    <div
      class="row-actions no-print"
      role="group"
      aria-label="${I.S("Letter language", "Idioma de la carta")}"
    >
      ${pick("en", "English", "Inglés")}${pick("es", "Español", "Español")}${pick("both", "Both", "Los dos")}
    </div>
    ${mode !== "es" ? letterBody({ ...letter.en, lang: "en" }) : ""}
    ${mode !== "en" ? letterBody({ ...letter.es, lang: "es" }) : ""}
    <div class="row-actions no-print">
      <button type="button" class="btn btn-primary" data-letter-print>
        ${icon("print")} ${I.T("Print or save as PDF", "Imprimir o guardar como PDF")}
      </button>
    </div>
  </section>`;
}

/** Click handling for the letter. Returns true when it handled the event. */
export function onLetterClick(e, ctx) {
  const lang = e.target.closest("[data-letter-lang]");
  if (lang) {
    letterLang = lang.dataset.letterLang;
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-letter-print]")) {
    document.body.dataset.printing = "letter";
    const done = () => {
      delete document.body.dataset.printing;
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
    return true;
  }
  return false;
}
