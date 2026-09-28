/* One editable Word file and one print-ready PDF for every authored lesson sheet.
 * Links are added next to the existing worksheet, including small-group and
 * Apply Day pathways. The files are generated from worksheet.html by
 * scripts/generate-practice-workbooks.mjs.
 */
(function () {
  "use strict";
  const selector = '.lesson .res-row a[href^="/lessons/"]';
  function addLinks(scope) {
    for (const worksheet of scope.querySelectorAll(selector)) {
      const match = /^\/lessons\/([a-z0-9-]+)\/(?:worksheet\.html)?$/.exec(
        worksheet.getAttribute("href"),
      );
      if (!match) continue;
      const row = worksheet.closest(".res-row");
      if (!row) continue;
      const id = match[1];
      if (!/^\d+-\d+(?:-(?:group[12]|part[23]|catchup|flagship))?$/.test(id)) continue;
      if (row.querySelector(`[data-practice-workbook-id="${id}"]`)) continue;
      let previous = worksheet;
      for (const [extension, label] of [
        ["docx", "Practice DOCX"],
        ["pdf", "Practice PDF"],
      ]) {
        const link = document.createElement("a");
        link.className = "res practice-workbook-link";
        link.href = `/lessons/${id}/downloads/${id}-practice-workbook.${extension}`;
        link.download = "";
        link.textContent = label;
        link.setAttribute("aria-label", `Download Lesson ${id} ${label}`);
        link.dataset.practiceWorkbook = extension;
        link.dataset.practiceWorkbookId = id;
        previous.insertAdjacentElement("afterend", link);
        previous = link;
      }
    }
  }
  function init() {
    addLinks(document);
    const dynamic = document.getElementById("interactive-hub");
    if (dynamic)
      new MutationObserver(() => addLinks(dynamic)).observe(dynamic, {
        childList: true,
        subtree: true,
      });
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
