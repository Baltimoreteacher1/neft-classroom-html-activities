// Grammar Jungle: tag-and-fix. A jungle trail of real sentences from one mini-story (3-5: a rainforest trip in
// Costa Rica; 6-8: a canopy research expedition in Peru). Each vine holds one sentence with exactly one error.
// Step 1 (tag): tap the word or phrase that breaks a rule. Step 2 (fix): pick the tile that repairs it. A correct
// fix swings the explorer to the next vine (CSS transform, off under prefers-reduced-motion).
//
// Sentences are authored as text; 6-8 sentences use "|" to mark phrase chunks so a whole phrase can be the target
// (a dangling modifier, a comma splice) without the target being the only multi-word button.
//
// Evidence: one judge() call per miss and one for the final decision of each vine. A wrong tag or a wrong tile is
// a miss (first miss -> hint + revise, second -> the fix and rule are shown); a right tag moves on with no judge
// call; the right tile is the decision. So `first` = tagged and fixed with no miss and no hint.
// Hints: 1 the rule in kid language, 2 where to look, 3 (support mode A) marks the word or explains the tile test.
import {
  audioBtn,
  feedbackHTML,
  glossHTML,
  hintHTML,
  html,
  icon,
  judge,
  newRound,
  settled,
  shuffle,
  takeHint,
} from "./engine.js";

const BANDS = ["3-5", "6-8"];
const EXPLORER = { "3-5": "🐒", "6-8": "🧗" };
const CHEER = {
  "3-5": ["🍃", "✨", "🍌", "🦋", "🌿", "✨"],
  "6-8": ["🍃", "✨", "🦜", "🌿", "✨", "🍃"],
};

/** Split authored text into tappable tokens: "|" marks phrase chunks, otherwise single words. */
export const tokensOf = (text) => {
  const t = String(text || "");
  return (t.includes("|") ? t.split("|") : t.split(/\s+/)).map((x) => x.trim()).filter(Boolean);
};
const plain = (text) => tokensOf(text).join(" ");
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** True when `needle` appears in `hay` as its own word or phrase (not inside a longer word). */
const mentions = (hay, needle) =>
  new RegExp(`(^|[^a-z'])${escRe(String(needle).toLowerCase())}($|[^a-z'])`).test(
    String(hay || "").toLowerCase(),
  );
const firstTry = (r) => r.rs.status === "right" && r.rs.tries === 1 && r.rs.h === 0;

function decide(r, ok, s, env) {
  judge(r.rs, ok, env, {
    id: r.id,
    skill: env.def?.skill?.toLowerCase() || "writing",
    extra: { kind: r.kind },
  });
  if (!settled(r.rs)) return;
  r.step = "done";
  if (r.rs.status === "right") s.fx = r.id;
  if (firstTry(r)) s.streak += 1; // cumulative first-try count: a miss never resets it
  s.best = s.streak;
}

function trailHTML(s, I) {
  const n = s.rounds.length;
  const at = n > 1 ? Math.min(s.i, n - 1) / (n - 1) : 0;
  const crossed = s.rounds.filter((r) => settled(r.rs)).length;
  const label = (r, k) =>
    firstTry(r)
      ? I.S(`Vine ${k + 1}: fixed on the first try`, `Liana ${k + 1}: corregida al primer intento`)
      : settled(r.rs)
        ? I.S(`Vine ${k + 1}: crossed`, `Liana ${k + 1}: cruzada`)
        : k === s.i
          ? I.S(`Vine ${k + 1}: you are here`, `Liana ${k + 1}: estás aquí`)
          : I.S(`Vine ${k + 1}: ahead`, `Liana ${k + 1}: más adelante`);
  return html`<div class="gj-trail" style="--gj-at:${at.toFixed(4)}">
    <ol
      class="gj-vines"
      aria-label="${I.S(`Jungle trail: ${crossed} of ${n} vines crossed`, `Sendero de la selva: ${crossed} de ${n} lianas cruzadas`)}"
    >
      ${s.rounds.map((r, k) => {
        const st = firstTry(r) ? "star" : settled(r.rs) ? "done" : k === s.i ? "now" : "ahead";
        return html`<li class="gj-node is-${st}">
          <span aria-hidden="true">${st === "star" ? "★" : st === "done" ? "✓" : k + 1}</span
          ><span class="visually-hidden">${label(r, k)}</span>
        </li>`;
      })}
    </ol>
    <span class="gj-explorer" aria-hidden="true"
      ><span class="gj-explorer-body">${EXPLORER[s.band] || EXPLORER["3-5"]}</span></span
    >
  </div>`;
}

function sentenceHTML(r, env) {
  const I = env.I;
  const done = settled(r.rs);
  const hinted = r.step === "tag" && r.rs.h >= 3;
  const words = r.toks.map((t, k) => {
    if (done && k === r.bad)
      return html`<span class="gj-fixed"
        >${r.rs.status === "revealed" ? html`<del class="gj-was">${t}</del> ` : ""}<ins
          class="gj-now"
          >${r.fix}</ins
        ><span class="visually-hidden"> ${I.S("(fixed)", "(corregido)")}</span></span
      > `;
    if (done) return html`<span class="gj-word">${t}</span> `;
    const tagged = r.step === "fix" && k === r.bad;
    const miss = r.tagMiss.includes(k);
    const cls = `gj-tok${tagged ? " is-tagged" : ""}${miss ? " is-miss" : ""}${hinted && k === r.bad ? " is-hinted" : ""}`;
    const note = tagged
      ? I.S("(needs fixing)", "(hay que corregirla)")
      : miss
        ? I.S("(this one is correct)", "(esta está bien)")
        : hinted && k === r.bad
          ? I.S("(hint: look here)", "(pista: mira aquí)")
          : "";
    return html`<button
      type="button"
      class="${cls}"
      data-gj-tok="${k}"
      ${r.step !== "tag" || miss ? "disabled" : ""}
    >
      ${t}${note ? html`<span class="visually-hidden"> ${note}</span>` : ""}
    </button> `;
  });
  return html`<p
    class="gj-sentence"
    lang="en"
    ${r.step === "tag" && !done ? html`role="group" aria-label="${I.S("Sentence: tap the word that needs fixing", "Oración: toca la palabra que hay que corregir")}"` : ""}
  >
    ${words}
  </p>`;
}

function tilesHTML(r, I) {
  if (r.step !== "fix" || settled(r.rs)) return "";
  return html`<div class="gj-fix">
    <p class="gj-fix-l">
      ${I.T("Replace", "Reemplaza")}
      <mark class="gj-mark" lang="en">${r.toks[r.bad]}</mark> ${I.T("with:", "con:")}
    </p>
    <div class="gj-tiles" role="group" aria-label="${I.S("Fix tiles", "Fichas para corregir")}">
      ${r.tiles.map((t, k) => {
        const miss = r.tileMiss.includes(k);
        return html`<button
          type="button"
          class="gj-tile${miss ? " is-miss" : ""}"
          data-gj-tile="${k}"
          lang="en"
          ${miss ? "disabled" : ""}
        >
          ${miss ? html`<span aria-hidden="true">✗ </span>` : ""}${t}${miss ? html`<span class="visually-hidden"> ${I.S("(does not fit)", "(no encaja)")}</span>` : ""}
        </button>`;
      })}
    </div>
  </div>`;
}

function statusText(r, s, I) {
  if (r.rs.status !== "open") return "";
  if (s.last === "tagged")
    return I.T(
      "Good eye! That is the part to fix. Now choose the tile that repairs it.",
      "¡Buen ojo! Esa es la parte que hay que corregir. Ahora elige la ficha que la repara.",
    );
  return "";
}

export default {
  id: "grammar-jungle",

  init(env) {
    const band = env.content || {};
    const rows = band.rounds || [];
    const n = env.count(rows.length, Math.min(4, rows.length));
    // Quick mode keeps a seeded sample but tells the story in order.
    const pick = shuffle(
      rows.map((_, k) => k),
      env.rng,
    )
      .slice(0, n)
      .sort((a, b) => a - b);
    const kinds = band.kinds || {};
    return {
      band: env.band,
      i: 0,
      fx: "",
      fk: "",
      last: "",
      streak: 0,
      best: 0,
      rounds: pick.map((k) => {
        const r = rows[k];
        const toks = tokensOf(r.text);
        return {
          id: r.id,
          kind: r.kind,
          job: kinds[r.kind] || null,
          toks,
          bad: toks.indexOf(r.bad),
          fix: r.fix,
          tiles: shuffle([r.fix, ...r.tiles], env.rng),
          es: r.es,
          hints: r.hints || [],
          explain: r.explain,
          step: "tag",
          tagMiss: [],
          tileMiss: [],
          rs: newRound(),
        };
      }),
    };
  },

  done: (s) => s.i >= s.rounds.length,
  progress: (s) => ({ done: s.rounds.filter((r) => settled(r.rs)).length, total: s.rounds.length }),

  view(s, env) {
    const I = env.I;
    const r = s.rounds[s.i];
    if (!r)
      return html`<p role="status">
        ${I.T("You crossed the whole jungle!", "¡Cruzaste toda la selva!")}
      </p>`;
    const n = s.rounds.length;
    const done = settled(r.rs);
    const stars = s.rounds.filter(firstTry).length;
    const story = env.content?.story;
    const hints = [
      ...r.hints.slice(0, 2).map((h) => I.T(h.en, h.es)),
      r.step === "tag"
        ? I.T("Look at the marked part of the sentence.", "Mira la parte marcada de la oración.")
        : I.T(
            "Read the whole sentence aloud with each tile. Pick the one that follows the rule.",
            "Lee toda la oración en voz alta con cada ficha. Elige la que sigue la regla.",
          ),
    ];
    const missRetry =
      s.last === "tag-miss"
        ? I.T(
            "That part is correct in this sentence. Look for a different one.",
            "Esa parte está bien en esta oración. Busca otra.",
          )
        : I.T(
            "That tile does not fix the sentence. Read it again with another tile.",
            "Esa ficha no corrige la oración. Léela otra vez con otra ficha.",
          );
    const last = s.i + 1 === n;
    const status = statusText(r, s, I);
    return html`<section
      class="cg-station gj gj-b${s.band === "6-8" ? "68" : "35"}"
      data-mechanic="tag-and-fix"
    >
      <div class="gj-top">
        ${trailHTML(s, I)}
        <p class="gj-tally">
          <span aria-hidden="true">${s.band === "6-8" ? "⭐" : "🍌"}</span>
          ${I.T(`${stars} fixed on the first try`, `${stars} corregidas al primer intento`)}
        </p>
      </div>
      ${s.i === 0 && story && r.step === "tag" && !r.rs.tries ? html`<p class="gj-story">${icon("sparkle")}${I.T(story.en, story.es)}</p>` : ""}
      <article
        class="gj-vine${done && r.rs.status === "right" ? " is-won" : ""}"
        aria-labelledby="gj-vine-t"
      >
        ${s.fx === r.id ? html`<div class="gj-burst" aria-hidden="true">${(CHEER[s.band] || CHEER["3-5"]).map((e) => html`<span>${e}</span>`)}</div>` : ""}
        <header class="gj-vine-head">
          <h2 id="gj-vine-t" class="gj-vine-t" tabindex="-1">
            ${I.T(`Vine ${s.i + 1} of ${n}`, `Liana ${s.i + 1} de ${n}`)}
          </h2>
          <p class="gj-step">
            ${
              done
                ? I.T("Vine fixed", "Liana corregida")
                : r.step === "tag"
                  ? I.T(
                      "Step 1 of 2: Tap the part that needs fixing.",
                      "Paso 1 de 2: Toca la parte que hay que corregir.",
                    )
                  : I.T("Step 2 of 2: Choose the fix.", "Paso 2 de 2: Elige la corrección.")
            }
          </p>
        </header>
        ${sentenceHTML(r, env)}
        <div class="gj-help">
          ${audioBtn(plain(r.toks.join(" ")), I, I.S("Listen to the sentence", "Escuchar la oración"))}${glossHTML(r.es, env)}
        </div>
        ${tilesHTML(r, I)}
        ${done && r.job ? html`<p class="gj-job"><span class="gj-job-l">${I.T("Rule", "Regla")}</span> ${I.T(r.job.en, r.job.es)}</p>` : ""}
      </article>
      <p class="gj-status" role="status" aria-live="polite">${status}</p>
      ${hintHTML(r.rs, hints, env, { disabled: done })}
      ${feedbackHTML(r.rs, {
        I,
        right:
          s.band === "6-8"
            ? I.T(
                "Clean edit. The team climbs to the next platform.",
                "Corrección limpia. El equipo sube a la siguiente plataforma.",
              )
            : I.T("Fixed! Swing to the next vine.", "¡Corregida! Columpiate a la siguiente liana."),
        retry: missRetry,
        answer: I.T(
          `The fix: ${r.toks[r.bad]} → ${r.fix}`,
          `La corrección: ${r.toks[r.bad]} → ${r.fix}`,
        ),
        explain: I.T(r.explain.en, r.explain.es),
      })}
      ${done ? html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${last ? I.T("Finish the trail", "Terminar el sendero") : I.T("Swing to the next vine", "Columpiarte a la siguiente liana")}</button></div>` : ""}
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    const r = s.rounds[s.i];
    if (!b || !r) return false;
    if (b.dataset.gjTok !== undefined && r.step === "tag" && !settled(r.rs)) {
      const k = Number(b.dataset.gjTok);
      if (r.tagMiss.includes(k) || !(k >= 0 && k < r.toks.length)) return false;
      s.fx = "";
      if (k === r.bad) {
        r.step = "fix";
        if (r.rs.status === "retry") r.rs.status = "open";
        s.last = "tagged";
        s.fk = "tile";
        return true;
      }
      r.tagMiss.push(k);
      s.last = "tag-miss";
      decide(r, false, s, env);
      s.fk = settled(r.rs) ? "next" : `tok-${k}`;
      return true;
    }
    if (b.dataset.gjTile !== undefined && r.step === "fix" && !settled(r.rs)) {
      const k = Number(b.dataset.gjTile);
      if (r.tileMiss.includes(k) || !(k >= 0 && k < r.tiles.length)) return false;
      const ok = r.tiles[k] === r.fix;
      if (!ok) r.tileMiss.push(k);
      s.fx = "";
      s.last = ok ? "fixed" : "tile-miss";
      decide(r, ok, s, env);
      s.fk = settled(r.rs) ? "next" : "tile";
      return true;
    }
    if (b.hasAttribute("data-g-hint") && !settled(r.rs)) {
      if (takeHint(r.rs, env) < 0) return false;
      s.fx = "";
      s.fk = "hint";
      return true;
    }
    if (b.hasAttribute("data-g-next") && settled(r.rs)) {
      s.i += 1;
      s.fx = "";
      s.last = "";
      s.fk = "vine";
      return true;
    }
    return false;
  },

  mount(root, s) {
    // Swing the explorer from the vine it was on to the current one (only when the vine changed on this page).
    const ex = root.querySelector(".gj-explorer");
    const key = s.rounds.map((r) => r.id).join(",");
    const prev = this._at;
    this._at = { key, i: s.i };
    const reduced =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ex && prev && prev.key === key && prev.i !== s.i && !reduced) {
      const n = s.rounds.length;
      ex.style.setProperty("--gj-from", String(n > 1 ? Math.min(prev.i, n - 1) / (n - 1) : 0));
      ex.classList.add("is-swing");
      ex.addEventListener("animationend", () => ex.classList.remove("is-swing"), { once: true });
    }
    const f = s.fk;
    if (!f) return;
    let el = null;
    if (f === "vine") el = root.querySelector("#gj-vine-t");
    else if (f === "next") el = root.querySelector("[data-g-next]");
    else if (f === "tile") el = root.querySelector(".gj-tile:not(:disabled)");
    else if (f === "hint") {
      el = root.querySelector("[data-g-hint]");
      if (!el) {
        const shown = root.querySelectorAll(".gs-hints .gs-hint");
        el = shown[shown.length - 1] || null;
        if (el) el.tabIndex = -1;
      }
    } else if (f.startsWith("tok-")) {
      const k = Number(f.slice(4));
      const all = [...root.querySelectorAll(".gj-tok")];
      el =
        all.find((b) => Number(b.dataset.gjTok) > k && !b.disabled) ||
        all.find((b) => !b.disabled) ||
        null;
    }
    // The app restores focus to the last-focused control right after mount; move focus after that, once.
    s.fk = "";
    if (el) Promise.resolve().then(() => el.isConnected && el.focus({ preventScroll: f !== "vine" && f !== "next" }));
  },

  plan(s, { wrong } = {}) {
    const r = s.rounds[s.i];
    if (!r) return [];
    if (settled(r.rs)) return [{ click: "[data-g-next]" }];
    if (r.step === "tag") {
      if (wrong) {
        const k = r.toks.findIndex((_, j) => j !== r.bad && !r.tagMiss.includes(j));
        if (k >= 0) return [{ click: `[data-gj-tok="${k}"]` }];
      }
      return [{ click: `[data-gj-tok="${r.bad}"]` }];
    }
    if (wrong) {
      const k = r.tiles.findIndex((t, j) => t !== r.fix && !r.tileMiss.includes(j));
      if (k >= 0) return [{ click: `[data-gj-tile="${k}"]` }];
    }
    return [{ click: `[data-gj-tile="${r.tiles.indexOf(r.fix)}"]` }];
  },

  validate(content) {
    const errors = [];
    const bi = (o) =>
      o &&
      typeof o.en === "string" &&
      o.en.trim() &&
      typeof o.es === "string" &&
      o.es.trim() &&
      o.es !== o.en;
    for (const name of BANDS) {
      const band = content.bands?.[name] || {};
      const rows = band.rounds || [];
      if (rows.length < 10 || rows.length > 12)
        errors.push(`${name}: needs 10-12 authored vines (has ${rows.length})`);
      if (!bi(band.story)) errors.push(`${name}: story must be bilingual`);
      const kinds = band.kinds || {};
      for (const [k, v] of Object.entries(kinds))
        if (!bi(v)) errors.push(`${name}: rule label ${k} must be bilingual`);
      const used = new Set(rows.map((r) => r.kind));
      if (used.size < 5)
        errors.push(`${name}: vines should practice at least five different rules`);
      const ids = new Set();
      for (const r of rows) {
        const at = `${name}/${r.id}`;
        if (!r.id || ids.has(r.id)) errors.push(`${at}: ids must be unique`);
        ids.add(r.id);
        if (!kinds[r.kind]) errors.push(`${at}: unknown rule kind "${r.kind}"`);
        const toks = tokensOf(r.text);
        if (toks.length < 3) errors.push(`${at}: sentence is too short`);
        if (toks.filter((t) => t === r.bad).length !== 1)
          errors.push(`${at}: the error "${r.bad}" must be exactly one token of the sentence`);
        if (!r.fix || r.fix === r.bad) errors.push(`${at}: fix must differ from the error`);
        const tiles = [r.fix, ...(r.tiles || [])];
        if ((r.tiles || []).length !== 2 || new Set(tiles).size !== 3 || tiles.includes(r.bad))
          errors.push(
            `${at}: needs two distinct distractor tiles that differ from the fix and the error`,
          );
        if (!r.es || r.es === plain(r.text)) errors.push(`${at}: es must be a Spanish translation`);
        if (!Array.isArray(r.hints) || r.hints.length < 2 || !r.hints.every(bi))
          errors.push(`${at}: needs two bilingual hints`);
        if (!bi(r.explain)) errors.push(`${at}: explanation must be bilingual`);
        (r.hints || []).forEach((h, k) => {
          if (mentions(h?.en, r.fix) || mentions(h?.es, r.fix))
            errors.push(`${at}: hint ${k + 1} leaks the fix`);
          if (k === 0 && (mentions(h?.en, r.bad) || mentions(h?.es, r.bad)))
            errors.push(`${at}: hint 1 names the error`);
        });
        if (!mentions(r.explain?.en, r.fix.replace(/[.,;?!]+$/, "")))
          errors.push(`${at}: explanation should state the fix`);
        if (/timer|countdown/i.test(JSON.stringify(r))) errors.push(`${at}: no timer language`);
      }
    }
    return errors;
  },
};
