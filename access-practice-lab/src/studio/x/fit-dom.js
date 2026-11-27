// The browser half of document fitting: measure a printed worksheet in a real layout engine.
//
//   inPageChecks()            runs INSIDE a printed document (page.evaluate in Playwright, or an iframe's window):
//                             height of the student sheet, clipped content, the smallest text, the body size.
//   measureHtml(html, {doc})  loads the document in a hidden frame and paginates it the way a printer does
//                             (columns one page tall) -> { pages, heightIn, clipped, stranded, minPt, bodyPt }.
//   pageDocument(html, n)     the same document showing only page n, for the scaled page previews.
//
// The frame count is a close preview; the print dialog's own count is the final word, and tools/studio-x-fit-e2e.mjs
// checks the two against real PDFs.

const PX = 96;

/** Runs in the page being measured. Must not close over anything: it is serialised into the browser. */
export function inPageChecks(doc = document) {
  const sheet = doc.querySelector(".sheet.student");
  if (!sheet) return { heightIn: 0, clipped: [], minPt: 0, bodyPt: 0 };
  const sr = sheet.getBoundingClientRect();
  const clipped = [];
  const note = (el, why) =>
    clipped.push(
      `${why}: ${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} "${(el.textContent || "").trim().slice(0, 30)}"`,
    );
  for (const el of sheet.querySelectorAll("*")) {
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    if (r.right > sr.right + 4 || r.left < sr.left - 4) note(el, "sticks out of the page");
  }
  for (const box of doc.querySelectorAll(".halfbox"))
    if (box.scrollHeight > box.clientHeight + 1) note(box, "runs past the half page");
  let minPt = 999;
  const walker = doc.createTreeWalker(sheet, 4);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim() || n.parentElement.closest("svg")) continue;
    minPt = Math.min(minPt, parseFloat(doc.defaultView.getComputedStyle(n.parentElement).fontSize) * 0.75);
  }
  const prompt = sheet.querySelector(".prompt") || sheet;
  return {
    heightIn: Number((sr.height / 96).toFixed(3)),
    clipped,
    minPt: Number(minPt.toFixed(2)),
    bodyPt: Number((parseFloat(doc.defaultView.getComputedStyle(prompt).fontSize) * 0.75).toFixed(2)),
  };
}

const marginOf = (html) => Number(/--fit-margin:([\d.]+)in/.exec(html)?.[1] ?? 0.75);

/** CSS that lays the student sheet out as a row of page-tall columns: one column per printed page. */
function pagerCss(html) {
  const m = marginOf(html);
  const w = 8.5 - 2 * m;
  const h = 11 - 2 * m;
  return `html,body{margin:0;background:#fff}.sheet{margin:0!important;padding:0!important;box-shadow:none!important}
.fit-pager{width:${w}in;height:${h}in;column-width:${w}in;column-gap:.5in;column-fill:auto}
.fit-pager>.sheet.student{width:${w}in}.fit-pager>.sheet.key{display:none}`;
}

/** The document with its student sheet wrapped in the pager; copies (half pages) are left as they are. */
function paged(html, clip = false) {
  if (html.includes('class="fit-halves"')) return html;
  const m = marginOf(html);
  const open = clip ? '<div class="fit-clip"><div class="fit-pager">' : '<div class="fit-pager">';
  const css = clip
    ? `body{padding:${m}in;width:8.5in;height:11in;overflow:hidden}.fit-clip{width:${8.5 - 2 * m}in;height:${11 - 2 * m}in;overflow:hidden}`
    : "";
  return html
    .replace("</style>", `${pagerCss(html)}${css}\n</style>`)
    .replace("<main>", `<main>${open}`)
    .replace(/<\/main>/, `</div>${clip ? "</div>" : ""}</main>`);
}

/** The document showing only page `index` (0-based) at its real size: put it in a clipped, scaled frame. */
export function pageDocument(html, index = 0) {
  const m = marginOf(html);
  const shift = index * (8.5 - 2 * m + 0.5);
  const css = `.fit-pager{transform:translateX(-${shift}in)}`;
  const doc = paged(html, true);
  return html.includes('class="fit-halves"') ? doc : doc.replace("</style>", `${css}\n</style>`);
}

function checksInPager(doc) {
  const pager = doc.querySelector(".fit-pager");
  const sheet = doc.querySelector(".sheet.student");
  const out = { pages: 1, stranded: [] };
  if (!pager || !sheet) return out;
  const pr = pager.getBoundingClientRect();
  const pitch = pr.width + 0.5 * 96;
  const col = (el) =>
    Math.max(0, Math.floor((el.getBoundingClientRect().left - pr.left + 2) / pitch));
  let last = 0;
  for (const el of sheet.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width) last = Math.max(last, Math.floor((r.right - pr.left - 2) / pitch));
  }
  out.pages = last + 1;
  for (const h of sheet.querySelectorAll("h1,h2,h3")) {
    let next = h.nextElementSibling || h.parentElement?.nextElementSibling;
    while (next && !next.getBoundingClientRect().height) next = next.nextElementSibling;
    if (next && col(next) > col(h)) out.stranded.push((h.textContent || "").trim().slice(0, 40));
  }
  return out;
}

/** Load `html` in a hidden frame of `doc` and measure it. Resolves { pages, heightIn, clipped, stranded, minPt, bodyPt }. */
export async function measureHtml(html, { doc = document } = {}) {
  const frame = doc.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText =
    "position:fixed;left:-9999px;top:0;width:8.5in;height:11in;border:0;visibility:hidden";
  const loaded = new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }));
  frame.srcdoc = paged(html);
  doc.body.append(frame);
  try {
    await Promise.race([loaded, new Promise((r) => setTimeout(r, 8000))]);
    const win = frame.contentWindow;
    await win.document.fonts?.ready;
    await Promise.all(
      [...win.document.images]
        .filter((i) => !i.complete)
        .map(
          (i) =>
            new Promise((r) => {
              i.onload = i.onerror = r;
            }),
        ),
    );
    const base = inPageChecks(win.document);
    const pager = html.includes('class="fit-halves"')
      ? { pages: 1, stranded: [] }
      : checksInPager(win.document);
    return { ...base, ...pager };
  } finally {
    frame.remove();
  }
}

export const PAGE_PX = { width: 8.5 * PX, height: 11 * PX };
