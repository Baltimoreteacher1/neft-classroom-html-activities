// present-mode.js — Gold-Standard Presenter & Screen Share Engine (per Joel 2026-07-23).
// Provides classroom presentation capabilities: live screen sharing (getDisplayMedia),
// floating & minimizable Presenter widget, slide deck presentation mode, screen annotations,
// and projector views for all small-group & interactive lessons on eduwonderlab.com/curriculum.

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

const MINIMIZED_KEY = "nt-present-widget-minimized";

export function isTeacherModeActive() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("student") === "1" || params.get("teacher") === "0") return false;
    return (
      localStorage.getItem("nt-teacher-mode") === "1" ||
      document.body.classList.contains("teacher-mode") ||
      document.body.classList.contains("sg-is-teacher")
    );
  } catch {
    return false;
  }
}

let activeScreenStream = null;
let screenOverlayEl = null;
let annotationCanvasEl = null;
let isAnnotating = false;
let isLaserPointer = false;

export async function startScreenShare({ onFallback } = {}) {
  if (activeScreenStream) {
    stopScreenShare();
    return true;
  }

  if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === "function") {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      activeScreenStream = stream;

      buildScreenShareOverlay(stream);

      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          stopScreenShare();
        };
      }
      return true;
    } catch (err) {
      console.warn("[PresentMode] Screen share cancelled or failed:", err);
    }
  }

  if (typeof onFallback === "function") {
    onFallback();
  } else {
    showPresentNotice("Screen share unavailable — entered standard Presentation Mode.");
  }
  return false;
}

export function stopScreenShare() {
  if (activeScreenStream) {
    try {
      activeScreenStream.getTracks().forEach((t) => t.stop());
    } catch (_) {}
    activeScreenStream = null;
  }
  stopAnnotation();
  if (screenOverlayEl) {
    screenOverlayEl.remove();
    screenOverlayEl = null;
  }
  document.body.classList.remove("nt-screen-presenting");
  updateWidgetLiveState(false);
}

function updateWidgetLiveState(isLive) {
  const widget = document.getElementById("nt-present-widget");
  if (!widget) return;
  widget.classList.toggle("is-live-sharing", isLive);
  const liveBadge = widget.querySelector(".nt-present-live-badge");
  if (liveBadge) liveBadge.hidden = !isLive;
}

function buildScreenShareOverlay(stream) {
  if (screenOverlayEl) screenOverlayEl.remove();

  document.body.classList.add("nt-screen-presenting");
  updateWidgetLiveState(true);

  screenOverlayEl = document.createElement("div");
  screenOverlayEl.className = "nt-screen-overlay";
  screenOverlayEl.innerHTML = `
    <div class="nt-screen-stage">
      <video class="nt-screen-video" autoplay playsinline muted></video>
      <canvas class="nt-screen-draw-canvas" hidden></canvas>
      <div class="nt-laser-pointer" hidden></div>

      <div class="nt-screen-hud" role="toolbar" aria-label="Presenter Controls">
        <span class="nt-screen-badge"><span class="nt-pulse-dot"></span> LIVE Screen Share</span>
        <button type="button" class="nt-screen-btn nt-screen-annotate" title="Toggle Annotate / Laser Pointer">🖊️ Draw</button>
        <button type="button" class="nt-screen-btn nt-screen-laser" title="Toggle Laser Pointer">🔴 Laser</button>
        <button type="button" class="nt-screen-btn nt-screen-clear" title="Clear Drawing" hidden>🧹 Clear</button>
        <button type="button" class="nt-screen-btn nt-screen-pip" title="Toggle Picture-in-Picture">🗖 PIP</button>
        <button type="button" class="nt-screen-btn nt-screen-fs" title="Fullscreen Mode">⛶ Fullscreen</button>
        <button type="button" class="nt-screen-btn nt-screen-stop" title="Stop Screen Share">🛑 Stop Sharing</button>
      </div>
    </div>`;

  const video = screenOverlayEl.querySelector(".nt-screen-video");
  video.srcObject = stream;

  const canvas = screenOverlayEl.querySelector(".nt-screen-draw-canvas");
  const laserDot = screenOverlayEl.querySelector(".nt-laser-pointer");
  const annotateBtn = screenOverlayEl.querySelector(".nt-screen-annotate");
  const laserBtn = screenOverlayEl.querySelector(".nt-screen-laser");
  const clearBtn = screenOverlayEl.querySelector(".nt-screen-clear");

  setupAnnotationCanvas(canvas, laserDot);

  annotateBtn.addEventListener("click", () => {
    isAnnotating = !isAnnotating;
    isLaserPointer = false;
    canvas.hidden = !isAnnotating;
    laserDot.hidden = true;
    clearBtn.hidden = !isAnnotating;
    annotateBtn.classList.toggle("is-active", isAnnotating);
    laserBtn.classList.remove("is-active");
  });

  laserBtn.addEventListener("click", () => {
    isLaserPointer = !isLaserPointer;
    isAnnotating = false;
    laserDot.hidden = !isLaserPointer;
    canvas.hidden = true;
    clearBtn.hidden = true;
    laserBtn.classList.toggle("is-active", isLaserPointer);
    annotateBtn.classList.remove("is-active");
  });

  clearBtn.addEventListener("click", () => {
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  const pipBtn = screenOverlayEl.querySelector(".nt-screen-pip");
  pipBtn.addEventListener("click", async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      } else {
        screenOverlayEl.classList.toggle("is-mini-pip");
      }
    } catch (_) {
      screenOverlayEl.classList.toggle("is-mini-pip");
    }
  });

  const fsBtn = screenOverlayEl.querySelector(".nt-screen-fs");
  fsBtn.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      screenOverlayEl.requestFullscreen?.() ||
        screenOverlayEl.querySelector(".nt-screen-stage")?.requestFullscreen?.();
    }
  });

  const stopBtn = screenOverlayEl.querySelector(".nt-screen-stop");
  stopBtn.addEventListener("click", () => {
    stopScreenShare();
  });

  document.body.appendChild(screenOverlayEl);
}

function setupAnnotationCanvas(canvas, laserDot) {
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function resizeCanvas() {
    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const ctx = canvas.getContext("2d");

  canvas.addEventListener("pointerdown", (e) => {
    if (!isAnnotating) return;
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  });

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isLaserPointer && laserDot) {
      laserDot.style.left = `${e.clientX}px`;
      laserDot.style.top = `${e.clientY}px`;
    }

    if (!drawing || !isAnnotating || !ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  });

  const stopDrawing = () => {
    drawing = false;
  };
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointerleave", stopDrawing);
}

function stopAnnotation() {
  isAnnotating = false;
  isLaserPointer = false;
}

function showPresentNotice(msg) {
  const existing = document.getElementById("nt-present-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "nt-present-toast";
  toast.className = "nt-present-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

export function mountPresentWidget({ onPresentToggle, container } = {}) {
  if (document.getElementById("nt-present-widget")) return;
  if (!isTeacherModeActive()) return;

  let minimized = false;
  try {
    minimized = localStorage.getItem(MINIMIZED_KEY) === "1";
  } catch (_) {}

  const widget = document.createElement("div");
  widget.id = "nt-present-widget";
  widget.className = `nt-present-widget ${minimized ? "is-minimized" : ""}`;

  function renderWidgetContent() {
    if (minimized) {
      widget.innerHTML = `
        <button type="button" class="nt-present-btn-mini" title="Expand Presenter Controls (Alt+Shift+P)" aria-label="Expand Presenter Controls">
          <span>📺 Present</span>
          <span class="nt-present-live-badge" ${activeScreenStream ? "" : "hidden"}>🟢</span>
          <span class="nt-present-expand-icon">⤢</span>
        </button>`;
      widget.querySelector(".nt-present-btn-mini").onclick = () => {
        setMinimized(false);
      };
    } else {
      widget.innerHTML = `
        <div class="nt-present-bar">
          <span class="nt-present-label">👩‍🏫 Presenter</span>
          <span class="nt-present-live-badge" ${activeScreenStream ? "" : "hidden"}>🟢 LIVE</span>
          <button type="button" class="nt-present-act-btn nt-present-screen" title="Share Screen live (getDisplayMedia)">
            <span>📺 Screen Share</span>
          </button>
          <button type="button" class="nt-present-act-btn nt-present-deck" title="Slide Deck Projector View">
            <span>📽️ Slide Deck</span>
          </button>
          <button type="button" class="nt-present-min-btn" title="Minimize Bar" aria-label="Minimize Present Bar">
            <span>🗕</span>
          </button>
        </div>`;

      widget.querySelector(".nt-present-screen").onclick = async () => {
        if (typeof onPresentToggle === "function") {
          onPresentToggle();
        } else {
          startScreenShare({
            onFallback: () => {
              document.dispatchEvent(new CustomEvent("nt:present-deck-toggle"));
            },
          });
        }
      };

      widget.querySelector(".nt-present-deck").onclick = () => {
        document.dispatchEvent(new CustomEvent("nt:present-deck-toggle"));
      };

      widget.querySelector(".nt-present-min-btn").onclick = () => {
        setMinimized(true);
      };
    }
  }

  function setMinimized(val) {
    minimized = val;
    try {
      localStorage.setItem(MINIMIZED_KEY, val ? "1" : "0");
    } catch (_) {}
    widget.classList.toggle("is-minimized", val);
    renderWidgetContent();
  }

  renderWidgetContent();
  (container || document.body).appendChild(widget);

  // Keyboard shortcut Alt+Shift+P toggles minimize/expand
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && e.code === "KeyP" && isTeacherModeActive()) {
      e.preventDefault();
      setMinimized(!minimized);
    }
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "nt-teacher-mode") {
      if (isTeacherModeActive()) {
        widget.style.display = "";
      } else {
        widget.style.display = "none";
      }
    }
  });
}

export function initPresentMode({ app, config, phaseConfigs, phaseContainer, state }) {
  let active = false;
  let slideEls = [];
  let current = 0;
  let rail = null;
  let nav = null;

  function groupSlides(phaseEl) {
    if (!phaseEl) return [];
    const groups = [];
    [...phaseEl.children].forEach((child) => {
      const startsSlide =
        child.classList.contains("card") ||
        child.querySelector(".card, h2, h3, .card-title, .sg-tab") ||
        groups.length === 0;
      if (startsSlide) groups.push([]);
      groups[groups.length - 1].push(child);
      child.dataset.pmSlide = String(groups.length - 1);
    });
    return groups;
  }

  function slideTitle(group, fallback) {
    for (const el of group) {
      const h = el.querySelector(
        "h2, h3, h4, .card-title, [class*='section-title'], legend, [role='heading']",
      );
      const t = (h?.textContent || el.getAttribute?.("aria-label") || "")
        .trim()
        .replace(/\s+/g, " ");
      if (t) return t.length > 34 ? `${t.slice(0, 32)}…` : t;
    }
    return fallback;
  }

  function show(n) {
    if (!active || !slideEls.length) return;
    current = Math.max(0, Math.min(slideEls.length - 1, n));
    slideEls.forEach((group, i) =>
      group.forEach((el) => el.classList.toggle("pm-hidden", i !== current)),
    );
    rail?.querySelectorAll(".pm-thumb").forEach((t, i) => {
      t.classList.toggle("pm-sel", i === current);
      t.setAttribute("aria-selected", i === current ? "true" : "false");
    });
    if (nav) {
      nav.querySelector(".pm-count").textContent = `${current + 1} / ${slideEls.length}`;
      nav.querySelector("[data-pm-prev]").disabled = current === 0;
      nav.querySelector("[data-pm-next]").disabled = current === slideEls.length - 1;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function deckify() {
    const phaseEl = phaseContainer?.querySelector?.(".phase") || phaseContainer;
    if (!phaseEl) return;
    slideEls = groupSlides(phaseEl);
    const phaseIdx = state?.get?.()?.currentPhase ?? 0;
    if (rail?.querySelector(".pm-rail-slides")) {
      rail.querySelector(".pm-rail-slides").innerHTML = slideEls
        .map(
          (g, i) => `
          <button type="button" class="pm-thumb" role="tab" data-pm-slide-btn="${i}">
            <span class="pm-thumb-num">${i + 1}</span>
            <span class="pm-thumb-title">${esc(slideTitle(g, `Slide ${i + 1}`))}</span>
          </button>`,
        )
        .join("");
      rail
        .querySelectorAll("[data-pm-slide-btn]")
        .forEach((b) => b.addEventListener("click", () => show(+b.dataset.pmSlideBtn)));
      rail
        .querySelectorAll(".pm-rail-phase")
        .forEach((b, i) => b.classList.toggle("pm-sel", i === phaseIdx));
    }
    show(0);
  }

  function unDeckify() {
    if (phaseContainer) {
      phaseContainer.querySelectorAll(".pm-hidden").forEach((el) => el.classList.remove("pm-hidden"));
    }
    slideEls = [];
    current = 0;
  }

  function buildChrome() {
    rail = document.createElement("aside");
    rail.className = "pm-rail";
    rail.setAttribute("aria-label", "Presentation slides");
    const phaseListHtml = (phaseConfigs || [])
      .map(
        (p, i) =>
          `<button type="button" class="pm-rail-phase" data-pm-goto-phase="${i}">${i + 1} · ${esc(p?.name || `Part ${i + 1}`)}</button>`,
      )
      .join("");

    rail.innerHTML = `
      <div class="pm-rail-head">Presenting</div>
      <div class="pm-rail-slides" role="tablist"></div>
      <div class="pm-rail-phases">${phaseListHtml}</div>
      <button type="button" class="pm-exit" data-pm-exit>✕ Exit (Esc)</button>`;

    rail
      .querySelectorAll("[data-pm-goto-phase]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          document.dispatchEvent(
            new CustomEvent("rma:navigate", { detail: { phase: +b.dataset.pmGotoPhase } }),
          ),
        ),
      );
    rail.querySelector("[data-pm-exit]").addEventListener("click", () => setActive(false));
    document.body.append(rail);

    nav = document.createElement("div");
    nav.className = "pm-nav";
    nav.innerHTML = `
      <button type="button" class="pm-arrow" data-pm-prev aria-label="Previous slide">←</button>
      <span class="pm-count" aria-live="polite"></span>
      <button type="button" class="pm-arrow" data-pm-next aria-label="Next slide">→</button>`;
    nav.querySelector("[data-pm-prev]").addEventListener("click", () => show(current - 1));
    nav.querySelector("[data-pm-next]").addEventListener("click", () => show(current + 1));
    document.body.append(nav);
  }

  function setActive(on) {
    if (on === active) return;
    active = on;
    document.body.classList.toggle("nt-present", on);
    if (on) {
      if (!rail) buildChrome();
      deckify();
    } else {
      unDeckify();
    }
    document
      .querySelectorAll("[data-pm-toggle-label]")
      .forEach((el) => (el.textContent = on ? "Exit Present" : "Present"));
  }

  if (app?.renderPhase) {
    const origRenderPhase = app.renderPhase.bind(app);
    app.renderPhase = (index, renderFn) => {
      origRenderPhase(index, renderFn);
      if (active) deckify();
    };
  }

  if (phaseContainer) {
    new MutationObserver(() => {
      if (!active || !slideEls.length) return;
      const phaseEl = phaseContainer.querySelector?.(".phase") || phaseContainer;
      if (!phaseEl) return;
      [...phaseEl.children].forEach((child) => {
        if (child.dataset.pmSlide === undefined) {
          child.dataset.pmSlide = String(slideEls.length - 1);
          slideEls[slideEls.length - 1]?.push(child);
          child.classList.toggle("pm-hidden", current !== slideEls.length - 1);
        }
      });
    }).observe(phaseContainer, { childList: true, subtree: true });
  }

  document.addEventListener("keydown", (e) => {
    if (!active || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (document.documentElement.classList.contains("nt-extra-fullpage-open")) return;
    if (e.key === "ArrowRight" || e.key === "Space") show(current + 1);
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "Escape") setActive(false);
  });

  document.addEventListener("nt:present-deck-toggle", () => {
    setActive(!active);
  });

  let tries = 0;
  (function mountToolsItem() {
    const slot = document.querySelector('.nt-utility-pop [data-slot="actions"]');
    if (!slot) {
      if (tries++ < 40) setTimeout(mountToolsItem, 250);
      return;
    }
    if (slot.querySelector("[data-pm-toggle]")) return;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "nt-utility-item";
    item.setAttribute("data-pm-toggle", "");
    item.innerHTML = '<span aria-hidden="true">📽️</span><span data-pm-toggle-label>Present</span>';
    item.addEventListener("click", () => setActive(!active));
    slot.appendChild(item);
  })();

  if (new URLSearchParams(window.location.search).get("present") === "1") {
    const tick = setInterval(() => {
      if (phaseContainer?.querySelector?.(".phase")) {
        clearInterval(tick);
        setActive(true);
      }
    }, 400);
    setTimeout(() => clearInterval(tick), 60000);
  }

  mountPresentWidget({
    onPresentToggle: async () => {
      const shared = await startScreenShare({
        onFallback: () => {
          setActive(!active);
        },
      });
      if (!shared && !active) {
        setActive(true);
      }
    },
  });
}

export default initPresentMode;
