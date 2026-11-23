// Vocabulary Arcade — /vocabulary-academy/games (the shelf) and /games/<gameId> (one game). Games-owned.
// The shelf lists the ten games with a one-line purpose, a grade-fit badge and a "your words" picker (a grade and
// a unit, or "my review words"). A game gets its words from the picker, reports every judged action through
// model.recordResult, and is saved with va.save(). Games never touch progress themselves.
import { html } from "../../util.js";
import { SHIPPED_GRADES } from "../contract.js";
import { getIndex, getUnit, getUnitsOfGrade, getWords, groupId, groupLessons, parseGroupId, vaHref } from "../data.js";
import { GAMES, fitsGrade, getGame } from "../games/index.js";
import { dueWords, recordResult, wordEntry } from "../model.js";
import { crumbs, gradeName, gradeNameS, notPublishedPanel, rootCrumb } from "../ui.js";

const REVIEW_STATES = ["learning", "developing", "applying", "review-needed"];
const GAMES_HREF = (id = "", q = "") => `${vaHref("games", id)}${q ? `?${q}` : ""}`;
const query = (sel) =>
  sel.words === "review"
    ? `grade=${encodeURIComponent(sel.grade)}&words=review`
    : `grade=${encodeURIComponent(sel.grade)}${sel.unitId ? `&unit=${encodeURIComponent(sel.unitId)}` : ""}`;

/** Word ids for a "my review words" run: due words first, then words still being learned. Pure. */
export function reviewIds(progress, { now = new Date(), limit = 24 } = {}) {
  const due = dueWords(progress, { now, limit });
  const weak = Object.keys(progress.words || {}).filter(
    (id) => !due.includes(id) && REVIEW_STATES.includes(wordEntry(progress, id).state),
  );
  return [...due, ...weak].slice(0, limit);
}

async function gradesWithUnits() {
  const index = await getIndex();
  return SHIPPED_GRADES.filter((g) => (index.grades?.[g]?.unitCount || 0) > 0);
}

/** Resolve the picker from the URL and the learner's own record. */
async function selection(va) {
  const q = va.route.q || {};
  const grades = await gradesWithUnits();
  const wanted = String(q.grade || va.progress.grade || "").toUpperCase();
  const grade = grades.includes(wanted) ? wanted : grades[0] || "";
  const units = grade ? await getUnitsOfGrade(grade) : [];
  const review = q.words === "review";
  // Whole units (every word of a group of lessons) are offered beside single lessons.
  const groups = groupLessons(units).map((g) => ({ id: groupId(grade, g.u), u: g.u, first: g.first, last: g.last }));
  const unitId = review
    ? ""
    : groups.find((g) => g.id === q.unit && parseGroupId(q.unit))?.id ||
      units.find((u) => u.id === q.unit)?.id ||
      units.find((u) => u.id === va.progress.last?.unit)?.id ||
      units[0]?.id ||
      "";
  return { grades, grade, units, groups, unitId, review };
}

function picker(va, sel, id) {
  const I = va.I;
  return html`<div class="vagv-picker" role="group" aria-label="${I.S("Choose your words", "Elige tus palabras")}" data-vag-picker data-game="${id}">
    <p class="vagv-picker-h"><strong>${I.T("Your words", "Tus palabras")}</strong></p>
    <label class="vagv-field"
      >${I.T("Grade", "Grado")}
      <select id="vaGameGrade" data-vag-grade>
        ${sel.grades.map((g) => html`<option value="${g}" ${g === sel.grade ? "selected" : ""}>${gradeNameS(I, g)}</option>`)}
      </select></label
    >
    <label class="vagv-field"
      >${I.T("Words from", "Palabras de")}
      <select id="vaGameUnit" data-vag-unit>
        <optgroup label="${I.S("Whole units", "Unidades completas")}">
          ${sel.groups.map((g) => html`<option value="${g.id}" ${!sel.review && g.id === sel.unitId ? "selected" : ""}>${I.S("Unit", "Unidad")} ${g.u} (${I.S("Lessons", "Lecciones")} ${g.first}–${g.last})</option>`)}
        </optgroup>
        <optgroup label="${I.S("One lesson", "Una lección")}">
          ${sel.units.map((u) => html`<option value="${u.id}" ${!sel.review && u.id === sel.unitId ? "selected" : ""}>${I.S("Lesson", "Lección")} ${u.n}. ${u.title}</option>`)}
        </optgroup>
        <option value="review" ${sel.review ? "selected" : ""}>
          ${I.S("My review words (due and still learning)", "Mis palabras de repaso (pendientes y en aprendizaje)")}
        </option>
      </select></label
    >
  </div>`;
}

function shelf(va, sel, notice) {
  const I = va.I;
  const q = query(sel);
  return html`<section class="va-panel vagv" aria-labelledby="vagvTitle">
    ${crumbs(I, [rootCrumb(I), [I.S("Vocabulary Arcade", "Arcade de vocabulario"), ""]])}
    <h1 id="vagvTitle" tabindex="-1">${I.T("Vocabulary Arcade", "Arcade de vocabulario")}</h1>
    <p class="va-lead">
      ${I.T("Ten games for the words you are learning. Right answers and trying different kinds of questions count. Speed never does.", "Diez juegos para las palabras que estás aprendiendo. Cuentan las respuestas correctas y probar distintos tipos de preguntas. La rapidez nunca cuenta.")}
    </p>
    ${notice ? html`<p class="vagv-note" role="status">${notice}</p>` : ""}
    ${sel.grades.length ? picker(va, sel, "") : html`<p class="vag-fine">${I.T("No units are published yet, so there are no words to play with.", "Todavía no hay unidades publicadas, así que no hay palabras para jugar.")}</p>`}
    <ul class="vagv-cards">
      ${GAMES.map((g) => {
        const fits = sel.grade ? fitsGrade(g, sel.grade) : true;
        const range =
          g.minGrade === "K"
            ? ""
            : I.S(`Starts at Grade ${g.minGrade}`, `Desde ${g.minGrade}.º grado`);
        return html`<li class="vagv-card" data-game="${g.id}">
          <h2 class="vagv-card-h">${I.T(g.title, g.titleEs)}</h2>
          <p class="vagv-purpose">${g.purpose}</p>
          <p class="vagv-blurb">${I.T(g.blurb, g.blurbEs)}</p>
          <p class="vagv-badges">
            <span class="vagv-badge" data-fit="${fits}"
              >${fits ? I.T(`Fits ${sel.grade ? gradeName(I, sel.grade) : "your grade"}`, `Sirve para ${sel.grade ? gradeName(I, sel.grade) : "tu grado"}`) : I.T(range || "Not for this grade", range || "No es para este grado")}</span
            >
          </p>
          ${fits && sel.grade ? html`<a class="btn btn-primary va-btn" href="${GAMES_HREF(g.id, q)}">${I.T("Play", "Jugar")}<span class="vag-sr"> ${I.T(g.title, g.titleEs)}</span></a>` : html`<span class="btn va-btn" aria-disabled="true">${I.T("Not for this grade yet", "Aún no para este grado")}</span>`}
        </li>`;
      })}
    </ul>
  </section>`;
}

let pending = null; // what mount() needs: { game, opts, unitId }

/** Words for the chosen game: the unit, earlier-unit review words, or the learner's own review words. */
async function wordsFor(va, game, sel) {
  const progress = va.progress;
  const mine = async () => getWords(reviewIds(progress));
  if (sel.review) {
    const words = await mine();
    return words.length >= 3 ? { words } : { empty: "review" };
  }
  const unit = await getUnit(sel.unitId);
  if (!unit) return { empty: "unit" };
  const out = { unit };
  if (game.id === "vocab-arena" || game.id === "word-quest")
    out.review = await getWords(unit.review || []);
  if (game.id === "word-mastery") {
    const have = new Set(unit.words.map((w) => w.id));
    out.review = (await mine()).filter((w) => !have.has(w.id));
  }
  if (game.id === "word-builder") {
    const others = sel.units.filter((u) => u.id !== unit.id).slice(0, 8);
    const loaded = await Promise.all(others.map((u) => getUnit(u.id)));
    out.review = loaded.flatMap((u) =>
      (u?.words || []).filter((w) => (w.morph?.segs || []).length >= 2),
    );
  }
  return out;
}

function gameWork(progress) {
  const gw = (progress.gameWork =
    progress.gameWork && typeof progress.gameWork === "object" ? progress.gameWork : {});
  gw.runs = Array.isArray(gw.runs) ? gw.runs : [];
  gw.sentences = Array.isArray(gw.sentences) ? gw.sentences : [];
  gw.resume = gw.resume && typeof gw.resume === "object" ? gw.resume : {};
  return gw;
}

function playPage(va, game, sel, data) {
  const I = va.I;
  const unitTitle = data.unit ? data.unit.title : I.S("My review words", "Mis palabras de repaso");
  return html`<section class="va-panel vagv vagv-play" aria-labelledby="vagvTitle">
    ${crumbs(I, [rootCrumb(I), [I.S("Vocabulary Arcade", "Arcade de vocabulario"), GAMES_HREF("", query(sel))], [I.S(game.title, game.titleEs), ""]])}
    <p class="vagv-using">
      ${I.T("Words from", "Palabras de")}: <strong>${unitTitle}</strong> ·
      <a href="${GAMES_HREF("", query(sel))}"
        >${I.T("Change the words or the game", "Cambiar las palabras o el juego")}</a
      >
    </p>
    <div id="vaGameHost" class="vagv-host" data-game="${game.id}"></div>
  </section>`;
}

export async function render(ctx, va) {
  const I = va.I;
  const sel = await selection(va);
  const gameId = va.params?.gameId || "";
  pending = null;
  if (!gameId)
    return { title: I.S("Vocabulary Arcade", "Arcade de vocabulario"), html: shelf(va, sel) };
  const game = getGame(gameId);
  if (!game)
    return {
      title: I.S("Vocabulary Arcade", "Arcade de vocabulario"),
      html: shelf(
        va,
        sel,
        I.T(
          "We could not find that game. Here are the ten.",
          "No encontramos ese juego. Aquí están los diez.",
        ),
      ),
    };
  const data = sel.grade ? await wordsFor(va, game, sel) : { empty: "unit" };
  if (data.empty) {
    const review = data.empty === "review";
    return {
      title: I.S(game.title, game.titleEs),
      html: notPublishedPanel(I, {
        title: review
          ? I.T("No review words yet", "Todavía no hay palabras de repaso")
          : I.T("These words are not published yet", "Estas palabras aún no están publicadas"),
        text: review
          ? I.T(
              "Review words come from lessons you have started. Choose a lesson to play with its words.",
              "Las palabras de repaso vienen de las lecciones que empezaste. Elige una lección para jugar con sus palabras.",
            )
          : I.T("Choose another lesson to play with.", "Elige otra lección para jugar."),
        href: GAMES_HREF("", query(sel)),
        label: I.T("Choose words", "Elegir palabras"),
      }),
    };
  }
  pending = { game, data, sel };
  return { title: I.S(game.title, game.titleEs), html: playPage(va, game, sel, data) };
}

export function mount(root, ctx, va) {
  const job = pending;
  const host = root.querySelector?.("#vaGameHost");
  if (!job || !host) return;
  const { game, data, sel } = job;
  const progress = va.progress;
  const unitId = data.unit?.id || "";
  const grade = data.unit?.grade || sel.grade;
  const resumeKey = (k) => `${game.id}|${k}`;
  const handle = game.mount(host, {
    ...data,
    grade,
    ctx: { ...ctx, supports: va.supports("reading") },
    entryOf: (id) => wordEntry(progress, id),
    now: Date.now(),
    onResult: (ev) => {
      recordResult(progress, {
        wordId: ev.wordId,
        dim: ev.dim,
        ok: ev.ok,
        sup: ev.sup,
        type: ev.type,
        now: new Date(),
        unit: unitId || undefined,
        grade,
      });
      va.save();
    },
    onDone: (summary) => {
      const gw = gameWork(progress);
      gw.runs.unshift({
        game: game.id,
        unit: summary.unitId,
        at: new Date().toISOString(),
        judged: summary.judged,
        correct: summary.correct,
      });
      gw.runs.length = Math.min(gw.runs.length, 40);
      va.save();
    },
    onWork: (work) => {
      const gw = gameWork(progress);
      gw.sentences.unshift({ ...work, unit: unitId || "review" });
      gw.sentences.length = Math.min(gw.sentences.length, 60);
      va.save();
    },
    persist: (key, state) => {
      const gw = gameWork(progress);
      const k = resumeKey(key);
      if (state) gw.resume[k] = { at: Date.now(), state };
      else delete gw.resume[k];
      const keys = Object.keys(gw.resume).sort((a, b) => gw.resume[b].at - gw.resume[a].at);
      for (const old of keys.slice(6)) delete gw.resume[old];
      va.save();
    },
    restore: (key) => gameWork(progress).resume[resumeKey(key)]?.state || null,
  });
  host.__vaGame = handle;
}

export function unmount() {
  const host = document.getElementById("vaGameHost");
  host?.__vaGame?.destroy?.();
  pending = null;
}

export function onChange(e, ctx, va) {
  const el = e.target;
  if (!el?.matches?.("[data-vag-grade], [data-vag-unit]")) return false;
  const gradeNow = document.getElementById("vaGameGrade")?.value || "";
  if (el.matches("[data-vag-grade]")) {
    va.go(GAMES_HREF(va.params?.gameId || "", `grade=${encodeURIComponent(gradeNow)}`));
    return true;
  }
  const v = el.value;
  va.go(
    GAMES_HREF(
      va.params?.gameId || "",
      v === "review"
        ? `grade=${encodeURIComponent(gradeNow)}&words=review`
        : `grade=${encodeURIComponent(gradeNow)}&unit=${encodeURIComponent(v)}`,
    ),
  );
  return true;
}
