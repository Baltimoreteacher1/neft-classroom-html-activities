// Connector Climb: join two clauses with the connector that fits their logical relationship (cause,
// result, contrast, sequence, example, addition), then see (Starting) or choose (Growing, Expanding) the
// correctly punctuated sentence. Every third climb orders three sentences into a mini-paragraph by their
// connectors (tap to order). Each finished round adds a hold to the cliff and moves the climber up.
import {
  audioBtn,
  feedbackHTML,
  hintHTML,
  html,
  icon,
  judge,
  newRound,
  pips,
  settled,
  shuffle,
  takeHint,
} from "./engine.js";
import {
  RELS,
  clauseHTML,
  cliffSVG,
  lineHTML,
  punctRule,
  rackHTML,
  relExplain,
} from "./connector-climb-view.js";

const modeOf = (env) => env.sup?.key || env.support || "A";
const bandOf = (env) => env.content?.bands?.[env.band] || env.content || {};
const complete = (r) =>
  r.kind === "order" ? settled(r.rs) : settled(r.rs) && (r.needP === false || settled(r.prs));
const outcome = (r) =>
  !complete(r)
    ? "open"
    : [r.rs, r.prs].some((x) => x && x.status === "revealed")
      ? "revealed"
      : "right";
const wordRe = (w) => new RegExp(`(^|[^a-z])${w.replace(/\s+/g, "\\s+")}([^a-z]|$)`, "i");

function joinRound(row, conns, random) {
  const order = shuffle(
    row.options.map((_, i) => i),
    random,
  );
  const p = shuffle([0, 1, 2], random);
  return {
    kind: "join",
    id: row.id,
    a: row.a,
    b: row.b,
    pos: row.pos,
    conn: row.conn,
    rel: conns[row.conn].rel,
    es: conns[row.conn].es,
    ptype: conns[row.conn].punct,
    opts: order.map((i) => ({
      id: row.options[i],
      rel: conns[row.options[i]].rel,
      es: conns[row.options[i]].es,
    })),
    ans: order.indexOf(row.options.indexOf(row.conn)),
    pick: null,
    rs: newRound(),
    joined: row.punct[0],
    punct: p.map((i) => row.punct[i]),
    pans: p.indexOf(0),
    ppick: null,
    prs: newRound(),
    needP: null,
    guide: false,
  };
}

function orderRound(row, conns, random) {
  let order = shuffle([0, 1, 2], random);
  if (order.every((v, i) => v === i)) order = [order[1], order[2], order[0]];
  const relOf = (c) =>
    conns[c.toLowerCase()]?.rel || (/^(then|after that)$/i.test(c) ? "sequence" : "");
  return {
    kind: "order",
    id: row.id,
    lines: order.map((i) => ({ ...row.lines[i], rel: relOf(row.lines[i].conn) })),
    key: [0, 1, 2].map((k) => order.indexOf(k)),
    placed: [],
    rs: newRound(),
    guide: false,
  };
}

/** Hints for whichever step is open. */
function hintsFor(r, I) {
  if (r.kind === "order")
    return [
      I.T(
        "Find the sentence that starts the topic. It makes sense without a sentence before it.",
        "Busca la oración que empieza el tema. Tiene sentido sin otra oración antes.",
      ),
      I.T(
        "Connectors like Then, For example and As a result point back to the sentence before them.",
        "Conectores como Then, For example y As a result se refieren a la oración anterior.",
      ),
      I.T(
        `The paragraph starts with: “${r.lines[r.key[0]].text}”`,
        `El párrafo empieza con: “${r.lines[r.key[0]].text}”`,
      ),
    ];
  if (!settled(r.rs))
    return [
      I.T(...RELS[r.rel].hint),
      I.T(
        "Read the sentence aloud with each card in the gap. Which one keeps the meaning true?",
        "Lee la oración en voz alta con cada tarjeta en el espacio. ¿Cuál mantiene el significado verdadero?",
      ),
      I.T(
        `These two ideas show ${RELS[r.rel].name[0].toLowerCase()}.`,
        `Estas dos ideas muestran ${RELS[r.rel].name[1].toLowerCase()}.`,
      ),
    ];
  return [
    I.T(
      `Look at what comes right before and right after “${r.conn}”.`,
      `Mira lo que va justo antes y justo después de “${r.conn}”.`,
    ),
    I.T(...punctRule(r.ptype, r.conn)),
  ];
}

function sayIt(r, env) {
  const I = env.I;
  return html`<div class="cc-say">
    <p class="cc-joined">${r.joined}</p>
    <p class="fine">
      ${I.T("Say it: read the joined sentence aloud to yourself or a partner. Nothing is recorded.", "Dilo: lee la oración unida en voz alta para ti o para un compañero. No se graba nada.")}
    </p>
    ${audioBtn(r.joined, I)}
  </div>`;
}

function joinView(r, env) {
  const I = env.I;
  const mode = modeOf(env);
  const grouped = mode === "A" || r.guide;
  const connDone = settled(r.rs);
  const word = r.pick === null ? (connDone ? r.conn : "") : r.opts[r.pick].id;
  const punctOpen = connDone && r.needP && !settled(r.prs);
  const step = !connDone ? r.rs : r.needP ? r.prs : null;
  return html` <p class="cc-step">
      ${connDone ? (punctOpen ? I.T("Step 2: Choose the sentence with correct punctuation.", "Paso 2: Elige la oración con la puntuación correcta.") : I.T("Here is the joined sentence.", "Esta es la oración unida.")) : I.T("Step 1: Which connector shows how these ideas go together?", "Paso 1: ¿Qué conector muestra cómo se relacionan estas ideas?")}
    </p>
    <div class="cc-pair">
      ${clauseHTML(r, word)}${env.sup.audio ? audioBtn(`${r.a}. ${r.b}.`, I, I.S("Listen to the two ideas", "Escuchar las dos ideas")) : ""}
    </div>
    ${rackHTML(r, env, grouped)}
    ${mode === "C" && !grouped && !connDone ? html`<button type="button" class="btn small cc-guide" data-g-guide>${icon("help")}${I.T("Open the connector guide", "Abrir la guía de conectores")}</button>` : ""}
    ${feedbackHTML(r.rs, { I, right: I.T(...relExplain(r.rel, r.conn, r.es)), retry: I.T("That connector changes the meaning. Read both ideas again.", "Ese conector cambia el significado. Lee otra vez las dos ideas."), answer: I.T(`The connector is “${r.conn}”.`, `El conector es “${r.conn}”.`), explain: r.rs.status === "revealed" ? I.T(...relExplain(r.rel, r.conn, r.es)) : "" })}
    ${
      connDone && r.needP
        ? html`<div
              class="gs-choices cc-punct"
              role="group"
              aria-label="${I.S("Punctuated versions", "Versiones con puntuación")}"
            >
              ${r.punct.map((t, i) => html`<button type="button" class="gs-choice cc-punct-c${r.ppick === i ? " is-sel" : ""}${settled(r.prs) && i === r.pans ? " is-right" : ""}${r.prs.picks.includes(i) && i !== r.pans ? " is-miss" : ""}" data-g-punct="${i}" aria-pressed="${r.ppick === i}" ${settled(r.prs) ? "disabled" : ""}>${t}</button>`)}
            </div>
            ${feedbackHTML(r.prs, { I, right: I.T(...punctRule(r.ptype, r.conn)), retry: I.T("Check the comma, semicolon and period around the connector.", "Revisa la coma, el punto y coma y el punto alrededor del conector."), answer: r.joined, explain: r.prs.status === "revealed" ? I.T(...punctRule(r.ptype, r.conn)) : "" })}`
        : ""
    }
    ${connDone && !r.needP ? html`<p class="fine cc-rule">${icon("sparkle")}${I.T(...punctRule(r.ptype, r.conn))}</p>` : ""}
    ${complete(r) ? sayIt(r, env) : ""}
    ${step && !settled(step) ? hintHTML(step, hintsFor(r, I), env) : ""}
    <div class="gs-actions">
      ${!connDone ? html`<button type="button" class="btn btn-primary" data-g-check ${r.pick === null ? "disabled" : ""}>${icon("check")}${I.T("Check connector", "Revisar conector")}</button>` : punctOpen ? html`<button type="button" class="btn btn-primary" data-g-check ${r.ppick === null ? "disabled" : ""}>${icon("check")}${I.T("Check punctuation", "Revisar puntuación")}</button>` : ""}
    </div>`;
}

function orderView(r, env) {
  const I = env.I;
  const grouped = modeOf(env) === "A" || r.guide;
  const locked = settled(r.rs);
  const shown = locked ? r.key : r.placed;
  return html` <p class="cc-step">
      ${I.T("Paragraph ledge: tap the sentences in the order that makes a clear mini-paragraph.", "Repisa del párrafo: toca las oraciones en el orden que forma un minipárrafo claro.")}
    </p>
    <ol class="cc-slots" aria-label="${I.S("Your paragraph", "Tu párrafo")}">
      ${[0, 1, 2].map((k) => html`<li class="cc-slot${shown[k] !== undefined ? " is-filled" : ""}">${shown[k] !== undefined ? (locked ? lineHTML(r.lines[shown[k]], grouped) : html`<button type="button" class="cc-placed" data-g-unplace="${k}" aria-label="${I.S("Remove", "Quitar")}: ${r.lines[shown[k]].text}">${lineHTML(r.lines[shown[k]], grouped)}</button>`) : html`<span class="cc-slot-empty">${I.T(`Sentence ${k + 1}`, `Oración ${k + 1}`)}</span>`}</li>`)}
    </ol>
    ${locked ? "" : html`<div class="cc-bank" role="group" aria-label="${I.S("Sentences to order", "Oraciones para ordenar")}">${r.lines.map((ln, d) => html`<button type="button" class="gs-choice cc-line" data-g-line="${d}" ${r.placed.includes(d) ? "disabled" : ""}>${lineHTML(ln, grouped)}</button>`)}</div>`}
    ${modeOf(env) === "C" && !grouped && !locked ? html`<button type="button" class="btn small cc-guide" data-g-guide>${icon("help")}${I.T("Color the connectors", "Colorear los conectores")}</button>` : ""}
    ${feedbackHTML(r.rs, { I, right: I.T("Each connector links its sentence to the one before it.", "Cada conector une su oración con la anterior."), retry: I.T("The order does not flow yet. Start again and follow the connectors.", "El orden todavía no fluye. Empieza otra vez y sigue los conectores."), answer: r.key.map((d) => r.lines[d].text).join(" "), explain: I.T("Each connector links its sentence to the one before it.", "Cada conector une su oración con la anterior.") })}
    ${locked ? "" : hintHTML(r.rs, hintsFor(r, I), env)}
    ${locked ? "" : html`<div class="gs-actions"><button type="button" class="btn" data-g-clear ${r.placed.length ? "" : "disabled"}>${I.T("Start over", "Empezar de nuevo")}</button><button type="button" class="btn btn-primary" data-g-check ${r.placed.length === 3 ? "" : "disabled"}>${icon("check")}${I.T("Check order", "Revisar orden")}</button></div>`}`;
}

export default {
  id: "connector-climb",

  init(env) {
    const src = bandOf(env);
    const conns = Object.fromEntries((src.connectors || []).map((c) => [c.id, c]));
    const total = env.count(9, 5);
    const joins = shuffle(src.rounds || [], env.rng);
    const paras = shuffle(src.paragraphs || [], env.rng);
    const rounds = [];
    let j = 0;
    let p = 0;
    for (let k = 0; k < total; k += 1) {
      if ((k + 1) % 3 === 0 && paras[p]) rounds.push(orderRound(paras[p++], conns, env.rng));
      else if (joins[j]) rounds.push(joinRound(joins[j++], conns, env.rng));
    }
    return { rounds, i: 0 };
  },

  done: (s) => s.i >= s.rounds.length,
  progress: (s) => ({ done: s.rounds.filter(complete).length, total: s.rounds.length }),

  view(s, env) {
    const I = env.I;
    const r = s.rounds[s.i];
    const states = s.rounds.map(outcome);
    const p = this.progress(s);
    const cliff = cliffSVG(
      states,
      env.band,
      I.S(
        `Cliff: ${p.done} of ${p.total} holds reached`,
        `Acantilado: ${p.done} de ${p.total} agarres alcanzados`,
      ),
    );
    if (!r)
      return html`<section class="cc-wall is-top" data-mechanic="cliff-connectors">
        <div class="cc-cliff">${cliff}</div>
        <div class="cc-work" role="status">
          <h2>${I.T("You reached the top!", "¡Llegaste a la cima!")}</h2>
          <p>
            ${I.T("Every hold is a pair of ideas you joined with a connector.", "Cada agarre es un par de ideas que uniste con un conector.")}
          </p>
        </div>
      </section>`;
    return html`<section class="cc-wall" data-mechanic="cliff-connectors">
      <div class="cc-cliff">${cliff}</div>
      <div class="cc-work">
        <p class="cc-tag">
          ${icon("road")}${I.T(`Hold ${s.i + 1} of ${s.rounds.length}`, `Agarre ${s.i + 1} de ${s.rounds.length}`)}
        </p>
        ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} holds`, `${p.done} de ${p.total} agarres`), I.S)}
        ${r.kind === "order" ? orderView(r, env) : joinView(r, env)}
        ${complete(r) ? html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${s.i + 1 === s.rounds.length ? I.T("Reach the top", "Llegar a la cima") : I.T("Climb to the next hold", "Subir al siguiente agarre")}</button></div>` : ""}
      </div>
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    const r = s.rounds[s.i];
    if (!b || !r) return false;
    const d = b.dataset;
    const skill = "writing";
    if (b.hasAttribute("data-g-next")) {
      if (!complete(r)) return false;
      s.i += 1;
      return true;
    }
    if (b.hasAttribute("data-g-guide") && !r.guide) {
      r.guide = true;
      env.use("connector-guide");
      return true;
    }
    if (r.kind === "order") {
      if (settled(r.rs)) return false;
      if (d.gLine !== undefined) {
        const k = Number(d.gLine);
        if (r.placed.includes(k) || r.placed.length >= 3) return false;
        r.placed.push(k);
        return true;
      }
      if (d.gUnplace !== undefined) return r.placed.splice(Number(d.gUnplace), 1).length > 0;
      if (b.hasAttribute("data-g-clear")) return ((r.placed = []), true);
      if (b.hasAttribute("data-g-hint")) return takeHint(r.rs, env) >= 0;
      if (b.hasAttribute("data-g-check") && r.placed.length === 3) {
        r.rs.picks.push(r.placed.join(""));
        judge(
          r.rs,
          r.placed.every((v, k) => v === r.key[k]),
          env,
          { id: r.id, skill, extra: { kind: "paragraph-order" } },
        );
        if (r.rs.status === "retry") r.placed = [];
        return true;
      }
      return false;
    }
    if (!settled(r.rs)) {
      if (d.gConn !== undefined) return ((r.pick = Number(d.gConn)), true);
      if (b.hasAttribute("data-g-hint")) return takeHint(r.rs, env) >= 0;
      if (b.hasAttribute("data-g-check") && r.pick !== null) {
        if (!r.rs.picks.includes(r.pick)) r.rs.picks.push(r.pick);
        judge(r.rs, r.pick === r.ans, env, {
          id: r.id,
          skill,
          extra: { kind: "connector", rel: r.rel },
        });
        if (settled(r.rs)) {
          r.pick = r.ans;
          r.needP = modeOf(env) !== "A";
        }
        return true;
      }
      return false;
    }
    if (r.needP && !settled(r.prs)) {
      if (d.gPunct !== undefined) return ((r.ppick = Number(d.gPunct)), true);
      if (b.hasAttribute("data-g-hint")) return takeHint(r.prs, env) >= 0;
      if (b.hasAttribute("data-g-check") && r.ppick !== null) {
        if (!r.prs.picks.includes(r.ppick)) r.prs.picks.push(r.ppick);
        judge(r.prs, r.ppick === r.pans, env, {
          id: `${r.id}:punct`,
          skill,
          extra: { kind: "punctuation" },
        });
        if (settled(r.prs)) r.ppick = r.pans;
        return true;
      }
    }
    return false;
  },

  plan(s, { wrong } = {}) {
    const r = s.rounds[s.i];
    if (!r) return [];
    if (complete(r)) return [{ click: "[data-g-next]" }];
    if (r.kind === "order") {
      if (r.placed.length) return [{ click: "[data-g-clear]" }];
      const seq = wrong ? [...r.key].reverse() : r.key;
      return [...seq.map((d) => ({ click: `[data-g-line="${d}"]` })), { click: "[data-g-check]" }];
    }
    if (!settled(r.rs))
      return [
        { click: `[data-g-conn="${wrong ? (r.ans + 1) % r.opts.length : r.ans}"]` },
        { click: "[data-g-check]" },
      ];
    return [
      { click: `[data-g-punct="${wrong ? (r.pans + 1) % 3 : r.pans}"]` },
      { click: "[data-g-check]" },
    ];
  },

  validate(content) {
    const errors = [];
    for (const band of ["3-5", "6-8"]) {
      const src = content.bands?.[band] || {};
      const conns = Object.fromEntries((src.connectors || []).map((c) => [c.id, c]));
      for (const c of src.connectors || []) {
        if (!RELS[c.rel]) errors.push(`${band}/${c.id}: unknown relationship ${c.rel}`);
        if (!c.es) errors.push(`${band}/${c.id}: needs a Spanish gloss`);
        if (!["sub", "coord", "adverb", "starter", "lead"].includes(c.punct))
          errors.push(`${band}/${c.id}: unknown punctuation type`);
      }
      const rows = src.rounds || [];
      if (rows.length < 14) errors.push(`${band}: needs at least 14 connector items`);
      if ((src.paragraphs || []).length < 3) errors.push(`${band}: needs at least 3 paragraphs`);
      const ids = new Set();
      for (const r of rows) {
        if (ids.has(r.id)) errors.push(`${band}/${r.id}: duplicate id`);
        ids.add(r.id);
        if (!r.a || !r.b) errors.push(`${band}/${r.id}: needs two clauses`);
        if (!conns[r.conn] || !r.options?.includes(r.conn))
          errors.push(`${band}/${r.id}: connector must be a known option`);
        if (
          !Array.isArray(r.options) ||
          r.options.length < 3 ||
          new Set(r.options).size !== r.options.length ||
          r.options.some((o) => !conns[o])
        )
          errors.push(`${band}/${r.id}: needs 3+ distinct known connector options`);
        if (r.options?.some((o) => o !== r.conn && conns[o]?.rel === conns[r.conn]?.rel))
          errors.push(`${band}/${r.id}: two options share a relationship`);
        if (!Array.isArray(r.punct) || r.punct.length !== 3 || new Set(r.punct).size !== 3)
          errors.push(`${band}/${r.id}: needs three distinct punctuated versions`);
        else if (!wordRe(r.conn).test(r.punct[0]))
          errors.push(`${band}/${r.id}: the correct version must use the connector`);
        if (!["mid", "start"].includes(r.pos))
          errors.push(`${band}/${r.id}: pos must be mid or start`);
      }
      for (const p of src.paragraphs || []) {
        if (!Array.isArray(p.lines) || p.lines.length !== 3)
          errors.push(`${band}/${p.id}: needs exactly three lines`);
        else if (p.lines.some((l) => !l.text || (l.conn && !l.text.includes(l.conn))))
          errors.push(`${band}/${p.id}: each line needs text that contains its connector`);
        else if (p.lines.filter((l) => l.conn).length < 2)
          errors.push(`${band}/${p.id}: needs at least two connectors`);
      }
    }
    return errors;
  },
};
