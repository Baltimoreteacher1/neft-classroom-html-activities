import { STUDIO_COPY as C, MODELS, modelGraphic, studioFacts } from "./model-studio.js";
import { bi } from "./problem-view.js";

export function renderModelStudio(key, family) {
  const model = MODELS[key];
  const initial = model.draw(...model.controls.map((control) => control.start));
  const controls = model.controls
    .map(
      ({ label, min, max, start }, i) => `
    <div class="studio-control">
      <label for="studio-v${i}">${bi(label)} <span class="studio-value" data-studio-value="${i}" aria-hidden="true">${start}</span></label>
      <div class="studio-adjust">
        <button type="button" data-delta="-1" data-index="${i}"><span aria-hidden="true">−</span><span class="sr">${bi(C.decrease)} ${bi(label)}</span></button>
        <input id="studio-v${i}" type="range" min="${min}" max="${max}" value="${start}" step="1" />
        <button type="button" data-delta="1" data-index="${i}"><span aria-hidden="true">+</span><span class="sr">${bi(C.increase)} ${bi(label)}</span></button>
      </div>
    </div>`,
    )
    .join("");
  return `<details class="model-studio section no-print" id="math-model" data-studio="${key}">
    <summary class="studio-opening"><span class="studio-mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <span><span class="studio-kicker">${bi(C.name)}</span><strong>${bi(model.title)}</strong></span>
    </summary>
    <div class="studio-content">
      <p class="studio-intro">${bi(C.instruction)}</p>
      <div class="studio-workspace">
        <div class="studio-figure"><div data-studio-art>${modelGraphic(initial.art)}</div>
          <dl class="studio-facts" data-studio-facts>${studioFacts(initial)}</dl><div class="sr" data-studio-update role="status"></div>
          ${initial.table ? `<details class="studio-table"><summary>${bi(C.table)}</summary><table><thead><tr><th scope="col">${bi(C.tableX)}</th><th scope="col">${bi(C.tableY)}</th></tr></thead><tbody>${initial.table.map(([x, y]) => `<tr><th scope="row">${x}</th><td>${y}</td></tr>`).join("")}</tbody></table></details>` : ""}
        </div>
        <div class="studio-console" hidden>
          ${controls}
          <div class="studio-challenge">
            <h3>${bi(C.challenge)}</h3>
            <p data-studio-prompt>${bi(model.tasks[0].prompt)}</p>
            <div class="row">
              <button class="btn primary" type="button" data-studio-action="check">${bi(C.check)}</button>
              <button class="btn quiet" type="button" data-studio-action="next">${bi(C.next)}</button>
            </div>
            <p class="studio-result" data-studio-result role="status"></p>
          </div>
          <button class="btn quiet" type="button" data-studio-action="reset">${bi(C.reset)}</button>
        </div>
      </div>
      <p class="studio-talk"><strong>${bi(family ? C.partner : C.solo)}</strong> ${bi(model.talk)}</p>
    </div>
  </details>`;
}

export function renderModelGallery(unit) {
  const models = Object.values(MODELS).filter(
    (model) => !unit || model.lessons[0].startsWith(`${unit}-`),
  );
  if (!models.length) return "";
  return `<section class="section studio-gallery no-print" aria-labelledby="studio-gallery-heading">
    <h2 id="studio-gallery-heading">${bi(C.explore)}</h2><p>${bi(C.hubIntro)}</p>
    <ul>${models
      .map((model) => {
        const art = model.draw(...model.controls.map((control) => control.start)).art;
        return `<li><a href="/lessons/${model.lessons[0]}/family-guide#math-model">
        <div class="studio-figure">${modelGraphic(art)}</div>
        <strong>${bi(model.title)}</strong><span aria-hidden="true">↗</span>
      </a></li>`;
      })
      .join("")}</ul>
  </section>`;
}
