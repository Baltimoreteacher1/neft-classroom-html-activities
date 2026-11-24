/**
 * Hands-on layer for the family practice page.
 *
 * Every family homework page draws the lesson's model as a static picture
 * (`assets/design/family/art/math-models.mjs`). This module turns that same authored
 * `v3.model.data` into something a family can act on with a finger or a keyboard: shade, hop,
 * slide, fill, cut, balance. One implementation per `model.kind`, so a lesson never gets a
 * bespoke mini-app and 166 pages stay maintainable.
 *
 * Rules this file keeps:
 * - The data is the lesson's OWN numbers. Nothing is invented here; when the authored data cannot
 *   support an honest activity (an unknown that is not on a tick, a table that is not proportional)
 *   the builder returns null and the page keeps its static picture. No panel is better than a lie.
 * - Feedback names what the learner's action actually shows ("you marked 2 of 5 blocks"), then
 *   points at the next useful move. It never just says wrong.
 * - No native alert/confirm/prompt, no network, no timers, no scoring, no "bonus".
 * - Every control is at least 44px, works by tap and by keyboard, and carries an accessible name.
 *   Colour is never the only signal: state also changes the text and an aria-pressed/valuenow.
 * - English and Spanish are both in the DOM, one shown by the page's language classes, like every
 *   other bilingual string on the page.
 *
 * Mounted by a small loader in the shared page bundle (homework-experience-js.mjs) only when the
 * panel comes near the viewport, so a page without a panel and a family on a slow phone pay nothing.
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** One bilingual string. `.lang-en` / `.lang-es` visibility is the page's existing CSS. */
const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es || en)}</span>`;

const pairEn = (p) => String(p && typeof p === "object" ? (p.en ?? "") : (p ?? ""));
const pairEs = (p) => String(p && typeof p === "object" ? (p.es || p.en || "") : (p ?? ""));

/** A number the way a family reads it: no trailing ".0", at most two decimals. */
function fmt(n) {
  const r = Math.round(n * 100) / 100;
  return String(r);
}

/** "1,344" for a plain number, when the page's own cell wrote it with commas. */
const group = (n) => fmt(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Parse a lesson cell ("$0.10", "1,200", 23, "2.5") without guessing at prose. */
function num(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v !== "string") return NaN;
  const s = v.replace(/[$,\s]/g, "").replace(/%$/, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

const isInt = (n) => Number.isFinite(n) && Math.abs(n - Math.round(n)) < 1e-9;
const near = (a, b) => Math.abs(a - b) <= Math.max(0.005, Math.abs(b) * 1e-6);

/** A fraction from "3/4", "5 1/4" or "6". */
function frac(v) {
  const s = String(v ?? "").trim();
  const mixed = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const w = Number(mixed[1]);
    const n = Number(mixed[2]);
    const d = Number(mixed[3]);
    if (!d) return null;
    const sign = w < 0 ? -1 : 1;
    return { n: sign * (Math.abs(w) * d + n), d };
  }
  const f = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (f && Number(f[2])) return { n: Number(f[1]), d: Number(f[2]) };
  if (/^-?\d+$/.test(s)) return { n: Number(s), d: 1 };
  return null;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
function fracText(f) {
  const sign = f.n < 0 ? "-" : "";
  const n = Math.abs(f.n);
  if (f.d === 1) return sign + String(n);
  const g = gcd(n, f.d) || 1;
  const numr = n / g;
  const den = f.d / g;
  if (den === 1) return sign + String(numr);
  if (numr > den) {
    const w = Math.floor(numr / den);
    const rest = numr - w * den;
    return rest ? `${sign}${w} ${rest}/${den}` : sign + String(w);
  }
  return `${sign}${numr}/${den}`;
}

/* ── shell ──────────────────────────────────────────────────────────────── */

const CSS = `@layer patterns {
.hw-ho{margin:14px 0 0;padding:14px;border:1px solid var(--fm-border);border-radius:var(--fm-radius-md);background:var(--fm-raised)}
.hw-ho-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px}
.hw-ho-title{margin:0;font-size:var(--fm-fs-md);line-height:var(--fm-lh-ui);color:var(--fm-text)}
.hw-ho-reset{min-block-size:44px;min-inline-size:44px;padding:0 12px;border:1px solid var(--fm-border);border-radius:var(--fm-radius-sm);background:transparent;color:var(--fm-text-muted);font:inherit;font-size:var(--fm-fs-sm);cursor:pointer}
.hw-ho-ask{margin:6px 0 0;font-size:var(--fm-fs-md);line-height:var(--fm-lh-body);color:var(--fm-text)}
.hw-ho-guess{margin:10px 0 12px;padding:12px;border:1px dashed var(--fm-border);border-radius:var(--fm-radius-sm)}
.hw-ho-guess p{margin:0 0 8px;font-size:var(--fm-fs-md);line-height:var(--fm-lh-body);color:var(--fm-text)}
.hw-ho-guess p:last-child{margin-block-end:0}
.hw-ho-guess .hw-ho-reveal{padding-block-start:8px;border-block-start:1px solid var(--fm-border);font-weight:600}
.hw-ho-body{margin:12px 0 0}
.hw-ho-fb{margin:12px 0 0;min-block-size:2.6em;font-size:var(--fm-fs-md);line-height:var(--fm-lh-body);color:var(--fm-text)}
.hw-ho-fb[data-tone=near]{color:var(--fm-warning-ink,#8a5a00)}
.hw-ho-fb[data-tone=no]{color:var(--fm-error-ink)}
.hw-ho-fb[data-tone=yes]{color:var(--fm-success-ink)}
.hw-ho-btn{min-block-size:44px;min-inline-size:44px;padding:8px 14px;border:2px solid var(--fm-border);border-radius:var(--fm-radius-sm);background:var(--fm-raised);color:var(--fm-text);font:inherit;font-size:var(--fm-fs-md);cursor:pointer}
.hw-ho-btn:hover{border-color:var(--fm-primary)}
.hw-ho-btn[aria-pressed=true]{border-color:var(--fm-primary);background:var(--fm-primary);color:var(--fm-on-primary)}
.hw-ho-btn[disabled]{opacity:.55;cursor:not-allowed}
.hw-ho :is(button,input):focus-visible{outline:3px solid var(--fm-primary);outline-offset:2px}
.hw-ho-input{min-block-size:44px;inline-size:7.5em;padding:6px 10px;border:2px solid var(--fm-border);border-radius:var(--fm-radius-sm);background:var(--fm-surface,var(--fm-raised));color:var(--fm-text);font:inherit;font-size:var(--fm-fs-md)}
.hw-ho-row{display:flex;flex-wrap:wrap;gap:8px}
.hw-ho-tape{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:6px}
.hw-ho-tape .hw-ho-btn{padding:0;font-size:var(--fm-fs-sm);position:relative}
.hw-ho-tape .hw-ho-btn::before{content:"";display:block;block-size:34px;border-radius:6px;background:var(--fm-info-tint);border:1px solid var(--fm-border)}
.hw-ho-tape .hw-ho-btn[aria-pressed=true]::before{background:var(--fm-primary)}
.hw-ho-tape .hw-ho-btn[data-mark=here]::after{content:"";position:absolute;inset-block:4px;inset-inline-end:-4px;inline-size:4px;border-radius:2px;background:var(--fm-text)}
.hw-ho-table{width:100%;border-collapse:collapse;font-size:var(--fm-fs-md)}
.hw-ho-table th,.hw-ho-table td{padding:4px;border:1px solid var(--fm-border);text-align:center}
.hw-ho-table th{font-weight:600;color:var(--fm-text-muted)}
.hw-ho-table .hw-ho-input{inline-size:100%;min-inline-size:0}
.hw-ho-line{position:relative;block-size:56px;margin:4px 0 8px}
.hw-ho-line::before{content:"";position:absolute;inset-inline:0;inset-block-start:26px;block-size:3px;border-radius:2px;background:var(--fm-border)}
.hw-ho-tick{position:absolute;inset-block-start:20px;inline-size:2px;block-size:14px;background:var(--fm-border)}
.hw-ho-mark{position:absolute;inset-block-start:8px;inline-size:18px;block-size:38px;margin-inline-start:-9px;border-radius:9px;background:var(--fm-primary);color:var(--fm-on-primary);font-size:11px;line-height:1;display:grid;place-items:center}
.hw-ho-slider{inline-size:100%;min-block-size:44px;accent-color:var(--fm-primary)}
.hw-ho-pair{display:grid;gap:4px}
.hw-ho-track{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;text-align:center;font-size:var(--fm-fs-sm)}
.hw-ho-track span{padding:6px 2px;border-radius:6px;border:1px solid var(--fm-border);background:var(--fm-raised);overflow-wrap:anywhere}
.hw-ho-track span[data-on]{border-color:var(--fm-primary);box-shadow:inset 0 0 0 2px var(--fm-primary)}
.hw-ho-track span[data-hidden]{background:var(--fm-info-tint);border-style:dashed}
.hw-ho-bars{display:grid;gap:8px}
.hw-ho-bar{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;min-block-size:44px;padding:6px 10px;border:2px solid var(--fm-border);border-radius:var(--fm-radius-sm);background:var(--fm-raised);color:var(--fm-text);font:inherit;text-align:start;cursor:pointer}
.hw-ho-bar[aria-pressed=true]{border-color:var(--fm-primary)}
.hw-ho-bar-fill{block-size:10px;border-radius:5px;background:var(--fm-primary)}
.hw-ho-hint{margin:8px 0 0;font-size:var(--fm-fs-sm);color:var(--fm-text-muted)}
.hw-ho-steps{display:grid;gap:8px}
.hw-ho-step{padding:8px 10px;border-inline-start:4px solid var(--fm-border);background:var(--fm-raised);font-size:var(--fm-fs-md);line-height:var(--fm-lh-body)}
.hw-ho-step[data-state=done]{border-inline-start-color:var(--fm-success-ink)}
.hw-ho-step[data-state=now]{border-inline-start-color:var(--fm-primary);font-weight:600}
@media (prefers-reduced-motion: no-preference){.hw-ho-mark,.hw-ho-bar[aria-pressed=true]{transition:background .15s ease}}
}`;

function ensureStyle() {
  if (document.getElementById("hw-ho-style")) return;
  const s = document.createElement("style");
  s.id = "hw-ho-style";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * The lesson's own `hook.guess` / `hook.reveal`, set by mountHandsOn for the panel it is about to
 * build. Module-level because every builder calls `panel` with its own copy and none of them should
 * have to thread the hook through: there is one panel per page.
 */
let guessMeta = null;

/** One panel. `build(body, api)` returns false when this lesson's data cannot support it. */
function panel(host, { titleEn, titleEs, askEn, askEs, build }) {
  ensureStyle();
  host.textContent = "";
  host.classList.add("hw-ho");
  const head = document.createElement("div");
  head.className = "hw-ho-head";
  const h = document.createElement("h4");
  h.className = "hw-ho-title";
  h.innerHTML = bi(titleEn, titleEs);
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "hw-ho-reset";
  reset.innerHTML = bi("Start over", "Empezar de nuevo");
  head.append(h, reset);
  const ask = document.createElement("p");
  ask.className = "hw-ho-ask";
  ask.innerHTML = bi(askEn, askEs);
  const guess = guessMeta;
  guessMeta = null;
  let guessBox = null;
  if (guess?.guess?.en) {
    const g = document.createElement("div");
    g.className = "hw-ho-guess";
    const warm = document.createElement("p");
    warm.className = "hw-ho-hint";
    warm.innerHTML = bi(
      "Say your guess out loud first. A wrong guess is welcome: it shows what to look for.",
      "Digan su respuesta en voz alta. Una respuesta equivocada es bienvenida: muestra qué buscar.",
    );
    const q = document.createElement("p");
    q.innerHTML = bi(pairEn(guess.guess), pairEs(guess.guess));
    g.append(warm, q);
    if (guess.reveal?.en) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hw-ho-btn";
      btn.innerHTML = bi("I have a guess. Show me.", "Ya adiviné. Muéstrame.");
      const answer = document.createElement("p");
      answer.className = "hw-ho-reveal";
      answer.hidden = true;
      answer.innerHTML = bi(pairEn(guess.reveal), pairEs(guess.reveal));
      btn.addEventListener("click", () => {
        answer.hidden = false;
        btn.hidden = true;
        answer.setAttribute("tabindex", "-1");
        answer.focus({ preventScroll: true });
      });
      g.append(btn, answer);
    }
    guessBox = g;
  }
  const body = document.createElement("div");
  body.className = "hw-ho-body";
  const fb = document.createElement("p");
  fb.className = "hw-ho-fb";
  fb.setAttribute("role", "status");
  fb.setAttribute("aria-live", "polite");
  host.append(head, ...(guessBox ? [guessBox] : []), ask, body, fb);

  let tries = 0;
  const api = {
    say(en, es, tone) {
      fb.dataset.tone = tone || "";
      fb.innerHTML = bi(en, es);
    },
    reset() {
      tries = 0;
      fb.dataset.tone = "";
      fb.innerHTML = "";
      body.textContent = "";
      build(body, api);
    },
    /** Count a miss and, after the second, offer the lesson's own nudge. */
    miss(en, es) {
      tries += 1;
      api.say(en, es, "no");
      if (tries === 2) {
        const hint = document.createElement("p");
        hint.className = "hw-ho-hint";
        hint.innerHTML = bi(
          "Take another look at the picture above. It uses the same numbers.",
          "Mira otra vez el dibujo de arriba. Usa los mismos números.",
        );
        body.append(hint);
      }
    },
  };
  reset.addEventListener("click", () => {
    body.querySelectorAll(".hw-ho-hint").forEach((n) => n.remove());
    api.reset();
  });
  if (build(body, api) === false) {
    host.textContent = "";
    host.classList.remove("hw-ho");
    return false;
  }
  return true;
}

/* ── tape: put the line after the block that ends the part ───────────────── */

function tape(data, host) {
  const parts = Math.round(Number(data?.parts));
  const highlight = Math.round(Number(data?.highlight));
  if (!isInt(parts) || !isInt(highlight) || parts < 2 || parts > 10) return false;
  if (highlight < 1 || highlight > parts) return false;
  const partEn = pairEn(data.partLabel);
  const partEs = pairEs(data.partLabel);
  const blockEn = pairEn(data.blockLabel);
  const blockEs = pairEs(data.blockLabel);
  const wholeEn = pairEn(data.wholeLabel);
  const wholeEs = pairEs(data.wholeLabel);

  return panel(host, {
    titleEn: "Move the line",
    titleEs: "Mueve la línea",
    askEn: `Tap the block that ends ${partEn || "the part"}. The line goes after it.`,
    askEs: `Toca el bloque donde termina ${partEs || "la parte"}. La línea va después.`,
    build(body, api) {
      const row = document.createElement("div");
      row.className = "hw-ho-tape";
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", `1 to ${parts}`);
      const blocks = [];
      for (let i = 1; i <= parts; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hw-ho-btn";
        b.textContent = String(i);
        b.setAttribute("aria-pressed", "false");
        b.setAttribute(
          "aria-label",
          `Put the line after block ${i} of ${parts} / Poner la línea después del bloque ${i} de ${parts}`,
        );
        b.addEventListener("click", () => {
          blocks.forEach((x) => {
            x.setAttribute("aria-pressed", "false");
            delete x.dataset.mark;
          });
          b.setAttribute("aria-pressed", "true");
          b.dataset.mark = "here";
          const marked = i;
          if (marked === highlight) {
            api.say(
              `Yes. The line goes after block ${highlight}, so the part is ${highlight} of ${parts} equal blocks. ` +
                `${highlight}/${parts} of the whole is ${partEn || "the part"}.` +
                (blockEn ? ` Each block is ${blockEn}.` : "") +
                (wholeEn ? ` The whole is ${wholeEn}.` : ""),
              `Sí. La línea va después del bloque ${highlight}, así que la parte es ${highlight} de ${parts} bloques iguales. ` +
                `${highlight}/${parts} del total es ${partEs || "la parte"}.` +
                (blockEs ? ` Cada bloque es ${blockEs}.` : "") +
                (wholeEs ? ` El total es ${wholeEs}.` : ""),
              "yes",
            );
            return;
          }
          const dir = marked < highlight ? "more" : "fewer";
          api.miss(
            `You marked ${marked} of ${parts} blocks. That is ${marked}/${parts}. Compare it with the label: ${partEn || "the part"}. Is it ${dir} blocks?`,
            `Marcaste ${marked} de ${parts} bloques. Eso es ${marked}/${parts}. Compáralo con la etiqueta: ${partEs || "la parte"}. ¿Son ${dir === "more" ? "más" : "menos"} bloques?`,
          );
        });
        blocks.push(b);
        row.append(b);
      }
      body.append(row);
    },
  });
}

/* ── ratiotable: fill the ? cell from the table's own ratio ──────────────── */

function ratiotable(data, host) {
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const unknown = Array.isArray(data?.unknownCells) ? data.unknownCells : [];
  if (!rows.length) return false;

  // The table must be proportional, or there is no honest single answer.
  let ratio = null;
  for (const row of rows) {
    const a = num(row?.[0]);
    const b = num(row?.[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) continue;
    const q = b / a;
    if (ratio === null) ratio = q;
    else if (!near(ratio, q)) return false;
  }
  if (!Number.isFinite(ratio) || ratio <= 0) return false;

  let c0 = 1;
  let known = NaN;
  if (unknown.length) {
    const [r0, uc] = unknown[0];
    if (!rows[r0]) return false;
    c0 = uc;
    known = num(rows[r0][1 - c0]);
    if (!Number.isFinite(known)) return false;
  } else {
    // No cell is marked ?: carry the pattern one row further, with the factor the lesson itself drew
    // on its arrow ("×10"). Nothing is invented except the row position.
    const last = rows.length - 1;
    const arrow = (data.arrows || []).find((a) => a.to === last);
    const factor = arrow ? num(String(pairEn(arrow.label)).replace(/^[×xX]\s*/, "")) : NaN;
    const a = num(rows[last]?.[0]);
    const b = num(rows[last]?.[1]);
    if (!Number.isFinite(factor) || factor <= 0 || !Number.isFinite(a) || !Number.isFinite(b)) {
      return false;
    }
    c0 = 1;
    known = a * factor;
  }
  const answer = c0 === 1 ? known * ratio : known / ratio;
  if (!Number.isFinite(answer) || answer < 0) return false;
  const nextRow = !unknown.length;

  // Write the answer the way this column is written in the table ("$0.10", "1,200").
  const sample = rows.map((row) => row?.[c0]).find((v) => typeof v === "string" && /\d/.test(v));
  const money = typeof sample === "string" && /\$/.test(sample);
  const grouped = typeof sample === "string" && /,/.test(sample);
  const shown = money
    ? `$${answer.toFixed(2)}`
    : grouped && Math.abs(answer) >= 1000
      ? group(answer)
      : fmt(answer);

  const hA = pairEn(data.headers?.[0]) || "A";
  const hB = pairEn(data.headers?.[1]) || "B";
  const hAes = pairEs(data.headers?.[0]) || "A";
  const hBes = pairEs(data.headers?.[1]) || "B";
  // The cell the family reads first: the ? row's known partner, or the last row the table actually shows.
  const stopA = nextRow ? num(rows[rows.length - 1]?.[0]) : known;
  const askWordEn = fmt(Number.isFinite(stopA) ? stopA : known);
  const askWordEs = askWordEn;

  return panel(host, {
    titleEn: nextRow ? "Carry the pattern on" : "Fill the missing cell",
    titleEs: nextRow ? "Sigue el patrón" : "Completa la casilla que falta",
    askEn: nextRow
      ? `The table stops at ${askWordEn} ${hA}. Keep the same ratio for the next row and find its ${hB}.`
      : `The row with ${askWordEn} ${hA} is missing its ${hB}. Every row keeps the same ratio.`,
    askEs: nextRow
      ? `La tabla termina en ${askWordEs} ${hAes}. Sigue la misma razón para la siguiente fila y halla ${hBes}.`
      : `A la fila con ${askWordEs} ${hAes} le falta ${hBes}. Todas las filas guardan la misma razón.`,
    build(body, api) {
      const wrap = document.createElement("div");
      wrap.innerHTML = `<table class="hw-ho-table"><thead><tr><th>${bi(hA, hAes)}</th><th>${bi(hB, hBes)}</th></tr></thead><tbody></tbody></table>`;
      const tbody = wrap.querySelector("tbody");
      rows.forEach((row, r) => {
        const tr = document.createElement("tr");
        row.forEach((cell, c) => {
          const td = document.createElement("td");
          const isUnknown = unknown.some(([ur, uc]) => ur === r && uc === c);
          if (isUnknown) {
            const input = document.createElement("input");
            input.className = "hw-ho-input";
            input.type = "text";
            input.inputMode = "decimal";
            input.setAttribute("autocomplete", "off");
            input.setAttribute(
              "aria-label",
              `Missing ${c === 0 ? hA : hB} in the row with ${fmt(known)} / Falta ${c === 0 ? hAes : hBes} en la fila con ${fmt(known)}`,
            );
            input.placeholder = "?";
            if (typeof cell === "string" && cell.trim() && cell !== "?") input.value = "";
            const check = () => {
              const typed = num(input.value);
              if (!Number.isFinite(typed)) return;
              if (near(typed, answer)) {
                api.say(
                  `Yes: ${shown}. Look at another row — the pair grows by the same factor every time, so ${fmt(known)} × ${fmt(ratio)} = ${shown}.`,
                  `Sí: ${shown}. Mira otra fila: el par crece con el mismo factor siempre, así que ${fmt(known)} × ${fmt(ratio)} = ${shown}.`,
                  "yes",
                );
                input.dataset.done = "1";
              } else {
                api.miss(
                  `Not yet. Your number keeps a different ratio than the other rows. Try ${fmt(known)} times the number every row shares.`,
                  `Todavía no. Tu número guarda una razón distinta a la de las otras filas. Prueba ${fmt(known)} por el número que comparten todas las filas.`,
                );
              }
            };
            input.addEventListener("change", check);
            input.addEventListener("keydown", (e) => {
              if (e.key === "Enter") check();
            });
            td.append(input);
          } else {
            td.innerHTML = bi(pairEn(cell), pairEs(cell));
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      if (nextRow) {
        const tr = document.createElement("tr");
        const first = document.createElement("td");
        first.innerHTML = bi(fmt(known), fmt(known));
        const second = document.createElement("td");
        const input = document.createElement("input");
        input.className = "hw-ho-input";
        input.type = "text";
        input.inputMode = "decimal";
        input.setAttribute("autocomplete", "off");
        input.placeholder = "?";
        input.setAttribute("aria-label", `${hB} for the next row / ${hBes} de la siguiente fila`);
        second.append(input);
        tr.append(first, second);
        tbody.append(tr);
      }
      const go = document.createElement("button");
      go.type = "button";
      go.className = "hw-ho-btn";
      go.style.marginBlockStart = "10px";
      go.innerHTML = bi("Check my answer", "Revisar mi respuesta");
      go.addEventListener("click", () => {
        const input = tbody.querySelector(".hw-ho-input");
        if (input) {
          input.dispatchEvent(new Event("change"));
          if (!input.dataset.done) input.focus();
        }
      });
      body.append(wrap, go);
    },
  });
}

/* ── numberline: hop to the point the lesson asks about ──────────────────── */

function numberline(data, host) {
  const min = Number(data?.min);
  const max = Number(data?.max);
  const step = Number(data?.step);
  const points = Array.isArray(data?.points) ? data.points : [];
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step)) return false;
  if (max <= min || step <= 0) return false;
  const target = points.find((p) => p.kind === "answer") || points.find((p) => p.kind === "unknown");
  if (!target) return false;
  const targetValue = Number(target.value);
  if (!Number.isFinite(targetValue)) return false;
  /* The answer is often written between the picture's ticks (500 on a line that ticks every 60).
     Hop by the largest step that lands on both a tick and the answer, so the activity is honest
     about the size of a hop instead of snapping the answer onto the wrong tick. */
  const mil = (v) => Math.round(v * 1000);
  const hopUnits = gcd(mil(step), mil(targetValue - min)) / 1000;
  if (!(hopUnits > 0)) return false;
  const steps = Math.round((max - min) / hopUnits);
  if (steps < 2 || steps > 60) return false;
  const want = Math.round((targetValue - min) / hopUnits);
  const hop = hopUnits;
  const unitEn = pairEn(data.unit);
  const unitEs = pairEs(data.unit);
  const labelEn = target.label && typeof target.label === "object" ? pairEn(target.label) : String(target.label ?? "");
  const labelEs = target.label && typeof target.label === "object" ? pairEs(target.label) : String(target.label ?? "");

  return panel(host, {
    titleEn: "Hop to the answer",
    titleEs: "Salta a la respuesta",
    askEn: `The question mark is one hop. Use the arrows or tap the line to hop by ${fmt(hop)}${unitEn ? ` ${unitEn}` : ""}.`,
    askEs: `La interrogación está a un salto. Usa las flechas o toca la línea para saltar de ${fmt(hop)}${unitEs ? ` ${unitEs}` : ""}.`,
    build(body, api) {
      const line = document.createElement("div");
      line.className = "hw-ho-line";
      line.setAttribute("role", "presentation");
      const ticks = [];
      for (let i = 0; i <= steps; i++) {
        const t = document.createElement("span");
        t.className = "hw-ho-tick";
        t.style.insetInlineStart = `${(i / steps) * 100}%`;
        ticks.push(t);
        line.append(t);
      }
      const mark = document.createElement("span");
      mark.className = "hw-ho-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = "0";
      line.append(mark);

      const sr = document.createElement("input");
      sr.type = "range";
      sr.className = "hw-ho-slider";
      sr.min = "0";
      sr.max = String(steps);
      sr.step = "1";
      sr.value = "0";
      sr.setAttribute(
        "aria-label",
        `${"Hop along the number line"} / ${"Salta por la recta numérica"}`,
      );
      const read = document.createElement("p");
      read.className = "hw-ho-hint";
      read.setAttribute("aria-live", "polite");
      let cur = 0;
      const paint = () => {
        const value = min + cur * hop;
        mark.style.insetInlineStart = `${(cur / steps) * 100}%`;
        mark.textContent = fmt(value);
        sr.setAttribute("aria-valuetext", fmt(value));
        read.innerHTML = bi(`You are at ${fmt(value)}${unitEn ? ` ${unitEn}` : ""}.`, `Estás en ${fmt(value)}${unitEs ? ` ${unitEs}` : ""}.`);
        const landing = min + want * hop;
        if (cur === want) {
          api.say(
            `You landed on ${fmt(landing)}${unitEn ? ` ${unitEn}` : ""}.${labelEn ? ` That point is ${labelEn}.` : ""} Count the hops from ${fmt(min)}: ${want} hops of ${fmt(hop)}.`,
            `Llegaste a ${fmt(landing)}${unitEs ? ` ${unitEs}` : ""}.${labelEs ? ` Ese punto es ${labelEs}.` : ""} Cuenta los saltos desde ${fmt(min)}: ${want} saltos de ${fmt(hop)}.`,
            "yes",
          );
        } else {
          api.say(
            cur < want
              ? `You are at ${fmt(value)}. The question mark is further along. Keep hopping right.`
              : `You are at ${fmt(value)}. The question mark is behind you. Hop left.`,
            cur < want
              ? `Estás en ${fmt(value)}. La interrogación está más adelante. Sigue saltando a la derecha.`
              : `Estás en ${fmt(value)}. La interrogación quedó atrás. Salta a la izquierda.`,
            cur === want ? "yes" : "near",
          );
        }
      };
      sr.addEventListener("input", () => {
        cur = Number(sr.value);
        paint();
      });
      line.addEventListener("click", (e) => {
        const box = line.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
        cur = Math.round(ratio * steps);
        sr.value = String(cur);
        paint();
        if (cur !== want) sr.focus();
      });
      body.append(line, sr, read);
    },
  });
}

/* ── doubleline: slide to the column the question is about ───────────────── */

function doubleline(data, host) {
  const top = data?.top;
  const bottom = data?.bottom;
  if (!Array.isArray(top?.ticks) || !Array.isArray(bottom?.ticks)) return false;
  const indexes = Array.isArray(data?.unknown) ? data.unknown : [];
  if (!indexes.length) return false;
  const n = Math.min(top.ticks.length, bottom.ticks.length);
  if (n < 2) return false;
  const want = indexes[0];
  if (want < 0 || want >= n) return false;
  let pairs = null;
  for (let i = 0; i < n; i++) {
    const t = num(top.ticks[i]);
    const b = num(bottom.ticks[i]);
    if (Number.isFinite(t) && Number.isFinite(b) && t !== 0) {
      pairs = { t, b, rate: b / t };
      break;
    }
  }
  const topLabelEn = pairEn(top.label);
  const topLabelEs = pairEs(top.label);
  const bottomLabelEn = pairEn(bottom.label);
  const bottomLabelEs = pairEs(bottom.label);

  return panel(host, {
    titleEn: "Slide to the question",
    titleEs: "Desliza hasta la pregunta",
    askEn: `Move the slider until both rows line up on the question mark. Watch the pair move together.`,
    askEs: `Mueve el control hasta que las dos filas coincidan en la interrogación. Mira cómo se mueven juntas las dos filas.`,
    build(body, api) {
      const wrap = document.createElement("div");
      wrap.className = "hw-ho-pair";
      const track = (row, isUnknown) => {
        const el = document.createElement("div");
        el.className = "hw-ho-track";
        for (let i = 0; i < n; i++) {
          const cell = document.createElement("span");
          const hidden = isUnknown && indexes.includes(i);
          if (hidden) {
            cell.dataset.hidden = "";
            cell.innerHTML = bi("?", "?");
          } else {
            cell.innerHTML = bi(pairEn(row.ticks[i]), pairEs(row.ticks[i]));
          }
          el.append(cell);
        }
        return el;
      };
      const topTrack = track(top, false);
      const bottomTrack = track(bottom, true);
      wrap.append(topTrack, bottomTrack);
      const slider = document.createElement("input");
      slider.type = "range";
      slider.className = "hw-ho-slider";
      slider.min = "0";
      slider.max = String(n - 1);
      slider.step = "1";
      slider.value = "0";
      slider.setAttribute("aria-label", "Column / Columna");
      const read = document.createElement("p");
      read.className = "hw-ho-hint";
      const paint = () => {
        const i = Number(slider.value);
        [topTrack, bottomTrack].forEach((tr) =>
          Array.from(tr.children).forEach((c, j) => {
            if (j === i) c.dataset.on = "";
            else delete c.dataset.on;
          }),
        );
        const hidden = indexes.includes(i);
        read.innerHTML = hidden
          ? bi(
              `Column ${i + 1} is the question: ${pairEn(top.ticks[i])} ${topLabelEn} with the ${bottomLabelEn} unknown.`,
              `La columna ${i + 1} es la pregunta: ${pairEs(top.ticks[i])} ${topLabelEs} con ${bottomLabelEs} desconocido.`,
            )
          : bi(
              `Column ${i + 1}: ${pairEn(top.ticks[i])} ${topLabelEn} and ${pairEn(bottom.ticks[i])} ${bottomLabelEn}.`,
              `Columna ${i + 1}: ${pairEs(top.ticks[i])} ${topLabelEs} y ${pairEs(bottom.ticks[i])} ${bottomLabelEs}.`,
            );
        if (hidden) {
          const t = num(top.ticks[i]);
          if (pairs && Number.isFinite(t)) {
            api.say(
              `Found it. Every column keeps the same rate: ${fmt(pairs.t)} ${topLabelEn} goes with ${fmt(pairs.b)} ${bottomLabelEn}, so ${fmt(t)} × ${fmt(pairs.rate)} = ${fmt(t * pairs.rate)}.`,
              `Lo encontraste. Todas las columnas guardan la misma tasa: ${fmt(pairs.t)} ${topLabelEs} van con ${fmt(pairs.b)} ${bottomLabelEs}, así que ${fmt(t)} × ${fmt(pairs.rate)} = ${fmt(t * pairs.rate)}.`,
              "yes",
            );
          } else {
            api.say(
              `Found it: this is the column to solve. Use a column you already know to find the rate, then apply it here.`,
              `Lo encontraste: esta es la columna que hay que resolver. Usa una columna que ya conoces para encontrar la tasa y aplícala aquí.`,
              "yes",
            );
          }
        } else {
          api.say(
            `Column ${i + 1} is not the question. Slide toward the column with the question mark.`,
            `La columna ${i + 1} no es la pregunta. Desliza hacia la columna con la interrogación.`,
            "near",
          );
        }
      };
      slider.addEventListener("input", paint);
      body.append(wrap, slider, read);
      paint();
    },
  });
}

/* ── barplot: read the bars and put them in order ────────────────────────── */

function barplot(data, host) {
  const cats = Array.isArray(data?.categories) ? data.categories : [];
  if (cats.length < 2 || cats.length > 8) return false;
  if (!cats.every((c) => Number.isFinite(Number(c?.value)))) return false;
  const unitEn = pairEn(data.unit);
  const unitEs = pairEs(data.unit);
  const sorted = [...cats].map((c) => Number(c.value)).sort((a, b) => a - b);

  return panel(host, {
    titleEn: "Order the bars",
    titleEs: "Ordena las barras",
    askEn: "Tap the bars from the smallest value to the largest. The picture above has the same bars.",
    askEs: "Toca las barras del valor más pequeño al más grande. El dibujo de arriba tiene las mismas barras.",
    build(body, api) {
      const list = document.createElement("div");
      list.className = "hw-ho-bars";
      const max = Math.max(...cats.map((c) => Number(c.value)), 1);
      let picked = 0;
      const order = [];
      const orderEs = [];
      const buttons = cats.map((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hw-ho-bar";
        b.setAttribute("aria-pressed", "false");
        /* The bar length is the only visible number, so the value goes in the accessible name:
           without it, ordering the bars by size is impossible for a screen reader. */
        b.setAttribute(
          "aria-label",
          `${pairEn(c.label)}: ${fmt(Number(c.value))} / ${pairEs(c.label)}: ${fmt(Number(c.value))}`,
        );
        b.innerHTML = `<span>${bi(pairEn(c.label), pairEs(c.label))}</span><span class="hw-ho-bar-fill" style="inline-size:${Math.max(6, (Number(c.value) / max) * 60)}px"></span>`;
        b.addEventListener("click", () => {
          if (b.dataset.done) return;
          const value = Number(c.value);
          const need = sorted[picked];
          if (value !== need) {
            const prev = picked > 0 ? sorted[picked - 1] : null;
            api.miss(
              prev === null
                ? `${fmt(value)} is not the smallest. Look for the shortest bar in the picture.`
                : `${fmt(value)} is not next. You already picked ${fmt(prev)}; the next one must be bigger than that.`,
              prev === null
                ? `${fmt(value)} no es el más pequeño. Busca la barra más corta en el dibujo.`
                : `${fmt(value)} no sigue. Ya elegiste ${fmt(prev)}; el siguiente debe ser mayor.`,
            );
            return;
          }
          b.dataset.done = "1";
          b.setAttribute("aria-pressed", "true");
          b.setAttribute("disabled", "");
          order.push(pairEn(c.label));
          orderEs.push(pairEs(c.label));
          picked += 1;
          if (picked === sorted.length) {
            api.say(
              `Smallest to largest: ${order.join(", ")}${unitEn ? ` (${unitEn})` : ""}. The shortest bar is the lowest value.`,
              `De menor a mayor: ${orderEs.join(", ")}${unitEs ? ` (${unitEs})` : ""}. La barra más corta es el valor más bajo.`,
              "yes",
            );
          } else {
            api.say(
              `Good: ${fmt(value)} is next. Keep going.`,
              `Bien: ${fmt(value)} sigue. Continúa.`,
              "near",
            );
          }
        });
        return b;
      });
      buttons.forEach((b) => list.append(b));
      body.append(list);
    },
  });
}

/* ── area: cut and slide, then the area follows ──────────────────────────── */

function area(data, host) {
  const shape = data?.shape;
  const dims = data?.dims || {};
  const base = Number(dims.base);
  const height = Number(dims.height);
  const base1 = Number(dims.base1);
  const base2 = Number(dims.base2);
  if (!["rectangle", "parallelogram", "triangle", "trapezoid"].includes(shape)) return false;
  const trapezoid = shape === "trapezoid";
  if (trapezoid) {
    if (![base1, base2, height].every((n) => Number.isFinite(n) && n > 0)) return false;
  } else if (![base, height].every((n) => Number.isFinite(n) && n > 0)) {
    return false;
  }
  const unit = String(data.unit || "");
  const top = trapezoid ? base1 : base;
  const bottom = trapezoid ? base2 : base;
  const result = trapezoid
    ? ((base1 + base2) / 2) * height
    : shape === "triangle"
      ? (base * height) / 2
      : base * height;

  return panel(host, {
    titleEn: "Cut, slide, then find the area",
    titleEs: "Corta, desliza y halla el área",
    askEn: trapezoid
      ? `The trapezoid has bases ${fmt(base1)} and ${fmt(base2)} and height ${fmt(height)}${unit ? ` ${unit}` : ""}. Do the steps, then type the area.`
      : `The ${shape} has base ${fmt(base)} and height ${fmt(height)}${unit ? ` ${unit}` : ""}. Do the steps, then type the area.`,
    askEs: trapezoid
      ? `El trapecio tiene bases ${fmt(base1)} y ${fmt(base2)} y altura ${fmt(height)}${unit ? ` ${unit}` : ""}. Haz los pasos y escribe el área.`
      : `La figura tiene base ${fmt(base)} y altura ${fmt(height)}${unit ? ` ${unit}` : ""}. Haz los pasos y escribe el área.`,
    build(body, api) {
      const steps = document.createElement("div");
      steps.className = "hw-ho-steps";
      const plan = trapezoid
        ? [
            ["Copy the trapezoid.", "Copia el trapecio."],
            ["Turn the copy and join it. Together they make a parallelogram.", "Gira la copia y únela. Juntas forman un paralelogramo."],
            [
              `The parallelogram's base is ${fmt(base1)} + ${fmt(base2)} = ${fmt(base1 + base2)}. One trapezoid is half of it.`,
              `La base del paralelogramo es ${fmt(base1)} + ${fmt(base2)} = ${fmt(base1 + base2)}. Un trapecio es la mitad.`,
            ],
          ]
        : shape === "triangle"
          ? [
              ["Copy the triangle.", "Copia el triángulo."],
              ["Turn the copy and join it. Together they make a rectangle.", "Gira la copia y únela. Juntas forman un rectángulo."],
              [`The rectangle is ${fmt(base)} by ${fmt(height)}. One triangle is half of it.`, `El rectángulo es ${fmt(base)} por ${fmt(height)}. Un triángulo es la mitad.`],
            ]
          : [
              ["Cut the slanted end off.", "Corta el extremo inclinado."],
              ["Slide that piece to the other end.", "Desliza esa pieza al otro extremo."],
              [`Now it is a rectangle ${fmt(base)} by ${fmt(height)}. Same area as before.`, `Ahora es un rectángulo de ${fmt(base)} por ${fmt(height)}. La misma área que antes.`],
            ];
      const items = plan.map(([en, es], i) => {
        const li = document.createElement("p");
        li.className = "hw-ho-step";
        li.dataset.state = i === 0 ? "now" : "later";
        li.innerHTML = bi(en, es);
        steps.append(li);
        return li;
      });
      const next = document.createElement("button");
      next.type = "button";
      next.className = "hw-ho-btn";
      next.style.marginBlockStart = "10px";
      next.innerHTML = bi("Next step", "Siguiente paso");
      let step = 1;
      next.addEventListener("click", () => {
        if (step >= items.length) return;
        items[step - 1].dataset.state = "done";
        items[step].dataset.state = "now";
        step += 1;
        if (step >= items.length) next.setAttribute("disabled", "");
        api.say(
          `${step} of ${items.length} steps done.`,
          `${step} de ${items.length} pasos hechos.`,
          "near",
        );
      });
      const row = document.createElement("div");
      row.className = "hw-ho-row";
      row.style.marginBlockStart = "10px";
      const input = document.createElement("input");
      input.className = "hw-ho-input";
      input.type = "text";
      input.inputMode = "decimal";
      input.placeholder = "?";
      input.setAttribute(
        "aria-label",
        `Area in square ${unit || "units"} / Área en ${unit || "unidades"} cuadradas`,
      );
      const go = document.createElement("button");
      go.type = "button";
      go.className = "hw-ho-btn";
      go.innerHTML = bi("Check the area", "Revisar el área");
      const check = () => {
        const typed = num(input.value);
        if (!Number.isFinite(typed)) return;
        if (near(typed, result)) {
          api.say(
            trapezoid
              ? `Yes: ${fmt(result)} square ${unit || "units"}. Add the bases (${fmt(base1)} + ${fmt(base2)} = ${fmt(base1 + base2)}), multiply by the height (${fmt(base1 + base2)} × ${fmt(height)} = ${fmt((base1 + base2) * height)}), then halve it.`
              : shape === "triangle"
                ? `Yes: ${fmt(result)} square ${unit || "units"}. ${fmt(top)} × ${fmt(height)} = ${fmt(base * height)}, and half of that is ${fmt(result)}.`
                : `Yes: ${fmt(result)} square ${unit || "units"}, because ${fmt(top)} × ${fmt(height)} = ${fmt(result)}.`,
            trapezoid
              ? `Sí: ${fmt(result)} ${unit || "unidades"} cuadradas. Suma las bases (${fmt(base1)} + ${fmt(base2)} = ${fmt(base1 + base2)}), multiplica por la altura (${fmt(base1 + base2)} × ${fmt(height)} = ${fmt((base1 + base2) * height)}) y divide entre 2.`
              : shape === "triangle"
                ? `Sí: ${fmt(result)} ${unit || "unidades"} cuadradas. ${fmt(top)} × ${fmt(height)} = ${fmt(base * height)}, y la mitad es ${fmt(result)}.`
                : `Sí: ${fmt(result)} ${unit || "unidades"} cuadradas, porque ${fmt(top)} × ${fmt(height)} = ${fmt(result)}.`,
            "yes",
          );
        } else {
          api.miss(
            trapezoid
              ? `Not yet. Two trapezoids make one parallelogram. Add the two bases first, then multiply by the height and halve it.`
              : shape === "triangle"
                ? `Not yet. A triangle is half of a rectangle, so multiply base × height first, then halve it.`
                : `Not yet. After the slide it is a rectangle: multiply base × height.`,
            trapezoid
              ? `Todavía no. Dos trapecios forman un paralelogramo. Suma las dos bases, multiplica por la altura y divide entre 2.`
              : shape === "triangle"
                ? `Todavía no. Un triángulo es la mitad de un rectángulo: multiplica base × altura y luego divide entre 2.`
                : `Todavía no. Después de deslizar es un rectángulo: multiplica base × altura.`,
          );
        }
      };
      go.addEventListener("click", check);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") check();
      });
      row.append(input, go);
      body.append(steps, next, row);
    },
  });
}

/* ── grid: shade the percent the lesson is about ─────────────────────────── */

function grid(data, host) {
  const rows = Math.round(Number(data?.rows));
  const cols = Math.round(Number(data?.cols));
  const filled = Math.round(Number(data?.filled));
  if (!isInt(rows) || !isInt(cols) || !isInt(filled)) return false;
  const total = rows * cols;
  if (total < 10 || total > 200 || filled < 0 || filled > total) return false;
  if (total !== 100) return false; // a percent grid is the only grid this activity is honest about

  return panel(host, {
    titleEn: "Shade the percent",
    titleEs: "Sombrea el porcentaje",
    askEn: `Use the buttons to shade ${filled} of the 100 squares. Then read the percent.`,
    askEs: `Usa los botones para sombrear ${filled} de los 100 cuadros. Luego lee el porcentaje.`,
    build(body, api) {
      const gridEl = document.createElement("div");
      gridEl.style.display = "grid";
      gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      gridEl.style.gap = "2px";
      gridEl.style.maxInlineSize = "260px";
      gridEl.setAttribute("aria-hidden", "true");
      const cells = [];
      for (let i = 0; i < total; i++) {
        const c = document.createElement("span");
        c.style.aspectRatio = "1";
        c.style.borderRadius = "2px";
        c.style.border = "1px solid var(--fm-border)";
        cells.push(c);
        gridEl.append(c);
      }
      const read = document.createElement("p");
      read.className = "hw-ho-hint";
      let n = 0;
      const paint = () => {
        cells.forEach((c, i) => {
          c.style.background = i < n ? "var(--fm-primary)" : "transparent";
        });
        read.innerHTML = bi(
          `${n} of ${total} squares shaded = ${n}%.`,
          `${n} de ${total} cuadros sombreados = ${n}%.`,
        );
        if (n === filled) {
          api.say(
            `${n} of 100 squares is ${n}%. Percent means "out of 100", so the count and the percent are the same number here.`,
            `${n} de 100 cuadros es ${n}%. Por ciento significa "de cada 100", así que aquí el conteo y el porcentaje son el mismo número.`,
            "yes",
          );
        } else if (n > filled) {
          api.say(
            `You have ${n}. That is more squares than the question asks for.`,
            `Tienes ${n}. Son más cuadros de los que pide la pregunta.`,
            "no",
          );
        } else {
          api.say(`You have ${n} of ${filled}. Keep going.`, `Tienes ${n} de ${filled}. Continúa.`, "near");
        }
      };
      const btn = (label, delta) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hw-ho-btn";
        b.textContent = label;
        b.setAttribute("aria-label", `${label} / ${label}`);
        b.addEventListener("click", () => {
          n = Math.max(0, Math.min(total, n + delta));
          paint();
        });
        return b;
      };
      const row = document.createElement("div");
      row.className = "hw-ho-row";
      row.append(btn("−10", -10), btn("−1", -1), btn("+1", 1), btn("+10", 10));
      body.append(gridEl, read, row);
      paint();
    },
  });
}

/* ── kcf: keep, change, flip, then divide ────────────────────────────────── */

function kcf(data, host) {
  const a = frac(data?.dividend);
  const b = frac(data?.divisor);
  if (!a || !b || b.n === 0) return false;
  const flipped = { n: b.d, d: b.n };
  const product = { n: a.n * flipped.n, d: a.d * flipped.d };
  const quotient = fracText(product);
  const askEn = `${a.n}/${a.d} ÷ ${b.n}/${b.d}`;
  const askEs = `${a.n}/${a.d} ÷ ${b.n}/${b.d}`;

  return panel(host, {
    titleEn: "Keep, change, flip",
    titleEs: "Conserva, cambia, invierte",
    askEn: `Do the three steps for ${askEn}, in order.`,
    askEs: `Haz los tres pasos para ${askEs}, en orden.`,
    build(body, api) {
      const steps = document.createElement("div");
      steps.className = "hw-ho-steps";
      const texts = [
        [`Keep the first fraction: ${a.n}/${a.d}.`, `Conserva la primera fracción: ${a.n}/${a.d}.`],
        ["Change ÷ to ×.", "Cambia ÷ por ×."],
        [`Flip the second fraction: ${b.n}/${b.d} becomes ${b.d}/${b.n}.`, `Invierte la segunda fracción: ${b.n}/${b.d} se vuelve ${b.d}/${b.n}.`],
      ];
      const items = texts.map(([en, es], i) => {
        const p = document.createElement("p");
        p.className = "hw-ho-step";
        p.dataset.state = i === 0 ? "now" : "later";
        p.innerHTML = bi(en, es);
        steps.append(p);
        return p;
      });
      const row = document.createElement("div");
      row.className = "hw-ho-row";
      row.style.marginBlockStart = "10px";
      const names = [
        ["Keep", "Conserva"],
        ["Change", "Cambia"],
        ["Flip", "Invierte"],
      ];
      let step = 0;
      const buttons = names.map(([en, es], i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hw-ho-btn";
        b.innerHTML = bi(en, es);
        b.addEventListener("click", () => {
          if (i !== step) {
            api.miss(
              step === 0
                ? "Start by keeping the first fraction exactly as it is."
                : step === 1
                  ? "Next, change the division sign to multiplication."
                  : "Next, flip the second fraction upside down.",
              step === 0
                ? "Primero conserva la primera fracción tal como está."
                : step === 1
                  ? "Ahora cambia el signo de división por multiplicación."
                  : "Ahora invierte la segunda fracción.",
            );
            return;
          }
          items[step].dataset.state = "done";
          step += 1;
          if (step < items.length) items[step].dataset.state = "now";
          b.setAttribute("aria-pressed", "true");
          b.setAttribute("disabled", "");
          if (step === items.length) {
            api.say(
              `Done. Now multiply straight across: ${a.n}/${a.d} × ${b.d}/${b.n} = ${product.n}/${product.d} = ${quotient}. Dividing by ${b.n}/${b.d} is the same as multiplying by ${b.d}/${b.n}.`,
              `Listo. Ahora multiplica de frente: ${a.n}/${a.d} × ${b.d}/${b.n} = ${product.n}/${product.d} = ${quotient}. Dividir entre ${b.n}/${b.d} es lo mismo que multiplicar por ${b.d}/${b.n}.`,
              "yes",
            );
          } else {
            api.say(`${step} of 3 steps done.`, `${step} de 3 pasos hechos.`, "near");
          }
        });
        row.append(b);
        return b;
      });
      body.append(steps, row);
      return buttons.length > 0;
    },
  });
}

/* ── balance: add weight until the pans level ────────────────────────────── */

function balance(data, host) {
  const left = Array.isArray(data?.left) ? data.left : [];
  const right = Array.isArray(data?.right) ? data.right : [];
  const unknown = String(data?.unknown ?? "");
  if (!unknown) return false;
  const count = (arr) => {
    let k = 0;
    let known = 0;
    let bad = false;
    for (const v of arr) {
      if (String(v) === unknown) k += 1;
      else if (Number.isFinite(num(v))) known += num(v);
      else bad = true;
    }
    return bad ? null : { k, known };
  };
  const l = count(left);
  const r = count(right);
  if (!l || !r) return false;
  const k = l.k + r.k;
  if (k === 0) return false;
  const diff = r.known - l.known;
  const answer = diff / k;
  if (!Number.isFinite(answer) || answer < 0) return false;
  if (!isInt(answer) && !isInt(answer * 10)) return false;

  return panel(host, {
    titleEn: "Balance the scale",
    titleEs: "Equilibra la balanza",
    askEn: `The scale must stay level. Change ${unknown} until both sides weigh the same.`,
    askEs: `La balanza debe quedar nivelada. Cambia ${unknown} hasta que los dos lados pesen lo mismo.`,
    build(body, api) {
      const view = document.createElement("div");
      view.className = "hw-ho-steps";
      view.style.gridTemplateColumns = "1fr 1fr";
      const leftEl = document.createElement("p");
      leftEl.className = "hw-ho-step";
      const rightEl = document.createElement("p");
      rightEl.className = "hw-ho-step";
      view.append(leftEl, rightEl);
      let guess = 0;
      const paint = () => {
        const lt = l.known + l.k * guess;
        const rt = r.known + r.k * guess;
        leftEl.innerHTML = bi(`Left: ${fmt(lt)}`, `Izquierda: ${fmt(lt)}`);
        rightEl.innerHTML = bi(`Right: ${fmt(rt)}`, `Derecha: ${fmt(rt)}`);
        const delta = Math.round((lt - rt) * 100) / 100;
        if (delta === 0) {
          leftEl.dataset.state = "done";
          rightEl.dataset.state = "done";
          api.say(
            `Level. ${unknown} = ${fmt(guess)}, because ${fmt(l.known)} + ${l.k > 1 ? `${l.k} × ` : ""}${fmt(guess)} = ${fmt(rt)}.`,
            `Nivelada. ${unknown} = ${fmt(guess)}, porque ${fmt(l.known)} + ${l.k > 1 ? `${l.k} × ` : ""}${fmt(guess)} = ${fmt(rt)}.`,
            "yes",
          );
        } else {
          api.say(
            delta > 0
              ? `The left side is ${fmt(Math.abs(delta))} heavier. Make ${unknown} smaller.`
              : `The right side is ${fmt(Math.abs(delta))} heavier. Make ${unknown} bigger.`,
            delta > 0
              ? `El lado izquierdo pesa ${fmt(Math.abs(delta))} más. Haz ${unknown} más pequeño.`
              : `El lado derecho pesa ${fmt(Math.abs(delta))} más. Haz ${unknown} más grande.`,
            "near",
          );
        }
      };
      const bump = (label, d) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hw-ho-btn";
        b.textContent = label;
        b.setAttribute("aria-label", `${label} / ${label}`);
        b.addEventListener("click", () => {
          guess = Math.max(0, Math.round((guess + d) * 100) / 100);
          paint();
        });
        return b;
      };
      const row = document.createElement("div");
      row.className = "hw-ho-row";
      row.style.marginBlockStart = "10px";
      row.append(bump("−1", -1), bump("+1", 1), bump("+5", 5));
      body.append(view, row);
      paint();
    },
  });
}

/* ── order: which rule comes next ────────────────────────────────────────── */

function order(data, host) {
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  if (steps.length < 2 || steps.length > 6) return false;
  const RULES = [
    ["P", "Parentheses", "Paréntesis"],
    ["E", "Exponents", "Exponentes"],
    ["MD", "Multiply or divide", "Multiplicar o dividir"],
    ["AS", "Add or subtract", "Sumar o restar"],
  ];
  const nameOf = (id) => RULES.find((r) => r[0] === id) || ["", "the last step", "el último paso"];

  return panel(host, {
    titleEn: "Which step is next?",
    titleEs: "¿Cuál paso sigue?",
    askEn: `Start with ${pairEn(steps[0].expr)}. Tap the rule that goes first.`,
    askEs: `Empieza con ${pairEn(steps[0].expr)}. Toca la regla que va primero.`,
    build(body, api) {
      let at = 1;
      const list = document.createElement("p");
      list.className = "hw-ho-hint";
      list.innerHTML = bi(`Expression: ${pairEn(steps[0].expr)}`, `Expresión: ${pairEn(steps[0].expr)}`);
      const row = document.createElement("div");
      row.className = "hw-ho-row";
      row.style.marginBlockStart = "10px";
      const fb = document.createElement("p");
      fb.className = "hw-ho-hint";
      RULES.forEach(([id, en, es]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hw-ho-btn";
        b.innerHTML = bi(en, es);
        b.addEventListener("click", () => {
          if (at >= steps.length) return;
          const want = steps[at].rule;
          if (id !== want) {
            api.miss(
              `Not yet. Look at the expression again: which operation can be done right now?`,
              `Todavía no. Mira la expresión otra vez: ¿qué operación se puede hacer ahora?`,
            );
            return;
          }
          const line = document.createElement("p");
          line.className = "hw-ho-step";
          line.dataset.state = "done";
          line.innerHTML = bi(
            `${at}. ${nameOf(want)[1]}: ${pairEn(steps[at].expr)}`,
            `${at}. ${nameOf(want)[2]}: ${pairEs(steps[at].expr)}`,
          );
          list.after(line);
          at += 1;
          if (at >= steps.length) {
            api.say(
              `Finished. ${pairEn(steps[0].expr)} = ${pairEn(steps[steps.length - 1].expr)}.`,
              `Terminado. ${pairEs(steps[0].expr)} = ${pairEs(steps[steps.length - 1].expr)}.`,
              "yes",
            );
            row.querySelectorAll("button").forEach((b2) => b2.setAttribute("disabled", ""));
          } else {
            api.say(
              `Right. Now the expression is ${pairEn(steps[at].expr)}. What comes next?`,
              `Correcto. Ahora la expresión es ${pairEs(steps[at].expr)}. ¿Qué sigue?`,
              "near",
            );
          }
        });
        row.append(b);
      });
      body.append(list, row, fb);
    },
  });
}

/* ── coord: plot the point the lesson asks about ─────────────────────────── */

function coord(data, host) {
  const points = Array.isArray(data?.points) ? data.points : [];
  const xmax = Number(data?.xmax);
  const ymax = Number(data?.ymax);
  if (!points.length || !Number.isFinite(xmax) || !Number.isFinite(ymax)) return false;
  if (xmax < 1 || ymax < 1 || xmax > 12 || ymax > 12) return false;
  const target = points[points.length - 1];
  if (!target || !Number.isFinite(Number(target.x)) || !Number.isFinite(Number(target.y))) return false;

  return panel(host, {
    titleEn: "Plot the point",
    titleEs: "Ubica el punto",
    askEn: `Type the coordinates of ${pairEn(target.label) || "the last point"} and check.`,
    askEs: `Escribe las coordenadas de ${pairEs(target.label) || "el último punto"} y revisa.`,
    build(body, api) {
      const row = document.createElement("div");
      row.className = "hw-ho-row";
      const mk = (label, ph) => {
        const wrap = document.createElement("label");
        wrap.style.display = "grid";
        wrap.style.gap = "4px";
        wrap.innerHTML = `<span class="hw-ho-hint">${bi(label, label)}</span>`;
        const input = document.createElement("input");
        input.className = "hw-ho-input";
        input.type = "text";
        input.inputMode = "decimal";
        input.placeholder = ph;
        input.setAttribute("aria-label", `${label} / ${label}`);
        wrap.append(input);
        return { wrap, input };
      };
      const x = mk("x", "?");
      const y = mk("y", "?");
      row.append(x.wrap, y.wrap);
      const go = document.createElement("button");
      go.type = "button";
      go.className = "hw-ho-btn";
      go.style.alignSelf = "end";
      go.innerHTML = bi("Check", "Revisar");
      const check = () => {
        const tx = num(x.input.value);
        const ty = num(y.input.value);
        if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;
        if (near(tx, Number(target.x)) && near(ty, Number(target.y))) {
          api.say(
            `Yes: (${fmt(tx)}, ${fmt(ty)}). Start at 0, go right ${fmt(tx)}, then up ${fmt(ty)}.`,
            `Sí: (${fmt(tx)}, ${fmt(ty)}). Empieza en 0, ve a la derecha ${fmt(tx)} y luego arriba ${fmt(ty)}.`,
            "yes",
          );
          return;
        }
        const dx = Number(target.x) - tx;
        const dy = Number(target.y) - ty;
        /* Both languages get their own direction words: a Spanish sentence never carries an
           English "right" or "up" inside it. */
        const step = (delta, posEn, negEn, posEs, negEs) =>
          delta ? [`${delta > 0 ? posEn : negEn} ${fmt(Math.abs(delta))}`, `${delta > 0 ? posEs : negEs} ${fmt(Math.abs(delta))}`] : null;
        const moves = [step(dx, "right", "left", "a la derecha", "a la izquierda"), step(dy, "up", "down", "arriba", "abajo")].filter(
          Boolean,
        );
        api.miss(
          `Not yet. From (${fmt(tx)}, ${fmt(ty)}) you would go ${moves.map((m) => m[0]).join(" and ")}.`,
          `Todavía no. Desde (${fmt(tx)}, ${fmt(ty)}) irías ${moves.map((m) => m[1]).join(" y ")}.`,
        );
      };
      go.addEventListener("click", check);
      [x.input, y.input].forEach((i) =>
        i.addEventListener("keydown", (e) => {
          if (e.key === "Enter") check();
        }),
      );
      body.append(row, go);
    },
  });
}

/* ── dispatcher ─────────────────────────────────────────────────────────── */

const KINDS = { tape, ratiotable, numberline, doubleline, barplot, area, grid, kcf, balance, order, coord };

/** Mount one panel. Returns true when this lesson's model supports an activity. */
export function mountHandsOn(host) {
  if (!host || host.dataset.hwHoMounted) return false;
  let payload = null;
  try {
    const data = host.querySelector('script[type="application/json"]');
    payload = data ? JSON.parse(data.textContent) : null;
  } catch {
    payload = null;
  }
  if (!payload || !KINDS[payload.kind]) return false;
  guessMeta = payload.guess ? { guess: payload.guess, reveal: payload.reveal || null } : null;
  host.dataset.hwHoMounted = "1";
  let ok = false;
  try {
    ok = KINDS[payload.kind](payload.data || {}, host) !== false;
  } catch {
    ok = false;
  }
  if (!ok) {
    delete host.dataset.hwHoMounted;
    host.hidden = true;
  }
  return ok;
}
