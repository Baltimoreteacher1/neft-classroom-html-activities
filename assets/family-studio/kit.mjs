/**
 * Family Studio kit: the small helpers every studio screen shares. Bilingual text follows the page's
 * own language switch (body.lang-mode-en / -es / -bilingual shows .lang-en / .lang-es), read-aloud goes
 * through the page's voice engine (window.hwVoice), and saved progress stays on this device.
 */

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** One piece of bilingual text; Spanish falls back to English rather than showing nothing. */
export const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es || en)}</span>`;

/** A sidecar pair ({en, es}) as bilingual text. */
export const pair = (p) => bi(p?.en, p?.es);

/** True when a sidecar pair has English text. */
export const has = (p) => Boolean(p && typeof p.en === "string" && p.en.trim());

export function el(tag, cls, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
}

/** The language the family is reading: "en", "es" or "bilingual". */
export function langMode() {
  const c = document.body.classList;
  if (c.contains("lang-mode-es")) return "es";
  if (c.contains("lang-mode-bilingual")) return "bilingual";
  return "en";
}

/** The lesson id the page was built for ("6-4", "6-4-part2"). */
export const lessonId = () => String(window.LESSON_ID || "").replace(/[^\w-]/g, "");

export const reducedMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {
    return false;
  }
};

/** A Listen button that reads `en`/`es` in the family's language. Hidden when the device cannot speak. */
export function listenButton(en, es, label = ["Listen", "Escuchar"]) {
  const b = el(
    "button",
    "fs-listen",
    `<span aria-hidden="true">🔊</span> ${bi(label[0], label[1])}`,
  );
  b.type = "button";
  b.setAttribute("aria-pressed", "false");
  const voice = window.hwVoice;
  if (!voice || !voice.supported()) {
    b.hidden = true;
    return b;
  }
  b.addEventListener("click", () => {
    if (b.getAttribute("aria-pressed") === "true") voice.stop();
    else voice.speak(en, es, { button: b });
  });
  return b;
}

/** Device-only memory for the studio, one key per lesson. */
export function store(name) {
  const key = `fs_${name}_${lessonId() || location.pathname}`;
  return {
    read(fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) {
        return fallback;
      }
    },
    write(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {
        /* private mode: the studio still works, it just forgets */
      }
    },
  };
}

/** A short celebratory burst on `host` (no motion when the family asked for less). */
export function sparkle(host) {
  if (!host || reducedMotion()) return;
  const burst = el("span", "fs-sparkle", "✨🎉⭐");
  burst.setAttribute("aria-hidden", "true");
  host.appendChild(burst);
  setTimeout(() => burst.remove(), 1400);
}

/** Polite screen-reader announcement inside the open studio. */
export function announce(root, en, es) {
  const live = root?.querySelector("[data-fs-live]");
  if (live) live.innerHTML = bi(en, es);
}

/**
 * A problem picture (picture.mjs result) with "Picture it" and a Build button that reveals the
 * drawing in its build steps (<g data-build="n">: frame, givens, then the unknown).
 */
export function pictureBox(pic, cls = "") {
  const box = el(
    "details",
    `fs-pic ${cls}`,
    `<summary>🖼️ ${bi("Picture it", "Imagínalo")}</summary><figure>${pic.svg}<figcaption>${bi(pic.caption.en, pic.caption.es)}</figcaption></figure>`,
  );
  box.open = true;
  const groups = [...box.querySelectorAll("svg")].map((svg) =>
    [...svg.querySelectorAll(":scope > g[data-build]")].sort((a, b) => Number(a.dataset.build) - Number(b.dataset.build)),
  );
  const steps = Math.max(0, ...groups.map((g) => g.length));
  if (steps < 2) return box;
  const btn = el("button", "fs-btn fs-btn-soft fs-build", `▶ ${bi("Build it step by step", "Ármenlo paso a paso")}`);
  btn.type = "button";
  let shown = steps;
  btn.addEventListener("click", () => {
    shown = shown >= steps ? 1 : shown + 1;
    for (const list of groups) list.forEach((g, i) => g.classList.toggle("fs-build-hidden", i >= shown));
    btn.innerHTML =
      shown >= steps
        ? `🔁 ${bi("Build it again", "Armarlo otra vez")}`
        : `➕ ${bi(`Next step (${shown} of ${steps})`, `Siguiente paso (${shown} de ${steps})`)}`;
  });
  box.appendChild(btn);
  return box;
}

/** Both languages of one picture, so the page's language switch shows the right labels and description. */
export function bilingualPicture(pictureFor, stem, opts = {}) {
  const en = pictureFor(stem, { ...opts, lang: "en" });
  if (!en?.svg) return null;
  const es = pictureFor(stem, { ...opts, lang: "es" });
  return {
    kind: en.kind,
    svg: es?.svg ? `<span class="lang-en">${en.svg}</span><span class="lang-es" lang="es">${es.svg}</span>` : en.svg,
    caption: en.caption,
  };
}
