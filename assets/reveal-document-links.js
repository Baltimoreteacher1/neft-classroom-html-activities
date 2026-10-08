/* Original Reveal files beside the lesson desk's practice links. */
(function () {
  "use strict";
  /** @typedef {{targetLesson: string|null, unit: number|null, teacherOnly: boolean, url: string, filename: string, title: string, category: string}} RevealDocument */
  const preview = document.getElementById("nav-preview");
  /** @type {RevealDocument[]} */
  let documents = [];
  /** @type {Map<string, RevealDocument>} */
  let byUrl = new Map();
  let failed = false;
  function append() {
    if (!preview) return;
    const lessonLink = /** @type {HTMLAnchorElement} */ (
      preview.querySelector('a[href*="/curriculum/student-launch/?lesson="]')
    );
    if (!lessonLink || preview.querySelector("[data-reveal-documents]")) return;
    const id = new URL(lessonLink.href).searchParams.get("lesson");
    if (!id || !/^\d+-\d+$/.test(id)) return;
    const unit = Number(id.split("-")[0]);
    const docs = documents.filter(
      (doc) =>
        doc.targetLesson === id || (!doc.targetLesson && (doc.unit === unit || doc.unit === null)),
    );
    if (!docs.length && !failed) return;
    const group = document.createElement("section");
    group.className = "cn-resource-group reveal-document-downloads";
    group.dataset.revealDocuments = id;
    const heading = document.createElement("h4");
    heading.className = "cn-group-title";
    heading.textContent = "Reveal documents · Word & PDF";
    group.appendChild(heading);
    if (failed) {
      const fallback = document.createElement("a");
      fallback.href = "/curriculum/units/";
      fallback.textContent = "Browse the lesson’s original documents in the unit directory";
      group.appendChild(fallback);
    } else {
      for (const [teacher, label, language] of [
        [false, "Language support · Word & PDF", true],
        [false, "Practice, warm-ups & homework", false],
        [true, "Teacher keys & guides", false],
      ]) {
        const selection = docs.filter(
          (doc) =>
            doc.teacherOnly === teacher && (doc.category === "language-support") === language,
        );
        if (!selection.length) continue;
        const details = document.createElement("details");
        if (teacher) details.className = "hub-teacher-only";
        const summary = document.createElement("summary");
        summary.textContent = `${label} (${selection.length})`;
        details.appendChild(summary);
        const list = document.createElement("ul");
        list.className = "cn-resources";
        for (const doc of selection) {
          // Only the importer’s original, same-site Word/PDF paths are usable.
          if (
            !/^\/(?:lessons\/\d+-\d+\/downloads\/reveal\/|curriculum\/reveal-documents\/)[a-z0-9/.-]+\.(?:docx|pdf)$/.test(
              doc.url,
            )
          )
            continue;
          const item = document.createElement("li");
          const link = document.createElement("a");
          link.href = doc.url;
          link.download = doc.filename;
          link.textContent = `${doc.title} · ${doc.filename.toLowerCase().endsWith(".docx") ? "Word" : "PDF"}`;
          link.setAttribute("aria-label", `Download ${link.textContent}`);
          item.appendChild(link);
          list.appendChild(item);
        }
        details.appendChild(list);
        group.appendChild(details);
      }
    }
    const practice = Array.from(preview.querySelectorAll(".cn-resource-group")).find(
      (section) => section.querySelector("h4")?.textContent === "Learn & practice",
    );
    if (practice) practice.after(group);
    else preview.appendChild(group);
  }
  // The hub rebuilds rows, launch buttons, and its modal from scraped links.
  // Preserve downloads there too, including when a reused button changes href.
  /** @param {HTMLAnchorElement} link */
  function preserveDownload(link) {
    const doc = byUrl.get(link.getAttribute("href") || "");
    if (!doc) {
      if (link.hasAttribute("data-reveal-download-target")) {
        const target = link.getAttribute("data-reveal-download-target");
        link.removeAttribute("download");
        if (target) link.setAttribute("target", target);
        link.removeAttribute("data-reveal-download-target");
      }
      return;
    }
    if (!link.hasAttribute("data-reveal-download-target"))
      link.setAttribute("data-reveal-download-target", link.getAttribute("target") || "");
    link.setAttribute("download", doc.filename);
    link.removeAttribute("target");
  }
  new MutationObserver((records) => {
    append();
    for (const record of records) {
      if (record.type === "attributes" && record.target instanceof HTMLAnchorElement)
        preserveDownload(record.target);
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node instanceof HTMLAnchorElement) preserveDownload(node);
        node.querySelectorAll("a[href]").forEach((link) => {
          if (link instanceof HTMLAnchorElement) preserveDownload(link);
        });
      }
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
  });
  fetch("/data/reveal-document-downloads.json?v=language-support-20261008", {
    credentials: "same-origin",
  })
    .then((response) => {
      if (!response.ok) throw new Error("Reveal downloads unavailable");
      return response.json();
    })
    .then((manifest) => {
      if (!Array.isArray(manifest.documents)) throw new Error("Invalid Reveal downloads");
      documents = manifest.documents;
      byUrl = new Map(documents.map((doc) => [doc.url, doc]));
      append();
      document.querySelectorAll("a[href]").forEach((link) => {
        if (link instanceof HTMLAnchorElement) preserveDownload(link);
      });
    })
    .catch(() => {
      failed = true;
      append();
    });
})();
