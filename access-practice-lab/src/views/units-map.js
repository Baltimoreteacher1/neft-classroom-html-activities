// The unit map (an inline SVG path with a milestone per lesson, the project and the certificate) and the certificate.
// Two drawings of the same path: a wide one and a tall one; CSS shows the one that fits. Every milestone is a real link.
import { html, icon, raw, todayISO } from "../util.js";
import { unitsHref } from "./units-common.js";

const W = { w: 900, h: 230, r: 30 };
const T = { w: 360, h: 690, r: 34 };

/** Stop positions for the wide and tall drawings. */
function points(layout, n) {
  if (layout === "wide")
    return Array.from({ length: n }, (_, i) => [
      70 + (i * (W.w - 140)) / (n - 1),
      i % 2 ? 160 : 70,
    ]);
  return Array.from({ length: n }, (_, i) => [i % 2 ? 260 : 100, 55 + (i * (T.h - 110)) / (n - 1)]);
}

/** A smooth path through the points (horizontal or vertical easing between neighbours). */
function pathD(pts, layout) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d +=
      layout === "wide"
        ? ` C${(x0 + x1) / 2} ${y0} ${(x0 + x1) / 2} ${y1} ${x1} ${y1}`
        : ` C${x0} ${(y0 + y1) / 2} ${x1} ${(y0 + y1) / 2} ${x1} ${y1}`;
  }
  return d;
}

/** Stops in order: lessons 1-5, the project, the certificate. `state` per stop is done | current | todo. */
export function mapStops(unit, progress) {
  const stops = unit.lessons.map((l, i) => ({
    key: l.id,
    label: l.title,
    sub: ["Lesson", "Lección"],
    n: i + 1,
    done: progress.lessons[i].complete,
    glyph: String(i + 1),
  }));
  stops.push({
    key: "task",
    label: unit.task.title,
    sub: ["Project", "Proyecto"],
    n: 6,
    done: progress.task.complete,
    glyph: "flag",
  });
  stops.push({
    key: "certificate",
    label: { en: "Certificate", es: "Certificado" },
    sub: ["Finish", "Meta"],
    n: 7,
    done: Boolean(progress.certificate),
    glyph: "medal",
  });
  const current = stops.findIndex((s) => !s.done);
  return stops.map((s, i) => ({
    ...s,
    state: s.done ? "done" : i === current ? "current" : "todo",
  }));
}

function drawing(layout, unit, stops, band, I) {
  const dim = layout === "wide" ? W : T;
  const pts = points(layout, stops.length);
  const d = pathD(pts, layout);
  const doneCount = stops.filter((s) => s.done).length;
  const title = I.S(`${I.pick(unit.title)}: ${doneCount} of ${stops.length} stops finished`, `${I.pick(unit.title)}: ${doneCount} de ${stops.length} paradas terminadas`);
  const svg = `<svg class="un-map-svg" viewBox="0 0 ${dim.w} ${dim.h}" aria-hidden="true" focusable="false"><path d="${d}" class="un-map-path"></path><path d="${d}" class="un-map-trail" pathLength="100" style="stroke-dasharray:${Math.round((doneCount / (stops.length - 1)) * 100)} 100"></path></svg>`;
  // The stops are real links over the drawing (an SVG anchor cannot take the lab's link rewriting), sized as a share of the width.
  const links = stops.map((s, i) => {
    const [x, y] = pts[i];
    const size = ((dim.r * 2) / dim.w) * 100;
    const word = s.n <= 5 ? `${I.S("Lesson", "Lección")} ${s.n}` : I.S(s.sub[0], s.sub[1]);
    const state = I.S({ done: "Finished", current: "Up next", todo: "Not started" }[s.state], { done: "Terminado", current: "Sigue", todo: "Sin empezar" }[s.state]);
    const glyph = s.state === "done" ? icon("check") : s.glyph.length > 1 ? icon(s.glyph) : s.glyph;
    return html`<a class="un-stop is-${s.state}" href="${unitsHref(band, unit.id, s.key)}" style="left:${((x / dim.w) * 100).toFixed(2)}%;top:${((y / dim.h) * 100).toFixed(2)}%;width:${size.toFixed(2)}%" aria-label="${word}: ${I.pick(s.label)}. ${state}" ${s.state === "current" ? 'aria-current="step"' : ""}><span class="un-stop-glyph">${glyph}</span><span class="un-stop-cap" aria-hidden="true">${word}</span></a>`;
  });
  return html`<div class="un-map-canvas un-map-${layout}" role="group" aria-label="${title}" style="aspect-ratio:${dim.w}/${dim.h}">${raw(svg)}${links}</div>`;
}

export function unitMapHTML(I, unit, progress, band) {
  const stops = mapStops(unit, progress);
  return html`<figure class="un-map">
    ${drawing("wide", unit, stops, band, I)}${drawing("tall", unit, stops, band, I)}
    <figcaption class="fine">
      ${I.T("Your path through the unit. Every stop opens its page; you can start anywhere.", "Tu camino por la unidad. Cada parada abre su página; puedes empezar donde quieras.")}
    </figcaption>
  </figure>`;
}

/** The certificate page body: printed as one landscape page. */
export function certificateHTML(I, unit, rec, band, { earned, name }) {
  if (!earned)
    return html`<section class="panel un-lock">
      <h1 tabindex="-1">
        ${I.T("Finish the unit to get your certificate", "Termina la unidad para recibir tu certificado")}
      </h1>
      <p>
        ${I.T("Your certificate shows up when all five lessons and the project are finished.", "Tu certificado aparece cuando terminas las cinco lecciones y el proyecto.")}
      </p>
      <p>
        <a class="btn btn-primary" href="${unitsHref(band, unit.id)}"
          >${I.T("Back to the unit", "Volver a la unidad")}</a
        >
      </p>
    </section>`;
  const date = rec.cert?.at || todayISO();
  return html`<section class="un-cert" aria-labelledby="certTitle">
      <p class="un-cert-eyebrow">
        ${I.T("Language Page · Practice record", "Language Page · Registro de práctica")}
      </p>
      <h1 id="certTitle" tabindex="-1">${I.T("Unit completed", "Unidad completada")}</h1>
      <p class="un-cert-name">
        ${name || I.T("A language learner", "Una persona que aprende idiomas")}
      </p>
      <p class="un-cert-line">
        ${I.T("finished every lesson and the project in", "terminó todas las lecciones y el proyecto de")}
      </p>
      <p class="un-cert-unit">${I.TO(unit.title)}</p>
      <p class="un-cert-line">${I.T("Project:", "Proyecto:")} ${I.TO(unit.task.title)}</p>
      <p class="un-cert-date">${date}</p>
      <p class="un-cert-fine">
        ${I.T("This certificate records practice on one device. It is not a WIDA or ACCESS result, score or level.", "Este certificado registra la práctica en un dispositivo. No es un resultado, puntaje ni nivel de WIDA ni de ACCESS.")}
      </p>
    </section>
    <section class="panel no-print un-cert-tools">
      <label for="certName"
        >${I.T("Name on the certificate (optional, stays on this device)", "Nombre en el certificado (opcional, se queda en este dispositivo)")}</label
      >
      <input
        id="certName"
        class="un-input"
        type="text"
        maxlength="40"
        autocomplete="off"
        value="${name}"
        data-u-cert-name
      />
      <p class="row-actions">
        <button type="button" class="btn btn-primary" data-print>
          ${I.T("Print or save as PDF", "Imprimir o guardar como PDF")}
        </button>
        <a class="btn" href="${unitsHref(band, unit.id)}"
          >${I.T("Back to the unit", "Volver a la unidad")}</a
        >
      </p>
    </section>`;
}
