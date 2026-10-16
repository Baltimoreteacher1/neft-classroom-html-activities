/**
 * The student level editor. A student picks numbers (and one letter) for an equation
 * or inequality; the validator proves it has exactly one whole-number answer and
 * rates it. The checker says yes or no and never what the answer is, so the editor
 * cannot be used to solve someone else's homework. A puzzle can be saved and shared
 * only after its maker solves it. Nothing here accepts free text: numbers, a letter
 * from a fixed list and a symbol from a fixed list.
 */
import { applyStrings } from "./i18n-dom.js";
import { eqText } from "./balance-model.js";
import { addToLibrary, loadLibrary, removeFromLibrary } from "./library.js";
import { LIMITS, toEquation, VARIABLES, validatePuzzle } from "./puzzles.js";
import { decodePuzzle } from "./share-code.js";
import { t } from "./strings.js";

const RELS = [
  ["=", "relEq"],
  ["<", "relLt"],
  [">", "relGt"],
  ["≤", "relLe"],
  ["≥", "relGe"],
];

const numberField = (id, min, max, value) =>
  `<input id="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" value="${value}" data-nsr-ignore />`;

const TEMPLATE = `
<h2 id="bb-build-h" tabindex="-1" data-t="buildHeading"></h2>
<p data-t="buildIntro"></p>
<form id="bb-editor" class="bb-card" novalidate>
  <div class="bb-row">
    <label for="ed-rel"><span data-t="kindLabel"></span>
      <select id="ed-rel" data-nsr-ignore>${RELS.map(([r, key]) => `<option value="${r}" data-t="${key}"></option>`).join("")}</select></label>
    <label for="ed-var"><span data-t="varLabel"></span>
      <select id="ed-var" data-nsr-ignore>${VARIABLES.map((v, i) => `<option value="${i}">${v}</option>`).join("")}</select></label>
    <label for="ed-q"><span data-t="xDivisor"></span>
      ${numberField("ed-q", 1, LIMITS.divisor, 1)}<small data-t="xDivisorHelp"></small></label>
  </div>
  <div class="bb-row">
    <fieldset><legend data-t="leftSideEdit"></legend>
      <label for="ed-la"><span data-t="xCount"></span>${numberField("ed-la", 0, LIMITS.coef, 2)}</label>
      <label for="ed-lb"><span data-t="constant"></span>${numberField("ed-lb", -LIMITS.constant, LIMITS.constant, 3)}</label></fieldset>
    <fieldset><legend data-t="rightSideEdit"></legend>
      <label for="ed-ra"><span data-t="xCount"></span>${numberField("ed-ra", 0, LIMITS.coef, 0)}</label>
      <label for="ed-rb"><span data-t="constant"></span>${numberField("ed-rb", -LIMITS.constant, LIMITS.constant, 11)}</label></fieldset>
  </div>
  <p class="bb-preview"><span data-t="preview"></span>: <strong id="ed-eq"></strong></p>
  <div id="ed-verdict" class="bb-verdict" role="status" aria-live="polite"></div>
  <button type="submit" id="ed-solve" class="bb-btn bb-primary" data-t="solveFirst"></button>
  <p class="bb-help" data-t="solveFirstHelp"></p>
</form>
<div id="ed-new" class="bb-card" tabindex="-1" hidden>
  <h3 data-t="myCode"></h3>
  <p class="bb-code" id="ed-new-code" aria-live="polite"></p>
  <p class="bb-help" data-t="codeHelp"></p>
  <button type="button" id="ed-copy" class="bb-btn" data-t="copyCode"></button>
</div>
<section class="bb-card" aria-labelledby="ed-lib-h">
  <h3 id="ed-lib-h" data-t="myPuzzles"></h3>
  <p class="bb-help" id="ed-lib-empty" data-t="myPuzzlesEmpty"></p>
  <ul id="ed-lib" class="bb-lib"></ul>
</section>
<form id="ed-friend" class="bb-card" novalidate>
  <h3 data-t="friendHeading"></h3>
  <p class="bb-help" data-t="friendHelp"></p>
  <label for="ed-code"><span data-t="codeLabel"></span>
    <input id="ed-code" type="text" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" placeholder="4QK-M2B-7VD" data-nsr-ignore /></label>
  <button type="submit" class="bb-btn bb-primary" data-t="playCode"></button>
  <p class="bb-error" id="ed-code-error" role="alert"></p>
</form>`;

/**
 * @param {HTMLElement} root
 * @param {{ lang: () => string, storage: Storage, onSolveOwn: (spec: object) => void,
 *           onPlay: (spec: object, code: string) => void, say: (text: string) => void }} api
 */
export function mountEditor(root, api) {
  root.innerHTML = TEMPLATE;
  const $ = (id) => root.querySelector(`#${id}`);
  const read = () => ({
    rel: $("ed-rel").value,
    v: Number($("ed-var").value),
    q: Number($("ed-q").value),
    l: { a: Number($("ed-la").value), b: Number($("ed-lb").value) },
    r: { a: Number($("ed-ra").value), b: Number($("ed-rb").value) },
  });
  const blank = () => [...root.querySelectorAll("#bb-editor input")].some((i) => i.value.trim() === "");
  const preview = (spec, v) => {
    try {
      return blank() ? "" : eqText(toEquation(spec), v);
    } catch {
      return "";
    }
  };
  const letter = () => VARIABLES[Number($("ed-var").value)] ?? "x";

  function refresh() {
    const lang = api.lang();
    const v = letter();
    applyStrings(root, lang, { v });
    const spec = read();
    const verdict = blank() ? { ok: false, errors: ["shape"] } : validatePuzzle(spec);
    $("ed-eq").textContent = preview(spec, v);
    $("ed-solve").disabled = !verdict.ok;
    if (verdict.ok) {
      const key = spec.rel === "=" ? "verdictOk" : "verdictOkTilt";
      const tier = t(lang, `tier${verdict.rating.tier[0].toUpperCase()}${verdict.rating.tier.slice(1)}`);
      $("ed-verdict").innerHTML = "";
      const ok = document.createElement("p");
      ok.className = "bb-ok";
      ok.textContent = `${t(lang, key, { moves: verdict.rating.moves })} ${t(lang, "rating", { tier })}`;
      $("ed-verdict").append(ok);
    } else {
      $("ed-verdict").innerHTML = "";
      for (const code of verdict.errors) {
        const p = document.createElement("p");
        p.className = "bb-error";
        p.textContent = t(lang, `err.${code}`, { v });
        $("ed-verdict").append(p);
      }
    }
    renderLibrary();
  }

  function renderLibrary() {
    const lang = api.lang();
    const codes = loadLibrary(api.storage);
    $("ed-lib-empty").hidden = codes.length > 0;
    const list = $("ed-lib");
    list.innerHTML = "";
    for (const code of codes) {
      const decoded = decodePuzzle(code);
      if (!decoded.ok) continue;
      const v = VARIABLES[decoded.spec.v];
      const li = document.createElement("li");
      const label = document.createElement("span");
      label.className = "bb-lib-eq";
      label.textContent = `${eqText(toEquation(decoded.spec), v)}  ·  ${code}`;
      const play = button(t(lang, "play"), () => api.onPlay(decoded.spec, code));
      const copy = button(t(lang, "copyCode"), () => copyCode(code));
      const del = button(t(lang, "remove"), () => {
        removeFromLibrary(api.storage, code);
        api.say(t(api.lang(), "removed"));
        renderLibrary();
      });
      li.append(label, play, copy, del);
      list.append(li);
    }
  }

  function button(text, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "bb-btn";
    b.textContent = text;
    b.addEventListener("click", onClick);
    return b;
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      api.say(t(api.lang(), "copied"));
    } catch {
      const field = $("ed-code");
      field.value = code;
      field.select();
    }
  }

  root.addEventListener("input", (e) => {
    if (e.target.closest("#bb-editor")) refresh();
  });
  root.addEventListener("change", (e) => {
    if (e.target.closest("#bb-editor")) refresh();
  });
  $("bb-editor").addEventListener("submit", (e) => {
    e.preventDefault();
    const spec = read();
    if (!blank() && validatePuzzle(spec).ok) api.onSolveOwn(spec);
  });
  $("ed-friend").addEventListener("submit", (e) => {
    e.preventDefault();
    const out = decodePuzzle($("ed-code").value);
    if (!out.ok) {
      $("ed-code-error").textContent = t(api.lang(), `code.${out.reason}`);
      return;
    }
    $("ed-code-error").textContent = "";
    api.onPlay(out.spec, $("ed-code").value);
  });
  $("ed-copy").addEventListener("click", () => copyCode($("ed-new-code").textContent));

  refresh();
  return {
    refresh,
    /** Show the code of a puzzle the student just solved and saved. */
    saved(code) {
      addToLibrary(api.storage, code);
      $("ed-new").hidden = false;
      $("ed-new-code").textContent = code;
      renderLibrary();
      $("ed-new").scrollIntoView?.({ block: "nearest" });
    },
  };
}
