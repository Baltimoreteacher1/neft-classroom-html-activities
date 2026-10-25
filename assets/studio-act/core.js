/**
 * Practice Studio activity core (window.StudioAct).
 *
 * An activity is a pure model (make / solution / wrong / grade) plus a DOM widget (mount). The pure half is what
 * tools/studio-act.test.mjs exercises for hundreds of seeds; the widget is exercised in a real browser.
 * Contract: docs/specs/practice-studio-v2.md section 5. Needs assets/studio-gen/core.js loaded first (shared rng).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = (W.StudioAct = W.StudioAct || {});
  A.registry = A.registry || {};

  A.register = (/** @type {string} */ kind, /** @type {any} */ def) => {
    if (A.registry[kind]) throw new Error(`StudioAct: duplicate activity ${kind}`);
    for (const fn of ["make", "solution", "wrong", "grade", "mount"])
      if (typeof def[fn] !== "function") throw new Error(`StudioAct: ${kind} needs ${fn}()`);
    const registered = { levels: 4, ...def, kind };
    if (["faces", "netfold", "packcrate", "wrapit"].includes(kind)) {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const m = spec.model || {};
          const isPyramid = kind === "wrapit" && m.mode === "pyramid";
          const dims = m.dims || m.edges || (isPyramid ? [m.s, m.s, m.H] : []);
          const unit = m.unit || spec.unit || "u";
          const esc = (v) =>
            String(v ?? "").replace(
              /[&<>\"']/g,
              (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
            );
          const l = Number(dims[0]) || 1;
          const w = Number(dims[1]) || 1;
          const h = Number(dims[2]) || 1;
          const boxArea = 2 * (l * w + l * h + w * h);
          const volume = l * w * h;
          let equation = isPyramid
            ? `SA = ${m.s}² + 4(½×${m.s}×${m.l}) = ${m.total} ${unit}² · V = ${m.s}²×${m.H}÷3 = ${((m.s * m.s * m.H) / 3).toFixed(2)} ${unit}³`
            : `SA = 2(${l}×${w}) + 2(${l}×${h}) + 2(${w}×${h}) = ${boxArea} ${unit}² · V = ${l}×${w}×${h} = ${volume} ${unit}³`;
          if (kind === "faces" && Array.isArray(m.types)) {
            const counts = current?.c || m.types.map((t) => t.count || 0);
            equation =
              m.types.map((t, i) => `${counts[i] || 0}×${t.area}`).join(" + ") +
              ` = ${m.types.reduce((sum, t, i) => sum + (counts[i] || 0) * t.area, 0)} ${unit}²`;
          } else if (kind === "wrapit" && !isPyramid && Number.isFinite(Number(current?.total))) {
            equation = `Surface area = ${esc(current.total)} ${unit}² · paint cost = ${esc(current.cost || "—")}`;
          } else if (kind === "packcrate") {
            equation = `${m.n?.join(" × ") || dims.join(" × ")} small cubes; V = ${dims.join(" × ")} ÷ 64 = ${m.vol} ${unit}³`;
          }
          const solid = isPyramid
            ? `<path d="M90 18 28 106 150 106 90 18M90 18v88M28 106 90 56l60 50" fill="none" stroke="var(--brand,#365b7d)" stroke-width="3"/><text x="72" y="120">base ${m.s}</text><text x="128" y="61">slant ${m.l}</text><text x="94" y="72">H=${m.H}</text>`
            : `<path d="M28 42 92 20 148 42 84 64Z M28 42v55l56 24V64m0 57V64l64-22v55l-64 24" fill="none" stroke="var(--brand,#365b7d)" stroke-width="3"/><text x="42" y="116">l=${esc(dims[0] ?? l)}</text><text x="112" y="28">w=${esc(dims[1] ?? w)}</text><text x="154" y="78">h=${esc(dims[2] ?? h)}</text>`;
          const net = isPyramid
            ? `<rect x="78" y="38" width="54" height="46" fill="var(--brand-tint,#dbe8f3)" stroke="var(--brand,#365b7d)"/><path d="M78 38 105 5l27 33m-54 46 27 33 27-33m-54 0 27-33 27 33" fill="var(--sun-tint,#fff0c2)" stroke="var(--sun-deep,#bd8c13)"/><text x="105" y="63" text-anchor="middle">base</text><text x="105" y="30" text-anchor="middle">4 triangles</text>`
            : `<rect x="68" y="4" width="74" height="25" fill="var(--brand-tint,#dbe8f3)" stroke="var(--brand,#365b7d)"/><rect x="68" y="29" width="74" height="36" fill="var(--sun-tint,#fff0c2)" stroke="var(--sun-deep,#bd8c13)"/><rect x="68" y="65" width="74" height="25" fill="var(--brand-tint,#dbe8f3)" stroke="var(--brand,#365b7d)"/><rect x="38" y="29" width="30" height="36" fill="var(--ok-tint,#d9efe3)" stroke="var(--ok,#347b50)"/><rect x="142" y="29" width="30" height="36" fill="var(--ok-tint,#d9efe3)" stroke="var(--ok,#347b50)"/><text x="105" y="21" text-anchor="middle">Top</text><text x="105" y="52" text-anchor="middle">Front</text><text x="105" y="82" text-anchor="middle">Bottom</text><text x="52" y="51" text-anchor="middle">Left</text><text x="157" y="51" text-anchor="middle">Right</text>`;
          linked.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;align-items:center"><svg viewBox="0 0 180 128" role="img" aria-label="Isometric ${isPyramid ? "square pyramid" : "rectangular prism"} wireframe with dimensions" style="width:100%;height:auto">${solid}</svg><svg viewBox="0 0 210 115" role="img" aria-label="Unfolded net with matching face pairs" style="width:100%;height:auto">${net}</svg></div><figcaption class="u5-solid-equation" style="font-weight:700">${equation}</figcaption>`;
          linked.setAttribute(
            "aria-label",
            `Solid dimensions ${dims.join(" by ")} ${unit}; ${equation}`,
          );
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u5-solid-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0";
        host.append(linked);
        draw();
      };
    }
    if (["thermo", "absbench", "dualrank", "nline"].includes(kind)) {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const m = spec.model || {};
          const raw = m.vals || m.nums || m.want || spec.want || [];
          let vals = (Array.isArray(raw) ? raw : [raw])
            .flatMap((v) => (Array.isArray(v) ? v : [v]))
            .map((v) => Number(typeof v === "object" ? (v.t ?? v.v) : v))
            .filter(Number.isFinite);
          if (Array.isArray(current?.pts) && current.pts.length)
            vals = current.pts.map(Number).filter(Number.isFinite);
          else if (Array.isArray(current?.seq) && current.seq.length && Array.isArray(spec.items)) {
            vals = current.seq.map((i) => Number(spec.items[i]?.v)).filter(Number.isFinite);
          }
          if (Array.isArray(current?.pick) && Array.isArray(m.vals) && current.pick.length) {
            const chosen = current.pick.map((i) => Number(m.vals[i])).filter(Number.isFinite);
            if (chosen.length) vals = chosen;
          }
          if (!vals.length) vals.push(0);
          const active = Number(current?.v ?? current?.value ?? vals[0]);
          const lo = Math.min(-1, ...vals, active);
          const hi = Math.max(1, ...vals, active);
          const px = (v) => 18 + ((v - lo) / (hi - lo || 1)) * 264;
          const marks = [...new Set([lo, 0, hi, ...vals, active])].sort((a, b) => a - b);
          const pts = marks
            .map(
              (v) =>
                `<line x1="${px(v)}" y1="40" x2="${px(v)}" y2="52" stroke="var(--ink,#223)"/><text x="${px(v)}" y="70" text-anchor="middle" font-size="11">${v}</text>`,
            )
            .join("");
          const picked = Number.isFinite(active) ? active : vals[0];
          const reflection = -picked;
          const selection = Array.isArray(current?.pick)
            ? ` · Linked bin placements: ${current.pick.map((v, i) => (v == null ? `item ${i + 1} unplaced` : `item ${i + 1} → bin ${v + 1}`)).join(", ")}`
            : Number.isInteger(current?.far0) || Number.isInteger(current?.right)
              ? ` · Order choices: farther from 0 = ${m.nums?.[current?.far0] ?? "—"}; farther right = ${m.nums?.[current?.right] ?? "—"}`
              : "";
          const ty = 82 - ((picked - lo) / (hi - lo || 1)) * 64;
          linked.innerHTML = `<div style="display:grid;grid-template-columns:64px minmax(0,1fr);gap:8px;align-items:center"><svg viewBox="0 0 64 100" role="img" aria-label="Vertical thermometer or elevation scale at ${picked}"><path d="M29 18a8 8 0 0 1 16 0v53a14 14 0 1 1-16 0Z" fill="none" stroke="var(--brand,#365b7d)" stroke-width="3"/><line x1="37" y1="26" x2="37" y2="${ty}" stroke="var(--bad,#b42318)" stroke-width="5"/><circle cx="37" cy="80" r="9" fill="var(--bad,#b42318)"/><text x="4" y="${ty + 4}" font-size="10">${picked}</text></svg><svg viewBox="0 0 300 88" role="img" aria-label="Signed number line with opposite reflection and absolute value distance"><line x1="18" y1="46" x2="282" y2="46" stroke="var(--ink,#223)" stroke-width="2"/>${pts}<path d="M ${px(picked)} 34 Q ${px((picked + reflection) / 2)} 4 ${px(reflection)} 34" fill="none" stroke="var(--brand,#365b7d)" stroke-dasharray="5 3"/><circle cx="${px(picked)}" cy="46" r="5" fill="var(--bad,#b42318)"/><circle cx="${px(reflection)}" cy="46" r="5" fill="var(--ok,#347b50)"/></svg></div><figcaption class="u7-rat-readout" style="font-weight:700">n = ${picked}; −n = ${reflection}; |n| = ${Math.abs(picked)}${vals.length > 1 ? ` · Order: ${Math.min(...vals)} < ${Math.max(...vals)} · magnitudes: ${Math.abs(Math.min(...vals))}, ${Math.abs(Math.max(...vals))}` : ""}${selection}</figcaption>`;
          linked.setAttribute(
            "aria-label",
            `Signed number line at ${picked}; opposite ${reflection}; absolute value ${Math.abs(picked)}`,
          );
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u7-rat-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0";
        host.append(linked);
        draw();
      };
    }
    if (["tiles", "cexhunt"].includes(kind)) {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const m = spec.model || {};
          let left = "",
            right = "",
            evalLeft,
            evalRight;
          if (kind === "tiles") {
            const a = Number(m.a) || 0,
              b = Number(m.b) || 0;
            const factor = Number(m.n) || 1;
            const gx = m.grp?.reduce((s, t) => s + (t.k === "x" ? t.c : 0), 0) || a;
            const gu = m.grp?.reduce((s, t) => s + (t.k === "u" ? t.c : 0), 0) || b;
            left = ["equivalent", "simplify"].includes(spec.mode)
              ? `${factor}(${gx}x ${gu < 0 ? "−" : "+"} ${Math.abs(gu)})`
              : right;
            if (!left) left = `${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}`;
            right = `${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}`;
            evalLeft = (x) =>
              ["equivalent", "simplify"].includes(spec.mode)
                ? factor * (gx * x + gu) +
                  (Number(m.extra?.filter((t) => t.k === "x").reduce((s, t) => s + t.c, 0)) || 0) *
                    x +
                  (Number(m.extra?.filter((t) => t.k === "u").reduce((s, t) => s + t.c, 0)) || 0)
                : a * x + b;
            evalRight = (x) => a * x + b;
          } else {
            left = m.a?.s || "Expression A";
            right = m.b?.s || "Expression B";
            const p = m.a?.p || [0, 0, 0],
              q = m.b?.p || [0, 0, 0];
            evalLeft = (x) => p[0] * x * x + p[1] * x + p[2];
            evalRight = (x) => q[0] * x * x + q[1] * x + q[2];
          }
          const xs =
            kind === "cexhunt" && current?.tests?.length
              ? current.tests.slice(0, 3).map(Number)
              : [1, 2, 3];
          const rows = xs
            .map(
              (x) =>
                `<tr><th>x = ${x}</th><td>${evalLeft(x)}</td><td>${evalRight(x)}</td><td>${evalLeft(x) === evalRight(x) ? "✓" : "≠"}</td></tr>`,
            )
            .join("");
          const liveTiles = Array.isArray(current?.g)
            ? ` · Live tile array: ${current.g.filter((t) => t.k === "x").length} x-tiles and ${current.g.filter((t) => t.k === "u").length} unit tiles`
            : current
              ? ` · Current build: ${Number(current.c) || 0} copies; tile-bank counts ${Array.isArray(current.m) ? current.m.join(", ") : "not placed"}`
              : "";
          linked.innerHTML = `<div style="display:grid;grid-template-columns:minmax(110px,1fr) minmax(190px,2fr);gap:10px;align-items:center"><svg viewBox="0 0 140 100" role="img" aria-label="Algebra tiles showing x bars and unit tiles" style="width:100%;height:auto"><rect x="8" y="8" width="78" height="26" rx="3" fill="var(--brand-tint,#dbe8f3)" stroke="var(--brand,#365b7d)"/><text x="47" y="26" text-anchor="middle">x tiles</text><rect x="8" y="42" width="24" height="24" rx="3" fill="var(--sun-tint,#fff0c2)" stroke="var(--sun-deep,#bd8c13)"/><text x="20" y="59" text-anchor="middle">1</text><rect x="38" y="42" width="24" height="24" rx="3" fill="var(--sun-tint,#fff0c2)" stroke="var(--sun-deep,#bd8c13)"/><text x="50" y="59" text-anchor="middle">1</text><path d="M8 78h78" stroke="var(--ink,#223)" stroke-width="2"/><text x="47" y="94" text-anchor="middle">area = width × height</text></svg><div><strong>${left} = ${right}</strong><table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr><th>Substitution</th><th>Factored</th><th>Expanded</th><th>Match</th></tr></thead><tbody>${rows}</tbody></table></div></div><figcaption>Both forms are evaluated at x = 1, 2, and 3 using the same expression coefficients.${liveTiles}</figcaption>`;
          linked.setAttribute(
            "aria-label",
            `Equivalent expressions ${left} and ${right}; substitution results at 1, 2 and 3`,
          );
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u6-alg-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0;overflow:auto";
        host.append(linked);
        draw();
      };
    }
    if (kind === "balance") {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const m = spec.model || {};
          const val = (r) =>
            Array.isArray(r) ? Number(r[0]) / (Number(r[1]) || 1) : Number(r) || 0;
          let c = val(m.c),
            k = val(m.k),
            e = val(m.e);
          const ops = current?.ops || [];
          const steps = [];
          const fmt = (n) => Number((Math.round(n * 100) / 100).toFixed(2)).toString();
          const equation = () => `${fmt(c)}x ${k < 0 ? "−" : "+"} ${fmt(Math.abs(k))} = ${fmt(e)}`;
          steps.push(equation());
          for (const op of ops) {
            const v = val(op.v);
            if (op.o === "+") (k += v), (e += v);
            else if (op.o === "-") (k -= v), (e -= v);
            else if (op.o === "*") (c *= v), (k *= v), (e *= v);
            else if (op.o === "/" && v) (c /= v), (k /= v), (e /= v);
            steps.push(equation());
          }
          const x = c ? (e - k) / c : 0;
          const lhs = val(m.c) * x + val(m.k),
            rhs = val(m.e);
          const stepHtml = steps.map((s, i) => `<div>${i + 1}. ${s}</div>`).join("");
          linked.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;align-items:center"><svg viewBox="0 0 190 105" role="img" aria-label="Pan balance showing equal sides after each operation" style="width:100%;height:auto"><path d="M95 25v57m-42 0h84m-60-3 18-35m60 35L113 44M44 44h40m22 0h40" fill="none" stroke="var(--brand,#365b7d)" stroke-width="4"/><path d="M45 44v16h38V44m24 0v16h38V44" fill="var(--brand-tint,#dbe8f3)" stroke="var(--brand,#365b7d)" stroke-width="2"/><text x="64" y="57" text-anchor="middle">x + ${fmt(Math.abs(k))}</text><text x="126" y="57" text-anchor="middle">${fmt(e)}</text></svg><svg viewBox="0 0 220 76" role="img" aria-label="Tape model decomposing the total into variable and constant parts" style="width:100%;height:auto"><rect x="8" y="18" width="${Math.max(30, 190 * Math.min(1, Math.abs(x) / (Math.abs(x) + Math.abs(k) + 1)))}" height="32" fill="var(--brand-tint,#dbe8f3)" stroke="var(--brand,#365b7d)"/><rect x="8" y="18" width="190" height="32" fill="none" stroke="var(--ink,#223)"/><text x="12" y="68">x = ${fmt(x)}; constant = ${fmt(k)}</text></svg></div><div class="u8-eq-steps" style="font-size:.95rem;line-height:1.5">${stepHtml}<strong>Check: ${fmt(lhs)} = ${fmt(rhs)} when x = ${fmt((val(m.e) - val(m.k)) / (val(m.c) || 1))}</strong></div>`;
          linked.setAttribute(
            "aria-label",
            `Balance equation ${equation()}; inverse-operation steps ${ops.length}; solution check ${fmt(lhs)} equals ${fmt(rhs)}`,
          );
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u8-eq-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0";
        host.append(linked);
        draw();
      };
    }
    if (kind === "boundary") {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const n = Number(spec.model?.n ?? spec.n) || 0;
          const op = current?.sym || spec.want?.sym || spec.model?.op || ">";
          const strict = op === ">" || op === "<";
          const right = op === ">" || op === ">=";
          const x = (v) => 24 + ((v - (n - 2)) / 4) * 252;
          const vals = [n - 1, n, n + 1];
          const holds = (v) =>
            op === ">" ? v > n : op === ">=" ? v >= n : op === "<" ? v < n : v <= n;
          const tests = vals
            .map(
              (v, i) =>
                `<span><b>${v}</b>: ${holds(v) ? "True" : "False"}${current?.m?.[i] === true ? " ✓" : current?.m?.[i] === false ? " ✗" : ""}</span>`,
            )
            .join(" · ");
          linked.innerHTML = `<svg viewBox="0 0 300 78" role="img" aria-label="Number line ray for x ${op} ${n}"><line x1="18" y1="40" x2="282" y2="40" stroke="var(--ink,#223)" stroke-width="2"/><path d="M${right ? x(n) : 18} 40H${right ? 282 : x(n)}" stroke="var(--brand,#365b7d)" stroke-width="8"/><path d="M${right ? 274 : 18} 33l8 7-8 7" fill="none" stroke="var(--brand,#365b7d)" stroke-width="3"/><circle cx="${x(n)}" cy="40" r="7" fill="${strict ? "var(--surface,#fff)" : "var(--brand,#365b7d)"}" stroke="var(--brand,#365b7d)" stroke-width="3"/><text x="${x(n)}" y="68" text-anchor="middle">${n}</text></svg><strong class="u8-ineq-statement">x ${op} ${n}</strong><div class="u8-ineq-tests" style="display:flex;flex-wrap:wrap;gap:8px">${tests}</div>`;
          linked.setAttribute(
            "aria-label",
            `Inequality x ${op} ${n}. Test values ${vals.join(", ")}: ${vals.map((v) => `${v} ${holds(v) ? "true" : "false"}`).join("; ")}`,
          );
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u8-ineq-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0";
        host.append(linked);
        draw();
      };
    }
    if (["ldiv", "chipsort"].includes(kind)) {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const m = spec.model || {};
          if (kind === "chipsort") {
            const placements = current?.place || [];
            const rows = (m.bins || [])
              .map((bin, i) => {
                const ci = placements.findIndex((placement) => placement === i);
                const answer = ci >= 0 ? m.chips?.[ci] : null;
                return `<tr${answer ? ' style="background:var(--brand-tint,#e5ecf3);font-weight:800"' : ""}><th>${bin.l}</th><td>${answer?.v ?? "—"}</td></tr>`;
              })
              .join("");
            const d = Number(m.d) || 1,
              q = Number(m.q) || 0,
              r = Number(m.r) || 0,
              D = Number(m.D) || q * d + r;
            linked.innerHTML = `<div style="display:grid;grid-template-columns:minmax(130px,1fr) minmax(180px,1fr);gap:10px;align-items:center"><svg viewBox="0 0 240 64" role="img" aria-label="${D} items partitioned into ${d} per group" style="width:100%;height:auto"><rect x="8" y="8" width="${Math.max(20, Math.min(220, (220 * q) / (q + 1)))}" height="24" fill="var(--brand-tint,#dbe8f3)" stroke="var(--brand,#365b7d)"/><rect x="${8 + Math.max(20, Math.min(220, (220 * q) / (q + 1)))}" y="8" width="${Math.max(8, 220 / (q + 1))}" height="24" fill="var(--sun-tint,#fff0c2)" stroke="var(--sun-deep,#bd8c13)"/><text x="8" y="55">${q} full groups · ${r} remainder · ${D} ÷ ${d} = ${q} R ${r}</text></svg><table style="width:100%;border-collapse:collapse"><thead><tr><th>What the answer counts</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table></div><figcaption>Full groups, remainder items, and the number of containers needed are different interpretations of the same division.</figcaption>`;
            linked.setAttribute(
              "aria-label",
              `${D} divided by ${d} is ${q} remainder ${r}; ${placements.filter((v) => v != null).length} interpretation chips placed`,
            );
            return;
          }
          const active = Math.min((current?.steps || []).length, (m.E || []).length - 1);
          const rows = (m.E || [])
            .map(
              (e, i) =>
                `<tr${i === active ? ' aria-current="step" style="background:var(--brand-tint,#e5ecf3);font-weight:800"' : ""}><td>${e.k}</td><td>${e.v}</td><td>${i < (current?.steps || []).length ? "recorded" : "next"}</td></tr>`,
            )
            .join("");
          const divisor = Number(m.D) || 1;
          const quotient = Number(m.quoNum) || 0;
          const groups = Math.max(1, Math.min(24, Math.floor(quotient)));
          const bars = Array.from(
            { length: groups },
            (_, i) =>
              `<rect x="${8 + (i % 12) * 22}" y="${10 + Math.floor(i / 12) * 23}" width="19" height="18" rx="2" fill="${i < (current?.steps || []).length ? "var(--brand,#365b7d)" : "var(--brand-tint,#dbe8f3)"}" stroke="var(--brand,#365b7d)"/>`,
          ).join("");
          const ans = m.decimal ? m.quo : `${m.quo}${m.rem ? ` R ${m.rem}` : ""}`;
          const estimate =
            current?.est == null
              ? ""
              : ` · Selected quotient estimate: ${m.est?.chips?.[current.est]?.[2] || "saved estimate"}`;
          linked.innerHTML = `<div style="display:grid;grid-template-columns:minmax(130px,1fr) minmax(180px,1fr);gap:10px;align-items:center"><svg viewBox="0 0 280 65" role="img" aria-label="Place-value grouping model for division by ${divisor}" style="width:100%;height:auto">${bars}<text x="8" y="62">groups of ${divisor}</text></svg><div><strong>${m.expr} = ${ans}</strong><table style="width:100%;border-collapse:collapse"><thead><tr><th>Step</th><th>Value</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div><figcaption>Partial quotient work follows divide, multiply, subtract, and bring down; the current row tracks the next entered step${estimate}.</figcaption>`;
          linked.setAttribute(
            "aria-label",
            `Place-value division model for ${m.expr}; ${current?.steps?.length || 0} of ${(m.E || []).length} algorithm entries recorded`,
          );
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u2-div-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0;overflow:auto";
        host.append(linked);
        draw();
      };
    }
    if (["hops", "ftree", "twotrees", "brickwall", "factorbox"].includes(kind)) {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const m = spec.model || {};
          let nums =
            kind === "brickwall"
              ? [m.a, m.b]
              : kind === "factorbox"
                ? (m.cs || []).map((v) => Math.abs(Number(v)))
                : kind === "hops"
                  ? (m.steps || m.targets || []).map((v) => Number(v))
                  : [m.n || m.N];
          nums = nums
            .map(Number)
            .filter((v) => Number.isInteger(v) && v > 1)
            .slice(0, 4);
          if (!nums.length) nums = [2];
          const factor = (value) => {
            let n = value;
            const map = {};
            for (let p = 2; p * p <= n; p++)
              while (n % p === 0) {
                map[p] = (map[p] || 0) + 1;
                n /= p;
              }
            if (n > 1) map[n] = (map[n] || 0) + 1;
            return map;
          };
          const maps = nums.map(factor);
          const primes = [...new Set(maps.flatMap((v) => Object.keys(v).map(Number)))].sort(
            (a, b) => a - b,
          );
          const common = primes.filter((p) => maps.every((map) => map[p]));
          const gcf = common.reduce(
            (v, p) => v * p ** Math.min(...maps.map((map) => map[p] || 0)),
            1,
          );
          const lcm = primes.reduce(
            (v, p) => v * p ** Math.max(...maps.map((map) => map[p] || 0)),
            1,
          );
          const factorTexts = maps.map((map) =>
            Object.entries(map)
              .map(([p, e]) => `${p}${e > 1 ? `^${e}` : ""}`)
              .join(" × "),
          );
          const pLabels = primes
            .map(
              (p) =>
                `<span style="display:inline-block;margin:3px;padding:4px 8px;border:2px solid ${common.includes(p) ? "var(--ok,#38804e)" : "var(--brand-line,#678)"};border-radius:999px;background:${common.includes(p) ? "var(--ok-tint,#e1f2e5)" : "var(--brand-tint,#e4edf5)"}">${p}${common.includes(p) ? " · shared" : ""}</span>`,
            )
            .join("");
          linked.innerHTML = `<svg viewBox="0 0 300 90" role="img" aria-label="Prime factors shared across values ${nums.join(" and ")}" style="width:100%;height:auto"><ellipse cx="112" cy="45" rx="76" ry="36" fill="var(--brand-tint,#e4edf5)" fill-opacity=".7" stroke="var(--brand,#365b7d)" stroke-width="2"/><ellipse cx="188" cy="45" rx="76" ry="36" fill="var(--sun-tint,#fff0c2)" fill-opacity=".65" stroke="var(--sun-deep,#bd8c13)" stroke-width="2"/><text x="65" y="20" text-anchor="middle">${nums[0]}</text><text x="235" y="20" text-anchor="middle">${nums[1] || nums[0]}</text><text x="150" y="52" text-anchor="middle">${common.join(", ") || "no common prime"}</text></svg><div>${pLabels}</div><figcaption><strong>Prime factorizations:</strong> ${nums.map((n, i) => `${n} = ${factorTexts[i]}`).join("; ")}<br><strong>GCF (intersection product):</strong> ${gcf} · <strong>LCM (union product):</strong> ${lcm}</figcaption>`;
          linked.setAttribute(
            "aria-label",
            `Prime factor intersection for ${nums.join(", ")}; GCF ${gcf}; LCM ${lcm}`,
          );
          if (current) linked.dataset.progress = JSON.stringify(current).slice(0, 180);
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u6-factor-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0";
        host.append(linked);
        draw();
      };
    }
    if (["allpoints", "reflectpredict", "rectcorners", "griddetect"].includes(kind)) {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const m = spec.model || {};
          let points = [];
          if (kind === "reflectpredict") {
            const p = m.p || spec.p || [0, 0];
            points = [Array.isArray(p) ? p.map(Number) : [Number(p.x) || 0, Number(p.y) || 0]];
          }
          if (kind === "reflectpredict" && Array.isArray(current?.pt))
            points = [current.pt.map(Number)];
          if (Array.isArray(current?.pts))
            points = current.pts.map((p) => (Array.isArray(p) ? p.map(Number) : p));
          else if (Array.isArray(current?.points))
            points = current.points.map((p) => (Array.isArray(p) ? p.map(Number) : p));
          if (kind === "griddetect" && Array.isArray(current?.guesses))
            points = current.guesses.map((p) => p.map(Number));
          points = points
            .filter(
              (p) =>
                Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])),
            )
            .slice(0, 8);
          const max = Math.max(5, ...points.flat().map((n) => Math.abs(Number(n))));
          const sx = (x) => 150 + (Number(x) / max) * 112;
          const sy = (y) => 110 - (Number(y) / max) * 92;
          const dots = points
            .map(
              (p, i) =>
                `<line x1="${sx(p[0])}" y1="${sy(p[1])}" x2="${sx(p[0])}" y2="110" stroke="var(--brand,#365b7d)" stroke-dasharray="4 3"/><line x1="${sx(p[0])}" y1="${sy(p[1])}" x2="150" y2="${sy(p[1])}" stroke="var(--brand,#365b7d)" stroke-dasharray="4 3"/><circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="5" fill="var(--bad,#b42318)"/><text x="${sx(p[0]) + 5}" y="${sy(p[1]) - 7}" font-size="11">P${i + 1}(${p[0]},${p[1]})</text>`,
            )
            .join("");
          const first = points[0] || [0, 0];
          const quadrant = `${first[0] < 0 ? "−" : "+"}, ${first[1] < 0 ? "−" : "+"}`;
          const table = points
            .map(
              (p, i) =>
                `<tr><th>P${i + 1} (${p[0]}, ${p[1]})</th><td>Quadrant signs (${p[0] < 0 ? "−" : "+"}, ${p[1] < 0 ? "−" : "+"})</td><td>Across x: (${p[0]}, ${-p[1]})</td><td>Across y: (${-p[0]}, ${p[1]})</td></tr>`,
            )
            .join("");
          const distance =
            points.length > 1
              ? `Distance: |${points[1][0]} − ${points[0][0]}| = ${Math.abs(points[1][0] - points[0][0])} horizontally; |${points[1][1]} − ${points[0][1]}| = ${Math.abs(points[1][1] - points[0][1])} vertically.`
              : `Point sign pair: (${quadrant}); |x| = ${Math.abs(first[0])}, |y| = ${Math.abs(first[1])}.`;
          linked.innerHTML = `<div style="display:grid;grid-template-columns:minmax(190px,1fr) minmax(220px,1.4fr);gap:8px;align-items:center"><svg viewBox="0 0 300 220" role="img" aria-label="Four-quadrant coordinate plane with projected points"><path d="M20 110H280M150 205V15" stroke="var(--ink,#223)" stroke-width="2"/><path d="M45 106v8m25-8v8m25-8v8m25-8v8m25-8v8m25-8v8m25-8v8m25-8v8m25-8v8M146 35h8m-8 25h8m-8 25h8m-8 25h8m-8 25h8m-8 25h8m-8 25h8" stroke="var(--border-strong,#879)"/>${dots}</svg><table style="width:100%;border-collapse:collapse"><thead><tr><th>Point</th><th>Quadrant</th><th>Reflect x</th><th>Reflect y</th></tr></thead><tbody>${table}</tbody></table></div><figcaption>${distance}</figcaption>`;
          linked.setAttribute(
            "aria-label",
            `Coordinate plane with ${points.length} points, quadrant ${quadrant}. ${distance}`,
          );
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u7-coord-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0;overflow:auto";
        host.append(linked);
        draw();
      };
    }
    if (["dotbalance", "chartbuild", "boxtwins", "madtwins", "skewsculptor"].includes(kind)) {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let linked = null;
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        const renderLinked = () => {
          if (!linked) return;
          let values = [];
          const model = spec.model || {};
          if (kind === "dotbalance") values = current?.dots || model.start || [];
          else if (kind === "boxtwins" || kind === "madtwins")
            values = current?.a || model.start || [];
          else if (kind === "chartbuild") values = model.data || [];
          else if (kind === "skewsculptor") {
            const counts = current?.skew || model.start || [];
            const width = Number(model.w0) || 1;
            values = counts.flatMap((count, index) =>
              Array(Math.max(0, Math.floor(count))).fill(index * width + width / 2),
            );
          }
          values = values
            .map(Number)
            .filter(Number.isFinite)
            .sort((a, b) => a - b);
          if (!values.length) return;
          const med = (list) => {
            const n = list.length;
            return n % 2 ? list[(n - 1) / 2] : (list[n / 2 - 1] + list[n / 2]) / 2;
          };
          const half = Math.floor(values.length / 2);
          const center = med(values);
          const lower = values.slice(0, half);
          const upper = values.slice(values.length - half);
          const q1 = med(lower.length ? lower : values);
          const q3 = med(upper.length ? upper : values);
          const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
          const mad = values.reduce((sum, v) => sum + Math.abs(v - mean), 0) / values.length;
          const min = values[0];
          const max = values[values.length - 1];
          const span = Math.max(max - min, 1);
          const x = (v) => 22 + ((v - min) / span) * 256;
          const fmt = (v) => Number(v.toFixed(2)).toString();
          linked.setAttribute(
            "aria-label",
            `Five-number summary: minimum ${fmt(min)}, first quartile ${fmt(q1)}, median ${fmt(center)}, third quartile ${fmt(q3)}, maximum ${fmt(max)}. Mean ${fmt(mean)}; mean absolute deviation ${fmt(mad)}.`,
          );
          linked.innerHTML = `<div class="u2-stat-summary" style="display:flex;flex-wrap:wrap;gap:6px 12px;font-size:.9rem"><span>Min <b>${fmt(min)}</b></span><span>Q1 <b>${fmt(q1)}</b></span><span>Median <b>${fmt(center)}</b></span><span>Q3 <b>${fmt(q3)}</b></span><span>Max <b>${fmt(max)}</b></span><span>Mean <b>${fmt(mean)}</b></span><span>IQR <b>${fmt(q3 - q1)}</b></span><span>MAD <b>${fmt(mad)}</b></span></div><svg viewBox="0 0 300 90" role="img" aria-label="Box-and-whisker plot and mean marker on one number line" style="display:block;width:100%;height:auto"><line x1="${x(min)}" y1="44" x2="${x(max)}" y2="44" stroke="var(--ink,#1B2733)" stroke-width="2"/><line x1="${x(min)}" y1="34" x2="${x(min)}" y2="54" stroke="var(--ink,#1B2733)" stroke-width="2"/><line x1="${x(max)}" y1="34" x2="${x(max)}" y2="54" stroke="var(--ink,#1B2733)" stroke-width="2"/><rect x="${x(q1)}" y="30" width="${Math.max(2, x(q3) - x(q1))}" height="28" fill="var(--brand-tint,#E5ECF3)" stroke="var(--brand,#2C4A68)" stroke-width="2"/><line x1="${x(center)}" y1="30" x2="${x(center)}" y2="58" stroke="var(--bad,#B42318)" stroke-width="3"/><path d="M ${x(mean)} 10 l -7 12 h 14 z" fill="var(--sun,#F0BD4F)" stroke="var(--ink,#1B2733)"/><text x="${x(min)}" y="78" text-anchor="middle">${fmt(min)}</text><text x="${x(mean)}" y="9" text-anchor="middle">mean</text><text x="${x(max)}" y="78" text-anchor="middle">${fmt(max)}</text></svg><figcaption>Box shows the five-number spread; the fulcrum marker shows the mean. MAD is the mean distance from the mean.</figcaption>`;
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          renderLinked();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u2-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0";
        host.append(linked);
        renderLinked();
      };
    }
    if (kind === "askdots") {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const m = spec.model || {};
          const who = Number.isInteger(current?.who) ? current.who : m.start?.who || 0;
          const when = Number.isInteger(current?.when) ? current.when : m.start?.when || 0;
          const series = m.series?.[`${who},${when}`];
          if (!series?.vals?.length) return;
          const vals = series.vals
            .map(Number)
            .filter(Number.isFinite)
            .sort((a, b) => a - b);
          const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
          const min = vals[0],
            max = vals.at(-1),
            span = max - min || 1;
          const x = (v) => 18 + ((v - min) / span) * 264;
          const dots = vals
            .map(
              (v, i) =>
                `<circle cx="${x(v)}" cy="${26 + (i % 3) * 12}" r="4" fill="var(--sun,#F0BD4F)" stroke="var(--ink,#223)"/>`,
            )
            .join("");
          const marks = [...new Set(vals)]
            .map(
              (v) =>
                `<line x1="${x(v)}" y1="62" x2="${x(v)}" y2="68" stroke="var(--ink,#223)"/><text x="${x(v)}" y="82" text-anchor="middle" font-size="10">${v}</text>`,
            )
            .join("");
          const median =
            vals.length % 2
              ? vals[(vals.length - 1) / 2]
              : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
          linked.innerHTML = `<svg viewBox="0 0 300 92" role="img" aria-label="Six simulated answers on a number line; repeated values stack and varied values spread" style="width:100%;height:auto"><line x1="12" y1="62" x2="288" y2="62" stroke="var(--ink,#223)" stroke-width="2"/>${dots}${marks}</svg><figcaption><strong>Six-answer data snapshot:</strong> n = ${vals.length} · min ${min} · median ${median} · mean ${Number(mean.toFixed(2))} · max ${max} · range ${max - min}. ${new Set(vals).size === 1 ? "All answers stack: no variability." : "Answers spread: the response varies."}</figcaption>`;
          linked.setAttribute(
            "aria-label",
            `Six answers: minimum ${min}, median ${median}, mean ${Number(mean.toFixed(2))}, maximum ${max}, range ${max - min}`,
          );
          linked.dataset.values = vals.join(",");
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u2-linked u2-question-data-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0";
        host.append(linked);
        draw();
      };
    }
    if (kind === "countoff") {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const bins = spec.model?.bins || [];
          const counts = bins.map((bin) => Number(bin.n) || 0);
          const total = counts.reduce((sum, n) => sum + n, 0);
          const rank = Math.ceil(total / 2);
          let run = 0;
          const medianIndex = counts.findIndex((n) => (run += n) >= rank);
          const counted = Math.max(0, Math.min(counts.length, Number(current?.counted) || 0));
          const selected = Number.isInteger(current?.pick) ? current.pick : null;
          const max = Math.max(1, ...counts);
          const bars = bins
            .map((bin, i) => {
              const x = 14 + i * (264 / Math.max(1, bins.length));
              const barW = 226 / Math.max(1, bins.length);
              const h = Math.max(4, (Number(bin.n) / max) * 56);
              const fill = i === medianIndex ? "var(--sun,#F0BD4F)" : "var(--brand-tint,#dbe8f3)";
              const cumulative = counts.slice(0, i + 1).reduce((sum, n) => sum + n, 0);
              return `<rect x="${x}" y="${72 - h}" width="${barW}" height="${h}" rx="2" fill="${fill}" stroke="var(--brand,#365b7d)" stroke-width="${i === selected ? 3 : 1.5}"/><text x="${x + barW / 2}" y="${68 - h}" text-anchor="middle" font-size="10">${bin.n}</text><text x="${x + barW / 2}" y="84" text-anchor="middle" font-size="9">${bin.lo}–${bin.hi}</text><text x="${x + barW / 2}" y="98" text-anchor="middle" font-size="9">Σ${cumulative}</text>`;
            })
            .join("");
          const medianBin = bins[medianIndex];
          const selectedBin = selected === null ? null : bins[selected];
          const pickedText = selectedBin
            ? ` Selected interval: ${selectedBin.lo}–${selectedBin.hi}.`
            : "";
          const caption = `Total ${total}; middle rank ${rank}; median class ${medianBin?.lo}–${medianBin?.hi}; tally advanced through ${counted} of ${bins.length} intervals.${pickedText}`;
          linked.innerHTML = `<svg viewBox="0 0 292 108" role="img" aria-label="Histogram with interval counts, cumulative tally, and median class ${medianBin?.lo} to ${medianBin?.hi}" style="width:100%;height:auto"><line x1="8" y1="72" x2="286" y2="72" stroke="var(--ink,#223)" stroke-width="2"/>${bars}</svg><figcaption><strong>Median-class check:</strong> ${caption} The median is the value at rank ${rank} in the ordered data; this histogram identifies its interval.</figcaption>`;
          linked.setAttribute("aria-label", caption);
          linked.dataset.counted = String(counted);
          linked.dataset.medianInterval = medianBin ? `${medianBin.lo}-${medianBin.hi}` : "";
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u2-linked u2-histogram-median-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0";
        host.append(linked);
        draw();
      };
    }
    if (kind === "areabox") {
      const mount = registered.mount;
      registered.mount = (host, spec, api) => {
        let current = api.restore || (api.solved ? registered.solution(spec) : null);
        let linked;
        const draw = () => {
          if (!linked) return;
          const m = spec.model || {};
          if (m.mode === "decimal") {
            const c = Math.max(1, Math.min(19, Number(current?.c ?? m.c) || m.c));
            const r = Math.max(1, Math.min(19, Number(current?.r ?? m.r) || m.r));
            const squares = Array.from({ length: 100 }, (_, i) => {
              const row = Math.floor(i / 10),
                col = i % 10;
              const fill = row < r && col < c ? "var(--brand,#365b7d)" : "var(--surface,#fff)";
              return `<rect x="${12 + col * 14}" y="${8 + row * 14}" width="12" height="12" fill="${fill}" fill-opacity=".72" stroke="var(--border-strong,#879)"/>`;
            }).join("");
            const product = ((c * r) / 100).toFixed(2).replace(/0+$/, "").replace(/\\.$/, "");
            linked.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:10px;align-items:center;min-width:0"><svg viewBox="0 0 164 154" role="img" aria-label="Hundredths grid with ${c} columns by ${r} rows shaded" style="width:100%;height:auto;min-width:0">${squares}<text x="82" y="151" text-anchor="middle">${c} × ${r} hundredths</text></svg><div style="min-width:0;overflow-wrap:anywhere"><strong>${m.expr}</strong><p>${c} × ${r} = ${c * r} hundredths</p></div></div><figcaption style="min-width:0;overflow-wrap:anywhere"><strong>Area product:</strong> ${c} × ${r} ÷ 100 = ${product}. The overlap count and decimal product use the same factors.</figcaption>`;
            linked.dataset.product = product;
            linked.dataset.factors = `${c},${r}`;
            linked.setAttribute("aria-label", `Hundredths grid: ${c} by ${r}; product ${product}`);
          } else {
            const a = Number(m.a) || 1,
              left = Number(m.b) || 1,
              right = Number(m.c) || 1;
            const width = 260,
              scale = width / Math.max(1, left + right);
            linked.innerHTML = `<svg viewBox="0 0 300 100" role="img" aria-label="Area decomposition into ${left} and ${right} side lengths with height ${a}" style="width:100%;height:auto"><rect x="16" y="20" width="${left * scale}" height="48" fill="var(--brand-tint,#dbe8f3)" stroke="var(--brand,#365b7d)"/><rect x="${16 + left * scale}" y="20" width="${right * scale}" height="48" fill="var(--sun-tint,#fff0c2)" stroke="var(--sun-deep,#bd8c13)"/><text x="${16 + (left * scale) / 2}" y="48" text-anchor="middle">${a}×${left}</text><text x="${16 + left * scale + (right * scale) / 2}" y="48" text-anchor="middle">${a}×${right}</text><text x="16" y="88">height ${a}</text></svg><figcaption><strong>Distributive area check:</strong> ${a}(${left} + ${right}) = ${a}×${left} + ${a}×${right} = ${a * (left + right)}.</figcaption>`;
            linked.dataset.area = String(a * (left + right));
          }
        };
        const change = api.change;
        api.change = (state) => {
          current = state || null;
          change?.(state);
          draw();
        };
        mount(host, spec, api);
        linked = document.createElement("figure");
        linked.className = "u2-div-linked u2-decimal-area-linked";
        linked.style.cssText =
          "display:grid;gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0";
        host.append(linked);
        draw();
      };
    }
    A.registry[kind] = registered;
  };
  A.has = (/** @type {string} */ kind) => !!A.registry[kind];
  A.kinds = () => Object.keys(A.registry).sort();

  /** Same (kind, level, seed, params) -> same activity. */
  A.make = (
    /** @type {string} */ kind,
    /** @type {number} */ level,
    /** @type {number|string} */ seed,
    /** @type {any} */ params,
  ) => {
    const def = A.registry[kind];
    if (!def) throw new Error(`StudioAct: unknown activity "${kind}"`);
    const lv = Math.max(1, Math.min(def.levels, Number(level) || 1));
    const rng = W.StudioGen.rng(`${kind}|${lv}|${seed}|${JSON.stringify(params || {})}`);
    const spec = def.make(rng, lv, params || {});
    spec.kind = kind;
    spec.level = lv;
    spec.seed = seed;
    return spec;
  };
  A.grade = (/** @type {any} */ spec, /** @type {any} */ state) =>
    A.registry[spec.kind].grade(spec, state);

  /**
   * Constraint puzzles (Challenge only): many answers are valid, so the grade is a set of NAMED constraints, not one key.
   * `constraints` is [{ id, ok(state) -> boolean, say, sayEs?, tag? }]. The result follows the hands-on grade() shape:
   * { ok, tag?, say?, sayEs?, right, of, marks, failed? }. A miss names the FIRST constraint that failed (its own `say`, which
   * must describe the rule and never a valid answer); `right`/`of` and `marks` let the runtime show how many were met.
   * A constraint that throws counts as not met, so a half-built state never crashes a widget.
   */
  A.constraintGrade = (
    /** @type {{id: string, ok: (s: any) => boolean, say?: string, sayEs?: string, tag?: string}[]} */ constraints,
    /** @type {any} */ state,
  ) => {
    const marks = constraints.map((c) => {
      try {
        return !!c.ok(state);
      } catch (_e) {
        return false;
      }
    });
    const right = marks.filter(Boolean).length;
    const of = constraints.length;
    if (!of || right === of) return { ok: right === of && of > 0, right, of, marks };
    const first = constraints[marks.indexOf(false)];
    return {
      ok: false,
      tag: first.tag,
      say: first.say,
      sayEs: first.sayEs,
      failed: first.id,
      right,
      of,
      marks,
    };
  };

  /** Inject a widget's stylesheet once. Use studio tokens (var(--brand) etc.) so every world recolours it. */
  A.css = (/** @type {string} */ kind, /** @type {string} */ text) => {
    if (
      typeof document === "undefined" ||
      document.querySelector(`style[data-studio-act="${kind}"]`)
    )
      return;
    const s = document.createElement("style");
    s.setAttribute("data-studio-act", kind);
    s.textContent = text;
    document.head.append(s);
  };
  /** Tiny DOM helper for widgets: el("button", "sa-btn", "Check", {type:"button"}). */
  A.el = (
    /** @type {string} */ tag,
    /** @type {string} */ cls = "",
    /** @type {string} */ html = "",
    /** @type {Record<string,string>} */ attrs = {},
  ) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  /**
   * First-touch coach: a kind registers up to three steps ({ icon, en, es }) that assets/studio/focus.js shows once per device,
   * the first time that kind mounts. A kind that registers nothing gets the generic three steps. Throws on a malformed step so
   * a missing Spanish line is caught by the act test, not by a student.
   */
  A.coaches = A.coaches || {};
  A.coach = (
    /** @type {string} */ kind,
    /** @type {Array<{icon: string, en: string, es: string}>} */ steps,
  ) => {
    if (!Array.isArray(steps) || !steps.length || steps.length > 3)
      throw new Error(`StudioAct: coach(${kind}) needs 1 to 3 steps`);
    for (const s of steps)
      if (!s || !s.icon || !s.en || !s.es)
        throw new Error(`StudioAct: coach(${kind}) steps need icon, en and es`);
    A.coaches[kind] = steps.map((s) => ({ icon: s.icon, en: s.en, es: s.es }));
  };
  A.coachSteps = (/** @type {string} */ kind) => A.coaches[kind] || null;
  /** Bilingual text: English plus a lang="es" span the page shows only in Spanish mode. */
  A.t = (/** @type {string} */ en, /** @type {string} */ es) =>
    es ? `${en}<span class="es-text" lang="es">${es}</span>` : en;

  /** Live dual-scale and symbolic unit-cancellation figure shared by the conversion activities. */
  A.linkedUnitConversion = (/** @type {any} */ m) => {
    const esc = (s) =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
      );
    const figure = document.createElement("figure");
    figure.className = "rm-linked u3-conv-linked";
    figure.style.cssText =
      "display:grid;grid-template-columns:minmax(0,1fr);gap:8px;margin:12px 0;padding:10px;border:1px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff);min-width:0";
    figure.setAttribute(
      "aria-label",
      `Equivalent measurement: ${m.startValue} ${m.startUnit} equals ${m.endValue} ${m.endUnit}`,
    );
    const width = 210;
    const factors = (m.factors || [])
      .map((f) => `× (${esc(f.n)} ${esc(f.top)} / ${esc(f.d ?? 1)} ${esc(f.bottom)})`)
      .join(" ");
    const equation = `${esc(m.startValue)} ${esc(m.startUnit)} ${factors} = ${esc(m.endValue)} ${esc(m.endUnit)}`;
    figure.innerHTML = `<svg viewBox="0 0 310 96" role="img" aria-label="Dual-unit scale: ${esc(m.startValue)} ${esc(m.startUnit)} equals ${esc(m.endValue)} ${esc(m.endUnit)}" style="display:block;width:100%;height:auto"><text x="8" y="20">${esc(m.startUnit)}</text><rect x="72" y="8" width="${width}" height="18" rx="4" fill="var(--sun,#F0BD4F)" stroke="var(--ink,#1B2733)"/><text x="72" y="42">0</text><text x="292" y="42" text-anchor="end">${esc(m.startValue)}</text><text x="8" y="70">${esc(m.endUnit)}</text><rect x="72" y="56" width="${width}" height="18" rx="4" fill="var(--sun,#F0BD4F)" stroke="var(--ink,#1B2733)"/><text x="72" y="90">0</text><text x="292" y="90" text-anchor="end">${esc(m.endValue)}</text></svg><figcaption style="font-size:.92rem;line-height:1.4;color:var(--ink,#1B2733)"><strong>Unit cancellation:</strong> <span class="u3-conv-equation">${equation}</span></figcaption>`;
    return figure;
  };
})();
