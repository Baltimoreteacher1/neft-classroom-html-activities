// "Real problems" practice for the authored bank (Phase 6B/6C/6D, learner side). A short, untimed set of original
// problems for the learner's grade: every item type works with a mouse, a keyboard or a finger, hints come one rung at a
// time and make the answer "supported", a wrong answer gets the author's note on the likely slip and a retry, and the
// five-layer explanation is there after. Only answers the page can check are recorded as evidence; written reasoning is
// self-checked against a rubric and never counted as mastery. Nothing here is timed.
import { getLang } from "../i18n.js";
import { readLocal, writeLocal } from "../school-tools.js";
import { Workspace } from "./model-lab.js";
import { MathVisualEngine } from "./engine-core.js";
import { loadGradeBank } from "./content-bank.js";
import { MODES, checkResponse, selectItems, side } from "./item-engine.js";
import { buildExplanation, recordItemEvidence } from "./instruction-engine.js";
import { e8Store } from "./e8-local.js";

const lang = () => (getLang() === "es" ? "es" : "en");
const L = (en, es) => (lang() === "es" ? es : en);
const pick = (o) =>
  o && typeof o === "object" ? o[lang()] || o.en : String(o ?? "");
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
const SEEN_KEY = "ewl-fluency-e8-items-v1";
const MAX_TRIES = 2;
const SETS = [
  ["practice", "Practice", "Práctica"],
  ["exit", "Quick check", "Revisión rápida"],
  ["challenge", "Challenge", "Desafío"],
];

export function mountItemPractice(
  host,
  { grade, profileKey = (k) => k, onEvidence = () => {}, announce = () => {} },
) {
  const key = profileKey(SEEN_KEY);
  const seen = () =>
    (Array.isArray(readLocal(key, [])) ? readLocal(key, []) : [])
      .filter((x) => typeof x === "string")
      .slice(-300);
  const remember = (id) =>
    writeLocal(key, [...seen().filter((x) => x !== id), id].slice(-300));
  let bank = null;
  let run = null;
  let draft = {};

  const menu = (note = "") => {
    host.innerHTML = `<section class="e8ip" aria-labelledby="e8ip-title"><h3 id="e8ip-title">${esc(L("Real problems", "Problemas de verdad"))}</h3><p>${esc(L("Original problems for your grade. There is no timer. Hints are fine; they just mean the answer counts as practice with help.", "Problemas originales para tu grado. No hay cronómetro. Las pistas están bien; solo significan que la respuesta cuenta como práctica con ayuda."))}</p>${note ? `<p role="status">${esc(note)}</p>` : ""}<div class="e8gm-row">${SETS.map(([id, en, es]) => `<button type="button" class="e8ap-btn" data-ip-set="${id}">${esc(L(en, es))} <small>(${MODES[id].size})</small></button>`).join("")}</div></section>`;
    host
      .querySelectorAll("[data-ip-set]")
      .forEach((b) =>
        b.addEventListener("click", () => start(b.dataset.ipSet)),
      );
  };

  async function start(mode) {
    host.innerHTML = `<p role="status">${esc(L("Getting your problems…", "Preparando tus problemas…"))}</p>`;
    bank ||= await loadGradeBank(grade);
    const items = selectItems(bank, {
      mode,
      grade,
      exclude: seen(),
      seed: (Date.now() / 60000) | 0,
    });
    // If the learner has seen everything, start the pool over rather than showing nothing.
    const list = items.length
      ? items
      : selectItems(bank, { mode, grade, seed: (Date.now() / 60000) | 0 });
    if (!list.length)
      return menu(
        L(
          "There are no problems for this set yet.",
          "Todavía no hay problemas para este conjunto.",
        ),
      );
    run = { mode, list, i: 0, hints: 0, tries: 0, settled: null, results: [] };
    draft = {};
    draw();
  }

  const item = () => run.list[run.i];

  function input(it) {
    const d = (k) => esc(draft[k] ?? "");
    const settledAttr = run.settled ? "disabled" : "";
    switch (it.type) {
      case "mc":
      case "multi":
        return `<fieldset class="e8ip-set"><legend class="e8ap-count">${esc(it.type === "multi" ? L("Choose all that apply", "Elige todas las que apliquen") : L("Choose one", "Elige una"))}</legend>${it.choices.map((c) => `<label class="e8ip-choice"><input type="${it.type === "multi" ? "checkbox" : "radio"}" name="c" value="${esc(c.id)}" ${(it.type === "multi" ? (draft.multi || []).includes(c.id) : draft.one === c.id) ? "checked" : ""} ${settledAttr}> <span>${esc(pick(c.text))}</span></label>`).join("")}</fieldset>`;
      case "error":
        return `<fieldset class="e8ip-set"><legend class="e8ap-count">${esc(L("Which step has the mistake?", "¿Qué paso tiene el error?"))}</legend>${it.steps.map((s, i) => `<label class="e8ip-choice"><input type="radio" name="s" value="${i + 1}" ${draft.step === String(i + 1) ? "checked" : ""} ${settledAttr}> <span>${esc(L("Step", "Paso"))} ${i + 1}: ${esc(s)}</span></label>`).join("")}</fieldset>`;
      case "numberline": {
        const min = Number(frac(it.line.min));
        const max = Number(frac(it.line.max));
        const step = Number(frac(it.line.step));
        const ticks = [];
        for (let v = min, n = 0; v <= max + 1e-9 && n < 60; v += step, n += 1)
          ticks.push({ v, text: ratio(v, it.line.step) });
        return `<fieldset class="e8ip-set"><legend class="e8ap-count">${esc(L("Choose the point on the number line", "Elige el punto en la recta numérica"))} (${esc(it.line.min)} → ${esc(it.line.max)})</legend><div class="e8gm-row">${ticks.map((t) => `<label class="e8ip-choice"><input type="radio" name="t" value="${esc(t.text)}" ${draft.tick === t.text ? "checked" : ""} ${settledAttr}> <span>${esc(t.text)}</span></label>`).join("")}</div></fieldset>`;
      }
      case "graph":
        return `<fieldset class="e8ip-set"><legend class="e8ap-count">${esc(L("Add each point", "Agrega cada punto"))} (x ${it.grid.xmin}–${it.grid.xmax}, y ${it.grid.ymin}–${it.grid.ymax})</legend><div class="e8gm-row"><label>x <input class="e8ap-input" type="number" data-gx ${settledAttr}></label><label>y <input class="e8ap-input" type="number" data-gy ${settledAttr}></label><button type="button" class="e8ap-btn" data-add-point ${settledAttr}>${esc(L("Add point", "Agregar punto"))}</button></div><ul>${(draft.points || []).map((p, i) => `<li>(${p.join(", ")}) <button type="button" class="e8ap-btn" data-del-point="${i}" ${settledAttr}>${esc(L("Remove", "Quitar"))}</button></li>`).join("")}</ul></fieldset>`;
      case "match":
        return `<fieldset class="e8ip-set"><legend class="e8ap-count">${esc(L("Match each one", "Relaciona cada uno"))}</legend>${it.pairs
          .map(
            (p, i) =>
              `<label class="e8ip-choice">${esc(pick(p.left))} <select data-match="${i}" ${settledAttr}><option value="">${esc(L("Choose…", "Elige…"))}</option>${[
                ...new Set(it.pairs.map((q) => side(q.right))),
              ]
                .sort()
                .map(
                  (r) =>
                    `<option value="${esc(r)}" ${draft.match?.[side(p.left)] === r ? "selected" : ""}>${esc(pick(it.pairs.find((q) => side(q.right) === r).right))}</option>`,
                )
                .join("")}</select></label>`,
          )
          .join("")}</fieldset>`;
      case "sort": {
        const all = it.bins
          .flatMap((b) => b.items)
          .sort((a, b) => side(a).localeCompare(side(b)));
        return `<fieldset class="e8ip-set"><legend class="e8ap-count">${esc(L("Put each one in a group", "Pon cada uno en un grupo"))}</legend>${all.map((x) => `<label class="e8ip-choice">${esc(pick(x))} <select data-sort="${esc(side(x))}" ${settledAttr}><option value="">${esc(L("Choose…", "Elige…"))}</option>${it.bins.map((b, i) => `<option value="${i}" ${String(draft.sort?.[side(x)]) === String(i) ? "selected" : ""}>${esc(pick(b.name))}</option>`).join("")}</select></label>`).join("")}</fieldset>`;
      }
      case "model":
        return `<div class="e8ip-model" data-ip-model></div>`;
      case "constructed":
      case "explain":
        return `<label class="e8ap-label" for="e8ip-text">${esc(L("Write your thinking", "Escribe tu razonamiento"))}</label><textarea id="e8ip-text" rows="4" class="e8ap-input" ${settledAttr}>${d("text")}</textarea>`;
      default:
        return `<label class="e8ap-label" for="e8ip-ans">${esc(L("Your answer", "Tu respuesta"))}</label><input id="e8ip-ans" class="e8ap-input" autocomplete="off" value="${d("ans")}" ${settledAttr}>`;
    }
  }
  const frac = (t) => {
    const m = /^(-?\d+)\/(\d+)$/.exec(String(t));
    return m ? Number(m[1]) / Number(m[2]) : Number(t);
  };
  // Show a tick the way the item writes its step: 3/4 stays 3/4, 0.5 stays 0.5.
  const ratio = (v, stepText) => {
    const m = /^(\d+)\/(\d+)$/.exec(String(stepText));
    if (!m) return String(Math.round(v * 1e6) / 1e6);
    const d = Number(m[2]);
    const n = Math.round(v * d);
    return n % d === 0 ? String(n / d) : `${n}/${d}`;
  };

  function draw(feedback = null) {
    const it = item();
    const total = run.list.length;
    const hint = it.hints?.[run.hints - 1];
    const body = `<section class="e8ip" aria-labelledby="e8ip-q"><header class="e8gm-bar"><button type="button" class="tr-link" data-ip-menu>← ${esc(L("Back", "Volver"))}</button><span class="e8gm-count">${esc(L(`Problem ${run.i + 1} of ${total}`, `Problema ${run.i + 1} de ${total}`))}</span></header><p class="e8ap-count">${esc(it.standard)} · DOK ${it.dok}</p><p id="e8ip-q" class="e8ap-prompt" tabindex="-1">${esc(pick(it.stem))}</p>${input(it)}${!run.settled && it.type !== "constructed" && it.type !== "explain" ? "" : ""}<div class="e8gm-row">${run.settled ? "" : `<button type="button" class="e8ap-btn e8ap-primary" data-ip-check>${esc(it.type === "constructed" || it.type === "explain" ? L("Save and check myself", "Guardar y comprobar yo mismo") : L("Check", "Comprobar"))}</button>${run.hints < (it.hints?.length || 0) ? `<button type="button" class="e8ap-btn" data-ip-hint>${esc(L("Give me a hint", "Dame una pista"))}${run.hints ? ` (${run.hints}/${it.hints.length})` : ""}</button>` : ""}`}</div>${hint ? `<p class="e8ap-why" role="status">${esc(L("Hint", "Pista"))} ${run.hints}: ${esc(pick(hint))}</p>` : ""}<p class="e8ap-why e8gm-feedback" role="status" aria-live="polite">${feedback ? esc(feedback) : ""}</p>${run.settled ? settledHtml(it) : ""}</section>`;
    host.innerHTML = body;
    mountModel(it);
    wire(it);
    (
      host.querySelector("[data-ip-next]") || host.querySelector("#e8ip-q")
    )?.focus({ preventScroll: true });
  }

  let workspace = null;
  function mountModel(it) {
    workspace?.destroy();
    workspace = null;
    const holder = host.querySelector("[data-ip-model]");
    if (!holder) return;
    const engine = new MathVisualEngine(it.visual.model, it.visual.params);
    workspace = new Workspace(holder);
    workspace.show(engine);
    holder.insertAdjacentHTML(
      "afterend",
      `<div class="e8gm-row"><button type="button" class="e8ap-btn e8ap-primary" data-ip-check ${run.settled ? "disabled" : ""}>${esc(L("Check my model", "Revisar mi modelo"))}</button></div>`,
    );
    holder.engine = engine;
  }

  function settledHtml(it) {
    const ex = buildExplanation(it, run.settled.result);
    const rubric =
      run.settled.result.status === "self-check" && it.rubric
        ? `<fieldset class="e8ip-set"><legend class="e8ap-count">${esc(L("Check yourself", "Compruébate"))}</legend>${it.rubric.criteria.map((c) => `<label class="e8ip-choice"><input type="checkbox"> <span>${esc(pick(c))}</span></label>`).join("")}</fieldset><p><b>${esc(L("One strong answer:", "Una buena respuesta:"))}</b> ${esc(pick(it.rubric.sample))}</p>`
        : "";
    return `${rubric}<details class="e8ip-explain" ${run.settled.show ? "open" : ""}><summary>${esc(L("Why it works, in five steps", "Por qué funciona, en cinco pasos"))}</summary><ol>${[...ex.extra, ...ex.layers].map((l) => `<li><b>${esc(pick(l.title))}.</b> ${esc(pick(l.body))}</li>`).join("")}</ol></details><div class="e8gm-settled" data-state="${run.settled.result.correct ? "right" : "retry"}"><button type="button" class="e8ap-btn e8ap-primary" data-ip-next>${esc(run.i + 1 >= run.list.length ? L("Finish", "Terminar") : L("Next", "Siguiente"))}</button></div>`;
  }

  function collect(it) {
    switch (it.type) {
      case "mc":
        return host.querySelector('input[name="c"]:checked')?.value;
      case "multi":
        return [...host.querySelectorAll('input[name="c"]:checked')].map(
          (x) => x.value,
        );
      case "error":
        return host.querySelector('input[name="s"]:checked')?.value;
      case "numberline":
        return host.querySelector('input[name="t"]:checked')?.value;
      case "graph":
        return draft.points || [];
      case "match":
        return Object.fromEntries(
          [...host.querySelectorAll("[data-match]")]
            .filter((s) => s.value)
            .map((s) => [
              side(it.pairs[Number(s.dataset.match)].left),
              s.value,
            ]),
        );
      case "sort":
        return Object.fromEntries(
          [...host.querySelectorAll("[data-sort]")]
            .filter((s) => s.value !== "")
            .map((s) => [s.dataset.sort, Number(s.value)]),
        );
      case "model": {
        const facts =
          host.querySelector("[data-ip-model]")?.engine?.derive().facts || {};
        return Object.fromEntries(
          Object.entries(facts).map(([k, v]) => [k, String(v)]),
        );
      }
      case "constructed":
      case "explain":
        return host.querySelector("#e8ip-text")?.value || "";
      default:
        return host.querySelector("#e8ip-ans")?.value || "";
    }
  }
  const remember_ = (it) => {
    if (it.type === "mc")
      draft.one = host.querySelector('input[name="c"]:checked')?.value;
    if (it.type === "multi")
      draft.multi = [...host.querySelectorAll('input[name="c"]:checked')].map(
        (x) => x.value,
      );
    if (it.type === "error")
      draft.step = host.querySelector('input[name="s"]:checked')?.value;
    if (it.type === "numberline")
      draft.tick = host.querySelector('input[name="t"]:checked')?.value;
    draft.ans = host.querySelector("#e8ip-ans")?.value ?? draft.ans;
    draft.text = host.querySelector("#e8ip-text")?.value ?? draft.text;
    if (it.type === "match")
      draft.match = Object.fromEntries(
        [...host.querySelectorAll("[data-match]")]
          .filter((s) => s.value)
          .map((s) => [side(it.pairs[Number(s.dataset.match)].left), s.value]),
      );
    if (it.type === "sort")
      draft.sort = Object.fromEntries(
        [...host.querySelectorAll("[data-sort]")]
          .filter((s) => s.value !== "")
          .map((s) => [s.dataset.sort, s.value]),
      );
  };

  function wire(it) {
    host
      .querySelector("[data-ip-menu]")
      ?.addEventListener("click", () => menu());
    host
      .querySelectorAll("input,select,textarea")
      .forEach((el) => el.addEventListener("change", () => remember_(it)));
    host
      .querySelector("#e8ip-ans")
      ?.addEventListener("keydown", (e) => e.key === "Enter" && check(it));
    host.querySelector("[data-ip-hint]")?.addEventListener("click", () => {
      remember_(it);
      run.hints += 1;
      draw();
    });
    host
      .querySelector("[data-ip-check]")
      ?.addEventListener("click", () => check(it));
    host.querySelector("[data-add-point]")?.addEventListener("click", () => {
      const x = host.querySelector("[data-gx]").value;
      const y = host.querySelector("[data-gy]").value;
      if (x === "" || y === "")
        return draw(L("Type both x and y.", "Escribe x y y."));
      draft.points = [...(draft.points || []), [Number(x), Number(y)]].slice(
        0,
        12,
      );
      draw();
    });
    host.querySelectorAll("[data-del-point]").forEach((b) =>
      b.addEventListener("click", () => {
        draft.points.splice(Number(b.dataset.delPoint), 1);
        draw();
      }),
    );
    host.querySelector("[data-ip-next]")?.addEventListener("click", () => {
      run.i += 1;
      run.hints = 0;
      run.tries = 0;
      run.settled = null;
      draft = {};
      if (run.i >= run.list.length) return finish();
      draw();
    });
  }

  function settle(it, result, independent) {
    run.results.push({
      id: it.id,
      status: result.status,
      correct: result.correct,
      independent,
    });
    remember(it.id);
    run.settled = { result, show: !result.correct };
    if (result.status !== "self-check" && result.status !== "invalid") {
      if (it.skill)
        onEvidence({
          skillKey: it.skill,
          correct: result.correct,
          independent,
          level: it.difficulty >= 3 ? 2 : 1,
          sig: it.id,
          grade: it.grade,
          worldId: "e8items",
        });
    }
  }

  function check(it) {
    remember_(it);
    const response = collect(it);
    const result = checkResponse(it, response);
    if (result.status === "invalid")
      return draw(
        L(
          "Choose or write an answer first.",
          "Primero elige o escribe una respuesta.",
        ),
      );
    if (result.status === "unreadable")
      return draw(
        L(
          "I could not read that. Try a number, a fraction like 3/4, or the choices shown.",
          "No pude leer eso. Prueba un número, una fracción como 3/4 o las opciones mostradas.",
        ),
      );
    const first = run.tries === 0;
    if (result.status === "self-check") {
      settle(it, result, false);
      return draw(
        L(
          "Saved on this device. Compare your thinking with the checklist.",
          "Guardado en este dispositivo. Compara tu razonamiento con la lista.",
        ),
      );
    }
    if (result.correct) {
      settle(it, result, first && run.hints === 0);
      return draw(
        first && run.hints === 0
          ? L("Right, on your own!", "¡Correcto, tú solo!")
          : L(
              "Right! You got there with some help.",
              "¡Correcto! Lo lograste con algo de ayuda.",
            ),
      );
    }
    if (first) {
      // The first wrong answer is the evidence; a retry never turns it into a right one.
      const e8 = e8Store.load();
      recordItemEvidence(e8, it, response, result);
      e8Store.save(e8);
      if (it.skill)
        onEvidence({
          skillKey: it.skill,
          correct: false,
          independent: run.hints === 0,
          level: it.difficulty >= 3 ? 2 : 1,
          sig: it.id,
          grade: it.grade,
          worldId: "e8items",
        });
    }
    run.tries += 1;
    const note = result.why ? pick(result.why) : "";
    if (run.tries >= MAX_TRIES) {
      run.results.push({
        id: it.id,
        status: "incorrect",
        correct: false,
        independent: false,
      });
      remember(it.id);
      run.settled = { result, show: true };
      return draw(`${L("Not this time.", "Esta vez no.")} ${note}`);
    }
    run.hints = Math.max(run.hints, 0);
    draw(
      `${L("Not yet.", "Todavía no.")} ${note} ${L("Try once more.", "Intenta una vez más.")}`,
    );
  }

  function finish() {
    const r = run.results;
    const right = r.filter((x) => x.correct).length;
    const own = r.filter((x) => x.correct && x.independent).length;
    const checked = r.filter((x) => x.status !== "self-check").length;
    menu(
      L(
        `You finished ${r.length} problems. ${right} of ${checked} checked answers were right, ${own} of them on your own. Thinking counts more than speed.`,
        `Terminaste ${r.length} problemas. ${right} de ${checked} respuestas comprobadas fueron correctas, ${own} de ellas tú solo. Pensar vale más que la rapidez.`,
      ),
    );
    announce(L("Set finished.", "Conjunto terminado."));
    run = null;
  }

  menu();
  return {
    destroy: () => {
      workspace?.destroy();
      workspace = null;
      host.innerHTML = "";
    },
  };
}
