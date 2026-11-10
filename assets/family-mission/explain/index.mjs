/**
 * Watch it: the lesson picture, revealed one piece at a time in step with the worked example.
 *
 * Progressive enhancement. The page ships the finished picture (an SVG per language, drawn by
 * assets/design/family/art/math-models.mjs). This module wraps that same SVG: it splits the drawing
 * into "units" (a mark and its label), hides the units that have not been explained yet, and brings
 * each one in with a short animation as the family steps through the worked example. Nothing is
 * redrawn, so the picture, its alt text and its numbers stay exactly the art library's. Without
 * JavaScript, or with "Show all", the family sees the whole picture.
 *
 *   mountExplainer({ figure, steps, lang, onView })  -> controller { go, play, pause, showAll, destroy, setLang }
 *   openExplainerDialog({ figure, steps, lang })     -> opens the picture in a dialog and plays it
 *
 * `steps` is [{ en, es, el? }]; `el` is the worked-example <li> that is highlighted with its step.
 * Nothing leaves the device. prefers-reduced-motion gets the same steps with no movement.
 */

const SKIP = new Set(["title", "desc", "defs", "style", "clippath"]);
/** Shapes that finish the mark before them (an arrowhead on an axis) instead of starting a new one. */
const JOIN = new Set(["text", "polygon"]);
const reduced = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {
    return false;
  }
};

/** Split an SVG's drawing into reveal units: every shape starts one, labels attach to the shape before them. */
export function revealUnits(svg) {
  const units = [];
  for (const node of Array.from(svg.children)) {
    const tag = node.tagName.toLowerCase();
    if (SKIP.has(tag)) continue;
    if (JOIN.has(tag) && units.length) {
      units[units.length - 1].push(node);
    } else {
      units.push([node]);
    }
  }
  return units;
}

/** How many units step `stage` (0-based) of `count` shows. Always at least one, the last step shows all. */
export function unitsAtStage(total, stage, count) {
  if (stage >= count - 1) return total;
  return Math.max(1, Math.ceil((total * (stage + 1)) / count));
}

function el(tag, cls, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
}
const bi = (en, es) => `<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span>`;

export function mountExplainer({ figure, steps, lang = "en", onView } = {}) {
  if (!figure || !steps?.length) return null;
  const svgs = Array.from(figure.querySelectorAll("svg.fm-model"));
  if (!svgs.length) return null;
  const isReduced = reduced();
  const count = steps.length;
  const perSvg = svgs.map((svg) => {
    const units = revealUnits(svg);
    units.forEach((u) =>
      u.forEach((n) => {
        if (n.tagName.toLowerCase() === "path") n.setAttribute("pathLength", "1");
      }),
    );
    return units;
  });

  let stage = count - 1;
  let watching = false;
  let timer = 0;
  let speak = false;
  let seen = new Set();
  let currentLang = lang;

  const bar = el("div", "fm-xp");
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Watch it step by step");
  bar.innerHTML = `
    <div class="fm-xp-row">
      <button type="button" class="fm-btn fm-xp-play" data-xp="play" aria-pressed="false"><span aria-hidden="true">▶</span> <span class="fm-xp-play-label">${bi("Watch it step by step", "Míralo paso a paso")}</span></button>
      <button type="button" class="fm-btn fm-xp-ico" data-xp="prev" aria-label="Previous step" hidden>◀</button>
      <button type="button" class="fm-btn fm-xp-ico" data-xp="next" aria-label="Next step" hidden>▶</button>
      <button type="button" class="fm-btn fm-xp-ico" data-xp="all" hidden>${bi("Show all", "Ver todo")}</button>
      <button type="button" class="fm-btn fm-xp-ico fm-xp-voice" data-xp="voice" aria-pressed="false" aria-label="Read each step aloud" hidden>🔊</button>
    </div>
    <ol class="fm-xp-dots" hidden></ol>
    <p class="fm-xp-caption" role="status" aria-live="polite" hidden></p>`;
  const dots = bar.querySelector(".fm-xp-dots");
  const caption = bar.querySelector(".fm-xp-caption");
  steps.forEach((_, i) => {
    const li = el("li", "fm-xp-dot");
    const b = el("button", "fm-xp-dotbtn");
    b.type = "button";
    b.setAttribute("aria-label", `Step ${i + 1} of ${count}`);
    b.dataset.step = String(i);
    b.textContent = String(i + 1);
    li.appendChild(b);
    dots.appendChild(li);
  });
  figure.parentNode.insertBefore(bar, figure);
  figure.classList.add("fm-xp-figure");

  const q = (name) => bar.querySelector(`[data-xp="${name}"]`);

  function paint(next, { animate = true } = {}) {
    const prev = stage;
    stage = Math.max(0, Math.min(count - 1, next));
    perSvg.forEach((units) => {
      const shown = unitsAtStage(units.length, stage, count);
      const before = prev === stage ? -1 : unitsAtStage(units.length, prev, count);
      units.forEach((u, i) => {
        const on = !watching || i < shown;
        u.forEach((n) => {
          n.classList.toggle("fm-xp-hidden", !on);
          const fresh = animate && !isReduced && watching && on && (before < 0 ? stage === 0 : i >= before);
          n.classList.remove("fm-xp-new");
          if (fresh) {
            void n.getBoundingClientRect();
            n.classList.add("fm-xp-new");
          }
        });
      });
    });
    steps.forEach((s, i) => {
      if (!s.el) return;
      s.el.classList.toggle("fm-xp-current", watching && i === stage);
      s.el.classList.toggle("fm-xp-dim", watching && i !== stage);
    });
    dots.querySelectorAll(".fm-xp-dotbtn").forEach((b, i) => {
      b.classList.toggle("is-current", watching && i === stage);
      b.classList.toggle("is-done", watching && i < stage);
      b.setAttribute("aria-current", watching && i === stage ? "step" : "false");
    });
    caption.innerHTML = watching ? bi(`Step ${stage + 1} of ${count}: ${esc(steps[stage].en)}`, `Paso ${stage + 1} de ${count}: ${esc(steps[stage].es || steps[stage].en)}`) : "";
    q("prev").disabled = stage === 0;
    q("next").disabled = stage === count - 1;
    if (watching && speak) say(steps[stage]);
    if (watching && stage === count - 1) {
      seen.add("end");
      if (typeof onView === "function") onView({ finished: true });
    }
  }

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function say(step) {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(currentLang === "es" ? step.es || step.en : step.en);
      u.lang = currentLang === "es" ? "es-US" : "en-US";
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  function delayFor(step) {
    const text = (currentLang === "es" ? step.es || step.en : step.en) || "";
    return Math.min(9000, 2600 + text.length * 42);
  }

  function schedule() {
    clearTimeout(timer);
    if (!playing()) return;
    timer = setTimeout(() => {
      if (stage >= count - 1) return pause();
      paint(stage + 1);
      schedule();
    }, delayFor(steps[stage]));
  }

  let isPlaying = false;
  const playing = () => isPlaying;

  function setUi() {
    const on = watching;
    ["prev", "next", "all", "voice"].forEach((n) => (q(n).hidden = !on));
    dots.hidden = !on;
    caption.hidden = !on;
    const pl = q("play");
    pl.setAttribute("aria-pressed", String(isPlaying));
    pl.querySelector("span[aria-hidden]").textContent = isPlaying ? "⏸" : stage >= count - 1 && watching ? "↻" : "▶";
    pl.querySelector(".fm-xp-play-label").innerHTML = isPlaying
      ? bi("Pause", "Pausa")
      : watching && stage >= count - 1
        ? bi("Watch again", "Verlo otra vez")
        : watching
          ? isReduced
            ? bi("Next step", "Siguiente paso")
            : bi("Keep playing", "Seguir")
          : bi("Watch it step by step", "Míralo paso a paso");
  }

  function play() {
    if (!watching || stage >= count - 1) {
      watching = true;
      paint(0);
    }
    isPlaying = !isReduced;
    setUi();
    schedule();
    if (typeof onView === "function") onView({ started: true });
  }
  function pause() {
    isPlaying = false;
    clearTimeout(timer);
    setUi();
  }
  function go(i) {
    watching = true;
    pause();
    paint(i);
    setUi();
  }
  function showAll() {
    pause();
    watching = false;
    window.speechSynthesis?.cancel?.();
    paint(count - 1, { animate: false });
    setUi();
  }

  bar.addEventListener("click", (e) => {
    const t = e.target.closest("[data-xp], .fm-xp-dotbtn");
    if (!t) return;
    if (t.classList.contains("fm-xp-dotbtn")) return go(Number(t.dataset.step));
    const a = t.dataset.xp;
    if (a === "play") {
      if (isPlaying) return pause();
      if (isReduced && watching && stage < count - 1) return go(stage + 1);
      return play();
    }
    if (a === "prev") return go(stage - 1);
    if (a === "next") return go(stage + 1);
    if (a === "all") return showAll();
    if (a === "voice") {
      speak = !speak;
      t.setAttribute("aria-pressed", String(speak));
      if (speak) say(steps[stage]);
      else window.speechSynthesis?.cancel?.();
    }
  });
  steps.forEach((s, i) => {
    if (!s.el) return;
    s.el.classList.add("fm-xp-li");
    s.el.addEventListener("click", () => watching && go(i));
  });

  paint(count - 1, { animate: false });
  setUi();

  return {
    go,
    play,
    pause,
    showAll,
    setLang(l) {
      currentLang = l === "es" ? "es" : "en";
      if (watching) paint(stage, { animate: false });
    },
    destroy() {
      pause();
      showAll();
      bar.remove();
    },
  };
}

/** Open a copy of the picture in a dialog and play it, for "watch it again" next to an explanation. */
export function openExplainerDialog({ figure, steps, lang = "en", onView } = {}) {
  if (!figure || !steps?.length) return null;
  let dlg = document.getElementById("fm_xp_dialog");
  if (dlg) dlg.remove();
  dlg = el("dialog", "fm-sheet fm-xp-dialog");
  dlg.id = "fm_xp_dialog";
  dlg.setAttribute("aria-labelledby", "fm_xp_dialog_title");
  dlg.innerHTML = `<div class="fm-sheet__head"><h2 id="fm_xp_dialog_title" class="fm-card__title">${bi("Watch the picture", "Mira el dibujo")}</h2><button type="button" class="fm-btn fm-btn--icon" data-close aria-label="Close">✕</button></div>
    <div class="fm-sheet__body"><div class="fm-xp-dialog-body"></div><ol class="fm-xp-dialog-steps"></ol></div>`;
  const body = dlg.querySelector(".fm-xp-dialog-body");
  const list = dlg.querySelector(".fm-xp-dialog-steps");
  const copy = figure.cloneNode(true);
  copy.removeAttribute("id");
  body.appendChild(copy);
  const local = steps.map((s) => {
    const li = el("li", "", bi(escHtml(s.en), escHtml(s.es || s.en)));
    list.appendChild(li);
    return { en: s.en, es: s.es, el: li };
  });
  document.body.appendChild(dlg);
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
  });
  dlg.addEventListener("close", () => dlg.remove());
  dlg.showModal?.() || dlg.setAttribute("open", "");
  const ctl = mountExplainer({ figure: copy, steps: local, lang, onView });
  ctl?.play();
  return ctl;
}

function escHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
