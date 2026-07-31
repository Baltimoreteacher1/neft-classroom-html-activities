/* =============================================================================
 * Student Work Showcase — opt-in runtime include
 * -----------------------------------------------------------------------------
 * ONE LINE to add this to any page:
 *
 *   <script src="/assets/student-showcase.js" data-standard="6.AT.2" defer></script>
 *
 * It finds (or creates) a [data-student-showcase] container, asks
 * /api/showcase for TEACHER-APPROVED items on that standard, and renders at
 * most two of them as a "How students before you thought about this" block.
 *
 * Contract this file keeps, deliberately and permanently:
 *   - Renders NOTHING when there is nothing approved. No empty box, no
 *     placeholder, no skeleton. A page with no approved work looks untouched.
 *   - Never throws. Every entry point is wrapped; a failure is a silent no-op.
 *   - Never blocks page load: `defer` plus an idle/async render.
 *   - Never touches global state. No globals beyond one guard flag on window,
 *     no listeners on document, no mutation of any element it did not create
 *     (other than appending its own container).
 *   - Never uses innerHTML with server data. All text goes through
 *     textContent; the chart is built with createElementNS.
 *   - CSS is scoped entirely under .nt-showcase (see student-showcase.css).
 *     This will eventually load on lesson pages and a CSS leak there has
 *     caused real bugs in this repo.
 *
 * Only APPROVED items are ever public — see the consent and moderation model
 * documented at the top of functions/api/showcase.js. When the API returns no
 * live student work (e.g. no database bound yet), this falls back to the
 * committed curriculum exemplars in /data/student-showcase.json, which are
 * badged on screen as teacher-written examples, never as student work.
 *
 * This file is NOT injected into any page. Adding the one-line include is an
 * explicit, per-page decision.
 * ========================================================================== */

(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__ntShowcaseLoaded) return;
  window.__ntShowcaseLoaded = true;

  var SCRIPT = document.currentScript;
  var CSS_HREF = "/assets/student-showcase.css";
  var API = "/api/showcase";
  var SEED = "/data/student-showcase.json";
  var MAX_CARDS = 2;
  var ANON = "A Grade 6 mathematician";
  var SVG_NS = "http://www.w3.org/2000/svg";

  /* ---------------------------------------------------------------- utils */

  function text(value) {
    return typeof value === "string" ? value : "";
  }

  function el(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.appendChild(document.createTextNode(content));
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, String(attrs[k]));
    }
    return node;
  }

  // Same-origin paths only, mirroring the server-side rule. Anything else is
  // dropped rather than rendered, so a bad row can never produce an off-site
  // or javascript: link.
  function safePath(value) {
    var raw = text(value).trim();
    if (!raw) return "";
    if (raw.charAt(0) !== "/") return "";
    if (raw.indexOf("//") === 0) return "";
    if (raw.indexOf("..") !== -1) return "";
    if (raw.indexOf(":") !== -1) return "";
    if (raw.indexOf("\\") !== -1) return "";
    return raw;
  }

  function displayNameOf(item) {
    var mode = text(item.displayMode) || text(item.display_mode);
    var name = text(item.displayName) || text(item.display_name);
    // Fail closed: a name is shown only when the mode explicitly allows it and
    // the stored value really is "First L." shaped.
    if (mode === "firstNameInitial" && /^[A-Za-z][A-Za-z'-]{0,19} [A-Z]\.$/.test(name)) return name;
    if (item.source === "curriculum-exemplar") return "Curriculum exemplar";
    return ANON;
  }

  function isExemplar(item) {
    return item && item.source === "curriculum-exemplar";
  }

  /* ---------------------------------------------------------------- chart */

  // Compact bar chart drawn from structured numbers only. Never markup.
  function buildChart(data) {
    if (!data || typeof data !== "object") return null;
    var points = Array.isArray(data.points) ? data.points.slice(0, 8) : [];
    var clean = [];
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (!p || typeof p !== "object") continue;
      var v = Number(p.value);
      if (!isFinite(v)) continue;
      clean.push({ label: text(p.label).slice(0, 14), value: v });
    }
    if (clean.length < 2) return null;

    var W = 300;
    var H = 108;
    var padL = 6;
    var padR = 6;
    var padT = 14;
    var padB = 18;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;

    var maxV = clean[0].value;
    var minV = clean[0].value;
    for (var j = 1; j < clean.length; j++) {
      if (clean[j].value > maxV) maxV = clean[j].value;
      if (clean[j].value < minV) minV = clean[j].value;
    }
    var top = Math.max(maxV, 0);
    var bottom = Math.min(minV, 0);
    var span = top - bottom || 1;
    var zeroY = padT + ((top - 0) / span) * plotH;

    var svg = svgEl("svg", {
      class: "nt-showcase-chart",
      viewBox: "0 0 " + W + " " + H,
      width: W,
      height: H,
      role: "img",
      "aria-label": (text(data.title) || "Chart") + " — " + clean.length + " values",
      focusable: "false",
    });

    svg.appendChild(
      svgEl("line", {
        class: "nt-showcase-chart-axis",
        x1: padL,
        y1: zeroY,
        x2: W - padR,
        y2: zeroY,
      }),
    );

    var slot = plotW / clean.length;
    var barW = Math.max(6, Math.min(34, slot * 0.6));
    for (var k = 0; k < clean.length; k++) {
      var value = clean[k].value;
      var cx = padL + slot * k + slot / 2;
      var y = padT + ((top - Math.max(value, 0)) / span) * plotH;
      var h = Math.max(1, (Math.abs(value) / span) * plotH);
      svg.appendChild(
        svgEl("rect", {
          class: value < 0 ? "nt-showcase-chart-bar-neg" : "nt-showcase-chart-bar",
          x: cx - barW / 2,
          y: value < 0 ? zeroY : y,
          width: barW,
          height: h,
          rx: 2,
        }),
      );

      var valueNode = svgEl("text", {
        class: "nt-showcase-chart-value",
        x: cx,
        y: value < 0 ? zeroY + h + 9 : y - 3,
        "text-anchor": "middle",
      });
      valueNode.appendChild(document.createTextNode(String(value)));
      svg.appendChild(valueNode);

      var labelNode = svgEl("text", {
        class: "nt-showcase-chart-label",
        x: cx,
        y: H - 5,
        "text-anchor": "middle",
      });
      labelNode.appendChild(document.createTextNode(clean[k].label));
      svg.appendChild(labelNode);
    }
    return svg;
  }

  /* ----------------------------------------------------------------- card */

  function buildCard(item) {
    var card = el("li", "nt-showcase-card");
    card.appendChild(el("p", "nt-showcase-caption", text(item.caption)));

    var chart = buildChart(item.data);
    if (chart) card.appendChild(chart);

    var explanation = text(item.explanation);
    if (explanation) {
      var trimmed =
        explanation.length > 260
          ? explanation.slice(0, 257).replace(/\s+\S*$/, "") + "…"
          : explanation;
      card.appendChild(el("p", "nt-showcase-text", trimmed));
    }

    var byline = el("p", "nt-showcase-byline");
    if (isExemplar(item)) {
      byline.appendChild(el("span", "nt-showcase-badge", "Example entry"));
      byline.appendChild(
        document.createTextNode("Written by your teacher to show what belongs here"),
      );
    } else {
      byline.appendChild(el("span", "nt-showcase-badge", "Student work"));
      byline.appendChild(document.createTextNode(displayNameOf(item)));
    }
    card.appendChild(byline);

    var href = safePath(item.linkPath || item.link_path);
    if (href) {
      var link = el("a", "nt-showcase-link", "See the full piece of work");
      link.setAttribute("href", href);
      card.appendChild(link);
    }
    return card;
  }

  function buildBlock(items, usingExemplars) {
    var root = el("div", "nt-showcase");
    root.setAttribute("role", "complementary");
    root.appendChild(el("p", "nt-showcase-eyebrow", "From the gallery"));
    root.appendChild(
      el(
        "h2",
        "nt-showcase-heading",
        usingExemplars
          ? "How to think about this one"
          : "How students before you thought about this",
      ),
    );
    root.appendChild(
      el(
        "p",
        "nt-showcase-sub",
        usingExemplars
          ? "Example entries from the Student Work Gallery. Your work could replace one of these."
          : "Shared with permission and approved by a teacher before anyone else saw it.",
      ),
    );

    var list = el("ul", "nt-showcase-list");
    for (var i = 0; i < items.length; i++) list.appendChild(buildCard(items[i]));
    root.appendChild(list);

    var foot = el("p", "nt-showcase-footnote");
    var galleryLink = el("a", null, "Visit the Student Work Gallery");
    galleryLink.setAttribute("href", "/curriculum/showcase/");
    foot.appendChild(galleryLink);
    foot.appendChild(
      document.createTextNode(" — a teacher reads every submission before anyone else sees it."),
    );
    root.appendChild(foot);
    return root;
  }

  /* -------------------------------------------------------------- plumbing */

  function ensureStylesheet() {
    if (document.querySelector("link[data-nt-showcase-css]")) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_HREF;
    link.setAttribute("data-nt-showcase-css", "1");
    (document.head || document.documentElement).appendChild(link);
  }

  function findStandard() {
    var fromScript = SCRIPT && SCRIPT.getAttribute("data-standard");
    if (fromScript) return fromScript.trim();
    var host = document.querySelector("[data-student-showcase][data-standard]");
    if (host) return (host.getAttribute("data-standard") || "").trim();
    var meta = document.querySelector('meta[name="nt:standard"]');
    if (meta) return (meta.getAttribute("content") || "").trim();
    return "";
  }

  // Only create a container once we know we have something to put in it.
  function resolveContainer() {
    var existing = document.querySelector("[data-student-showcase]");
    if (existing) return existing;
    var host = document.querySelector("main") || document.body;
    if (!host) return null;
    var made = document.createElement("section");
    made.setAttribute("data-student-showcase", "");
    host.appendChild(made);
    return made;
  }

  function fetchJson(url) {
    return fetch(url, { headers: { Accept: "application/json" }, credentials: "omit" })
      .then(function (r) {
        return r && r.ok ? r.json() : null;
      })
      .catch(function () {
        return null;
      });
  }

  function usableItems(list, standard) {
    var out = [];
    if (!Array.isArray(list)) return out;
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      if (!it || typeof it !== "object") continue;
      if (text(it.standard) !== standard) continue;
      if (text(it.state) && it.state !== "approved") continue;
      if (!text(it.caption)) continue;
      out.push(it);
    }
    return out;
  }

  function render(standard) {
    fetchJson(API + "?standard=" + encodeURIComponent(standard))
      .then(function (live) {
        var liveItems = usableItems(live && live.items, standard);
        if (liveItems.length) return { items: liveItems, exemplars: false };
        return fetchJson(SEED).then(function (seed) {
          return { items: usableItems(seed && seed.items, standard), exemplars: true };
        });
      })
      .then(function (result) {
        if (!result || !result.items || !result.items.length) return; // render NOTHING
        var container = resolveContainer();
        if (!container) return;
        ensureStylesheet();
        container.appendChild(buildBlock(result.items.slice(0, MAX_CARDS), result.exemplars));
      })
      .catch(function () {
        /* silent: this block is never load-bearing */
      });
  }

  function start() {
    try {
      var standard = findStandard();
      if (!/^6\.[A-Z]{2,3}\.[0-9]{1,2}[a-d]?$/.test(standard)) return;
      if (typeof fetch !== "function") return;
      render(standard);
    } catch (_e) {
      /* never throw into the host page */
    }
  }

  try {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(start, { timeout: 1500 });
    } else {
      setTimeout(start, 0);
    }
  } catch (_e) {
    /* no-op */
  }
})();
