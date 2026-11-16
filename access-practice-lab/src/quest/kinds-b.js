// Language Quest item renderers, part 2: write, speak, story, forge, simulate, route, timeline.
// Writing and speaking are the centre of the mission engine: the learner produces the language, and what happens in the
// world follows from visible rules (a checklist the learner can read, a model table, a route the walker really walks).
// Free text is never "understood": checklists look for words and shape, and say so.
import { isRecording, takesFor } from "../recorder.js";
import { recorderHTML } from "../components.js";
import { html, icon, raw, wordCount as wc } from "../util.js";
import { citySVG, glyphSVG, routeSVG, storyStageSVG } from "./art.js";
import { checkTimeline, checkWriting, forgeWord, isRevision, itemDone, landmarksOnPath, parseDirections, requiredMet, runCityModel, walkRoute } from "./engine.js";
import { bi, calm, checklistHTML, itemShell, say, supportHTML, ui } from "./ui.js";

const T = (env, en, es) => env.I.T(en, es);
const S = (env, en, es) => env.I.S(en, es);
const allItems = (env) => env.mission.stages.flatMap((s) => s.items);
const find = (env, id) => allItems(env).find((i) => i.id === id);
const now = () => new Date().toISOString();

/** The text an earlier item ended with: the last saved version, else the draft; a story is its sentences in order. */
export function lastText(env, id) {
  const it = find(env, id);
  const st = env.item(id);
  if (!it) return "";
  if (it.kind === "story") return it.slots.map((s) => st.sentences?.[s.id]).filter(Boolean).join(" ");
  return st.versions?.at(-1)?.text ?? st.draft ?? "";
}

/** Words the checklist needs from other items: this learner's clues, evidence cards, built words or chosen projects. */
export function ctxFor(env, item) {
  const ctx = {};
  if (item.clueFrom) {
    const ex = find(env, item.clueFrom);
    ctx.clueTerms = Object.fromEntries((env.item(item.clueFrom).useful || []).map((id) => [id, ex.objects.find((o) => o.id === id)?.terms || []]));
  }
  if (item.pickedFrom) {
    const s = find(env, item.pickedFrom);
    const st = env.item(s.id);
    if (s.kind === "choose") ctx.pickedTerms = (st.picked || []).map((id) => s.options.find((o) => o.id === id)?.terms || []).filter((t) => t.length);
    else if (s.kind === "forge") ctx.pickedTerms = (st.found || []).map((w) => [w]);
    else if (s.kind === "simulate") ctx.pickedTerms = (st.picked || []).map((id) => s.model.projects.find((p) => p.id === id)?.terms || []).filter((t) => t.length);
  }
  return ctx;
}

// ── write ────────────────────────────────────────────────────────────────────────────────────────────────────
function walkNote(env, item, st) {
  const grid = find(env, item.walkFrom).grid;
  const w = st.walk;
  if (!w) return "";
  const r = w.result;
  const last = landmarksOnPath(grid, r.path).at(-1);
  const msg = !w.moves.length
    ? S(env, "Kai could not find any compass words (north, south, east, west) in your directions.", "Kai no encontró palabras de dirección (north, south, east, west) en tus indicaciones.")
    : r.reached
      ? S(env, "Kai reached the cave and found the compass!", "¡Kai llegó a la cueva y encontró la brújula!")
      : r.failed
        ? S(env, `Kai stopped after step ${r.step - 1}${last ? `, next to the ${last}` : ""}: the next step ${r.failed === "edge" ? "would leave the map" : "goes into the river"}. Read your directions at that point. Did you say how to get around it?`, `Kai se detuvo después del paso ${r.step - 1}${last ? `, junto a: ${last}` : ""}: el siguiente paso ${r.failed === "edge" ? "sale del mapa" : "entra al río"}. Lee tus indicaciones en ese punto. ¿Dijiste cómo rodearlo?`)
        : S(env, `Kai followed ${w.moves.length} steps and stopped before the cave. Add the rest of the way.`, `Kai siguió ${w.moves.length} pasos y se detuvo antes de la cueva. Agrega el resto del camino.`);
  return html`<div class="q-walk"><div class="q-route-wrap">${raw(routeSVG(grid, r.path, r.failed ? r.at : null, { animate: ui.anim === item.id && !calm(), alt: S(env, "Map showing the path Kai walked from your directions.", "Mapa que muestra el camino que Kai recorrió con tus indicaciones.") }))}</div><p class="q-fb ${r.reached ? "is-ok" : "is-look"}" role="status">${msg}</p></div>`;
}

/** What still stands between the learner and Finish. Used when drawing the page and again as they type. */
function missingFor(env, item, st, text, base) {
  const out = [];
  if (!requiredMet(checkWriting(text, item.checks, ctxFor(env, item), st.override || []))) out.push(S(env, "meet the required checklist items", "cumplir los puntos obligatorios de la lista"));
  if (item.reviseOf && !isRevision(base, text, 3)) out.push(S(env, "change at least three words from your earlier version", "cambiar al menos tres palabras de tu versión anterior"));
  if (item.world === "walk" && !st.walk) out.push(S(env, "send Kai on the route you wrote", "enviar a Kai por la ruta que escribiste"));
  if (item.requireReach && !(st.walk && st.walk.text === text.trim() && st.walk.result.reached)) out.push(S(env, "make Kai reach the cave with this version", "lograr que Kai llegue a la cueva con esta versión"));
  return out;
}

export const write = {
  render(env, item) {
    const st = env.item(item.id);
    const base = item.reviseOf ? lastText(env, item.reviseOf) : "";
    const text = ui.text[item.id] ?? st.draft ?? base;
    const results = st.checked ? checkWriting(text, item.checks, ctxFor(env, item), st.override || []) : null;
    const n = wc(text);
    const missing = missingFor(env, item, st, text, base);
    const planPick = item.worldFrom ? env.item(item.worldFrom) : null;
    const planItem = item.worldFrom ? find(env, item.worldFrom) : null;
    const body = html`${item.purpose ? html`<p class="q-purpose">${icon("sparkle")} ${item.purpose}</p>` : ""}
      ${item.reviseOf && base ? html`<details class="q-before"><summary>${T(env, "My earlier version", "Mi versión anterior")}</summary><p class="q-quote">${base}</p></details>` : ""}
      ${st.done ? "" : supportHTML(env, item)}
      ${item.world === "city" && planPick?.picked?.length ? html`<figure class="q-city">${raw(citySVG(planPick.picked, st.done ? planPick.result?.metrics : null, S(env, "The fictional city of Marlow, drawn from your chosen projects.", "La ciudad ficticia de Marlow, dibujada con los proyectos que elegiste.")))}<figcaption class="fine">${st.done ? T(env, `The council voted. In the model, Marlow's afternoon temperature is ${planPick.result.metrics.temp}°F. The picture follows the model table.`, `El concejo votó. En el modelo, la temperatura de la tarde en Marlow es ${planPick.result.metrics.temp}°F. La imagen sigue la tabla del modelo.`) : T(env, "Your plan so far. When you finish your writing, the council votes.", "Tu plan hasta ahora. Cuando termines tu escrito, el concejo vota.")}</figcaption></figure>` : ""}
      <label class="q-label" for="qw-${item.id}">${T(env, "Your writing", "Tu escrito")}</label>
      <textarea id="qw-${item.id}" class="q-textarea" rows="${item.minWords > 30 ? 8 : 5}" data-q-act="write-text" ${st.done ? html`readonly` : ""} aria-describedby="qwc-${item.id}">${text}</textarea>
      <p class="fine" id="qwc-${item.id}"><span data-q-wc="${item.id}">${n}</span> ${T(env, `words. Aim for at least ${item.minWords}.`, `palabras. Procura escribir al menos ${item.minWords}.`)}</p>
      ${results ? checklistHTML(env.I, results, st.override || []) : ""}
      ${results && item.listeners ? html`<div class="q-listeners" aria-label="${S(env, "What each listener heard", "Lo que oyó cada oyente")}">${item.listeners.map((l) => {
            const ok = l.listensFor.every((id) => results.find((r) => r.id === id)?.met);
            return html`<p class="q-listener ${ok ? "is-ok" : "is-look"}"><strong>${l.name}</strong> <span class="fine">${T(env, `listens for: ${l.listensFor.map((id) => item.checks.find((c) => c.id === id)?.label).join("; ")}`, `escucha: ${l.listensFor.map((id) => item.checks.find((c) => c.id === id)?.label).join("; ")}`)}</span><br />${ok ? l.met : l.unmet}</p>`;
          })}</div>` : ""}
      ${item.world === "walk" ? walkNote(env, item, st) : ""}
      ${st.done
        ? html`<p class="q-fb is-ok" role="status">${icon("check")} ${T(env, "Saved. Your work is in your portfolio.", "Guardado. Tu trabajo está en tu portafolio.")}</p>`
        : html`<div class="q-actions">
            <button type="button" class="btn" data-q-act="write-check">${T(env, "Check my work", "Revisar mi trabajo")}</button>
            ${item.world === "walk" ? html`<button type="button" class="btn" data-q-act="send-kai" ${wc(text) < 3 ? html`disabled` : ""}>${T(env, "Send Kai", "Enviar a Kai")}</button>` : ""}
            <button type="button" class="btn btn-primary" data-q-act="write-finish" ${missing.length ? html`disabled aria-describedby="qm-${item.id}"` : ""}>${T(env, "Finish and save", "Terminar y guardar")}</button>
          </div>
          ${missing.length && st.checked ? html`<p class="fine" id="qm-${item.id}" role="status">${T(env, "To finish:", "Para terminar:")} ${missing.join("; ")}.</p>` : ""}`}
      ${st.done && st.versions?.length > 1 ? html`<p class="fine">${T(env, "You revised this. Compare both versions in your portfolio.", "Revisaste esto. Compara las dos versiones en tu portafolio.")}</p>` : ""}`;
    return itemShell(env, item, body, Boolean(st.done), { title: item.reviseOf ? T(env, "Revise", "Revisa") : T(env, "Write", "Escribe") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    const act = el.dataset.qAct;
    const base = item.reviseOf ? lastText(env, item.reviseOf) : "";
    const text = () => (ui.text[item.id] ?? st.draft ?? base).trim();
    if (act === "write-check") {
      st.draft = text();
      st.checked = true;
      const res = checkWriting(st.draft, item.checks, ctxFor(env, item), st.override || []);
      (st.attempts ||= []).push({ at: now(), met: res.filter((r) => r.met).length, of: res.length, words: wc(st.draft) });
      st.attempts = st.attempts.slice(-6);
      say(env, requiredMet(res) ? "recognize" : item.reviseOf ? "revise" : "elaborate");
      env.save();
      return (env.rerender(), true);
    }
    if (act === "override") {
      const set = new Set(st.override || []);
      el.checked ? set.add(el.dataset.check) : set.delete(el.dataset.check);
      st.override = [...set];
      st.draft = text();
      env.save();
      return (env.rerender(), true);
    }
    if (act === "send-kai") {
      const grid = find(env, item.walkFrom).grid;
      const t = text();
      const moves = parseDirections(t);
      st.walk = { text: t, moves, result: walkRoute(grid, moves) };
      st.draft = t;
      ui.anim = item.id;
      say(env, st.walk.result.reached ? "recognize" : "hint");
      env.save();
      env.rerender();
      return true;
    }
    if (act === "write-finish") {
      const t = text();
      const res = checkWriting(t, item.checks, ctxFor(env, item), st.override || []);
      if (!requiredMet(res) || (item.reviseOf && !isRevision(base, t, 3))) return (st.checked = true), env.rerender(), true;
      if (item.requireReach && !(st.walk && st.walk.text === t && st.walk.result.reached)) return true;
      st.versions ||= [];
      if (item.reviseOf && !st.versions.length) st.versions.push({ text: base, met: [], at: now(), from: item.reviseOf });
      st.versions.push({ text: t, met: res.filter((r) => r.met && !r.selfDeclared).map((r) => r.id), selfDeclared: res.filter((r) => r.selfDeclared).map((r) => r.id), at: now() });
      st.draft = t;
      st.done = true;
      for (const [checkId, flag] of Object.entries(item.flagOn || {})) {
        env.run.flags ||= [];
        if (res.find((r) => r.id === checkId)?.met && !env.run.flags.includes(flag)) env.run.flags.push(flag);
      }
      say(env, "recognize");
      env.save();
      return (env.rerender(), true);
    }
    return false;
  },
  change(el, env, item) {
    if (el.dataset.qAct !== "write-text") return false;
    const st = env.item(item.id);
    ui.text[item.id] = el.value;
    st.draft = el.value;
    const wcEl = document.querySelector(`[data-q-wc="${item.id}"]`);
    if (wcEl) wcEl.textContent = String(wc(el.value));
    const fin = document.querySelector(`[data-q-item="${item.id}"] [data-q-act="write-finish"]`);
    if (fin) fin.disabled = missingFor(env, item, st, el.value.trim(), item.reviseOf ? lastText(env, item.reviseOf) : "").length > 0;
    env.saveSoon();
    return true;
  },
};

// ── speak: observe, prepare, speak, review, improve ───────────────────────────────────────────────────────────────
const speakReady = (item, st) => Boolean((st.took || wc(st.typed) >= (item.typedMin || 10)) && (st.self || []).length >= (item.needSelf || 1) && wc(st.note) >= 3);
const refreshSpeak = (item, st) => {
  const b = document.querySelector(`[data-q-item="${item.id}"] [data-q-act="speak-finish"]`);
  if (b) b.disabled = !speakReady(item, st);
};
export const speak = {
  render(env, item) {
    const st = env.item(item.id);
    const key = `quest:${env.mission.id}:${item.id}`;
    const takes = takesFor(key);
    const ready = speakReady(item, st);
    const body = html`<ol class="q-steps">
        <li><h4>${T(env, "1. Observe", "1. Observa")}</h4><p>${item.prompt}</p><button type="button" class="btn small" data-q-act="speak-text" data-say="${item.prompt}">${icon("volume")} ${T(env, "Hear it", "Escúchalo")}</button></li>
        <li><h4>${T(env, "2. Prepare", "2. Prepárate")}</h4>${st.done ? "" : supportHTML(env, item)}</li>
        <li><h4>${T(env, "3. Speak", "3. Habla")}</h4>
          ${recorderHTML(key, { prompt: item.prompt, recording: isRecording(key), i18n: env.I })}
          <details class="q-typed" ${st.typed ? html`open` : ""}><summary>${T(env, "No microphone? Rehearse by typing", "¿Sin micrófono? Ensaya escribiendo")}</summary>
            <p class="fine">${T(env, "This is typed rehearsal. It is practice, and it is not a recording of you speaking.", "Esto es un ensayo escrito. Es práctica y no es una grabación de ti hablando.")}</p>
            <textarea rows="4" class="q-textarea" data-q-act="typed-text" aria-label="${S(env, "Typed rehearsal", "Ensayo escrito")}">${ui.text[`${item.id}:t`] ?? st.typed ?? ""}</textarea>
            <p class="fine"><span data-q-wc="${item.id}:t">${wc(st.typed)}</span> ${T(env, `words. Aim for at least ${item.typedMin}.`, `palabras. Procura escribir al menos ${item.typedMin}.`)}</p></details></li>
        <li><h4>${T(env, "4. Review", "4. Revisa")}</h4><p class="fine">${T(env, `Listen back or reread. Tick what is true. Choose at least ${item.needSelf}.`, `Escucha de nuevo o relee. Marca lo que sea cierto. Elige al menos ${item.needSelf}.`)}</p>
          <ul class="q-selfs">${item.selfChecks.map((c) => html`<li><label><input type="checkbox" data-q-act="self" data-self="${c.id}" ${(st.self || []).includes(c.id) ? html`checked` : ""} ${st.done ? html`disabled` : ""}/> ${c.label}</label></li>`)}</ul></li>
        <li><h4>${T(env, "5. Improve", "5. Mejora")}</h4>
          <label class="q-label" for="qn-${item.id}">${T(env, "One thing I will do better the next time I say it", "Algo que haré mejor la próxima vez que lo diga")}</label>
          <textarea id="qn-${item.id}" rows="2" class="q-textarea" data-q-act="note-text">${ui.text[`${item.id}:n`] ?? st.note ?? ""}</textarea></li>
      </ol>
      ${st.done
        ? html`<p class="q-fb is-ok" role="status">${icon("check")} ${st.took ? T(env, "Saved: a recorded take (the recording itself stays only in this tab).", "Guardado: una grabación (el audio solo permanece en esta pestaña).") : T(env, "Saved as typed rehearsal.", "Guardado como ensayo escrito.")}</p>`
        : html`<button type="button" class="btn btn-primary" data-q-act="speak-finish" ${ready ? "" : html`disabled`}>${T(env, "Finish speaking practice", "Terminar la práctica oral")}</button>${ready ? "" : html`<p class="fine" role="status">${T(env, "To finish: record or type a rehearsal, tick the review checks, and write one thing to improve.", "Para terminar: graba o escribe un ensayo, marca las revisiones y escribe algo que mejorar.")}</p>`}`}
      ${takes.length ? "" : ""}`;
    return itemShell(env, item, body, Boolean(st.done), { title: T(env, "Speak", "Habla") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    if (el.dataset.qAct === "self") {
      const set = new Set(st.self || []);
      el.checked ? set.add(el.dataset.self) : set.delete(el.dataset.self);
      st.self = [...set];
      env.save();
      return (env.rerender(), true);
    }
    if (el.dataset.qAct === "speak-finish") {
      st.done = true;
      st.at = now();
      say(env, "recognize");
      env.save();
      return (env.rerender(), true);
    }
    return false;
  },
  change(el, env, item) {
    const st = env.item(item.id);
    if (el.dataset.qAct === "typed-text") {
      ui.text[`${item.id}:t`] = el.value;
      st.typed = el.value;
      const w = document.querySelector(`[data-q-wc="${item.id}:t"]`);
      if (w) w.textContent = String(wc(el.value));
      return (refreshSpeak(item, st), env.saveSoon(), true);
    }
    if (el.dataset.qAct === "note-text") return ((ui.text[`${item.id}:n`] = el.value), (st.note = el.value), refreshSpeak(item, st), env.saveSoon(), true);
    return false;
  },
};

// ── story: pick the parts, write each part, and the stage acts it out ────────────────────────────────────────────────
const pickedObjs = (item, st) => Object.fromEntries(Object.entries(item.elements).map(([k, list]) => [k, list.find((o) => o.id === st.pick?.[k])]));
export const story = {
  render(env, item) {
    const st = env.item(item.id);
    const objs = pickedObjs(item, st);
    const ready = Object.values(objs).every(Boolean);
    const sentences = st.sentences || {};
    const shown = (st.revealed || []).slice();
    const talk = sentences.talk || "";
    const q = talk.match(/["“]([^"”]+)["”]/);
    const body = html`<div class="q-story-stage">${raw(storyStageSVG(objs, shown, q ? q[1] : "", S(env, "A stage that acts out the story you write, one part at a time.", "Un escenario que representa el cuento que escribes, una parte a la vez."), ui.anim === item.id && !calm()))}</div>
      <div class="q-pickers">${Object.entries(item.elements).map(([k, list]) => html`<fieldset class="q-pickset"><legend>${{ character: T(env, "Character", "Personaje"), setting: T(env, "Place", "Lugar"), problem: T(env, "Problem", "Problema") }[k]}</legend>
          <div class="q-picks" role="radiogroup">${list.map((o) => html`<button type="button" class="q-pick ${st.pick?.[k] === o.id ? "is-on" : ""}" role="radio" aria-checked="${String(st.pick?.[k] === o.id)}" data-q-act="pick-el" data-kind="${k}" data-id="${o.id}" ${st.revealed?.length ? html`disabled` : ""}><svg viewBox="-34 -40 68 80" width="44" height="52" aria-hidden="true">${raw(glyphSVG(o.glyph, 0, 0, 1))}</svg><span>${o.label}</span></button>`)}</div></fieldset>`)}</div>
      ${ready ? "" : html`<p class="fine" role="status">${T(env, "Pick a character, a place and a problem to begin.", "Elige un personaje, un lugar y un problema para empezar.")}</p>`}
      ${ready ? html`<ol class="q-slots">${item.slots.map((slot, i) => {
            const saved = sentences[slot.id];
            const open = i === 0 || sentences[item.slots[i - 1].id];
            const text = ui.text[`${item.id}:${slot.id}`] ?? saved ?? "";
            const ctx = { pickedTerms: (slot.picks || []).map((k) => objs[k]?.terms || []).filter((t) => t.length) };
            const key = `${item.id}:${slot.id}`;
            const results = ui.ready[key] ? checkWriting(text, slot.checks, ctx, st.override?.[slot.id] || []) : null;
            return html`<li class="q-slot ${saved ? "is-done" : ""}" data-slot="${slot.id}"><h4>${i + 1}. ${slot.label}</h4>
              ${open
                ? html`<p class="fine">${slot.hint}</p>
                  <textarea rows="2" class="q-textarea" data-q-act="slot-text" data-slot="${slot.id}" aria-label="${slot.label}" ${saved ? html`readonly` : ""}>${text}</textarea>
                  ${results ? checklistHTML(env.I, results.map((r) => ({ ...r, id: `${slot.id}.${r.id}` })), (st.override?.[slot.id] || []).map((x) => `${slot.id}.${x}`)) : ""}
                  ${saved ? html`<p class="q-fb is-ok">${icon("check")} ${T(env, "Saved. Watch the stage.", "Guardado. Mira el escenario.")}</p>` : html`<div class="q-actions"><button type="button" class="btn" data-q-act="slot-check" data-slot="${slot.id}">${T(env, "Check", "Revisar")}</button><button type="button" class="btn btn-primary" data-q-act="slot-save" data-slot="${slot.id}">${T(env, "Save and act it out", "Guardar y representarlo")}</button></div>`}`
                : html`<p class="fine">${T(env, "Write the part above first.", "Escribe primero la parte anterior.")}</p>`}</li>`;
          })}</ol>` : ""}`;
    return itemShell(env, item, body, itemDone(item, st), { title: T(env, "Build your story", "Construye tu cuento") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    const act = el.dataset.qAct;
    if (act === "pick-el") {
      (st.pick ||= {})[el.dataset.kind] = el.dataset.id;
      env.save();
      return (env.rerender(), true);
    }
    const slotId = act === "override" ? el.dataset.check.split(".")[0] : el.dataset.slot;
    const slot = item.slots.find((s) => s.id === slotId);
    if (!slot) return false;
    const objs = pickedObjs(item, st);
    const ctx = { pickedTerms: (slot.picks || []).map((k) => objs[k]?.terms || []).filter((t) => t.length) };
    const text = (ui.text[`${item.id}:${slot.id}`] ?? st.sentences?.[slot.id] ?? "").trim();
    if (act === "override") {
      const id = el.dataset.check.split(".").slice(1).join(".");
      const o = ((st.override ||= {})[slot.id] ||= []);
      el.checked ? o.push(id) : o.splice(o.indexOf(id), 1);
      return (env.save(), env.rerender(), true);
    }
    if (act === "slot-check") {
      ui.ready[`${item.id}:${slot.id}`] = true;
      const res = checkWriting(text, slot.checks, ctx, st.override?.[slot.id] || []);
      say(env, requiredMet(res) ? "recognize" : "elaborate");
      return (env.rerender(), true);
    }
    if (act === "slot-save") {
      ui.ready[`${item.id}:${slot.id}`] = true;
      const res = checkWriting(text, slot.checks, ctx, st.override?.[slot.id] || []);
      if (!requiredMet(res)) return (say(env, "elaborate"), env.rerender(), true);
      (st.sentences ||= {})[slot.id] = text;
      st.revealed = [...new Set([...(st.revealed || []), slot.reveals])];
      st.done = item.slots.every((s) => st.sentences[s.id]);
      st.at = now();
      ui.anim = item.id;
      say(env, st.done ? "recognize" : "next");
      env.save();
      return (env.rerender(), true);
    }
    return false;
  },
  change(el, env, item) {
    if (el.dataset.qAct !== "slot-text") return false;
    ui.text[`${item.id}:${el.dataset.slot}`] = el.value;
    return true;
  },
};

// ── forge: Word Forge ─────────────────────────────────────────────────────────────────────────────────────────────
const buildKey = (b) => [b.prefix || "", b.root || "", b.suffix || ""].join("|");
export const forge = {
  render(env, item) {
    const st = env.item(item.id);
    const src = item.tasksFrom ? find(env, item.tasksFrom) : item;
    const { prefixes, roots, suffixes } = src.parts;
    const b = st.build || {};
    const sel = (kind, list, label) => html`<fieldset class="q-pickset"><legend>${label}</legend><div class="q-picks" role="radiogroup">${kind !== "root" ? html`<button type="button" class="q-pick ${!b[kind] ? "is-on" : ""}" role="radio" aria-checked="${String(!b[kind])}" data-q-act="part" data-kind="${kind}" data-id="">${T(env, "none", "ninguno")}</button>` : ""}${list.map((p) => html`<button type="button" class="q-pick ${b[kind] === p.id ? "is-on" : ""}" role="radio" aria-checked="${String(b[kind] === p.id)}" data-q-act="part" data-kind="${kind}" data-id="${p.id}"><strong>${p.text}</strong>${p.meaning ? html`<span class="fine">${p.meaning}</span>` : ""}</button>`)}</div></fieldset>`;
    const parts = { prefix: prefixes.find((p) => p.id === b.prefix), root: roots.find((p) => p.id === b.root), suffix: suffixes.find((p) => p.id === b.suffix) };
    const last = st.last;
    const task = item.mode === "tasks" ? item.tasks.find((t) => !(st.tdone || []).includes(t.id)) : null;
    const anvil = html`<div class="q-anvil ${last?.word ? "is-lit" : ""}" aria-live="polite">
        <div class="q-tiles" aria-hidden="true">${parts.prefix ? html`<span class="q-tile is-pre">${parts.prefix.text}</span>` : ""}${parts.root ? html`<span class="q-tile is-root">${parts.root.text}</span>` : html`<span class="q-tile is-empty">?</span>`}${parts.suffix ? html`<span class="q-tile is-suf">${parts.suffix.text}</span>` : ""}</div>
        ${last ? (last.word ? html`<p class="q-forged"><strong>${last.word}</strong> <span>${last.meaning}</span></p><p class="fine">${[parts.prefix && `${parts.prefix.text} = ${parts.prefix.meaning}`, parts.root && (parts.root.meaning ? `${parts.root.text} = ${parts.root.meaning}` : null), parts.suffix && `${parts.suffix.text} = ${parts.suffix.meaning}`].filter(Boolean).join(" · ")}</p>` : html`<p class="q-fb is-look">${last.msg || T(env, "The forge stays dark: those parts do not make a word we know. Try other parts.", "La fragua sigue oscura: esas partes no forman una palabra conocida. Prueba otras partes.")}</p>`) : html`<p class="fine">${T(env, "Pick parts, then press the button.", "Elige partes y pulsa el botón.")}</p>`}</div>`;
    const body = html`${item.mode === "tasks" ? html`<ol class="q-tasks">${item.tasks.map((t) => html`<li class="${(st.tdone || []).includes(t.id) ? "is-done" : t === task ? "is-now" : ""}">${(st.tdone || []).includes(t.id) ? html`${icon("check")} ` : ""}${t.ask}</li>`)}</ol>` : html`<p class="fine" role="status">${T(env, `${(st.found || []).length} of ${item.need} words forged.`, `${(st.found || []).length} de ${item.need} palabras forjadas.`)}</p>`}
      ${sel("prefix", prefixes, T(env, "Beginning (prefix)", "Comienzo (prefijo)"))}${sel("root", roots, T(env, "Base word or root", "Palabra base o raíz"))}${sel("suffix", suffixes, T(env, "Ending (suffix)", "Final (sufijo)"))}
      ${anvil}
      ${st.done ? html`<p class="q-fb is-ok" role="status">${icon("check")} ${T(env, "Done. Your forged words:", "Listo. Tus palabras forjadas:")} ${(st.found || []).join(", ")}</p>` : html`<button type="button" class="btn btn-primary" data-q-act="forge-it" ${b.root ? "" : html`disabled`}>${item.mode === "tasks" ? T(env, "Check this build", "Revisar esta construcción") : T(env, "Forge it", "Forjar")}</button>`}
      ${(st.found || []).length && !st.done ? html`<p class="fine">${T(env, "Forged so far:", "Forjadas hasta ahora:")} ${st.found.join(", ")}</p>` : ""}`;
    return itemShell(env, item, body, Boolean(st.done), { title: T(env, "Word Forge", "Fragua de palabras") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    const src = item.tasksFrom ? find(env, item.tasksFrom) : item;
    if (el.dataset.qAct === "part") {
      (st.build ||= {})[el.dataset.kind] = el.dataset.id || "";
      st.last = null;
      env.save();
      return (env.rerender(), true);
    }
    if (el.dataset.qAct !== "forge-it") return false;
    const hit = forgeWord(src.table, st.build || {});
    const key = buildKey(st.build || {});
    if (item.mode === "tasks") {
      const task = item.tasks.find((t) => !(st.tdone || []).includes(t.id));
      if (!hit) st.last = { none: true };
      else if (task && key === task.want) {
        st.found = [...new Set([...(st.found || []), hit.word])];
        st.tdone = [...(st.tdone || []), task.id];
        st.last = { word: hit.word, meaning: hit.meaning };
        st.done = st.tdone.length === item.tasks.length;
        say(env, st.done ? "recognize" : "next");
      } else {
        st.last = { msg: S(env, `That makes "${hit.word}": ${hit.meaning}. Does that match the order? Try different parts.`, `Eso forma "${hit.word}": ${hit.meaning}. ¿Coincide con el pedido? Prueba otras partes.`) };
        say(env, "hint");
      }
    } else if (!hit) st.last = { none: true };
    else {
      st.found = [...new Set([...(st.found || []), hit.word])];
      st.last = { word: hit.word, meaning: hit.meaning };
      if (st.found.length >= item.need) {
        st.done = true;
        say(env, "recognize");
      }
    }
    env.save();
    return (env.rerender(), true);
  },
};
// ── simulate: the Science City model ───────────────────────────────────────────────────────────────────────────────
export const simulate = {
  render(env, item) {
    const st = env.item(item.id);
    const m = item.model;
    const picked = st.picked || [];
    const cur = runCityModel(m, picked);
    const eff = (e) => Object.entries(e).map(([k, v]) => `${m.labels[k].split(" (")[0]} ${v > 0 ? "+" : "−"}${Math.abs(v)}`).join(", ");
    const body = html`<div class="q-model"><h4>${T(env, "Model rules (made-up numbers for a fictional city)", "Reglas del modelo (números inventados para una ciudad ficticia)")}</h4>
        <p class="fine">${T(env, `Start: ${m.labels.temp} is ${m.base.temp}. ${m.labels.energy} is ${m.base.energy}. Budget: ${m.budget} points.`, `Inicio: ${m.labels.temp} es ${m.base.temp}. ${m.labels.energy} es ${m.base.energy}. Presupuesto: ${m.budget} puntos.`)}</p>
        <ul class="q-projects">${m.projects.map((p) => html`<li><label class="q-proj ${picked.includes(p.id) ? "is-on" : ""}"><input type="checkbox" data-q-act="project" data-id="${p.id}" ${picked.includes(p.id) ? html`checked` : ""}/> <span><strong>${p.label}</strong> <span class="q-cost">${p.cost} ${T(env, "points", "puntos")}</span><small>${eff(p.effect)}. ${p.note}</small></span></label></li>`)}</ul></div>
      <p class="q-budget ${cur.withinBudget ? "" : "is-over"}" role="status">${T(env, `Spent ${cur.spent} of ${m.budget} points.`, `Gastados ${cur.spent} de ${m.budget} puntos.`)} ${cur.withinBudget ? "" : T(env, "Over budget. Remove a project.", "Te pasaste del presupuesto. Quita un proyecto.")}</p>
      <button type="button" class="btn btn-primary" data-q-act="run-model" ${picked.length && cur.withinBudget ? "" : html`disabled`}>${T(env, "Run the model", "Ejecutar el modelo")}</button>
      ${st.ran && st.result
        ? html`<figure class="q-city">${raw(citySVG(st.picked, st.result.metrics, S(env, "The fictional city of Marlow after your chosen projects.", "La ciudad ficticia de Marlow después de los proyectos elegidos.")))}<figcaption>
            <table class="q-table"><caption class="visually-hidden">${S(env, "Model results", "Resultados del modelo")}</caption><thead><tr><th></th><th>${T(env, "Before", "Antes")}</th><th>${T(env, "After", "Después")}</th></tr></thead><tbody>${Object.keys(m.base).map((k) => html`<tr><th scope="row">${m.labels[k]}</th><td>${m.base[k]}</td><td><strong>${st.result.metrics[k]}</strong></td></tr>`)}</tbody></table></figcaption></figure>
          <p class="fine">${T(env, "Change your projects and run it again to compare. The picture and the numbers always come from the same table.", "Cambia tus proyectos y ejecútalo otra vez para comparar. La imagen y los números siempre salen de la misma tabla.")}</p>`
        : ""}`;
    return itemShell(env, item, body, Boolean(st.done), { title: T(env, "Test the plan", "Prueba el plan") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    if (el.dataset.qAct === "project") {
      const s = new Set(st.picked || []);
      el.checked ? s.add(el.dataset.id) : s.delete(el.dataset.id);
      st.picked = [...s];
      st.ran = false;
      st.done = false;
      env.save();
      return (env.rerender(), true);
    }
    if (el.dataset.qAct === "run-model") {
      const r = runCityModel(item.model, st.picked || []);
      if (!r.withinBudget || !st.picked?.length) return true;
      st.result = { metrics: r.metrics, spent: r.spent };
      st.ran = true;
      st.done = true;
      say(env, "recognize");
      env.save();
      return (env.rerender(), true);
    }
    return false;
  },
};

// ── route: plan a route on a grid, then watch the walker walk exactly that ──────────────────────────────────────────
const DIRNAME = { N: ["north", "norte"], E: ["east", "este"], S: ["south", "sur"], W: ["west", "oeste"] };
export const route = {
  render(env, item) {
    const st = env.item(item.id);
    const moves = st.moves || [];
    const plan = walkRoute(item.grid, moves);
    const shown = st.walked ? st.walked : plan;
    const body = html`<div class="q-route-wrap">${raw(routeSVG(item.grid, shown.path, st.walked?.failed ? st.walked.at : null, { animate: ui.anim === item.id && !calm(), alt: S(env, `Map grid. The route has ${moves.length} steps.`, `Cuadrícula del mapa. La ruta tiene ${moves.length} pasos.`) }))}</div>
      <div class="q-dpad" role="group" aria-label="${S(env, "Add a step", "Agregar un paso")}">${["N", "W", "E", "S"].map((d) => html`<button type="button" class="btn q-d q-d-${d}" data-q-act="step" data-dir="${d}" aria-label="${S(env, `Add ${DIRNAME[d][0]}`, `Agregar ${DIRNAME[d][1]}`)}">${{ N: "↑", S: "↓", E: "→", W: "←" }[d]} ${S(env, DIRNAME[d][0], DIRNAME[d][1])}</button>`)}</div>
      <p class="q-steps-list" aria-live="polite">${moves.length ? T(env, `My steps (${moves.length}): `, `Mis pasos (${moves.length}): `) : T(env, "No steps yet.", "Aún no hay pasos.")}${moves.map((m) => DIRNAME[m][0]).join(", ")}</p>
      <div class="q-actions"><button type="button" class="btn" data-q-act="undo" ${moves.length ? "" : html`disabled`}>${T(env, "Undo", "Deshacer")}</button><button type="button" class="btn" data-q-act="clear" ${moves.length ? "" : html`disabled`}>${T(env, "Clear", "Borrar")}</button><button type="button" class="btn btn-primary" data-q-act="walk" ${moves.length ? "" : html`disabled`}>${T(env, "Walk it", "Recorrerlo")}</button></div>
      ${st.walked ? html`<p class="q-fb ${st.walked.reached ? "is-ok" : "is-look"}" role="status">${st.walked.reached ? T(env, "You reached the cave. Your route works.", "Llegaste a la cueva. Tu ruta funciona.") : st.walked.failed ? T(env, `Stopped at step ${st.walked.step}: that step ${st.walked.failed === "edge" ? "leaves the map" : "goes into the river"}. Change your route.`, `Te detuviste en el paso ${st.walked.step}: ese paso ${st.walked.failed === "edge" ? "sale del mapa" : "entra al río"}. Cambia tu ruta.`) : T(env, "The walk ended before the cave. Add more steps.", "El recorrido terminó antes de la cueva. Agrega más pasos.")}</p>` : ""}`;
    return itemShell(env, item, body, Boolean(st.done), { title: T(env, "Plan the route", "Planea la ruta") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    const act = el.dataset.qAct;
    if (act === "step") ((st.moves ||= []).push(el.dataset.dir), (st.walked = null));
    else if (act === "undo") (st.moves.pop(), (st.walked = null));
    else if (act === "clear") ((st.moves = []), (st.walked = null));
    else if (act === "walk") {
      st.walked = walkRoute(item.grid, st.moves || []);
      st.done = st.walked.reached;
      ui.anim = item.id;
      say(env, st.done ? "recognize" : "hint");
    } else return false;
    env.save();
    return (env.rerender(), true);
  },
};

// ── timeline: order events with up and down buttons ──────────────────────────────────────────────────────────────────
function startOrder(item) {
  const n = item.events.length;
  const ids = item.events.map((e) => e.id);
  const shuffled = [...ids].sort((a, b) => ((ids.indexOf(a) * 7 + 3) % n) - ((ids.indexOf(b) * 7 + 3) % n));
  return shuffled.every((id, i) => id === ids[i]) ? ids.reverse() : shuffled;
}
export const timeline = {
  render(env, item) {
    const st = env.item(item.id);
    st.order ||= startOrder(item);
    const rows = Object.fromEntries((st.last?.rows || []).map((r, i) => [r.id, { ...r, i }]));
    const body = html`<ol class="q-timeline">${st.order.map((id, i) => {
        const e = item.events.find((x) => x.id === id);
        const r = rows[id];
        return html`<li class="q-tl ${r ? (r.ok ? "is-ok" : "is-look") : ""}"><span class="q-tl-n" aria-hidden="true">${i + 1}</span><span class="q-tl-text">${e.text}${r && !r.ok ? html`<small class="q-fb is-look">${r.hint}</small>` : ""}</span>
          <span class="q-tl-btns"><button type="button" class="btn small" data-q-act="earlier" data-id="${id}" aria-label="${S(env, "Move earlier: ", "Mover antes: ")}${e.text}" ${i === 0 || st.done ? html`disabled` : ""}>↑</button><button type="button" class="btn small" data-q-act="later" data-id="${id}" aria-label="${S(env, "Move later: ", "Mover después: ")}${e.text}" ${i === st.order.length - 1 || st.done ? html`disabled` : ""}>↓</button></span></li>`;
      })}</ol>
      ${st.done ? html`<p class="q-fb is-ok" role="status">${icon("check")} ${T(env, "The events are in the order they happened.", "Los sucesos están en el orden en que ocurrieron.")}</p>` : html`<button type="button" class="btn btn-primary" data-q-act="check-order">${T(env, "Check the order", "Revisar el orden")}</button>${st.last ? html`<p class="fine" role="status">${T(env, `${st.last.correct} of ${st.order.length} in the right place.`, `${st.last.correct} de ${st.order.length} en su lugar.`)}</p>` : ""}`}`;
    return itemShell(env, item, body, Boolean(st.done), { title: T(env, "Put events in order", "Ordena los sucesos") });
  },
  click(el, env, item) {
    const st = env.item(item.id);
    const act = el.dataset.qAct;
    if (act === "earlier" || act === "later") {
      const i = st.order.indexOf(el.dataset.id);
      const j = act === "earlier" ? i - 1 : i + 1;
      if (j < 0 || j >= st.order.length) return true;
      [st.order[i], st.order[j]] = [st.order[j], st.order[i]];
      st.last = null;
      env.save();
      env.rerender();
      return true;
    }
    if (act === "check-order") {
      st.last = checkTimeline(item, st.order);
      st.done = st.last.done;
      say(env, st.done ? "recognize" : "hint");
      env.save();
      return (env.rerender(), true);
    }
    return false;
  },
};
