// Home hero: the Language Exhibition hall (pictures/ds/hall-{68,35}.svg) with four lit stations. Each
// station opens a one-minute language preview that really works (listen, find evidence, build a spoken
// sentence, choose a connector). Stations are real buttons in a labelled group; the pins drawn over the
// art are a pointer shortcut to the same buttons. Station centres come from tools/access-hall-art.mjs.
import { listenPlayerHTML } from "../components.js";
import { canSpeak } from "../speech.js";
import { ART, html, icon } from "../util.js";

export const STATIONS = {
  Listening: { x: 23.75, y: 61.8, en: "Sound Dome", es: "Cúpula del sonido" },
  Reading: { x: 50, y: 43.4, en: "Reading Atelier", es: "Taller de lectura" },
  Speaking: { x: 72.5, y: 63.2, en: "Expression Stage", es: "Escenario de expresión" },
  Writing: { x: 86.7, y: 85.5, en: "Composition Desk", es: "Mesa de composición" },
};
const ORDER = ["Listening", "Reading", "Speaking", "Writing"];

const PREVIEWS = {
  "6-8": {
    Listening: {
      script: [
        "The water-filter demonstration has moved from the gym to the science lab, Room 114. It begins at 2:15.",
      ],
      prompt: "Where will the demonstration happen?",
      options: [
        ["gym", "The gym"],
        ["lab", "The science lab, Room 114", true],
        ["table", "The front table"],
      ],
      why: "Listen for “moved from … to …”. The new place comes after “to”.",
    },
    Reading: {
      sentences: [
        "Water is poured into the top, where gravel traps large pieces.",
        "In our test, brown water came out nearly clear after 6 minutes.",
        "However, the filter cannot remove germs.",
      ],
      prompt: "Which sentence proves the filter worked?",
      answer: 1,
      why: "Proof is a result you can see or measure: a colour change and a time.",
    },
    Speaking: {
      frame: "The water came out clearer because",
      options: [
        ["sand", "the sand layers trapped the particles.", true],
        ["boil", "people should boil it.", false],
        ["gym", "the demonstration moved.", false],
      ],
      why: "A strong reason explains the cause. Which ending tells how the water got clearer?",
    },
    Writing: {
      before: "The garden team should build the sand filter",
      after: "the water is only for plants, not for drinking.",
      options: [
        ["because", "because", true],
        ["until", "until"],
        ["unless", "unless"],
      ],
      why: "You are giving a reason for the claim. Which word introduces a reason?",
    },
  },
  "3-5": {
    Listening: {
      script: [
        "The bean plant table is in the library today, not in the gym. Please go there after lunch.",
      ],
      prompt: "Where is the bean plant table?",
      options: [
        ["library", "In the library", true],
        ["gym", "In the gym"],
        ["lunch", "In the lunchroom"],
      ],
      why: "The speaker says “not in the gym”. Listen for the place before “not”.",
    },
    Reading: {
      sentences: [
        "We put Cup A by a sunny window.",
        "After ten days, the plant in Cup A was tall and green.",
        "Plants need light to grow.",
      ],
      prompt: "Which sentence tells what happened to Cup A?",
      answer: 1,
      why: "What happened is a change you can see after some time.",
    },
    Speaking: {
      frame: "First, we planted two seeds. At the end,",
      options: [
        ["tall", "the plant with light was tall and green.", true],
        ["seed", "we planted two seeds.", false],
        ["cup", "we got two cups.", false],
      ],
      why: "“At the end” tells the last thing that happened.",
    },
    Writing: {
      before: "The plant in Cup A grew tall",
      after: "it had sunlight.",
      options: [
        ["because", "because", true],
        ["but", "but"],
        ["or", "or"],
      ],
      why: "You are telling why. Which word gives a reason?",
    },
  },
};

const state = { station: "", picks: {} };
const en = (text) => html`<span lang="en">${text}</span>`;

function feedbackHTML(I, ok, why) {
  return html`<p class="ll-preview-feedback ${ok ? "is-right" : "is-try"}" role="status">
    ${icon(ok ? "check" : "retry")}
    ${ok ? I.T("Yes. That is the language move this station practices.", "Sí. Ese es el recurso de lenguaje que practica esta estación.") : html`${I.T("Not yet.", "Todavía no.")} ${en(why)}`}
  </p>`;
}

function previewHTML(I, ctx, band, station) {
  const p = PREVIEWS[band][station];
  const picked = state.picks[`${band}:${station}`];
  const btn = (id, text, ok) =>
    html`<button
      type="button"
      class="ll-choice ${picked === id ? (ok ? "is-right" : "is-miss") : ""}"
      data-hero-pick="${id}"
      aria-pressed="${picked === id}"
    >
      <span lang="en">${text}</span>
    </button>`;
  if (station === "Listening") {
    const right = p.options.find((o) => o[0] === picked)?.[2];
    return html`${listenPlayerHTML(`hero-${band}`, p.script, { rate: ctx.prefs.rate || 0.9, label: I.T("Hear the announcement", "Escuchar el anuncio"), i18n: I })}
      <details class="ll-alt">
        <summary>${I.T("Read it instead", "Leerlo en su lugar")}</summary>
        <p lang="en">${p.script[0]}</p>
      </details>
      <p class="ll-preview-q">${en(p.prompt)}</p>
      <div class="ll-choices">${p.options.map(([id, text, ok]) => btn(id, text, ok))}</div>
      ${picked ? feedbackHTML(I, right, p.why) : ""}`;
  }
  if (station === "Reading") {
    return html`<p class="ll-preview-q">${en(p.prompt)}</p>
      <div class="ll-choices is-sentences">
        ${p.sentences.map((s, i) => btn(String(i), s, i === p.answer))}
      </div>
      ${picked != null ? feedbackHTML(I, Number(picked) === p.answer, p.why) : ""}`;
  }
  if (station === "Speaking") {
    const choice = p.options.find((o) => o[0] === picked);
    const said = choice ? `${p.frame} ${choice[1]}` : "";
    return html`<p class="ll-preview-q">
        ${I.T("Finish the sentence, then say it aloud.", "Termina la oración y dila en voz alta.")}
      </p>
      <p class="ll-frame" lang="en">
        ${p.frame} <span class="ll-blank">${choice ? choice[1] : "…"}</span>
      </p>
      <div class="ll-choices">${p.options.map(([id, text, ok]) => btn(id, text, ok))}</div>
      ${choice ? html`${feedbackHTML(I, choice[2], p.why)}${choice[2] && canSpeak() ? html`<button type="button" class="btn small" data-say="${said}">${icon("volume")} ${I.T("Hear a model", "Escuchar un ejemplo")}</button>` : ""}` : ""}`;
  }
  const choice = p.options.find((o) => o[0] === picked);
  return html`<p class="ll-preview-q">
      ${I.T("Choose the word that joins the claim to its reason.", "Elige la palabra que une la afirmación con su razón.")}
    </p>
    <p class="ll-frame ll-ink" lang="en">
      ${p.before} <span class="ll-blank">${choice ? choice[1] : "___"}</span> ${p.after}
    </p>
    <div class="ll-choices is-row">${p.options.map(([id, text, ok]) => btn(id, text, ok))}</div>
    ${choice ? feedbackHTML(I, choice[2], p.why) : ""}`;
}

/** The stage: art, pointer pins, a station picker and the live preview. `suggested` = recommended domain. */
export function heroStageHTML(I, ctx, band, suggested) {
  const station = ORDER.includes(state.station)
    ? state.station
    : ORDER.includes(suggested)
      ? suggested
      : "Listening";
  const meta = STATIONS[station];
  const domainName = {
    Listening: ["Listening", "Escuchar"],
    Reading: ["Reading", "Leer"],
    Speaking: ["Speaking", "Hablar"],
    Writing: ["Writing", "Escribir"],
  };
  return html`<div class="ll-stage" data-station="${station}">
    <figure class="ll-scene">
      <img
        src="${ART}/hall-${band === "3-5" ? "35" : "68"}.svg"
        width="1200"
        height="760"
        alt="${I.S("An exhibition hall with four lit stations: a sound dome for listening, a reading atelier, a speaking stage and a writing desk.", "Una sala de exposición con cuatro estaciones iluminadas: una cúpula de sonido para escuchar, un taller de lectura, un escenario para hablar y una mesa para escribir.")}"
        decoding="async"
        fetchpriority="high"
      />
      ${ORDER.map((d) => html`<button type="button" class="ll-pin d-${d.toLowerCase()} ${d === station ? "is-active" : ""}" style="--x:${STATIONS[d].x}%;--y:${STATIONS[d].y}%" data-hero-station="${d}" tabindex="-1" aria-hidden="true"><span></span></button>`)}
    </figure>
    <div
      class="ll-stations"
      role="group"
      aria-label="${I.S("Choose a station to try", "Elige una estación para probar")}"
    >
      ${ORDER.map((d) => html`<button type="button" class="ll-station d-${d.toLowerCase()}" data-hero-station="${d}" aria-pressed="${d === station}" aria-controls="llPreview">${icon(d.toLowerCase())}<span>${I.T(...domainName[d])}</span></button>`)}
    </div>
    <section
      class="ll-preview d-${station.toLowerCase()}"
      id="llPreview"
      aria-labelledby="llPreviewTitle"
      aria-live="polite"
    >
      <p class="ll-preview-kicker" id="llPreviewTitle">
        ${I.T(`Try one minute · ${meta.en}`, `Prueba un minuto · ${meta.es}`)}
      </p>
      ${previewHTML(I, ctx, band, station)}
    </section>
  </div>`;
}

/** Hero clicks; returns true when handled. */
export function heroClick(e, ctx) {
  const st = e.target.closest?.("[data-hero-station]");
  if (st) {
    state.station = st.dataset.heroStation;
    ctx
      .rerender()
      .then(() =>
        document
          .querySelector(`.ll-station[data-hero-station="${state.station}"]`)
          ?.focus({ preventScroll: true }),
      );
    return true;
  }
  const pick = e.target.closest?.("[data-hero-pick]");
  if (pick) {
    const station = pick.closest(".ll-stage")?.dataset.station;
    state.picks[`${ctx.band}:${station}`] = pick.dataset.heroPick;
    ctx.rerender();
    return true;
  }
  return false;
}

