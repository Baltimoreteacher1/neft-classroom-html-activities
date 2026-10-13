/* Math Workbench — reference bank extras: pinned cards, recently used cards, and cards
 * suggested by what is on the board. Cards are built by the bank itself (index.html), so a
 * card here is the same card, with the same behaviour, as one in the bank below.
 *
 *   MWBRef.isPinned(topicId, name) / togglePin(topicId, name)
 *   MWBRef.suggestFor(objectTypes)  -> [{topic, item}] (pure; unit-tested) */
(function (root) {
  "use strict";
  const doc = root.document;
  if (root.MWBRef) return;

  const PIN_KEY = "mw_ref_pins";
  const RECENT_KEY = "mw_ref_recent";
  const MAX_ROW = 4;

  /* Which bank topics help with which board objects. Items are named so a card that is
   * renamed or removed simply drops out (matched against the live bank, never invented). */
  const SUGGEST = {
    ratiotable: { ratio: ["Ratio", "Unit rate", "Equivalent ratios"] },
    dblnumline: { ratio: ["Unit rate", "Equivalent ratios", "Convert with rates"] },
    tape: { ratio: ["Equivalent ratios"], dec: ["Percent of a number"] },
    numline: { int: ["Order on a number line", "Absolute value", "Adding integers"] },
    chips: { int: ["Adding integers", "Opposites"] },
    coordgrid: { coord: ["Ordered pair", "Quadrants", "Horizontal distance", "Vertical distance"] },
    fracbar: { frac: ["Divide fractions", "Simplify a fraction", "Compare fractions"] },
    algebra: { ee: ["Combine like terms", "Solve x + a = b"] },
    ineqline: { ee: ["Inequality"] },
    arraymodel: { geo2d: ["Area of rectangle"], whole: ["Multiplication"] },
    shape2d: { geo2d: ["Area of triangle", "Area of rectangle", "Perimeter (any polygon)"] },
    shape3d: { geo3d: ["Volume (rectangular prism)", "Surface area (rect. prism)"] },
    dotplot: { stats: ["Mean (average)", "Median", "Mode"] },
    boxplot: { stats: ["Median", "Interquartile range"] },
    histogram: { stats: ["Mean (average)", "Range"] },
    placevalue: { dec: ["Decimal place value", "Add / subtract decimals"] },
    baseten: { dec: ["Decimal place value"], whole: ["Addition"] },
    fraction: { frac: ["Add / subtract fractions", "Multiply fractions"] },
    division: { whole: ["Division", "Check division"] },
  };

  function read(key) {
    try {
      const list = JSON.parse(root.localStorage.getItem(key));
      return Array.isArray(list) ? list.filter((x) => typeof x === "string").slice(0, 24) : [];
    } catch (_) {
      return [];
    }
  }
  function write(key, list) {
    try {
      root.localStorage.setItem(key, JSON.stringify(list.slice(0, 24)));
    } catch (_) {}
  }
  const keyOf = (topic, name) => `${topic}::${name}`;

  function isPinned(topic, name) {
    return read(PIN_KEY).includes(keyOf(topic, name));
  }
  function togglePin(topic, name) {
    const k = keyOf(topic, name);
    const list = read(PIN_KEY);
    const at = list.indexOf(k);
    if (at >= 0) list.splice(at, 1);
    else list.unshift(k);
    write(PIN_KEY, list);
    root.dispatchEvent(new CustomEvent("mwb:ref-pins"));
    return at < 0;
  }

  /* Pure: the unique (topic, item-name) pairs worth suggesting for these object types. */
  function suggestFor(types) {
    const out = [];
    const seen = new Set();
    for (const type of types || []) {
      const rule = SUGGEST[type];
      if (!rule) continue;
      for (const [topic, names] of Object.entries(rule)) {
        for (const name of names) {
          const k = keyOf(topic, name);
          if (seen.has(k)) continue;
          seen.add(k);
          out.push({ topic, name });
        }
      }
    }
    return out;
  }

  root.MWBRef = Object.freeze({ isPinned, togglePin, suggestFor, SUGGEST });
  if (!doc) return;

  /* -------------------------------------------------------------------- UI */
  let host = null;

  function findCard(topics, topicId, name) {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return null;
    const items = topic.items || [];
    const item = items.find((i) => i.name === name);
    return item ? { topic, item } : null;
  }

  function row(title, entries, topics) {
    const cards = entries
      .map((e) => findCard(topics, e.topic, e.name))
      .filter(Boolean)
      .slice(0, MAX_ROW);
    if (!cards.length) return null;
    const section = doc.createElement("section");
    section.className = "wbx-ref-section";
    const h = doc.createElement("h4");
    h.textContent = title;
    const list = doc.createElement("div");
    list.className = "wbx-ref-row";
    for (const { topic, item } of cards) list.appendChild(root.MWBShell.buildCard(topic, item));
    section.append(h, list);
    return section;
  }

  function parse(k) {
    const at = k.indexOf("::");
    return { topic: k.slice(0, at), name: k.slice(at + 2) };
  }

  let queued = false;
  function render() {
    queued = false;
    const shell = root.MWBShell;
    if (!host || !shell || !shell.topics) return;
    const topics = shell.topics();
    const types = [...new Set(shell.objects().map((o) => o.type))];
    host.textContent = "";
    const pinned = read(PIN_KEY).map(parse);
    const suggested = suggestFor(types).filter(
      (s) => !pinned.some((p) => p.topic === s.topic && p.name === s.name),
    );
    const recent = read(RECENT_KEY).map(parse);
    for (const section of [
      row("Pinned", pinned, topics),
      row("Suggested for your board", suggested, topics),
      row("Used recently", recent, topics),
    ]) {
      if (section) host.appendChild(section);
    }
    host.hidden = !host.children.length;
  }
  function queue() {
    if (queued) return;
    queued = true;
    root.requestAnimationFrame(render);
  }

  function boot() {
    const panel = doc.querySelector("#dock .formula-panel");
    const overlay = doc.getElementById("overlay");
    if (!panel || !overlay || !root.MWBShell) return;
    host = doc.createElement("div");
    host.id = "wbxRef";
    host.className = "wbx-ref";
    host.hidden = true;
    panel.parentNode.insertBefore(host, panel);
    new MutationObserver(queue).observe(overlay, { childList: true });
    root.addEventListener("mwb:ref-pins", queue);
    root.addEventListener("mwb:lang", queue);
    root.addEventListener("mwb:scaffold", queue);
    root.addEventListener("mwb:ref-used", (event) => {
      const d = event.detail || {};
      if (!d.topic || !d.item) return;
      const k = keyOf(d.topic, d.item);
      write(RECENT_KEY, [k, ...read(RECENT_KEY).filter((x) => x !== k)].slice(0, 8));
      queue();
    });
    // The bank was first drawn before this file loaded; draw it again so pins show.
    root.MWBShell.renderBank();
    queue();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
