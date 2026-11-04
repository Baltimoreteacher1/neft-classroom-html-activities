/* Original Reveal files beside the lesson desk's practice links.
 *
 * The manifest is large (2,406 documents, ~1.2 MB decoded) and nothing on the
 * hub needs it until a Reveal link exists or the lesson desk is about to build
 * its documents group, so it is fetched THEN, not at boot. "Then" means the
 * moment either happens: a same-site Reveal link appears (or already exists),
 * or #nav-preview shows a lesson. A click that lands before the manifest does
 * is held and replayed as a real download once it arrives, so a link never
 * behaves differently for having been clicked early. */
(function () {
  "use strict";
  /** @typedef {{sourceLesson: string|null, targetLesson: string|null, unit: number|null, teacherOnly: boolean, url: string, filename: string, title: string, category: string}} RevealDocument */
  const preview = document.getElementById("nav-preview");
  /** @type {RevealDocument[]} */
  let documents = [];
  /** @type {Map<string, RevealDocument>} */
  let byUrl = new Map();
  let failed = false;
  let loaded = false;
  /** @type {Promise<void>|null} */
  let request = null;
  // Same shape the importer writes and append() enforces: only these paths are
  // ever given a download attribute, so only these paths ever need the manifest.
  const DOCUMENT_PATH =
    /^\/(?:lessons\/\d+-\d+\/downloads\/reveal\/|curriculum\/reveal-documents\/)[a-z0-9/.-]+\.(?:docx|pdf|pptx)$/;
  /** @param {Element} link */
  const isDocumentLink = (link) => DOCUMENT_PATH.test(link.getAttribute("href") || "");
  function load() {
    if (request) return request;
    request = fetch("/data/reveal-document-downloads.json?v=language-support-20261008", {
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
        loaded = true;
        append();
        document.querySelectorAll("a[href]").forEach((link) => {
          if (link instanceof HTMLAnchorElement) preserveDownload(link);
        });
      })
      .catch(() => {
        failed = true;
        append();
      });
    return request;
  }
  function append() {
    if (!preview) return;
    const lessonLink = /** @type {HTMLAnchorElement} */ (
      preview.querySelector('a[href*="/curriculum/student-launch/?lesson="]')
    );
    if (!lessonLink || preview.querySelector("[data-reveal-documents]")) return;
    const id = new URL(lessonLink.href).searchParams.get("lesson");
    if (!id || !/^\d+-\d+$/.test(id)) return;
    if (!loaded && !failed) {
      load();
      return;
    }
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
      const sourceNumbers = [
        ...new Set(
          docs
            .filter((doc) => doc.targetLesson === id && doc.sourceLesson && doc.sourceLesson !== id)
            .map((doc) => doc.sourceLesson),
        ),
      ];
      if (sourceNumbers.length) {
        const note = document.createElement("p");
        note.className = "reveal-source-mapping";
        note.textContent = `Source numbering: Reveal Lesson ${sourceNumbers.join(", ")} provides supplemental material for site Lesson ${id}. Original source numbers are retained in the files.`;
        group.appendChild(note);
      }
      for (const [teacher, label, category] of [
        [false, "Language support · Word & PDF", "language-support"],
        [false, "Prerequisite practice · Word & PDF", "prerequisite"],
        [false, "Practice, warm-ups & homework", null],
        [true, "Teacher keys & guides", null],
      ]) {
        const own = ["language-support", "prerequisite"];
        const selection = docs.filter(
          (doc) =>
            doc.teacherOnly === teacher &&
            (category ? doc.category === category : !own.includes(doc.category)),
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
            !/^\/(?:lessons\/\d+-\d+\/downloads\/reveal\/|curriculum\/reveal-documents\/)[a-z0-9/.-]+\.(?:docx|pdf|pptx)$/.test(
              doc.url,
            )
          )
            continue;
          const item = document.createElement("li");
          const link = document.createElement("a");
          link.href = doc.url;
          link.download = doc.filename;
          const format = doc.filename.toLowerCase().endsWith(".pptx")
            ? "PowerPoint"
            : doc.filename.toLowerCase().endsWith(".docx")
              ? "Word"
              : "PDF";
          link.textContent = `${doc.title} · ${format}`;
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
      if (record.type === "attributes" && record.target instanceof HTMLAnchorElement) {
        if (!loaded && isDocumentLink(record.target)) load();
        preserveDownload(record.target);
      }
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node instanceof HTMLAnchorElement) {
          if (!loaded && isDocumentLink(node)) load();
          preserveDownload(node);
        }
        node.querySelectorAll("a[href]").forEach((link) => {
          if (!(link instanceof HTMLAnchorElement)) return;
          if (!loaded && isDocumentLink(link)) load();
          preserveDownload(link);
        });
      }
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
  });
  // Links already on the page when this script runs.
  document.querySelectorAll("a[href]").forEach((link) => {
    if (!loaded && isDocumentLink(link)) load();
  });
  // A click that beats the manifest is held, then replayed from a detached
  // anchor so it downloads with the right filename and does not fire the page's
  // own click listeners a second time.
  document.addEventListener("click", (event) => {
    if (loaded || failed || event.defaultPrevented || event.button !== 0) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link =
      event.target instanceof Element ? event.target.closest("a[href][href^='/']") : null;
    if (!(link instanceof HTMLAnchorElement) || !isDocumentLink(link)) return;
    event.preventDefault();
    const href = link.getAttribute("href") || "";
    const target = link.getAttribute("target") || "";
    load().then(() => {
      const replay = document.createElement("a");
      replay.href = href;
      const doc = byUrl.get(href);
      if (doc) replay.download = doc.filename;
      else if (target) replay.target = target;
      replay.click();
    });
  });
})();
