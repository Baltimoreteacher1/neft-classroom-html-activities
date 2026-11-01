// Vocabulary Quest (flagship reference game). A three-camp journey on a map; each camp is a different
// interaction with the same five words: (1) tap a picture, then its word; (2) drag each meaning onto the word
// it defines; (3) read a sentence and choose the word its context clues point to. Every word is met by
// picture, by meaning and in context, then used on the learner's own in the transfer task.
import { audioBtn, dnd, feedbackHTML, glossHTML, hintHTML, html, icon, judge, newRound, pips, settled, shuffle, takeHint } from "./engine.js";
import { mascot } from "./art.js";
import { pic } from "./icons.js";

const CAMPS = [
  ["Camp 1 · Match", "Campamento 1 · Une"],
  ["Camp 2 · Meaning", "Campamento 2 · Significado"],
  ["Camp 3 · In context", "Campamento 3 · En contexto"],
];
const setOf = (state, env) => env.content.sets.find((s) => s.id === state.set) || env.content.sets[0];
const wordOf = (state, env, id) => setOf(state, env).words.find((w) => w.id === id);
const hintsFor = (w, kind) => {
  const first = `“${w.word[0]}”`;
  if (kind === "cloze") return [`Look at the clue words in the sentence: “${w.clue}”.`, `The missing word is a ${w.pos}.`, `It starts with ${first}.`];
  return [`This word is a ${w.pos}.${w.pos === "verb" ? " It names an action." : " It names a thing or an idea."}`, `It starts with ${first}.`, `It has ${w.word.length} letters.`];
};

export default {
  id: "vocab-quest",

  init(env) {
    const set = env.content.sets[env.rng.int(env.content.sets.length)];
    const pick = (n) => shuffle(set.words, env.rng).slice(0, n).map((w) => w.id);
    const mIds = pick(env.count(4, 3));
    const dIds = pick(env.count(4, 3));
    const cIds = pick(env.count(3, 2));
    const bank = (id) => shuffle([id, ...shuffle(set.words.map((w) => w.id).filter((x) => x !== id), env.rng).slice(0, 3)], env.rng);
    return {
      set: set.id, camp: 0,
      match: { ids: mIds, pics: shuffle(mIds, env.rng), words: shuffle(mIds, env.rng), done: [], sel: null, rs: {}, last: null },
      meaning: { ids: dIds, cards: shuffle(dIds, env.rng), slots: shuffle(dIds, env.rng), done: [], rs: {}, last: null },
      cloze: { items: cIds.map((id) => ({ id, bank: bank(id), rs: newRound(), pick: null })), i: 0 },
    };
  },

  done: (s) => s.camp >= 3,
  progress(s) {
    const total = s.match.ids.length + s.meaning.ids.length + s.cloze.items.length;
    return { done: s.match.done.length + s.meaning.done.length + s.cloze.items.filter((c) => settled(c.rs)).length, total };
  },

  view(s, env) {
    const I = env.I;
    const p = this.progress(s);
    const camp = s.camp;
    const campDone = camp === 0 ? s.match.done.length === s.match.ids.length : camp === 1 ? s.meaning.done.length === s.meaning.ids.length : s.cloze.items.every((c) => settled(c.rs));
    const body = camp === 0 ? matchView(s, env) : camp === 1 ? meaningView(s, env) : clozeView(s, env);
    return html`${mapHTML(camp, campDone, env)}${pips(p.done, p.total, I.S(`${p.done} of ${p.total} steps finished`, `${p.done} de ${p.total} pasos terminados`), I.S)}
      <h2 class="vq-camp-h">${I.T(CAMPS[camp][0], CAMPS[camp][1])}</h2>${body}
      ${campDone ? html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${camp < 2 ? I.T("Walk to the next camp", "Caminar al siguiente campamento") : I.T("Finish the quest", "Terminar la misión")}</button></div>` : ""}`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    if (!b) return false;
    if (b.hasAttribute("data-g-next")) { s.camp += 1; return true; }
    if (s.camp === 0) {
      const m = s.match;
      if (b.dataset.gPic) { const id = b.dataset.gPic; if (m.done.includes(id)) return false; m.sel = m.sel === id ? null : id; m.last = null; return true; }
      if (b.dataset.gWord && m.sel) {
        const id = m.sel;
        const rs = (m.rs[id] ||= newRound());
        const ok = b.dataset.gWord === id;
        judge(rs, ok, env, { id: `match:${id}`, skill: "vocabulary-picture" });
        m.last = { id, picked: b.dataset.gWord };
        if (settled(rs)) { m.done.push(id); m.sel = null; }
        return true;
      }
      if (b.hasAttribute("data-g-hint") && m.sel) { takeHint((m.rs[m.sel] ||= newRound()), env); return true; }
    } else if (s.camp === 1) {
      const m = s.meaning;
      if (b.hasAttribute("data-g-hint") && m.last) { takeHint(m.rs[m.last.id], env); return true; }
    } else {
      const item = s.cloze.items[s.cloze.i];
      if (b.dataset.gPick !== undefined && !settled(item.rs)) { item.pick = b.dataset.gPick; return true; }
      if (b.hasAttribute("data-g-check") && item.pick) {
        judge(item.rs, item.pick === item.id, env, { id: `cloze:${item.id}`, skill: "vocabulary-context" });
        return true;
      }
      if (b.hasAttribute("data-g-hint")) { takeHint(item.rs, env); return true; }
      if (b.hasAttribute("data-g-item-next") && settled(item.rs) && s.cloze.i < s.cloze.items.length - 1) { s.cloze.i += 1; return true; }
    }
    return false;
  },

  mount(root, s, env, changed) {
    if (s.camp !== 1) return null;
    return dnd(root, { I: env.I, onDrop: (cardId, slotId) => { if (drop(s, env, cardId, slotId)) changed(); } });
  },

  plan(s, { wrong } = {}, env) {
    if (s.camp >= 3) return [];
    const sel = (a, v) => `[${a}="${v}"]`;
    if (s.camp === 0) {
      const m = s.match;
      if (m.done.length === m.ids.length) return [{ click: "[data-g-next]" }];
      const id = m.pics.find((x) => !m.done.includes(x));
      const target = (wrong && m.words.find((x) => x !== id && !m.done.includes(x))) || id;
      return [...(m.sel === id ? [] : [{ click: sel("data-g-pic", id) }]), { click: sel("data-g-word", target) }];
    }
    if (s.camp === 1) {
      const m = s.meaning;
      if (m.done.length === m.ids.length) return [{ click: "[data-g-next]" }];
      const id = m.cards.find((x) => !m.done.includes(x));
      const slot = (wrong && m.slots.find((x) => x !== id && !m.done.includes(x))) || id;
      return [{ drag: [sel("data-drag", id), sel("data-drop", slot)] }];
    }
    const c = s.cloze;
    if (c.items.every((x) => settled(x.rs))) return [{ click: "[data-g-next]" }];
    const item = c.items[c.i];
    if (settled(item.rs)) return [{ click: "[data-g-item-next]" }];
    const choice = wrong ? item.bank.find((x) => x !== item.id) : item.id;
    return [{ click: sel("data-g-pick", choice) }, { click: "[data-g-check]" }];
  },

  validate(content) {
    const errs = [];
    for (const band of ["3-5", "6-8"]) {
      const sets = content.bands?.[band]?.sets || [];
      if (sets.length < 2) errs.push(`${band}: needs at least 2 word sets`);
      for (const set of sets) {
        if (set.words.length < 5) errs.push(`${band}/${set.id}: needs at least 5 words`);
        for (const w of set.words) {
          const at = `${band}/${set.id}/${w.id}`;
          for (const f of ["word", "es", "pic", "def", "defEs", "cloze", "clue", "pos"]) if (!w[f]) errs.push(`${at}: missing ${f}`);
          if (!/___/.test(w.cloze || "")) errs.push(`${at}: cloze needs a ___ gap`);
          if (w.cloze && !w.cloze.includes(w.clue)) errs.push(`${at}: clue must appear in the sentence`);
          if (new RegExp(`\\b${w.word}\\b`, "i").test(w.def)) errs.push(`${at}: definition uses the word itself`);
          if (new RegExp(`\\b${w.word}\\b`, "i").test(w.clue)) errs.push(`${at}: the clue gives the word away`);
          if (new RegExp(`\\b${w.word}\\b`, "i").test(w.cloze.replace("___", ""))) errs.push(`${at}: the sentence already contains the word`);
          if (w.def.split(/\s+/).length > (band === "3-5" ? 14 : 18)) errs.push(`${at}: definition too long for the band`);
        }
      }
    }
    return errs;
  },
};

// ── the quest map ────────────────────────────────────────────────────────────────────────
function mapHTML(camp, campDone, env) {
  const I = env.I;
  const xs = [70, 240, 410];
  const names = [I.S("Match", "Une"), I.S("Meaning", "Significado"), I.S("Context", "Contexto")];
  const node = (x, i) => {
    const done = i < camp || (i === camp && campDone) || camp >= 3;
    const now = i === camp && !campDone && camp < 3;
    return `<g transform="translate(${x} 36)"><circle r="19" fill="${done ? "#1fa6a2" : now ? "#f2c15b" : "#e2eaf5"}" stroke="#17324d" stroke-width="${now ? 4 : 2.6}"/>${done ? '<path d="M-8 0l6 7l11 -13" fill="none" stroke="#fff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>' : `<text y="6" text-anchor="middle" font-size="18" font-weight="800" fill="#17324d">${i + 1}</text>`}</g><text x="${x}" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="#384a60">${names[i]}</text>${now ? `<path transform="translate(${x} 6)" d="M0 8l-7 -10h14Z" fill="#f2765a" stroke="#17324d" stroke-width="2"/>` : ""}`;
  };
  return html`<figure class="vq-map" aria-label="${I.S(`Quest map. You are at camp ${Math.min(camp + 1, 3)} of 3.`, `Mapa de la misión. Estás en el campamento ${Math.min(camp + 1, 3)} de 3.`)}"><svg viewBox="0 0 480 84" role="img" aria-label="${I.S("Three camps on a trail", "Tres campamentos en un sendero")}"><path d="M70 36H410" stroke="#17324d" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round" opacity=".5"/>${xs.map(node).join("")}</svg></figure>`;
}

// ── camp 1 ───────────────────────────────────────────────────────────────────────────────
function matchView(s, env) {
  const I = env.I;
  const m = s.match;
  const set = setOf(s, env);
  const last = m.last ? m.rs[m.last.id] : null;
  const focus = m.sel || m.last?.id;
  const rs = focus ? m.rs[focus] || newRound() : null;
  const w = (id) => set.words.find((x) => x.id === id);
  const lastWord = m.last ? w(m.last.id) : null;
  return html`<p class="gs-prompt">${I.T("Tap a picture. Then tap the word that matches it.", "Toca una imagen. Luego toca la palabra que le corresponde.")}</p>
    <div class="vq-board" data-g-match>
      <ul class="vq-pics" aria-label="${I.S("Pictures", "Imágenes")}">${m.pics.map((id) => { const done = m.done.includes(id); const x = w(id); return html`<li><button type="button" class="vq-pic${m.sel === id ? " is-sel" : ""}${done ? " is-done" : ""}" data-g-pic="${id}" ${done ? "disabled" : ""} aria-pressed="${m.sel === id}" aria-label="${done ? x.word : I.S("Picture", "Imagen") + " " + (m.pics.indexOf(id) + 1)}">${pic(x.pic, env.band, "")}${done ? html`<span class="vq-tick">${icon("check")}</span><span class="vq-done-w">${x.word}</span>` : ""}</button></li>`; })}</ul>
      <ul class="vq-words" aria-label="${I.S("Words", "Palabras")}">${m.words.map((id) => { const done = m.done.includes(id); const x = w(id); return html`<li class="vq-wcard${done ? " is-done" : ""}"><button type="button" class="vq-word" data-g-word="${id}" ${done || !m.sel ? "disabled" : ""}>${x.word}</button>${audioBtn(x.word, I)}${glossHTML(x.es, env)}</li>`; })}</ul>
    </div>
    ${rs && focus && !m.done.includes(focus) ? hintHTML(rs, hintsFor(w(focus), "match"), env) : m.last && last ? hintHTML(last, hintsFor(lastWord, "match"), env, { disabled: true }) : ""}
    ${last && m.last ? feedbackHTML(last, { I, right: html`<strong>${lastWord.word}</strong>: ${lastWord.def}`, retry: I.T("That word does not go with this picture. Look at what the picture shows, then try another word.", "Esa palabra no va con esta imagen. Mira lo que muestra la imagen y prueba con otra palabra."), answer: html`<strong>${lastWord.word}</strong>: ${lastWord.def}`, explain: lastWord.defEs && env.sup.gloss !== "off" ? html`<span lang="es">${lastWord.defEs}</span>` : "" }) : ""}`;
}

// ── camp 2 ───────────────────────────────────────────────────────────────────────────────
function drop(s, env, cardId, slotId) {
  const m = s.meaning;
  if (m.done.includes(slotId) || m.done.includes(cardId)) return false;
  const rs = (m.rs[cardId] ||= newRound());
  const ok = cardId === slotId;
  judge(rs, ok, env, { id: `meaning:${cardId}`, skill: "vocabulary-meaning" });
  m.last = { id: cardId, slot: slotId };
  if (settled(rs)) m.done.push(cardId);
  return true;
}
function meaningView(s, env) {
  const I = env.I;
  const m = s.meaning;
  const set = setOf(s, env);
  const w = (id) => set.words.find((x) => x.id === id);
  const last = m.last ? m.rs[m.last.id] : null;
  const lw = m.last ? w(m.last.id) : null;
  const open = m.cards.filter((id) => !m.done.includes(id));
  return html`<p class="gs-prompt">${I.T("Drag each meaning onto the word it describes. You can also tap a meaning, then tap a word.", "Arrastra cada significado hasta la palabra que describe. También puedes tocar un significado y luego una palabra.")}</p>
    <div class="vq-meaning" data-g-meaning>
      <ul class="vq-slots" aria-label="${I.S("Words", "Palabras")}">${m.slots.map((id) => { const x = w(id); const done = m.done.includes(id); return html`<li><div class="vq-slot${done ? " is-done" : ""}" data-drop-in><div class="vq-slot-head"><span class="vq-slot-w">${x.word}</span>${audioBtn(x.word, I)}${glossHTML(x.es, env)}${env.sup.visuals || (m.rs[id]?.h >= 1) ? html`<span class="vq-slot-pic">${pic(x.pic, env.band, "")}</span>` : ""}</div>${done ? html`<p class="vq-slot-def">${icon("check")}${x.def}</p>` : html`<button type="button" class="vq-slot-empty" data-drop="${id}" aria-label="${I.S("Place a meaning on", "Colocar un significado en")} ${x.word}">${I.T("Drop a meaning here", "Suelta un significado aquí")}</button>`}</div></li>`; })}</ul>
      <ul class="vq-cards" aria-label="${I.S("Meanings", "Significados")}">${open.map((id) => { const x = w(id); return html`<li><button type="button" class="vq-card" data-drag="${id}" aria-pressed="false">${x.def}</button>${env.sup.gloss === "show" ? html`<span class="gs-gloss" lang="es">${x.defEs}</span>` : ""}</li>`; })}${open.length ? "" : html`<li class="fine">${I.T("All meanings are placed.", "Todos los significados están colocados.")}</li>`}</ul>
    </div>
    ${last && !settled(last) ? hintHTML(last, hintsFor(lw, "meaning"), env) : last && m.last ? hintHTML(last, hintsFor(lw, "meaning"), env, { disabled: true }) : ""}
    ${last ? feedbackHTML(last, { I, right: html`<strong>${lw.word}</strong>: ${lw.def}`, retry: I.T("That meaning belongs to a different word. Read it again and look for a key idea.", "Ese significado pertenece a otra palabra. Léelo otra vez y busca una idea clave."), answer: html`<strong>${lw.word}</strong>: ${lw.def}`, explain: "" }) : ""}`;
}

// ── camp 3 ───────────────────────────────────────────────────────────────────────────────
function clozeView(s, env) {
  const I = env.I;
  const c = s.cloze;
  const item = c.items[c.i];
  const set = setOf(s, env);
  const w = set.words.find((x) => x.id === item.id);
  const word = (id) => set.words.find((x) => x.id === id);
  const showClue = env.sup.frames !== "none" || item.rs.h >= 1;
  const [pre, post] = w.cloze.split("___");
  const mark = (t) => (showClue && t.includes(w.clue) ? html`${t.split(w.clue)[0]}<mark class="vq-clue">${w.clue}</mark>${t.split(w.clue).slice(1).join(w.clue)}` : t);
  const gap = item.pick ? html`<span class="vq-gap is-filled">${word(item.pick).word}</span>` : html`<span class="vq-gap" role="img" aria-label="${I.S("blank", "espacio en blanco")}">&nbsp;</span>`;
  const n = c.i + 1;
  const last = settled(item.rs);
  return html`<p class="gs-prompt">${I.T(`Sentence ${n} of ${c.items.length}. Which word fits the gap? Use the clue words.`, `Oración ${n} de ${c.items.length}. ¿Qué palabra encaja en el espacio? Usa las palabras pista.`)}</p>
    <p class="gs-text vq-sentence">${mark(pre)}${gap}${mark(post)} ${audioBtn(w.cloze.replace("___", "blank"), I)}</p>
    <div class="gs-choices vq-bank" role="group" aria-label="${I.S("Word bank", "Banco de palabras")}">${item.bank.map((id) => html`<button type="button" class="gs-choice vq-bank-word${item.pick === id ? " is-sel" : ""}${last && id === item.id ? " is-right" : ""}" data-g-pick="${id}" aria-pressed="${item.pick === id}" ${last ? "disabled" : ""}>${word(id).word}</button>`)}</div>
    ${hintHTML(item.rs, hintsFor(w, "cloze"), env)}
    ${feedbackHTML(item.rs, { I, right: html`<strong>${w.word}</strong>: ${w.def}`, retry: I.T("That word does not fit this sentence. Read the clue words again.", "Esa palabra no encaja en esta oración. Lee otra vez las palabras pista."), answer: html`<strong>${w.word}</strong>: ${w.def}`, explain: w.clue ? I.T(`The clue was “${w.clue}”.`, `La pista era “${w.clue}”.`) : "" })}
    <div class="gs-actions">
      ${last ? (c.i < c.items.length - 1 ? html`<button type="button" class="btn btn-primary" data-g-item-next>${icon("arrow-right")}${I.T("Next sentence", "Siguiente oración")}</button>` : "") : html`<button type="button" class="btn btn-primary" data-g-check ${item.pick ? "" : "disabled"}>${icon("check")}${I.T("Check my word", "Revisar mi palabra")}</button>`}
    </div>`;
}
