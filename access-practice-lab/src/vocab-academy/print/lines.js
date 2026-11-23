// Vocabulary Academy print: line numbers for grades 6-8 passages. CSS cannot count wrapped lines, so after layout we
// count them from the rendered height and place a number beside every fifth line. Browser only (needs layout).
// The same function runs in the app (view mount, and again on beforeprint) and in the PDF generator, at the same
// 7-inch text width, so the numbers sit where the lines are.

/** Idempotent: removes earlier numbers, then adds a number gutter entry for every `every`th line of the passage. */
export function numberPassageLines(root, every = 5) {
  for (const passage of root.querySelectorAll('.vap-passage[data-numbering="line"]')) {
    passage.querySelectorAll(".vap-ln").forEach((n) => n.remove());
    let count = 0;
    for (const para of passage.querySelectorAll(".vap-passage-text > p")) {
      const style = getComputedStyle(para);
      const lh = Number.parseFloat(style.lineHeight);
      if (!lh) continue;
      const inner =
        para.getBoundingClientRect().height -
        Number.parseFloat(style.paddingTop) -
        Number.parseFloat(style.paddingBottom);
      const lines = Math.max(1, Math.round(inner / lh));
      for (let k = 1; k <= lines; k++) {
        count++;
        if (count % every !== 0) continue;
        const mark = document.createElement("span");
        mark.className = "vap-ln";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = String(count);
        mark.style.top = `${Number.parseFloat(style.paddingTop) + (k - 1) * lh}px`;
        para.append(mark);
      }
    }
  }
}

/**
 * A sheet is designed to be one page. Two things keep a few stray lines from printing alone on an almost empty page:
 *  1. a sheet that runs over the 9.5in text height by a little is shrunk slightly to fit (never below `minZoom`, so type
 *     stays readable; sheets with line-numbered passages are skipped because their numbers are measured against the
 *     unscaled line height);
 *  2. when a sheet's last page is mostly empty (a short tail), the NEXT sheet starts right under it instead of on a new
 *     page.
 * Idempotent. Browser only (needs layout).
 */
export function fitSheets(root, { pageIn = 9.5, maxOver = 0.2, minZoom = 0.94, maxTail = 0.28 } = {}) {
  const sheets = [...root.querySelectorAll(".vap-sheet")];
  const avail = pageIn * 96 - 6;
  for (const sheet of sheets) {
    sheet.style.zoom = "";
    sheet.style.breakBefore = "";
    sheet.style.marginTop = "";
    if (sheet.querySelector('.vap-passage[data-numbering="line"]')) continue;
    const style = getComputedStyle(sheet);
    const pad = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const height = sheet.scrollHeight - pad;
    if (height > avail && height / avail <= 1 + maxOver)
      sheet.style.zoom = String(Math.max(minZoom, (avail / height) * 0.985));
  }
  let used = 0; // content already on the page the current sheet starts on
  sheets.forEach((sheet, i) => {
    const style = getComputedStyle(sheet);
    const pad = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const height = sheet.getBoundingClientRect().height - pad;
    const gap = 0.3 * 96;
    if (i > 0 && used > 0 && used / avail <= maxTail && height > avail * 0.5) {
      sheet.style.breakBefore = "auto";
      sheet.style.marginTop = `${gap}px`;
      used += gap + height;
    } else used = height;
    used = used % avail;
    if (used < 24) used = 0;
  });
}
