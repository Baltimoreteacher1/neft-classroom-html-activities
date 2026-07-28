/*
 * EduWonderLab — shared product card / summary renderer.
 * =============================================================================
 * Every product card, Signature Experiences tile, and product summary on the
 * site is rendered from data/product-registry.json by this one module. That is
 * the whole point: a product's name, tagline, summary, audience, entry route,
 * and standards connection are stated ONCE, so two pages can never disagree
 * about what a product is.
 *
 * Adding a product to a page is a `data-ewl-products` attribute, not a block of
 * copied markup.
 *
 * USAGE
 *   <link rel="stylesheet" href="/shared/portfolio/portfolio.css">
 *   <div class="ewl-portfolio">
 *     <div data-ewl-products
 *          data-variant="signature"      <!-- signature | full | compact -->
 *          data-only="number-realm,language-bridge"   <!-- optional filter -->
 *     ></div>
 *   </div>
 *   <script src="/shared/portfolio/product-cards.js" defer></script>
 *
 * The excluded product (Monster Math Academy) is not in the registry, so it can
 * never appear through this renderer. renderProducts() additionally refuses any
 * id that is not on the approved list — belt and braces, because this renderer
 * is what feeds the award-facing surfaces.
 *
 * All text is inserted with textContent. The registry is repo-authored data,
 * but the renderer stays escape-by-construction so it is safe to point at any
 * future registry source.
 * =============================================================================
 */
(function (global) {
  "use strict";
  if (global.EWLProductCards) return;

  var REGISTRY_URL = "/data/product-registry.json";

  /* The approved portfolio. A product id outside this list is never rendered,
   * regardless of what the registry file says. */
  var APPROVED = [
    "number-realm",
    "language-bridge",
    "design-studio",
    "personalized-math-path",
    "grade6-curriculum-system",
    "teacher-studio",
  ];

  var AUDIENCE_LABEL = {
    student: "For students",
    teacher: "For teachers",
    family: "For families",
    admin: "For school leaders",
  };

  /* Products whose entry surface carries the shared Save/Resume engine, so a
   * card can honestly say whether work can be picked up later. Derived from the
   * registry's evidenceSources rather than restated per card. */
  function supportsSaveResume(product) {
    var sources = product.evidenceSources || [];
    return sources.indexOf("save-resume") !== -1 || sources.indexOf("portfolio") !== -1;
  }

  var registryPromise = null;

  function loadRegistry() {
    if (registryPromise) return registryPromise;
    registryPromise = fetch(REGISTRY_URL, { credentials: "omit" })
      .then(function (res) {
        if (!res.ok) throw new Error("product-registry-unavailable");
        return res.json();
      })
      .then(function (doc) {
        var products = (doc.products || []).filter(function (p) {
          return APPROVED.indexOf(p.id) !== -1;
        });
        return { products: products, portfolioName: doc.portfolioName || "" };
      });
    return registryPromise;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function chip(text, tone) {
    var li = el("li", "ewl-chip", text);
    if (tone) li.setAttribute("data-tone", tone);
    return li;
  }

  function link(href, text, variant) {
    var a = el("a", "ewl-btn", text);
    a.href = href;
    if (variant) a.setAttribute("data-variant", variant);
    return a;
  }

  /** Human-readable unit connection, e.g. "Units 1–10" or "Units 3, 4". */
  function unitLabel(units) {
    if (!units || !units.length) return "Across the curriculum";
    var sorted = units.slice().sort(function (a, b) {
      return a - b;
    });
    var contiguous = sorted.every(function (n, i) {
      return i === 0 || n === sorted[i - 1] + 1;
    });
    if (contiguous && sorted.length > 2) {
      return "Units " + sorted[0] + "–" + sorted[sorted.length - 1];
    }
    return "Unit" + (sorted.length > 1 ? "s " : " ") + sorted.join(", ");
  }

  /**
   * Build one card.
   *
   * `variant`:
   *   "signature" — the Signature Experiences strip on /curriculum/. Shows the
   *                 five facts a teacher needs to decide: audience, purpose,
   *                 when to use it, unit connection, save/resume support.
   *   "full"      — product hub pages: adds differentiators and limitations.
   *   "compact"   — cross-links: name, tagline, one button.
   */
  function buildCard(product, variant) {
    var card = el("article", "ewl-product-card");
    card.setAttribute("data-product-id", product.id);

    card.appendChild(el("span", "ewl-eyebrow", AUDIENCE_LABEL[product.primaryAudience] || "Experience"));
    card.appendChild(el("h3", null, product.name));
    card.appendChild(el("p", "ewl-tagline", product.tagline));

    if (variant !== "compact") {
      card.appendChild(el("p", "ewl-summary", product.summary));
    }

    if (variant === "signature" || variant === "full") {
      var dl = el("dl");
      var facts = [
        ["Purpose", product.problemSolved],
        ["Use it when", product.coreExperience],
        ["Curriculum", unitLabel(product.canonicalUnits)],
        ["Save & resume", supportsSaveResume(product) ? "Yes — work can be picked up later" : "Not applicable"],
      ];
      facts.forEach(function (pair) {
        if (!pair[1]) return;
        dl.appendChild(el("dt", null, pair[0]));
        dl.appendChild(el("dd", null, pair[1]));
      });
      card.appendChild(dl);
    }

    if (variant === "full") {
      if ((product.differentiators || []).length) {
        card.appendChild(el("h4", null, "What makes it different"));
        var ul = el("ul");
        product.differentiators.forEach(function (line) {
          ul.appendChild(el("li", null, line));
        });
        card.appendChild(ul);
      }
      if ((product.limitations || []).length) {
        var note = el("div", "ewl-note");
        note.setAttribute("data-tone", "limits");
        note.appendChild(el("h3", null, "Honest limits"));
        var limits = el("ul");
        product.limitations.forEach(function (line) {
          limits.appendChild(el("li", null, line));
        });
        note.appendChild(limits);
        card.appendChild(note);
      }
    }

    var chips = el("ul", "ewl-chips");
    (product.secondaryAudiences || []).forEach(function (audience) {
      chips.appendChild(chip(AUDIENCE_LABEL[audience] || audience, "audience"));
    });
    if ((product.standards || []).length) {
      chips.appendChild(chip(product.standards.length + " standards", "neutral"));
    }
    if (chips.childNodes.length) card.appendChild(chips);

    var actions = el("div", "ewl-actions");
    actions.appendChild(link(product.entryRoute, "Open " + product.shortName));
    if (variant !== "compact" && product.judgeModeRoute) {
      actions.appendChild(link(product.judgeModeRoute, "Guided demo", "ghost"));
    }
    card.appendChild(actions);

    return card;
  }

  function renderInto(node, products) {
    var variant = node.getAttribute("data-variant") || "signature";
    var only = (node.getAttribute("data-only") || "")
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    var exclude = (node.getAttribute("data-exclude") || "")
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);

    var list = products.filter(function (p) {
      if (only.length && only.indexOf(p.id) === -1) return false;
      if (exclude.length && exclude.indexOf(p.id) !== -1) return false;
      return true;
    });

    node.textContent = "";
    if (!list.length) {
      node.appendChild(el("p", "ewl-empty", "No products matched this view."));
      return;
    }
    var grid = el("div", "ewl-product-grid");
    list.forEach(function (product) {
      grid.appendChild(buildCard(product, variant));
    });
    node.appendChild(grid);
  }

  function render(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-ewl-products]");
    if (!nodes.length) return Promise.resolve(0);

    nodes.forEach(function (node) {
      if (!node.textContent.trim()) {
        node.appendChild(el("p", "ewl-loading", "Loading products…"));
      }
    });

    return loadRegistry()
      .then(function (data) {
        nodes.forEach(function (node) {
          renderInto(node, data.products);
        });
        return nodes.length;
      })
      .catch(function () {
        // A failed fetch must never leave a permanent "Loading…" on the page.
        nodes.forEach(function (node) {
          node.textContent = "";
          node.appendChild(
            el(
              "p",
              "ewl-error",
              "The product list could not be loaded. Every experience is still reachable from the curriculum hub.",
            ),
          );
        });
        return 0;
      });
  }

  global.EWLProductCards = {
    APPROVED: APPROVED,
    load: loadRegistry,
    render: render,
    buildCard: buildCard,
    unitLabel: unitLabel,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      render();
    });
  } else {
    render();
  }
})(typeof window !== "undefined" ? window : globalThis);
