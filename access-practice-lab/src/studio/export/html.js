// The standalone HTML export: ONE self-contained document (inline CSS, the inline player bundle, the activity as
// JSON) that works opened from file://, makes no requests, and carries no teacher-only data.

import { studentCopyFor } from "../core/student-copy.js";

/**
 * The activity as students may see it: no teacher notes, no note blocks, no teacher-only source note, and for a
 * worksheet no answers anywhere (the same `studentCopyFor` the server publishes, one source of truth).
 */
export function studentCopy(activity) {
  const { notes: _teacherOnly, ...rest } = studentCopyFor(structuredClone(activity));
  return { ...rest, context: { ...rest.context, source: { ...rest.context.source, note: "" } } };
}

/** A safe file name for the exported page: lowercase ASCII words from the title. */
export function exportFilename(activity) {
  const slug = String(activity?.title ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return `${slug || "activity"}.html`;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** JSON that is safe inside a <script> element: no "<", ">", "&", U+2028 or U+2029 survive literally. */
const safeJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

const inlineScript = (js) => String(js).replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");
const inlineStyle = (css) => String(css).replace(/<\/(style)/gi, "<\\/$1");

/** A standalone page has no site to load images from: keep data: images, drop same-site paths. */
function selfContained(activity) {
  const keep = (img) => (img && !String(img.src).startsWith("data:") ? { ...img, src: "" } : img);
  return {
    ...activity,
    blocks: activity.blocks.map((b) => {
      if (b.type === "image") return keep(b);
      if (b.type === "question") return { ...b, image: b.image ? keep(b.image) : b.image };
      if (b.type === "vocab")
        return { ...b, items: b.items.map((v) => ({ ...v, image: v.image ? keep(v.image) : v.image })) };
      return b;
    }),
  };
}

export const CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: ; media-src data:";

const BOOT = `(function () {
  var data = JSON.parse(document.getElementById("studio-activity").textContent);
  StudioPlayer.mountPlayer(document.getElementById("app"), data, { lang: __LANG__ });
})();`;

// Only emitted for preview exports: the editor shows the page in a sandboxed iframe and talks to it by message.
const PREVIEW_BOOT = `(function () {
  var data = JSON.parse(document.getElementById("studio-activity").textContent);
  var player = StudioPlayer.mountPlayer(document.getElementById("app"), data, {
    lang: __LANG__,
    preview: true,
    editMode: true,
    onSelect: function (id) { parent.postMessage({ studio: "select", id: id }, "*"); }
  });
  addEventListener("message", function (e) {
    var m = e.data;
    if (e.source !== parent || !m || typeof m !== "object") return;
    if (m.studio === "goto" && typeof m.id === "string") player.goto(m.id);
    else if (m.studio === "mode") player.setEditMode(Boolean(m.edit));
  });
  parent.postMessage({ studio: "ready" }, "*");
  if (typeof ResizeObserver === "function") {
    var last = 0;
    new ResizeObserver(function () {
      var h = document.documentElement.scrollHeight;
      if (h !== last) { last = h; parent.postMessage({ studio: "height", h: h }, "*"); }
    }).observe(document.documentElement);
  }
})();`;

/**
 * @param {object} activity any activity (it is normalized and stripped of teacher-only data here)
 * @param {{js: string, css: string, lang?: "en"|"es"|"bi", preview?: boolean}} opts the built player bundle and styles
 * @returns {string} one complete HTML document
 */
export function exportActivityHtml(activity, { js, css, lang = "bi", preview = false } = {}) {
  if (!js || !css) throw new Error("exportActivityHtml needs the built player js and css");
  const a = selfContained(studentCopy(activity));
  const ui = ["en", "es", "bi"].includes(lang) ? lang : "bi";
  const boot = (preview ? PREVIEW_BOOT : BOOT).replace("__LANG__", JSON.stringify(ui));
  return `<!doctype html>
<html lang="${ui === "es" ? "es" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<title>${escapeHtml(a.title)}</title>
<style>
html,body{margin:0}
${inlineStyle(css)}
</style>
</head>
<body>
<main id="app"></main>
<noscript><p style="padding:16px;font:16px/1.5 system-ui,sans-serif">This activity needs JavaScript. Please turn it on and reload the page.</p></noscript>
<script type="application/json" id="studio-activity">${safeJson(a)}</script>
<script>
${inlineScript(js)}
</script>
<script>
${boot}
</script>
</body>
</html>
`;
}
