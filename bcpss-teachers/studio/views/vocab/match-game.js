// Word-and-visual matching mini game. Tap or press a word, then the picture it names. Untimed, no scores to lose.
import { h, shuffle } from "../../core/dom.js";
import { visualSvg } from "./visual.js";

export const ROUND_SIZE = 6;

/** Pure: the pairs for one round. Rotates through the collection so each new round brings new words. */
export function roundEntries(entries, round, size = ROUND_SIZE) {
  const pool = entries.filter((e) => e.visual);
  if (pool.length <= size) return shuffle(pool, `round-${round}`);
  const order = shuffle(pool, "pool");
  const start = (round * size) % pool.length;
  const pick = [];
  for (let i = 0; i < size; i++) pick.push(order[(start + i) % pool.length]);
  return pick;
}

/** Pure: judge one attempt. */
export const isMatch = (leftId, rightId) => leftId === rightId;

export function mountMatchGame(container, { collection, announce, onExit }) {
  const all = collection.entries;
  let mode = "word"; // word: word -> picture; meaning: meaning -> picture
  let round = 0;
  let st;

  const fresh = () => {
    const pairs = roundEntries(all, round);
    st = { pairs, matched: new Set(), tries: 0, misses: new Map(), left: null, note: "", noteKind: "" };
    st.leftOrder = shuffle(pairs, `L${round}${mode}`);
    st.rightOrder = shuffle(pairs, `R${round}${mode}`);
  };

  const paint = () => {
    const done = st.matched.size === st.pairs.length;
    const status = h("p", { class: "st-v-game-note", role: "status", "aria-live": "polite", "data-kind": st.noteKind }, st.note);
    if (st.pairs.length < 3) {
      container.replaceChildren(h("p", { class: "st-v-state" }, "The matching game needs at least three words with pictures."), h("button", { class: "st-v-btn", type: "button", onclick: onExit }, "Back to the word wall"));
      return;
    }
    const leftCol = h("ul", { class: "st-v-game-col", "aria-label": mode === "word" ? "Words" : "Meanings" });
    for (const e of st.leftOrder) {
      const ok = st.matched.has(e.id);
      const b = h("button", { class: "st-v-gbtn", type: "button", "data-id": e.id, "aria-pressed": String(st.left === e.id), disabled: ok }, mode === "word" ? e.word : e.def, ok ? h("span", { class: "st-v-matched" }, " Matched") : null);
      b.addEventListener("click", () => pickLeft(e.id));
      leftCol.append(h("li", {}, b));
    }
    const rightCol = h("ul", { class: "st-v-game-col st-v-game-pics", "aria-label": "Pictures" });
    for (const e of st.rightOrder) {
      const ok = st.matched.has(e.id);
      const b = h("button", { class: "st-v-gbtn st-v-gpic", type: "button", "data-id": e.id, disabled: ok || !st.left, "aria-label": `${e.visual.alt}${ok ? ". Matched" : ""}` }, h("span", { class: "st-v-gpic-art", html: visualSvg(e.visual), "aria-hidden": "true" }), ok ? h("span", { class: "st-v-matched" }, `Matched: ${e.word}`) : null);
      b.addEventListener("click", () => pickRight(e.id));
      rightCol.append(h("li", {}, b));
    }
    const head = h(
      "div",
      { class: "st-v-game-head" },
      h("h2", {}, "Matching game"),
      h(
        "div",
        { class: "st-v-seg", role: "group", "aria-label": "What to match" },
        h("button", { class: "st-v-btn", type: "button", "aria-pressed": String(mode === "word"), onclick: () => setMode("word") }, "Words and pictures"),
        h("button", { class: "st-v-btn", type: "button", "aria-pressed": String(mode === "meaning"), onclick: () => setMode("meaning") }, "Meanings and pictures"),
      ),
      h("button", { class: "st-v-btn", type: "button", onclick: onExit }, "Back to the word wall"),
    );
    const how = h("p", { class: "st-v-help" }, mode === "word" ? "Choose a word, then choose the picture that shows it." : "Choose a meaning, then choose the picture that shows it.");
    const body = done
      ? h("div", { class: "st-v-game-done" }, h("h3", {}, "All matched"), h("p", {}, `You matched ${st.pairs.length} words in ${st.tries} ${st.tries === 1 ? "try" : "tries"}. There is no score to beat. Play again for a new mix of words.`), h("p", { class: "st-v-row" }, h("button", { class: "st-v-btn st-v-primary", type: "button", "data-new-round": "", onclick: () => { round += 1; fresh(); paint(); } }, "New round"), h("button", { class: "st-v-btn", type: "button", onclick: onExit }, "Back to the word wall")))
      : null;
    container.replaceChildren(h("section", { class: "st-v-game", "aria-label": "Matching game" }, head, how, status, h("div", { class: "st-v-game-board" }, leftCol, rightCol), body));
    const focusId = st.left && !done ? `.st-v-gpic:not([disabled])` : null;
    if (focusId) container.querySelector(focusId)?.focus();
  };

  function setMode(m) {
    if (m === mode) return;
    mode = m;
    fresh();
    paint();
    container.querySelector(".st-v-seg [aria-pressed=true]")?.focus();
  }
  function pickLeft(id) {
    st.left = st.left === id ? null : id;
    st.note = st.left ? "Now choose the picture." : "";
    st.noteKind = "";
    paint();
    if (!st.left) container.querySelector(`.st-v-gbtn[data-id="${id}"]`)?.focus();
  }
  function pickRight(id) {
    if (!st.left) return;
    st.tries += 1;
    const leftId = st.left;
    const e = all.find((x) => x.id === leftId);
    if (isMatch(leftId, id)) {
      st.matched.add(id);
      st.left = null;
      st.note = `Yes. ${e.word}: ${e.def}`;
      st.noteKind = "right";
      announce?.(st.note);
      paint();
      const nextBtn = container.querySelector(".st-v-gbtn:not([disabled])") || container.querySelector("[data-new-round]");
      nextBtn?.focus();
    } else {
      const n = (st.misses.get(leftId) || 0) + 1;
      st.misses.set(leftId, n);
      st.left = null;
      st.note = n >= 2 && mode === "word" ? `Not that one. Hint: "${e.def}" Choose the word again, then look for a picture that shows that meaning.` : "Not that one. Look at the picture again, then choose the word again.";
      st.noteKind = "retry";
      announce?.(st.note);
      paint();
      container.querySelector(`.st-v-gbtn[data-id="${leftId}"]`)?.focus();
    }
  }

  fresh();
  paint();
  return () => container.replaceChildren();
}
