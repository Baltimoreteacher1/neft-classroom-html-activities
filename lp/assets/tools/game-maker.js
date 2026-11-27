// Game Maker: pick a game style, paste words, preview live, export one offline .html file, a share link (the game
// lives inside the link) with a QR code, or printable cards. Nothing is uploaded.
import { $, copyText, decodeShare, download, encodeShare, escapeHtml, loadDraft, parseTable, saveDraft, toast } from "../lib.js";
import qrcode from "../vendor/qrcode.js";

const form = $("[data-gm-form]");
const preview = $("[data-gm-preview]");
const errors = $("[data-gm-errors]");
const EXAMPLE = { title: $("#gm-title").value, rows: $("#gm-rows").value, template: "match", theme: "harbor" };
const FORMATS = {
  match: "Format: word, meaning, Spanish (optional). One pair per line. Up to 8 pairs.",
  quiz: "Format: question, answer, category (optional). Up to 5 categories with 5 questions each.",
  builder: "Format: one sentence per line. Students tap the words in order.",
  sort: "Format: word, group. Two to four groups, up to 16 words.",
  frame: "Format: one sentence per line with the missing word in [square brackets].",
  speed: "Format: question, answer. Wrong choices come from the other answers.",
};
const EXAMPLES = {
  match: EXAMPLE.rows,
  quiz: "What is a ratio?, A comparison of two quantities, Words\nWhat does per mean?, For each, Words\n3 apples for $1. How much for 9 apples?, $3, Problems\nA car goes 120 miles in 2 hours. What is the unit rate?, 60 miles per hour, Problems\nSay a ratio in a sentence., For every 2 cats there are 3 dogs., Speaking",
  builder: "For every 3 red beads there are 2 blue beads.\nThe unit rate is 4 dollars per pound.\nWe compared the prices to find the better deal.",
  sort: "ratio, math word\nevaporate, science word\nper, math word\npredict, science word\nequivalent, math word\nhypothesis, science word",
  frame: "A [ratio] compares two quantities.\nThe price is 2 dollars [per] pound.\nTwo ratios that have the same value are [equivalent].",
  speed: "ratio, a comparison of two quantities\nrate, a ratio with different units\nunit rate, a rate for one unit\nequivalent, having the same value",
};

let runtimeReady = null;
function loadRuntime() {
  runtimeReady ||= new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/lp/assets/game/game.css";
    document.head.append(css);
    const s = document.createElement("script");
    s.src = "/lp/assets/game/runtime.js";
    s.onload = () => resolve(window.LPGame);
    s.onerror = reject;
    document.head.append(s);
  });
  return runtimeReady;
}

/* Icon bodies from the site sprite, so a game can show a picture for words like "sun" or "map". */
let iconMap = null;
async function icons() {
  if (iconMap) return iconMap;
  iconMap = {};
  try {
    const text = await (await fetch("/lp/assets/icons.svg")).text();
    for (const m of text.matchAll(/<symbol id="i-([a-z-]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) iconMap[m[1]] = m[2];
  } catch {}
  return iconMap;
}

function readForm() {
  const fd = new FormData(form);
  return {
    v: 1,
    title: (fd.get("title") || "Game").toString().trim().slice(0, 80) || "Game",
    template: fd.get("template") || "match",
    theme: fd.get("theme") || "harbor",
    items: parseTable(fd.get("rows") || "").slice(0, 60),
    opts: { tts: fd.has("tts"), gloss: fd.has("gloss"), bank: fd.has("bank"), icons: fd.has("icons"), timer: fd.has("timer") },
  };
}
async function withIcons(game) {
  if (!game.opts.icons) return game;
  const all = await icons();
  const used = {};
  for (const r of game.items) {
    const key = String(r[0] || "").trim().toLowerCase();
    if (all[key]) used[key] = all[key];
  }
  return { ...game, icons: used };
}
function writeForm(g) {
  $("#gm-title").value = g.title || "";
  $("#gm-rows").value = Array.isArray(g.items) ? g.items.map((r) => r.map((c) => (/[,"]/.test(c) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(", ")).join("\n") : g.rows || "";
  const tpl = form.querySelector(`input[name="template"][value="${g.template}"]`);
  if (tpl) tpl.checked = true;
  $("#gm-theme").value = g.theme || "harbor";
  for (const k of ["tts", "gloss", "bank", "icons", "timer"]) if (g.opts && k in g.opts) form.elements[k].checked = !!g.opts[k];
  hint();
}
function hint() {
  $("[data-gm-format]").textContent = FORMATS[readForm().template];
}
function validate(game) {
  const msgs = [];
  if (!game.items.length) msgs.push("Add at least one line.");
  if (["match", "sort", "speed"].includes(game.template) && game.items.some((r) => !r[1])) msgs.push("Some lines have only one part. Add a comma and the second part.");
  if (game.template === "frame" && game.items.some((r) => !/\[[^\]]+\]/.test(r.join(", ")))) msgs.push("Mark the missing word in every sentence with [square brackets].");
  return msgs;
}

let timer;
async function update() {
  hint();
  const game = await withIcons(readForm());
  const msgs = validate(game);
  errors.textContent = msgs.join(" ");
  const LP = await loadRuntime();
  LP.mount(preview, game);
  saveDraft("game-maker", readForm());
}
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(update, 250);
};
form.addEventListener("input", schedule);
form.addEventListener("change", (e) => {
  if (e.target.name === "template" && $("#gm-rows").value.trim() === EXAMPLES[lastTemplate]?.trim()) {
    $("#gm-rows").value = EXAMPLES[e.target.value];
  }
  if (e.target.name === "template") lastTemplate = e.target.value;
  schedule();
});
let lastTemplate = "match";

/* CSV upload */
$("#gm-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 200_000) return toast("That file is too large. Use a list of up to about 60 lines.");
  $("#gm-rows").value = (await file.text()).trim();
  schedule();
});

/* Start from a Content + Language unit */
const unitSelect = $("#gm-from");
let units = [];
async function loadUnits() {
  try {
    units = await (await fetch("/lp/assets/units.json")).json();
  } catch {
    units = [];
  }
  for (const u of units) {
    const o = document.createElement("option");
    o.value = u.id;
    o.textContent = u.title;
    unitSelect.append(o);
  }
}
function useUnit(id) {
  const u = units.find((x) => x.id === id);
  if (!u) return;
  $("#gm-title").value = `${u.title}: key words`;
  $("#gm-rows").value = u.vocabulary.map((v) => [v.term, v.definition, v.es].map((c) => (/[,"]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(", ")).join("\n");
  unitSelect.value = id;
  schedule();
}
unitSelect.addEventListener("change", () => useUnit(unitSelect.value));

/* Buttons */
$("[data-gm-example]").addEventListener("click", () => {
  writeForm({ ...EXAMPLE, opts: { tts: true, bank: true, icons: true } });
  schedule();
});
$("[data-gm-reset]").addEventListener("click", () => {
  $("#gm-title").value = "";
  $("#gm-rows").value = "";
  schedule();
});

async function exportHtml() {
  const game = await withIcons(readForm());
  const [js, css] = await Promise.all([fetch("/lp/assets/game/runtime.js").then((r) => r.text()), fetch("/lp/assets/game/game.css").then((r) => r.text())]);
  const data = JSON.stringify(game).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(game.title)}</title>
<style>
${css}
html,body{margin:0;background:#f7f4ec}main{max-width:64rem;margin:0 auto;padding:16px}footer{max-width:64rem;margin:0 auto;padding:8px 16px 24px;font:14px system-ui,sans-serif;color:#4f5b66}
</style>
</head>
<body>
<main id="game"></main>
<footer>Made with the Game Maker on The Language Page (thelanguagepage.com). This file works offline and sends nothing anywhere.</footer>
<script>
${js}
</script>
<script>LPGame.mount(document.getElementById("game"), ${data});</script>
</body>
</html>
`;
}
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "game";
$("[data-gm-download]").addEventListener("click", async () => {
  const html = await exportHtml();
  const kb = Math.round(new Blob([html]).size / 1024);
  $("[data-gm-size]").textContent = `File size: ${kb} KB${kb > 300 ? " (large: shorten the list for faster loading)" : ""}.`;
  download(`${slug(readForm().title)}.html`, html);
});
$("[data-gm-link]").addEventListener("click", async () => {
  const game = readForm();
  const code = await encodeShare(game);
  const url = `${location.origin}/tools/game-maker/play/#g=${code}`;
  await copyText(url);
  const box = $("[data-gm-qr]");
  const holder = $("[data-gm-qr-svg]");
  const note = $("[data-gm-qr-note]");
  box.hidden = false;
  holder.innerHTML = "";
  if (new TextEncoder().encode(url).length > 2900) {
    note.textContent = "This link is too long for a QR code. Shorten the list, or share the downloaded file instead.";
    return;
  }
  try {
    const q = qrcode(0, "L");
    q.addData(url);
    q.make();
    holder.innerHTML = q.createSvgTag({ cellSize: 4, margin: 4, scalable: true, alt: "QR code for the game link" });
    note.textContent = `Link length: ${url.length} characters. Copied to the clipboard.`;
  } catch {
    note.textContent = "The QR code could not be made for this link. The link itself is copied.";
  }
});
$("[data-gm-print]").addEventListener("click", () => {
  const g = readForm();
  const cards = $("[data-gm-cards]");
  const cell = (front, back) => `<div class="band"><p class="lpg-big">${escapeHtml(front)}</p>${back ? `<p class="muted">${escapeHtml(back)}</p>` : ""}</div>`;
  let html = "";
  if (g.template === "match" || g.template === "speed" || g.template === "quiz") html = g.items.map((r) => cell(r[0]) + cell(r[1] || "", r[2] && g.opts.gloss ? r[2] : "")).join("");
  else if (g.template === "sort") html = g.items.map((r) => cell(r[0])).join("") + [...new Set(g.items.map((r) => r[1]))].map((x) => cell(`Group: ${x}`)).join("");
  else if (g.template === "builder") html = g.items.map((r) => r.join(", ").split(/\s+/).map((w) => cell(w)).join("")).join("");
  else html = g.items.map((r) => cell(r.join(", ").replace(/\[[^\]]+\]/, "_____"))).join("");
  cards.innerHTML = `<div class="print-header"><span>${escapeHtml(g.title)}</span><span>Cut out the cards</span></div><div class="grid cols-3">${html}</div>`;
  window.print();
});

/* Start: a shared game in the hash, else ?from=<unit>, else the saved draft, else the example. */
(async () => {
  await loadUnits();
  const params = new URLSearchParams(location.search);
  const shared = /#g=([A-Za-z0-9_-]+)/.exec(location.hash)?.[1];
  const fromShare = shared && (await decodeShare(shared));
  const draft = loadDraft("game-maker");
  if (fromShare) writeForm(fromShare);
  else if (params.get("from")) useUnit(params.get("from"));
  else if (draft) writeForm(draft);
  lastTemplate = readForm().template;
  update();
})();
