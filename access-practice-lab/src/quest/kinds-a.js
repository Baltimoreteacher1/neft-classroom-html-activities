// Language Quest item renderers, part 1: explore, read, sort, compare, ask, choose, check.
// Each kind is { render(env, item) -> html, click(el, env, item) -> bool, change(el, env, item) -> bool }.
// `env` = { I, mission, run, character, item(id) -> saved item state, save(), rerender() }.
// Nothing here marks an answer right or wrong by guessing: sort, compare and check use the author's key from the mission
// file and answer a miss with the card's own hint, never with the answer.
import { html, icon, raw } from "../util.js";
import { chartHTML, sceneSVG } from "./art.js";
import { checkCompare, checkSort, dialogueCompose, dialogueEnded, dialogueOptions, dialogueStart, dialogueStep, itemDone, wordCount } from "./engine.js";
import { bi, itemShell, say, ui } from "./ui.js";

const T = (env, en, es) => env.I.T(en, es);
const S = (env, en, es) => env.I.S(en, es);

// ── explore: an illustrated scene with things to inspect ─────────────────────────────────────────────────────────
export const explore = {
  render(env, item) {
    const st = env.item(item.id);
    const marks = st.marks || {};
    const open = ui.pick[item.id];
    const obj = item.objects.find((o) => o.id === open);
    const left = Math.max(0, item.need - Object.keys(marks).length);
    const body = html`<div class="q-scene-wrap">
        ${raw(sceneSVG(env.mission.scene.theme, { objects: item.objects, marks, alt: env.mission.scene.alt }))}
        ${item.objects.map((o) => html`<button type="button" class="q-hot ${open === o.id ? "is-open" : ""}" style="left:${o.x / 10}%;top:${(o.y / 560) * 100}%" data-q-act="inspect" data-obj="${o.id}" aria-label="${o.label}${marks[o.id] ? S(env, ", checked", ", revisado") : ""}"><span class="visually-hidden">${o.label}</span></button>`)}
      </div>
      <p class="fine q-count" role="status">${T(env, `${Object.keys(marks).length} checked. Check at least ${item.need} things.`, `${Object.keys(marks).length} revisados. Revisa al menos ${item.need} cosas.`)}${left ? "" : html` ${icon("check")}`}</p>
      ${obj
        ? html`<div class="q-detail" role="region" aria-label="${obj.label}">
            <h4>${obj.label}</h4>
            <p>${obj.text}</p>
            <button type="button" class="btn small" data-q-act="speak-text" data-say="${obj.text}">${icon("volume")} ${T(env, "Hear it", "Escúchalo")}</button>
            ${marks[obj.id]
              ? html`<p class="q-fb ${(marks[obj.id] === "yes") === obj.relevant ? "is-ok" : "is-look"}" role="status">${obj.why}</p>`
              : html`<div class="q-mark-row"><button type="button" class="btn" data-q-act="mark" data-mark="yes">${T(env, "This helps answer the question", "Esto ayuda a responder la pregunta")}</button><button type="button" class="btn" data-q-act="mark" data-mark="no">${T(env, "This does not help", "Esto no ayuda")}</button></div>`}
          </div>`
        : html`<p class="fine">${T(env, "Select an object in the scene to inspect it.", "Selecciona un objeto de la escena para inspeccionarlo.")}</p>`}
      ${(st.useful || []).length
        ? html`<div class="q-notebook"><strong>${T(env, "My notebook", "Mi cuaderno")}</strong><ul>${st.useful.map((id) => html`<li>${item.objects.find((o) => o.id === id)?.label}</li>`)}</ul></div>`
        : ""}`;
    return itemShell(env, item, body, itemDone(item, st), { title: T(env, "Explore the scene", "Explora la escena") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    if (el.dataset.qAct === "inspect") return ((ui.pick[item.id] = el.dataset.obj), env.rerender(), true);
    if (el.dataset.qAct === "mark") {
      const id = ui.pick[item.id];
      const o = item.objects.find((x) => x.id === id);
      if (!o) return true;
      (st.marks ||= {})[id] = el.dataset.mark;
      st.useful = Object.entries(st.marks).filter(([, v]) => v === "yes").map(([k]) => k);
      say(env, (el.dataset.mark === "yes") === o.relevant ? "recognize" : "elaborate");
      env.save();
      return (env.rerender(), true);
    }
    return false;
  },
};

// ── read: sources, with a read-aloud button and an "I read this" mark ──────────────────────────────────────────────
export const read = {
  render(env, item) {
    const st = env.item(item.id);
    const opened = st.opened || [];
    const body = html`<div class="q-sources">${item.sources.map((s) => html`<article class="q-source ${opened.includes(s.id) ? "is-read" : ""}">
        <h4>${s.title}</h4>
        ${s.text.map((p) => html`<p>${p}</p>`)}
        <div class="q-source-tools">
          <button type="button" class="btn small" data-q-act="speak-text" data-say="${s.text.join(" ")}">${icon("volume")} ${T(env, "Hear it", "Escúchalo")}</button>
          ${opened.includes(s.id) ? html`<span class="q-read-ok">${icon("check")} ${T(env, "Read", "Leído")}</span>` : html`<button type="button" class="btn small" data-q-act="read" data-src="${s.id}">${T(env, "I read this", "Ya lo leí")}</button>`}
        </div>
      </article>`)}</div>`;
    return itemShell(env, item, body, itemDone(item, st), { title: T(env, "Read", "Lee") });
  },
  click(el, env, item) {
    if (el.dataset.qAct !== "read") return false;
    const st = env.item(item.id);
    st.opened = [...new Set([...(st.opened || []), el.dataset.src])];
    env.save();
    return (env.rerender(), true);
  },
};

// ── sort: put each card in a category (buttons, so it works by keyboard and touch) ───────────────────────────────────
export const sort = {
  render(env, item) {
    const st = env.item(item.id);
    const placed = st.placed || {};
    const rows = Object.fromEntries((st.last || []).map((r) => [r.id, r]));
    const body = html`<ol class="q-cards">${item.cards.map((c) => {
        const r = rows[c.id];
        return html`<li class="q-card ${r ? (r.ok ? "is-ok" : "is-look") : ""}">
          <p class="q-card-text">${c.text}</p>
          <div class="q-cats" role="radiogroup" aria-label="${S(env, "Category for: ", "Categoría para: ")}${c.text}">${item.categories.map((k) => html`<button type="button" class="q-cat ${placed[c.id] === k.id ? "is-on" : ""}" role="radio" aria-checked="${String(placed[c.id] === k.id)}" data-q-act="place" data-card="${c.id}" data-cat="${k.id}" ${st.done ? html`disabled` : ""}>${k.label}</button>`)}</div>
          ${r ? html`<p class="q-fb ${r.ok ? "is-ok" : "is-look"}" role="status">${r.ok ? T(env, "Right place.", "Lugar correcto.") : html`${T(env, "Think again.", "Piénsalo otra vez.")} ${r.hint}`}</p>` : ""}
        </li>`;
      })}</ol>
      ${st.done
        ? html`<p class="q-fb is-ok" role="status">${icon("check")} ${T(env, "Every card is in the right place.", "Todas las tarjetas están en su lugar.")}</p>`
        : html`<button type="button" class="btn btn-primary" data-q-act="check-sort">${T(env, "Check my sort", "Revisar mi clasificación")}</button>${st.last ? html`<p class="fine" role="status">${T(env, `${st.last.filter((r) => r.ok).length} of ${st.last.length} in the right place. Change the ones that need another look, then check again.`, `${st.last.filter((r) => r.ok).length} de ${st.last.length} en su lugar. Cambia las que necesitan otra mirada y vuelve a revisar.`)}</p>` : ""}`}`;
    return itemShell(env, item, body, itemDone(item, st), { title: T(env, "Sort", "Clasifica") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    if (el.dataset.qAct === "place") {
      (st.placed ||= {})[el.dataset.card] = el.dataset.cat;
      if (st.last) st.last = st.last.filter((r) => r.id !== el.dataset.card);
      env.save();
      return (env.rerender(), true);
    }
    if (el.dataset.qAct === "check-sort") {
      const res = checkSort(item, st.placed || {});
      st.checks = (st.checks || 0) + 1;
      st.last = res.rows.filter((r) => r.placed);
      st.done = res.done;
      say(env, res.done ? "recognize" : "hint");
      if (!res.allPlaced) ui.fb[item.id] = true;
      env.save();
      return (env.rerender(), true);
    }
    return false;
  },
};

// ── compare: rate each piece of evidence for each explanation, then choose ────────────────────────────────────────────
const DEFAULT_RATINGS = { supports: ["Supports it", "Lo apoya"], contradicts: ["Goes against it", "Va en contra"], neutral: ["Does not help decide", "No ayuda a decidir"] };
export const compare = {
  render(env, item) {
    const st = env.item(item.id);
    const r = st.ratings || {};
    const labels = item.labels ? Object.fromEntries(Object.entries(item.labels).map(([k, v]) => [k, [v, v]])) : DEFAULT_RATINGS;
    const res = st.cmp;
    const body = html`<div class="q-compare">${item.options.map((o) => html`<fieldset class="q-cmp-opt"><legend>${o.label}</legend>
        <ul>${item.evidence.map((e) => html`<li class="${res?.recheck?.includes(e.id) && r[`${o.id}.${e.id}`] !== item.matrix[o.id][e.id] ? "is-look" : ""}"><label><span class="q-cmp-ev">${e.text}</span>
          <select data-q-act="rate" data-key="${o.id}.${e.id}" ${st.done ? html`disabled` : ""}><option value="">${S(env, "Choose…", "Elige…")}</option>${["supports", "contradicts", "neutral"].map((v) => html`<option value="${v}" ${r[`${o.id}.${e.id}`] === v ? html`selected` : ""}>${S(env, labels[v][0], labels[v][1])}</option>`)}</select></label></li>`)}</ul></fieldset>`)}
      <fieldset class="q-cmp-pick"><legend>${item.pickPrompt || T(env, "Which explanation do the clues support best?", "¿Qué explicación apoyan mejor las pistas?")}</legend>
        <div class="q-cats" role="radiogroup">${item.options.map((o) => html`<button type="button" class="q-cat ${st.choice === o.id ? "is-on" : ""}" role="radio" aria-checked="${String(st.choice === o.id)}" data-q-act="choose-best" data-opt="${o.id}" ${st.done ? html`disabled` : ""}>${o.label}</button>`)}</div></fieldset>
      ${st.done
        ? html`<p class="q-fb is-ok" role="status">${icon("check")} ${T(env, "Your ratings match the evidence, and you made a choice.", "Tus valoraciones coinciden con la evidencia y tomaste una decisión.")}</p>`
        : html`<button type="button" class="btn btn-primary" data-q-act="check-compare">${T(env, "Check my ratings", "Revisar mis valoraciones")}</button>
          ${res ? html`<p class="q-fb is-look" role="status">${res.rated < res.total ? T(env, `Rate every piece of evidence first (${res.rated} of ${res.total}).`, `Primero valora cada prueba (${res.rated} de ${res.total}).`) : !st.choice ? T(env, "Now choose an explanation.", "Ahora elige una explicación.") : html`${T(env, `${res.right} of ${res.total} ratings match. Look again at the highlighted evidence.`, `${res.right} de ${res.total} valoraciones coinciden. Mira otra vez las pruebas resaltadas.`)} ${item.recheckHint}`}</p>` : ""}`}</div>`;
    return itemShell(env, item, body, itemDone(item, st), { title: T(env, "Weigh the evidence", "Pesa la evidencia") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    if (el.dataset.qAct === "choose-best") {
      st.choice = el.dataset.opt;
      env.save();
      return (env.rerender(), true);
    }
    if (el.dataset.qAct === "check-compare") {
      const res = checkCompare(item, st.ratings || {}, st.choice);
      st.cmp = res;
      st.done = res.done;
      st.checks = (st.checks || 0) + 1;
      say(env, res.done ? "recognize" : "hint");
      env.save();
      return (env.rerender(), true);
    }
    return false;
  },
  change(el, env, item) {
    if (el.dataset.qAct !== "rate") return false;
    const st = env.item(item.id);
    (st.ratings ||= {})[el.dataset.key] = el.value;
    env.save();
    return true;
  },
};

// ── ask: a deterministic conversation with a character, plus a question the learner writes themselves ──────────────
export const ask = {
  render(env, item) {
    const st = env.item(item.id);
    st.dialogue ||= dialogueStart(item.dialogue);
    const d = st.dialogue;
    const opts = dialogueOptions(item.dialogue, d);
    const ended = dialogueEnded(item.dialogue, d);
    const node = item.dialogue.nodes[d.node];
    const who = (w) => (w === "me" ? S(env, "You", "Tú") : item.speakers?.[w] || env.character.name);
    const body = html`<ol class="q-chat" aria-label="${S(env, "Conversation", "Conversación")}">${d.log.map((m) => html`<li class="q-msg ${m.who === "me" ? "is-me" : ""}"><strong>${who(m.who)}</strong><span>${m.t}</span></li>`)}</ol>
      ${ended
        ? html`<p class="q-fb is-ok" role="status">${icon("check")} ${T(env, "Conversation finished.", "Conversación terminada.")}</p>`
        : html`<div class="q-opts" role="group" aria-label="${S(env, "Choose what to say", "Elige qué decir")}">${opts.map((o) => html`<button type="button" class="btn q-opt" data-q-act="ask-opt" data-opt="${o.id}">${o.label}</button>`)}</div>
          ${node.compose
            ? html`<div class="q-compose"><label for="qc-${item.id}"><strong>${node.compose.label}</strong></label>
                <textarea id="qc-${item.id}" rows="2" data-q-act="compose-text" placeholder="${S(env, "Write a full question. End it with a question mark.", "Escribe una pregunta completa. Termínala con un signo de interrogación.")}">${ui.text[`${item.id}:c`] || ""}</textarea>
                <button type="button" class="btn" data-q-act="ask-compose">${T(env, "Ask my question", "Hacer mi pregunta")}</button>
                ${ui.fb[`${item.id}:c`] ? html`<p class="q-fb is-look" role="status">${ui.fb[`${item.id}:c`]}</p>` : ""}</div>`
            : ""}`}
      ${item.compose ? html`<p class="fine">${T(env, `Questions you wrote: ${d.composed || 0} of ${item.compose}.`, `Preguntas que escribiste: ${d.composed || 0} de ${item.compose}.`)}</p>` : ""}`;
    return itemShell(env, item, body, itemDone(item, st), { title: T(env, "Ask questions", "Haz preguntas") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    st.dialogue ||= dialogueStart(item.dialogue);
    if (el.dataset.qAct === "ask-opt") {
      st.dialogue = dialogueStep(item.dialogue, st.dialogue, el.dataset.opt);
      say(env, "elaborate");
      env.save();
      return (env.rerender(), true);
    }
    if (el.dataset.qAct === "ask-compose") {
      const text = (ui.text[`${item.id}:c`] || "").trim();
      if (wordCount(text) < 3 || !/\?\s*$/.test(text)) {
        ui.fb[`${item.id}:c`] = S(env, "Write a question of at least three words and end it with a question mark.", "Escribe una pregunta de al menos tres palabras y termínala con un signo de interrogación.");
        return (env.rerender(), true);
      }
      st.dialogue = dialogueCompose(item.dialogue, st.dialogue, text);
      ui.text[`${item.id}:c`] = "";
      ui.fb[`${item.id}:c`] = "";
      say(env, "recognize");
      env.save();
      return (env.rerender(), true);
    }
    return false;
  },
  change(el, env, item) {
    if (el.dataset.qAct !== "compose-text") return false;
    ui.text[`${item.id}:c`] = el.value;
    return true;
  },
};

// ── choose: pick one or more options, optionally with a reason ───────────────────────────────────────────────────────
export const choose = {
  render(env, item) {
    const st = env.item(item.id);
    const picked = st.picked || [];
    const body = html`<div class="q-choices" role="group" aria-label="${item.prompt}">${item.options.map((o) => html`<button type="button" class="q-choice ${picked.includes(o.id) ? "is-on" : ""}" aria-pressed="${String(picked.includes(o.id))}" data-q-act="choose-opt" data-opt="${o.id}"><strong>${o.label}</strong>${o.detail ? html`<span class="fine">${o.detail}</span>` : ""}</button>`)}</div>
      <p class="fine" role="status">${T(env, `${picked.length} of ${item.pick || 1} chosen.`, `${picked.length} de ${item.pick || 1} elegidas.`)}</p>`;
    return itemShell(env, item, body, itemDone(item, st), { title: T(env, "Choose", "Elige") });
  },
  click(el, env, item) {
    if (el.dataset.qAct !== "choose-opt") return false;
    const st = env.item(item.id);
    const id = el.dataset.opt;
    const max = item.pick || 1;
    let picked = st.picked || [];
    if (picked.includes(id)) picked = picked.filter((x) => x !== id);
    else if (max === 1) picked = [id];
    else if (picked.length < max) picked = [...picked, id];
    st.picked = picked;
    st.flags = item.options.filter((o) => picked.includes(o.id)).flatMap((o) => o.sets || []);
    env.save();
    return (env.rerender(), true);
  },
};

// ── check: one question with feedback for each wrong choice (the answer is never shown on a miss) ─────────────────────
export const check = {
  render(env, item) {
    const st = env.item(item.id);
    const fb = st.fb || {};
    const body = html`${item.chart ? raw(chartHTML(item.chart)) : ""}
      ${item.say
        ? html`<div class="q-listen"><button type="button" class="btn" data-q-act="speak-text" data-say="${item.say}">${icon("volume")} ${T(env, "Listen", "Escuchar")}</button>
            <details><summary data-q-act="open-transcript">${T(env, "Show the words instead of listening", "Mostrar el texto en lugar de escuchar")}</summary><p class="q-transcript">${item.transcript}</p></details></div>`
        : ""}
      <fieldset class="q-mc"><legend class="visually-hidden">${item.prompt}</legend>${item.options.map((o) => html`<label class="q-mc-opt ${st.sel === o.id ? "is-on" : ""} ${fb[o.id] ? "is-look" : ""}"><input type="radio" name="mc-${item.id}" value="${o.id}" data-q-act="check-opt" ${st.sel === o.id ? html`checked` : ""} ${st.done ? html`disabled` : ""}/> <span>${o.label}</span>${fb[o.id] ? html`<small class="q-fb is-look">${fb[o.id]}</small>` : ""}</label>`)}</fieldset>
      ${st.done
        ? html`<p class="q-fb is-ok" role="status">${icon("check")} ${T(env, "Yes. That matches the evidence.", "Sí. Eso coincide con la evidencia.")}</p>`
        : html`<button type="button" class="btn btn-primary" data-q-act="check-answer" ${st.sel ? "" : html`disabled`}>${T(env, "Check", "Revisar")}</button>`}`;
    return itemShell(env, item, body, itemDone(item, st), { title: T(env, "Check your understanding", "Comprueba lo que entendiste") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    if (el.dataset.qAct === "open-transcript") return ((st.transcript = true), env.save(), false);
    if (el.dataset.qAct !== "check-answer") return false;
    st.attempts = (st.attempts || 0) + 1;
    if (st.sel === item.answer) {
      st.done = true;
      say(env, "recognize");
    } else {
      (st.fb ||= {})[st.sel] = item.options.find((o) => o.id === st.sel)?.fb || "Look again.";
      say(env, "hint");
    }
    env.save();
    return (env.rerender(), true);
  },
  change(el, env, item) {
    if (el.dataset.qAct !== "check-opt") return false;
    env.item(item.id).sel = el.value;
    env.save();
    env.rerender();
    return true;
  },
};
