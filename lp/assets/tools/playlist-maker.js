// Practice Playlist Maker: pick sets, order them, share a link (the playlist lives inside it) with a QR code.
// Nothing is uploaded; the draft is saved on this device.
import { $, $$, copyText, encodeShare, escapeHtml, loadDraft, readJson, saveDraft, toast } from "../lib.js";

const MAX = 12;
const index = readJson("sets-index") || [];
const byId = new Map(index.map((s) => [s.id, s]));
const form = $("[data-pl-form]");
const order = $("[data-pl-order]");
const boxes = $$('input[name="set"]', form);
const DEFAULT_TITLE = $("#pl-title").value;
let picked = [];

function filter() {
  const c = $("#pl-cluster").value;
  const d = $("#pl-domain").value;
  for (const g of $$(".pl-group", form)) g.hidden = (c && g.dataset.c !== c) || (d && g.dataset.d !== d);
}

function sync() {
  for (const b of boxes) {
    b.checked = picked.includes(b.value);
    // At the limit, only already-picked sets can be changed (unticked).
    b.disabled = !b.checked && picked.length >= MAX;
  }
  const title = $("#pl-title").value.trim() || DEFAULT_TITLE;
  $("[data-pl-heading]").textContent = title;
  $("[data-pl-note-preview]").textContent = $("#pl-note").value.trim();
  $("[data-pl-empty]").hidden = picked.length > 0;
  $("[data-pl-count]").textContent = picked.length
    ? `${picked.length} of ${MAX} sets chosen · about ${picked.reduce((n, id) => n + byId.get(id).m, 0)} minutes.`
    : "No sets chosen yet.";
  order.innerHTML = picked
    .map((id, i) => {
      const s = byId.get(id);
      const name = escapeHtml(s.t);
      return `<li class="card pl-row"><span class="pl-num" aria-hidden="true">${i + 1}</span><span class="pl-text"><a href="${escapeHtml(s.u)}" target="_blank" rel="noopener">${name}</a><span class="muted">${escapeHtml(s.cl)} · ${escapeHtml(s.dl)} · ${s.m} min</span></span><span class="btn-row no-print"><button type="button" class="btn ghost small" data-move="-1" data-id="${s.id}" aria-label="Move up: ${name}"${i === 0 ? " disabled" : ""}>↑</button><button type="button" class="btn ghost small" data-move="1" data-id="${s.id}" aria-label="Move down: ${name}"${i === picked.length - 1 ? " disabled" : ""}>↓</button><button type="button" class="btn ghost small" data-remove="${s.id}" aria-label="Remove: ${name}">✕</button></span></li>`;
    })
    .join("");
  $("[data-pl-qr]").hidden = true;
  $("[data-pl-errors]").textContent = "";
  saveDraft("playlist-maker", { title: $("#pl-title").value, note: $("#pl-note").value, s: picked }, { quiet: true });
  refreshOpenLink();
}

async function studentUrl() {
  const code = await encodeShare({
    v: 1,
    t: ($("#pl-title").value.trim() || DEFAULT_TITLE).slice(0, 80),
    n: $("#pl-note").value.trim().slice(0, 240),
    s: picked,
  });
  return `${location.origin}/practice/playlist/#p=${code}`;
}

form.addEventListener("change", (e) => {
  if (e.target.name === "set") {
    const id = e.target.value;
    picked = e.target.checked ? [...picked, id].slice(0, MAX) : picked.filter((x) => x !== id);
    sync();
  } else if (e.target.dataset.plFilter !== undefined) filter();
});
form.addEventListener("input", (e) => {
  if (e.target.id === "pl-title" || e.target.id === "pl-note") sync();
});

order.addEventListener("click", (e) => {
  const move = e.target.closest("[data-move]");
  const remove = e.target.closest("[data-remove]");
  if (move) {
    const i = picked.indexOf(move.dataset.id);
    const j = i + Number(move.dataset.move);
    if (j < 0 || j >= picked.length) return;
    [picked[i], picked[j]] = [picked[j], picked[i]];
    sync();
    // Keep keyboard focus on the same control of the row that moved.
    const again = order.querySelector(`[data-id="${move.dataset.id}"][data-move="${move.dataset.move}"]`);
    (again && !again.disabled ? again : order.querySelector(`[data-id="${move.dataset.id}"]`))?.focus();
  } else if (remove) {
    const i = picked.indexOf(remove.dataset.remove);
    picked = picked.filter((x) => x !== remove.dataset.remove);
    sync();
    (order.querySelectorAll("[data-remove]")[Math.min(i, picked.length - 1)] || $("#pl-cluster")).focus();
  }
});

$("[data-pl-reset]").addEventListener("click", () => {
  picked = [];
  $("#pl-title").value = DEFAULT_TITLE;
  $("#pl-note").value = "";
  sync();
});

// The "Open as a student" link always carries the current playlist, so a click opens it directly (no popup blocker).
let hrefJob = 0;
async function refreshOpenLink() {
  const job = ++hrefJob;
  const url = picked.length ? await studentUrl() : "/practice/playlist/";
  if (job === hrefJob) $("[data-pl-open]").href = url;
}
$("[data-pl-open]").addEventListener("click", (e) => {
  if (!picked.length) {
    e.preventDefault();
    $("[data-pl-errors]").textContent = "Choose at least one set first.";
  }
});

$("[data-pl-link]").addEventListener("click", async () => {
  if (!picked.length) {
    $("[data-pl-errors]").textContent = "Choose at least one set first.";
    return;
  }
  const url = await studentUrl();
  await copyText(url);
  toast("Student link copied.");
  const box = $("[data-pl-qr]");
  const holder = $("[data-pl-qr-svg]");
  const note = $("[data-pl-qr-note]");
  box.hidden = false;
  holder.innerHTML = "";
  try {
    // The QR encoder loads only when a teacher asks for a link.
    const { default: qrcode } = await import("../vendor/qrcode.js");
    const q = qrcode(0, "M");
    q.addData(url);
    q.make();
    holder.innerHTML = q.createSvgTag({ cellSize: 4, margin: 4, scalable: true, alt: "QR code for the playlist link" });
    note.textContent = `Link copied to the clipboard (${url.length} characters).`;
  } catch {
    note.textContent = "The QR code could not be made. The link itself is copied.";
  }
});

/* Start: the saved draft, if any. */
const draft = loadDraft("playlist-maker");
if (draft) {
  $("#pl-title").value = draft.title ?? DEFAULT_TITLE;
  $("#pl-note").value = draft.note ?? "";
  picked = (draft.s || []).filter((id) => byId.has(id)).slice(0, MAX);
}
filter();
sync();
