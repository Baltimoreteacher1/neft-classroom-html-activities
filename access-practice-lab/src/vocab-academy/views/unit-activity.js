// A unit activity (/vocabulary-academy/grade/<G>/unit/<U>/<activity>): the crossword or the unit test, over every word
// of the unit's lessons. Learner-facing; teacher-only fields are never read.
//
// Crossword: a grid of letter boxes built by unit/crossword.js; the clues are meanings. Typing moves along the word,
// arrows move, Space turns the direction. "Check" marks wrong boxes without filling them in; "Show a letter" fills only
// the box you are on, and words solved with shown letters count at half weight (like any heavy support). The word bank
// lists the answers in A to Z order (on by default for K-2).
// Unit test: one question per sampled word from every lesson (unit/test.js), no feedback until the end; then each word
// shows how it went, with its meaning for the ones to practise. Nothing here is a grade or a level.
//
// Work is kept in progress.unitWork[<gK-unitN>] = { crossword: { fill, shown, bank, done, at }, test: { answers, seed,
// score, total, at } } and saved through va.save, so a reload resumes where the learner stopped.
import { BASE, announce, html, toHtml } from "../../util.js";
import { bandOfGrade } from "../contract.js";
import {
  getUnitGroup,
  gradeHref,
  groupId,
  lessonHref,
  mergeLessons,
  unitHref,
  vaHref,
  wordHref,
} from "../data.js";
import { scoreAssessment } from "../assessment.js";
import { assessListHTML } from "../lessons/item-ui.js";
import { ensureLessonCss } from "../lessons/ui.js";
import { recordResult } from "../model.js";
import { noteAcademyResult } from "../lens.js";
import { crumbs, gradeName, gradeNameS, notPublishedPanel, rootCrumb } from "../ui.js";
import { buildCrossword, cellsOf, checkCrossword, pickWords } from "../unit/crossword.js";
import { buildUnitTest } from "../unit/test.js";
import { extraOf } from "../unit/extras.js";
import { workOf } from "../unit/work.js";

let S = null; // { kind, gid, puzzle|items, merged, lessons, g, u }

// ── crossword ───────────────────────────────────────────────────────────────────────────────────────────────────
function crosswordHTML(I, puzzle, cw, early) {
  const bank = cw.bank ?? early;
  const clueList = (dir) =>
    puzzle.entries
      .filter((e) => e.dir === dir)
      .map(
        (e) =>
          html`<li>
            <button type="button" class="va-cw-clue" data-cw-clue="${e.num}${e.dir}">
              <strong>${e.num}</strong> <span lang="en">${e.clue}</span>
              <span class="fine">(${e.answer.length})</span>
            </button>
          </li>`,
      );
  return html`<div class="va-cw" data-cw>
    <div class="va-cw-board-wrap">
      <div
        class="va-cw-board"
        role="group"
        aria-label="${I.S("Crossword grid", "Cuadrícula del crucigrama")}"
        style="--cw-cols:${puzzle.cols}"
      >
        ${puzzle.cells.map((row, r) =>
          row.map((cell, c) =>
            cell
              ? html`<span class="va-cw-cell" data-cw-cell="${r},${c}"
                  >${cell.num ? html`<span class="va-cw-num" aria-hidden="true">${cell.num}</span>` : ""}<input
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    autocapitalize="characters"
                    spellcheck="false"
                    maxlength="1"
                    data-cw-input="${r},${c}"
                    value="${cw.fill?.[`${r},${c}`] || ""}"
                    aria-label="${I.S(`Row ${r + 1}, column ${c + 1}`, `Fila ${r + 1}, columna ${c + 1}`)}"
                /></span>`
              : html`<span class="va-cw-block" aria-hidden="true"></span>`,
          ),
        )}
      </div>
    </div>
    <p class="va-cw-current" aria-live="polite" data-cw-current></p>
    <div class="va-cw-tools va-actions">
      <button type="button" class="btn btn-primary va-btn" data-cw-check>
        ${I.T("Check my answers", "Revisar mis respuestas")}
      </button>
      <button type="button" class="btn va-btn" data-cw-show>
        ${I.T("Show a letter", "Mostrar una letra")}
      </button>
      <button
        type="button"
        class="btn va-btn"
        data-cw-bank
        aria-pressed="${bank ? "true" : "false"}"
      >
        ${I.T("Word bank", "Banco de palabras")}
      </button>
      <button type="button" class="btn va-btn" data-cw-reset>
        ${I.T("Start over", "Empezar de nuevo")}
      </button>
    </div>
    <p class="va-cw-status" role="status" data-cw-status></p>
    ${
      bank
        ? html`<div class="va-cw-bank">
            <h3>${I.T("Word bank", "Banco de palabras")}</h3>
            <ul class="va-chips" lang="en">
              ${[...puzzle.entries].sort((a, b) => a.answer.localeCompare(b.answer)).map((e) => html`<li class="va-chip va-chip-static">${e.hw}</li>`)}
            </ul>
          </div>`
        : ""
    }
    <div class="va-cw-clues">
      <section aria-labelledby="cwAcross">
        <h3 id="cwAcross">${I.T("Across", "Horizontales")}</h3>
        <ol class="va-cw-list">
          ${clueList("across")}
        </ol>
      </section>
      <section aria-labelledby="cwDown">
        <h3 id="cwDown">${I.T("Down", "Verticales")}</h3>
        <ol class="va-cw-list">
          ${clueList("down")}
        </ol>
      </section>
    </div>
  </div>`;
}

function solvedHTML(I, g, u, puzzle, cw) {
  return html`<section class="va-card va-card-wide va-cw-solved" aria-labelledby="cwDoneH">
    <h2 id="cwDoneH" tabindex="-1">${I.T("Puzzle solved!", "¡Crucigrama resuelto!")}</h2>
    <p>
      ${I.T(`You filled in all ${puzzle.entries.length} words.`, `Completaste las ${puzzle.entries.length} palabras.`)}
      ${cw.shownCount ? I.T(` You asked for ${cw.shownCount} letter(s); those words count as practice with help.`, ` Pediste ${cw.shownCount} letra(s); esas palabras cuentan como práctica con ayuda.`) : ""}
    </p>
    <p class="va-actions">
      <a class="btn btn-primary va-btn" href="${unitHref(g, u, "test")}"
        >${I.T("Take the unit test", "Hacer la prueba de la unidad")}</a
      >
      <a class="btn va-btn" href="${unitHref(g, u)}"
        >${I.T("Back to the unit", "Volver a la unidad")}</a
      >
      <button type="button" class="btn va-btn" data-cw-reset>
        ${I.T("Solve it again", "Resolverlo otra vez")}
      </button>
    </p>
  </section>`;
}

// ── unit test ───────────────────────────────────────────────────────────────────────────────────────────────────
function testHTML(I, items, t) {
  const answered = items.filter((i) => Number.isInteger(t.answers?.[i.id])).length;
  return html`<form class="va-utest" data-ut-form>
    <p class="fine" data-ut-count>
      ${I.T(`${answered} of ${items.length} answered`, `${answered} de ${items.length} respondidas`)}
    </p>
    ${assessListHTML(I, items, t.answers || {})}
    <p class="va-actions">
      <button type="submit" class="btn btn-primary va-btn">
        ${I.T("Finish the test", "Terminar la prueba")}
      </button>
    </p>
    <p class="va-cw-status" role="status" data-ut-status></p>
  </form>`;
}

function resultHTML(I, g, u, S, result) {
  const byWord = new Map();
  for (const it of S.items) byWord.set(it.wordId, it);
  const words = new Map(S.merged.words.map((w) => [w.id, w]));
  const lessonsById = new Map(S.lessons.map((l) => [l.id, l]));
  const rows = S.items.map((it) => {
    const w = words.get(it.wordId);
    const ok = result.perWord[it.wordId]?.ok;
    return { it, w, ok, lesson: lessonsById.get(it.lessonId) };
  });
  const missed = rows.filter((r) => !r.ok);
  return html`<section class="va-card va-card-wide" aria-labelledby="utDoneH">
    <h2 id="utDoneH" tabindex="-1">${I.T("How the words went", "Cómo te fue con las palabras")}</h2>
    <p>
      ${I.T(`You answered ${result.score} of ${result.total} questions right.`, `Respondiste bien ${result.score} de ${result.total} preguntas.`)}
      ${I.T("This shows how these words went today. It is not a grade.", "Esto muestra cómo te fue hoy con estas palabras. No es una calificación.")}
    </p>
    ${
      missed.length
        ? html`<h3>${I.T("Words to practise", "Palabras para practicar")}</h3>
            <ul class="va-ut-missed">
              ${missed.map(
                (r) =>
                  html`<li>
                    <a href="${wordHref(r.w.id)}" lang="en"><strong>${r.w.hw}</strong></a>
                    <span lang="en">: ${r.w.def}</span>
                    <span class="fine">
                      ·
                      <a href="${lessonHref(g, r.lesson?.n || 1)}"
                        >${I.T("Lesson", "Lección")} ${r.lesson?.n}</a
                      ></span
                    >
                  </li>`,
              )}
            </ul>`
        : html`<p>
            ${I.T("Every word went well. Well done!", "Te fue bien con todas las palabras. ¡Muy bien!")}
          </p>`
    }
    <h3>${I.T("Words that went well", "Palabras que salieron bien")}</h3>
    <ul class="va-chips" lang="en">
      ${rows.filter((r) => r.ok).map((r) => html`<li class="va-chip va-chip-static">${r.w.hw}</li>`)}
    </ul>
    <p class="va-actions">
      <button type="button" class="btn btn-primary va-btn" data-ut-again>
        ${I.T("Try again with new questions", "Intentar otra vez con preguntas nuevas")}
      </button>
      <a class="btn va-btn" href="${vaHref("practice")}?unit=${encodeURIComponent(S.gid)}"
        >${I.T("Practise the unit words", "Practicar las palabras de la unidad")}</a
      >
      <a class="btn va-btn" href="${unitHref(g, u)}"
        >${I.T("Back to the unit", "Volver a la unidad")}</a
      >
    </p>
  </section>`;
}

// ── render ──────────────────────────────────────────────────────────────────────────────────────────────────────
export async function render(ctx, va) {
  const { I, progress } = va;
  const { grade: g, u, activity } = va.params;
  await ensureLessonCss(BASE);
  const found = await getUnitGroup(g, u);
  const extra = extraOf(activity);
  const label =
    activity === "crossword"
      ? I.S("Crossword", "Crucigrama")
      : extra
        ? I.S(...extra.title)
        : I.S("Unit test", "Prueba de la unidad");
  const trail = [
    rootCrumb(I),
    [I.S("Grade Levels", "Niveles por grado"), vaHref("grades")],
    [gradeNameS(I, g), gradeHref(g)],
    [`${I.S("Unit", "Unidad")} ${u}`, unitHref(g, u)],
    [label, ""],
  ];
  S = null;
  if (!found || found.lessons.length < found.unit.lessons.length || !found.lessons.length)
    return {
      title: label,
      html: html`${crumbs(I, trail)}${notPublishedPanel(I, {
        title: I.T("This unit is not ready yet", "Esta unidad todavía no está lista"),
        text: I.T(
          "The unit activities open when every lesson of the unit is ready.",
          "Las actividades de la unidad se abren cuando todas sus lecciones estén listas.",
        ),
        href: found ? unitHref(g, u) : gradeHref(g),
        label: I.T("Back", "Volver"),
      })}`,
    };
  const gid = groupId(g, u);
  const merged = mergeLessons(g, found.unit, found.lessons);
  const work = workOf(progress, gid);
  const early = bandOfGrade(String(g)) === "early";
  const head = html`${crumbs(I, trail)}
    <header class="va-hero">
      <p class="eyebrow">
        ${gradeName(I, g)} · ${I.T("Unit", "Unidad")} ${u} · ${I.T("Lessons", "Lecciones")}
        ${found.unit.first}–${found.unit.last}
      </p>
      <h1 id="vaTitle" tabindex="-1">
        ${activity === "crossword" ? I.T("Unit crossword", "Crucigrama de la unidad") : extra ? I.T(...extra.title) : I.T("Unit test", "Prueba de la unidad")}
      </h1>
    </header>`;

  if (extra) {
    S = { kind: "extra", extra, gid, merged, lessons: found.lessons, g, u };
    return {
      title: `${I.S(...extra.title)} · ${I.S("Unit", "Unidad")} ${u}`,
      html: html`${head}
        <p class="va-lead">${I.T(...extra.lead)}</p>
        <div data-extra-host class="va-extra va-extra-${extra.id}"></div>`,
    };
  }

  if (activity === "crossword") {
    const picks = pickWords(
      found.lessons.map((l) => l.words || []),
      20,
      (await import("../rng.js")).rngFor(`${gid}:crossword`),
    );
    const puzzle = buildCrossword(picks, { seed: gid, max: early ? 10 : 14 });
    const cw = (work.crossword ||= {});
    S = { kind: "crossword", gid, puzzle, merged, g, u, early };
    return {
      title: `${I.S("Unit crossword", "Crucigrama de la unidad")} · ${I.S("Unit", "Unidad")} ${u}`,
      html: html`${head}
        <section class="va-card va-card-wide" aria-labelledby="cwHowH">
          <h2 id="cwHowH">${I.T("How to play", "Cómo jugar")}</h2>
          <p>
            ${I.T("Each clue is the meaning of a word from this unit. Choose a clue, then type the word in the boxes. Arrow keys move; the space bar switches between across and down.", "Cada pista es el significado de una palabra de esta unidad. Elige una pista y escribe la palabra en las casillas. Las flechas mueven; la barra espaciadora cambia entre horizontal y vertical.")}
          </p>
        </section>
        <div data-cw-host>
          ${cw.done ? solvedHTML(I, g, u, puzzle, cw) : crosswordHTML(I, puzzle, cw, early)}
        </div>`,
    };
  }

  const t = (work.test ||= {});
  const seed = Number.isInteger(t.seed) ? t.seed : 0;
  const { items } = buildUnitTest(merged, found.lessons, {
    seed: `${gid}#${seed}`,
    perLesson: early ? 4 : 5,
  });
  S = { kind: "test", gid, items, merged, lessons: found.lessons, g, u };
  const done = t.result && t.result.seed === seed;
  return {
    title: `${I.S("Unit test", "Prueba de la unidad")} · ${I.S("Unit", "Unidad")} ${u}`,
    html: html`${head}
      <p class="va-lead">
        ${I.T(`${items.length} questions on words from all ${found.lessons.length} lessons. Answer them all, then finish the test to see how each word went.`, `${items.length} preguntas sobre palabras de las ${found.lessons.length} lecciones. Respóndelas todas y termina la prueba para ver cómo te fue con cada palabra.`)}
      </p>
      <div data-ut-host>${done ? resultHTML(I, g, u, S, t.result) : testHTML(I, items, t)}</div>`,
  };
}

// ── behaviour ───────────────────────────────────────────────────────────────────────────────────────────────────
let root = null;
let dir = "across";
let saveTimer = 0;

const cellInput = (k) => root?.querySelector(`[data-cw-input="${k}"]`);
const entryAt = (r, c, d) =>
  S.puzzle.entries.find((e) => e.dir === d && cellsOf(e).some(([y, x]) => y === r && x === c));
const fillOf = (va) => (workOf(va.progress, S.gid).crossword ||= {}).fill || {};

function highlight(r, c) {
  if (!root) return;
  for (const el of root.querySelectorAll(".is-active, .is-word"))
    el.classList.remove("is-active", "is-word");
  const e = entryAt(r, c, dir) || entryAt(r, c, dir === "across" ? "down" : "across");
  if (!e) return;
  dir = e.dir;
  for (const [y, x] of cellsOf(e))
    root.querySelector(`[data-cw-cell="${y},${x}"]`)?.classList.add("is-word");
  root.querySelector(`[data-cw-cell="${r},${c}"]`)?.classList.add("is-active");
  for (const b of root.querySelectorAll("[data-cw-clue]"))
    b.classList.toggle("is-active", b.dataset.cwClue === `${e.num}${e.dir}`);
  const cur = root.querySelector("[data-cw-current]");
  if (cur) cur.textContent = `${e.num} ${e.dir === "across" ? "across" : "down"}: ${e.clue}`;
}

function step(r, c, by) {
  const e = entryAt(r, c, dir);
  if (!e) return;
  const cells = cellsOf(e);
  const i = cells.findIndex(([y, x]) => y === r && x === c);
  const next = cells[i + by];
  if (next) cellInput(`${next[0]},${next[1]}`)?.focus();
}

function saveSoon(va) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => va.save(va.progress), 400);
}

function finishCrossword(va) {
  const cw = workOf(va.progress, S.gid).crossword;
  if (cw.done) return;
  const shown = new Set(Object.keys(cw.shown || {}));
  cw.done = true;
  cw.at = new Date().toISOString();
  cw.shownCount = shown.size;
  for (const e of S.puzzle.entries) {
    const helped = cellsOf(e).some(([y, x]) => shown.has(`${y},${x}`));
    try {
      recordResult(va.progress, {
        wordId: e.wordId,
        dim: "mean",
        ok: true,
        sup: helped || cw.bank ? ["wordBank"] : [],
        type: "crossword",
        unit: S.gid,
        grade: S.g,
      });
      noteAcademyResult({ wordId: e.wordId, ok: true, sup: helped || cw.bank ? ["wordBank"] : [] });
    } catch (error) {
      console.warn("[vocab-academy] crossword evidence not recorded", error);
    }
  }
  va.save(va.progress);
  const host = root?.querySelector("[data-cw-host]");
  if (host) {
    host.innerHTML = toHtml(solvedHTML(va.I, S.g, S.u, S.puzzle, cw));
    host.querySelector("#cwDoneH")?.focus();
  }
  announce(va.I.S("Puzzle solved!", "¡Crucigrama resuelto!"));
}

let off = null;
let extraHandle = null;

/** An extra activity (unit/extras.js) is loaded when its page opens and gets the host element, the lab context and the view. */
async function startExtra(el, ctx, va) {
  const host = el.querySelector?.("[data-extra-host]");
  const job = S;
  if (!host || !job || job.kind !== "extra") return;
  const mod = await job.extra.load();
  if (S !== job || !host.isConnected) return;
  extraHandle = await mod.start(host, ctx, va, job);
}

export function mount(el, ctx, va) {
  root = el;
  dir = "across";
  if (S?.kind === "extra") startExtra(el, ctx, va);
  const submit = (e) => onSubmit(e, ctx, va);
  const focus = (e) => onFocus(e);
  el.addEventListener("submit", submit);
  el.addEventListener("focusin", focus);
  off = () => {
    el.removeEventListener("submit", submit);
    el.removeEventListener("focusin", focus);
  };
}

export function unmount() {
  extraHandle?.destroy?.();
  extraHandle = null;
  clearTimeout(saveTimer);
  off?.();
  off = null;
  root = null;
  S = null;
}

export function onInput(e, ctx, va) {
  if (!S || S.kind !== "crossword") return false;
  const k = e.target.dataset?.cwInput;
  if (!k) return false;
  const v = String(e.target.value || "")
    .replace(/[^a-z]/gi, "")
    .slice(-1)
    .toUpperCase();
  e.target.value = v;
  e.target.classList.remove("is-wrong");
  e.target.removeAttribute("aria-invalid");
  const cw = (workOf(va.progress, S.gid).crossword ||= {});
  cw.fill = { ...(cw.fill || {}), [k]: v };
  if (!v) delete cw.fill[k];
  saveSoon(va);
  const [r, c] = k.split(",").map(Number);
  if (v) step(r, c, 1);
  if (checkCrossword(S.puzzle, cw.fill).done) finishCrossword(va);
  return true;
}

export function onKey(e, ctx, va) {
  if (!S || S.kind !== "crossword") return false;
  const k = e.target.dataset?.cwInput;
  if (!k) return false;
  const [r, c] = k.split(",").map(Number);
  const move = {
    ArrowRight: [0, 1, "across"],
    ArrowLeft: [0, -1, "across"],
    ArrowDown: [1, 0, "down"],
    ArrowUp: [-1, 0, "down"],
  }[e.key];
  if (move) {
    e.preventDefault();
    dir = move[2];
    for (let i = 1; i < 16; i++) {
      const target = cellInput(`${r + move[0] * i},${c + move[1] * i}`);
      if (target) {
        target.focus();
        break;
      }
    }
    return true;
  }
  if (e.key === " ") {
    e.preventDefault();
    dir = dir === "across" ? "down" : "across";
    highlight(r, c);
    return true;
  }
  if (e.key === "Backspace" && !e.target.value) {
    e.preventDefault();
    step(r, c, -1);
    const prev = root?.ownerDocument?.activeElement;
    if (prev?.dataset?.cwInput && prev !== e.target) {
      prev.value = "";
      const cw = workOf(va.progress, S.gid).crossword;
      if (cw.fill) delete cw.fill[prev.dataset.cwInput];
      saveSoon(va);
    }
    return true;
  }
  return false;
}

export function onClick(e, ctx, va) {
  if (!S) return false;
  const t = e.target;
  if (S.kind === "crossword") {
    const cw = (workOf(va.progress, S.gid).crossword ||= {});
    const clue = t.closest?.("[data-cw-clue]");
    if (clue) {
      const entry = S.puzzle.entries.find((x) => `${x.num}${x.dir}` === clue.dataset.cwClue);
      if (entry) {
        dir = entry.dir;
        const first =
          cellsOf(entry).find(([y, x]) => !fillOf(va)[`${y},${x}`]) || cellsOf(entry)[0];
        cellInput(`${first[0]},${first[1]}`)?.focus();
      }
      return true;
    }
    if (t.closest?.("[data-cw-check]")) {
      const res = checkCrossword(S.puzzle, cw.fill || {});
      for (const k of res.wrong) {
        const input = cellInput(k);
        input?.classList.add("is-wrong");
        input?.setAttribute("aria-invalid", "true");
      }
      const status = root?.querySelector("[data-cw-status]");
      const msg = res.done
        ? va.I.S("Every box is right!", "¡Todas las casillas están bien!")
        : va.I.S(
            `${res.solved.length} of ${S.puzzle.entries.length} words are right. ${res.wrong.length} box(es) need another look; ${res.empty.length} are empty.`,
            `${res.solved.length} de ${S.puzzle.entries.length} palabras están bien. ${res.wrong.length} casilla(s) necesitan otra mirada; ${res.empty.length} están vacías.`,
          );
      if (status) status.textContent = msg;
      if (res.done) finishCrossword(va);
      return true;
    }
    if (t.closest?.("[data-cw-show]")) {
      const active = root?.ownerDocument?.activeElement?.dataset?.cwInput
        ? root.ownerDocument.activeElement
        : root?.querySelector(".va-cw-cell.is-active input");
      const status = root?.querySelector("[data-cw-status]");
      if (!active) {
        if (status)
          status.textContent = va.I.S(
            "Choose a box first, then ask for its letter.",
            "Elige primero una casilla y luego pide su letra.",
          );
        return true;
      }
      const k = active.dataset.cwInput;
      const [r, c] = k.split(",").map(Number);
      const ch = S.puzzle.cells[r][c].ch;
      active.value = ch;
      active.classList.remove("is-wrong");
      cw.fill = { ...(cw.fill || {}), [k]: ch };
      cw.shown = { ...(cw.shown || {}), [k]: true };
      saveSoon(va);
      if (checkCrossword(S.puzzle, cw.fill).done) finishCrossword(va);
      return true;
    }
    if (t.closest?.("[data-cw-bank]")) {
      cw.bank = !(cw.bank ?? S.early);
      va.save(va.progress);
      ctx.rerender?.();
      return true;
    }
    if (t.closest?.("[data-cw-reset]")) {
      workOf(va.progress, S.gid).crossword = { bank: cw.bank };
      va.save(va.progress);
      ctx.rerender?.();
      return true;
    }
    return false;
  }
  if (t.closest?.("[data-ut-again]")) {
    const tt = workOf(va.progress, S.gid).test;
    workOf(va.progress, S.gid).test = {
      seed: (Number.isInteger(tt?.seed) ? tt.seed : 0) + 1,
      score: tt?.score,
      total: tt?.total,
      at: tt?.at,
    };
    va.save(va.progress);
    ctx.rerender?.();
    return true;
  }
  return false;
}

export function onChange(e, ctx, va) {
  if (!S || S.kind !== "test") return false;
  const id = e.target.dataset?.valAid;
  if (!id) return false;
  const t = workOf(va.progress, S.gid).test;
  t.answers = { ...(t.answers || {}), [id]: Number(e.target.value) };
  saveSoon(va);
  const n = S.items.filter((i) => Number.isInteger(t.answers[i.id])).length;
  const count = root?.querySelector("[data-ut-count]");
  if (count)
    count.textContent = va.I.S(
      `${n} of ${S.items.length} answered`,
      `${n} de ${S.items.length} respondidas`,
    );
  return true;
}

/** Finishing the test (the form's submit, listened for in mount: the router forwards clicks and keys, not submits). */
function onSubmit(e, ctx, va) {
  if (!S || S.kind !== "test" || !e.target.closest?.("[data-ut-form]")) return false;
  e.preventDefault();
  const t = workOf(va.progress, S.gid).test;
  const answers = t.answers || {};
  const open = S.items.filter((i) => !Number.isInteger(answers[i.id]));
  const status = root?.querySelector("[data-ut-status]");
  if (open.length) {
    if (status)
      status.textContent = va.I.S(
        `${open.length} question(s) still need an answer.`,
        `Todavía faltan ${open.length} pregunta(s) por responder.`,
      );
    root?.querySelector(`[data-val-aitem="${open[0].id}"] input`)?.focus();
    return true;
  }
  const result = scoreAssessment(S.items, answers);
  for (const p of result.perItem)
    try {
      recordResult(va.progress, {
        wordId: p.wordId,
        dim: p.dim,
        ok: p.ok,
        type: "unit-test",
        unit: S.gid,
        grade: S.g,
      });
      noteAcademyResult({ wordId: p.wordId, ok: p.ok });
    } catch (error) {
      console.warn("[vocab-academy] unit test evidence not recorded", error);
    }
  const seed = Number.isInteger(t.seed) ? t.seed : 0;
  workOf(va.progress, S.gid).test = {
    seed,
    score: result.score,
    total: result.total,
    at: new Date().toISOString(),
    result: { seed, score: result.score, total: result.total, perWord: result.perWord },
  };
  va.save(va.progress);
  const host = root?.querySelector("[data-ut-host]");
  if (host) {
    host.innerHTML = toHtml(resultHTML(va.I, S.g, S.u, S, workOf(va.progress, S.gid).test.result));
    host.querySelector("#utDoneH")?.focus();
  }
  return true;
}

const onFocus = (e) => {
  if (!S || S.kind !== "crossword") return false;
  const k = e.target?.dataset?.cwInput;
  if (!k) return false;
  const [r, c] = k.split(",").map(Number);
  highlight(r, c);
  return true;
};
