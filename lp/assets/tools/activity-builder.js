// Activity Builder: stack blocks into one interactive page, preview at phone/tablet/desktop width, check
// accessibility, then export one offline .html file, an embed snippet (iframe srcdoc) or a print version.
import { $, $$, copyText, download, escapeHtml, loadDraft, printOnly, saveDraft, store, toast } from "../lib.js";

const TYPES = {
  passage: "Reading passage",
  audio: "Audio prompt (read aloud)",
  mc: "Multiple choice",
  order: "Drag to order",
  cloze: "Cloze (fill the blanks)",
  short: "Short response",
  frames: "Sentence-frame response",
  image: "Image with labels",
  rubric: "Self-check rubric",
};
const NEW = {
  passage: () => ({ type: "passage", title: "", text: "" }),
  audio: () => ({ type: "audio", prompt: "Listen to the directions.", text: "" }),
  mc: () => ({ type: "mc", question: "", choices: ["", "", ""], correct: 0, feedback: "" }),
  order: () => ({ type: "order", prompt: "Put the steps in order.", items: ["", "", ""] }),
  cloze: () => ({ type: "cloze", prompt: "Fill in the blanks.", text: "", bank: true }),
  short: () => ({ type: "short", prompt: "", lines: 4 }),
  frames: () => ({ type: "frames", prompt: "", frames: ["I think ___ because ___."] }),
  image: () => ({ type: "image", prompt: "", src: "", alt: "", labels: [] }),
  rubric: () => ({ type: "rubric", title: "Check yourself", criteria: ["I answered every question.", "I used a sentence starter."] }),
};
const EXAMPLE = {
  title: "Why do some ice cubes melt faster?",
  accent: "#17324d",
  blocks: [
    { type: "passage", title: "The ice cube race", text: "Lina and Omar put two ice cubes on two plates. One plate was in the sun. The other plate was in the shade.\n\nAfter ten minutes, the ice cube in the sun was almost gone. The ice cube in the shade was still big. Heat from the sun made the first ice cube melt faster." },
    { type: "mc", question: "Which ice cube melted faster?", choices: ["The one in the shade", "The one in the sun", "They melted at the same time"], correct: 1, feedback: "Heat from the sun melted it faster." },
    { type: "order", prompt: "Put what happened in order.", items: ["They put ice cubes on two plates.", "One plate went in the sun.", "They waited ten minutes.", "They compared the ice cubes."] },
    { type: "cloze", prompt: "Fill in the blanks.", text: "The ice cube in the [sun] melted faster because of the [heat].", bank: true },
    { type: "frames", prompt: "Explain why one ice cube melted faster.", frames: ["The ice cube in the sun ___ because ___.", "Heat makes ice ___.", "This shows that ___."] },
    { type: "rubric", title: "Check yourself", criteria: ["I said which ice cube melted faster.", "I used the word because.", "I used a science word: heat, melt or temperature."] },
  ],
};

let state = structuredClone(EXAMPLE);
const blocksEl = $("[data-ab-blocks]");
const preview = $("[data-ab-preview]");
const a11yEl = $("[data-ab-a11y]");

/* ---------- load runtime ---------- */
let ready = null;
function runtime() {
  ready ||= new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/lp/assets/activity/activity.css";
    document.head.append(css);
    const s = document.createElement("script");
    s.src = "/lp/assets/activity/runtime.js";
    s.onload = () => resolve(window.LPActivity);
    s.onerror = reject;
    document.head.append(s);
  });
  return ready;
}

/* ---------- editor ---------- */
const lines = (v) => (Array.isArray(v) ? v.join("\n") : v || "");
function field(i, key, label, value, kind = "text", hint = "") {
  const id = `ab-${i}-${key}`;
  const input =
    kind === "textarea"
      ? `<textarea id="${id}" data-key="${key}" rows="4">${escapeHtml(value)}</textarea>`
      : `<input type="${kind}" id="${id}" data-key="${key}" value="${escapeHtml(value)}"${kind === "number" ? ' min="1" max="12"' : ""}>`;
  return `<div class="field"><label for="${id}">${label}</label>${hint ? `<span class="hint">${hint}</span>` : ""}${input}</div>`;
}
function blockForm(b, i) {
  switch (b.type) {
    case "passage":
      return field(i, "title", "Title", b.title) + field(i, "text", "Text (blank line = new paragraph)", b.text, "textarea");
    case "audio":
      return field(i, "prompt", "What students see", b.prompt) + field(i, "text", "What the device voice reads (also shown as the transcript)", b.text, "textarea");
    case "mc": {
      const opts = b.choices.map((c, k) => `<option value="${k}"${Number(b.correct) === k ? " selected" : ""}>${k + 1}. ${escapeHtml(c || "(empty)")}</option>`).join("");
      return `${field(i, "question", "Question", b.question)}${field(i, "choices", "Choices (one per line)", lines(b.choices), "textarea")}<div class="field"><label for="ab-${i}-correct">Correct choice</label><select id="ab-${i}-correct" data-key="correct">${opts}</select></div>${field(i, "feedback", "Feedback when right (optional)", b.feedback)}`;
    }
    case "order":
      return field(i, "prompt", "Directions", b.prompt) + field(i, "items", "Items in the CORRECT order (one per line); students see them shuffled", lines(b.items), "textarea");
    case "cloze":
      return `${field(i, "prompt", "Directions", b.prompt)}${field(i, "text", "Text with [answers] in square brackets", b.text, "textarea")}<label class="check"><input type="checkbox" data-key="bank"${b.bank !== false ? " checked" : ""}><span>Show a word bank</span></label>`;
    case "short":
      return field(i, "prompt", "Question or prompt", b.prompt) + field(i, "lines", "Answer box height (lines)", b.lines, "number");
    case "frames":
      return field(i, "prompt", "Prompt", b.prompt) + field(i, "frames", "Sentence frames (one per line, use ___ for blanks)", lines(b.frames), "textarea");
    case "image":
      return `${field(i, "prompt", "Directions (optional)", b.prompt)}<div class="field"><label for="ab-${i}-file">Image</label><input type="file" id="ab-${i}-file" accept="image/*" data-image></div>${field(i, "alt", "Alt text: what the image shows, for screen readers", b.alt)}${
        b.src
          ? `<p class="hint">Click the image to add a numbered label.</p><div class="ab-pick" data-pick><img src="${b.src}" alt=""></div>${b.labels.map((l, k) => `<div class="field"><label for="ab-${i}-l${k}">Label ${k + 1}</label><div class="btn-row"><input type="text" id="ab-${i}-l${k}" data-label="${k}" value="${escapeHtml(l.text)}"><button type="button" class="btn small ghost" data-label-del="${k}">Remove</button></div></div>`).join("")}`
          : ""
      }`;
    case "rubric":
      return field(i, "title", "Title", b.title) + field(i, "criteria", "Criteria (one per line, start with I)", lines(b.criteria), "textarea");
  }
  return "";
}
function renderEditor() {
  blocksEl.innerHTML = state.blocks
    .map(
      (b, i) => `<li class="panel ab-block" data-i="${i}"><fieldset><legend>Part ${i + 1}: ${TYPES[b.type]}</legend>${blockForm(b, i)}
    <div class="btn-row"><button type="button" class="btn small ghost" data-move="-1"${i === 0 ? " disabled" : ""}>Move up</button><button type="button" class="btn small ghost" data-move="1"${i === state.blocks.length - 1 ? " disabled" : ""}>Move down</button><button type="button" class="btn small secondary" data-del>Delete</button></div></fieldset></li>`,
    )
    .join("");
  $("#ab-title").value = state.title;
  $("#ab-accent").value = state.accent;
  paintSwatches();
}
blocksEl.addEventListener("input", (e) => {
  const li = e.target.closest("[data-i]");
  if (!li) return;
  const b = state.blocks[Number(li.dataset.i)];
  const key = e.target.dataset.key;
  if (e.target.dataset.label != null) b.labels[Number(e.target.dataset.label)].text = e.target.value;
  else if (key === "bank") b.bank = e.target.checked;
  else if (["choices", "items", "frames", "criteria"].includes(key)) b[key] = e.target.value.split("\n");
  else if (key === "lines") b.lines = Math.max(1, Math.min(12, Number(e.target.value) || 4));
  else if (key) b[key] = e.target.value;
  if (key === "choices") {
    const sel = li.querySelector('[data-key="correct"]');
    const cur = Number(b.correct);
    sel.innerHTML = b.choices.map((c, k) => `<option value="${k}"${cur === k ? " selected" : ""}>${k + 1}. ${escapeHtml(c || "(empty)")}</option>`).join("");
  }
  changed();
});
blocksEl.addEventListener("change", async (e) => {
  const li = e.target.closest("[data-i]");
  if (!li) return;
  const b = state.blocks[Number(li.dataset.i)];
  if (e.target.dataset.key === "correct") b.correct = Number(e.target.value);
  if (e.target.matches("[data-image]") && e.target.files?.[0]) {
    b.src = await shrink(e.target.files[0]);
    b.labels = [];
    renderEditor();
  }
  changed();
});
blocksEl.addEventListener("click", (e) => {
  const li = e.target.closest("[data-i]");
  if (!li) return;
  const i = Number(li.dataset.i);
  const b = state.blocks[i];
  if (e.target.closest("[data-del]")) {
    state.blocks.splice(i, 1);
    renderEditor();
    changed();
    return;
  }
  const mv = e.target.closest("[data-move]");
  if (mv) {
    const j = i + Number(mv.dataset.move);
    [state.blocks[i], state.blocks[j]] = [state.blocks[j], state.blocks[i]];
    renderEditor();
    changed();
    blocksEl.querySelector(`[data-i="${j}"] [data-move="${mv.dataset.move}"]`)?.focus();
    return;
  }
  const del = e.target.closest("[data-label-del]");
  if (del) {
    b.labels.splice(Number(del.dataset.labelDel), 1);
    renderEditor();
    changed();
    return;
  }
  const pick = e.target.closest("[data-pick] img");
  if (pick) {
    const r = pick.getBoundingClientRect();
    b.labels.push({ x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 10, text: "" });
    renderEditor();
    changed();
    blocksEl.querySelector(`[data-i="${i}"] [data-label="${b.labels.length - 1}"]`)?.focus();
  }
});
/* Images are shrunk on the device (max 900px wide, JPEG) so exports stay small. */
function shrink(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 900 / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
}
$("[data-ab-add]").addEventListener("click", () => {
  state.blocks.push(NEW[$("#ab-add").value]());
  renderEditor();
  changed();
  blocksEl.lastElementChild?.querySelector("input, textarea")?.focus();
});
$("#ab-title").addEventListener("input", (e) => {
  state.title = e.target.value;
  changed();
});
function paintSwatches() {
  for (const b of document.querySelectorAll("[data-swatch]")) b.setAttribute("aria-pressed", String(b.dataset.swatch.toLowerCase() === String(state.accent).toLowerCase()));
}
$("#ab-accent").addEventListener("input", (e) => {
  state.accent = e.target.value.trim();
  paintSwatches();
  changed();
});
for (const b of document.querySelectorAll("[data-swatch]")) {
  b.style.background = b.dataset.swatch; // CSSOM, not an inline style attribute: the page CSP is style-src 'self'
  b.addEventListener("click", () => {
    state.accent = b.dataset.swatch;
    $("#ab-accent").value = state.accent;
    paintSwatches();
    changed();
  });
}
$("[data-ab-example]").addEventListener("click", () => {
  state = structuredClone(EXAMPLE);
  renderEditor();
  changed();
});
$("[data-ab-reset]").addEventListener("click", () => {
  state = { title: "", accent: "#17324d", blocks: [] };
  renderEditor();
  changed();
});

/* ---------- accessibility check ---------- */
function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return null;
  const c = [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function check(s) {
  const issues = [];
  if (!s.title.trim()) issues.push("The activity needs a title.");
  const L = luminance(s.accent);
  if (L == null) issues.push("The accent color must be a hex color like #17324d.");
  else {
    const ratio = 1.05 / (L + 0.05);
    if (ratio < 4.5) issues.push(`White text on the accent color has a contrast of ${ratio.toFixed(2)}:1. Choose a darker color (4.5:1 or more).`);
  }
  if (!s.blocks.length) issues.push("Add at least one block.");
  s.blocks.forEach((b, i) => {
    const p = `Part ${i + 1} (${TYPES[b.type]})`;
    if (b.type === "image" && b.src && !b.alt.trim()) issues.push(`${p}: add alt text that says what the image shows.`);
    if (b.type === "image" && !b.src) issues.push(`${p}: add an image or delete the block.`);
    if (b.type === "image" && b.labels.some((l) => !l.text.trim())) issues.push(`${p}: every numbered label needs text.`);
    if (b.type === "mc") {
      const filled = b.choices.filter((c) => c.trim());
      if (!b.question.trim()) issues.push(`${p}: the question is empty.`);
      if (filled.length < 2) issues.push(`${p}: add at least two choices.`);
      if (!b.choices[Number(b.correct)]?.trim()) issues.push(`${p}: the correct choice is empty.`);
    }
    if (b.type === "order" && b.items.filter((x) => x.trim()).length < 2) issues.push(`${p}: add at least two items.`);
    if (b.type === "cloze" && !/\[[^\]]+\]/.test(b.text)) issues.push(`${p}: mark at least one [answer] in square brackets.`);
    if ((b.type === "short" || b.type === "frames") && !b.prompt.trim()) issues.push(`${p}: the prompt is empty, so the answer box has no label.`);
    if (b.type === "passage" && !b.text.trim()) issues.push(`${p}: the passage is empty.`);
    if (b.type === "audio" && !b.text.trim()) issues.push(`${p}: add the words the device voice will read.`);
  });
  return issues;
}

/* ---------- preview + export ---------- */
let t;
function changed() {
  clearTimeout(t);
  t = setTimeout(async () => {
    const LP = await runtime();
    LP.mount(preview, state);
    const issues = check(state);
    a11yEl.innerHTML = issues.length ? issues.map((x) => `<li>${escapeHtml(x)}</li>`).join("") : "<li>No problems found. Every image has alt text, every answer box has a label and the colors pass AA contrast.</li>";
    saveDraft("activity-builder", state);
  }, 200);
}
for (const b of $$("[data-width]")) {
  b.addEventListener("click", () => {
    for (const x of $$("[data-width]")) x.setAttribute("aria-pressed", String(x === b));
    preview.classList.remove("phone", "tablet");
    if (b.dataset.width !== "desktop") preview.classList.add(b.dataset.width);
  });
}
async function exportHtml() {
  const [js, css] = await Promise.all([fetch("/lp/assets/activity/runtime.js").then((r) => r.text()), fetch("/lp/assets/activity/activity.css").then((r) => r.text())]);
  const data = JSON.stringify(state).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(state.title || "Activity")}</title>
<style>
${css}
html,body{margin:0;background:#f7f4ec}footer{max-width:48rem;margin:0 auto;padding:8px 20px 24px;font:14px system-ui,sans-serif;color:#4f5b66}
</style>
</head>
<body>
<main id="activity"></main>
<footer>Made with the Activity Builder on The Language Page (thelanguagepage.com). This file works offline and sends nothing anywhere.</footer>
<script>
${js}
</script>
<script>LPActivity.mount(document.getElementById("activity"), ${data});</script>
</body>
</html>
`;
}
const name = () => `${(state.title || "activity").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "activity"}.html`;
function sizeNote(html) {
  const kb = Math.round(new Blob([html]).size / 1024);
  $("[data-ab-size]").textContent = `File size: ${kb} KB${kb > 300 ? ". Large: use smaller images." : "."}`;
}
$("[data-ab-download]").addEventListener("click", async () => {
  const issues = check(state);
  if (issues.length) toast(`Exported with ${issues.length} accessibility note${issues.length > 1 ? "s" : ""}. See the checklist.`);
  const html = await exportHtml();
  sizeNote(html);
  download(name(), html);
});
$("[data-ab-embed]").addEventListener("click", async () => {
  const html = await exportHtml();
  sizeNote(html);
  const srcdoc = html.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  await copyText(`<iframe title="${escapeHtml(state.title || "Activity")}" srcdoc="${srcdoc}" style="width:100%;height:720px;border:0" loading="lazy"></iframe>`);
});
$("[data-ab-print]").addEventListener("click", () => printOnly(preview));

/* ---------- start: handoff from the Frame Generator, a Content + Language unit, the draft, or the example ---------- */
(async () => {
  const params = new URLSearchParams(location.search);
  const draft = loadDraft("activity-builder");
  if (params.get("handoff") === "frames") {
    const h = store.get("handoff:frames");
    if (h) {
      state = {
        title: h.title,
        accent: "#17324d",
        blocks: [
          { type: "passage", title: "Word bank", text: h.words.join(" · ") },
          ...Object.entries(h.frames).map(([band, fs]) => ({ type: "frames", prompt: `${h.prompt} (${band.replace("L", "Levels ")})`, frames: fs })),
          NEW.rubric(),
        ],
      };
    }
  } else if (params.get("from")) {
    try {
      const units = await (await fetch("/lp/assets/units.json")).json();
      const u = units.find((x) => x.id === params.get("from"));
      if (u) {
        state = {
          title: u.activity.title,
          accent: "#17324d",
          blocks: [
            { type: "passage", title: "What to do", text: u.activity.steps.map((s, k) => `${k + 1}. ${s}`).join("\n\n") },
            ...(u.activity.problems || []).map((p) => ({ type: "short", prompt: p.prompt, lines: 3 })),
            { type: "frames", prompt: "Explain your thinking.", frames: u.frames["L3-4"] },
            NEW.rubric(),
          ],
        };
      }
    } catch {}
  } else if (draft?.blocks) state = draft;
  renderEditor();
  changed();
})();
