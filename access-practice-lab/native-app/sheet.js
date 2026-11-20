// The app settings sheet: one gear button and one bottom-sheet dialog. Built with DOM calls (no HTML strings), every
// string from strings.js, all behavior delegated to native.js (device) and lab-language.js (language).
import { MODES, readMode, setMode } from "./lab-language.js";
import { normLang, t } from "./strings.js";

export const PRIVACY_PATH = "/access-practice-lab/privacy";
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
const GEAR_SVG =
  '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>';

function el(doc, tag, props = {}, ...kids) {
  const node = doc.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  node.append(...kids.flat().filter(Boolean));
  return node;
}

/** Mounts the gear and the sheet. Returns { open, close, destroy } for tests and boot. */
export function mountSettings({ doc = document, native, onLanguage }) {
  let lang = normLang(readMode());
  let lastFocus = null;
  const text = {}; // node -> key, so a language change relabels in place
  const label = (node, key, attr = "text") => {
    text[key] = text[key] || [];
    text[key].push([node, attr]);
    return node;
  };
  const say = (key, vars) => t(lang, key, vars);

  const gear = el(doc, "button", { type: "button", class: "nla-gear", "aria-haspopup": "dialog" });
  gear.innerHTML = GEAR_SVG;
  label(gear, "gear.label", "aria-label");

  // ── sheet ────────────────────────────────────────────────────────────────
  const dialog = el(doc, "dialog", { class: "nla-sheet", "aria-labelledby": "nla-title", "data-i18n-skip": true });
  const title = label(el(doc, "h2", { id: "nla-title", tabindex: "-1" }), "sheet.title");
  const close = label(el(doc, "button", { type: "button", class: "nla-close" }), "sheet.close", "aria-label");
  close.append(el(doc, "span", { "aria-hidden": "true", text: "×" }));

  const radios = MODES.map((mode) => {
    const input = el(doc, "input", { type: "radio", name: "nla-lang", value: mode });
    const span = label(el(doc, "span"), `language.${mode}`);
    if (mode === "es") span.setAttribute("lang", "es");
    return { mode, input, row: el(doc, "label", { class: "nla-opt" }, input, span) };
  });
  const langGroup = el(doc, "div", { role: "radiogroup", "aria-labelledby": "nla-h-lang", class: "nla-opts" }, radios.map((r) => r.row));

  const reminder = el(doc, "input", { type: "checkbox", role: "switch", id: "nla-reminder" });
  const reminderStatus = el(doc, "p", { id: "nla-reminder-status", class: "nla-note", role: "status" });
  reminder.setAttribute("aria-describedby", "nla-reminder-status");
  const shareButton = label(el(doc, "button", { type: "button", class: "nla-btn" }), "share.button");
  const shareStatus = el(doc, "p", { class: "nla-note", role: "status" });
  const netNote = el(doc, "p", { class: "nla-note", role: "status" });
  const version = el(doc, "p", { class: "nla-fine" });
  const privacy = label(el(doc, "a", { class: "nla-link", href: PRIVACY_PATH }), "privacy.link");

  const section = (id, key, ...body) => {
    const heading = label(el(doc, "h3", { id }), key);
    return el(doc, "section", { class: "nla-sec", "aria-labelledby": id }, heading, ...body);
  };
  const p = (key, cls = "nla-p") => label(el(doc, "p", { class: cls }), key);

  dialog.append(
    el(doc, "div", { class: "nla-panel" },
      el(doc, "header", { class: "nla-head" }, title, close),
      section("nla-h-lang", "language.title", langGroup, p("language.note", "nla-note")),
      section("nla-h-rem", "reminder.section",
        el(doc, "label", { class: "nla-opt", for: "nla-reminder" }, reminder, label(el(doc, "span"), "reminder.toggle")),
        reminderStatus),
      section("nla-h-share", "share.section", shareButton, shareStatus),
      section("nla-h-help", "help.section", p("help.about"), p("help.contact"), privacy),
      section("nla-h-off", "offline.section", p("offline.intro"),
        el(doc, "ul", { class: "nla-list" },
          label(el(doc, "li"), "offline.works"), label(el(doc, "li"), "offline.online")),
        netNote),
      version),
  );

  // ── state ────────────────────────────────────────────────────────────────
  function relabel() {
    dialog.setAttribute("lang", lang);
    for (const [key, nodes] of Object.entries(text))
      for (const [node, attr] of nodes) {
        const value = say(key);
        if (attr === "text") node.textContent = value;
        else node.setAttribute(attr, value);
      }
  }

  async function refresh() {
    lang = normLang(readMode());
    relabel();
    const mode = readMode();
    for (const r of radios) r.input.checked = r.mode === mode;
    const state = await native.reminderState();
    reminder.disabled = !state.supported;
    reminder.checked = state.supported && state.pref === "on" && state.permission === "granted";
    const key = !state.supported ? "reminder.status.unsupported"
      : state.pref === "on" && state.permission !== "granted" ? "reminder.status.denied"
      : state.pref === "on" ? "reminder.status.on" : "reminder.status.off";
    reminderStatus.textContent = say(key);
    shareButton.hidden = !native.canShare();
    shareStatus.textContent = "";
    const v = await native.appVersion();
    version.textContent = v ? say("version.label", { version: v }) : say("version.web");
    netNote.textContent = (await native.isOnline()) ? "" : say("net.offline");
  }

  // ── events ───────────────────────────────────────────────────────────────
  function open() {
    lastFocus = doc.activeElement instanceof HTMLElement ? doc.activeElement : gear;
    refresh().then(() => {
      if (!dialog.open) typeof dialog.showModal === "function" ? dialog.showModal() : dialog.setAttribute("open", "");
      title.focus();
    });
  }
  function close_() {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    (gear.isConnected ? gear : lastFocus)?.focus();
  }

  gear.addEventListener("click", open);
  close.addEventListener("click", close_);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault(); // one closing path, so focus always returns to the gear
    close_();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close_(); // the dimmed area around the panel
    if (event.target.closest?.("a[href]")) close_(); // the privacy page opens inside the lab
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") return close_();
    if (event.key !== "Tab") return;
    const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((n) => !n.hidden && n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (doc.activeElement === first || doc.activeElement === title)) (event.preventDefault(), last.focus());
    else if (!event.shiftKey && doc.activeElement === last) (event.preventDefault(), first.focus());
  });

  langGroup.addEventListener("change", async (event) => {
    const mode = event.target?.value;
    if (!MODES.includes(mode)) return;
    await setMode(mode, { doc });
    await refresh();
    radios.find((r) => r.mode === readMode())?.input.focus();
    await onLanguage?.(readMode());
  });

  reminder.addEventListener("change", async () => {
    const want = reminder.checked;
    reminder.disabled = true;
    const result = await native.setReminder(want, lang);
    reminder.disabled = false;
    reminder.checked = result.pref === "on";
    reminderStatus.textContent = say(
      result.denied ? "reminder.status.denied" : result.error ? "reminder.status.error"
        : result.pref === "on" ? "reminder.status.on" : "reminder.status.off",
    );
  });

  shareButton.addEventListener("click", async () => {
    const result = await native.share(lang);
    shareStatus.textContent = result === "unsupported" ? say("share.unsupported") : "";
  });

  // The gear sits over the page, so it steps aside while someone types (the on-screen keyboard covers that corner).
  const typing = (node) => node?.matches?.("input, textarea, select, [contenteditable='true']") && !dialog.contains(node);
  const onFocusIn = (e) => { gear.hidden = !!typing(e.target); };
  const onFocusOut = () => { gear.hidden = false; };
  doc.addEventListener("focusin", onFocusIn);
  doc.addEventListener("focusout", onFocusOut);

  relabel();
  doc.body.append(gear, dialog);
  return {
    gear, dialog, open, close: close_, refresh,
    destroy() {
      doc.removeEventListener("focusin", onFocusIn);
      doc.removeEventListener("focusout", onFocusOut);
      gear.remove();
      dialog.remove();
    },
  };
}
