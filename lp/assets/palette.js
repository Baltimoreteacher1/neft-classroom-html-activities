// Quick Find: a keyboard-first jump box over every front-layer page (lp/assets/search-index.json) plus the lab's
// main teacher destinations. Opens with Ctrl/Cmd+K or "/" from anywhere, or the header Search button. Loaded on
// first use by site.js; no network beyond the same-origin index, which the service worker already caches.
import { $, escapeHtml, tr } from "./lib.js";
import { searchScore, tokenize } from "./search-core.js";

const KIND = {
  practice: ["Practice", "practice"],
  tool: ["Teacher tool", "tool"],
  content: ["Content + Language", "content"],
  guide: ["ACCESS Guide", "guide"],
  go: ["Go to", "go"],
};
// Destinations outside the front layer that teachers ask for by name. Same-origin links only.
const DESTINATIONS = [
  {
    k: "go",
    t: "Classroom teachers: find activities for my unit",
    u: "/access-teacher/classroom/",
    d: "Pick grade, subject and unit; open ready-made language activities.",
  },
  {
    k: "go",
    t: "ESOL Teacher Hub",
    u: "/access-teacher/?role=esol",
    d: "WIDA materials by domain, class codes and student work.",
  },
  {
    k: "go",
    t: "BCPSS curriculum language bridges",
    u: "/bcpss-teachers",
    d: "Baltimore City units with language supports.",
  },
  {
    k: "go",
    t: "Full ACCESS Practice Lab",
    u: "/access-practice-lab/",
    d: "Every practice room, game and mission for students.",
  },
  {
    k: "go",
    t: "Games and worlds",
    u: "/access-practice-lab/games",
    d: "Language games students can play now.",
  },
];
const SUGGESTED = [
  "/tools/game-maker/",
  "/tools/warm-ups/",
  "/tools/frame-generator/",
  "/access-teacher/classroom/",
  "/practice/",
];

let index = null;
let dialog;
let input;
let list;
let hits = [];
let active = 0;
let opener = null;

async function loadIndex() {
  if (index) return index;
  try {
    const r = await fetch("/lp/assets/search-index.json");
    index = [...(await r.json()), ...DESTINATIONS];
  } catch {
    index = DESTINATIONS;
  }
  return index;
}

function build() {
  dialog = document.createElement("dialog");
  dialog.className = "modal palette";
  dialog.setAttribute("aria-label", tr("palette.title", "Quick find"));
  dialog.innerHTML = `<div class="palette-box">
  <div class="palette-field">
    <svg aria-hidden="true" focusable="false" width="22" height="22"><use href="/lp/assets/icons.svg#i-search"/></svg>
    <input type="search" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(tr("palette.placeholder", "Find a tool, practice set or unit…"))}">
    <kbd>Esc</kbd>
  </div>
  <ul class="palette-list" id="palette-list" role="listbox"></ul>
  <p class="palette-foot muted"><span><kbd>↑</kbd><kbd>↓</kbd> ${escapeHtml(tr("palette.move", "move"))}</span><span><kbd>Enter</kbd> ${escapeHtml(tr("palette.open", "open"))}</span><span><kbd>Ctrl</kbd><kbd>K</kbd> ${escapeHtml(tr("palette.anywhere", "from any page"))}</span></p>
</div>`;
  document.body.append(dialog);
  input = $("input", dialog);
  list = $(".palette-list", dialog);
  input.addEventListener("input", render);
  input.addEventListener("keydown", onKey);
  list.addEventListener("pointermove", (e) => {
    const li = e.target.closest("[role=option]");
    if (li) setActive(Number(li.dataset.i));
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  dialog.addEventListener("close", () => opener?.focus?.());
}

function render() {
  const tokens = tokenize(input.value);
  if (!tokens.length) {
    hits = SUGGESTED.map((u) => index.find((e) => e.u === u)).filter(Boolean);
  } else {
    hits = index
      .map((e) => ({ e, s: searchScore(e, tokens, KIND[e.k]?.[0]) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 9)
      .map((x) => x.e);
  }
  active = 0;
  const head = tokens.length
    ? ""
    : `<li class="palette-head" role="presentation">${escapeHtml(tr("palette.suggested", "Teachers start here"))}</li>`;
  list.innerHTML = hits.length
    ? head +
      hits
        .map(
          (e, i) =>
            `<li role="option" id="pal-${i}" data-i="${i}" aria-selected="${i === 0}"><a href="${escapeHtml(e.u)}" tabindex="-1"><span class="palette-t">${escapeHtml(e.t)}</span><span class="palette-d">${escapeHtml(e.d || "")}</span></a><span class="chip palette-k" data-kind="${KIND[e.k]?.[1] || "go"}">${escapeHtml(KIND[e.k]?.[0] || "")}</span></li>`,
        )
        .join("")
    : `<li class="empty" role="presentation">${escapeHtml(tr("search.none", "No matches. Try fewer words."))} <a href="/search/?q=${encodeURIComponent(input.value)}">${escapeHtml(tr("palette.full", "Open full search"))}</a></li>`;
  input.setAttribute("aria-activedescendant", hits.length ? "pal-0" : "");
}

function setActive(i) {
  if (!hits.length) return;
  active = (i + hits.length) % hits.length;
  for (const li of list.querySelectorAll("[role=option]"))
    li.setAttribute("aria-selected", String(Number(li.dataset.i) === active));
  input.setAttribute("aria-activedescendant", `pal-${active}`);
  list.querySelector(`#pal-${active}`)?.scrollIntoView({ block: "nearest" });
}

function onKey(e) {
  // A search input swallows the first Esc to clear itself, so the dialog never saw it: close on Esc ourselves.
  if (e.key === "Escape") {
    e.preventDefault();
    close();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    setActive(active + 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setActive(active - 1);
  } else if (e.key === "Enter" && hits[active]) {
    e.preventDefault();
    location.href = hits[active].u;
  }
}

function close() {
  dialog?.open && dialog.close();
}

export async function openPalette(from = document.activeElement) {
  opener = from;
  await loadIndex();
  if (!dialog) build();
  if (!dialog.open) dialog.showModal();
  input.value = "";
  render();
  input.focus();
}
