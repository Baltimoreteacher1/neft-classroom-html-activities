// mountRunner: runs a list of items one at a time. Events are delegated on `root`; radios, checkboxes and text boxes
// keep their own DOM state (so focus and arrow keys are never disturbed) and the stage is re-rendered only when the
// task itself changes (build tiles, a check, a retry). First attempts are reported; retries are reported as retries.
import { toHtml, html } from "../../util.js";
import { makeI18n } from "../../i18n.js";
import { ensureSayListener } from "../art.js";
import { gradeItem } from "./grade.js";
import { actionsHTML, feedbackHTML, renderItem } from "./render.js";

const MOUNTED = Symbol("vaa-runner");
const lazy = (p) => {
  let m;
  return () => (m ||= p().catch(() => null));
};
const speechMod = lazy(() => import("../../speech.js"));
const recMod = lazy(() => import("../../recorder.js"));
const words = (t) => (String(t || "").match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;

/** Evidence rows for one graded check: which words get credit for which result. */
export function creditsFor(item, res) {
  if (item.mode === "match" || item.mode === "sort") {
    const ids = item.wordIds || [];
    return ids.map((id, i) => ({ wordId: id, ok: Boolean(res.rowOk?.[i]) })).filter((x) => x.wordId);
  }
  const ids = [...new Set([item.wordId, ...(item.wordIds || [])].filter(Boolean))];
  if (!ids.length) return [];
  return res.ok ? ids.map((wordId) => ({ wordId, ok: true })) : [{ wordId: ids[0], ok: false }];
}

export function mountRunner(root, { items = [], ctx = {}, onResult, onDone, onItem } = {}) {
  root[MOUNTED]?.destroy();
  const I = ctx.I || makeI18n("en");
  const sup = ctx.supports || {};
  const index = new Map();
  for (const w of [...(ctx.unit?.words || []), ...(ctx.pool || [])]) index.set(w.id, w);
  const C = { ...ctx, I, supports: sup, lookup: (id) => ctx.lookup?.(id) || index.get(id) || null };
  const list = items.filter(Boolean);
  const states = list.map(() => ({ response: null, result: null, attempt: 0, hint: false, done: false, revealed: false, used: new Set(), hints: 0 }));
  const results = [];
  let at = 0;
  let alive = true;
  let recKey = "";
  ensureSayListener();

  root.classList.add("vaa-root");
  root.innerHTML = `<div class="vaa-runner" data-vaa-runner>
    <div class="vaa-progress"><p class="vaa-count-line" data-vaa-pos></p><div class="vaa-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="0" aria-label="${I.S("Progress", "Progreso")}"><span data-vaa-fill></span></div></div>
    <div class="vaa-stage" data-vaa-stage></div>
    <div class="vaa-feedback" data-vaa-feedback aria-live="polite"></div>
    <div class="vaa-actions" data-vaa-actions></div></div>`;
  const $ = (s) => root.querySelector(s);
  const stage = $("[data-vaa-stage]");
  const fb = $("[data-vaa-feedback]");
  const actions = $("[data-vaa-actions]");
  speechMod().then((m) => {
    if (!m?.canSpeak?.() && alive) root.classList.add("vaa-nospeech");
  });

  const cur = () => list[at];
  const st = () => states[at];
  const phaseWrong = () => Boolean(st().result && !st().result.ok && !st().result.empty);

  // ── state <-> DOM ─────────────────────────────────────────────────────────
  function readDom() {
    const it = cur();
    const s = st();
    const val = (name) => stage.querySelector(`input[name="${name}"]:checked`)?.value;
    const uidName = (suffix) => [...stage.querySelectorAll("input[type=radio]")].map((r) => r.name).find((n) => n.endsWith(suffix));
    switch (it.mode) {
      case "choice": {
        const v = stage.querySelector("input[type=radio]:checked")?.value;
        return v == null ? null : Number(v);
      }
      case "steps":
        return it.steps.map((_, i) => {
          const v = stage.querySelector(`[data-vaa-step="${i}"] input[type=radio]:checked`)?.value;
          return v == null ? null : Number(v);
        });
      case "typed": {
        const bank = val("vaa-bank");
        return bank ?? stage.querySelector("[data-vaa-typed]")?.value ?? "";
      }
      case "sort":
      case "match": {
        const r = {};
        it.items.forEach((_, i) => {
          const v = val(`vaa-r${i}`);
          if (v != null) r[i] = Number(v);
        });
        return r;
      }
      case "order":
      case "build":
        return s.response || [];
      case "write":
        return stage.querySelector("[data-vaa-text]")?.value ?? s.response ?? "";
      case "speak": {
        const r = s.response || {};
        return {
          text: stage.querySelector("[data-vaa-text]")?.value ?? r.text ?? "",
          said: Boolean(stage.querySelector("[data-vaa-said]")?.checked),
          recorded: Boolean(r.recorded),
          checked: [...stage.querySelectorAll("[data-vaa-check]:checked")].map((x) => Number(x.dataset.vaaCheck)),
        };
      }
      default:
        return null;
    }
  }
  const keep = () => {
    st().response = readDom();
  };

  function draw(focusKey) {
    const it = cur();
    const s = st();
    s.checked = Boolean(s.result);
    stage.innerHTML = toHtml(renderItem(it, C, s));
    fb.innerHTML = toHtml(feedbackHTML(it, C, s));
    actions.innerHTML = toHtml(actionsHTML(it, C, s, { last: at === list.length - 1 }));
    $("[data-vaa-pos]").textContent = I.S(`Question ${at + 1} of ${list.length}`, `Pregunta ${at + 1} de ${list.length}`);
    const bar = $(".vaa-bar");
    bar.setAttribute("aria-valuenow", String(at + (s.done ? 1 : 0)));
    $("[data-vaa-fill]").style.width = `${((at + (s.done ? 1 : 0)) / Math.max(1, list.length)) * 100}%`;
    root.classList.toggle("vaa-early", (it.band || ctx.band) === "early");
    if (it.mode === "speak") prepareSpeak();
    if (focusKey) stage.querySelector(`[data-vaa-focus="${focusKey}"]`)?.focus();
  }
  const focusFirstControl = () =>
    (stage.querySelector("input:not([disabled]):not([type=checkbox]), textarea:not([readonly]), button:not([disabled])") || stage).focus?.();
  const focusPrimary = () => (actions.querySelector(".vaa-primary") || actions.querySelector("button"))?.focus();

  async function prepareSpeak() {
    const rec = await recMod();
    const panel = stage.querySelector("[data-vaa-rec-panel]");
    if (!panel) return;
    if (!rec?.canRecord?.()) {
      panel.querySelector("[data-vaa-rec]").hidden = true;
      panel.querySelector("[data-vaa-recstate]").textContent = I.S("Recording is not available here. Say your answer out loud, then tick the box, or type it.", "Aquí no se puede grabar. Di tu respuesta en voz alta y marca la casilla, o escríbela.");
    }
    showTakes(rec);
  }
  function showTakes(rec) {
    const box = stage.querySelector("[data-vaa-takes]");
    if (!box || !rec) return;
    const takes = rec.takesFor(`vaa:${cur().id}`);
    box.innerHTML = takes.map((t, i) => `<figure class="vaa-take"><figcaption>${I.S("Take", "Toma")} ${i + 1} (${t.seconds}s)</figcaption><audio controls src="${t.url}"></audio></figure>`).join("");
    const s = st();
    s.response = { ...(s.response || {}), recorded: takes.length > 0 };
  }

  // ── grading ───────────────────────────────────────────────────────────────
  function usedSupports(it) {
    const s = st();
    const u = new Set(s.used);
    if (sup.chunked) u.add("chunked");
    if (sup.picture && it.visual) u.add("picture");
    if (sup.glossaryEs && it.es) u.add("glossaryEs");
    return [...u];
  }
  function check() {
    const it = cur();
    const s = st();
    keep();
    const useItem = sup.anyLanguageResponse && it.mode === "write" ? { ...it, spec: { ...it.spec, anyLang: true } } : it;
    const res = gradeItem(useItem, s.response, { I });
    s.result = res;
    s.checked = true;
    if (res.empty) {
      draw();
      focusFirstControl();
      return;
    }
    s.attempt += 1;
    const entry = { itemId: it.id, type: it.type, firstTry: s.attempt === 1, ok: res.ok, attempt: s.attempt };
    if (s.attempt === 1) results.push({ ...entry, wordIds: [it.wordId, ...(it.wordIds || [])].filter(Boolean), review: Boolean(res.review) });
    else results.find((r) => r.itemId === it.id).retried = true;
    const sp = usedSupports(it);
    for (const c of creditsFor(it, res))
      onResult?.({
        wordId: c.wordId,
        dim: it.dim,
        ok: c.ok,
        sup: sp,
        type: it.resultType || it.type,
        activity: it.type,
        mode: it.mode,
        itemId: it.id,
        firstTry: s.attempt === 1,
        attempt: s.attempt,
        hints: s.hints,
        review: Boolean(res.review),
        selfReported: Boolean(res.selfReported),
        ...(res.review && it.mode === "write" ? { response: String(s.response || ""), words: res.words } : {}),
      });
    onItem?.({ item: it, result: res, attempt: s.attempt, supports: sp });
    if (res.ok && !res.review) s.done = true;
    draw();
    focusPrimary();
  }
  function retry() {
    const s = st();
    const review = cur().mode === "write" || cur().mode === "speak";
    s.result = null;
    if (!review) s.response = cur().mode === "order" || cur().mode === "build" ? [] : null;
    draw();
    focusFirstControl();
  }
  function finishItem(revealed) {
    const s = st();
    s.done = true;
    if (revealed) {
      s.revealed = true;
      const r = results.find((x) => x.itemId === cur().id);
      if (r) r.revealed = true;
    }
    draw();
    focusPrimary();
  }
  async function stopRecording() {
    const rec = await recMod();
    if (rec && recKey) await rec.stop();
    recKey = "";
  }
  async function next() {
    await stopRecording();
    if (at < list.length - 1) {
      at += 1;
      draw();
      stage.querySelector(".vaa-prompt")?.focus();
      return;
    }
    summary();
  }
  function summary() {
    const first = results.filter((r) => r.firstTry && r.ok && !r.review).length;
    const scored = results.filter((r) => !r.review).length;
    const reviewN = results.filter((r) => r.review).length;
    const again = results.filter((r) => !r.review && !(r.firstTry && r.ok));
    const hw = [...new Set(again.flatMap((r) => r.wordIds))].map((id) => C.lookup(id)?.hw).filter(Boolean);
    const out = { total: list.length, scored, correctFirstTry: first, reviewItems: reviewN, revisit: again.flatMap((r) => r.wordIds), results: results.map((r) => ({ ...r })) };
    root.innerHTML = toHtml(html`<section class="vaa-summary" tabindex="-1" aria-labelledby="vaa-sum-h">
      <h3 id="vaa-sum-h">${I.T("All done", "Terminaste")}</h3>
      <p>${I.T(`You got ${first} of ${scored} right on the first try.`, `Acertaste ${first} de ${scored} en el primer intento.`)}</p>
      ${reviewN ? html`<p>${I.T(`${reviewN} speaking or writing ${reviewN === 1 ? "response was" : "responses were"} saved for your teacher to read.`, `${reviewN} respuesta(s) para hablar o escribir se guardó para que tu maestro la lea.`)}</p>` : ""}
      ${hw.length ? html`<p>${I.T("Words to look at again", "Palabras para repasar")}: <strong lang="en">${hw.join(", ")}</strong></p>` : ""}
    </section>`);
    root.querySelector(".vaa-summary")?.focus();
    onDone?.(out);
  }

  // ── events ────────────────────────────────────────────────────────────────
  async function onClick(e) {
    const t = e.target.closest("button, summary, [data-vaa-model]");
    if (!t || !root.contains(t) || t.disabled) return;
    const it = cur();
    if (!it) return;
    const s = st();
    if (t.matches("[data-vaa-check]")) return check();
    if (t.matches("[data-vaa-next]")) return next();
    if (t.matches("[data-vaa-retry]")) return retry();
    if (t.matches("[data-vaa-finish]")) return finishItem(false);
    if (t.matches("[data-vaa-reveal]")) return finishItem(true);
    if (t.matches("[data-vaa-hint]")) {
      s.hint = !s.hint;
      if (s.hint) s.hints += 1;
      fb.innerHTML = toHtml(feedbackHTML(it, C, s));
      actions.innerHTML = toHtml(actionsHTML(it, C, s, { last: at === list.length - 1 }));
      actions.querySelector("[data-vaa-hint]")?.focus();
      return;
    }
    if (t.matches("[data-vaa-showtext]")) {
      const box = t.closest(".vaa-listen-box");
      const txt = box.querySelector(".vaa-listen-text");
      const open = txt.classList.toggle("vaa-collapsed") === false;
      t.setAttribute("aria-expanded", String(open));
      s.showText = open;
      return;
    }
    if (t.matches("[data-vaa-tile]")) {
      keep();
      const tile = it.choices[Number(t.dataset.vaaTile)];
      s.response = [...(s.response || []), tile];
      draw();
      return (stage.querySelector("[data-vaa-tile]") || actions.querySelector("[data-vaa-check]"))?.focus();
    }
    if (t.matches("[data-vaa-untile]")) {
      keep();
      const i = Number(t.dataset.vaaUntile);
      s.response = (s.response || []).filter((_, k) => k !== i);
      draw();
      return (stage.querySelector("[data-vaa-tile]") || stage.querySelector("[data-vaa-untile]"))?.focus();
    }
    if (t.matches("[data-vaa-undo]")) {
      keep();
      s.response = (s.response || []).slice(0, -1);
      draw();
      return (stage.querySelector("[data-vaa-undo]:not([disabled])") || stage.querySelector("[data-vaa-tile]"))?.focus();
    }
    if (t.matches("[data-vaa-clear]")) {
      s.response = [];
      draw();
      return stage.querySelector("[data-vaa-tile]")?.focus();
    }
    if (t.matches("[data-vaa-bank]")) {
      const inp = stage.querySelector("[data-vaa-typed]");
      inp.value = t.dataset.vaaBank;
      s.used.add("wordBank");
      s.response = inp.value;
      return inp.focus();
    }
    if (t.matches("[data-vaa-insert]")) {
      const ta = stage.querySelector("[data-vaa-text]");
      if (!ta) return;
      const add = t.dataset.vaaInsert;
      const needsSpace = ta.value && !/\s$/.test(ta.value);
      ta.value += `${needsSpace ? " " : ""}${add}`;
      s.used.add(t.dataset.vaaSup);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      return ta.focus();
    }
    if (t.matches("summary") && t.closest("[data-vaa-model]")) s.used.add("model");
    if (t.matches("[data-vaa-rec]")) {
      const rec = await recMod();
      const state = stage.querySelector("[data-vaa-recstate]");
      try {
        recKey = `vaa:${it.id}`;
        await rec.start(recKey, { onStop: () => showTakes(rec) });
        t.hidden = true;
        const stop = stage.querySelector("[data-vaa-stoprec]");
        stop.hidden = false;
        stop.focus();
        state.textContent = I.S("Recording. Say your answer, then press Stop.", "Grabando. Di tu respuesta y luego presiona Detener.");
      } catch {
        recKey = "";
        state.textContent = I.S("The microphone is not available. Say your answer out loud and tick the box, or type it.", "El micrófono no está disponible. Di tu respuesta en voz alta y marca la casilla, o escríbela.");
      }
      return;
    }
    if (t.matches("[data-vaa-stoprec]")) {
      await stopRecording();
      t.hidden = true;
      const r = stage.querySelector("[data-vaa-rec]");
      if (r) {
        r.hidden = false;
        r.focus();
      }
      const state = stage.querySelector("[data-vaa-recstate]");
      if (state) state.textContent = I.S("Recording saved on this device. Play it back below.", "Grabación guardada en este dispositivo. Escúchala abajo.");
    }
  }
  function onChange(e) {
    const t = e.target;
    if (!root.contains(t)) return;
    const it = cur();
    if (!it) return;
    if (t.matches('input[type="radio"]')) {
      if (it.mode === "steps") {
        const step = t.closest("[data-vaa-step]");
        const next = stage.querySelector(`[data-vaa-step="${Number(step.dataset.vaaStep) + 1}"]`);
        if (next) next.hidden = false;
      }
      t.closest("fieldset")?.querySelectorAll("label").forEach((l) => l.classList.toggle("vaa-sel", l.contains(t) && t.checked));
    }
    if (t.matches("[data-vaa-rehearsed]") && t.checked) st().used.add("rehearsal");
    keep();
  }
  function onInput(e) {
    const t = e.target;
    if (!root.contains(t)) return;
    if (t.matches("[data-vaa-text]") && cur()?.mode === "write") {
      const n = stage.querySelector("[data-vaa-n]");
      if (n) n.textContent = String(words(t.value));
    }
    if (t.matches("[data-vaa-org]")) st().used.add("organizer");
    if (t.matches("[data-vaa-typed], [data-vaa-text]")) keep();
  }
  function onKey(e) {
    if (e.key === "Enter" && e.target.matches?.("[data-vaa-typed]")) {
      e.preventDefault();
      if (!st().done && !phaseWrong()) check();
    }
  }
  function onSay(e) {
    if (e.target.closest(".vaa-say-lg")) return;
    const key = sup.readAloud ? "readAloud" : sup.audio ? "audio" : null;
    if (key) st().used.add(key);
  }
  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  root.addEventListener("input", onInput);
  root.addEventListener("keydown", onKey);
  root.addEventListener("vaa:say", onSay);

  const handle = {
    items: list,
    get index() {
      return at;
    },
    results,
    goTo(i) {
      at = Math.max(0, Math.min(list.length - 1, i));
      draw();
    },
    destroy() {
      if (!alive) return;
      alive = false;
      root.removeEventListener("click", onClick);
      root.removeEventListener("change", onChange);
      root.removeEventListener("input", onInput);
      root.removeEventListener("keydown", onKey);
      root.removeEventListener("vaa:say", onSay);
      stopRecording();
      if (root[MOUNTED] === handle) delete root[MOUNTED];
    },
  };
  root[MOUNTED] = handle;
  if (!list.length) {
    root.innerHTML = `<p class="vaa-empty" role="note">${I.S("There are no activities here yet.", "Todavía no hay actividades aquí.")}</p>`;
    onDone?.({ total: 0, scored: 0, correctFirstTry: 0, reviewItems: 0, revisit: [], results: [] });
  } else draw();
  return handle;
}
