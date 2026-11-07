// My collection book (/collection): badges for effort and for the range of ways a learner works, plus the mission
// keepsakes and skill shields the lab already awards. Nobody is compared; there is no ranking, timer or points total.
// Badge rules and the first-earned dates: src/lang/collection.js. Evidence: src/experience-data.js.
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { BADGES, GROUPS, evaluate, gatherEvidence, syncEarned } from "../lang/collection.js";
import { AVATAR_ITEMS } from "../lang/unlocks.js";
import { loadExperience } from "../experience-data.js";
import { announce, formatDate, html, icon, todayISO } from "../util.js";
import { shieldsHTML } from "./shields.js";
import { rhythmHTML } from "./warmup.js";

const BASE = "/access-practice-lab";

/** Evidence for the book from a loaded experience (shared with the portfolio's badge dates). */
export const evidenceFrom = (x) =>
  gatherEvidence({
    warmup: x.warmup,
    ledger: x.ledger,
    studio: x.studio,
    reading: x.reading,
    games: x.games,
    records: x.records,
    practice: x.practice,
    garden: x.garden,
    prefs: x.prefs,
  });

/** Save any badge the evidence newly shows and say so once, calmly. Returns the new ids. */
export function recordNewBadges(ctx, x, I) {
  const { collection, fresh } = syncEarned(x.prefs.collection, evidenceFrom(x), todayISO());
  if (fresh.length) {
    ctx.setPrefs({ collection });
    const names = fresh.map((id) => BADGES.find((b) => b.id === id).name);
    announce(
      I.S(
        `New in your collection book: ${names.map((n) => n.en).join(", ")}.`,
        `Nuevo en tu libro de colección: ${names.map((n) => n.es).join(", ")}.`,
      ),
      { tone: "success" },
    );
  }
  return fresh;
}

function badgeHTML(I, b, fresh) {
  return html`<li class="cb-badge g-${b.group}${b.earned ? " is-earned" : ""}">
    <span class="cb-medal" aria-hidden="true">${icon(b.icon)}</span>
    <div>
      <h4>
        ${I.TO(b.name)}${fresh ? html` <span class="cb-new">${I.T("New", "Nuevo")}</span>` : ""}
      </h4>
      <p class="fine">${I.TO(b.how)}</p>
      <p class="cb-state">
        ${b.earned ? html`${icon("check")} ${b.date ? I.T(`In my book since ${formatDate(b.date)}`, `En mi libro desde ${formatDate(b.date)}`) : I.T("In my book", "En mi libro")}` : I.T("Waiting for me", "Me está esperando")}
      </p>
    </div>
  </li>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const title = I.S("My collection book", "Mi libro de colección");
  const x = await loadExperience(ctx);
  const fresh = recordNewBadges(ctx, x, I);
  const badges = evaluate(evidenceFrom(x), ctx.prefs.collection);
  const have = badges.filter((b) => b.earned).length;
  const q = `?grades=${band}`;
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/${q}`],
        [title, null],
      ])}
      <article class="cb-page" aria-labelledby="cbTitle">
        <header class="cb-head">
          <p class="eyebrow">
            ${I.T("Only mine · nobody is compared", "Solo mío · nadie se compara")}
          </p>
          <h1 id="cbTitle" tabindex="-1">${I.T("My collection book", "Mi libro de colección")}</h1>
          <p class="lead">
            ${I.T("Each badge is something I did: showing up, trying new ways to learn, making my work better. Take your time. Every badge stays in my book.", "Cada insignia es algo que hice: presentarme, probar formas nuevas de aprender, mejorar mi trabajo. Sin prisa. Cada insignia se queda en mi libro.")}
          </p>
          <p role="status">
            <strong
              >${I.T(`${have} ${have === 1 ? "badge" : "badges"} in my book.`, `${have} ${have === 1 ? "insignia" : "insignias"} en mi libro.`)}</strong
            >
            ${I.T("The others are waiting for whenever I am ready.", "Las demás esperan a que yo esté listo.")}
          </p>
          <div class="row-actions">
            <a class="btn btn-primary" href="${BASE}/warmup${q}"
              >${icon("sparkle")} ${I.T("Today's warm-up", "Calentamiento de hoy")}</a
            >
            <a class="btn" href="${BASE}/portfolio${q}"
              >${icon("passport")} ${I.T("My portfolio", "Mi portafolio")}</a
            >
          </div>
        </header>
        ${rhythmHTML(I, x.warmup, x.practice)}
        ${GROUPS.map(
          ([id, name, text]) =>
            html`<section class="panel cb-group" aria-labelledby="cb-${id}">
              <h2 id="cb-${id}">${I.TO(name)}</h2>
              <p class="fine">${I.TO(text)}</p>
              <ul class="cb-grid">
                ${badges.filter((b) => b.group === id).map((b) => badgeHTML(I, b, fresh.includes(b.id)))}
              </ul>
            </section>`,
        )}
        <section class="panel cb-group" aria-labelledby="cb-keepsakes">
          <h2 id="cb-keepsakes">${I.T("Mission keepsakes", "Recuerdos de misiones")}</h2>
          <p class="fine">
            ${I.T("Finish an academic mission to add its keepsake. You can wear one in Passport.", "Termina una misión académica para añadir su recuerdo. Puedes usar uno en el Pasaporte.")}
          </p>
          <ul class="cb-grid">
            ${AVATAR_ITEMS.map((k) => {
              const done = x.studio.missions?.[k.mission]?.done === true;
              return html`<li class="cb-badge g-keepsake${done ? " is-earned" : ""}">
                <span class="cb-medal" aria-hidden="true">${icon(k.icon)}</span>
                <div>
                  <h4>${I.TO(k.name)}</h4>
                  <p class="cb-state">
                    ${done ? html`${icon("check")} ${I.T("In my book", "En mi libro")}` : html`<a href="${BASE}/missions/${k.mission}${q}">${I.T("Start this mission", "Empezar esta misión")}</a>`}
                  </p>
                </div>
              </li>`;
            })}
          </ul>
        </section>
        ${shieldsHTML(I, x.ledger.entries, x.records)}
        <p class="fine">
          ${I.T("This book is practice you can see. It is not a test result, and it does not estimate an ACCESS score. It stays on this device.", "Este libro es práctica que puedes ver. No es un resultado de prueba ni estima una puntuación de ACCESS. Se queda en este dispositivo.")}
        </p>
      </article>`,
  };
}
