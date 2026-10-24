/**
 * Unit 4 Practice Studio — story card: one real-life word problem, one clear question.
 *
 * Replaces the per-page "prompt + one box + 'Review the percent equation'" card. A card shows
 *   What you know   a short list of facts (never a paragraph with the question buried in it)
 *   Question        ONE thing to find, in one sentence
 *   answer box(es)  each labelled with what it is and its unit (hours, dollars, %, students)
 * and helps in two steps that never state the answer:
 *   miss 1  a method hint (name the whole, write the percent as a decimal)
 *   miss 2  the equation with the numbers in it, not worked out
 * A wrong answer gets the message written for THAT mistake when the item names it
 * (`wrong["300"]`), otherwise the item's own `miss` line, otherwise a generic nudge.
 *
 * item = {
 *   id, title:{en,es}, facts:[{en,es}], q:{en,es},
 *   fields:[{label:{en,es}, unit:{en,es}|string, ans:number, wrong?:{[value]:{en,es}}, miss?:{en,es}}],
 *   hints:[{en,es},{en,es}], miss:{en,es}, explain:{en,es}
 * }
 * opts = { host, item, index, count, solved, challenge, speak(text), showEs(), onMiss(), onSolve(fb) }
 *
 * Loaded after assets/u4-studio.js. Items are plain data so tools/unit4-studio.test.mjs can read
 * them straight out of each page and check them (answer never in a hint, wrong values really wrong).
 */
(() => {
  const U = /** @type {any} */ (window).U4Studio;
  if (!U) return;

  /** @typedef {{en: string, es: string}} Bi */

  /** @type {Record<string, number>} misses per item this visit; help escalates with them */
  const misses = {};

  const bi = (/** @type {Bi} */ t) => `${t.en}<span class="es-text">${t.es}</span>`;
  /** A short label in both languages; body.show-es picks one (assets/studio/clarity.css). */
  const tag = (/** @type {string} */ en, /** @type {string} */ es) =>
    `<span class="t-en">${en}</span><span class="t-es" lang="es">${es}</span>`;
  /** Feedback anatomy shared with the generated studios: confirm, then why it works (right) or one guiding line (wrong). */
  const okHtml = (/** @type {Bi} */ explain) =>
    `<p class="fb-line fb-confirm"><strong>${bi({ en: "Correct!", es: "¡Correcto!" })}</strong></p><div class="fb-line fb-why"><span class="fb-label">${tag("Why it works", "Por qué funciona")}<span class="sr-only">: </span></span> ${bi(explain)}</div>`;
  const key = (/** @type {number} */ n) => String(Math.round(n * 1e6) / 1e6);
  const unitOf = (/** @type {any} */ u) => (typeof u === "string" ? { en: u, es: u } : u);
  const same = (/** @type {number} */ a, /** @type {number} */ b) =>
    Number.isFinite(a) && Math.abs(a - b) < 1e-6;

  /** @param {any} o */
  function card(o) {
    const { host, item, solved } = o;
    const multi = item.fields.length > 1;
    const bits = item.facts.map((/** @type {Bi} */ f) => `<li>${bi(f)}</li>`).join("");
    const rows = item.fields
      .map((/** @type {any} */ f, /** @type {number} */ i) => {
        const u = unitOf(f.unit);
        return `<div class="story-field">
          <label for="story-in-${i}">${bi(f.label)}</label>
          <input type="number" step="any" inputmode="decimal" id="story-in-${i}" class="num-input" placeholder="?" data-field="${i}" value="${solved ? f.ans : ""}" ${solved ? "disabled" : ""}>
          <span class="story-unit">${bi(u)}</span>
        </div>`;
      })
      .join("");
    host.innerHTML = `
      <div class="item-head">
        <span class="item-count">${o.index + 1} of ${o.count} · ${bi(item.title)}</span>
        <button type="button" class="speak-btn" data-story-speak>🔊 Read</button>
      </div>
      <div class="story-facts${o.challenge ? " story-challenge" : ""}">
        <div class="story-label">${bi({ en: "What you know", es: "Lo que sabes" })}</div>
        <ul>${bits}</ul>
      </div>
      <p class="item-q"><span class="story-label">${bi({ en: "Question", es: "Pregunta" })}</span>${bi(item.q)}</p>
      <div class="story-fields">${rows}</div>
      <div class="item-actions">
        <button type="button" class="btn btn-primary" data-story-check ${solved ? "disabled" : ""}>${bi({ en: "Check answer", es: "Comprobar" })}</button>
        ${solved ? "" : `<button type="button" class="btn hint-btn" data-story-hint></button><span class="hint-left" data-story-left></span>`}
      </div>
      <div class="story-hints" data-story-hints aria-live="polite"></div>
      <div class="feedback-box${solved ? " show ok" : ""}" data-story-fb aria-live="polite">${solved ? okHtml(item.explain) : ""}</div>`;

    const fb = host.querySelector("[data-story-fb]");
    const hintBox = host.querySelector("[data-story-hints]");
    const hintBtn = host.querySelector("[data-story-hint]");
    const inputs = /** @type {HTMLInputElement[]} */ ([...host.querySelectorAll("[data-field]")]);
    let shown = 0;

    const speakAll = () => {
      const es = o.showEs();
      const t = (/** @type {Bi} */ x) => (es ? x.es : x.en);
      o.speak([...item.facts.map(t), t(item.q)].join(". "));
    };
    host.querySelector("[data-story-speak]").addEventListener("click", speakAll);

    const total = item.hints.length;
    const leftNote = host.querySelector("[data-story-left]");
    /** The button names the next rung ("Hint 2 of 3") and how many follow it. */
    const label = () => {
      if (!hintBtn) return;
      const left = total - shown - 1;
      hintBtn.innerHTML = `💡 ${tag(`Hint ${shown + 1} of ${total}`, `Pista ${shown + 1} de ${total}`)}`;
      if (leftNote)
        leftNote.innerHTML =
          left > 0
            ? tag(
                `${left} more after this one`,
                `${left === 1 ? "queda 1 más" : `quedan ${left} más`} después de esta`,
              )
            : tag("last hint", "última pista");
    };
    /** Show hints up to `n` (1-based), keep the button honest about whether more remain. */
    const showHints = (/** @type {number} */ n) => {
      shown = Math.max(shown, Math.min(n, total));
      hintBox.innerHTML = item.hints
        .slice(0, shown)
        .map(
          (/** @type {Bi} */ h, /** @type {number} */ i) =>
            `<p class="story-hint"><strong>${tag(`Hint ${i + 1} of ${total}`, `Pista ${i + 1} de ${total}`)}</strong>${bi(h)}</p>`,
        )
        .join("");
      if (hintBtn && shown >= total) {
        hintBtn.remove();
        leftNote?.remove();
      } else label();
    };
    label();
    if (hintBtn) hintBtn.addEventListener("click", () => showHints(shown + 1));
    if (!solved && (misses[item.id] || 0) > 0) showHints(misses[item.id]);

    const check = () => {
      if (solved) return;
      const vals = inputs.map((i) => parseFloat(i.value));
      if (vals.some((v) => Number.isNaN(v))) {
        fb.className = "feedback-box show warn";
        fb.innerHTML = bi({
          en: multi ? "Fill in every box, then check." : "Type a number first, then check.",
          es: multi
            ? "Llena todas las casillas y luego comprueba."
            : "Escribe un número primero y luego comprueba.",
        });
        return;
      }
      const bad = item.fields.filter(
        (/** @type {any} */ f, /** @type {number} */ i) => !same(vals[i], f.ans),
      );
      inputs.forEach((inp, i) => {
        inp.setAttribute("aria-invalid", String(!same(vals[i], item.fields[i].ans)));
        inp.classList.toggle("err", !same(vals[i], item.fields[i].ans));
      });
      if (!bad.length) {
        inputs.forEach((i) => {
          i.disabled = true;
          i.classList.add("ok");
        });
        fb.className = "feedback-box show ok";
        fb.innerHTML = okHtml(item.explain);
        host.querySelector("[data-story-check]").setAttribute("disabled", "");
        if (hintBtn) hintBtn.remove();
        leftNote?.remove();
        o.onSolve(fb);
        return;
      }
      misses[item.id] = (misses[item.id] || 0) + 1;
      if (U.wrong) U.wrong(4); // guess resistance: assets/u4-studio-guess.js
      o.onMiss();
      const lines = bad.map((/** @type {any} */ f) => {
        const v = vals[item.fields.indexOf(f)];
        const msg = f.wrong?.[key(v)] || f.miss || item.miss;
        return multi
          ? `<div><strong>${bi(f.label)}:</strong> ${bi(msg)}</div>`
          : `<div>${bi(msg)}</div>`;
      });
      fb.className = "feedback-box show err";
      fb.innerHTML = `<p class="fb-line fb-confirm"><strong>${bi({ en: "Not yet.", es: "Todavía no." })}</strong></p><div class="fb-line fb-guide">${lines.join("")}</div>`;
      showHints(misses[item.id]);
    };
    host.querySelector("[data-story-check]").addEventListener("click", check);
    for (const i of inputs)
      i.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault(); // else the Next button that appears under focus receives this same Enter
        check();
      });

    return { fb };
  }

  U.story = { card, misses };
})();
