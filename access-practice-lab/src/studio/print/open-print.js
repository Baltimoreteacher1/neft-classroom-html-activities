// "Print or save as PDF": opens a finished worksheet in a hidden iframe (or a new window when the iframe cannot
// print) and calls print(), so the teacher's own browser makes the PDF with "Save as PDF". No server involved.
//
//   const result = await openPrint(html, { lang: "es", onFallback: (message) => showToast(message) });
//   result -> { ok: boolean, method: "iframe" | "window" | "none", cleanup(): void }
//
// This file has no imports so it also runs as a plain script in tests.

export const PRINT_FALLBACK = Object.freeze({
  en: "Your browser blocked the print window. Allow pop-ups for this site, or download the Word file and print it from Word.",
  es: "Su navegador bloqueó la ventana de impresión. Permita las ventanas emergentes para este sitio, o descargue el archivo de Word e imprímalo desde Word.",
});

export const printFallbackMessage = (lang = "en") =>
  lang === "es"
    ? PRINT_FALLBACK.es
    : lang === "bi"
      ? `${PRINT_FALLBACK.en} / ${PRINT_FALLBACK.es}`
      : PRINT_FALLBACK.en;

const nextFrame = (win) => new Promise((resolve) => win.requestAnimationFrame(() => resolve()));

/** Wait until pictures and fonts in `doc` are ready, so the first page is not printed half-loaded. */
async function settle(doc, win) {
  const images = [...doc.images].filter((img) => !img.complete);
  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        }),
    ),
  );
  try {
    await doc.fonts?.ready;
  } catch {
    // fonts are cosmetic
  }
  await nextFrame(win);
}

const defaultPrint = (target) => target.print();

/**
 * @param {string} html a complete document from renderWorksheetHtml
 * @param {{ lang?: string, doc?: Document, win?: Window, print?: (w: Window) => void, onFallback?: (message: string) => void, timeoutMs?: number }} [options]
 */
export async function openPrint(html, options = {}) {
  const {
    lang = "en",
    doc = document,
    win = window,
    print = defaultPrint,
    onFallback,
    timeoutMs = 60000,
  } = options;
  const fail = (method = "none") => {
    onFallback?.(printFallbackMessage(lang));
    return { ok: false, method, cleanup() {} };
  };
  if (typeof html !== "string" || !html) return fail();

  // 1. hidden iframe: no popup blocker, and the page behind stays where it is
  let frame;
  try {
    frame = doc.createElement("iframe");
    frame.setAttribute("title", lang === "es" ? "Vista de impresión" : "Print preview");
    frame.setAttribute("tabindex", "-1");
    // not display:none (some browsers refuse to print a frame that has no layout)
    frame.style.cssText =
      "position:fixed;right:0;bottom:0;width:8.5in;height:11in;border:0;opacity:0;pointer-events:none;visibility:hidden";
    const loaded = new Promise((resolve) =>
      frame.addEventListener("load", resolve, { once: true }),
    );
    frame.srcdoc = html;
    doc.body.appendChild(frame);
    await Promise.race([loaded, new Promise((resolve) => win.setTimeout(resolve, 8000))]);
    const target = frame.contentWindow;
    if (!target?.document?.body?.children.length) throw new Error("empty frame");
    await settle(target.document, target);
    const cleanup = () => frame.remove();
    target.addEventListener?.("afterprint", () => win.setTimeout(cleanup, 200), { once: true });
    win.setTimeout(cleanup, timeoutMs);
    target.focus();
    print(target);
    return { ok: true, method: "iframe", cleanup };
  } catch {
    frame?.remove();
  }

  // 2. a new window, when the browser will not print from a frame
  try {
    const popup = win.open("", "_blank");
    if (!popup) return fail();
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    await settle(popup.document, popup);
    popup.focus();
    print(popup);
    return { ok: true, method: "window", cleanup: () => popup.close() };
  } catch {
    return fail("window");
  }
}
