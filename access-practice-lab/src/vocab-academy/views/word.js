// A word card (/vocabulary-academy/word/<wordId>). Core-owned.
// The word large, how it sounds, what it means, how it is used, how it is built and what it is related to, plus one small
// self-check that records real evidence. Supports come from the learner's profile (va.supports): the card never decides
// them. Opening a card is a first exposure, so a word nobody has met becomes "learning" (and never more than that).
import { html, icon, raw } from "../../util.js";
import { getGradeOverview, getWord, gradeHref, lessonHref, vaHref, wordHref } from "../data.js";
import { markSeen, recordResult, wordEntry } from "../model.js";
import { rngFor } from "../rng.js";
import { crumbs, gradeNameS, notPublishedPanel, posName, rootCrumb, stateBadge } from "../ui.js";
import { formatDate } from "../../util.js";

/** The one open self-check: { wordId, variant:"fit"|"misfit", answered:""|"yes"|"no" }. Reset whenever another card opens. */
let check = { wordId: "", variant: "fit", answered: "" };

/** Which sentence the check shows first for a word: stable (seeded by the id), and "misfit" only when the word has one. */
export const firstVariant = (word) =>
  word.misuse?.s && rngFor(`${word.id}:check`).int(2) === 1 ? "misfit" : "fit";

/** Grade the self-check answer. Pure: { ok, said, fits }. */
export const gradeCheck = (variant, answer) => ({
  ok: (variant === "fit") === (answer === "yes"),
  said: answer,
  fits: variant === "fit",
});

/** Words of this unit in order, for Previous / Next links. */
const neighbours = (unit, id) => {
  const list = unit.words || [];
  const i = list.findIndex((w) => w.id === id);
  return {
    prev: i > 0 ? list[i - 1] : null,
    next: i >= 0 && i < list.length - 1 ? list[i + 1] : null,
  };
};

const listenButton = (I, text, label) =>
  html`<button type="button" class="btn va-btn va-listen" data-say="${text}" aria-label="${label}">
    ${icon("volume")}<span>${I.T("Listen", "Escuchar")}</span>
  </button>`;
const listenSmall = (I, text) =>
  html`<button
    type="button"
    class="btn va-btn va-listen va-listen-sm"
    data-say="${text}"
    aria-label="${I.S("Listen to this sentence", "Escuchar esta oración")}"
  >
    ${icon("volume")}
  </button>`;

/** Picture: the Activities agent's art.js when it exists, else a text card (glyphs + the real alt text). */
async function visualFor(word, I) {
  try {
    const art = await import("../art.js");
    if (typeof art.visualHTML === "function") {
      const out = art.visualHTML(word, { size: "lg", I });
      return typeof out === "string" ? raw(out) : out;
    }
  } catch {
    // art.js not published (or failed to load): the fallback below is a complete, accessible card
  }
  const v = word.visual;
  if (!v || v.kind === "none") return "";
  const glyphs = Array.isArray(v.glyphs) ? v.glyphs.slice(0, 3).join(" ") : "";
  return html`<figure class="va-visual" ${v.alt ? raw("") : ""}>
    ${
      glyphs
        ? html`<div class="va-visual-glyphs" role="img" aria-label="${v.alt || word.hw}">
            ${glyphs}
          </div>`
        : ""
    }
    ${v.alt ? html`<figcaption class="fine">${v.alt}</figcaption>` : ""}
  </figure>`;
}

function checkCard(I, word) {
  const fit = check.variant === "fit" || !word.misuse?.s;
  const sentence = fit ? word.ex : word.misuse.s;
  const done = check.answered;
  const res = done ? gradeCheck(fit ? "fit" : "misfit", done) : null;
  return html`<section class="va-card va-card-wide" aria-labelledby="vaCheckH">
    <h2 id="vaCheckH">${I.T("Check yourself", "Compruébalo tú")}</h2>
    <p>
      ${I.T("Does this sentence use the word", "¿Esta oración usa bien la palabra")}
      <strong lang="en">${word.hw}</strong> ${I.T("correctly?", "?")}
    </p>
    <blockquote class="va-sentence" lang="en">${sentence}</blockquote>
    ${
      done
        ? html`<p class="feedback va-feedback" role="status" data-ok="${res.ok}">
              <strong
                >${res.ok ? I.T("Yes, that is right.", "Sí, es correcto.") : I.T("Not quite.", "Todavía no.")}</strong
              >
              ${
                res.fits
                  ? html`${I.T("This sentence does use the word correctly.", "Esta oración sí usa bien la palabra.")}
                      <span lang="en">${word.def}</span>`
                  : html`${I.T("This sentence does not fit the word.", "Esta oración no encaja con la palabra.")}
                      <span lang="en">${word.misuse.why}</span>`
              }
            </p>
            <p>
              <button type="button" class="btn btn-primary va-btn" data-va-check-next>
                ${I.T("Try another sentence", "Probar otra oración")}
              </button>
            </p>`
        : html`<div
              class="va-actions"
              role="group"
              aria-label="${I.S("Your answer", "Tu respuesta")}"
            >
              <button type="button" class="btn va-btn" data-va-check="yes">
                ${I.T("Yes, it fits", "Sí, encaja")}
              </button>
              <button type="button" class="btn va-btn" data-va-check="no">
                ${I.T("No, it does not fit", "No, no encaja")}
              </button>
            </div>
            <p class="fine">
              ${I.T("Take your time. A wrong answer is information, not a mark against you.", "Tómate tu tiempo. Una respuesta incorrecta es información, no un punto en tu contra.")}
            </p>`
    }
  </section>`;
}

const chipsOf = (list, cls = "") =>
  html`<ul class="va-chips ${cls}" lang="en">
    ${list.map((w) => html`<li class="va-chip va-chip-static">${w}</li>`)}
  </ul>`;

function buildCard(I, word) {
  const segs = word.morph?.segs || [];
  const family = word.family || [];
  if (!segs.length && !family.length) return "";
  return html`<section class="va-card" aria-labelledby="vaBuildH">
    <h2 id="vaBuildH">${I.T("How the word is built", "Cómo está formada la palabra")}</h2>
    ${
      segs.length
        ? html`<ul class="va-parts" lang="en">
            ${segs.map((s) => html`<li><strong class="va-part">${s.s}</strong> <span>${s.m}</span></li>`)}
          </ul>`
        : ""
    }
    ${word.morph?.note ? html`<p class="fine" lang="en">${word.morph.note}</p>` : ""}
    ${
      family.length
        ? html`<h3>${I.T("Word family", "Familia de palabras")}</h3>
            <ul class="va-chips" lang="en">
              ${family.map((f) => html`<li class="va-chip va-chip-static">${f.w} <span class="fine">${posName(I, f.pos)}</span></li>`)}
            </ul>`
        : ""
    }
  </section>`;
}

export async function render(ctx, va) {
  const { I, progress } = va;
  const found = await getWord(va.params.wordId);
  if (!found)
    return {
      title: I.S("Word not found", "Palabra no encontrada"),
      html: html`${crumbs(I, [rootCrumb(I), [I.S("Word", "Palabra"), ""]])}${notPublishedPanel(I, {
        title: I.T("We could not find that word", "No pudimos encontrar esa palabra"),
        text: I.T(
          "It is not in a lesson that has been published yet. Open a lesson to meet its words.",
          "No está en una lección que ya se haya publicado. Abre una lección para conocer sus palabras.",
        ),
        href: vaHref("grades"),
        label: I.T("Choose a grade", "Elegir un grado"),
      })}`,
    };

  const { word, unit } = found;
  if (check.wordId !== word.id)
    check = { wordId: word.id, variant: firstVariant(word), answered: "" };
  // First exposure: the word becomes "learning" (and no more) the first time its card opens on this device.
  if (wordEntry(progress, word.id).state === "new") {
    markSeen(progress, word.id, { unit: unit.id, grade: unit.grade });
    va.save();
  }
  const entry = wordEntry(progress, word.id);
  const flags = va.supports("reading");
  const showEs = Boolean(word.es?.gloss) && (flags.glossaryEs || I.mode !== "en");
  const visual = await visualFor(word, I);
  const { prev, next } = neighbours(unit, word.id);
  const uh = lessonHref(unit.grade, unit.n);
  const overview = await getGradeOverview(unit.grade);
  const unitTitle = overview?.units.find((u) => u.n === unit.n)?.title || unit.title;

  return {
    title: word.hw,
    html: html`${crumbs(I, [
        rootCrumb(I),
        [gradeNameS(I, unit.grade), gradeHref(unit.grade)],
        [`${I.S("Lesson", "Lección")} ${unit.n}: ${unitTitle}`, uh],
        [word.hw, ""],
      ])}
      <header class="va-hero va-word-hero">
        ${visual}
        <div class="va-word-head">
          <p class="eyebrow">${posName(I, word.pos)} · ${I.T("Lesson", "Lección")} ${unit.n}</p>
          <h1 class="va-word" id="vaTitle" tabindex="-1" lang="en">${word.hw}</h1>
          ${
            word.pron
              ? html`<p class="va-pron">
                  <span class="visually-hidden">${I.T("How it sounds:", "Cómo suena:")}</span>
                  <span lang="en">${word.pron}</span>
                </p>`
              : ""
          }
          <p class="va-actions">
            ${listenButton(I, word.hw, I.S(`Listen to the word ${word.hw}`, `Escuchar la palabra ${word.hw}`))}
            ${stateBadge(I, entry.state)}
          </p>
          ${
            entry.due
              ? html`<p class="fine">
                  ${I.T("Next review:", "Próximo repaso:")} ${formatDate(entry.due)}
                </p>`
              : ""
          }
        </div>
      </header>

      <div class="va-grid">
        <section class="va-card va-card-wide" aria-labelledby="vaMeanH">
          <h2 id="vaMeanH">${I.T("What it means", "Qué significa")}</h2>
          <p class="va-def" lang="en">${word.def}</p>
          ${
            showEs
              ? html`<p class="va-gloss">
                  <span class="va-kicker">${I.T("In Spanish", "En español")}</span>
                  <strong lang="es">${word.es.gloss}</strong>
                  ${word.es.cognate ? html`<span class="fine">${I.T("It looks and sounds like the English word.", "Se parece a la palabra en inglés.")}</span>` : ""}
                  <button
                    type="button"
                    class="btn va-btn va-listen va-listen-sm"
                    data-say-es="${word.es.gloss}"
                    aria-label="${I.S("Listen in Spanish", "Escuchar en español")}"
                  >
                    ${icon("volume")}
                  </button>
                </p>`
              : word.es?.gloss
                ? html`<details class="va-details">
                    <summary>
                      ${I.T("Show the Spanish word", "Mostrar la palabra en español")}
                    </summary>
                    <p><strong lang="es">${word.es.gloss}</strong></p>
                  </details>`
                : ""
          }
        </section>

        <section class="va-card va-card-wide" aria-labelledby="vaUseH">
          <h2 id="vaUseH">${I.T("How it is used", "Cómo se usa")}</h2>
          <ul class="va-examples">
            ${[word.ex, word.ex2]
              .filter(Boolean)
              .map(
                (s) =>
                  html`<li>
                    <span lang="en">${s}</span
                    >${flags.audio || flags.readAloud ? listenSmall(I, s) : ""}
                  </li>`,
              )}
          </ul>
          ${
            word.nonExample
              ? html`<p class="va-nonex">
                  <span class="va-kicker">${I.T("Not an example", "No es un ejemplo")}</span>
                  <span lang="en">${word.nonExample}</span>
                </p>`
              : ""
          }
          ${
            flags.frames && word.frame
              ? html`<p class="va-frame">
                  <span class="va-kicker">${I.T("Say or write it", "Dilo o escríbelo")}</span>
                  <span lang="en">${word.frame}</span>
                </p>`
              : ""
          }
        </section>

        ${buildCard(I, word)}
        ${
          word.syn?.length || word.ant?.length || word.rel
            ? html`<section class="va-card" aria-labelledby="vaRelH">
                <h2 id="vaRelH">${I.T("Related words", "Palabras relacionadas")}</h2>
                ${
                  word.syn?.length
                    ? html`<h3>${I.T("Close in meaning", "Cercanas en significado")}</h3>
                        ${chipsOf(word.syn)}`
                    : ""
                }
                ${
                  word.ant?.length
                    ? html`<h3>${I.T("Opposite", "Opuestas")}</h3>
                        ${chipsOf(word.ant)}`
                    : ""
                }
                ${word.rel ? html`<p class="fine" lang="en">${I.T("Think about:", "Piensa en:")} ${word.rel}</p>` : ""}
              </section>`
            : ""
        }
        ${
          word.apps
            ? html`<section class="va-card va-card-wide" aria-labelledby="vaAppsH">
                <h2 id="vaAppsH">${I.T("Where you will use it", "Dónde la usarás")}</h2>
                <dl class="va-apps" lang="en">
                  ${
                    word.apps.academic
                      ? html`<dt>${I.T("In school", "En la escuela")}</dt>
                          <dd>${word.apps.academic}</dd>`
                      : ""
                  }
                  ${
                    word.apps.spoken
                      ? html`<dt>${I.T("When talking", "Al hablar")}</dt>
                          <dd>${word.apps.spoken}</dd>`
                      : ""
                  }
                  ${
                    word.apps.writing
                      ? html`<dt>${I.T("When writing", "Al escribir")}</dt>
                          <dd>${word.apps.writing}</dd>`
                      : ""
                  }
                </dl>
              </section>`
            : ""
        }
        ${checkCard(I, word)}
      </div>

      <nav class="va-word-nav" aria-label="${I.S("Words in this unit", "Palabras de esta unidad")}">
        ${prev ? html`<a class="btn va-btn" href="${wordHref(prev.id)}">${icon("arrow-left")} <span lang="en">${prev.hw}</span></a>` : ""}
        <a class="btn va-btn" href="${uh}">${I.T("Back to the lesson", "Volver a la lección")}</a>
        ${next ? html`<a class="btn va-btn" href="${wordHref(next.id)}"><span lang="en">${next.hw}</span> ${icon("arrow-right")}</a>` : ""}
      </nav>`,
  };
}

export function onClick(e, ctx, va) {
  const answer = e.target.closest?.("[data-va-check]");
  if (answer && !check.answered && check.wordId) {
    const value = answer.dataset.vaCheck === "yes" ? "yes" : "no";
    const entry = va.progress.words?.[check.wordId];
    const verdict = gradeCheck(check.variant, value);
    check.answered = value;
    recordResult(va.progress, {
      wordId: check.wordId,
      dim: "mean",
      ok: verdict.ok,
      sup: [],
      type: "wordcard",
      unit: entry?.u,
      grade: entry?.g,
    });
    va.save();
    ctx.rerender();
    return true;
  }
  if (e.target.closest?.("[data-va-check-next]")) {
    check = { ...check, variant: check.variant === "fit" ? "misfit" : "fit", answered: "" };
    ctx.rerender();
    return true;
  }
  return false;
}

export const unmount = () => {
  check = { wordId: "", variant: "fit", answered: "" };
};
