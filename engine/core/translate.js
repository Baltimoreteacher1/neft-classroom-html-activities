// translate.js — One-tap translation of the current lesson part into a student's
// home language, for ESOL access. A floating 🌐 button opens a short language
// menu; picking one sends the visible text of the current phase to the tutor
// backend (mode "translate", Haiku) and shows the translation in a readable
// overlay. The student's last language is remembered.
//
// mountTranslate({ getPhaseEl })

const LANGS = [
  "Spanish",
  "Arabic",
  "Chinese (Simplified)",
  "French",
  "Vietnamese",
  "Portuguese",
  "Russian",
  "Ukrainian",
  "Haitian Creole",
  "Nepali",
];
const LAST_KEY = "nt-translate-lang";

export function mountTranslate({ getPhaseEl }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nt-translate-btn";
  btn.setAttribute("aria-label", "Translate this part into another language");
  btn.textContent = "🌐";
  btn.style.cssText =
    "position:fixed; right:16px; bottom:208px; z-index:9997; width:52px; height:52px; " +
    "border-radius:50%; border:0; background:#6d4ad6; color:#fff; font-size:1.4rem; " +
    "cursor:pointer; box-shadow:0 4px 14px rgba(12,27,42,.28);";
  document.body.appendChild(btn);

  const menu = document.createElement("div");
  menu.style.cssText =
    "position:fixed; right:16px; bottom:268px; z-index:9998; background:#fff; border:1px solid #e4ebf2; " +
    "border-radius:14px; box-shadow:0 8px 28px rgba(12,27,42,.24); padding:8px; display:none; " +
    "max-height:60vh; overflow:auto; min-width:190px; font-family:system-ui,sans-serif;";
  const last = safeGet();
  menu.innerHTML =
    '<div style="font-weight:800;color:#12355b;padding:6px 10px;font-size:.9rem;">Read this in…</div>' +
    (last ? langRow(last, true) : "") +
    LANGS.filter((l) => l !== last)
      .map((l) => langRow(l, false))
      .join("");
  document.body.appendChild(menu);

  function langRow(l, recent) {
    return (
      '<button type="button" data-lang="' +
      l.replace(/"/g, "") +
      '" style="display:block;width:100%;text-align:left;min-height:44px;padding:0 12px;border:0;' +
      "background:" +
      (recent ? "#f0ecfb" : "#fff") +
      ";color:#1a2b3c;font-size:1rem;font-weight:" +
      (recent ? "700" : "500") +
      ';cursor:pointer;border-radius:8px;">' +
      (recent ? "↻ " : "") +
      l +
      "</button>"
    );
  }

  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed; inset:0; z-index:2147482000; background:rgba(18,53,91,.55); display:none; " +
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

  function safeGet() {
    try {
      return localStorage.getItem(LAST_KEY) || "";
    } catch (e) {
      return "";
    }
  }
  function safeSet(v) {
    try {
      localStorage.setItem(LAST_KEY, v);
    } catch (e) {
      /* ignore */
    }
  }

  function closeMenu() {
    menu.style.display = "none";
  }
  function openOverlay() {
    overlay.style.display = "flex";
  }
  function closeOverlay() {
    overlay.style.display = "none";
  }

  btn.addEventListener("click", () => {
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  });
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== btn) closeMenu();
  });
  overlay.querySelector("[data-tr-close]").addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });

  menu.addEventListener("click", (e) => {
    const lang = e.target.closest("button")?.dataset.lang;
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
    openOverlay();
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

  return {
    destroy() {
      btn.remove();
      menu.remove();
      overlay.remove();
    },
  };
}

export default mountTranslate;
