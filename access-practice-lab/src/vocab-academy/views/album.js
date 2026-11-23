// Word Album (/vocabulary-academy/album, optionally ?grade=G&unit=U). Every word the learner has met is a collectible card.
// A card's frame comes from the word's DERIVED state (album/cards.js, model.js wordState); this page stores nothing.
// Front: picture, word, part of speech. Turn it over (click, Enter or Space) for the meaning, an example, the Spanish gloss
// when supports allow, and Listen. Lessons show a "set complete" meter; today's missions sit above the album.
import { html } from "../../util.js";
import { sayButton, visualHTML } from "../art.js";
import { STATE_LABEL, bandOfGrade } from "../contract.js";
import {
  getGradeUnits,
  getIndex,
  getWords,
  lessonHref,
  unitHref,
  vaHref,
  wordHref,
} from "../data.js";
import {
  stateIcon,
  crumbs,
  gradeName,
  gradeNameS,
  posName,
  progressMeter,
  rootCrumb,
} from "../ui.js";
import {
  ALBUM_STATES,
  RARITY_LABEL,
  buildAlbum,
  cardMatches,
  gradesToShow,
  meterOf,
  metWordIds,
  missionsFor,
} from "../album/cards.js";

let cleanup = null;

const countWord = (I, n, one, many, oneEs, manyEs) =>
  I.T(`${n} ${n === 1 ? one : many}`, `${n} ${n === 1 ? oneEs : manyEs}`);

// ── missions ────────────────────────────────────────────────────────────────────────────────
function missionText(I, m) {
  const n = m.n || 0;
  if (m.kind === "review")
    return m.done
      ? I.T(
          `You reviewed ${n} ${n === 1 ? "word" : "words"} today.`,
          `Hoy repasaste ${n} ${n === 1 ? "palabra" : "palabras"}.`,
        )
      : I.T(
          `Review ${n} ${n === 1 ? "word" : "words"} that ${n === 1 ? "is" : "are"} due`,
          `Repasa ${n} ${n === 1 ? "palabra" : "palabras"} por repasar`,
        );
  if (m.kind === "vault")
    return m.done
      ? I.T(
          `You opened the Word Vault for Unit ${m.unit} today.`,
          `Hoy abriste la Bóveda de palabras de la Unidad ${m.unit}.`,
        )
      : I.T(
          `Try the Word Vault for Unit ${m.unit}`,
          `Prueba la Bóveda de palabras de la Unidad ${m.unit}`,
        );
  if (m.kind === "game")
    return m.done
      ? I.T(
          `You practised Lesson ${m.lesson}'s words today.`,
          `Hoy practicaste las palabras de la Lección ${m.lesson}.`,
        )
      : I.T(
          `Play a game with Lesson ${m.lesson}'s words`,
          `Juega con las palabras de la Lección ${m.lesson}`,
        );
  return m.grade
    ? I.T("Meet your first words: open Lesson 1", "Conoce tus primeras palabras: abre la Lección 1")
    : I.T(
        "Pick a grade to meet your first words",
        "Elige un grado para conocer tus primeras palabras",
      );
}

function missionsSection(I, missions) {
  return html`<section class="alb-missions" aria-labelledby="albMissionsH">
    <h2 id="albMissionsH">${I.T("Today's missions", "Misiones de hoy")}</h2>
    <p class="va-note">
      ${I.T("Ideas for today. Pick any, or none. Nothing is lost if you skip them.", "Ideas para hoy. Elige las que quieras, o ninguna. No se pierde nada si las dejas.")}
    </p>
    <ul class="alb-mission-list">
      ${missions.map(
        (m) =>
          html`<li
            class="alb-mission"
            data-done="${m.done ? "true" : "false"}"
            data-mission="${m.kind}"
          >
            <span class="alb-check" aria-hidden="true">${m.done ? "✓" : ""}</span>
            <span class="alb-mission-body">
              <span class="alb-mission-text">${missionText(I, m)}</span>
              <span class="alb-mission-state"
                >${m.done ? I.T("Done today", "Hecho hoy") : I.T("Ready when you are", "Lista cuando quieras")}</span
              >
            </span>
            <a class="btn va-btn alb-mission-go" href="${m.href}"
              >${m.done ? I.T("Open again", "Abrir de nuevo") : I.T("Go", "Ir")}</a
            >
          </li>`,
      )}
    </ul>
  </section>`;
}

// ── cards ───────────────────────────────────────────────────────────────────────────────────
function stateLine(I, card) {
  return html`${stateIcon(card.state)}<span class="alb-tag-text"
      >${I.T(...RARITY_LABEL[card.rarity])}${card.rarity === "visit" ? "" : html` · ${I.T(...STATE_LABEL[card.state])}`}</span
    >`;
}

function lockedCard(I, grade, lesson, nth) {
  const label = I.S(
    `Locked card ${nth} of ${lesson.total} in Lesson ${lesson.n}. Open the lesson to meet this word and unlock it.`,
    `Tarjeta bloqueada ${nth} de ${lesson.total} en la Lección ${lesson.n}. Abre la lección para conocer esta palabra y desbloquearla.`,
  );
  return html`<li class="alb-item" data-alb-card data-state="new" data-hw="">
    <article class="alb-card alb-card-locked" data-rarity="locked" data-state="new">
      <a
        class="alb-face alb-front alb-locked"
        data-alb-focus
        href="${lessonHref(grade, lesson.n, "a")}"
        aria-label="${label}"
        tabindex="-1"
      >
        <span class="alb-tag"
          >${stateIcon("new")}<span class="alb-tag-text">${I.T(...RARITY_LABEL.locked)}</span></span
        >
        <span class="alb-silhouette" aria-hidden="true">?</span>
        <span class="alb-hint"
          >${I.T("Meet this word in Lesson", "Conoce esta palabra en la Lección")} ${lesson.n}</span
        >
      </a>
    </article>
  </li>`;
}

function backFace(I, card, flags) {
  const w = card.word;
  const es = (flags.glossaryEs || I.mode !== "en") && w?.es?.gloss;
  return html`<div class="alb-face alb-back" inert aria-hidden="true" data-alb-back>
    <p class="alb-back-hw" lang="en">${card.hw}</p>
    ${w?.def ? html`<p class="alb-def"><strong>${I.T("Meaning", "Significado")}:</strong> <span lang="en">${w.def}</span></p>` : ""}
    ${w?.ex ? html`<p class="alb-ex"><strong>${I.T("Example", "Ejemplo")}:</strong> <span lang="en">${w.ex}</span></p>` : ""}
    ${es ? html`<p class="alb-es"><strong>Español:</strong> <span lang="es">${w.es.gloss}</span></p>` : ""}
    <p class="alb-back-actions">
      ${sayButton(I, `${card.hw}. ${w?.def || ""}${w?.ex ? ` ${w.ex}` : ""}`, card.hw)}
      <button type="button" class="btn va-btn alb-unflip" data-alb-unflip>
        ${I.T("Turn back over", "Voltear de nuevo")}
      </button>
      <a class="alb-more" href="${wordHref(card.id)}"
        >${I.T("Open word page", "Abrir la página de la palabra")}</a
      >
    </p>
  </div>`;
}

function wordCard(I, card, flags) {
  const ribbon =
    card.rarity === "visit"
      ? html`<span class="alb-ribbon">${I.T("Visit me again", "Vuelve a visitarme")}</span>`
      : "";
  const label = I.S(
    `${card.hw}, ${card.rarity === "visit" ? "review needed, visit me again" : `${RARITY_LABEL[card.rarity][0]} card, ${STATE_LABEL[card.state][0]}`}. Turn over to see its meaning.`,
    `${card.hw}, ${card.rarity === "visit" ? "necesita repaso, vuelve a visitarme" : `tarjeta ${RARITY_LABEL[card.rarity][1].toLowerCase()}, ${STATE_LABEL[card.state][1].toLowerCase()}`}. Voltea para ver su significado.`,
  );
  return html`<li
    class="alb-item"
    data-alb-card
    data-state="${card.state}"
    data-hw="${card.hw.toLowerCase()}"
  >
    <article
      class="alb-card"
      data-rarity="${card.rarity}"
      data-state="${card.state}"
      data-flipped="false"
    >
      <div class="alb-face alb-front" data-alb-front>
        <span class="alb-tag">${stateLine(I, card)}</span>
        ${ribbon}
        <span class="alb-pic" aria-hidden="true"
          >${card.word ? visualHTML(card.word, { size: "sm", I }) : ""}</span
        >
        <span class="alb-hw" lang="en">${card.hw}</span>
        <span class="alb-pos">${posName(I, card.pos)}</span>
        <button
          type="button"
          class="alb-flip"
          data-alb-flip
          data-alb-focus
          aria-expanded="false"
          aria-label="${label}"
          tabindex="-1"
        >
          <span class="alb-sr">${I.T("Turn over", "Voltear")}</span>
        </button>
      </div>
      ${backFace(I, card, flags)}
    </article>
  </li>`;
}

function lessonSection(I, grade, lesson, flags) {
  const m = meterOf(lesson);
  return html`<section
    class="alb-lesson"
    data-alb-lesson
    data-complete="${m.complete}"
    data-started="${lesson.started}"
    aria-labelledby="albL${lesson.id}"
  >
    <header class="alb-lesson-head">
      <h4 id="albL${lesson.id}">
        <a href="${lessonHref(grade, lesson.n)}">${I.T("Lesson", "Lección")} ${lesson.n}</a>
        <span class="alb-lesson-title" lang="en">${lesson.title}</span>
      </h4>
      <p class="alb-lesson-meter">
        ${progressMeter(I, m.done, m.total, I.S(`Cards unlocked in Lesson ${lesson.n}`, `Tarjetas desbloqueadas en la Lección ${lesson.n}`))}
        <span class="alb-count"
          >${I.T(`${m.done} of ${m.total} cards unlocked`, `${m.done} de ${m.total} tarjetas desbloqueadas`)}</span
        >
        ${m.complete ? html`<span class="va-pill" data-tone="ok">${I.T("Set complete", "Colección completa")}</span>` : ""}
      </p>
    </header>
    ${
      lesson.started
        ? html`<ul class="alb-grid" role="list" data-alb-grid>
            ${lesson.cards.map((c, i) => (c.locked ? lockedCard(I, grade, lesson, i + 1) : wordCard(I, c, flags)))}
          </ul>`
        : html`<p class="alb-empty">
            ${I.T("No cards yet.", "Todavía no hay tarjetas.")}
            <a href="${lessonHref(grade, lesson.n, "a")}"
              >${I.T("Open this lesson to meet its words.", "Abre esta lección para conocer sus palabras.")}</a
            >
          </p>`
    }
  </section>`;
}

function gradeSection(I, g, flags) {
  const m = meterOf(g);
  return html`<section
    class="alb-grade"
    data-alb-grade="${g.grade}"
    aria-labelledby="albG${g.grade}"
  >
    <h3 id="albG${g.grade}">
      <a href="${vaHref("grade", g.grade)}">${gradeName(I, g.grade)}</a>
      <span class="alb-sub"
        >${I.T(`${m.done} of ${m.total} cards unlocked`, `${m.done} de ${m.total} tarjetas desbloqueadas`)}</span
      >
    </h3>
    ${g.units.map(
      (u) =>
        html`<section
          class="alb-unit"
          data-alb-unit="${u.u}"
          aria-labelledby="albU${g.grade}x${u.u}"
        >
          <h4 id="albU${g.grade}x${u.u}">
            <a href="${unitHref(g.grade, u.u)}">${I.T("Unit", "Unidad")} ${u.u}</a>
            <span class="alb-sub"
              >${I.T(`${u.unlocked} of ${u.total} cards unlocked`, `${u.unlocked} de ${u.total} tarjetas desbloqueadas`)}</span
            >
          </h4>
          ${u.lessons.map((l) => lessonSection(I, g.grade, l, flags))}
        </section>`,
    )}
  </section>`;
}

// ── page ────────────────────────────────────────────────────────────────────────────────────
function legend(I) {
  const rows = [
    ["learning", "common"],
    ["developing", "uncommon"],
    ["applying", "rare"],
    ["secure", "legendary"],
  ];
  return html`<details class="alb-legend">
    <summary>${I.T("What the frames mean", "Qué significan los marcos")}</summary>
    <ul>
      ${rows.map(([s, r]) => html`<li data-rarity="${r}"><strong>${I.T(...RARITY_LABEL[r])}</strong> ${stateIcon(s)} ${I.T(...STATE_LABEL[s])}</li>`)}
      <li data-rarity="visit">
        <strong>${I.T(...RARITY_LABEL.visit)}</strong> ${stateIcon("review-needed")}
        ${I.T(...STATE_LABEL["review-needed"])}
      </li>
      <li data-rarity="locked">
        <strong>${I.T(...RARITY_LABEL.locked)}</strong> ${stateIcon("new")}
        ${I.T("Meet the word in its lesson to unlock it.", "Conoce la palabra en su lección para desbloquearla.")}
      </li>
    </ul>
    <p class="va-note">
      ${I.T("A frame grows as you use a word in more ways over time. It is practice for your learning, not a score.", "El marco crece cuando usas la palabra de más maneras con el tiempo. Es práctica para tu aprendizaje, no un puntaje.")}
    </p>
  </details>`;
}

function filters(I, grades, wantGrade) {
  return html`<form
    class="alb-filters"
    role="search"
    aria-label="${I.S("Filter cards", "Filtrar tarjetas")}"
   
  >
    <label
      >${I.T("Grade", "Grado")}
      <select data-alb-grade-pick>
        <option value="">${I.S("All my grades", "Todos mis grados")}</option>
        ${grades.map((g) => html`<option value="${g}" ${g === wantGrade ? "selected" : ""}>${gradeNameS(I, g)}</option>`)}
      </select></label
    >
    <label
      >${I.T("Card state", "Estado de la tarjeta")}
      <select data-alb-state-pick>
        <option value="">${I.S("All cards", "Todas las tarjetas")}</option>
        ${ALBUM_STATES.map((s) => html`<option value="${s}">${s === "new" ? I.S("Locked", "Bloqueadas") : I.S(...STATE_LABEL[s])}</option>`)}
      </select></label
    >
    <label
      >${I.T("Find a word", "Buscar una palabra")}
      <input type="search" data-alb-search autocomplete="off" spellcheck="false" maxlength="40"
    /></label>
  </form>`;
}

export async function render(ctx, va) {
  const { I, progress } = va;
  const q = va.route.q || {};
  const wantGrade = String(q.grade || "").toUpperCase();
  const wantUnit = Number(q.unit) > 0 ? Number(q.unit) : 0;
  const index = await getIndex();
  const grades = gradesToShow(progress, index, { grade: wantGrade });
  const gradeUnits = (
    await Promise.all(
      grades.map(async (g) => {
        const found = await getGradeUnits(g);
        return found ? { grade: g, units: found.units } : null;
      }),
    )
  ).filter(Boolean);
  const loaded = await getWords(metWordIds(progress, gradeUnits));
  const album = buildAlbum(progress, gradeUnits, new Map(loaded.map((w) => [w.id, w])), index);
  const flags = va.supports("reading");
  const here = wantGrade && grades.includes(wantGrade) ? wantGrade : "";
  const trail = crumbs(I, [rootCrumb(I), [I.S("Word Album", "Álbum de palabras"), ""]]);
  const missions = missionsFor(progress, album, { index });
  const t = album.totals;
  const empty = !album.grades.length || t.cards === 0;
  const body = empty
    ? html`<section class="va-panel va-empty" aria-labelledby="albEmptyH">
        <h2 id="albEmptyH">
          ${I.T("Your album is waiting for its first card", "Tu álbum espera su primera tarjeta")}
        </h2>
        <p>
          ${I.T("Meet a word in a lesson and its card appears here.", "Conoce una palabra en una lección y su tarjeta aparece aquí.")}
        </p>
        <p>
          <a class="btn btn-primary va-btn" href="${vaHref("grades")}"
            >${I.T("Choose a grade", "Elegir un grado")}</a
          >
        </p>
      </section>`
    : html`${legend(I)}
        ${filters(
          I,
          album.grades.map((g) => g.grade),
          here,
        )}
        ${
          wantUnit && here
            ? html`<p class="alb-unit-chip" data-alb-unit-chip>
                ${I.T(`Showing Unit ${wantUnit} of ${gradeNameS(I, here)} only.`, `Mostrando solo la Unidad ${wantUnit} de ${gradeNameS(I, here)}.`)}
                <a href="${vaHref("album")}?grade=${encodeURIComponent(here)}"
                  >${I.T("Show every unit", "Mostrar todas las unidades")}</a
                >
              </p>`
            : ""
        }
        <p class="alb-status" role="status" aria-live="polite" data-alb-status></p>
        <div class="alb-groups">${album.grades.map((g) => gradeSection(I, g, flags))}</div>`;
  return {
    title: I.S("Word Album", "Álbum de palabras"),
    html: html`${trail}
      <div class="val alb" data-alb data-alb-unit-want="${wantUnit}" data-alb-grade-want="${here}">
        <header class="va-hero">
          <p class="eyebrow">${I.T("My Vocabulary", "Mi vocabulario")}</p>
          <h1 id="vaTitle" tabindex="-1">${I.T("Word Album", "Álbum de palabras")}</h1>
          <p class="va-lead">
            ${I.T("Every word you meet becomes a card. Use a word in more ways and its frame grows.", "Cada palabra que conoces se vuelve una tarjeta. Usa una palabra de más maneras y su marco crece.")}
          </p>
          <p class="alb-total">
            <strong>${t.unlocked}</strong>
            ${I.T(`of ${t.cards} cards unlocked`, `de ${t.cards} tarjetas desbloqueadas`)}
          </p>
        </header>
        ${missionsSection(I, missions)} ${body}
        <p class="va-actions">
          <a class="btn va-btn" href="${vaHref()}"
            >${I.T("Back to My Vocabulary", "Volver a Mi vocabulario")}</a
          >
        </p>
      </div>`,
  };
}

// ── behaviour: flip, filters, roving focus ──────────────────────────────────────────────────
const focusables = (root) => [
  ...root.querySelectorAll("[data-alb-card]:not([hidden]) [data-alb-focus]"),
];
const isHidden = (el) => Boolean(el.closest("[hidden]"));

function flip(card, on) {
  const front = card.querySelector("[data-alb-front]");
  const back = card.querySelector("[data-alb-back]");
  const btn = card.querySelector("[data-alb-flip]");
  card.dataset.flipped = on ? "true" : "false";
  front.toggleAttribute("inert", on);
  front.setAttribute("aria-hidden", on ? "true" : "false");
  back.toggleAttribute("inert", !on);
  back.setAttribute("aria-hidden", on ? "false" : "true");
  btn.setAttribute("aria-expanded", on ? "true" : "false");
  (on ? back.querySelector("[data-alb-unflip]") : btn).focus({ preventScroll: false });
}

function moveFocus(root, from, key) {
  const all = focusables(root).filter((el) => !isHidden(el));
  const i = all.indexOf(from);
  if (i < 0) return;
  const grid = from.closest("[data-alb-grid]");
  const mine = all.filter((el) => el.closest("[data-alb-grid]") === grid);
  const j = mine.indexOf(from);
  const top = (el) => el.closest("[data-alb-card]").offsetTop;
  const cols = mine.filter((el) => top(el) === top(mine[0])).length || 1;
  let next = null;
  if (key === "ArrowRight") next = all[i + 1];
  else if (key === "ArrowLeft") next = all[i - 1];
  else if (key === "ArrowDown")
    next = mine[j + cols] || all[i + (mine.length - j)] || mine[mine.length - 1];
  else if (key === "ArrowUp") next = mine[j - cols] || all[i - j - 1] || mine[0];
  else if (key === "Home") next = mine[0];
  else if (key === "End") next = mine[mine.length - 1];
  if (!next) return;
  for (const el of root.querySelectorAll("[data-alb-focus]")) el.tabIndex = -1;
  next.tabIndex = 0;
  next.focus();
}

function setRoving(root) {
  for (const el of root.querySelectorAll("[data-alb-focus]")) el.tabIndex = -1;
  for (const grid of root.querySelectorAll("[data-alb-grid]")) {
    const first = [...grid.querySelectorAll("[data-alb-card]:not([hidden]) [data-alb-focus]")][0];
    if (first) first.tabIndex = 0;
  }
}

export function mount(root, ctx, va) {
  const host = root.querySelector("[data-alb]");
  if (!host) return;
  const I = va.I;
  const wantUnit = Number(host.dataset.albUnitWant) || 0;
  const wantGrade = host.dataset.albGradeWant || "";
  const gradePick = host.querySelector("[data-alb-grade-pick]");
  const statePick = host.querySelector("[data-alb-state-pick]");
  const search = host.querySelector("[data-alb-search]");
  const status = host.querySelector("[data-alb-status]");

  const apply = () => {
    const grade = gradePick?.value || "";
    const state = statePick?.value || "";
    const text = search?.value || "";
    const narrowed = Boolean(state || text.trim());
    let shown = 0;
    for (const g of host.querySelectorAll("[data-alb-grade]")) {
      const gradeOk = !grade || g.dataset.albGrade === grade;
      let gradeShown = 0;
      for (const u of g.querySelectorAll("[data-alb-unit]")) {
        const unitOk =
          !(wantUnit && wantGrade && g.dataset.albGrade === wantGrade) ||
          Number(u.dataset.albUnit) === wantUnit;
        let unitShown = 0;
        for (const l of u.querySelectorAll("[data-alb-lesson]")) {
          let lessonShown = 0;
          for (const li of l.querySelectorAll("[data-alb-card]")) {
            const card = {
              state: li.dataset.state,
              locked: li.dataset.state === "new",
              hw: li.dataset.hw || "",
            };
            const ok = gradeOk && unitOk && cardMatches(card, { state, search: text });
            li.hidden = !ok;
            if (ok) lessonShown += 1;
          }
          const noCards = !l.querySelector("[data-alb-card]");
          l.hidden =
            !(gradeOk && unitOk) || (narrowed ? lessonShown === 0 : !noCards && lessonShown === 0);
          if (!l.hidden) unitShown += 1;
          shown += lessonShown;
          gradeShown += lessonShown;
        }
        u.hidden = !(gradeOk && unitOk) || unitShown === 0;
      }
      g.hidden = !gradeOk || (narrowed && gradeShown === 0);
    }
    setRoving(host);
    if (status)
      status.textContent = shown
        ? I.S(
            `Showing ${shown} ${shown === 1 ? "card" : "cards"}.`,
            `Mostrando ${shown} ${shown === 1 ? "tarjeta" : "tarjetas"}.`,
          )
        : narrowed
          ? I.S(
              "No cards match. Clear the state or the search to see more.",
              "Ninguna tarjeta coincide. Quita el estado o la búsqueda para ver más.",
            )
          : "";
  };

  const onClick = (e) => {
    const flipBtn = e.target.closest("[data-alb-flip]");
    if (flipBtn) return flip(flipBtn.closest(".alb-card"), true);
    const back = e.target.closest("[data-alb-unflip]");
    if (back) flip(back.closest(".alb-card"), false);
  };
  const onKeydown = (e) => {
    const target = e.target;
    if (e.key === "Escape") {
      const card = target.closest?.(".alb-card[data-flipped='true']");
      if (card) {
        e.preventDefault();
        flip(card, false);
      }
      return;
    }
    if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
    if (!target.matches?.("[data-alb-focus]")) return;
    e.preventDefault();
    moveFocus(host, target, e.key);
  };
  const onFocusIn = (e) => {
    const t = e.target;
    if (!t.matches?.("[data-alb-focus]")) return;
    const grid = t.closest("[data-alb-grid]");
    for (const el of grid.querySelectorAll("[data-alb-focus]")) el.tabIndex = -1;
    t.tabIndex = 0;
  };
  host.querySelector(".alb-filters")?.addEventListener("submit", (e) => e.preventDefault());
  gradePick?.addEventListener("change", apply);
  statePick?.addEventListener("change", apply);
  search?.addEventListener("input", apply);
  host.addEventListener("click", onClick);
  host.addEventListener("keydown", onKeydown);
  host.addEventListener("focusin", onFocusIn);
  apply();
  cleanup = () => {
    host.removeEventListener("click", onClick);
    host.removeEventListener("keydown", onKeydown);
    host.removeEventListener("focusin", onFocusIn);
  };
}

export const unmount = () => {
  cleanup?.();
  cleanup = null;
};
export const onClick = () => false;
export const onChange = () => false;
export const onInput = () => false;
