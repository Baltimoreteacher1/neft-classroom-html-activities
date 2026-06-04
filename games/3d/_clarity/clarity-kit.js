// ============================================================================
// clarity-kit.js — shared clarity / onboarding kit for engine3d unit games.
//
// One consistent, keyboard-accessible layer of DOM/CSS overlays rendered OVER
// the 3D canvas. It NEVER changes gameplay or the 3D engine — it only adds:
//   1. START / OBJECTIVE overlay shown on load (title, plain-language goal,
//      math skill/standard, big Start button + "How to play" button).
//   2. HOW-TO-PLAY / CONTROLS panel (real keyboard + mouse/touch controls and
//      how to score / win), reachable from the start overlay AND from a
//      persistent "?" Help button during play (overlays without breaking play).
//   3. A consistent, always-visible mini-HUD strip: objective reminder +
//      current target chip (complements the engine HUD's score/lives/progress).
//   4. A clear WIN / LOSE end screen with a Play Again button.
//
// Pure DOM/CSS over the canvas. No new build deps, no ASCII art. Reuses Neft
// design tokens + the engine3d theme. Bilingual (EN + short ES) for the
// objective and controls where natural.
//
// ---------------------------------------------------------------------------
// CONFIG SHAPE — initClarity(config)
//
//   config = {
//     mount,        // REQUIRED. The same positioned element passed to mountGame
//                   //   (e.g. document.getElementById("game")). Overlays mount here.
//     title,        // REQUIRED string. Game title, e.g. "Smoothie Stand".
//     objectiveEn,  // REQUIRED string. One sentence, plain language.
//                   //   Rendered after a bold "Your goal:" — do NOT include that prefix.
//     objectiveEs,  // OPTIONAL string. Short Spanish version of the goal.
//     standard,     // OPTIONAL string. Math skill / standard, e.g. "6.RP.A.1–3 · Ratios".
//     controls,     // REQUIRED array of { key, actionEn, actionEs? }.
//                   //   key: human label, e.g. "← / →", "Space", "Tap", "Mouse".
//     howToWinEn,   // OPTIONAL string. How you score / win (plain language).
//     howToWinEs,   // OPTIONAL string. Short Spanish version.
//     startLabelEn, // OPTIONAL. Start button text (default "Start").
//     autoStart,    // OPTIONAL bool. If true, skip showing start overlay on init
//                   //   (used when the engine already showed a level/vocab gate
//                   //    and you want clarity HUD only). Default false.
//     announce,     // OPTIONAL (text)=>void. Engine ctx.announce for screen readers.
//     onStart,      // OPTIONAL ()=>void. Called when the student presses Start.
//     onPlayAgain,  // OPTIONAL ()=>void. Called when the student presses Play Again.
//                   //   If omitted, Play Again reloads the page.
//   }
//
// RETURNS a controller:
//   {
//     showStart(),                 // (re)open the start/objective overlay
//     showHelp(), hideHelp(),      // open / close the how-to-play panel
//     setObjective(text),          // update the persistent objective chip
//     setTarget(text|null),        // update / hide the "current target" chip
//     win({ stats?, badge?, titleEn?, onPlayAgain? }),   // show WIN end screen
//     lose({ stats?, badge?, titleEn?, onPlayAgain? }),  // show LOSE end screen
//     hudEl,                       // the mini-HUD element (for advanced use)
//     dispose(),                   // remove all clarity DOM + listeners
//   }
//
// Keyboard: every overlay traps focus, Escape closes Help (resuming play), the
// Start and Play Again buttons auto-focus, and all controls are <button>s.
// The persistent HUD is pointer-events:none so it never blocks the canvas.
// ============================================================================

const STYLE_HREF = "/games/3d/_clarity/clarity-kit.css";

/** Inject the kit stylesheet once (idempotent). */
function ensureStyles() {
  if (document.getElementById("ck-styles")) return;
  const link = document.createElement("link");
  link.id = "ck-styles";
  link.rel = "stylesheet";
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function el(tag, cls, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
}

function esc(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Make Enter/Space activate a non-button element if ever needed. */
function focusFirst(container) {
  const target = container.querySelector(
    "button, [href], [tabindex]:not([tabindex='-1'])",
  );
  if (target) target.focus();
}

/** Trap Tab focus inside `container`; returns a release() function. */
function trap(container) {
  const sel =
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
  function onKey(e) {
    if (e.key !== "Tab") return;
    const items = Array.from(container.querySelectorAll(sel)).filter(
      (n) => !n.disabled && n.offsetParent !== null,
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  container.addEventListener("keydown", onKey);
  return () => container.removeEventListener("keydown", onKey);
}

export function initClarity(config = {}) {
  const mount = config.mount;
  if (!mount) throw new Error("initClarity: config.mount is required");
  ensureStyles();

  const announce =
    typeof config.announce === "function" ? config.announce : () => {};
  const title = config.title || "Math Game";
  const objectiveEn = config.objectiveEn || "Solve each problem to win.";
  const objectiveEs = config.objectiveEs || "";
  const standard = config.standard || "";
  const controls = Array.isArray(config.controls) ? config.controls : [];
  const howToWinEn = config.howToWinEn || "";
  const howToWinEs = config.howToWinEs || "";
  const startLabel = config.startLabelEn || "Start";

  // ---- Root container (over canvas, transparent, click-through by default) --
  const root = el("div", "ck-root");
  root.setAttribute("data-ck", "root");
  mount.appendChild(root);

  // ---- Persistent mini-HUD strip -------------------------------------------
  const hud = el("div", "ck-hud");
  hud.hidden = true;
  const objChip = el("span", "ck-chip ck-chip--objective");
  objChip.innerHTML = `<b>Goal:</b> <span data-ck="obj">${esc(objectiveEn)}</span>`;
  const targetChip = el("span", "ck-chip ck-chip--target");
  targetChip.hidden = true;
  hud.append(objChip, targetChip);
  root.appendChild(hud);

  // ---- Persistent "?" Help button ------------------------------------------
  const helpBtn = el("button", "ck-help-btn", "?");
  helpBtn.type = "button";
  helpBtn.hidden = true;
  helpBtn.setAttribute("aria-label", "How to play. Opens the controls panel.");
  helpBtn.title = "How to play";
  root.appendChild(helpBtn);

  // ---- Reusable controls markup --------------------------------------------
  function controlsMarkup() {
    if (!controls.length) return "";
    const rows = controls
      .map((c) => {
        const es = c.actionEs
          ? `<span class="ck-es">${esc(c.actionEs)}</span>`
          : "";
        return `<div class="ck-control">
          <span class="ck-key">${esc(c.key)}</span>
          <span class="ck-action-text">${esc(c.actionEn)}${es}</span>
        </div>`;
      })
      .join("");
    return `<div class="ck-controls">${rows}</div>`;
  }
  function howToWinMarkup() {
    if (!howToWinEn && !howToWinEs) return "";
    const es = howToWinEs
      ? `<span class="ck-es" style="display:block;opacity:.78;font-style:italic">${esc(howToWinEs)}</span>`
      : "";
    return `<div class="ck-howto-head">How to score / win</div>
      <div class="ck-win-howto">${esc(howToWinEn)}${es}</div>`;
  }

  // ---- START / OBJECTIVE overlay -------------------------------------------
  const startLayer = el("div", "ck-layer");
  startLayer.hidden = true;
  startLayer.setAttribute("role", "dialog");
  startLayer.setAttribute("aria-modal", "true");
  startLayer.setAttribute("aria-label", `${title}. Start screen.`);
  startLayer.innerHTML = `
    <div class="ck-card">
      <p class="ck-eyebrow">Math Mission</p>
      <h1 class="ck-title">${esc(title)}</h1>
      <p class="ck-objective"><strong>Your goal:</strong> ${esc(objectiveEn)}</p>
      ${objectiveEs ? `<p class="ck-objective-es">Tu meta: ${esc(objectiveEs)}</p>` : ""}
      ${standard ? `<span class="ck-standard">${esc(standard)}</span>` : ""}
      <div class="ck-actions">
        <button type="button" class="ck-btn ck-btn--primary" data-ck="start">${esc(startLabel)}</button>
        <button type="button" class="ck-btn ck-btn--ghost" data-ck="how-start">How to play</button>
      </div>
    </div>`;
  root.appendChild(startLayer);

  // ---- HOW-TO-PLAY / CONTROLS panel ----------------------------------------
  const helpLayer = el("div", "ck-layer");
  helpLayer.hidden = true;
  helpLayer.setAttribute("role", "dialog");
  helpLayer.setAttribute("aria-modal", "true");
  helpLayer.setAttribute("aria-label", "How to play");
  helpLayer.innerHTML = `
    <div class="ck-card">
      <p class="ck-eyebrow">How to play</p>
      <h2 class="ck-title" style="font-size:clamp(20px,3.4vw,26px)">${esc(title)}</h2>
      <p class="ck-objective"><strong>Goal:</strong> ${esc(objectiveEn)}</p>
      ${objectiveEs ? `<p class="ck-objective-es">Meta: ${esc(objectiveEs)}</p>` : ""}
      <div class="ck-howto-head">Controls</div>
      ${controlsMarkup()}
      ${howToWinMarkup()}
      <div class="ck-actions">
        <button type="button" class="ck-btn ck-btn--primary" data-ck="help-close">Got it</button>
      </div>
    </div>`;
  root.appendChild(helpLayer);

  // ---- END screen layer (win/lose, built on demand) ------------------------
  const endLayer = el("div", "ck-layer");
  endLayer.hidden = true;
  endLayer.setAttribute("role", "dialog");
  endLayer.setAttribute("aria-modal", "true");
  endLayer.setAttribute("aria-label", "Results");
  root.appendChild(endLayer);

  // ---- State / wiring -------------------------------------------------------
  let releaseTrap = null;
  let lastHelpReturn = null; // element to refocus after help closes
  let escHandler = null;

  function openModal(layer, opts = {}) {
    // Close any open modal trap first.
    if (releaseTrap) {
      releaseTrap();
      releaseTrap = null;
    }
    layer.hidden = false;
    releaseTrap = trap(layer);
    if (opts.focusSel) {
      const f = layer.querySelector(opts.focusSel);
      if (f) f.focus();
      else focusFirst(layer);
    } else {
      focusFirst(layer);
    }
  }
  function closeModal(layer) {
    layer.hidden = true;
    if (releaseTrap) {
      releaseTrap();
      releaseTrap = null;
    }
  }

  // Escape closes the Help panel (resuming play) but not start/end gates.
  escHandler = (e) => {
    if (e.key === "Escape" && !helpLayer.hidden) {
      e.preventDefault();
      hideHelp();
    }
  };
  document.addEventListener("keydown", escHandler);

  // ---- Public actions -------------------------------------------------------
  function showStart() {
    hud.hidden = true;
    helpBtn.hidden = true;
    openModal(startLayer, { focusSel: "[data-ck='start']" });
    announce(
      `${title}. Your goal: ${objectiveEn}. Press Start to play, or How to play for the controls.`,
    );
  }

  function beginPlay() {
    closeModal(startLayer);
    hud.hidden = false;
    helpBtn.hidden = false;
    if (typeof config.onStart === "function") config.onStart();
    announce("Game started.");
  }

  function showHelp() {
    lastHelpReturn =
      document.activeElement && document.activeElement !== document.body
        ? document.activeElement
        : helpBtn;
    openModal(helpLayer, { focusSel: "[data-ck='help-close']" });
    announce("How to play. Press Escape or Got it to return to the game.");
  }
  function hideHelp() {
    closeModal(helpLayer);
    if (lastHelpReturn && document.contains(lastHelpReturn)) {
      lastHelpReturn.focus();
    } else if (!helpBtn.hidden) {
      helpBtn.focus();
    }
  }

  function setObjective(text) {
    const span = objChip.querySelector("[data-ck='obj']");
    if (span) span.textContent = String(text);
  }
  function setTarget(text) {
    if (text == null || text === "") {
      targetChip.hidden = true;
      targetChip.innerHTML = "";
      return;
    }
    targetChip.hidden = false;
    targetChip.innerHTML = `<b>Target:</b> ${esc(text)}`;
  }

  function showEnd(kind, opts = {}) {
    hud.hidden = true;
    helpBtn.hidden = true;
    const win = kind === "win";
    const badge = opts.badge || (win ? "🎉" : "🔁");
    const headline = opts.titleEn || (win ? "You did it!" : "Try again!");
    const statsHtml = opts.stats
      ? `<p class="ck-result-stats">${esc(opts.stats)}</p>`
      : "";
    const card = el("div", "ck-card" + (win ? "" : " ck-card--lose"));
    card.innerHTML = `
      <p class="ck-result-badge" aria-hidden="true">${esc(badge)}</p>
      <p class="ck-eyebrow">${win ? "Mission complete" : "Mission not yet complete"}</p>
      <h2 class="ck-title">${esc(headline)}</h2>
      ${statsHtml}
      <div class="ck-actions">
        <button type="button" class="ck-btn ck-btn--primary" data-ck="again">Play again</button>
      </div>`;
    endLayer.innerHTML = "";
    endLayer.appendChild(card);
    const againCb =
      typeof opts.onPlayAgain === "function"
        ? opts.onPlayAgain
        : typeof config.onPlayAgain === "function"
          ? config.onPlayAgain
          : () => location.reload();
    card.querySelector("[data-ck='again']").addEventListener("click", () => {
      closeModal(endLayer);
      againCb();
    });
    openModal(endLayer, { focusSel: "[data-ck='again']" });
    announce(`${headline} ${opts.stats || ""} Press Play again to restart.`);
  }

  // ---- Bind button events ---------------------------------------------------
  startLayer
    .querySelector("[data-ck='start']")
    .addEventListener("click", beginPlay);
  startLayer
    .querySelector("[data-ck='how-start']")
    .addEventListener("click", showHelp);
  helpLayer
    .querySelector("[data-ck='help-close']")
    .addEventListener("click", hideHelp);
  helpBtn.addEventListener("click", showHelp);

  // ---- Init -----------------------------------------------------------------
  if (config.autoStart) {
    hud.hidden = false;
    helpBtn.hidden = false;
  } else {
    showStart();
  }

  return {
    showStart,
    showHelp,
    hideHelp,
    setObjective,
    setTarget,
    win: (opts) => showEnd("win", opts),
    lose: (opts) => showEnd("lose", opts),
    hudEl: hud,
    helpButtonEl: helpBtn,
    dispose() {
      if (releaseTrap) releaseTrap();
      if (escHandler) document.removeEventListener("keydown", escHandler);
      if (root.parentNode) root.parentNode.removeChild(root);
    },
  };
}

export default initClarity;
