// In-page probes for the family homework accessibility gate (tools/verify-family-a11y.mjs).
//
// Every probe runs INSIDE the page and measures what a browser actually computed: the
// accessibility tree (via ariaSnapshot on the node side), computed style, layout boxes and
// focus behaviour. A source grep cannot tell a visually-hidden string from a removed one.
// Each probe takes no arguments and returns an array of short finding strings, so the same
// function runs on the shipped pages and on the self-test fixtures that prove it can fail.

/** Controls whose accessible name must contain a letter (an emoji or a symbol is not a name). */
export const UNNAMED_CONTROLS = () => {
  const out = [];
  const sel =
    "button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio]";
  const visible = (el) => {
    if (!el.getClientRects().length) return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement)
      if (n.getAttribute("aria-hidden") === "true" || n.hasAttribute("inert")) return false;
    return getComputedStyle(el).visibility !== "hidden";
  };
  const textOf = (el) => {
    const parts = [];
    const walk = (n) => {
      if (n.nodeType === 3) parts.push(n.textContent);
      else if (n.nodeType === 1) {
        const s = getComputedStyle(n);
        if (
          s.display === "none" ||
          s.visibility === "hidden" ||
          n.getAttribute("aria-hidden") === "true"
        )
          return;
        if (n.tagName === "IMG") parts.push(n.getAttribute("alt") || "");
        if (n.tagName === "svg" || n.tagName === "SVG")
          parts.push(n.querySelector("title")?.textContent || n.getAttribute("aria-label") || "");
        for (const c of n.childNodes) walk(c);
      }
    };
    walk(el);
    return parts.join(" ");
  };
  const nameOf = (el) => {
    const labelled = el.getAttribute("aria-labelledby");
    if (labelled)
      return labelled
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent || "")
        .join(" ");
    const aria = el.getAttribute("aria-label");
    if (aria?.trim()) return aria;
    if (el.labels?.length) return [...el.labels].map((l) => textOf(l)).join(" ");
    if (el.tagName === "INPUT" && ["button", "submit", "reset"].includes(el.type)) return el.value;
    return textOf(el) || el.getAttribute("title") || el.getAttribute("placeholder") || "";
  };
  for (const el of document.querySelectorAll(sel)) {
    if (!visible(el)) continue;
    const name = nameOf(el).trim();
    if (/\p{Extended_Pictographic}/u.test(name))
      out.push(
        `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${String(el.className?.baseVal ?? el.className).split(" ")[0]} reads an emoji aloud ("${name.slice(0, 20)}")`,
      );
    // A radio or checkbox in a group may be named by a bare number ("50"): the group names the question.
    const choice = el.matches("input[type=radio], input[type=checkbox]");
    if (choice ? !name : !/[\p{L}\p{N}]/u.test(name))
      out.push(
        `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${String(el.className?.baseVal ?? el.className).split(" ")[0]} has no text name ("${name.slice(0, 20)}")`,
      );
  }
  return out;
};

/** Hidden controls (not in the tree) with no name at all: they become nameless the moment JS shows them. */
export const UNNAMED_HIDDEN_BUTTONS = () => {
  const out = [];
  for (const el of document.querySelectorAll("button, [role=button]")) {
    if (el.getAttribute("aria-label")?.trim()) continue;
    if (el.textContent.trim() || el.querySelector("img[alt], svg title")) continue;
    out.push(
      `empty button ${el.id ? `#${el.id}` : `.${String(el.className?.baseVal ?? el.className).split(" ")[0]}`}`,
    );
  }
  return out;
};

/** Headings are read without their decoration: no emoji in the accessible heading text. */
export const HEADING_EMOJI = () => {
  const out = [];
  const spoken = (n) => {
    if (n.nodeType === 3) return n.textContent;
    if (
      n.nodeType !== 1 ||
      n.getAttribute("aria-hidden") === "true" ||
      getComputedStyle(n).display === "none"
    )
      return "";
    return [...n.childNodes].map(spoken).join("");
  };
  for (const h of document.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
    if (!h.getClientRects().length) continue;
    const text = spoken(h);
    if (/\p{Extended_Pictographic}/u.test(text))
      out.push(`heading reads an emoji aloud: "${text.trim().slice(0, 40)}"`);
  }
  return out;
};

export const DUPLICATE_IDS = () => {
  const seen = new Map();
  for (const el of document.querySelectorAll("[id]")) seen.set(el.id, (seen.get(el.id) || 0) + 1);
  return [...seen].filter(([, n]) => n > 1).map(([id, n]) => `id "${id}" used ${n} times`);
};

/** One visible h1; levels may only step down by one; no heading carries both languages. */
export const HEADING_OUTLINE = () => {
  const out = [];
  const inTree = (el) => {
    if (!el.getClientRects().length) return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement)
      if (n.getAttribute("aria-hidden") === "true" || n.hasAttribute("inert")) return false;
    return getComputedStyle(el).visibility !== "hidden";
  };
  const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role=heading]")].filter(inTree);
  const level = (h) => Number(h.getAttribute("aria-level")) || Number(h.tagName[1]) || 2;
  const h1s = heads.filter((h) => level(h) === 1);
  if (h1s.length !== 1) out.push(`${h1s.length} visible h1 (want 1)`);
  let prev = 0;
  for (const h of heads) {
    const l = level(h);
    if (prev && l > prev + 1)
      out.push(`heading jumps h${prev} -> h${l}: "${h.textContent.trim().slice(0, 40)}"`);
    prev = l;
  }
  for (const h of heads) {
    const en = h.querySelector(".lang-en");
    const es = h.querySelector(".lang-es, [lang=es]");
    if (en && es && inTree(en) && inTree(es))
      out.push(`heading exposes both languages: "${h.textContent.trim().slice(0, 40)}"`);
  }
  return out;
};

/** The language that is not showing must leave the accessibility tree, not just be painted over. */
export const INACTIVE_LANGUAGE = () => {
  const out = [];
  const mode = document.body.classList.contains("lang-mode-es") ? "es" : "en";
  const other = mode === "es" ? "en" : "es";
  if (document.documentElement.lang !== mode)
    out.push(`<html lang="${document.documentElement.lang}"> while ${mode} is showing`);
  for (const el of document.querySelectorAll(`.lang-${other}`)) {
    if (
      el.closest("[lang]")?.getAttribute("lang") === mode &&
      !el.hasAttribute("lang") &&
      el.closest(".lang-" + mode)
    )
      continue;
    let hidden = false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (
        s.display === "none" ||
        n.hidden ||
        n.getAttribute("aria-hidden") === "true" ||
        n.hasAttribute("inert") ||
        s.visibility === "hidden"
      ) {
        hidden = true;
        break;
      }
    }
    if (!hidden) out.push(`.lang-${other} still exposed: "${el.textContent.trim().slice(0, 30)}"`);
  }
  // Text in the wrong language announced with the wrong voice: every .lang-es that is showing says so.
  if (mode === "es")
    for (const el of document.querySelectorAll(".lang-es")) {
      if (!el.getClientRects().length) continue;
      if (!el.closest("[lang=es]"))
        out.push(`.lang-es without lang="es": "${el.textContent.trim().slice(0, 30)}"`);
    }
  return out.slice(0, 12);
};

/** One language per attribute: "English / Español" in a label is read aloud as both. */
export const BILINGUAL_ATTRIBUTES = () => {
  const out = [];
  const spanish =
    /[áéíóúñ¿¡]|\b(el|la|los|las|de|del|para|tu|tus|un|una|fila|respuesta|escuchar|cerrar|idioma|problemas|ampliada|navegación)\b/i;
  for (const el of document.querySelectorAll("[aria-label], [title], [placeholder]")) {
    if (!el.getClientRects().length) continue;
    for (const attr of ["aria-label", "title", "placeholder"]) {
      const v = el.getAttribute(attr);
      const halves = v?.split(" / ");
      if (halves?.length === 2 && spanish.test(halves[1]))
        out.push(
          `${attr} carries both languages on ${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).split(" ")[0]}: "${v.slice(0, 40)}"`,
        );
    }
  }
  return [...new Set(out)].slice(0, 8);
};

/** Skip link first in tab order, pointing at an element that exists. */
export const SKIP_AND_LANDMARKS = () => {
  const out = [];
  const first = [
    ...document.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]"),
  ].find(
    (el) =>
      el.tabIndex >= 0 &&
      el.getClientRects().length + (el.matches(".hw-skip, [class*=skip]") ? 1 : 0) > 0,
  );
  const skip = document.querySelector("a[href^='#'].hw-skip, a[href^='#'][class*=skip]");
  if (!skip) out.push("no skip link");
  else {
    if (first !== skip) out.push("skip link is not the first focusable element");
    const target = document.querySelector(skip.getAttribute("href"));
    if (!target) out.push(`skip link target ${skip.getAttribute("href")} missing`);
  }
  const count = (sel) => document.querySelectorAll(sel).length;
  if (count("main, [role=main]") !== 1)
    out.push(`${count("main, [role=main]")} main landmarks (want 1)`);
  if (count("header, [role=banner]") < 1) out.push("no banner landmark");
  if (count("footer, [role=contentinfo]") < 1) out.push("no contentinfo landmark");
  const navs = [...document.querySelectorAll("nav, [role=navigation]")].filter(
    (n) => n.getClientRects().length,
  );
  if (
    navs.length > 1 &&
    navs.some((n) => !(n.getAttribute("aria-label") || n.getAttribute("aria-labelledby")))
  )
    out.push("several nav landmarks without distinct labels");
  return out;
};

/** Text floor and tap-target size on what a family touches. */
export const SIZES = () => {
  const out = [];
  const body = parseFloat(getComputedStyle(document.body).fontSize);
  if (body < 15.99) out.push(`body text ${body}px (want >= 16)`);
  const shown = (el) => {
    if (!el.getClientRects().length) return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement)
      if (n.getAttribute("aria-hidden") === "true" || getComputedStyle(n).visibility === "hidden")
        return false;
    return true;
  };
  const small = new Set();
  for (const el of document.querySelectorAll("body *")) {
    if (!shown(el)) continue;
    const own = [...el.childNodes].some(
      (n) => n.nodeType === 3 && /[\p{L}\d]{2}/u.test(n.textContent),
    );
    if (!own) continue;
    if (el.ownerSVGElement) continue; // drawings are measured by SVG_TEXT, a warning, not a failure
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px && px < 12.99)
      small.add(
        `${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).split(" ")[0]} ${Math.round(px * 10) / 10}px: "${el.textContent.trim().slice(0, 18)}"`,
      );
  }
  for (const s of [...small].slice(0, 8)) out.push(`text under 13px: ${s}`);
  const small44 = [];
  for (const el of document.querySelectorAll(
    "button, summary, select, [role=button], input[type=checkbox], input[type=radio], input[type=range], .btn",
  )) {
    // An inline vocabulary word sits in a sentence: WCAG 2.5.8 exempts targets inside running text.
    if (!shown(el) || el.matches(".obj-term, .obj-term-glue")) continue;
    // A hit region inside a drawing is a pointer convenience: its number inputs and buttons are the control.
    if (
      el.ownerSVGElement &&
      el
        .closest(".hw-interactive, .hw-visual-frame, section")
        ?.querySelector("input, select, button")
    )
      continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1) continue;
    // A radio or checkbox is operated through its label.
    const box =
      el.matches("input[type=checkbox], input[type=radio]") && el.labels?.[0]
        ? el.labels[0].getBoundingClientRect()
        : r;
    if (Math.min(box.width, box.height) < 43.5)
      small44.push(
        `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : `.${String(el.className?.baseVal ?? el.className).split(" ")[0]}`} ${Math.round(box.width)}x${Math.round(box.height)}`,
      );
  }
  for (const s of [...new Set(small44)].slice(0, 10)) out.push(`target under 44px: ${s}`);
  return out;
};

/** Text inside drawings, at the size a family sees it (user units times the drawing's scale). */
export const SVG_TEXT = () => {
  const small = new Map();
  for (const el of document.querySelectorAll("svg text, svg tspan")) {
    if (!el.getClientRects().length || !/[\p{L}\d]/u.test(el.textContent)) continue;
    const scale = el.getScreenCTM()?.a || 1;
    const px = parseFloat(getComputedStyle(el).fontSize) * scale;
    if (px < 10.99)
      small.set(
        `${el.closest("svg")?.getAttribute("class") || "svg"} ${Math.round(px * 10) / 10}px`,
        1,
      );
  }
  return [...small.keys()].slice(0, 6).map((k) => `drawing text under 11px: ${k}`);
};

/** Feedback regions announce politely; nothing announces assertively. */
export const LIVE_REGIONS = () => {
  const out = [];
  if (!document.querySelector("[aria-live=polite], [role=status]"))
    out.push("no polite live region");
  // Errors from the injected save/resume and Canvas layers may interrupt; feedback never does.
  for (const el of document.querySelectorAll("[aria-live=assertive], [role=alert]"))
    if (!el.matches("#nsr-err, #ci-hm-msg, [data-error-region]"))
      out.push(`assertive live region: ${el.id || el.className}`);
  for (const el of document.querySelectorAll(
    "[data-live-feedback], .problem-feedback, .feedback-area, #goal_reached_banner, #hw_toast, #progress_text",
  )) {
    const live = el.closest("[aria-live], [role=status], [role=alert]");
    // The toast is painted aria-hidden on purpose; its twin #hw_toast_live is what is announced.
    if (
      el.id === "hw_toast" &&
      document.getElementById("hw_toast_live")?.getAttribute("aria-live") === "polite"
    )
      continue;
    if (!live) out.push(`feedback region ${el.id || el.className} is not in a live region`);
  }
  return out;
};

/** Drag-and-drop and canvas work needs a keyboard or tap route. */
export const NON_POINTER_ALTERNATIVES = () => {
  const out = [];
  for (const el of document.querySelectorAll("[draggable=true]")) {
    if (!el.getClientRects().length) continue;
    const scope =
      el.closest(
        ".drag-sort-container, .drag-order-container, .hw-game-sort, .problem-card, section, .hw-game-pile",
      ) || el.parentElement;
    const alt =
      el.matches("button, [role=button], [tabindex]") ||
      scope?.querySelector("select, button.order-move-btn, [data-tap-alternative]");
    if (!alt)
      out.push(
        `draggable without tap or keyboard route: ${String(el.className?.baseVal ?? el.className).split(" ")[0]}`,
      );
  }
  for (const c of document.querySelectorAll("canvas")) {
    if (!c.getClientRects().length) continue;
    const label =
      c.getAttribute("aria-label") ||
      c.getAttribute("aria-labelledby") ||
      c.getAttribute("role") === "presentation" ||
      c.getAttribute("aria-hidden") === "true";
    if (!label)
      out.push(`canvas without a label or an aria-hidden decision: ${c.id || c.className}`);
  }
  return [...new Set(out)];
};

export const STRUCTURE_PROBES = {
  unnamedControls: UNNAMED_CONTROLS,
  duplicateIds: DUPLICATE_IDS,
  headings: HEADING_OUTLINE,
  headingEmoji: HEADING_EMOJI,
  inactiveLanguage: INACTIVE_LANGUAGE,
  bilingualAttributes: BILINGUAL_ATTRIBUTES,
  skipAndLandmarks: SKIP_AND_LANDMARKS,
  sizes: SIZES,
  liveRegions: LIVE_REGIONS,
  nonPointer: NON_POINTER_ALTERNATIVES,
};

/** Focus is visible on the first `limit` tab stops: >= 2px outline (3px designed) or a ring shadow. */
export const FOCUS_RING = (limit) => {
  const out = [];
  const stops = [
    ...document.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]"),
  ].filter(
    (el) =>
      el.tabIndex >= 0 &&
      el.getClientRects().length &&
      getComputedStyle(el).visibility !== "hidden",
  );
  for (const el of stops.slice(0, limit)) {
    el.focus({ focusVisible: true });
    if (document.activeElement !== el) continue; // not reachable now (closed panel, inert face)
    const s = getComputedStyle(el);
    const outline =
      s.outlineStyle !== "none" &&
      parseFloat(s.outlineWidth) >= 2.5 &&
      s.outlineColor !== "rgba(0, 0, 0, 0)";
    const ring =
      /\d+px\s+\d+px\s+\d+px\s+[1-9]\d*px|\s[3-9]px\s*\w*$/.test(s.boxShadow) &&
      s.boxShadow !== "none";
    if (!outline && !ring)
      out.push(
        `no visible focus ring on ${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : `.${String(el.className?.baseVal ?? el.className).split(" ")[0]}`}`,
      );
  }
  return out;
};

/** Forced colors: every control keeps a border or an outline, because backgrounds are removed. */
export const FORCED_COLORS = () => {
  const out = [];
  for (const el of document.querySelectorAll(
    "button, select, textarea, input:not([type=hidden]), summary, [role=button]",
  )) {
    if (!el.getClientRects().length || el.matches(".obj-term")) continue; // inline words keep their underline
    const s = getComputedStyle(el);
    const border = s.borderTopStyle !== "none" && parseFloat(s.borderTopWidth) > 0;
    const outline = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
    if (!border && !outline && el.type !== "radio" && el.type !== "checkbox")
      out.push(
        `no border under forced colors: ${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : `.${String(el.className?.baseVal ?? el.className).split(" ")[0]}`}`,
      );
  }
  return [...new Set(out)].slice(0, 10);
};

/** Reduced motion: no running animation longer than a blink and no multi-frame transitions. */
export const REDUCED_MOTION = () => {
  const out = [];
  for (const a of document.getAnimations()) {
    const t = a.effect?.getComputedTiming?.();
    if (!t) continue;
    const el = a.effect.target;
    if (!el?.getClientRects?.().length) continue;
    if (t.iterations === Infinity || (Number(t.duration) > 50 && a.playState === "running"))
      out.push(
        `animation still running: ${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).split(" ")[0]} (${a.animationName || a.transitionProperty || "anim"})`,
      );
  }
  return out.slice(0, 8);
};

/** 400% reflow: nothing scrolls sideways and no visible text is cut off by its own box. */
export const REFLOW = () => {
  const out = [];
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (overflow > 1) out.push(`horizontal scroll by ${overflow}px`);
  const clipped = [];
  for (const el of document.querySelectorAll("button, .btn, summary, label, h1, h2, h3, a")) {
    if (!el.getClientRects().length) continue;
    const s = getComputedStyle(el);
    if (s.overflow === "visible") continue;
    if (el.scrollWidth > el.clientWidth + 2 && s.textOverflow !== "clip")
      clipped.push(
        `${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).split(" ")[0]}`,
      );
  }
  for (const c of [...new Set(clipped)].slice(0, 6)) out.push(`clipped text in ${c}`);
  return out;
};
