// Teacher Hub: small-group speaking routines suggested from the imported class evidence
// (access-practice-lab/src/lang/speaking-groups.js), and the Reading Ladder Spanish-version control links.
// Reads the roster this hub already keeps on this teacher device; writes nothing.
import { langMode, makeI18n } from "/access-practice-lab/src/i18n.js";
import { suggestGroups } from "/access-practice-lab/src/lang/speaking-groups.js";
import { html, icon, toHtml } from "/access-practice-lab/src/util.js";

const ROSTER_KEY = "accessTeacher:v1:roster";
const PREFS_KEY = "accessPracticeLab:v1:prefs";
const LAB = "/access-practice-lab";

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};

export function speakingGroupsHTML(I, students) {
  const { groups, noEvidence } = suggestGroups(students);
  return html`<h2 id="speakingGroupsTitle" tabindex="-1">
      ${I.T("Small-group speaking routines", "Rutinas de expresión oral en grupos pequeños")}
    </h2>
    <p class="fine">
      ${I.T(
        "Suggested from the speaking evidence imported on this device. Each group shares one need and gets one routine you lead in about ten minutes, with no clock. Check the counts and move students as you see fit. Nothing here is a level or a score.",
        "Sugerencias a partir de la evidencia oral importada en este dispositivo. Cada grupo comparte una necesidad y recibe una rutina que usted dirige en unos diez minutos, sin reloj. Revise los números y cambie a los estudiantes como le parezca. Nada aquí es un nivel ni una calificación.",
      )}
    </p>
    ${
      groups.length
        ? html`<div class="hub-grid">
            ${groups.map(
              (g, i) =>
                html`<article class="hub-card speaking-group" data-speaking-group="${g.need}">
                  <h3>${I.T(`Group ${i + 1}`, `Grupo ${i + 1}`)}: ${I.TO(g.routine.title)}</h3>
                  <p><strong>${g.members.map((m) => m.alias).join(", ")}</strong></p>
                  <p class="fine">${I.TO(g.routine.why)}</p>
                  <ul class="fine">
                    ${g.members.map((m) => html`<li>${m.alias}: ${I.T(`${m.ev.tries} speaking tries, ${m.ev.independent} on their own`, `${m.ev.tries} intentos orales, ${m.ev.independent} por su cuenta`)}${m.ev.medianSpeech !== null ? I.T(`, median ${Math.round(m.ev.medianSpeech)} s of speech`, `, mediana de ${Math.round(m.ev.medianSpeech)} s de habla`) : ""}</li>`)}
                  </ul>
                  <details>
                    <summary>${I.T("The routine", "La rutina")}</summary>
                    <ol>
                      ${g.routine.steps.map((st) => html`<li>${I.TO(st)}</li>`)}
                    </ol>
                    <p>
                      ${I.T("Frames:", "Estructuras:")}
                      ${g.routine.frames.map((f) => html`<q lang="en">${f}</q> `)}
                    </p>
                    <p class="fine">${I.TO(g.routine.listen)}</p>
                  </details>
                </article>`,
            )}
          </div>`
        : html`<p>
            ${I.T("Import student share codes above to see suggested groups.", "Importe arriba los códigos de los estudiantes para ver grupos sugeridos.")}
          </p>`
    }
    ${noEvidence.length ? html`<p class="fine">${I.T("No speaking evidence yet:", "Todavía sin evidencia oral:")} ${noEvidence.join(", ")}</p>` : ""}`;
}

export function ladderControlsHTML(I, origin) {
  const on = `${origin}${LAB}/ladder?spanish=on`;
  const off = `${origin}${LAB}/ladder?spanish=off`;
  return html`<h2 id="ladderControlsTitle" tabindex="-1">
      ${icon("language")}
      ${I.T("Reading Ladder: Spanish version", "Escalera de lectura: versión en español")}
    </h2>
    <p class="fine">
      ${I.T(
        "Every Reading Ladder text has an easier version, a version with more detail and a Spanish version. The Spanish version is off until you open the link below on a student device. Questions always stay in English.",
        "Cada texto de la Escalera de lectura tiene una versión más fácil, una versión con más detalle y una versión en español. La versión en español está desactivada hasta que abra el enlace de abajo en el dispositivo del estudiante. Las preguntas siempre siguen en inglés.",
      )}
    </p>
    <p>
      <a class="btn small" href="${on}"
        >${I.T("Turn the Spanish version on", "Activar la versión en español")}</a
      >
      <a class="btn small" href="${off}">${I.T("Turn it off", "Desactivarla")}</a>
    </p>
    <p class="fine"><code>${on}</code></p>`;
}

let drawn = "";
/** Draws once, then again only when the roster or the language changes (so open details stay open). */
function mount() {
  const groups = document.getElementById("speakingGroups");
  const ladder = document.getElementById("ladderControls");
  if (!groups && !ladder) return;
  const mode = langMode(read(PREFS_KEY, {}));
  const sig = `${mode}|${localStorage.getItem(ROSTER_KEY) || ""}`;
  if (sig === drawn) return;
  drawn = sig;
  const I = makeI18n(mode);
  const students = read(ROSTER_KEY, []);
  if (groups)
    groups.innerHTML = toHtml(speakingGroupsHTML(I, Array.isArray(students) ? students : []));
  if (ladder) ladder.innerHTML = toHtml(ladderControlsHTML(I, location.origin));
}

if (typeof document !== "undefined" && document.getElementById) {
  mount();
  // The roster changes when share codes are imported or removed; refresh when the hub saves it.
  window.addEventListener("storage", (e) => e.key === ROSTER_KEY && mount());
  document.addEventListener("click", () => setTimeout(mount, 0), { passive: true });
}

