/**
 * Practice Studio activity: faces (count the equal pieces whose areas add up to a surface or a polygon, 6.G.4 / 6.G.1).
 * Modes: pyramid (a base plus triangular faces), prism (a net of rectangles and bases), polygon (equal triangles from
 * the center). Each face type shows its dimensions and area; the student sets how many of each belong in the sum.
 * Distractor types (a triangle drawn with the wrong height) must be set to 0.
 * State: { c: count per face type }. No timers.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const clone = (/** @type {any} */ o) => JSON.parse(JSON.stringify(o));
  const r1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
  const APO = { 5: 0.6882, 6: 0.866, 8: 1.2071, 10: 1.5388 };
  const NAMES = { 5: "pentagon", 6: "hexagon", 8: "octagon", 10: "decagon" };
  const NAMES_ES = { 5: "pentágono", 6: "hexágono", 8: "octágono", 10: "decágono" };
  const UNITS = ["cm", "in", "m", "ft"];

  /** A face type: kind tri|rect, dims {b,h} (or {w,h}), area, count (the right answer), label. */
  const tri = (b, h, count, en, es, trap = false) => ({
    shape: "tri",
    d1: b,
    d2: h,
    area: r1((b * h) / 2),
    count,
    en,
    es,
    trap,
  });
  const rect = (w, h, count, en, es) => ({
    shape: "rect",
    d1: w,
    d2: h,
    area: r1(w * h),
    count,
    en,
    es,
    trap: false,
  });

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const mode = params.mode || "pyramid";
    const u = rng.pick(UNITS);
    const spec = /** @type {any} */ ({ mode, unit: u });
    let types;
    let intro;
    let introEs;
    if (mode === "pyramid") {
      const square = level <= 2 || rng.chance(0.4);
      const s = rng.int(2, 6) * 2;
      const l = rng.int(5, 15);
      const hh = Math.max(3, l - rng.int(1, 3));
      if (square) {
        types = [
          rect(s, s, 1, `Square base (${s} × ${s})`, `Base cuadrada (${s} × ${s})`),
          tri(
            s,
            l,
            4,
            `Triangle face (base ${s}, slant ${l})`,
            `Cara triangular (base ${s}, altura inclinada ${l})`,
          ),
        ];
        intro = `A square pyramid has a square base with edges of ${s} ${u}. Each triangular face has a base of ${s} ${u} and a slant height of ${l} ${u}. The pyramid is ${hh} ${u} tall inside.`;
        introEs = `Una pirámide cuadrada tiene una base cuadrada con aristas de ${s} ${u}. Cada cara triangular tiene base de ${s} ${u} y altura inclinada de ${l} ${u}. La pirámide mide ${hh} ${u} de alto por dentro.`;
      } else {
        const w = s - 2 * rng.int(0, 1) - 2;
        const l2 = l + rng.int(1, 3);
        types = [
          rect(s, w, 1, `Rectangle base (${s} × ${w})`, `Base rectangular (${s} × ${w})`),
          tri(
            s,
            l,
            2,
            `Triangle on the ${s} edge (slant ${l})`,
            `Triángulo sobre la arista de ${s} (altura inclinada ${l})`,
          ),
          tri(
            w,
            l2,
            2,
            `Triangle on the ${w} edge (slant ${l2})`,
            `Triángulo sobre la arista de ${w} (altura inclinada ${l2})`,
          ),
        ];
        intro = `A pyramid has a rectangular base ${s} ${u} by ${w} ${u}. Two faces lean on the ${s} ${u} edges and two lean on the ${w} ${u} edges, with the slant heights shown.`;
        introEs = `Una pirámide tiene una base rectangular de ${s} ${u} por ${w} ${u}. Dos caras se apoyan en las aristas de ${s} ${u} y dos en las de ${w} ${u}, con las alturas inclinadas indicadas.`;
      }
      if (level >= 3)
        types.push(
          tri(
            s,
            hh,
            0,
            `Triangle using the inside height (${hh})`,
            `Triángulo con la altura interior (${hh})`,
            true,
          ),
        );
    } else if (mode === "prism") {
      const lw = rng.int(3, 9);
      const w = rng.int(2, 8);
      const h = rng.int(3, 10);
      if (level <= 2 || rng.chance(0.4)) {
        types = [
          rect(lw, w, 2, `Top and bottom (${lw} × ${w})`, `Arriba y abajo (${lw} × ${w})`),
          rect(lw, h, 2, `Front and back (${lw} × ${h})`, `Frente y atrás (${lw} × ${h})`),
          rect(w, h, 2, `Left and right (${w} × ${h})`, `Izquierda y derecha (${w} × ${h})`),
        ];
        intro = `A rectangular prism is ${lw} ${u} long, ${w} ${u} wide and ${h} ${u} tall. Unfold it into a net.`;
        introEs = `Un prisma rectangular mide ${lw} ${u} de largo, ${w} ${u} de ancho y ${h} ${u} de alto. Desármalo en una red.`;
      } else {
        const b = rng.int(2, 5) * 2;
        const th = rng.int(3, 8);
        const e = rng.int(Math.ceil(th) + 1, th + 6);
        types = [
          tri(
            b,
            th,
            2,
            `Triangle ends (base ${b}, height ${th})`,
            `Triángulos de los extremos (base ${b}, altura ${th})`,
          ),
          rect(
            b,
            h,
            1,
            `Rectangle under the base (${b} × ${h})`,
            `Rectángulo bajo la base (${b} × ${h})`,
          ),
          rect(e, h, 2, `Slanted rectangles (${e} × ${h})`, `Rectángulos inclinados (${e} × ${h})`),
        ];
        intro = `A triangular prism has triangle ends with base ${b} ${u} and height ${th} ${u}. Its two slanted sides are ${e} ${u} long, and its length is ${h} ${u}. Unfold it into a net.`;
        introEs = `Un prisma triangular tiene extremos triangulares con base ${b} ${u} y altura ${th} ${u}. Sus dos lados inclinados miden ${e} ${u} y su largo es ${h} ${u}. Desármalo en una red.`;
      }
    } else {
      const n = rng.pick([5, 6, 8, 10]);
      const s = rng.pick([4, 6, 8, 10, 12]);
      const a = r1(s * APO[/** @type {5} */ (n)]);
      const rad = r1(a + 1 + rng.int(0, 3) / 2);
      types = [
        tri(
          s,
          a,
          n,
          `Triangle (base ${s} = side, height ${a} = apothem)`,
          `Triángulo (base ${s} = lado, altura ${a} = apotema)`,
        ),
      ];
      if (level >= 2)
        types.push(
          tri(
            s,
            rad,
            0,
            `Triangle using the corner distance (${rad}) as height`,
            `Triángulo con la distancia a la esquina (${rad}) como altura`,
            true,
          ),
        );
      if (level >= 3)
        types.push(rect(s, a, 0, `Rectangle (${s} × ${a})`, `Rectángulo (${s} × ${a})`));
      intro = `A regular ${NAMES[/** @type {5} */ (n)]} has sides of ${s} ${u} and an apothem of ${a} ${u}. Lines from the center to each corner cut it into equal triangles.`;
      introEs = `Un ${NAMES_ES[/** @type {5} */ (n)]} regular tiene lados de ${s} ${u} y un apotema de ${a} ${u}. Líneas del centro a cada esquina lo cortan en triángulos iguales.`;
    }
    const total = r1(types.reduce((t, k) => t + k.area * k.count, 0));
    spec.model = { types, total };
    const goal =
      mode === "polygon"
        ? "Set how many of each piece make up the whole shape."
        : "Set how many of each face you must add to find the total surface area.";
    const goalEs =
      mode === "polygon"
        ? "Elige cuántas piezas de cada tipo forman toda la figura."
        : "Elige cuántas caras de cada tipo debes sumar para hallar el área total de la superficie.";
    spec.q = `${intro} ${goal}`;
    spec.qEs = `${introEs} ${goalEs}`;
    spec.x = `${types
      .filter((k) => k.count)
      .map((k) => `${k.count} × ${k.area} ${u}²`)
      .join(
        " + ",
      )} = ${total} ${u}². Count every piece once, and use the height that sits inside each piece, not one that runs through the solid.`;
    spec.xEs = `${types
      .filter((k) => k.count)
      .map((k) => `${k.count} × ${k.area} ${u}²`)
      .join(
        " + ",
      )} = ${total} ${u}². Cuenta cada pieza una vez y usa la altura que está dentro de cada pieza, no una que atraviesa el sólido.`;
    spec.h = [
      "Look at each piece. How many copies of it are on the shape?",
      "Do not forget the base, and do not count the same face twice.",
      "A triangle's height must be measured inside that triangle, straight across from its base.",
    ];
    spec.hEs = [
      "Mira cada pieza. ¿Cuántas copias hay en la figura?",
      "No olvides la base y no cuentes la misma cara dos veces.",
      "La altura de un triángulo se mide dentro de ese triángulo, recta desde su base.",
    ];
    return spec;
  }

  const solution = (/** @type {any} */ spec) => ({
    c: spec.model.types.map((/** @type {any} */ k) => k.count),
  });
  function wrong(/** @type {any} */ spec) {
    const ty = spec.model.types;
    const right = ty.map((/** @type {any} */ k) => k.count);
    const out = [];
    const vary = (/** @type {number} */ i, /** @type {number} */ to) => {
      const c = [...right];
      c[i] = Math.max(0, to);
      out.push({ c });
    };
    ty.forEach((/** @type {any} */ k, /** @type {number} */ i) => {
      vary(i, k.count + 1);
      if (k.count > 0) vary(i, k.count - 1);
    });
    out.push({ c: right.map(() => 0) });
    return out.filter((s) => s.c.some((v, i) => v !== right[i]));
  }
  const miss = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const ty = spec.model.types;
    const c = (st && st.c) || [];
    if (!ty.some((/** @type {any} */ _k, /** @type {number} */ i) => c[i] > 0))
      return miss(
        "none",
        "Set how many of each piece to add.",
        "Elige cuántas piezas de cada tipo sumar.",
      );
    const bad = ty.findIndex(
      (/** @type {any} */ k, /** @type {number} */ i) => k.trap && (c[i] || 0) > 0,
    );
    if (bad >= 0)
      return miss(
        "wrong-height",
        "That triangle is drawn with a height that runs through the inside of the solid. A face needs the height measured across the face itself.",
        "Ese triángulo usa una altura que atraviesa el interior del sólido. Una cara necesita la altura medida sobre la cara misma.",
      );
    const off = ty.findIndex(
      (/** @type {any} */ k, /** @type {number} */ i) => (c[i] || 0) !== k.count,
    );
    if (off < 0) return { ok: true };
    const k = ty[off];
    if (k.count > 0 && (c[off] || 0) < k.count)
      return miss(
        "missing-face",
        `Some of the "${k.en}" pieces are missing from your sum. Look at the shape again and count them.`,
        `Faltan piezas de "${k.es}" en tu suma. Mira la figura otra vez y cuéntalas.`,
      );
    return miss(
      "double-counted",
      `You counted too many "${k.en}" pieces. Count each one once.`,
      `Contaste demasiadas piezas de "${k.es}". Cuenta cada una una sola vez.`,
    );
  }

  // biome-ignore format: compact stylesheet
  const CSS = `
.sa-root{--sa-i:var(--ink,#1B2733);--sa-s:var(--surface,#fff);--sa-b:var(--brand,#2C4A68);--sa-bt:var(--brand-tint,#E5ECF3);--sa-bl:var(--brand-line,#BBCADA);--sa-sun:var(--sun,#F0BD4F);--sa-ok:var(--ok,#0A7D4B);--sa-bad:var(--bad,#B42318);--sa-bd:var(--border,#D5DCE5);--sa-dk:var(--brand-dark,#1B2C3F);--sa-r:var(--radius-md,14px);--sa-mute:#566475;--sa-okt:#E4F7EC;--sa-badt:#FDECEA;--sa-sunt:#FAF2DC;color:var(--sa-i);max-width:640px;margin:0 auto;font-family:inherit}
@supports (color:color-mix(in srgb,red,blue)){.sa-root{--sa-mute:color-mix(in srgb,var(--sa-i) 72%,var(--sa-s));--sa-okt:color-mix(in srgb,var(--sa-ok) 16%,var(--sa-s));--sa-badt:color-mix(in srgb,var(--sa-bad) 14%,var(--sa-s));--sa-sunt:color-mix(in srgb,var(--sa-sun) 32%,var(--sa-s))}}
.sa-root *{box-sizing:border-box}
.sa-root [hidden]{display:none!important}
.sa-root :focus-visible{outline:3px solid var(--sa-i);outline-offset:1px;box-shadow:0 0 0 5px var(--sa-sun)}
.sa-es{display:none;font-size:.82em;font-weight:600;color:var(--sa-b);line-height:1.25}
body.show-es .sa-es,.sa-root[data-es="1"] .sa-es{display:block}
.sa-btn{appearance:none;font:inherit;font-weight:800;min-height:44px;min-width:44px;padding:8px 14px;border-radius:var(--sa-r);border:2px solid var(--sa-bl);border-bottom-width:4px;background:var(--sa-s);color:var(--sa-b);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;text-align:center}
.sa-btn:hover:not([disabled]){background:var(--sa-bt);border-color:var(--sa-b)}
.sa-btn:active:not([disabled]){transform:translateY(2px);border-bottom-width:2px}
.sa-btn[disabled]{opacity:.5;cursor:not-allowed}
.sa-btn[aria-pressed="true"]{background:var(--sa-sunt);border-color:var(--sa-dk);box-shadow:inset 0 0 0 2px var(--sa-dk)}
.sa-btn.sa-go{background:var(--sa-b);color:var(--sa-s);border-color:var(--sa-dk)}
.sa-status{min-height:1.5em;margin:8px 0 0;font-weight:700;color:var(--sa-mute)}
.sa-status.sa-bad{color:var(--sa-bad)}
.sa-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
.fc-list{display:grid;gap:10px;margin:8px 0}
.fc-card{display:grid;grid-template-columns:64px 1fr;gap:6px 12px;align-items:center;padding:10px;border:2px solid var(--sa-bd);border-radius:var(--sa-r);background:var(--sa-s)}
.fc-card svg{width:64px;height:56px}
.fc-card .fc-shape{fill:var(--sa-bt);stroke:var(--sa-dk);stroke-width:2}
.fc-name{font-weight:800;line-height:1.25}
.fc-area{font-weight:700;color:var(--sa-mute)}
.fc-step{grid-column:1/-1;display:flex;align-items:center;gap:8px;justify-content:flex-end;font-weight:800}
.fc-step output{min-width:2em;text-align:center;font-size:1.4rem;font-weight:900}
.fc-sum{font-weight:800;text-align:center;font-size:1.1rem;margin:6px 0;overflow-wrap:anywhere}
@media (forced-colors:active){.sa-btn{border-color:ButtonText}.fc-card .fc-shape{stroke:CanvasText}}
`;

  function shapeSvg(/** @type {any} */ k) {
    const body =
      k.shape === "tri"
        ? `<polygon class="fc-shape" points="6,50 58,50 40,8"/><line x1="40" y1="8" x2="40" y2="50" stroke="currentColor" stroke-dasharray="3 3"/>`
        : `<rect class="fc-shape" x="6" y="10" width="52" height="38" rx="2"/>`;
    return `<svg viewBox="0 0 64 56" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("faces", CSS);
    const m = spec.model;
    const ro = !!api.solved;
    const L = (/** @type {string} */ en, /** @type {string} */ es) =>
      api.es && api.es() ? es : en;
    const T = (/** @type {string} */ en, /** @type {string} */ es) =>
      `${en}<span class="sa-es" lang="es">${es}</span>`;
    const root = A.el("div", "sa-root");
    if (api.es?.()) root.setAttribute("data-es", "1");
    host.replaceChildren(root);
    const st = /** @type {any} */ ({ c: m.types.map(() => 0) });
    if (api.restore) Object.assign(st, clone(api.restore));
    const emit = () => api.change?.(clone(st));
    const status = A.el("p", "sa-status");
    status.setAttribute("aria-live", "polite");
    const say = (/** @type {string} */ en, /** @type {string} */ es) => {
      status.innerHTML = T(en, es);
      api.say?.(L(en, es));
    };
    const list = A.el("div", "fc-list", "", { role: "group" });
    const sum = A.el("div", "fc-sum");
    root.append(list, sum, status);
    const outs = /** @type {HTMLElement[]} */ ([]);
    m.types.forEach((/** @type {any} */ k, /** @type {number} */ i) => {
      const card = A.el("div", "fc-card");
      card.insertAdjacentHTML("afterbegin", shapeSvg(k));
      const info = A.el("div");
      info.append(
        A.el("div", "fc-name", T(k.en, k.es)),
        A.el("div", "fc-area", `${k.area} ${spec.unit}² each`),
      );
      const step = A.el("div", "fc-step");
      const out = A.el("output", "", "0", { "aria-live": "polite" });
      outs.push(out);
      const mk = (/** @type {number} */ d, /** @type {string} */ sym) => {
        const b = A.el("button", "sa-btn", sym, {
          type: "button",
          "aria-label": L(
            `${d > 0 ? "More" : "Fewer"}: ${k.en}`,
            `${d > 0 ? "Más" : "Menos"}: ${k.es}`,
          ),
        });
        b.disabled = ro;
        b.addEventListener("click", () => {
          st.c[i] = Math.max(0, Math.min(12, (st.c[i] || 0) + d));
          paint();
          emit();
        });
        return b;
      };
      step.append(A.el("span", "", T("How many?", "¿Cuántas?")), mk(-1, "−"), out, mk(1, "+"));
      card.append(info, step);
      list.append(card);
    });
    function paint() {
      outs.forEach((o, i) => {
        o.textContent = String(st.c[i] || 0);
      });
      const parts = m.types
        .map((/** @type {any} */ k, /** @type {number} */ i) =>
          st.c[i] ? `${st.c[i]} × ${k.area}` : "",
        )
        .filter(Boolean);
      const t = r1(m.types.reduce((a, k, i) => a + k.area * (st.c[i] || 0), 0));
      sum.textContent = parts.length ? `${parts.join(" + ")} = ${t} ${spec.unit}²` : "";
    }
    if (!ro) {
      const chk = A.el("button", "sa-btn sa-go", T("Check", "Comprobar"), {
        type: "button",
        "aria-label": L("Check my answer", "Comprobar mi respuesta"),
      });
      chk.addEventListener("click", () => api.submit?.(clone(st)));
      const r = A.el("div", "sa-row");
      r.append(chk);
      root.append(r);
    }
    paint();
    if (ro) say("Solved.", "Resuelto.");
  }

  A.register("faces", {
    title: "Faces",
    titleEs: "Caras",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();
