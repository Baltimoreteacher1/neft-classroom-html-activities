// Word Connections — build a web. Choose two cards, then name how they connect. Only links that exist in the
// unit's own data are accepted: a word and its meaning, a close-in-meaning word, an opposite, a sentence that
// shows it in use, a word from its family, or a word in the same relation group. A pair that does connect, but
// not in the way you named, gets a near-miss note. No answer is printed on a wrong try.
import { groupOf, groupsFor } from "./data.js";
import { fbHTML, html, icon, mountGame, raw } from "./kit.js";
import { clean, maskForm, norm } from "./text.js";

export const TITLE = ["Word Connections", "Conexiones entre palabras"];
export const LINKS = [
  { id: "means", dim: "mean", en: "means", es: "significa" },
  {
    id: "similar",
    dim: "mean",
    en: "is close in meaning to",
    es: "tiene un significado parecido a",
  },
  { id: "opposite", dim: "mean", en: "is the opposite of", es: "es lo opuesto de" },
  { id: "use", dim: "ctx", en: "is shown in use by", es: "se muestra en uso en" },
  {
    id: "family",
    dim: "morph",
    en: "is in the same word family as",
    es: "es de la misma familia que",
  },
  {
    id: "group",
    dim: "mean",
    en: "belongs in the same group as",
    es: "pertenece al mismo grupo que",
  },
];
const NEED = { early: 4, "upper-elem": 5, middle: 6, high: 6 };
const ANCHORS = { early: 3, "upper-elem": 4, middle: 4, high: 4 };

/** Pure engine: cards (nodes) and the set of real links between them. */
export function buildWeb(pool, rng, { anchors, need } = {}) {
  const chosen = rng.shuffle(pool.words).slice(0, anchors || ANCHORS[pool.band] || 4);
  const nodes = [];
  const valid = [];
  const texts = new Set();
  const add = (node) => {
    const key = norm(node.text);
    if (!key || texts.has(key)) return null;
    texts.add(key);
    nodes.push(node);
    return node;
  };
  for (const w of chosen) add({ id: `w:${w.id}`, owner: w.id, kind: "word", text: w.hw });
  for (const w of chosen) {
    const anchor = `w:${w.id}`;
    const opts = [];
    const ex = w.ex ? maskForm(w.ex, w) : null;
    if (ex?.found) opts.push({ id: `e:${w.id}`, kind: "sentence", text: ex.text, type: "use" });
    if (w.syn?.[0])
      opts.push({ id: `s:${w.id}`, kind: "word", text: clean(w.syn[0]), type: "similar" });
    if (w.ant?.[0])
      opts.push({ id: `a:${w.id}`, kind: "word", text: clean(w.ant[0]), type: "opposite" });
    const fam = (w.family || []).find((f) => norm(f.w) !== norm(w.hw));
    if (fam) opts.push({ id: `f:${w.id}`, kind: "word", text: clean(fam.w), type: "family" });
    const def = add({ id: `d:${w.id}`, owner: w.id, kind: "meaning", text: clean(w.def) });
    if (def) valid.push({ a: anchor, b: def.id, type: "means", owner: w.id });
    for (const o of rng.shuffle(opts).slice(0, 2)) {
      const n = add({ id: o.id, owner: w.id, kind: o.kind, text: o.text });
      if (n) valid.push({ a: anchor, b: n.id, type: o.type, owner: w.id });
    }
  }
  const groups = groupsFor(pool);
  for (let i = 0; i < chosen.length; i++)
    for (let j = i + 1; j < chosen.length; j++) {
      const g = groupOf(groups, chosen[i].id);
      if (g && g.ids.includes(chosen[j].id))
        valid.push({
          a: `w:${chosen[i].id}`,
          b: `w:${chosen[j].id}`,
          type: "group",
          owner: chosen[i].id,
          label: g.label,
        });
    }
  const want = Math.min(need || NEED[pool.band] || 5, valid.length);
  return { nodes: rng.shuffle(nodes), valid, need: want };
}

const samePair = (l, a, b) => (l.a === a && l.b === b) || (l.a === b && l.b === a);
/** Judge a named link between two cards. Pure. kind: ok | again | wrongType | none */
export function judgeLink(web, made, a, b, type) {
  const hit = web.valid.find((l) => samePair(l, a, b));
  if (hit && hit.type === type) {
    if (made.some((m) => samePair(m, a, b))) return { kind: "again", link: hit };
    return { kind: "ok", link: hit };
  }
  if (hit) return { kind: "wrongType", link: hit };
  const touches = web.valid.some(
    (l) => l.type === type && (l.a === a || l.b === a || l.a === b || l.b === b),
  );
  return { kind: touches ? "near" : "none" };
}
const linkText = (I, id) => {
  const l = LINKS.find((x) => x.id === id);
  return I.T(l.en, l.es);
};
export const nodeById = (web, id) => web.nodes.find((n) => n.id === id);

// ── the web drawing (view layer only; decoration for the cards and the "Your web" list, which carry every word) ──────────
/** How each kind of link is drawn: a stroke pattern (in path-length units) AND a marker shape, so it never relies on colour. */
export const LINK_SHAPES = {
  means: { shape: "circle", dash: "", width: 3 },
  similar: { shape: "square", dash: "9 5", width: 3 },
  opposite: { shape: "diamond", dash: "9 3 1.5 3", width: 3 },
  use: { shape: "triangle", dash: "0.1 4.6", width: 3.6 },
  family: { shape: "star", dash: "0.1 2.6", width: 5 },
  group: { shape: "hexagon", dash: "3 2.6", width: 3 },
};
const star = (r1 = 7, r2 = 3) =>
  `M${Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? r2 : r1;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  }).join("L")}Z`;
export const MARKER_PATH = {
  circle: "M-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0Z",
  square: "M-4.5-4.5h9v9h-9Z",
  diamond: "M0-6.5L6.5 0 0 6.5-6.5 0Z",
  triangle: "M0-6.5L6.5 5H-6.5Z",
  star: star(),
  hexagon: "M-3.2-5.5h6.4L6.5 0 3.2 5.5h-6.4L-6.5 0Z",
};
const W = 340;
const H = 300;
/** Positions for every card: each anchor word on an inner ring, the cards that belong to it fanned out on an outer ring. Pure. */
export function webLayout(nodes) {
  const anchors = nodes.filter((n) => n.id.startsWith("w:"));
  const pos = {};
  const m = Math.max(1, anchors.length);
  anchors.forEach((a, i) => {
    const th = (2 * Math.PI * i) / m - Math.PI / 2;
    pos[a.id] = [W / 2 + 58 * Math.cos(th), H / 2 + 50 * Math.sin(th)];
    const kids = nodes.filter((n) => n.owner === a.owner && n.id !== a.id);
    const span = Math.min((2 * Math.PI) / m, 0.5 * kids.length + 0.4);
    kids.forEach((k, j) => {
      const t2 = th + (kids.length === 1 ? 0 : (j / (kids.length - 1) - 0.5) * span);
      pos[k.id] = [W / 2 + 142 * Math.cos(t2), H / 2 + 118 * Math.sin(t2)];
    });
  });
  for (const n of nodes) if (!pos[n.id]) pos[n.id] = [W / 2, H / 2];
  return pos;
}
/** A curved edge between two points (bowed toward the centre) and the point halfway along it. Pure. */
export function edgeGeometry(a, b) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const cx = mx + (W / 2 - mx) * 0.3;
  const cy = my + (H / 2 - my) * 0.3;
  return {
    d: `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`,
    mid: [0.25 * a[0] + 0.5 * cx + 0.25 * b[0], 0.25 * a[1] + 0.5 * cy + 0.25 * b[1]],
  };
}
const nodeShape = (n) =>
  n.id.startsWith("w:")
    ? { tag: "circle", attrs: 'r="17"' }
    : n.kind === "meaning"
      ? { tag: "rect", attrs: 'x="-13" y="-13" width="26" height="26" rx="6"' }
      : n.kind === "sentence"
        ? { tag: "path", attrs: 'd="M0-16L16 0 0 16-16 0Z"' }
        : { tag: "circle", attrs: 'r="12"' };

/** The web as an inline SVG (aria-hidden: the list below it says the same in words). `fresh` is the edge to draw in. */
export function webSVG(s, env, { fresh = -1 } = {}) {
  const pos = webLayout(s.nodes);
  const linked = new Set(s.made.flatMap((m) => [m.a, m.b]));
  const masks = [];
  const edges = s.made.map((l, k) => {
    const g = edgeGeometry(pos[l.a], pos[l.b]);
    const spec2 = LINK_SHAPES[l.type];
    const id = `${env.uid}-m${k}`;
    const isNew = k === fresh;
    masks.push(
      `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><path d="${g.d}" pathLength="100" class="va-mask-stroke${isNew ? " is-new" : ""}" fill="none" stroke="#fff" stroke-width="9"/></mask>`,
    );
    return `<g class="va-edge-g${isNew ? " is-new" : ""}" data-type="${l.type}"><path class="va-web-edge" data-shape="${spec2.shape}" data-type="${l.type}" d="${g.d}" pathLength="100" fill="none" stroke-width="${spec2.width}" stroke-linecap="round"${spec2.dash ? ` stroke-dasharray="${spec2.dash}"` : ""} mask="url(#${id})"/><path class="va-marker" d="${MARKER_PATH[spec2.shape]}" transform="translate(${g.mid[0].toFixed(1)} ${g.mid[1].toFixed(1)})"/></g>`;
  });
  const nodes = s.nodes.map((n, i) => {
    const [x, y] = pos[n.id];
    const sh = nodeShape(n);
    const on = s.sel.includes(n.id);
    return `<g class="va-node" data-kind="${n.kind}" data-anchor="${n.id.startsWith("w:")}" data-sel="${on}" data-linked="${linked.has(n.id)}" data-assist="${s.assist === n.id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><${sh.tag} class="va-node-ring" ${sh.attrs}/><${sh.tag} class="va-node-body" ${sh.attrs}/><text class="va-node-n" y="5" text-anchor="middle">${i + 1}</text></g>`;
  });
  return `<svg class="va-web-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><defs>${masks.join("")}</defs>${edges.join("")}${nodes.join("")}</svg>`;
}
/** A tiny sample of one link style (used in the legend and the list), so the style can be matched by shape and pattern. */
export function linkSample(type) {
  const sp = LINK_SHAPES[type];
  return `<svg class="va-sample" data-type="${type}" viewBox="0 0 56 16" width="56" height="16" aria-hidden="true" focusable="false"><path class="va-sample-line" d="M2 8H38" pathLength="100" fill="none" stroke-width="${sp.width}" stroke-linecap="round"${sp.dash ? ` stroke-dasharray="${sp.dash}"` : ""}/><path class="va-marker" d="${MARKER_PATH[sp.shape]}" transform="translate(47 8)"/></svg>`;
}

const spec = {
  id: "word-connections",
  title: TITLE,
  howTo: [
    [
      "Choose two cards that you think are connected.",
      "Elige dos tarjetas que creas que están conectadas.",
    ],
    [
      "Then choose how they connect, such as “means” or “is the opposite of”.",
      "Luego elige cómo se conectan, como “significa” o “es lo opuesto de”.",
    ],
    [
      "Real links join up in your web below. A near miss tells you the cards do connect another way. Retry as often as you like.",
      "Los vínculos reales se suman a tu red. Un casi acierto te dice que las tarjetas sí se conectan de otra forma. Reintenta las veces que quieras.",
    ],
    [
      "Stuck? Choose Show me a card. A star marks a card that still has a link.",
      "¿Atascado? Elige Muéstrame una tarjeta. Una estrella marca una tarjeta con un vínculo pendiente.",
    ],
  ],
  keys: [
    ["Arrow keys", ["move between cards", "moverse entre tarjetas"]],
    ["Enter or Space", ["pick or unpick a card", "elegir o quitar una tarjeta"]],
    [
      "1 to 6",
      ["name the link once two cards are picked", "nombrar el vínculo cuando hay dos tarjetas"],
    ],
  ],

  build(env) {
    const web = buildWeb(env.pool, env.rng);
    return { ...web, made: [], sel: [], msg: null, assist: "", tries: 0 };
  },
  valid: (s) => Array.isArray(s?.nodes) && s.nodes.length > 2,
  unplayable: (s) => s.valid.length < 3,
  isDone: (s) => s.made.length >= s.need,
  progress: (s) => ({ done: s.made.length, total: s.need }),

  view(s, env) {
    const I = env.I;
    const txt = (id) => nodeById(s, id)?.text || "";
    const two = s.sel.length === 2;
    const nodeBtn = (n, k) => {
      const on = s.sel.includes(n.id);
      const linked = s.made.some((m) => m.a === n.id || m.b === n.id);
      return html`<li>
        <button
          type="button"
          class="vag-node-card"
          data-kind="${n.kind}"
          data-node="${n.id}"
          data-fk="node-${n.id}"
          data-rv
          ${k === 0 ? "data-rv-cur" : ""}
          aria-pressed="${on}"
        >
          <span class="vag-node-tag"
            ><span class="va-nodenum" aria-hidden="true">${s.nodes.indexOf(n) + 1}</span>${n.kind === "word" ? I.T("Word", "Palabra") : n.kind === "meaning" ? I.T("Meaning", "Significado") : I.T("Sentence", "Oración")}</span
          >
          <span
            >${s.assist === n.id ? icon("star") : on ? icon("check") : linked ? icon("pin") : ""}${n.text}${s.assist === n.id ? html`<span class="vag-sr"> (${I.S("this card still has a link", "esta tarjeta aún tiene un vínculo")})</span>` : ""}${linked ? html`<span class="vag-sr"> (${I.S("already linked", "ya conectada")})</span>` : ""}</span
          >
        </button>
      </li>`;
    };
    const m = s.msg;
    const fresh = env.fresh ?? -1;
    env.fresh = undefined;
    return html`<div class="va-conn">
      <div class="va-conn-map">
        <div class="va-web-card" data-made="${s.made.length}">
          ${raw(webSVG(s, env, { fresh }))}
          <p class="va-web-cap">${icon("worlds")}${I.T(`${s.made.length} of ${s.need} links drawn`, `${s.made.length} de ${s.need} vínculos dibujados`)}</p>
        </div>
        <ul class="va-legend" aria-label="${I.S("How each link is drawn", "Cómo se dibuja cada vínculo")}">
          ${LINKS.map((l) => html`<li>${raw(linkSample(l.id))}<span>${I.T(l.en, l.es)}</span></li>`)}
        </ul>
      </div>
      <div class="va-conn-play">
      <p class="vag-prompt">
        ${I.T(`Make ${s.need} real links. You have made ${s.made.length}.`, `Haz ${s.need} vínculos reales. Llevas ${s.made.length}.`)}
      </p>
      <ul class="vag-nodes" data-rove data-cols="0" aria-label="${I.S("Cards", "Tarjetas")}">
        ${s.nodes.map(nodeBtn)}
      </ul>
      ${
        two
          ? html`<div
              class="vag-linkbox"
              role="group"
              aria-label="${I.S("How are they connected?", "¿Cómo se conectan?")}"
            >
              <p class="vag-q">
                <strong>${txt(s.sel[0])}</strong> … <strong>${txt(s.sel[1])}</strong>
              </p>
              <p>
                ${I.T("How are these two cards connected?", "¿Cómo se conectan estas dos tarjetas?")}
              </p>
              <div class="vag-linkbtns">
                ${LINKS.map((l, k) => html`<button type="button" class="btn vag-linkbtn" data-link="${l.id}" data-n="${k + 1}" data-fk="link-${l.id}"><span class="vag-n" aria-hidden="true">${k + 1}</span>${raw(linkSample(l.id))}${I.T(l.en, l.es)}</button>`)}
              </div>
            </div>`
          : html`<p class="vag-fine">
              ${s.sel.length === 1 ? I.T("Choose one more card.", "Elige una tarjeta más.") : I.T("Choose two cards.", "Elige dos tarjetas.")}
            </p>`
      }
      <div class="vag-actions">
        <button type="button" class="btn small" data-assist data-fk="assist">
          ${icon("bulb")}${I.T("Show me a card", "Muéstrame una tarjeta")}
        </button>
        ${s.sel.length ? html`<button type="button" class="btn small" data-clear data-fk="clear">${I.T("Clear my picks", "Borrar mis elecciones")}</button>` : ""}
      </div>
      ${m ? fbHTML(m.kind, m.text, I) : ""}
      ${
        s.made.length
          ? html`<section class="vag-web">
              <h3>${icon("worlds")}${I.T("Your web", "Tu red")}</h3>
              <ul>
                ${s.made.map((l) => html`<li><strong>${txt(l.a)}</strong> ${raw(linkSample(l.type))}${linkText(I, l.type)} <strong>${txt(l.b)}</strong></li>`)}
              </ul>
            </section>`
          : ""
      }
      </div>
    </div>`;
  },

  click(el, s, env) {
    const node = el.closest("[data-node]");
    if (node) {
      const id = node.dataset.node;
      s.msg = null;
      s.assist = s.assist === id ? "" : s.assist;
      if (s.sel.includes(id)) s.sel = s.sel.filter((x) => x !== id);
      else s.sel = s.sel.length >= 2 ? [s.sel[1], id] : [...s.sel, id];
      return true;
    }
    if (el.closest("[data-clear]")) {
      s.sel = [];
      s.msg = null;
      return true;
    }
    if (el.closest("[data-assist]")) {
      const open = s.valid.find((l) => !s.made.some((m) => samePair(m, l.a, l.b)));
      if (!open) return false;
      s.assist = open.a;
      env.use("model");
      s.msg = {
        kind: "hint",
        text: "A star marks a card that still has a link. Find what it connects to.",
      };
      return true;
    }
    const link = el.closest("[data-link]");
    if (link && s.sel.length === 2) {
      const [a, b] = s.sel;
      const j = judgeLink(s, s.made, a, b, link.dataset.link);
      const owner = j.link?.owner || nodeById(s, a)?.owner || nodeById(s, b)?.owner;
      const meta = LINKS.find((l) => l.id === link.dataset.link);
      const first = s.tries === 0;
      s.tries += 1;
      if (j.kind === "again") {
        s.msg = { kind: "info", text: "You already made that link. Try a different pair." };
        return true;
      }
      if (j.kind === "ok") {
        s.made.push({ a, b, type: link.dataset.link });
        env.fresh = s.made.length - 1;
        s.msg = {
          kind: "ok",
          text:
            j.link.type === "group" && j.link.label
              ? `Yes. Both fit “${j.link.label}”.`
              : "Yes. Those two really are connected that way.",
        };
        s.sel = [];
        s.assist = "";
        env.report({
          wordId: owner,
          dim: meta.dim,
          ok: true,
          firstTry: first,
          kind: link.dataset.link,
        });
        env.say(env.I.S("Link made.", "Vínculo creado."));
        return true;
      }
      s.msg =
        j.kind === "wrongType"
          ? {
              kind: "retry",
              text: "Close. Those two cards do connect, but not in that way. Think again about how they go together.",
            }
          : j.kind === "near"
            ? {
                kind: "retry",
                text: "Not quite. One of those cards does connect that way, but not to the other one.",
              }
            : {
                kind: "retry",
                text: "Those two cards are not connected in this lesson. Try a different pair.",
              };
      env.report({
        wordId: owner,
        dim: meta.dim,
        ok: false,
        firstTry: false,
        kind: link.dataset.link,
      });
      env.say(env.I.S("Not a link. Try again.", "No es un vínculo. Prueba otra vez."));
      return true;
    }
    return false;
  },
  extra: (s) => ({ links: s.made.length }),
  finishExtra: (s, env) => html`<section class="va-web-final">
    <h3>${icon("worlds")}${env.I.T("Your finished web", "Tu red terminada")}</h3>
    <div class="va-web-card">${raw(webSVG(s, env))}</div>
    <ul class="vag-web-list">
      ${s.made.map((l) => html`<li><strong>${nodeById(s, l.a)?.text}</strong> ${raw(linkSample(l.type))}${linkText(env.I, l.type)} <strong>${nodeById(s, l.b)?.text}</strong></li>`)}
    </ul>
  </section>`,
};

export default {
  id: "word-connections",
  title: TITLE[0],
  titleEs: TITLE[1],
  blurb: "Pick two cards and name the link: meaning, same idea, opposite, use, family, or group.",
  blurbEs:
    "Elige dos tarjetas y nombra el vínculo: significado, idea parecida, opuesto, uso, familia o grupo.",
  purpose: "See how a word connects to its meaning, its neighbors and its uses.",
  minGrade: "K",
  maxGrade: "12",
  dims: ["mean", "ctx", "morph"],
  mount: (root, opts) => mountGame(root, opts, spec),
  engine: { build: buildWeb, judge: judgeLink, links: LINKS },
};
