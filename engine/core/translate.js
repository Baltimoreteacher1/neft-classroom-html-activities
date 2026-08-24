// translate.js — One-tap translation of the current lesson part into a student's
// home language, for ESOL access. It has no button of its own: it is triggered
// from the Learning Supports (IEP accommodations) dock, which dispatches a
// `nt:translate` event. On trigger it shows a centered language menu; picking one
// sends the visible text of the current phase to the tutor backend (mode
// "translate", Haiku) and shows the translation in a readable overlay. The
// student's last language is remembered.
//
// mountTranslate({ getPhaseEl })

const LANGS = ["Spanish"];
const LAST_KEY = "nt-translate-lang";

export function mountTranslate({ getPhaseEl }) {
  function safeGet() {
    try {
      return localStorage.getItem(LAST_KEY) || "";
    } catch (_e) {
      return "";
    }
  }
  function safeSet(v) {
    try {
      localStorage.setItem(LAST_KEY, v);
    } catch (_e) {
      /* ignore */
    }
  }

  // Centered language menu (a light modal), shown on demand.
  const menuWrap = document.createElement("div");
  menuWrap.style.cssText =
    "position:fixed; inset:0; z-index:2147482050; background:rgba(18,53,91,.45); display:none; " +
    "align-items:center; justify-content:center; padding:18px;";
  const menu = document.createElement("div");
  menu.style.cssText =
    "background:#fff; border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,.3); padding:10px; " +
    "min-width:230px; max-height:80vh; overflow:auto; font-family:system-ui,sans-serif;";
  menuWrap.appendChild(menu);
  document.body.appendChild(menuWrap);

  function langRow(l, recent) {
    return (
      '<button type="button" data-lang="' +
      l.replace(/"/g, "") +
      '" style="display:block;width:100%;text-align:left;min-height:46px;padding:0 14px;border:0;' +
      "background:" +
      (recent ? "#f0ecfb" : "#fff") +
      ";color:#1a2b3c;font-size:1.05rem;font-weight:" +
      (recent ? "700" : "500") +
      ';cursor:pointer;border-radius:8px;">' +
      (recent ? "↻ " : "") +
      l +
      "</button>"
    );
  }
  function renderMenu() {
    const last = safeGet();
    menu.innerHTML =
      '<div style="font-weight:700;color:#12355b;padding:8px 12px;font-size:1rem;">Read this part in…</div>' +
      (last ? langRow(last, true) : "") +
      LANGS.filter((l) => l !== last)
        .map((l) => langRow(l, false))
        .join("");
  }

  // Result overlay.
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed; inset:0; z-index:2147482060; background:rgba(18,53,91,.55); display:none; " +
    "align-items:center; justify-content:center; padding:18px;";
  overlay.innerHTML =
    '<div style="background:#fff; border-radius:18px; max-width:640px; width:100%; max-height:86vh; overflow:auto; padding:22px; box-shadow:0 12px 40px rgba(0,0,0,.3);">' +
    '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">' +
    '<h2 data-tr-title style="margin:0; color:#12355b; font-size:1.2rem;">Translation</h2>' +
    '<button type="button" data-tr-close aria-label="Close" style="width:40px;height:40px;border-radius:50%;border:1px solid #e4ebf2;background:#fff;font-size:1.1rem;cursor:pointer;">✕</button>' +
    "</div>" +
    '<div data-tr-body style="font-size:1.2rem; line-height:1.7; color:#1a2b3c; white-space:pre-wrap;"></div>' +
    "</div>";
  document.body.appendChild(overlay);
  const titleEl = overlay.querySelector("[data-tr-title]");
  const bodyEl = overlay.querySelector("[data-tr-body]");

  function openMenu() {
    renderMenu();
    menuWrap.style.display = "flex";
  }
  function closeMenu() {
    menuWrap.style.display = "none";
  }
  function closeOverlay() {
    overlay.style.display = "none";
  }

  menuWrap.addEventListener("click", (e) => {
    if (e.target === menuWrap) closeMenu();
  });
  overlay.querySelector("[data-tr-close]").addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });

  menu.addEventListener("click", (e) => {
    const lang = /** @type {HTMLElement} */ (e.target).closest("button")?.dataset.lang;
    if (!lang) return;
    closeMenu();
    safeSet(lang);
    const el = getPhaseEl?.();
    const text = (el?.innerText || el?.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
    if (!text) return;
    titleEl.textContent = "Translating to " + lang + "…";
    bodyEl.textContent = "…";
    overlay.style.display = "flex";
    fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "translate", lang, itemText: text }),
    })
      .then((r) => r.json().catch(() => null))
      .then((data) => {
        if (data && data.ok && data.reply) {
          titleEl.textContent = lang;
          bodyEl.textContent = data.reply.trim();
        } else if (data && data.offline) {
          titleEl.textContent = lang;
          bodyEl.textContent = "Translation is unavailable right now. Please try again later.";
        } else {
          bodyEl.textContent = "Sorry, that didn't work. Please try again.";
        }
      })
      .catch(() => {
        bodyEl.textContent = "Something went wrong. Please try again.";
      });
  });

  // Triggered from the Learning Supports accommodations dock.
  const onTrigger = () => openMenu();
  document.addEventListener("nt:translate", onTrigger);

  return {
    destroy() {
      document.removeEventListener("nt:translate", onTrigger);
      menuWrap.remove();
      overlay.remove();
    },
  };
}

export default mountTranslate;
