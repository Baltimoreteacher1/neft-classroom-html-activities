// Word Connections — build a web. Choose two cards, then name how they connect. Only links that exist in the
// unit's own data are accepted: a word and its meaning, a close-in-meaning word, an opposite, a sentence that
// shows it in use, a word from its family, or a word in the same relation group. A pair that does connect, but
// not in the way you named, gets a near-miss note. No answer is printed on a wrong try.
import { groupOf, groupsFor } from "./data.js";
import { fbHTML, html, icon, mountGame } from "./kit.js";
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
            >${n.kind === "word" ? I.T("Word", "Palabra") : n.kind === "meaning" ? I.T("Meaning", "Significado") : I.T("Sentence", "Oración")}</span
          >
          <span
            >${s.assist === n.id ? icon("star") : on ? icon("check") : linked ? icon("pin") : ""}${n.text}${s.assist === n.id ? html`<span class="vag-sr"> (${I.S("this card still has a link", "esta tarjeta aún tiene un vínculo")})</span>` : ""}${linked ? html`<span class="vag-sr"> (${I.S("already linked", "ya conectada")})</span>` : ""}</span
          >
        </button>
      </li>`;
    };
    const m = s.msg;
    return html`<p class="vag-prompt">
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
                ${LINKS.map((l, k) => html`<button type="button" class="btn vag-linkbtn" data-link="${l.id}" data-n="${k + 1}" data-fk="link-${l.id}"><span class="vag-n" aria-hidden="true">${k + 1}</span>${I.T(l.en, l.es)}</button>`)}
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
                ${s.made.map((l) => html`<li><strong>${txt(l.a)}</strong> ${linkText(I, l.type)} <strong>${txt(l.b)}</strong></li>`)}
              </ul>
            </section>`
          : ""
      }`;
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
