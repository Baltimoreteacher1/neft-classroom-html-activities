// Save & Continue Later: one plain place for everything about keeping work. It wraps the lab's two existing
// mechanisms without changing either: the ACCESS1 backup code (Passport's export/import) and the site-wide
// Save/Resume short code. Import keeps every activity already on this device and only adds missing ones.
import * as audioStore from "../audio-store.js";
import * as postcardStore from "../postcard-store.js";
import { exportCodeWithPostcards, importPostcardsFromCode } from "../postcard-code.js";
import { clearAll, getPrefs, importCode, setPrefs } from "../store.js";
import { announce, html, icon, raw, storage } from "../util.js";
import { crumbs, subnavHTML } from "./ui.js";

const SHORT_SITE_CODE = /^[A-Za-z]{2,10}-[A-Za-z0-9]{4,8}$/;
let backedUp = false;
let confirming = false;
let status = "";

/** Copy without announcing the text: a backup code is long and must not be read out loud. */
async function copyQuietly(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const say = (I, key, vars) => {
  status = I.LS(key, vars);
  announce(status);
};

export async function render(ctx, I) {
  const band = ctx.band;
  const volatile = storage.isVolatile;
  return {
    title: I.LS("save.title"),
    html: html`${crumbs(I, I.L("save.title"))}
      <section class="fam-save panel" aria-labelledby="famSaveTitle">
        <p class="eyebrow">${icon("save")} ${I.L("hub.eyebrow")}</p>
        <h1 id="famSaveTitle" tabindex="-1">${I.L("save.title")}</h1>
        <p class="lead">${I.L("save.lead")}</p>
        ${volatile ? html`<p class="panel fam-warn" role="alert">${I.L("save.status.unsaved")}</p>` : ""}
        <h2>${I.L("save.where.heading")}</h2>
        <ul class="fam-checklist">${[1, 2, 3, 4, 5].map((n) => html`<li><span class="fam-check">${icon("check")}</span><span>${I.L(`save.where.${n}`)}</span></li>`)}</ul>
        <div class="fam-cta">
          <button type="button" class="btn btn-primary btn-big" data-fam-copy-code>${icon("copy")} ${I.L("save.copy")}</button>
          <button type="button" class="btn" data-fam-download-code>${icon("download")} ${I.L("save.download")}</button>
        </div>
        <label class="field fam-code-box" hidden data-fam-code-wrap><span>${I.L("save.copy")}</span><textarea rows="3" readonly data-fam-code data-nsr-ignore></textarea></label>
        <p class="fine">${I.L("save.private")}</p>
        <p class="fam-status" role="status" aria-live="polite" data-fam-status>${status}</p>
      </section>

      <section class="fam-save panel" aria-labelledby="famRestoreTitle">
        <h2 id="famRestoreTitle">${I.L("save.restore.heading")}</h2>
        <label class="field"><span>${I.L("save.restore.label")}</span><textarea rows="3" placeholder="ACCESS1.…" data-fam-restore-text data-nsr-ignore></textarea></label>
        <button type="button" class="btn" data-fam-restore>${I.L("save.restore.button")}</button>
        <p class="fine">${I.L("save.restore.keep")}</p>
      </section>

      <section class="fam-save panel" aria-labelledby="famSiteTitle">
        <h2 id="famSiteTitle">${I.L("save.site.heading")}</h2>
        <p>${I.L("save.site.text")}</p>
        <button type="button" class="btn" data-fam-site>${icon("save")} ${I.L("save.site.open")}</button>
        <p class="fine" data-fam-site-note hidden>${I.L("save.site.unavailable")}</p>
      </section>

      <section class="fam-save panel" aria-labelledby="famSharedTitle">
        <h2 id="famSharedTitle">${I.L("save.shared.heading")}</h2>
        <p>${I.L("save.shared.text")}</p>
        <label class="check"><input type="checkbox" data-fam-have-backup ${backedUp ? raw("checked") : ""} data-nsr-ignore /> <span>${I.L("save.shared.have")}</span></label>
        ${confirming
          ? html`<p class="panel fam-warn" role="alert">${I.L("save.shared.warn")}</p>
            <button type="button" class="btn btn-primary" data-fam-switch-confirm>${I.L("save.shared.confirm")}</button>
            <button type="button" class="ghost" data-fam-switch-cancel>${I.L("save.shared.cancel")}</button>`
          : html`<button type="button" class="btn" data-fam-switch>${I.L("save.shared.switch")}</button>`}
      </section>
      ${subnavHTML(I, "save", band)}`,
  };
}

const ACTIONS = [
  "[data-fam-copy-code]", "[data-fam-download-code]", "[data-fam-restore]", "[data-fam-site]",
  "[data-fam-switch]", "[data-fam-switch-cancel]", "[data-fam-switch-confirm]",
];

/** Claim the click synchronously (the router needs a plain `true`), then do the work. */
export function onClick(e, ctx, I) {
  if (!ACTIONS.some((selector) => e.target.closest(selector))) return false;
  handle(e, ctx, I);
  return true;
}

async function handle(e, ctx, I) {
  const t = e.target;
  const live = () => document.querySelector("[data-fam-status]");
  const show = () => { const n = live(); if (n) n.textContent = status; };
  if (t.closest("[data-fam-copy-code]")) {
    const code = await exportCodeWithPostcards();
    const ok = await copyQuietly(code);
    const wrap = document.querySelector("[data-fam-code-wrap]");
    const box = document.querySelector("[data-fam-code]");
    if (box && wrap) {
      box.value = code;
      wrap.hidden = ok;
      if (!ok) box.select();
    }
    if (ok) backedUp = true;
    say(I, ok ? "save.copied" : "save.copyFail");
    show();
    const checkbox = document.querySelector("[data-fam-have-backup]");
    if (checkbox) checkbox.checked = backedUp;
    return true;
  }
  if (t.closest("[data-fam-download-code]")) {
    const blob = new Blob([await exportCodeWithPostcards()], { type: "text/plain" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `access-practice-backup-${new Date().toISOString().slice(0, 10)}.txt` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    backedUp = true;
    say(I, "save.downloaded");
    show();
    return true;
  }
  if (t.closest("[data-fam-restore]")) {
    const text = (document.querySelector("[data-fam-restore-text]")?.value || "").trim();
    if (!text) say(I, "save.restore.empty.input");
    else if (SHORT_SITE_CODE.test(text)) say(I, "save.restore.short");
    else {
      try {
        const n = importCode(text);
        const postcards = await importPostcardsFromCode(text);
        say(I, n || postcards ? "save.restore.ok" : "save.restore.empty", { n, postcards });
        ctx.rerender();
        return true;
      } catch {
        say(I, "save.restore.bad");
      }
    }
    show();
    return true;
  }
  if (t.closest("[data-fam-site]")) {
    const engine = window.NeftSaveResume;
    if (engine?.open) engine.open();
    else document.querySelector("[data-fam-site-note]").hidden = false;
    return true;
  }
  if (t.closest("[data-fam-switch]")) {
    if (!backedUp && !document.querySelector("[data-fam-have-backup]")?.checked) {
      say(I, "save.shared.need");
      show();
      return true;
    }
    confirming = true;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-fam-switch-cancel]")) {
    confirming = false;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-fam-switch-confirm]")) {
    const keep = getPrefs();
    clearAll();
    // Language, text size and playback rate belong to the device and the adult, not to a learner's progress.
    // Restore them in the same tick as the clear, so there is never a moment with the language reset.
    setPrefs({ lang: keep.lang, langChosen: keep.langChosen, textSize: keep.textSize, rate: keep.rate });
    await audioStore.clearAll();
    await postcardStore.clearAll();
    backedUp = false;
    confirming = false;
    say(I, "save.shared.done");
    ctx.rerender();
    return true;
  }
  return false;
}

export function onChange(e) {
  if (e.target.matches?.("[data-fam-have-backup]")) backedUp = e.target.checked;
}

