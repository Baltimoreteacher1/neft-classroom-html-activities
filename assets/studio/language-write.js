/**
 * Practice Studio language layer, part 3: writing support (window.StudioLangWrite).
 *
 *   Frame ladder     the written-task frame, one sentence per line, at the support level the student chose (1 tiles .. 6 none).
 *                    "Show starters" always puts the whole frame back; it is a choice, never recorded as a deficit.
 *   Sentence tiles   levels 1-3: build one sentence by tapping tiles made from the frame, the lesson's key words (English or Español) and
 *                    the problem's own numbers. Tap a placed tile to take it out. A rehearsal step comes before anything is typed.
 *   Partner talk     A and B, three turns, no timer, no recording; one "we both said it" tick.
 *   Say it three ways  after a solved problem: the equation, a sentence, a picture (opens the workspace).
 *
 * Nothing here is graded, timed or recorded. Choices are saved on this device only (ewl_lang_v1). Pure logic: language-core.js.
 */
(() => {
  const W = /** @type {any} */ (window);
  if (W.StudioLangWrite) return;
  const Core = W.StudioLangCore;
  const L = () => W.StudioLanguage;
  if (!Core) return;
  const RT = (W.StudioRT = W.StudioRT || {});
  const esc = (/** @type {any} */ s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
    );
  const es = (/** @type {any} */ t) =>
    t ? `<span class="es-text" lang="es">${esc(t)}</span>` : "";
  const bi = (/** @type {string} */ en, /** @type {string} */ sp) =>
    `<span class="t-en">${esc(en)}</span><span class="t-es" lang="es">${esc(sp)}</span>`;

  /** Per-problem choices made this visit: starters restored, which sentence the tiles are for. */
  /** @type {Map<string, {starters: boolean, part: number, used: Set<string>}>} */
  const session = new Map();
  const sess = (/** @type {string} */ k) => {
    let v = session.get(k);
    if (!v) session.set(k, (v = { starters: false, part: 0, used: new Set() }));
    return v;
  };
  const apiData = () => RT.api?.data;
  const levelFor = (/** @type {string} */ key) => (sess(key).starters ? 2 : L().settings().frame);
  const levelOf = (/** @type {number} */ n) =>
    Core.LEVELS.find((l) => l.id === n) || Core.LEVELS[1];

  /** The lesson's own text for one problem and level, when its data supplies one (frL: { "<item id or *>": { "<level>": {en, es} } }). */
  function override(/** @type {any} */ it, /** @type {number} */ level) {
    const f = apiData()?.lang?.frL;
    const v = f?.[it.id]?.[level] ?? f?.["*"]?.[level];
    return v?.en ? v : null;
  }

  /* ---- the sentence line text ------------------------------------------------------------------------------------------ */
  const blanks = (/** @type {string} */ t) =>
    esc(t).replace(
      /_{2,}/g,
      '<span class="lang-blank" aria-label="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>',
    );
  function frameHtml(
    /** @type {any} */ it,
    /** @type {{parts: any[], esAll: string}} */ fr,
    /** @type {number} */ level,
    /** @type {string} */ key,
  ) {
    const lv = levelOf(level);
    const over = override(it, level);
    const lines = Core.frameView(fr.parts, level, over);
    const body = lines.length
      ? `<ol class="lang-frame-list">${lines
          .map(
            (l) =>
              `<li class="lang-frame-line">${l.label ? `<span class="lang-fn">${bi(l.label.en, l.label.es)}</span> ` : ""}<span class="lang-frame-text">${blanks(l.en)}</span>${l.es ? es(l.es) : ""}</li>`,
          )
          .join("")}</ol>${fr.esAll && lv.id <= 2 ? es(fr.esAll) : ""}`
      : "";
    const picture =
      lv.id === 1
        ? `<p class="item-sub lang-first">${bi("First, draw or label the problem in your workspace.", "Primero, dibuja o rotula el problema en tu espacio de trabajo.")} <button type="button" class="btn btn-sm" data-lang-draw>${bi("Open workspace", "Abrir espacio de trabajo")}</button></p>`
        : "";
    const showBtn =
      lv.id >= 3 || sess(key).starters
        ? `<button type="button" class="btn btn-sm" data-lang-starters aria-pressed="${sess(key).starters}">${
            sess(key).starters
              ? bi("Hide starters", "Ocultar comienzos")
              : bi("Show starters", "Mostrar comienzos")
          }</button>`
        : "";
    return `<div class="lang-frame" data-level="${lv.id}">
      <p class="lang-frame-head"><strong>${bi("Sentence frame", "Marco de oración")}</strong> <span class="lang-level">${bi(`Level ${lv.id}: ${lv.en}`, `Nivel ${lv.id}: ${lv.es}`)}</span></p>
      ${body}${picture}${showBtn ? `<p class="lang-frame-actions">${showBtn}</p>` : ""}</div>`;
  }

  /* ---- tiles ----------------------------------------------------------------------------------------------------------- */
  const join = (/** @type {string[]} */ words) =>
    words
      .join(" ")
      .replace(/\s+([.,;:?!%)])/g, "$1")
      .replace(/([(¿¡$])\s+/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  function tilesHtml(
    /** @type {any} */ it,
    /** @type {{parts: any[]}} */ fr,
    /** @type {string} */ key,
  ) {
    const ss = sess(key);
    const part = fr.parts[Math.min(ss.part, fr.parts.length - 1)];
    if (!part) return "";
    const tiles = Core.tilesFor(part, it.kw || [], it.kwEs || [], `${it.p || ""} ${it.ctx || ""}`);
    const saved = L().item(key).built || [];
    const placed = [];
    const left = tiles.slice();
    for (const t of saved) {
      const at = left.findIndex((x) => x.t === t);
      if (at >= 0) placed.push(left.splice(at, 1)[0]);
    }
    const tab =
      fr.parts.length > 1
        ? `<div class="lang-part-tabs" role="group" aria-label="${esc("Which sentence?")}">${fr.parts
            .map(
              (_p, i) =>
                `<button type="button" class="btn btn-sm" data-lang-part="${i}" aria-pressed="${i === ss.part}">${bi(`Sentence ${i + 1}`, `Oración ${i + 1}`)}</button>`,
            )
            .join("")}</div>`
        : "";
    const btn = (/** @type {any} */ t, /** @type {string} */ attr) =>
      `<button type="button" class="lang-tile lang-tile-${t.kind}" ${attr}="${esc(t.t)}" lang="${t.kind === "word" && /[áéíóúñ¿¡]/i.test(t.t) ? "es" : "en"}">${esc(t.t)}</button>`;
    return `<details class="lang-tiles" open data-lang-tiles>
      <summary>${bi("Build a sentence with tiles", "Arma una oración con fichas")}</summary>
      <p class="item-sub">${bi("Tap tiles in the order you want. Tap a tile in your sentence to take it out. Use English, Español, or both.", "Toca las fichas en el orden que quieras. Toca una ficha de tu oración para quitarla. Usa inglés, español o ambos.")}</p>
      ${tab}
      <div class="lang-sentence" role="group" aria-label="${esc("My sentence")}" aria-live="polite">${placed.length ? placed.map((t) => btn(t, "data-lang-unplace")).join("") : `<span class="lang-empty">${bi("Your sentence goes here.", "Tu oración va aquí.")}</span>`}</div>
      <div class="lang-tilebox" role="group" aria-label="${esc("Tiles")}">${left.map((t) => btn(t, "data-lang-place")).join("")}</div>
      <p class="lang-tile-actions"><button type="button" class="btn btn-sm" data-lang-clear${placed.length ? "" : " disabled"}>${bi("Clear", "Borrar")}</button> <button type="button" class="btn btn-go btn-sm" data-lang-rehearse${placed.length ? "" : " disabled"}>${bi("I built it", "Ya la armé")}</button></p>
      <div class="lang-rehearse" hidden aria-live="polite"><p class="item-sub"><strong>${bi("Say it first.", "Primero dila en voz baja.")}</strong> ${bi("Read your sentence out loud to yourself. Does it make sense? Nothing is graded here.", "Lee tu oración en voz baja. ¿Tiene sentido? Aquí nada se califica.")}</p><p class="lang-built"></p><p class="lang-tile-actions"><button type="button" class="btn btn-go btn-sm" data-lang-use>${bi("Put it in my answer box", "Ponerla en mi cuadro de respuesta")}</button> <button type="button" class="btn btn-sm" data-lang-change>${bi("Change it", "Cambiarla")}</button></p></div>
    </details>`;
  }

  /* ---- partner talk ---------------------------------------------------------------------------------------------------- */
  function partnerHtml(/** @type {string} */ key) {
    const done = !!L().item(key).partner;
    return `<details class="lang-partner" data-lang-partner>
      <summary>${bi("Talk it out with a partner", "Conversa con un compañero")}</summary>
      <ol class="lang-partner-steps">
        <li><strong>${bi("Turn 1.", "Turno 1.")}</strong> ${bi("Partner A says the idea with the frame. Partner B says it back in their own words.", "El compañero A dice la idea con el marco. El compañero B la dice con sus propias palabras.")}</li>
        <li><strong>${bi("Turn 2.", "Turno 2.")}</strong> ${bi("Switch. B says the idea. A says it back in their own words.", "Cambien. B dice la idea. A la dice con sus propias palabras.")}</li>
        <li><strong>${bi("Turn 3.", "Turno 3.")}</strong> ${bi("Say one sentence together. Then write it.", "Digan una oración juntos. Luego escríbanla.")}</li>
      </ol>
      <p class="item-sub">${bi("Take the time you need. No timer. No recording.", "Tomen el tiempo que necesiten. Sin reloj. Sin grabación.")}</p>
      <label class="lang-check"><input type="checkbox" data-lang-both${done ? " checked" : ""}> ${bi("We both said it.", "Los dos lo dijimos.")}</label>
    </details>`;
  }

  /* ---- decorate a written task ---------------------------------------------------------------------------------------- */
  function decorate(
    /** @type {number} */ _tab,
    /** @type {any} */ it,
    /** @type {HTMLElement} */ host,
    /** @type {HTMLElement} */ stage,
  ) {
    if (it.k !== "wr") return;
    const key = L().itemKey(it);
    const line = host.querySelector(".frame-line");
    const label = host.querySelector(".write-label");
    const anchor = line || label;
    if (!anchor || host.querySelector("[data-lang-write]")) return;
    const fr = it.fr ? Core.splitFrame(it.fr, it.frEs) : { parts: [], esAll: "" };
    const wrap = document.createElement("div");
    wrap.className = "lang-write";
    wrap.setAttribute("data-lang-write", "");
    line?.remove();
    (label || host.firstElementChild)?.before(wrap);
    wrap.dataset.key = key;
    render(wrap, it, fr, key);
    wire(wrap, it, fr, key, host, stage);
  }

  function render(
    /** @type {HTMLElement} */ wrap,
    /** @type {any} */ it,
    /** @type {any} */ fr,
    /** @type {string} */ key,
  ) {
    const level = levelFor(key);
    const tiles = fr.parts.length && level <= Core.TILE_MAX_LEVEL;
    const talkOpen = /** @type {HTMLDetailsElement|null} */ (
      wrap.querySelector("[data-lang-partner]")
    )?.open;
    wrap.innerHTML = `${fr.parts.length ? frameHtml(it, fr, level, key) : ""}${tiles ? tilesHtml(it, fr, key) : ""}${partnerHtml(key)}`;
    if (talkOpen)
      /** @type {HTMLDetailsElement} */ (wrap.querySelector("[data-lang-partner]")).open = true;
  }

  /** @type {WeakSet<HTMLElement>} */
  const wired = new WeakSet();
  function wire(
    /** @type {HTMLElement} */ wrap,
    /** @type {any} */ it,
    /** @type {any} */ fr,
    /** @type {string} */ key,
    /** @type {HTMLElement} */ host,
    /** @type {HTMLElement} */ _stage,
  ) {
    if (wired.has(wrap)) return;
    wired.add(wrap);
    const built = () =>
      /** @type {string[]} */ (
        [...wrap.querySelectorAll("[data-lang-unplace]")].map(
          (b) => /** @type {HTMLElement} */ (b).getAttribute("data-lang-unplace") || "",
        )
      );
    const redo = () => {
      render(wrap, it, fr, key);
      const rh = /** @type {HTMLElement|null} */ (wrap.querySelector(".lang-rehearse"));
      if (rh) rh.hidden = true;
    };
    const keep = () => L().item(key, { built: built() });
    wrap.addEventListener("click", (e) => {
      const t = e.target instanceof Element ? e.target : null;
      const ss = sess(key);
      const hit = (/** @type {string} */ sel) => /** @type {HTMLElement|null} */ (t?.closest(sel));
      const place = hit("[data-lang-place]");
      const un = hit("[data-lang-unplace]");
      if (place || un) {
        const text =
          (place || un)?.getAttribute(place ? "data-lang-place" : "data-lang-unplace") || "";
        const now = built();
        if (place) now.push(text);
        else now.splice(now.lastIndexOf(text), 1);
        L().item(key, { built: now });
        redo();
        ss.used.add("tiles");
        const next = /** @type {HTMLElement|null} */ (
          wrap.querySelector(place ? "[data-lang-place]" : "[data-lang-unplace]")
        );
        // keep keyboard focus inside the tile area after a tile moves
        (next || wrap.querySelector("[data-lang-clear]"))?.focus?.();
        return;
      }
      if (hit("[data-lang-clear]")) {
        L().item(key, { built: [] });
        redo();
        return;
      }
      const part = hit("[data-lang-part]");
      if (part) {
        ss.part = Number(part.dataset.langPart) || 0;
        L().item(key, { built: [] });
        redo();
        return;
      }
      if (hit("[data-lang-rehearse]")) {
        keep();
        const rh = /** @type {HTMLElement} */ (wrap.querySelector(".lang-rehearse"));
        const sentence = join(built());
        /** @type {HTMLElement} */ (rh.querySelector(".lang-built")).textContent = sentence;
        rh.hidden = false;
        L().item(key, { sentence });
        /** @type {HTMLElement|null} */ (rh.querySelector("[data-lang-use]"))?.focus();
        return;
      }
      if (hit("[data-lang-change]")) {
        const rh = /** @type {HTMLElement} */ (wrap.querySelector(".lang-rehearse"));
        rh.hidden = true;
        /** @type {HTMLElement|null} */ (wrap.querySelector("[data-lang-unplace]"))?.focus();
        return;
      }
      if (hit("[data-lang-use]")) {
        const box = /** @type {HTMLTextAreaElement|null} */ (host.querySelector("[data-write]"));
        const sentence = join(built());
        if (!box || box.readOnly || !sentence) return;
        box.value = `${box.value.trim() ? `${box.value.trim()} ` : ""}${sentence}`;
        box.dispatchEvent(new Event("input", { bubbles: true }));
        ss.used.add("tiles");
        L().note("tiles");
        box.focus();
        return;
      }
      if (hit("[data-lang-starters]")) {
        ss.starters = !ss.starters;
        if (ss.starters) {
          ss.used.add("starters");
          L().note("starters");
        }
        redo();
        /** @type {HTMLElement|null} */ (wrap.querySelector("[data-lang-starters]"))?.focus();
        return;
      }
      if (hit("[data-lang-draw]")) openWorkspace(host);
    });
    wrap.addEventListener("change", (e) => {
      const c =
        e.target instanceof HTMLInputElement && e.target.matches("[data-lang-both]")
          ? e.target
          : null;
      if (!c) return;
      L().item(key, { partner: c.checked });
      if (c.checked) {
        sess(key).used.add("partner");
        L().note("partner");
        W.StudioBus?.emit("language", { type: "partner", itemId: it.id });
      }
    });
  }

  function openWorkspace(/** @type {ParentNode} */ scope) {
    const root = /** @type {HTMLElement|null} */ (
      (scope.closest?.(".stage-card") || document).querySelector(
        ".item-workspace details, .item-workspace",
      )
    );
    const d = root?.tagName === "DETAILS" ? root : root?.querySelector("details");
    if (!d) return;
    /** @type {HTMLDetailsElement} */ (d).open = true;
    d.scrollIntoView?.({ block: "center" });
    /** @type {HTMLElement|null} */ (d.querySelector("summary"))?.focus();
  }

  /* ---- say it three ways ---------------------------------------------------------------------------------------------- */
  const GENERIC = {
    en: "I found ___. I know because ___.",
    es: "Encontré ___. Lo sé porque ___.",
  };
  /** The first sentence of the explanation that carries the equation, else its first sentence. */
  function equationOf(/** @type {any} */ it) {
    const ss = Core.sentences(it.x || "");
    const pick = ss.find((x) => /=/.test(x)) || ss[0] || "";
    const pe = Core.sentences(it.xEs || "");
    const at = ss.indexOf(pick);
    return { en: pick, es: pe.length === ss.length ? pe[at] || "" : "" };
  }
  function threeHtml(/** @type {any} */ it) {
    const eq = equationOf(it);
    const u = RT.util;
    const row = (/** @type {string} */ n, /** @type {string} */ head, /** @type {string} */ body) =>
      `<li><strong>${n}. ${head}</strong> ${body}</li>`;
    return `<div class="lang-three-body" hidden><ol class="lang-three-list">
      ${eq.en ? row("1", bi("Equation", "Ecuación"), `${u ? u.tx(eq.en) : esc(eq.en)}${u ? u.txEs(eq.es) : es(eq.es)}`) : ""}
      ${row("2", bi("Sentence", "Oración"), `${esc(GENERIC.en)}${es(GENERIC.es)} <span class="lang-note">${bi("Say it out loud with your own numbers.", "Dila en voz alta con tus propios números.")}</span>`)}
      ${row("3", bi("Picture", "Dibujo"), `<button type="button" class="btn btn-sm" data-lang-draw>${bi("Draw it in my workspace", "Dibujarlo en mi espacio de trabajo")}</button>`)}
    </ol></div>`;
  }
  /** Add the "Say it three ways" chip under a solved problem's feedback, once. */
  function afterMutation(/** @type {HTMLElement} */ stage) {
    const it = stage && L().current?.(stage);
    const fb = /** @type {HTMLElement|null} */ (stage.querySelector(".item-fb.ok"));
    if (!fb || !it || fb.querySelector("[data-lang-three]") || it.k === "wr") return;
    if (!it.x) return;
    fb.insertAdjacentHTML(
      "beforeend",
      `<div class="lang-three"><button type="button" class="btn btn-sm" data-lang-three aria-expanded="false">${bi("Say it three ways", "Dilo de tres maneras")}</button>${threeHtml(it)}</div>`,
    );
  }
  document.addEventListener("click", (e) => {
    const t = e.target instanceof Element ? e.target : null;
    const b = /** @type {HTMLElement|null} */ (t?.closest("[data-lang-three]"));
    if (b) {
      const body = /** @type {HTMLElement|null} */ (
        b.parentElement?.querySelector(".lang-three-body")
      );
      if (!body) return;
      body.hidden = !body.hidden;
      b.setAttribute("aria-expanded", String(!body.hidden));
      return;
    }
    const draw = /** @type {HTMLElement|null} */ (t?.closest(".lang-three [data-lang-draw]"));
    if (draw) openWorkspace(draw);
  });

  /* ---- evidence: what a written task already does -------------------------------------------------------------------- */
  W.StudioBus?.on?.("answer", (/** @type {any} */ e) => {
    if (!e || e.kind !== "wr" || !e.ok) return;
    const a = RT.api;
    const it = a?.expand ? findItem(e.itemId) : null;
    const text = a?.state?.notes?.[e.itemId] || "";
    const terms = [
      ...(it?.kw || []),
      ...(it?.kwEs || []),
      ...(a?.data?.lang?.wb || []).flatMap((/** @type {any} */ g) => [g.t, g.tEs]),
      ...(a?.data?.glossary || []).flatMap((/** @type {any} */ g) => [g.t, g.tEs]),
    ].filter(Boolean);
    const key = `${a?.data?.lesson}:${a?.data?.mode}:${e.itemId}`;
    const ss = session.get(key);
    L().addEntry({
      lesson: `${a?.data?.lesson}:${a?.data?.mode}`,
      id: String(e.itemId),
      moves: Core.moves(text, terms),
      used: ss ? [...ss.used] : [],
    });
  });
  function findItem(/** @type {string} */ id) {
    const a = RT.api;
    for (const t of a.tabs)
      for (let i = 0; i < a.sections[t - 1].items.length; i++) {
        const spec = a.sections[t - 1].items[i];
        if ((spec.id || `t${t}i${i + 1}`) === id) return a.expand(t, i);
      }
    return null;
  }

  W.StudioLangWrite = {
    decorate,
    afterMutation,
    refresh() {
      for (const wrap of document.querySelectorAll("[data-lang-write]")) {
        const el = /** @type {HTMLElement} */ (wrap);
        const stage = el.closest(".stage-card");
        const it = stage && L().current?.(stage);
        if (it && el.dataset.key) {
          const fr = it.fr ? Core.splitFrame(it.fr, it.frEs) : { parts: [], esAll: "" };
          render(el, it, fr, el.dataset.key);
        }
      }
    },
    levelFor,
    equationOf,
    override,
  };
})();
