export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function createAnnouncer(mountEl) {
  if (!mountEl) throw new Error("createAnnouncer: mountEl is required");
  let region = mountEl.querySelector('[data-e3d="aria-live"]');
  if (!region) {
    region = document.createElement("div");
    region.setAttribute("data-e3d", "aria-live");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.setAttribute("role", "status");
    Object.assign(region.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0 0 0 0)",
      whiteSpace: "nowrap",
      border: "0",
    });
    mountEl.appendChild(region);
  }

  let captionEl = null;

  function announce(text) {
    region.textContent = "";
    // Force re-announcement of identical strings.
    window.requestAnimationFrame(() => {
      region.textContent = String(text);
    });
  }

  return {
    announce,
    /** Show a visible caption (for audio/SFX). Pass "" or null to clear. */
    caption(text) {
      if (!captionEl) {
        captionEl = document.createElement("div");
        captionEl.className = "e3d-caption";
        captionEl.setAttribute("aria-hidden", "true");
        injectCaptionStyles();
        mountEl.appendChild(captionEl);
      }
      captionEl.textContent = text || "";
      captionEl.hidden = !text;
    },
    dispose() {
      if (region.parentNode) region.parentNode.removeChild(region);
      if (captionEl && captionEl.parentNode)
        captionEl.parentNode.removeChild(captionEl);
    },
  };
}

/**
 * Trap and cycle focus within a container for keyboard-only users.
 * Returns a release() function.
 */
export function trapFocus(container) {
  const selector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  function onKey(e) {
    if (e.key !== "Tab") return;
    const items = Array.from(container.querySelectorAll(selector)).filter(
      (el) => !el.disabled && el.offsetParent !== null,
    );
    if (items.length === 0) return;
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

/** Make an element keyboard-activatable (Enter/Space → cb). */
export function onActivate(el, cb) {
  const click = (e) => cb(e);
  const key = (e) => {
    if (e.key === "Enter" || e.key === " " || e.code === "Space") {
      e.preventDefault();
      cb(e);
    }
  };
  el.addEventListener("click", click);
  el.addEventListener("keydown", key);
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
  return () => {
    el.removeEventListener("click", click);
    el.removeEventListener("keydown", key);
  };
}

function injectCaptionStyles() {
  if (document.getElementById("e3d-caption-styles")) return;
  const s = document.createElement("style");
  s.id = "e3d-caption-styles";
  s.textContent = `
  .e3d-caption{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);
    background:rgba(0,0,0,.78);color:#fff;padding:6px 14px;border-radius:8px;
    font-family:var(--font-body,system-ui,sans-serif);font-size:15px;z-index:25;
    pointer-events:none;max-width:90%;text-align:center;}`;
  document.head.appendChild(s);
}
