// BCPSS Writing Lab — download what the student wrote as Word (.docx) or PDF.
// The saved answers go to POST /api/bcpss/export/<unit> (part "writing-work"), which lays them out beside the unit's own
// prompts and returns the file. Nothing is stored on the server; the file name never carries the student's name.
import { anonTokenHeaders } from "../../shared/anon-token/anon-token.js";
import { feedback, h, wl } from "./wl-core.js";

const FILE_NAME = /filename="([^"]+)"/;
const MESSAGES = {
  429: "That was a lot of downloads at once. Wait a minute and try again.",
  413: "Your writing is too long to download. Shorten a long box and try again.",
};

function saveBlob(blob, name) {
  const href = URL.createObjectURL(blob);
  const a = h("a", { href, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

/** The server could not render a PDF file: print the same page from a hidden frame (Save as PDF). */
function printHtml(html) {
  const frame = h("iframe", { class: "st-sr", title: "Print my writing", "aria-hidden": "true", tabindex: "-1" });
  frame.srcdoc = html;
  document.body.append(frame);
  window.setTimeout(() => frame.remove(), 120_000);
}

/** Saved answers (minus the device-only first-draft copy) plus the revise checks the student ticked (by text, so the file does not depend on list order). */
function currentWork(doneChecks) {
  // snap (the first-draft copy kept for "Show my changes") stays on the device.
  const { snap: _snap, ...work } = wl.state;
  const revise = { ...(work.revise || {}), done: doneChecks() };
  return { ...work, revise };
}

async function download(format, doneChecks) {
  const url = `/api/bcpss/export/${encodeURIComponent(wl.unitId)}?format=${format}&wida=${wl.level.slice(1)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...anonTokenHeaders() },
    body: JSON.stringify({ work: currentWork(doneChecks) }),
  });
  if (!res.ok) throw new Error(MESSAGES[res.status] || "The file could not be made. Check your connection and try again.");
  if ((res.headers.get("content-type") || "").includes("text/html")) {
    printHtml(await res.text());
    return "Your print window is opening. Choose Save as PDF as the printer.";
  }
  const name = FILE_NAME.exec(res.headers.get("content-disposition") || "")?.[1] || `my-writing.${format}`;
  saveBlob(await res.blob(), name);
  return `Downloaded ${name}.`;
}

/**
 * Two buttons (Word, PDF) and a status line for the student's own work.
 * doneChecks: () => string[] — the revise checks the student ticked.
 */
export function workDownloads(doneChecks = () => []) {
  const fb = feedback();
  const button = (format, label, primary) => {
    const btn = h("button", { type: "button", class: `st-btn st-btn--sm${primary ? " st-btn--primary" : ""}` }, label);
    btn.addEventListener("click", async () => {
      const row = btn.parentElement;
      for (const b of row.querySelectorAll("button")) b.disabled = true;
      fb.set("Making your file…", "hint");
      try {
        fb.set(await download(format, doneChecks), "ok");
      } catch (err) {
        fb.set(err.message, "no");
      } finally {
        for (const b of row.querySelectorAll("button")) b.disabled = false;
      }
    });
    return btn;
  };
  return h(
    "div",
    { class: "wl-work-dl" },
    h(
      "div",
      { class: "wl-publish" },
      button("docx", "Download my writing (Word)", true),
      button("pdf", "Download my writing (PDF)"),
    ),
    fb,
  );
}
