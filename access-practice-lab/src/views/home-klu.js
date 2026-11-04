// "What do you want your language to do?" — Key Language Use practice on the home library section.
import { DOMAIN_META, BASE, html, icon } from "../util.js";
import { filterByKeyUse, KEY_LANGUAGE_USES, KLU_DOMAINS, kluReference } from "../lang/purpose.js";

const domT = (I, d) => (DOMAIN_META[d] ? I.T(DOMAIN_META[d].name, DOMAIN_META[d].es) : d);

const KLU_TRY_DATA = {
  Narrate: {
    prompt: [
      "Interactive Check · Spot the Narrate move: Which sentence sequences a turning point in an experience?",
      "Comprobación interactiva · Detecta el recurso de Narrate: ¿Qué oración secuencia un momento clave en una experiencia?",
    ],
    options: [
      {
        id: "ok",
        text: "At first the kayak drifted sideways, but suddenly we paddled together and reached the dock.",
        ok: true,
        why: [
          "Yes! 'At first' and 'suddenly' sequence the events and show what changed.",
          "¡Sí! 'At first' y 'suddenly' ordenan los eventos y muestran qué cambió.",
        ],
      },
      {
        id: "alt",
        text: "Wetlands contain three main layers of aquatic plants and soil.",
        ok: false,
        why: [
          "That sentence classifies parts of a topic (Inform). Look for time-order words like 'at first' and 'suddenly'.",
          "Esa oración clasifica partes de un tema (Inform). Busca palabras de orden temporal como 'at first' y 'suddenly'.",
        ],
      },
    ],
  },
  Inform: {
    prompt: [
      "Interactive Check · Spot the Inform move: Which sentence defines and classifies a topic with precise details?",
      "Comprobación interactiva · Detecta el recurso de Inform: ¿Qué oración define y clasifica un tema con detalles precisos?",
    ],
    options: [
      {
        id: "ok",
        text: "Pollinators include bees, butterflies, and hummingbirds that transfer pollen between flowers.",
        ok: true,
        why: [
          "Yes! 'Include' and 'that transfer pollen' classify and define the group clearly.",
          "¡Sí! 'Include' y 'that transfer pollen' clasifican y definen el grupo con claridad.",
        ],
      },
      {
        id: "alt",
        text: "Yesterday I walked home in the rain after soccer practice.",
        ok: false,
        why: [
          "That sentence tells a personal story (Narrate). Look for the sentence that classifies and defines a topic.",
          "Esa oración cuenta una historia personal (Narrate). Busca la oración que clasifica y define un tema.",
        ],
      },
    ],
  },
  Explain: {
    prompt: [
      "Interactive Check · Spot the Explain move: Which sentence shows how a cause leads to an effect?",
      "Comprobación interactiva · Detecta el recurso de Explain: ¿Qué oración muestra cómo una causa produce un efecto?",
    ],
    options: [
      {
        id: "ok",
        text: "Because tree roots hold the soil in place, heavy rain causes less erosion on the hillside.",
        ok: true,
        why: [
          "Yes! 'Because' and 'causes' link the mechanism (roots holding soil) to the outcome (less erosion).",
          "¡Sí! 'Because' y 'causes' conectan el mecanismo (raíces que sujetan el suelo) con el resultado (menos erosión).",
        ],
      },
      {
        id: "alt",
        text: "Our school should open the library before first period.",
        ok: false,
        why: [
          "That states a claim without explaining how a process works (Argue). Choose the sentence with 'because' and 'causes'.",
          "Eso plantea una afirmación sin explicar cómo funciona un proceso (Argue). Elige la oración con 'because' y 'causes'.",
        ],
      },
    ],
  },
  Argue: {
    prompt: [
      "Interactive Check · Spot the Argue move: Which sentence supports a claim with evidence and addresses another view?",
      "Comprobación interactiva · Detecta el recurso de Argue: ¿Qué oración apoya una afirmación con evidencia y responde a otra postura?",
    ],
    options: [
      {
        id: "ok",
        text: "Although plastic trays are cheap, the cafeteria should use washable trays because the audit showed 400 fewer trash bags per month.",
        ok: true,
        why: [
          "Yes! 'Although' addresses a counterpoint, 'should' states the claim, and 'because the audit showed...' supplies evidence.",
          "¡Sí! 'Although' aborda un contrapunto, 'should' expresa la afirmación y 'because the audit showed...' aporta evidencia.",
        ],
      },
      {
        id: "alt",
        text: "First, rinse the tray with warm water and place it on the rack.",
        ok: false,
        why: [
          "That gives procedural steps. Look for the sentence with a claim ('should'), evidence, and 'although'.",
          "Eso da pasos de un procedimiento. Busca la oración con una afirmación ('should'), evidencia y 'although'.",
        ],
      },
    ],
  },
};

export function kluHTML(I, ctx, band, rows, idx) {
  const klu = KEY_LANGUAGE_USES.includes(ctx.prefs.kluFocus) ? ctx.prefs.kluFocus : "";
  const ref = klu ? kluReference(klu, band) : null;
  const kluTry = klu ? KLU_TRY_DATA[klu] : null;
  const pickedTry = klu ? ctx.prefs.kluTry?.[klu] : "";
  const pickedObj = kluTry?.options.find((o) => o.id === pickedTry);
  const studioTasks = [...(idx?.speaking || []).map((t) => ({ ...t, domain: "Speaking" })), ...(idx?.writing || []).map((t) => ({ ...t, domain: "Writing" }))].filter((t) => !t.band || t.band === band);
  const practice = (domain) => {
    if (domain === "Speaking" || domain === "Writing")
      return filterByKeyUse(studioTasks, klu, domain).slice(0, 3).map((t) => [`${BASE}/${domain === "Speaking" ? "speak" : "write"}/${t.id}?grades=${band}`, t.title]);
    const tier = ctx.prefs.tiers?.[domain] || "A";
    return filterByKeyUse(rows.filter((r) => r.domain === domain && r.level === tier), klu, domain).slice(0, 3).map((r) => [`${BASE}/${domain}/${r.level}/${r.id}?grades=${band}`, r.title]);
  };
  const missions = klu ? filterByKeyUse((idx?.missions || []).filter((m) => !m.band || m.band === band), klu) : [];
  return html`<section class="panel klu-practice" aria-labelledby="kluTitle">
    <p class="eyebrow">${I.T("Practice by Key Language Use", "Practica por Uso clave del lenguaje")}</p>
    <h2 id="kluTitle">${I.T("What do you want your language to do?", "¿Qué quieres que haga tu lenguaje?")}</h2>
    <div class="sort-cats" role="group" aria-label="${I.S("Key Language Use", "Uso clave del lenguaje")}">
      ${KEY_LANGUAGE_USES.map((k) => html`<button type="button" class="cat-chip" id="klu-${k}" data-klu="${k}" aria-pressed="${k === klu ? "true" : "false"}">${k}</button>`)}
    </div>
    ${ref ? html`<p>${ref.purpose}</p>
      <div class="domain-grid">
        <div class="card"><h3>${I.T("How it is organized", "Cómo se organiza")}</h3><ol>${ref.moves.map((m) => html`<li>${m}</li>`)}</ol></div>
        <div class="card"><h3>${I.T("Language functions", "Funciones del lenguaje")}</h3><ul>${ref.functions.map((m) => html`<li>${m}</li>`)}</ul></div>
        <div class="card"><h3>${I.T("Signal words", "Palabras señal")}</h3><p>${ref.signals.join(" · ")}</p></div>
      </div>
      ${kluTry ? html`<div class="card klu-interactive" data-content>
        <h3>${icon("bulb")} ${I.T(...kluTry.prompt)}</h3>
        <div class="klu-try-options">
          ${kluTry.options.map((opt) => html`<button type="button" class="btn small klu-try-btn ${pickedTry === opt.id ? (opt.ok ? "is-correct" : "is-try") : ""}" data-klu-try="${opt.id}" aria-pressed="${pickedTry === opt.id ? "true" : "false"}">${icon(pickedTry === opt.id ? (opt.ok ? "check" : "retry") : "chevron-right")} <span lang="en">${opt.text}</span></button>`)}
        </div>
        ${pickedObj ? html`<p class="fine klu-try-feedback" role="status"><strong>${pickedObj.ok ? I.T("Move spotted!", "¡Recurso detectado!") : I.T("Try the other sentence:", "Prueba la otra oración:")}</strong> ${I.T(...pickedObj.why)}</p>` : ""}
      </div>` : ""}
      <div class="domain-grid">
        ${KLU_DOMAINS.map((d) => {
          const links = practice(d);
          return html`<div class="card"><h3>${domT(I, d)}</h3><p class="fine">${ref.domains[d]}</p>${links.length ? html`<ul>${links.map(([href, title]) => html`<li><a href="${href}">${title}</a></li>`)}</ul>` : html`<p class="fine">${I.T(`No ${klu} activity at your ${d} support right now.`, `No hay actividades de ${klu} para ${DOMAIN_META[d]?.es?.toLowerCase() ?? d} con tu apoyo actual.`)} <a href="${BASE}/library?grades=${band}">${I.T("Find one in the library", "Busca una en la biblioteca")}</a>.</p>`}</div>`;
        })}
      </div>
      ${missions.length ? html`<p class="fine">${I.T(`Missions that use ${klu}:`, `Misiones que usan ${klu}:`)} ${missions.map((m, i) => html`${i ? " · " : ""}<a href="${BASE}/missions/${m.id}?grades=${band}">${m.title}</a>`)}</p>` : ""}
      <p class="fine">${I.T(`Reference for grades ${ref.band.replace("-", "–")}, in the lab's own words. Choose the same button again to close it.`, `Referencia para los grados ${ref.band.replace("-", "–")}, con las palabras del laboratorio. Elige el mismo botón otra vez para cerrarla.`)}</p>`
    : html`<p class="fine">${I.T("Choose Narrate, Inform, Explain or Argue to see how that kind of language is organized, its signal words, and practice in listening, reading, speaking and writing.", "Elige Narrate, Inform, Explain o Argue para ver cómo se organiza ese tipo de lenguaje, sus palabras señal y práctica de escuchar, leer, hablar y escribir.")}</p>`}
  </section>`;
}

