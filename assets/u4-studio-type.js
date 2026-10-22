/**
 * Unit 4 typesetting: stacked fractions in reading text.
 *
 * The ten hand-built pages draw their questions, choices and explanations with template strings, so there is no single place
 * to ask for a fraction. This watches the page's main column and, after each draw, hands every plain digit/digit run ("3/5",
 * "12/40") in reading text to StudioType.frac (assets/studio/typeset.js), which stacks it and gives screen readers the words
 * ("three fifths", "tres quintos"). Models, inputs, figures, the header and tab bar are left alone, and so are dates and
 * anything that is not digit/digit. Text is only restyled, never changed: nothing here knows an answer.
 */
(() => {
  const W = /** @type {any} */ (window);
  const SKIP =
    "svg, script, style, textarea, input, select, option, code, pre, .big-fraction, .frac, .num-input, .app-header, .app-footer, .tab-bar, .u4-dialog, [data-no-typeset], [contenteditable]";
  const RUN = /\d\s*\/\s*\d/;
  const esc = (/** @type {string} */ s) =>
    s.replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c,
    );

  function typesetText(/** @type {Text} */ node) {
    const host = node.parentElement;
    if (!host || host.closest(SKIP) || !RUN.test(node.data)) return;
    const lang = host.closest(".es-text, [lang='es']") ? "es" : "en";
    const html = esc(node.data);
    const out = W.StudioType.frac(html, lang);
    if (out === html) return;
    const t = document.createElement("template");
    t.innerHTML = out;
    node.replaceWith(t.content);
  }

  function scan(/** @type {Node} */ root) {
    const found = /** @type {Text[]} */ ([]);
    if (root.nodeType === 3) found.push(/** @type {Text} */ (root));
    else if (root.nodeType === 1) {
      const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) found.push(/** @type {Text} */ (n));
    }
    for (const n of found) typesetText(n);
  }

  function start() {
    const main = document.querySelector(".main-container");
    if (!main || !W.StudioType) return;
    /** @type {Set<Node>} */
    const pending = new Set();
    let queued = false;
    const flush = () => {
      queued = false;
      const roots = [...pending];
      pending.clear();
      for (const r of roots) if (r.isConnected) scan(r);
    };
    new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) pending.add(n);
      if (pending.size && !queued) {
        queued = true;
        requestAnimationFrame(flush);
      }
    }).observe(main, { childList: true, subtree: true });
    scan(main);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
