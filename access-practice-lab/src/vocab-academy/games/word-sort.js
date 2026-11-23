// Word Sort Challenge — sort word cards into meaningful groups taken from the unit's relations
// (groups, or the words' own `rel` labels; for a multiple-meaning word, its senses), then pick the sentence
// that justifies the sort, then (when the unit has a shade ladder) put the middle of the ladder in order.
// Select-and-place works by keyboard and tap (number keys place the selected card); dragging is optional.
import { choiceCount, groupsFor, sensesOf } from "./data.js";
import {
  choicesHTML,
  fbHTML,
  hintButton,
  html,
  icon,
  mcAct,
  mcFeedback,
  mountGame,
} from "./kit.js";
import { newMc } from "./questions.js";
import { norm, uniq } from "./text.js";
import { glide, mem, motionOK, playOnce, rectOf } from "./stage-a.js";

export const TITLE = ["Word Sort Challenge", "Reto de clasificar palabras"];
const LETTERS = ["A", "B", "C"];

/** Surface "reasons" that are false for this set (so they work as wrong choices). */
function falseSurface(words) {
  const out = [];
  const first = new Set(words.map((w) => norm(w.hw)[0]));
  const lens = new Set(words.map((w) => w.hw.length));
  if (first.size > 1) out.push("They all begin with the same letter.");
  if (lens.size > 1) out.push("They all have the same number of letters.");
  out.push("They all name something you can hold in your hand.");
  return out;
}

export function buildSort(pool, rng) {
  const max = pool.band === "early" ? { cats: 2, cards: 6, per: 3 } : { cats: 3, cards: 8, per: 4 };
  let groups = groupsFor(pool).filter((g) => g.ids.length >= 2);
  let mode = "groups";
  let cats = [];
  let cards = [];
  if (groups.length >= 2) {
    groups = rng.shuffle(groups).slice(0, max.cats);
    let budget = max.cards;
    cats = groups.map((g) => {
      const ids = rng.shuffle(g.ids).slice(0, max.per);
      const anchorId = ids[0];
      budget -= ids.length - 1;
      return { label: g.label, ids, anchor: anchorId };
    });
    cats.forEach((c, ci) => {
      c.ids.slice(1).forEach((id) => {
        const w = pool.byId.get(id);
        cards.push({ id, label: w.hw, cat: ci, wordId: id });
      });
    });
    cards = rng.shuffle(cards).slice(0, max.cards);
  } else {
    const multi = pool.words.find((w) => (w.senses || []).some((s) => s.def && s.example));
    if (multi) {
      mode = "senses";
      const senses = sensesOf(multi).slice(0, 3);
      cats = senses.map((s) => ({ label: s.def, ids: [multi.id], anchor: null }));
      senses.forEach((s, ci) => {
        const lines = ci === 0 ? [multi.ex, multi.ex2] : [s.example];
        lines
          .filter(Boolean)
          .forEach((text, k) =>
            cards.push({ id: `s${ci}-${k}`, label: text, cat: ci, wordId: multi.id }),
          );
      });
      cards = rng.shuffle(cards);
    } else mode = null;
  }
  const reasons = [];
  if (mode === "groups") {
    cats.forEach((c, ci) => {
      const words = c.ids.map((id) => pool.byId.get(id));
      const right = `They belong together because they are all about “${c.label}”.`;
      const wrong = [
        ...cats
          .filter((_, k) => k !== ci)
          .map((o) => `They belong together because they are all about “${o.label}”.`),
        ...falseSurface(words),
      ].slice(0, choiceCount(pool) - 1);
      const all = rng.shuffle([right, ...wrong]);
      reasons.push({
        id: `reason-${ci}`,
        type: "sort-reason",
        wordId: c.anchor,
        dim: "mean",
        stem: `Group ${LETTERS[ci]} has ${words.map((w) => w.hw).join(", ")}. Which sentence tells why they belong together?`,
        choices: all,
        answer: all.indexOf(right),
        hint: "Say what each word in the group means. What do those meanings share?",
        why: `Yes. ${words.map((w) => w.hw).join(", ")} all fit “${c.label}”.`,
      });
    });
  }
  let shade = null;
  const ladders = (pool.relations.shades || []).filter((s) => (s.ladder || []).length >= 3);
  if (ladders.length) {
    const L = rng.pick(ladders);
    const mid = L.ladder.slice(1, -1);
    shade = {
      label: L.label,
      ladder: L.ladder,
      pool: rng.shuffle(mid),
      order: [],
      tries: 0,
      done: false,
      right: [],
    };
  }
  return { mode, cats, cards, reasons, shade };
}

/** Place a card in a group. Returns { ok, first } and mutates the state. */
export function placeCard(s, cardId, ci) {
  const card = s.cards.find((c) => c.id === cardId);
  if (!card || s.placed[cardId] != null) return null;
  s.tries[cardId] = (s.tries[cardId] || 0) + 1;
  const ok = card.cat === ci;
  if (ok) s.placed[cardId] = ci;
  return { ok, first: ok && s.tries[cardId] === 1, card };
}
/** Check the ladder middle. Right slots lock; wrong ones return to the tray. No answer is shown. */
export function checkShade(shade) {
  const want = shade.ladder.slice(1, -1);
  shade.tries += 1;
  const flags = shade.order.map((x, i) => x === want[i]);
  shade.right = flags;
  if (flags.every(Boolean) && shade.order.length === want.length) shade.done = true;
  return flags;
}

const cardsLeft = (s) => s.cards.filter((c) => s.placed[c.id] == null);

const spec = {
  id: "word-sort",
  title: TITLE,
  howTo: [
    [
      "Each group starts with one word. Choose a card, then choose the group it belongs with. You can also drag it.",
      "Cada grupo empieza con una palabra. Elige una carta y luego su grupo. También puedes arrastrarla.",
    ],
    [
      "If a card does not belong, it stays in the tray. Try another group. Use Hint to see what the word means.",
      "Si no pertenece, se queda en la bandeja. Prueba otro grupo. Usa Pista para ver el significado.",
    ],
    [
      "When every card is placed, choose the sentence that explains why each group belongs together.",
      "Cuando termines, elige la oración que explica cada grupo.",
    ],
    [
      "If the lesson has a ladder of shades, put the middle words in order.",
      "Si hay una escalera de matices, ordena las palabras del medio.",
    ],
  ],
  keys: [
    ["Arrow keys", ["move between cards", "moverse entre cartas"]],
    [
      "Enter",
      ["select a card or place it in the group you are on", "elegir una carta o colocarla"],
    ],
    ["1 to 3", ["place the selected card in that group", "colocar la carta en ese grupo"]],
  ],

  build(env) {
    const b = buildSort(env.pool, env.rng);
    const phase = b.cards.length ? "sort" : b.shade ? "shade" : "done";
    return {
      ...b,
      placed: {},
      tries: {},
      sel: "",
      hintFor: "",
      last: null,
      phase,
      rs: b.reasons.map(() => newMc()),
      ri: 0,
    };
  },
  unplayable: (s) => !s.mode && !s.shade,
  isDone: (s) => s.phase === "done",
  progress(s) {
    const sorted = Object.keys(s.placed).length;
    const reasonsDone = s.rs.filter((m) => m.done).length;
    return {
      done: sorted + reasonsDone + (s.shade?.done ? 1 : 0),
      total: s.cards.length + s.reasons.length + (s.shade ? 1 : 0),
    };
  },

  view(s, env) {
    const I = env.I;
    if (s.phase === "reason") return reasonView(s, env);
    if (s.phase === "shade") return shadeView(s, env);
    const showLabels =
      env.band === "early" || env.band === "upper-elem" || env.sup.organizer || s.mode === "senses";
    const left = cardsLeft(s);
    const sel = s.cards.find((c) => c.id === s.sel);
    const hintWord = s.hintFor
      ? env.pool.byId.get(s.cards.find((c) => c.id === s.hintFor)?.wordId)
      : null;
    const bin = (c, ci) => {
      const placed = s.cards.filter((x) => s.placed[x.id] === ci);
      const anchor = c.anchor ? env.pool.byId.get(c.anchor) : null;
      const title = showLabels ? c.label : `${I.S("Group", "Grupo")} ${LETTERS[ci]}`;
      return html`<div class="vag-bin" data-bin="${ci}" data-open="${sel ? "true" : "false"}" data-count="${placed.length}">
        <span class="vga-lid" aria-hidden="true"></span>
        <h3 class="vag-bin-h"><span class="vga-label">${title}</span></h3>
        ${anchor ? html`<p class="vag-bin-anchor">${icon("pin")}<span class="vag-chip-w">${anchor.hw}</span></p>` : ""}
        <ul class="vag-bin-list">
          ${placed.map((x) => html`<li data-placed="${x.id}"><span class="vag-chip-w">${icon("check")}${x.label}</span></li>`)}
        </ul>
        <button
          type="button"
          class="btn small vag-place"
          data-place="${ci}"
          data-n="${ci + 1}"
          data-fk="bin-${ci}"
          aria-label="${I.S("Place the selected card in", "Colocar la carta elegida en")} ${title}${anchor ? ` (${I.S("starts with", "empieza con")} ${anchor.hw})` : ""}"
          ${sel ? "" : 'aria-disabled="true"'}
        >
          ${icon("arrow-right")}${I.T("Place here", "Colocar aquí")}
          <span class="vag-n" aria-hidden="true">${ci + 1}</span>
        </button>
      </div>`;
    };
    const last = s.last;
    const lastWord = last ? env.pool.byId.get(last.wordId) : null;
    return html`<p class="vag-prompt">
        ${s.mode === "senses" ? I.T("Sort each sentence by the meaning it shows.", "Clasifica cada oración según el significado.") : I.T("Sort each card into the group where its meaning belongs.", "Clasifica cada carta en el grupo donde encaja su significado.")}
      </p>
      <div class="vag-sort">
        <ul
          class="vag-tray"
          data-rove
          aria-label="${I.S("Cards to sort", "Cartas para clasificar")}"
        >
          ${left.map((c, i) => html`<li><button type="button" class="vag-sortcard ${s.sel === c.id ? "is-sel" : ""}" data-card="${c.id}" data-fk="card-${c.id}" data-rv ${i === 0 ? "data-rv-cur" : ""} draggable="true" aria-pressed="${s.sel === c.id}">${s.sel === c.id ? icon("check") : ""}${c.label}${env.sup.audio && s.mode === "groups" ? "" : ""}</button></li>`)}
        </ul>
        <div class="vag-bins">${s.cats.map(bin)}</div>
      </div>
      <div class="vag-actions">
        ${hintButtonSort(s, env)}${left.length === 0 ? html`<button type="button" class="btn btn-primary" data-sort-next data-fk="next" data-autofocus>${I.T("Next", "Siguiente")}${icon("arrow-right")}</button>` : ""}
      </div>
      ${s.hintFor && hintWord ? fbHTML("hint", html`“${hintWord.hw}” means: ${hintWord.def}`, I) : ""}
      ${last ? (last.ok ? fbHTML("ok", I.S(`“${lastWord.hw}” belongs there. ${lastWord.def}`, `“${lastWord.hw}” va ahí. ${lastWord.def}`), I) : fbHTML("retry", I.T("That card does not belong in that group. Think about what the word means, then try another group.", "Esa carta no va en ese grupo. Piensa en el significado y prueba otro grupo."), I)) : ""}
      ${left.length === 0 ? fbHTML("ok", I.T("Every card is placed.", "Todas las cartas están colocadas."), I) : ""}`;

    function hintButtonSort(st, e) {
      return html`<button type="button" class="btn small vag-hint" data-sort-hint data-fk="hint">
        ${icon("bulb")}${e.I.T("Hint", "Pista")}
      </button>`;
    }
  },

  click(el, s, env) {
    if (s.phase === "reason") return reasonClick(el, s, env);
    if (s.phase === "shade") return shadeClick(el, s, env);
    if (el.closest("[data-sort-next]")) {
      s.phase = s.reasons.length ? "reason" : s.shade ? "shade" : "done";
      return true;
    }
    if (el.closest("[data-sort-hint]")) {
      if (!s.sel) {
        env.say(
          env.I.S(
            "Choose a card first, then ask for a hint.",
            "Elige una carta y luego pide una pista.",
          ),
        );
        return false;
      }
      s.hintFor = s.sel;
      env.use("model");
      return true;
    }
    const card = el.closest("[data-card]");
    if (card) {
      s.sel = s.sel === card.dataset.card ? "" : card.dataset.card;
      s.hintFor = "";
      s.last = null;
      env.say(
        s.sel
          ? env.I.S("Card selected. Choose a group.", "Carta elegida. Elige un grupo.")
          : env.I.S("Card unselected.", "Carta sin elegir."),
      );
      return true;
    }
    const pl = el.closest("[data-place]");
    if (pl) {
      if (!s.sel) {
        env.say(env.I.S("Choose a card first.", "Elige una carta primero."));
        return false;
      }
      grab(env, s.sel);
      return doPlace(s, env, s.sel, Number(pl.dataset.place));
    }
    return false;
  },
  after(body, s, env) {
    if (s.phase !== "sort") return;
    flight(body, s, env);
    for (const c of body.querySelectorAll("[data-card]"))
      c.addEventListener("dragstart", (e) => e.dataTransfer?.setData("text/plain", c.dataset.card));
    for (const b of body.querySelectorAll("[data-bin]")) {
      b.addEventListener("dragover", (e) => e.preventDefault());
      b.addEventListener("drop", (e) => {
        e.preventDefault();
        const id = e.dataTransfer?.getData("text/plain");
        if (id && s.cards.some((x) => x.id === id)) {
          grab(env, id);
          env.act(doPlace(s, env, id, Number(b.dataset.bin)));
        }
      });
    }
  },
  extra(s) {
    return { sorted: Object.keys(s.placed).length, mode: s.mode };
  },
};

/** Remember where a card is before it is placed, so the move can be drawn. Decoration only. */
function grab(env, cardId) {
  const root = document.querySelector(".vag[data-game='word-sort']");
  const el = root?.querySelector(`[data-card="${CSS.escape(cardId)}"]`);
  mem(env).flight = { id: cardId, from: rectOf(el), text: el?.textContent?.trim() || "" };
}

/** Draw the last placement: a right card glides into its bin and settles; a wrong one goes part way and snaps back. */
function flight(body, s, env) {
  const m = mem(env);
  const f = m.flight;
  m.flight = null;
  if (!f || !f.from || !motionOK()) return;
  const ci = s.placed[f.id];
  if (ci != null) {
    const li = body.querySelector(`[data-placed="${CSS.escape(f.id)}"]`);
    const bin = body.querySelector(`[data-bin="${ci}"]`);
    if (!li) return;
    li.classList.add("is-landing");
    glide(f.text, f.from, rectOf(li), {
      ms: 560,
      tone: "card",
      done: () => {
        li.classList.remove("is-landing");
        playOnce(li, "is-settling");
        playOnce(bin, "is-thunk");
      },
    });
    return;
  }
  const card = body.querySelector(`[data-card="${CSS.escape(f.id)}"]`);
  const target = body.querySelector(`[data-bin="${f.ci}"]`);
  if (!card || !target) return;
  card.classList.add("is-away");
  glide(f.text, f.from, rectOf(target), {
    back: true,
    ms: 620,
    tone: "miss",
    done: () => {
      card.classList.remove("is-away");
      playOnce(card, "is-snapback");
    },
  });
}

function doPlace(s, env, cardId, ci) {
  const r = placeCard(s, cardId, ci);
  if (!r) return false;
  if (mem(env).flight) mem(env).flight.ci = ci;
  env.report({ wordId: r.card.wordId, dim: "mean", ok: r.ok, firstTry: r.first, kind: "sort" });
  s.last = { ok: r.ok, wordId: r.card.wordId };
  if (r.ok) {
    s.sel = "";
    s.hintFor = "";
  }
  env.say(
    r.ok
      ? env.I.S("Placed.", "Colocada.")
      : env.I.S("Not in that group. Try another.", "No va en ese grupo. Prueba otro."),
  );
  return true;
}

function reasonView(s, env) {
  const I = env.I;
  const q = s.reasons[s.ri];
  const st = s.rs[s.ri];
  return html`<div class="vag-qcard">
    <p class="vag-qtype">
      ${I.T("Why do they belong together?", "¿Por qué van juntas?")} ${s.ri + 1}/${s.reasons.length}
    </p>
    <div class="vag-stem"><p class="vag-q">${q.stem}</p></div>
    ${choicesHTML(q, st, env)}
    <div class="vag-actions">
      ${hintButton(st, env)}${st.done ? html`<button type="button" class="btn btn-primary" data-reason-next data-fk="next" data-autofocus>${I.T("Next", "Siguiente")}${icon("arrow-right")}</button>` : ""}
    </div>
    ${mcFeedback(q, st, env)}
  </div>`;
}
function reasonClick(el, s, env) {
  if (el.closest("[data-reason-next]")) {
    if (!s.rs[s.ri].done) return false;
    if (s.ri + 1 < s.reasons.length) s.ri += 1;
    else s.phase = s.shade ? "shade" : "done";
    return true;
  }
  return mcAct(el, s.reasons[s.ri], s.rs[s.ri], env, { kind: "sort-reason" });
}

function shadeView(s, env) {
  const I = env.I;
  const sh = s.shade;
  const want = sh.ladder.slice(1, -1);
  const left = sh.pool.filter((x) => !sh.order.includes(x));
  return html`<p class="vag-prompt">
      ${I.T("Put the words in order on this ladder:", "Ordena las palabras en esta escalera:")}
      <strong>${sh.label}</strong>
    </p>
    <ol class="vag-ladder" aria-label="${sh.label}">
      <li class="vag-rung is-end"><span class="vag-chip-w">${icon("pin")}${sh.ladder[0]}</span></li>
      ${want.map((_, i) => html`<li class="vag-rung ${sh.done ? "is-done" : ""}">${sh.order[i] ? html`<button type="button" class="vag-sortcard" data-unplace="${i}" data-fk="rung-${i}" ${sh.done ? 'aria-disabled="true"' : ""}>${sh.right[i] === true ? icon("check") : sh.right[i] === false ? icon("x") : ""}${sh.order[i]}</button>${sh.right[i] === false ? html`<span class="vag-sr"> ${I.S("not in the right place", "no está en su lugar")}</span>` : ""}` : html`<span class="vag-empty-rung">${I.T("Step", "Paso")} ${i + 2}</span>`}</li>`)}
      <li class="vag-rung is-end">
        <span class="vag-chip-w">${icon("pin")}${sh.ladder[sh.ladder.length - 1]}</span>
      </li>
    </ol>
    ${
      sh.done
        ? ""
        : html`<ul
            class="vag-tray"
            data-rove
            aria-label="${I.S("Words to place", "Palabras para colocar")}"
          >
            ${left.map((w, i) => html`<li><button type="button" class="vag-sortcard" data-shade-pick="${w}" data-fk="sp-${i}" data-rv ${i === 0 ? "data-rv-cur" : ""}>${w}</button></li>`)}
          </ul>`
    }
    <div class="vag-actions">
      ${sh.done ? html`<button type="button" class="btn btn-primary" data-shade-done data-fk="done" data-autofocus>${I.T("Finish", "Terminar")}${icon("arrow-right")}</button>` : html`<button type="button" class="btn small" data-shade-check data-fk="check" ${sh.order.length === want.length ? "" : 'aria-disabled="true"'}>${icon("check")}${I.T("Check the order", "Comprobar el orden")}</button>`}
    </div>
    ${sh.done ? fbHTML("ok", I.T("The ladder is in order.", "La escalera está en orden."), I) : sh.tries ? fbHTML("retry", I.T("Some words are not in the right place yet. The ones marked with an X go back to the tray when you tap them.", "Algunas palabras aún no están en su lugar. Toca las marcadas con X para devolverlas."), I) : ""}`;
}
function shadeClick(el, s, env) {
  const sh = s.shade;
  const want = sh.ladder.slice(1, -1);
  if (el.closest("[data-shade-done]")) {
    s.phase = "done";
    return true;
  }
  const un = el.closest("[data-unplace]");
  if (un && !sh.done) {
    const i = Number(un.dataset.unplace);
    if (sh.right[i] === true) return false;
    sh.order.splice(i, 1);
    sh.right = [];
    return true;
  }
  const pick = el.closest("[data-shade-pick]");
  if (pick && sh.order.length < want.length) {
    sh.order.push(pick.dataset.shadePick);
    sh.right = [];
    return true;
  }
  if (el.closest("[data-shade-check]")) {
    if (sh.order.length !== want.length) return false;
    const flags = checkShade(sh);
    const byHw = new Map(env.pool.all.map((w) => [norm(w.hw), w.id]));
    flags.forEach((ok, i) => {
      const id = byHw.get(norm(sh.order[i]));
      if (id)
        env.report({ wordId: id, dim: "mean", ok, firstTry: ok && sh.tries === 1, kind: "shade" });
    });
    sh.order = sh.order.filter((x, i) => flags[i] || sh.done);
    sh.right = sh.done ? flags : [];
    env.say(
      sh.done
        ? env.I.S("The ladder is in order.", "La escalera está en orden.")
        : env.I.S("Some words need to move.", "Algunas palabras deben moverse."),
    );
    return true;
  }
  return false;
}

export default {
  id: "word-sort",
  title: TITLE[0],
  titleEs: TITLE[1],
  blurb:
    "Sort words into groups by meaning, explain why each group belongs together, and order words on a ladder of shades.",
  blurbEs:
    "Clasifica palabras por significado, explica cada grupo y ordena una escalera de matices.",
  purpose: "See how words group by meaning and how close meanings differ in strength.",
  minGrade: "K",
  maxGrade: "12",
  dims: ["mean", "ctx"],
  mount: (root, opts) => mountGame(root, opts, spec),
  engine: { build: buildSort, place: placeCard, checkShade },
};
export { uniq };
