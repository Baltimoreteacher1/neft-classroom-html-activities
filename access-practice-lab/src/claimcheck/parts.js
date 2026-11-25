// Misconception Detective markup. Every builder takes the i18n object, the case and the saved state and returns an
// html`` fragment; nothing here touches storage or the DOM. Learner text is only ever interpolated through html``.
import { BASE, html, icon, raw } from "../util.js";
import {
  BUCKET_ORDER,
  BUCKETS,
  KINDS,
  MIN_WORDS,
  STEPS,
  bySubject,
  caseById,
  casesForBand,
  checkSentence,
  hintFor,
  sortDone,
  wrongSortNudge,
} from "./engine.js";

const STEP_LABEL = {
  read: ["Read", "Leer"],
  find: ["Find", "Encontrar"],
  sort: ["Sort", "Clasificar"],
  fix: ["Fix", "Corregir"],
  reveal: ["Reveal", "Descubrir"],
};
const HINT_LABEL = [
  ["Reread", "Releer"],
  ["Narrow it down", "Acotar"],
  ["Name the kind of mistake", "Nombrar el tipo de error"],
];
export const FRAME = "The mistake is ___ because ___.";
export const bandText = (band) => band.replace("-", "–");
const caseHref = (id, band) => `${BASE}/claim-check/${id}?grades=${band}`;
export const listHref = (band) => `${BASE}/claim-check?grades=${band}`;

export function stepsNav(I, s) {
  const at = STEPS.indexOf(s.step);
  return html`<ol class="cc-steps" aria-label="${I.S("Steps", "Pasos")}">
    ${STEPS.map(
      (id, i) =>
        html`<li
          class="cc-step"
          ${i === at ? raw('aria-current="step"') : ""}
          data-state="${i < at ? "done" : i === at ? "now" : "next"}"
        >
          <span class="cc-step-n" aria-hidden="true">${i < at ? icon("check") : i + 1}</span>
          <span>${I.T(...STEP_LABEL[id])}</span
          >${i < at ? html`<span class="visually-hidden"> (${I.S("done", "hecho")})</span>` : ""}
        </li>`,
    )}
  </ol>`;
}

/** The numbered lines. mode: "read" (plain), "find" (tap targets with notes) or "static" (flawed line marked). */
export function linesHTML(I, c, s, mode) {
  return html`<ol class="cc-lines" lang="en">
    ${c.lines.map((l, i) => {
      const n = html`<span class="cc-n" aria-hidden="true">${i + 1}</span
        ><span class="visually-hidden">${I.S("Line", "Línea")} ${i + 1}: </span
        ><span class="cc-t">${I.TARGET(l.en, l.es)}</span>`;
      if (mode === "find") {
        const tried = s.tried.includes(i);
        const flawed = s.found && i === c.flawed;
        return html`<li class="cc-li" data-mark="${flawed ? "flaw" : tried ? "fine" : "open"}">
          <button
            type="button"
            class="cc-line"
            id="cc-line-${i}"
            data-cc-line="${i}"
            ${s.found ? raw("disabled") : ""}
          >
            ${n}
          </button>
          ${tried ? html`<p class="cc-note">${icon("check")} <strong>${I.T("This line holds up.", "Esta línea se sostiene.")}</strong> ${I.T(c.whyFine[i].en, c.whyFine[i].es)}</p>` : ""}
          ${flawed ? html`<p class="cc-note is-flaw">${icon("alert")} <strong>${I.T("This is the line with the mistake.", "Esta es la línea con el error.")}</strong></p>` : ""}
        </li>`;
      }
      const flawed = mode === "static" && s.found && i === c.flawed;
      return html`<li class="cc-li" data-mark="${flawed ? "flaw" : "plain"}">
        <div class="cc-line cc-line-plain">${n}</div>
        ${flawed ? html`<p class="cc-note is-flaw">${icon("alert")} <strong>${I.T("The line with the mistake", "La línea con el error")}</strong></p>` : ""}
      </li>`;
    })}
  </ol>`;
}

export function termsHTML(I, c) {
  return html`<details class="cc-terms">
    <summary>
      ${icon("words")} ${I.T("Word help", "Ayuda con palabras")} (${c.terms.length})
    </summary>
    <dl>
      ${c.terms.map(
        (t) =>
          html`<dt lang="en">${t.w}</dt>
            <dd><span lang="es">${t.es}</span> · <span lang="en">${t.gloss}</span></dd>`,
      )}
    </dl>
  </details>`;
}

export function hintsHTML(I, c, s) {
  const open = Array.from({ length: s.hints }, (_, i) => hintFor(c, i + 1));
  const next = s.hints + 1;
  return html`<section class="cc-hints" aria-labelledby="ccHints">
    <h3 id="ccHints">${icon("bulb")} ${I.T("Need a hint?", "¿Necesitas una pista?")}</h3>
    <p class="fine">
      ${I.T("Hints are a ladder you open yourself. Opening one is fine: the case is just counted as done with help.", "Las pistas son una escalera que abres tú. Abrir una está bien: el caso solo se cuenta como hecho con ayuda.")}
    </p>
    ${
      open.length
        ? html`<ol class="cc-hint-list">
            ${open.map((h, i) => html`<li><strong>${I.T(...HINT_LABEL[i])}.</strong> ${I.T(h.en, h.es)}</li>`)}
          </ol>`
        : ""
    }
    ${next <= 3 ? html`<button type="button" class="btn" data-cc-hint>${I.T(`Open hint ${next} of 3`, `Abrir la pista ${next} de 3`)}: ${I.T(...HINT_LABEL[next - 1])}</button>` : html`<p class="fine">${I.T("All three hints are open.", "Las tres pistas están abiertas.")}</p>`}
  </section>`;
}

const goBtn = (I, to, en, es) =>
  html`<div class="row-actions">
    <button type="button" class="btn btn-primary" data-cc-go="${to}">
      ${I.T(en, es)} ${icon("arrow-right")}
    </button>
  </div>`;

export function readStep(I, c, s) {
  return html`<section aria-labelledby="ccStep">
    <h3 id="ccStep" tabindex="-1">
      ${I.T(`Read what ${c.speaker} says`, `Lee lo que dice ${c.speaker}`)}
    </h3>
    <p class="lead">
      ${I.T(`${c.speaker} is a classmate explaining an idea. Most of it is right, but one line is not. Read all of it first.`, `${c.speaker} es un compañero que explica una idea. Casi todo está bien, pero una línea no. Primero léela toda.`)}
    </p>
    <div class="panel cc-explain">${linesHTML(I, c, s, "read")}</div>
    ${termsHTML(I, c)}
    ${goBtn(I, "find", "I have read it: find the mistake", "Ya la leí: encontrar el error")}
  </section>`;
}

export function findStep(I, c, s) {
  return html`<section aria-labelledby="ccStep">
    <h3 id="ccStep" tabindex="-1">
      ${I.T("Tap the line you think is wrong", "Toca la línea que crees que está mal")}
    </h3>
    <p class="fine">
      ${I.T("You can tap as many lines as you like. A line that is fine will tell you why.", "Puedes tocar todas las líneas que quieras. Una línea que está bien te dirá por qué.")}
    </p>
    <div class="panel cc-explain">${linesHTML(I, c, s, "find")}</div>
    ${
      s.found
        ? html`<p class="cc-ok" role="status">
              ${icon("check")}
              ${I.T("You found it. Next, sort the evidence.", "Lo encontraste. Ahora clasifica la evidencia.")}
            </p>
            ${goBtn(I, "sort", "Sort the evidence", "Clasificar la evidencia")}`
        : ""
    }
    ${termsHTML(I, c)}
  </section>`;
}

function cardHTML(I, c, s, card) {
  const pick = s.sort[card.id];
  const right = pick === card.kind;
  return html`<fieldset class="cc-card" data-state="${pick ? (right ? "ok" : "no") : "open"}">
    <legend class="cc-card-t" lang="en">${I.TARGET(card.en, card.es)}</legend>
    <div class="cc-opts">
      ${BUCKET_ORDER.map(
        (b) =>
          html`<label class="cc-opt"
            ><input
              type="radio"
              name="ccSort-${card.id}"
              id="cc-s-${card.id}-${b}"
              value="${b}"
              data-cc-card="${card.id}"
              ${pick === b ? raw("checked") : ""}
            />
            <span>${I.T(BUCKETS[b].en, BUCKETS[b].es)}</span></label
          >`,
      )}
    </div>
    ${pick && right ? html`<p class="cc-fb ok">${icon("check")} <strong>${I.T("Yes.", "Sí.")}</strong> ${I.T(card.note.en, card.note.es)}</p>` : ""}
    ${pick && !right ? html`<p class="cc-fb no">${icon("info")} <strong>${I.T("Not quite.", "Todavía no.")}</strong> ${I.T(wrongSortNudge(card.kind, pick).en, wrongSortNudge(card.kind, pick).es)}</p>` : ""}
  </fieldset>`;
}

export function sortStep(I, c, s) {
  const done = sortDone(s, c);
  const left = c.cards.filter((k) => s.sort[k.id] !== k.kind).length;
  return html`<section aria-labelledby="ccStep">
    <h3 id="ccStep" tabindex="-1">
      ${I.T("Sort the evidence cards", "Clasifica las tarjetas de evidencia")}
    </h3>
    <p class="fine">
      ${I.T("Put each card in one pile. Evidence is something we can check. An assumption or opinion is something we cannot check yet.", "Pon cada tarjeta en un grupo. La evidencia es algo que podemos comprobar. Una suposición o una opinión es algo que todavía no podemos comprobar.")}
    </p>
    <details class="cc-recap">
      <summary>${I.T("Show the explanation again", "Mostrar la explicación otra vez")}</summary>
      ${linesHTML(I, c, s, "static")}
    </details>
    <div class="cc-cards">${c.cards.map((k) => cardHTML(I, c, s, k))}</div>
    <p class="fine" role="status">
      ${done ? I.T("Every card is in the right pile.", "Todas las tarjetas están en el grupo correcto.") : I.T(`${left} card${left === 1 ? "" : "s"} still to sort correctly.`, `Falta${left === 1 ? "" : "n"} ${left} tarjeta${left === 1 ? "" : "s"} por clasificar bien.`)}
    </p>
    ${done ? goBtn(I, "fix", "Fix the claim", "Corregir la afirmación") : ""}
  </section>`;
}

export function fixStep(I, c, s, msg) {
  const right = c.fix.findIndex((f) => f.correct);
  const shown = s.fixed ? right : s.fixTried.at(-1);
  const obs = s.checked ? checkSentence(c, s.sentence) : null;
  const ev = c.cards.find((k) => k.kind === "evidence");
  return html`<section aria-labelledby="ccStep">
    <h3 id="ccStep" tabindex="-1">${I.T("Fix the claim", "Corrige la afirmación")}</h3>
    <details class="cc-recap">
      <summary>${I.T("Show the explanation again", "Mostrar la explicación otra vez")}</summary>
      ${linesHTML(I, c, s, "static")}
    </details>
    <fieldset class="cc-fix">
      <legend>
        ${I.T("Which statement should replace the line with the mistake?", "¿Qué enunciado debería reemplazar a la línea con el error?")}
      </legend>
      ${c.fix.map(
        (f, i) =>
          html`<label class="cc-opt cc-choice" lang="en"
              ><input
                type="radio"
                name="ccFix"
                id="cc-f-${i}"
                value="${i}"
                data-cc-fix="${i}"
                ${shown === i ? raw("checked") : ""}
                ${s.fixed ? raw("disabled") : ""}
              />
              <span>${I.TARGET(f.en, f.es)}</span></label
            >
            ${s.fixTried.includes(i) ? html`<p class="cc-fb no">${icon("info")} <strong>${I.T("Not quite.", "Todavía no.")}</strong> ${I.T("Check this choice against one piece of evidence you sorted:", "Compara esta opción con una de las evidencias que clasificaste:")} <q lang="en">${ev.en}</q></p>` : ""}`,
      )}
    </fieldset>
    ${s.fixed ? html`<p class="cc-ok" role="status">${icon("check")} ${I.T("That statement fits the evidence. Now explain your thinking.", "Ese enunciado coincide con la evidencia. Ahora explica tu razonamiento.")}</p>` : ""}
    ${s.fixed ? writeHTML(I, c, s, obs, msg) : ""}
  </section>`;
}

function writeHTML(I, c, s, obs, msg) {
  const note = msg || (obs ? { en: obs.en, es: obs.es } : null);
  return html`<div class="panel cc-write">
    <label for="ccSentence"
      ><strong
        >${I.T("In one sentence, say what the mistake is and why.", "En una oración, di cuál es el error y por qué.")}</strong
      ></label
    >
    <p class="fine" id="ccFrameHint">
      ${I.T(`Optional frame: ${FRAME}`, "Estructura opcional: El error es ___ porque ___.")}
    </p>
    <textarea
      id="ccSentence"
      rows="3"
      maxlength="600"
      lang="en"
      spellcheck="true"
      aria-describedby="ccFrameHint"
    >
${s.sentence}</textarea>
    <div class="row-actions">
      <button type="button" class="btn" data-cc-frame>
        ${I.T("Use the sentence frame", "Usar la estructura")}
      </button>
      <button type="button" class="btn btn-primary" data-cc-check>
        ${I.T("Check my sentence", "Revisar mi oración")}
      </button>
    </div>
    <div id="ccAfter" role="status">
      ${note ? html`<p class="cc-fb ${obs?.ok ? "ok" : "no"}">${icon(obs?.ok ? "check" : "info")} ${I.T(note.en, note.es)}</p>` : ""}
      ${
        s.checked
          ? html`<p class="fine">
                ${I.T("You can keep your sentence as it is, or change it and check again.", "Puedes dejar tu oración como está, o cambiarla y revisarla otra vez.")}
              </p>
              ${goBtn(I, "reveal", "See why the line is wrong", "Ver por qué la línea está mal")}`
          : ""
      }
    </div>
  </div>`;
}

export function revealStep(I, c, s, next, share = { inClass: false, status: "" }) {
  const k = KINDS[c.flaw];
  const fix = c.fix.find((f) => f.correct);
  const obs = checkSentence(c, s.sentence);
  return html`<section aria-labelledby="ccStep">
    <h3 id="ccStep" tabindex="-1">${I.T("Why the line is wrong", "Por qué la línea está mal")}</h3>
    <div class="panel cc-reveal">
      <h4>${I.T("The line with the mistake", "La línea con el error")}</h4>
      <blockquote lang="en">${I.TARGET(c.lines[c.flawed].en, c.lines[c.flawed].es)}</blockquote>
      <h4>${I.T("Kind of mistake", "Tipo de error")}</h4>
      <p>
        <strong>${icon("alert")} ${I.T(k.en, k.es)}.</strong> ${I.T(k.explain.en, k.explain.es)}
      </p>
      <h4>${I.T("The accurate idea", "La idea correcta")}</h4>
      <p>${I.T(c.why.en, c.why.es)}</p>
      <p lang="en">
        <strong>${I.T("A correct statement:", "Un enunciado correcto:")}</strong>
        ${I.TARGET(fix.en, fix.es)}
      </p>
      <h4>${I.T("Your reasoning", "Tu razonamiento")}</h4>
      <blockquote lang="en">${s.sentence}</blockquote>
      <p class="fine">${I.T(obs.en, obs.es)}</p>
    </div>
    <div class="panel cc-transfer">
      <h4>
        ${icon("detective")} ${I.T("Try it on a new claim", "Pruébalo con una afirmación nueva")}
      </h4>
      <p lang="en">${I.TARGET(c.transfer.en, c.transfer.es)}</p>
    </div>
    <p class="cc-ok" role="status">
      ${icon("check")}
      ${s.independent ? I.T("Finished on your own: you did not open a hint.", "Terminado por tu cuenta: no abriste ninguna pista.") : I.T(`Finished with help: you opened ${s.hints} hint${s.hints === 1 ? "" : "s"}.`, `Terminado con ayuda: abriste ${s.hints} pista${s.hints === 1 ? "" : "s"}.`)}
    </p>
    <div class="row-actions">
      ${next ? html`<a class="btn btn-primary" href="${next.href}">${I.T("Next case", "Siguiente caso")}: ${I.T(next.title.en, next.title.es)}</a>` : ""}
      <a class="btn" href="${listHref(c.band)}">${I.T("All cases", "Todos los casos")}</a>
      ${share.inClass ? html`<button type="button" class="btn" data-cc-share>${icon("mail")} ${I.T("Share with my teacher", "Compartir con mi docente")}</button>` : ""}
    </div>
    ${share.inClass ? html`<p class="fine" role="status">${share.status === "sent" ? I.T("Sent to your teacher. Nothing else was sent.", "Enviado a tu docente. No se envió nada más.") : share.status === "failed" ? I.T("Could not send it. Your work is still saved here.", "No se pudo enviar. Tu trabajo sigue guardado aquí.") : I.T("Sharing sends only the sentence you wrote, and only when you press the button.", "Compartir envía solo la oración que escribiste, y solo cuando presionas el botón.")}</p>` : ""}
  </section>`;
}

const STATUS_EN = (s, d) =>
  d
    ? d.independent
      ? ["Finished on my own", "Terminado por mi cuenta"]
      : ["Finished with a hint", "Terminado con una pista"]
    : s
      ? [
          `In progress: step ${STEPS.indexOf(s.step) + 1} of 5`,
          `En curso: paso ${STEPS.indexOf(s.step) + 1} de 5`,
        ]
      : ["Not started", "Sin empezar"];

export function chooserHTML(I, band, data, sum) {
  const last =
    data.last && !data.done[data.last] && data.open[data.last] && caseById(data.last)?.band === band
      ? caseById(data.last)
      : null;
  return html`<div class="cc-chooser">
    <section class="panel cc-progress" aria-labelledby="ccProg">
      <h2 id="ccProg">${I.T("Your cases", "Tus casos")}</h2>
      <p>
        ${I.T(`You have finished ${sum.finished} of ${sum.total} cases. ${sum.independent} on your own, and ${sum.supported} with a hint open.`, `Has terminado ${sum.finished} de ${sum.total} casos. ${sum.independent} por tu cuenta y ${sum.supported} con una pista abierta.`)}
      </p>
      <p class="fine">
        ${I.T("Nothing here is a score. Opening a hint is a good way to learn; it is only counted separately.", "Nada aquí es una calificación. Abrir una pista es una buena manera de aprender; solo se cuenta aparte.")}
      </p>
      ${last ? html`<a class="btn btn-primary" href="${caseHref(last.id, band)}">${I.T("Continue", "Continuar")}: ${I.T(last.title.en, last.title.es)}</a>` : ""}
    </section>
    ${bySubject(band).map(
      (g) =>
        html`<section aria-labelledby="ccSub-${g.id}">
          <h2 id="ccSub-${g.id}">${I.T(g.en, g.es)}</h2>
          <ul class="cc-list">
            ${g.cases.map((c) => {
              const [en, es] = STATUS_EN(data.open[c.id], data.done[c.id]);
              return html`<li>
                <a class="cc-case" href="${caseHref(c.id, band)}"
                  ><strong>${I.T(c.title.en, c.title.es)}</strong
                  ><span class="fine">${c.concept}</span
                  ><span class="cc-status" data-done="${data.done[c.id] ? "yes" : "no"}"
                    >${data.done[c.id] ? icon("check") : ""} ${I.T(en, es)}</span
                  ></a
                >
              </li>`;
            })}
          </ul>
        </section>`,
    )}
  </div>`;
}

export const nextCase = (c, data) => {
  const list = casesForBand(c.band);
  const after = [...list.slice(list.indexOf(c) + 1), ...list.slice(0, list.indexOf(c))].find(
    (x) => !data.done[x.id],
  );
  return after ? { href: caseHref(after.id, c.band), title: after.title } : null;
};
