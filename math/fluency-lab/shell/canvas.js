// Synchronized explanation canvas: picture → notation → words, one focus per step. A frame comes from a
// studio engine ({ svg, eq, cap }) so the three representations are produced together and cannot drift.
// At an engine's Predict point the student answers before the step that would show what happens.
import { esc, lang, pickL, tr } from "./words.js";
import { speak } from "../speech.js";

const reduced = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function mountCanvas(host, { frames, predicts = [], onFinish = null, finishLabel = null }) {
  let i = 0;
  const answered = new Set();
  host.innerHTML = `
    <div class="cv">
      <div class="cv-stage" data-stage tabindex="0" aria-roledescription="${esc(tr("Steps"))}"></div>
      <p class="cv-eq" data-eq></p>
      <p class="cv-cap" data-cap aria-live="polite"></p>
      <div class="cv-predict" data-predict hidden></div>
      <div class="cv-nav">
        <button type="button" class="btn btn-quiet" data-back>${esc(tr("Back"))}</button>
        <span class="cv-count" data-count></span>
        <button type="button" class="btn btn-icon" data-say aria-label="${esc(tr("Read aloud"))}" title="${esc(tr("Read aloud"))}">🔊</button>
        <button type="button" class="btn btn-secondary" data-next>${esc(tr("Next"))}</button>
      </div>
    </div>`;
  const q = (s) => host.querySelector(s);
  const predictAt = (index) => predicts.find((p) => p.at === index && !answered.has(index));

  function showPredict(p) {
    const box = q("[data-predict]");
    box.hidden = false;
    box.innerHTML = `<p class="cv-predict-q"><strong>${esc(lang() === "es" ? "Predice:" : "Predict:")}</strong> ${esc(pickL(p.q))}</p>
      <div class="cv-choices">${p.choices.map((c, n) => `<button type="button" class="btn btn-choice" data-choice="${n}">${esc(pickL(c.t))}</button>`).join("")}</div>
      <p class="cv-why" data-why aria-live="polite"></p>`;
    q("[data-next]").disabled = true;
    box.querySelectorAll("[data-choice]").forEach((button) =>
      button.addEventListener("click", () => {
        const choice = p.choices[Number(button.dataset.choice)];
        button.classList.add(choice.ok ? "is-right" : "is-wrong");
        box.querySelector("[data-why]").textContent = pickL(choice.why);
        if (choice.ok) {
          answered.add(p.at);
          box.querySelectorAll("[data-choice]").forEach((b) => (b.disabled = true));
          q("[data-next]").disabled = false;
          q("[data-next]").focus();
        }
      }),
    );
  }

  function render() {
    const f = frames[i];
    const stage = q("[data-stage]");
    stage.classList.toggle("cv-animate", !reduced());
    stage.innerHTML = f.svg;
    q("[data-eq]").textContent = f.eq || "";
    q("[data-cap]").textContent = pickL(f.cap);
    q("[data-count]").textContent = tr("Step {n} of {total}", { n: i + 1, total: frames.length });
    q("[data-back]").disabled = i === 0;
    const last = i === frames.length - 1;
    q("[data-next]").textContent = last && finishLabel ? finishLabel : tr("Next");
    q("[data-next]").disabled = last && !onFinish;
    const box = q("[data-predict]");
    box.hidden = true;
    box.innerHTML = "";
    const p = predictAt(i + 1);
    if (p && !last) showPredict(p);
  }

  q("[data-back]").addEventListener("click", () => {
    if (i > 0) i -= 1;
    render();
  });
  q("[data-next]").addEventListener("click", () => {
    if (i < frames.length - 1) {
      i += 1;
      render();
    } else onFinish?.();
  });
  q("[data-say]").addEventListener("click", () =>
    speak(`${frames[i].eq || ""}. ${pickL(frames[i].cap)}`, lang()),
  );
  q("[data-stage]").addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" && !q("[data-next]").disabled) q("[data-next]").click();
    if (event.key === "ArrowLeft" && i > 0) q("[data-back]").click();
  });
  render();
}

// A static strip of frames (used inside help, where no predicting is asked).
export const frameStrip = (frames) =>
  `<ol class="cv-strip">${frames.map((f) => `<li><div class="cv-stage">${f.svg}</div><p class="cv-eq">${esc(f.eq || "")}</p><p class="cv-cap">${esc(pickL(f.cap))}</p></li>`).join("")}</ol>`;

// Engine pictures are drawn in a ~560-unit viewBox; on a phone that scales 18-unit labels to ~9px. After a picture
// is shown, any label that would render under 13px is enlarged to 13px (at most 1.7× its drawn size, so close
// labels on a number line do not run into each other). Runs again when the width changes.
const MIN_PX = 13;
const MAX_GROW = 1.7;
export function legibleSvg(root) {
  for (const svg of root.querySelectorAll("svg[viewBox]")) {
    const width = svg.getBoundingClientRect().width;
    const box = svg.viewBox?.baseVal;
    if (!width || !box?.width) continue;
    const scale = width / box.width;
    for (const text of svg.querySelectorAll("text")) {
      if (!text.dataset.fs) text.dataset.fs = text.getAttribute("font-size") || "16";
      const drawn = Number.parseFloat(text.dataset.fs) || 16;
      const need = MIN_PX / scale;
      text.setAttribute("font-size", String(drawn * scale < MIN_PX ? Math.min(need, drawn * MAX_GROW) : drawn));
    }
  }
}
export function keepLegible(root) {
  let queued = false;
  const run = () => {
    queued = false;
    legibleSvg(root);
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(run);
    }
  };
  new MutationObserver(queue).observe(root, { childList: true, subtree: true });
  addEventListener("resize", queue);
  queue();
}
