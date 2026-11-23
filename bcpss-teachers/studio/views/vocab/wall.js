// #/vocab/<id>/wall: the interactive visual word wall. Projector-ready, keyboard-complete, student-link capable.
import { announce as say, h } from "../../core/dom.js";
import { canSpeak, speak, stop } from "../../core/speech.js";
import { entryValueCounts } from "../../core/vocab-search.js";
import { collectionActions } from "./actions.js";
import { createClassroom } from "./classroom.js";
import { mountMatchGame } from "./match-game.js";
import { posList, spanishFor, wallEntries } from "./model.js";
import { printMenu } from "./print.js";
import { collectionHref } from "./source.js";
import { renderGallery, renderGrid } from "./wall-render.js";
import { REVEAL_MODES, createWall } from "./wall-state.js";

const SORTS = [
  ["order", "Collection order"],
  ["az", "A to Z"],
  ["pos", "Part of speech"],
];
const FOCUS_MARKERS = ["st-v-gal-main", "st-v-prev", "st-v-next", "st-v-reveal", "st-v-say", "st-v-strip-btn", "st-v-tile-main"];

export function render({ root, params, shell, collection, student }) {
  const o = {
    mode: params.mode in REVEAL_MODES ? params.mode : "definition",
    view: params.view === "gallery" ? "gallery" : "grid",
    lang: params.lang === "bi" ? "bi" : "en",
    sort: SORTS.some(([k]) => k === params.sort) ? params.sort : "order",
    pos: params.pos || "",
    tier: params.tier || "",
    showAlt: false,
  };
  const hasEs = collection.entries.some((e) => spanishFor(e, { student }));
  if (!hasEs) o.lang = "en";
  let playing = params.game === "1";
  let readingId = null;
  let readToken = 0;

  const visible = () => wallEntries(collection, o);
  const wall = createWall(visible().map((e) => e.id), { mode: o.mode, view: o.view });
  const wallEl = h("section", { class: "st-v-wall", tabindex: "-1", "aria-label": `${collection.title} word wall`, "data-student": student ? "1" : "0" });
  const tools = h("div", { class: "st-v-wall-tools" });
  const stage = h("div", { class: "st-v-stage" });
  const gameBox = h("div", { class: "st-v-game-wrap" });
  const classroom = createClassroom(wallEl, {
    onChange: (on) => {
      paintAll();
      if (on) queueMicrotask(() => stage.querySelector(".st-v-gal-main, .st-v-tile-main")?.focus({ preventScroll: true }));
    },
  });

  const syncHash = () => {
    const keep = {};
    for (const k of ["student"]) if (params[k]) keep[k] = params[k];
    const q = new URLSearchParams({ ...keep, ...(o.mode !== "definition" ? { mode: o.mode } : {}), ...(o.view !== "grid" ? { view: o.view } : {}), ...(o.lang !== "en" ? { lang: o.lang } : {}), ...(o.sort !== "order" ? { sort: o.sort } : {}), ...(o.pos ? { pos: o.pos } : {}), ...(o.tier ? { tier: o.tier } : {}), ...(playing ? { game: 1 } : {}) });
    shell.replaceHash(`#/vocab/${encodeURIComponent(collection.id)}/wall${q.toString() ? `?${q}` : ""}`);
  };

  const focusDescriptor = () => {
    const a = document.activeElement;
    if (!a || !stage.contains(a)) return null;
    const cls = FOCUS_MARKERS.find((c) => a.classList.contains(c));
    return cls ? { cls, eid: a.dataset.eid || a.closest("[data-eid]")?.dataset.eid || null } : null;
  };
  const restoreFocus = (d) => {
    if (!d) return;
    const sel = d.cls === "st-v-tile-main" || d.cls === "st-v-strip-btn" ? `.${d.cls}[data-eid="${CSS.escape(d.eid || "")}"]` : `.${d.cls}`;
    (stage.querySelector(sel) || stage.querySelector(`.${d.cls}`))?.focus({ preventScroll: true });
  };

  const ctx = () => ({
    wall,
    lang: o.lang,
    student,
    showAlt: o.showAlt,
    readingId,
    onReveal: (id) => {
      wall.advance(id);
      const e = collection.entries.find((x) => x.id === id);
      if (wall.showDefinition(id)) say(`${e.word}. ${e.def}`);
      else if (wall.showWord(id)) say(e.word);
      else say("Hidden again.");
    },
    onMove: (d) => (d < 0 ? wall.prev() : wall.next()),
    onJump: (i) => wall.goto(i),
  });

  function paintStage() {
    const d = focusDescriptor();
    const entries = visible();
    if (wall.view === "gallery") {
      renderGallery(stage, entries, ctx());
    } else renderGrid(stage, entries, ctx());
    restoreFocus(d);
    if (readingId) stage.querySelector(".st-v-reading, .st-v-gal-main")?.scrollIntoView({ block: "nearest" });
  }

  const seg = (label, items, current, onPick, key) =>
    h(
      "div",
      { class: "st-v-ctl" },
      h("span", { class: "st-v-ctl-label", id: `st-v-l-${key}` }, label),
      h("div", { class: "st-v-seg", role: "group", "aria-labelledby": `st-v-l-${key}` }, items.map(([v, t]) => h("button", { class: "st-v-btn", type: "button", "aria-pressed": String(current === v), "data-key": `${key}:${v}`, onclick: () => onPick(v) }, t))),
    );

  function filterGroup(label, key, counts, current, fmt) {
    if (counts.length < 2 && !current) return null;
    return h(
      "div",
      { class: "st-v-ctl" },
      h("span", { class: "st-v-ctl-label", id: `st-v-l-${key}` }, label),
      h("div", { class: "st-v-seg", role: "group", "aria-labelledby": `st-v-l-${key}` }, [
        h("button", { class: "st-v-btn", type: "button", "aria-pressed": String(!current), "data-key": `${key}:` , onclick: () => setFilter(key, "") }, "All"),
        ...counts.map((c) => h("button", { class: "st-v-btn", type: "button", "aria-pressed": String(String(current) === String(c.value)), "data-key": `${key}:${c.value}`, onclick: () => setFilter(key, String(current) === String(c.value) ? "" : String(c.value)) }, `${fmt(c.value)} (${c.count})`)),
      ]),
    );
  }

  function paintTools() {
    const key = document.activeElement?.dataset?.key || (document.activeElement?.id ? `#${document.activeElement.id}` : "");
    const posCounts = entryValueCounts(collection.entries, (e) => e.pos, (e) => !o.tier || String(e.tier) === o.tier);
    const tierCounts = entryValueCounts(collection.entries, (e) => e.tier, (e) => !o.pos || e.pos === o.pos);
    const sort = h("select", { class: "st-v-select", id: "st-v-sort", "aria-label": "Sort the words" }, SORTS.map(([v, t]) => h("option", { value: v, selected: o.sort === v }, t)));
    sort.addEventListener("change", () => setFilter("sort", sort.value));
    const readBtn = h("button", { class: "st-v-btn", type: "button", "data-key": "read", "aria-pressed": String(!!readingId), onclick: () => (readingId ? stopReading() : readAll()) }, readingId ? "Stop reading" : "Read all aloud");
    const altBtn = h("button", { class: "st-v-btn", type: "button", "data-key": "alt", "aria-pressed": String(o.showAlt), onclick: () => { o.showAlt = !o.showAlt; paintStage(); paintTools(); } }, "Picture descriptions");
    const row1 = h(
      "div",
      { class: "st-v-tools-row" },
      seg("View", [["grid", "Grid"], ["gallery", "One at a time"]], wall.view, (v) => { o.view = v; wall.setView(v); syncHash(); paintAll(); }, "view"),
      seg("Reveal", Object.entries(REVEAL_MODES).map(([k, m]) => [k, m.label]), wall.mode, (v) => { o.mode = v; wall.setMode(v); syncHash(); paintAll(); }, "mode"),
      hasEs ? seg("Language", [["en", "English"], ["bi", "English and Spanish"]], o.lang, (v) => { o.lang = v; syncHash(); paintAll(); }, "lang") : null,
    );
    const row2 = h(
      "div",
      { class: "st-v-tools-row" },
      h("div", { class: "st-v-ctl" }, h("label", { class: "st-v-ctl-label", for: "st-v-sort" }, "Sort"), sort),
      filterGroup("Part of speech", "pos", posCounts, o.pos, (v) => v),
      filterGroup("Tier", "tier", tierCounts, o.tier, (v) => `Tier ${v}`),
    );
    const row3 = h(
      "div",
      { class: "st-v-tools-row st-v-tools-actions" },
      h("button", { class: "st-v-btn", type: "button", "data-key": "revealall", onclick: () => wall.revealAll() }, "Reveal all"),
      h("button", { class: "st-v-btn", type: "button", "data-key": "hideall", onclick: () => wall.hideAll() }, "Hide all"),
      readBtn,
      altBtn,
      h("button", { class: "st-v-btn", type: "button", "data-key": "game", onclick: () => setPlaying(true) }, "Matching game"),
      printMenu(collection, { student, getBilingual: () => o.lang === "bi" }),
      h("button", { class: "st-v-btn st-v-primary", type: "button", "data-key": "classroom", "aria-pressed": String(classroom.active), onclick: () => (classroom.active ? classroom.exit() : classroom.enter()) }, classroom.active ? "Exit classroom mode" : "Classroom mode"),
    );
    tools.replaceChildren(row1, row2, row3);
    if (key) (tools.querySelector(`[data-key="${CSS.escape(key)}"]`) || (key.startsWith("#") ? tools.querySelector(key) : null))?.focus({ preventScroll: true });
  }

  function paintAll() {
    paintTools();
    paintStage();
    wallEl.classList.toggle("st-v-playing", playing);
    stage.hidden = playing;
  }

  function setFilter(k, v) {
    o[k] = v;
    wall.setIds(visible().map((e) => e.id));
    syncHash();
    paintAll();
    const n = visible().length;
    say(`${n} ${n === 1 ? "word" : "words"} shown.`);
  }

  function setPlaying(on) {
    playing = on;
    stopReading();
    syncHash();
    if (on) mountMatchGame(gameBox, { collection, announce: say, onExit: () => setPlaying(false) });
    else gameBox.replaceChildren();
    gameBox.hidden = !on;
    tools.hidden = on;
    paintAll();
    if (!on) stage.querySelector("button, [tabindex]")?.focus({ preventScroll: true });
  }

  function stopReading() {
    readToken += 1;
    if (readingId) {
      readingId = null;
      stop();
      paintAll();
    }
  }

  async function readAll() {
    if (!canSpeak()) return say("Audio is not available in this browser. The words and definitions are on screen.");
    const my = ++readToken;
    for (const e of visible()) {
      if (my !== readToken) return;
      readingId = e.id;
      wall.goto(wall.ids.indexOf(e.id));
      wall.show(e.id);
      paintTools();
      await speak(e.word);
      if (my !== readToken) return;
      await speak(e.def);
      const es = o.lang === "bi" ? spanishFor(e, { student }) : null;
      if (es && my === readToken) {
        await speak(es.word, { lang: "es-US" });
        if (es.def) await speak(es.def, { lang: "es-US" });
      }
    }
    if (my === readToken) {
      readingId = null;
      paintAll();
      say("Finished reading all words.");
    }
  }

  const moveFocus = (dir) => {
    const btns = [...stage.querySelectorAll(".st-v-tile-main")];
    const i = btns.indexOf(document.activeElement.closest(".st-v-tile-main") || document.activeElement);
    if (!btns.length) return;
    const cols = btns.filter((b) => b.offsetTop === btns[0].offsetTop).length || 1;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[dir];
    const next = i < 0 ? 0 : Math.min(btns.length - 1, Math.max(0, i + step));
    btns[next].focus();
  };

  const onKey = (ev) => {
    const t = ev.target;
    if (ev.altKey || ev.ctrlKey || ev.metaKey || t.closest?.("input, textarea, select, summary, .st-v-menu-panel")) return;
    if (ev.key === "Escape" && classroom.active) return void classroom.exit();
    if (playing) return;
    if (ev.key === "f" || ev.key === "F") return void (classroom.active ? classroom.exit() : classroom.enter());
    const inStage = stage.contains(t) || t === wallEl;
    if (!inStage) return;
    if (ev.key === "r" || ev.key === "R") {
      const e = collection.entries.find((x) => x.id === (t.closest?.("[data-eid]")?.dataset.eid || wall.current));
      if (e && wall.showWord(e.id)) speak(e.word);
      return;
    }
    if (wall.view === "gallery") {
      if (ev.key === "ArrowRight") (ev.preventDefault(), wall.next());
      else if (ev.key === "ArrowLeft") (ev.preventDefault(), wall.prev());
      else if (ev.key === "Home") (ev.preventDefault(), wall.goto(0));
      else if (ev.key === "End") (ev.preventDefault(), wall.goto(wall.ids.length - 1));
      else if ((ev.key === " " || ev.key === "Enter") && !t.closest("button, a")) (ev.preventDefault(), ctx().onReveal(wall.current));
    } else if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(ev.key) && t.closest(".st-v-tile-main, .st-v-tiles")) {
      ev.preventDefault();
      moveFocus(ev.key);
    } else if (ev.key === " " && t === wallEl) {
      ev.preventDefault();
      stage.querySelector(".st-v-tile-main")?.focus();
    }
  };
  wallEl.addEventListener("keydown", onKey);

  const unsub = wall.onChange(() => paintAll());
  const keys = h("p", { class: "st-v-keys" }, "Keyboard: arrow keys move between words, space or Enter shows the next part, R says the word, F starts classroom mode, Escape leaves it.");
  const share = student
    ? null
    : h(
        "p",
        { class: "st-v-share" },
        "Students see no teacher notes or unverified translations. ",
        h("a", { href: collectionHref(collection.id, "wall", { student: 1 }), target: "_blank", rel: "noopener" }, "Preview the student view"),
        ". Use Copy student link to share it.",
      );
  wallEl.append(tools, gameBox, stage);
  root.replaceChildren(
    h(
      "div",
      { class: "st-v-page st-v-wall-page" },
      h("header", { class: "st-v-head" }, student ? null : h("p", { class: "st-v-crumb" }, h("a", { href: collectionHref(collection.id) }, `Back to ${collection.title}`)), h("h1", {}, `${collection.title}: word wall`)),
      student ? null : collectionActions(collection, shell, "wall"),
      share,
      wallEl,
      keys,
    ),
  );
  gameBox.hidden = !playing;
  if (playing) mountMatchGame(gameBox, { collection, announce: say, onExit: () => setPlaying(false) });
  tools.hidden = playing;
  paintAll();
  return () => {
    readToken += 1;
    stop();
    unsub();
    classroom.destroy();
  };
}
