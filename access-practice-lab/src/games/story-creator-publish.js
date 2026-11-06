// Story Creator finish: the published storyboard, read back aloud, with a story-strength rating (fit, first
// tries, revisions, hints; never speed), the sticker shelf, a recap of the language practiced and an
// optional own-words title. Pure function of state.
import { audioBtn, frameBox, html, icon, raw } from "./engine.js";
import { finalLine } from "./story-creator-lines.js";
import { panelScene } from "./story-creator-art.js";
import { ROLES, T2, TIER, guide, seedOf, stepScore, tierOf } from "./story-creator-view.js";

// ── publish: the finished storyboard ─────────────────────────────────────────────────────
export function strength(s) {
  const steps = s.panels.flatMap((P) => [P.prs, P.lrs]);
  const sum = steps.reduce((a, rs) => a + stepScore(rs), 0);
  return {
    stars: Math.max(1, Math.round((sum / (steps.length * 3)) * 5)),
    fit: s.panels.filter((P) => P.prs.status === "right").length,
    lines: s.panels.filter((P) => P.lrs.status === "right").length,
    revised: steps.filter((rs) => rs.status === "right" && rs.tries > 1).length,
    hints: steps.reduce((a, rs) => a + rs.h, 0),
  };
}
const RATING = [
  null,
  ["First draft: keep building!", "Primer borrador: ¡sigue construyendo!"],
  ["Growing story", "Cuento en crecimiento"],
  ["Solid story", "Cuento sólido"],
  ["Strong story", "Cuento fuerte"],
  ["Award-winning story", "Cuento de premio"],
];

export function publishView(s, env) {
  const I = env.I;
  const seed = seedOf(s, env);
  const st = strength(s);
  const text = (panel, lang) =>
    `${panel.pieces.find((x) => x.ok)[lang]} ${lang === "en" ? finalLine(panel.line) : panel.line.es}`;
  const story = {
    en: seed.panels.map((p) => text(p, "en")).join(" "),
    es: seed.panels.map((p) => text(p, "es")).join(" "),
  };
  const title = s.title.trim() || I.S(seed.title.en, seed.title.es);
  const frame = env.band === "6-8" ? "My title: ___: A Story of ___" : "My story is called ___.";
  const recap = seed.panels.map((p) => {
    const l = p.line;
    const what =
      l.kind === "punct"
        ? I.T("Dialogue punctuation", "Puntuación del diálogo")
        : l.kind === "connector"
          ? I.T(`Connecting word: ${l.answer}`, `Palabra de enlace: ${l.answer}`)
          : I.T(`Precise verb: ${l.weak} → ${l.answer}`, `Verbo preciso: ${l.weak} → ${l.answer}`);
    return html`<li>
      ${icon("check")}<span><strong>${what}.</strong> ${finalLine(l)}</span>
    </li>`;
  });
  return html`<section class="scr scr-publish" data-mechanic="storyboard">
    <div class="scr-confetti" aria-hidden="true">
      ${Array.from({ length: 14 }, (_, i) => raw(`<i style="--i:${i}"></i>`))}
    </div>
    ${guide(env, "cheer", I.T("Your storyboard is finished!", "¡Tu guion gráfico está terminado!"), I.T("Give it a title if you like, listen to it, then publish.", "Ponle un título si quieres, escúchalo y luego publícalo."), "right")}
    <h2 class="scr-h scr-title" tabindex="-1">${title}</h2>
    <p class="scr-listen">
      ${audioBtn(`${title}. ${story.en}`, I, I.S("Read my whole story aloud", "Leer mi cuento completo en voz alta"))}${env.sup.gloss !== "off" ? html`<button type="button" class="gs-audio" data-say-es="${story.es}">${icon("volume")}<span>${I.T("Listen in Spanish", "Escuchar en español")}</span></button>` : ""}
    </p>
    <ol class="scr-board">
      ${seed.panels.map(
        (p, i) =>
          html`<li class="scr-board-cell">
            <figure>
              ${panelScene(seed, p, env.band, { label: I.S(`Panel ${i + 1}`, `Panel ${i + 1}`) })}
              <figcaption>
                <span class="scr-board-n">${i + 1}. ${T2(I, ROLES[p.role].name)}</span>
                ${I.T(text(p, "en"), text(p, "es"))}
              </figcaption>
            </figure>
          </li>`,
      )}
    </ol>
    <div class="scr-results">
      <div class="scr-rating">
        <p
          class="scr-stars"
          aria-label="${I.S(`Story strength: ${st.stars} of 5 stars`, `Fuerza del cuento: ${st.stars} de 5 estrellas`)}"
        >
          ${Array.from({ length: 5 }, (_, i) => html`<span class="scr-star${i < st.stars ? " is-on" : ""}" aria-hidden="true">${icon("star")}</span>`)}
        </p>
        <p class="scr-rating-l">${T2(I, RATING[st.stars])}</p>
        <ul class="scr-why">
          <li>
            ${I.T(`Panels that fit together: ${st.fit} of 4`, `Paneles que encajan: ${st.fit} de 4`)}
          </li>
          <li>
            ${I.T(`Lines you polished yourself: ${st.lines} of 4`, `Líneas que puliste tú: ${st.lines} de 4`)}
          </li>
          <li>
            ${I.T(`Revisions that worked: ${st.revised}`, `Revisiones que funcionaron: ${st.revised}`)}
          </li>
          <li>${I.T(`Hints used: ${st.hints}`, `Pistas usadas: ${st.hints}`)}</li>
        </ul>
      </div>
      <div class="scr-shelf">
        <h3>${I.T("Sticker shelf", "Repisa de calcomanías")}</h3>
        <ul>
          ${seed.panels.map((p, i) => html`<li class="scr-shelf-i is-${tierOf(s.panels[i])}">${icon("star")}<span>${T2(I, ROLES[p.role].sticker)}</span><small>${T2(I, TIER[tierOf(s.panels[i])])}</small></li>`)}
        </ul>
        <p class="fine">
          ${I.T(`Best understanding streak: ${s.best}`, `Mejor racha de comprensión: ${s.best}`)}
        </p>
      </div>
    </div>
    <div class="scr-recap">
      <h3>${I.T("What you practiced", "Lo que practicaste")}</h3>
      <ul>
        ${recap}
      </ul>
    </div>
    <label class="gs-label"
      >${I.T("Your title (optional)", "Tu título (opcional)")}<input
        class="gs-input"
        data-g-title
        maxlength="80"
        value="${s.title}"
        autocomplete="off"
    /></label>
    ${frameBox(frame, env)}
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-g-publish>
        ${icon("launch")}${I.T("Publish my story", "Publicar mi cuento")}
      </button>
    </div>
  </section>`;
}
