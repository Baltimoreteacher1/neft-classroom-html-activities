// Benchmark windows panel on the Practice tests page: Fall / Winter / Spring forms, a "save this result as the
// <window>" press per finished form, and a growth-by-domain table that shows questions right out of the same
// number of questions. No level, score band, percentage or prediction.
import {
  BENCHMARK_KEY,
  benchmarkGrowth,
  normalizeSnapshots,
  saveWindow,
  saveableWindows,
} from "../lang/benchmark.js";
import { loadTestRecord } from "../store.js";
import { BASE, DOMAIN_META, announce, formatDate, html, icon, safeJson, storage } from "../util.js";

export const loadSnapshots = () => normalizeSnapshots(safeJson(storage.get(BENCHMARK_KEY), {}));

const diffText = (I, c) => {
  if (c.withheld)
    return I.T(
      "Not compared: different question counts",
      "Sin comparar: distinto número de preguntas",
    );
  const n = Math.abs(c.diff);
  if (c.diff === 0)
    return I.T(
      `Same number right (of ${c.of})`,
      `El mismo número de respuestas correctas (de ${c.of})`,
    );
  return c.diff > 0
    ? I.T(`${n} more right (of ${c.of})`, `${n} correcta${n === 1 ? "" : "s"} más (de ${c.of})`)
    : I.T(`${n} fewer right (of ${c.of})`, `${n} correcta${n === 1 ? "" : "s"} menos (de ${c.of})`);
};

function cellText(I, cell) {
  if (cell.state === "scored")
    return I.T(
      `${cell.correct} of ${cell.total} right`,
      `${cell.correct} de ${cell.total} correctas`,
    );
  if (cell.state === "review") return I.T("Done · teacher review", "Hecho · revisión docente");
  return "—";
}

export function benchmarkPanelHTML(I, band) {
  const snapshots = loadSnapshots();
  const growth = benchmarkGrowth(band, snapshots);
  const pending = saveableWindows(band, snapshots, loadTestRecord);
  return html`<section class="test-group benchmark-panel" aria-labelledby="bmTitle" id="benchmarks">
    <h2 class="section-title" id="bmTitle">
      ${icon("calendar")}${I.T("Benchmark windows: fall, winter, spring", "Momentos de referencia: otoño, invierno, primavera")}
    </h2>
    <p class="lead">
      ${I.T(
        "Take one practice form in each window and save it. The table compares how many questions you got right in each skill. It is practice evidence, not a level or a score.",
        "Haz una prueba de práctica en cada momento y guárdala. La tabla compara cuántas preguntas respondiste bien en cada destreza. Es evidencia de práctica, no un nivel ni un puntaje.",
      )}
    </p>
    <ul class="test-grid">
      ${growth.windows.map(
        (w) =>
          html`<li class="test-card">
            <h3>${I.T(w.en, w.es)}</h3>
            <p>
              ${w.result ? I.T(`Saved ${formatDate(w.result.date)}`, `Guardado ${formatDate(w.result.date)}`) : I.T("Not saved yet", "Aún sin guardar")}
            </p>
            ${w.repeat ? html`<p class="fine">${I.T("This window repeats an earlier form, so part of any change can come from seeing it before.", "Este momento repite una prueba anterior, así que parte del cambio puede venir de haberla visto antes.")}</p>` : ""}
            <div class="row-actions">
              <a class="btn small" href="${BASE}/test/${w.testId}"
                >${I.T("Open the form", "Abrir la prueba")}</a
              >
              ${pending.some((p) => p.id === w.id) ? html`<button type="button" class="btn small btn-primary" data-bm-save="${w.id}">${I.T(`Save my result as ${w.en}`, `Guardar mi resultado como ${w.es}`)}</button>` : ""}
            </div>
          </li>`,
      )}
    </ul>
    ${
      growth.done
        ? html`<div class="table-wrap">
            <table class="benchmark-table">
              <caption>
                ${I.T("Growth by skill", "Progreso por destreza")}
              </caption>
              <thead>
                <tr>
                  <th scope="col">${I.T("Skill", "Destreza")}</th>
                  ${growth.windows.map((w) => html`<th scope="col">${I.T(w.en, w.es)}</th>`)}
                  <th scope="col">${I.T("Change", "Cambio")}</th>
                </tr>
              </thead>
              <tbody>
                ${growth.rows.map(
                  (r) =>
                    html`<tr>
                      <th scope="row">${I.T(r.domain, DOMAIN_META[r.domain].es)}</th>
                      ${r.cells.map((c) => html`<td>${cellText(I, c)}</td>`)}
                      <td>
                        ${r.change ? diffText(I, r.change) : r.scored ? I.T("Needs two windows", "Necesita dos momentos") : I.T("Teacher review", "Revisión docente")}
                      </td>
                    </tr>`,
                )}
              </tbody>
            </table>
          </div>`
        : html`<p class="fine">
            ${I.T("No window saved yet. Finish a form, then save it to a window.", "Aún no hay momentos guardados. Termina una prueba y guárdala en un momento.")}
          </p>`
    }
  </section>`;
}

export function onBenchmarkClick(event, ctx, I) {
  const button = event.target.closest?.("[data-bm-save]");
  if (!button) return false;
  const next = saveWindow(loadSnapshots(), ctx.band, button.dataset.bmSave, loadTestRecord);
  storage.set(BENCHMARK_KEY, JSON.stringify(next));
  announce(I.S("Saved to the benchmark window.", "Guardado en el momento de referencia."));
  ctx.rerender();
  return true;
}
