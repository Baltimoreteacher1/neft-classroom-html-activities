// Interactive Story World: markup for the four stops of each scene (explore, trail, cause bridge, retell)
// as pure functions of state; story-world.js owns the rules and the plan.
import {
  audioBtn,
  feedbackHTML,
  frameBox,
  glossHTML,
  hintHTML,
  html,
  icon,
  settled,
} from "./engine.js";
import { storyScene } from "./story-world-art.js";

// ── connectors: the word bank for the cause bridge ───────────────────────────────────────
export const CONN = {
  so: { en: "so", es: "así que" },
  because: { en: "because", es: "porque" },
  result: { en: "as a result", es: "como resultado" },
  although: { en: "although", es: "aunque" },
};
export const bankFor = (band) =>
  band === "6-8" ? ["so", "because", "result", "although"] : ["so", "because", "although"];
/** Connectors that make a true sentence for a link's form ("so": cause first; "because": result first). */
export const acceptedFor = (form, band) =>
  form === "because" ? ["because"] : band === "6-8" ? ["so", "result"] : ["so"];

const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
function join(a, b, conn, lang) {
  const A = cap(a);
  if (conn === "so") return lang === "es" ? `${A}, así que ${b}.` : `${A}, so ${b}.`;
  if (conn === "because") return lang === "es" ? `${A} porque ${b}.` : `${A} because ${b}.`;
  if (conn === "result")
    return lang === "es" ? `${A}. Como resultado, ${b}.` : `${A}. As a result, ${b}.`;
  return lang === "es" ? `${A}, aunque ${b}.` : `${A}, although ${b}.`;
}
const evOf = (story, id) => story.events.find((e) => e.id === id);
const causeClause = (story, link, lang) =>
  link.causes.map((id) => evOf(story, id).clause[lang]).join(lang === "es" ? " y " : " and ");
/** The sentence a link builds with an effect id and a connector; null parts stay blank. */
export function bridgeSentence(story, link, effId, conn, lang = "en") {
  const blank = "___";
  const c = causeClause(story, link, lang);
  const e = effId ? evOf(story, effId).clause[lang] : blank;
  const [a, b] = link.form === "because" ? [e, c] : [c, e];
  if (!conn) return `${cap(a)} ${blank} ${b}.`;
  return join(a, b, conn, lang);
}

// ── small parts ─────────────────────────────────────────────────────────────────────────
/** Highlight a leading time/signal phrase ("Next,", "During May,") when frames are on. */
function signalText(text, env) {
  const m = text.match(/^([^,]{2,48}),\s/);
  if (!m || env.sup.frames === "none" || m[1].split(/\s+/).length > 7) return text;
  return html`<mark class="sw-signal">${m[1]}</mark>${text.slice(m[1].length)}`;
}
export const eventCard = (ev, env) => html`<span class="sw-ev-t">${signalText(ev.en, env)}</span>`;
// ── stage 0: explore the scene ──────────────────────────────────────────────────────────
export function exploreHTML(story, L, env) {
  const I = env.I;
  const spots = L.tray.map((id, ti) => {
    const ev = evOf(story, id);
    const found = L.found.includes(id);
    return html`<button
      type="button"
      class="sw-spot${found ? " is-found" : ""}"
      data-g-spot="${ti}"
      style="left:${ev.spot.x}%;top:${ev.spot.y}%"
      aria-label="${found ? I.S(`Found: ${ev.spot.en}`, `Encontrado: ${ev.spot.es}`) : I.S(`Look closer at ${ev.spot.en}`, `Mira de cerca ${ev.spot.es}`)}"
      ${found ? "disabled" : ""}
    >
      ${found ? icon("check") : icon("search")}
    </button>`;
  });
  const log = L.found.map((id) => {
    const ev = evOf(story, id);
    return html`<li class="sw-log-i">
      <p>${eventCard(ev, env)}</p>
      <div class="sw-log-tools">${audioBtn(ev.en, I)}${glossHTML(ev.es, env)}</div>
    </li>`;
  });
  const all = L.found.length === story.events.length;
  return html`<p class="gs-prompt">
      ${I.T(`Tap the glowing spots to discover what happened. Found ${L.found.length} of ${story.events.length}.`, `Toca los puntos brillantes para descubrir qué pasó. Encontrados: ${L.found.length} de ${story.events.length}.`)}
    </p>
    <figure class="sw-scene">
      ${storyScene(story.art, env.band, I.S(`Scene: ${story.title.en}`, `Escena: ${story.title.es}`))}${spots}
    </figure>
    ${
      log.length
        ? html`<h3 class="sw-sub">
              ${I.T("Story log", "Registro del cuento")}
              <span class="fine"
                >${I.T("(in the order you found them, not story order)", "(en el orden en que los encontraste, no en el orden del cuento)")}</span
              >
            </h3>
            <ul class="sw-log">
              ${log}
            </ul>`
        : ""
    }
    ${all ? html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("road")}${I.T("Walk the story trail", "Recorrer el sendero del cuento")}</button></div>` : ""}`;
}

// ── stage 1: order the events on the trail ──────────────────────────────────────────────
export const trailHints = (ev, env) => [
  env.I.T(
    "Read the time words or signal words at the start of the card. They tell you when it happened.",
    "Lee las palabras de tiempo o de señal al comienzo de la tarjeta. Te dicen cuándo pasó.",
  ),
  env.I.T(ev.clue.en, ev.clue.es),
];
export function trailHTML(story, L, env, focus) {
  const I = env.I;
  const n = story.events.length;
  const stops = L.placed.map((id, i) => {
    const ev = id && evOf(story, id);
    return html`<li class="sw-stop${ev ? " is-lit" : ""}">
      <span class="sw-stop-n" aria-hidden="true">${i + 1}</span>${
        ev
          ? html`<div class="sw-stop-card">
              <p>
                ${icon("check")}<span class="visually-hidden"
                  >${I.S(`Stop ${i + 1}:`, `Parada ${i + 1}:`)}</span
                >
                ${eventCard(ev, env)}
              </p>
              ${audioBtn(ev.en, I)}
            </div>`
          : html`<button
              type="button"
              class="sw-stop-btn"
              data-g-stop="${i}"
              data-drop="${i}"
              aria-label="${I.S(`Stop ${i + 1} of ${n}: place an event here`, `Parada ${i + 1} de ${n}: coloca un hecho aquí`)}"
            >
              ${I.T("Place an event here", "Coloca un hecho aquí")}
            </button>`
      }
    </li>`;
  });
  const cards = L.tray.map((id, ti) => {
    if (L.placed.includes(id)) return "";
    const ev = evOf(story, id);
    const bounce = L.last && !L.last.ok && L.last.id === id;
    return html`<li class="sw-tray-i">
      <button
        type="button"
        class="sw-card${bounce ? " is-bounce" : ""}"
        data-g-card="${ti}"
        data-drag="${ti}"
        aria-pressed="${L.sel === id}"
      >
        ${eventCard(ev, env)}
      </button>
      <div class="sw-log-tools">${audioBtn(ev.en, I)}${glossHTML(ev.es, env)}</div>
    </li>`;
  });
  const last = L.last && L.trs[L.last.id];
  const lev = L.last && evOf(story, L.last.id);
  const fev = focus && evOf(story, focus);
  const dir =
    L.last?.dir === "early"
      ? I.T(
          "Too early on the trail. Something else has to happen before this event.",
          "Demasiado pronto en el sendero. Otro hecho tiene que pasar antes de este.",
        )
      : I.T(
          "Too late on the trail. This event happens earlier in the story.",
          "Demasiado tarde en el sendero. Este hecho pasa antes en el cuento.",
        );
  return html`<p class="gs-prompt">
      ${I.T("Put the events in story order. Pick a card, then tap its stop. You can also drag a card onto a stop.", "Pon los hechos en el orden del cuento. Elige una tarjeta y luego toca su parada. También puedes arrastrar una tarjeta a una parada.")}
    </p>
    <div class="sw-trail-wrap">
      <ol class="sw-trail" aria-label="${I.S("Story trail", "Sendero del cuento")}">
        ${stops}
      </ol>
      <div class="sw-tray-box">
        <h3 class="sw-sub">${I.T("Event cards", "Tarjetas de hechos")}</h3>
        <ul class="sw-tray">
          ${cards}
        </ul>
      </div>
    </div>
    ${fev ? hintHTML(L.trs[focus] || { h: 0, status: "open" }, trailHints(fev, env), env) : ""}
    ${last ? feedbackHTML(last, { I, right: html`${I.T("It fits at stop", "Va en la parada")} ${L.placed.indexOf(lev.id) + 1}.`, retry: dir, answer: html`${I.T("It goes at stop", "Va en la parada")} ${story.events.indexOf(lev) + 1}.`, explain: I.T(lev.clue.en, lev.clue.es) }) : ""}
    ${L.placed.every(Boolean) ? html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${I.T("Build the cause bridge", "Construir el puente de causa")}</button></div>` : ""}`;
}

// ── stage 2: cause bridge ───────────────────────────────────────────────────────────────
export const bridgeHints = (link, env) => [
  env.I.T(
    "A result happens because of the cause. Which event could not have happened without it, and happened right after?",
    "Un resultado pasa por la causa. ¿Qué hecho no podría haber pasado sin ella y pasó justo después?",
  ),
  link.form === "because"
    ? env.I.T(
        "In this sentence the result comes first. Choose a word that introduces a reason.",
        "En esta oración el resultado va primero. Elige una palabra que presente una razón.",
      )
    : env.I.T(
        "In this sentence the cause comes first. Choose a word that points forward to a result.",
        "En esta oración la causa va primero. Elige una palabra que señale un resultado.",
      ),
];
function connWhy(conn, link, I) {
  if (conn === "although")
    return I.T(
      "“Although” shows a contrast or a surprise, not a cause.",
      "“Aunque” muestra un contraste o una sorpresa, no una causa.",
    );
  if (conn === "because")
    return I.T(
      "“Because” introduces a reason, but here the cause comes first. You need a word that points to a result.",
      "“Porque” presenta una razón, pero aquí la causa va primero. Necesitas una palabra que señale un resultado.",
    );
  return I.T(
    "“So” and “as a result” point to a result, but here the result comes first. You need a word that introduces the reason.",
    "“Así que” y “como resultado” señalan un resultado, pero aquí el resultado va primero. Necesitas una palabra que presente la razón.",
  );
}
export function bridgeHTML(story, L, env) {
  const I = env.I;
  const lk = L.links[L.bi];
  const link = story.links[L.bi];
  const done = settled(lk.rs);
  const causes = link.causes.map((id) => {
    const ev = evOf(story, id);
    return html`<li class="sw-cause">
      ${icon("flag")}<span>${eventCard(ev, env)}</span>${glossHTML(ev.es, env)}
    </li>`;
  });
  const opts = lk.opts.map(
    (id, p) =>
      html`<button
        type="button"
        class="gs-choice sw-eff${lk.eff === id ? " is-sel" : ""}${done && id === link.effect ? " is-right" : ""}"
        data-g-eff="${p}"
        aria-pressed="${lk.eff === id}"
        ${done ? "disabled" : ""}
      >
        ${evOf(story, id).en}
      </button>`,
  );
  const bank = lk.bank.map(
    (k) =>
      html`<button
        type="button"
        class="sw-conn${lk.conn === k ? " is-sel" : ""}"
        data-g-conn="${k}"
        aria-pressed="${lk.conn === k}"
        ${done ? "disabled" : ""}
      >
        <span>${CONN[k].en}</span
        >${env.sup.gloss === "show" ? html`<span class="sw-conn-es" lang="es">${CONN[k].es}</span>` : ""}
      </button>`,
  );
  const sentence = bridgeSentence(story, link, lk.eff, lk.conn, "en");
  const full = lk.eff && lk.conn;
  const decoy = lk.last && link.decoys.find((d) => d.id === lk.last.eff);
  const okConn = lk.last && acceptedFor(link.form, env.band).includes(lk.last.conn);
  const retry = lk.last
    ? html`${decoy ? I.T(decoy.why.en, decoy.why.es) : ""}
      ${okConn ? "" : connWhy(lk.last.conn, link, I)}`
    : "";
  const two = link.causes.length > 1;
  return html`<p class="gs-prompt">
      ${I.T(`Bridge ${L.bi + 1} of ${story.links.length}. ${two ? "These two causes worked together. Which event did they lead to?" : "What happened as a direct result of this cause?"} Then pick the word that joins them.`, `Puente ${L.bi + 1} de ${story.links.length}. ${two ? "Estas dos causas trabajaron juntas. ¿A qué hecho llevaron?" : "¿Qué pasó como resultado directo de esta causa?"} Luego elige la palabra que los une.`)}
    </p>
    <div class="sw-bridge">
      <div class="sw-bridge-side">
        <h3 class="sw-sub">${two ? I.T("Causes", "Causas") : I.T("Cause", "Causa")}</h3>
        <ul class="sw-causes">
          ${causes}
        </ul>
      </div>
      <div class="sw-bridge-arch" aria-hidden="true">
        <svg viewBox="0 0 120 40">
          <path
            d="M4 36Q60 -8 116 36"
            fill="none"
            stroke="currentColor"
            stroke-width="6"
            stroke-linecap="round"
            stroke-dasharray="${done ? "0" : "4 10"}"
          />
        </svg>
      </div>
      <div class="sw-bridge-side">
        <h3 class="sw-sub">${I.T("Result", "Resultado")}</h3>
        <div
          class="gs-choices"
          role="group"
          aria-label="${I.S("Possible results", "Resultados posibles")}"
        >
          ${opts}
        </div>
      </div>
    </div>
    <h3 class="sw-sub">${I.T("Joining words", "Palabras para unir")}</h3>
    <div class="sw-bank" role="group" aria-label="${I.S("Joining words", "Palabras para unir")}">
      ${bank}
    </div>
    <p class="sw-sentence${done ? " is-built" : ""}" aria-live="polite">
      <span class="sw-sentence-l">${I.T("Your sentence", "Tu oración")}</span>${sentence}
    </p>
    ${full ? html`<p class="sw-readback">${audioBtn(sentence, I, I.S("Read my sentence aloud", "Leer mi oración en voz alta"))}${glossHTML(bridgeSentence(story, link, lk.eff, lk.conn, "es"), env)}</p>` : ""}
    ${hintHTML(lk.rs, bridgeHints(link, env), env)}
    ${feedbackHTML(lk.rs, { I, right: I.T(link.why.en, link.why.es), retry, answer: bridgeSentence(story, link, link.effect, acceptedFor(link.form, env.band)[0], "en"), explain: html`${I.T(link.why.en, link.why.es)} ${retry}` })}
    <div class="gs-actions">
      ${done ? html`<button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${L.bi < story.links.length - 1 ? I.T("Next bridge", "Siguiente puente") : I.T("Retell the story", "Volver a contar el cuento")}</button>` : html`<button type="button" class="btn btn-primary" data-g-check ${full ? "" : "disabled"}>${icon("check")}${I.T("Cross the bridge", "Cruzar el puente")}</button>`}
    </div>`;
}

// ── stage 3: retell ─────────────────────────────────────────────────────────────────────
export const retellHints = (env) => [
  env.I.T(
    "Check the order: do the time words match the order on your trail?",
    "Revisa el orden: ¿las palabras de tiempo siguen el orden de tu sendero?",
  ),
  env.I.T(
    "Check the causes: does each “so” or “because” join the cause and result you built on the bridge?",
    "Revisa las causas: ¿cada “así que” o “porque” une la causa y el resultado que construiste en el puente?",
  ),
];
export function retellHTML(story, L, env) {
  const I = env.I;
  const r = L.retell;
  const done = settled(r.rs);
  const right = r.order.indexOf(0);
  const items = r.order.map((oi, p) => {
    const c = story.retell[oi];
    return html`<li class="sw-retell-i">
      <button
        type="button"
        class="gs-choice sw-retell${r.pick === p ? " is-sel" : ""}${done && p === right ? " is-right" : ""}${r.misses.includes(p) && p !== right ? " is-miss" : ""}"
        data-g-retell="${p}"
        aria-pressed="${r.pick === p}"
        ${done ? "disabled" : ""}
      >
        ${c.en}
      </button>
      <div class="sw-log-tools">${audioBtn(c.en, I)}${glossHTML(c.es, env)}</div>
    </li>`;
  });
  const lastWrong = r.last != null && r.order[r.last] !== 0 ? story.retell[r.order[r.last]] : null;
  const frame =
    env.band === "3-5"
      ? "First, ___. Next, ___, so ___. Finally, ___."
      : "At first, ___. As a result, ___. Because ___ and ___, ___.";
  return html`<p class="gs-prompt">
      ${I.T("Choose the retelling that keeps the events in order and joins each cause to its real result.", "Elige el resumen que mantiene los hechos en orden y une cada causa con su resultado real.")}
    </p>
    ${frameBox(frame, env, { label: I.T("A strong retelling sounds like", "Un buen resumen suena así") })}
    <ol class="sw-retells">
      ${items}
    </ol>
    ${hintHTML(r.rs, retellHints(env), env)}
    ${feedbackHTML(r.rs, { I, right: I.T("Every event is in order, and each joining word links a real cause to its result.", "Cada hecho está en orden, y cada palabra de unión enlaza una causa real con su resultado."), retry: lastWrong ? I.T(lastWrong.why.en, lastWrong.why.es) : "", answer: story.retell[0].en, explain: lastWrong ? I.T(lastWrong.why.en, lastWrong.why.es) : "" })}
    <div class="gs-actions">
      ${done ? html`<button type="button" class="btn btn-primary btn-big" data-g-next>${icon("medal")}${I.T("Finish the scene", "Terminar la escena")}</button>` : html`<button type="button" class="btn btn-primary" data-g-check ${r.pick == null ? "disabled" : ""}>${icon("check")}${I.T("Check my retelling", "Revisar mi resumen")}</button>`}
    </div>`;
}
