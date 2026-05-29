/* Neft Teacher · Assignment / Playlist Builder
 * Self-contained vanilla JS, no deps, no backend.
 *
 * Two modes in one page:
 *   - BUILDER: teacher searches/filters the catalog, adds activities, reorders,
 *     names the playlist, and gets a shareable link (#p=<base64 JSON>).
 *   - STUDENT: when the URL carries #p=…, render an ordered list of big
 *     clickable cards with localStorage check-off + progress bar.
 *
 * Privacy: everything is local. The playlist is encoded in the URL fragment;
 * no PII is collected or transmitted.
 */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const THEME_KEY = "neft_pb_theme";
  const STATE_KEY = "neft_pb_builder";
  const PROGRESS_PREFIX = "neft_pb_progress_";

  // ---- Theme ---------------------------------------------------------------
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch (_) {}
  }
  function toggleTheme() {
    const cur =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    applyTheme(cur);
  }

  // ---- Base64 (Unicode-safe) ----------------------------------------------
  function encodePlaylist(obj) {
    const json = JSON.stringify(obj);
    const utf8 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
    // URL-safe base64
    return btoa(utf8)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  function decodePlaylist(str) {
    try {
      let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const bin = atob(b64);
      const json = decodeURIComponent(
        Array.prototype.map
          .call(
            bin,
            (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
          )
          .join(""),
      );
      const obj = JSON.parse(json);
      if (!obj || !Array.isArray(obj.items)) return null;
      return obj;
    } catch (_) {
      return null;
    }
  }

  // ---- Catalog -------------------------------------------------------------
  let CATALOG = { items: [], categories: [] };
  const byId = new Map();

  async function loadCatalog() {
    try {
      const res = await fetch("./catalog.json", { cache: "no-store" });
      CATALOG = await res.json();
    } catch (e) {
      CATALOG = { items: [], categories: [], counts: {} };
    }
    (CATALOG.items || []).forEach((it) => byId.set(it.id, it));
  }

  // =========================================================================
  // BUILDER
  // =========================================================================
  const builder = {
    title: "",
    note: "",
    date: "",
    items: [], // array of catalog ids
    tab: "All",
    query: "",
  };

  function loadBuilderState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      Object.assign(builder, {
        title: raw.title || "",
        note: raw.note || "",
        date: raw.date || "",
        items: Array.isArray(raw.items)
          ? raw.items.filter((id) => byId.has(id))
          : [],
      });
    } catch (_) {}
  }
  function saveBuilderState() {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          title: builder.title,
          note: builder.note,
          date: builder.date,
          items: builder.items,
        }),
      );
    } catch (_) {}
  }

  function renderTabs() {
    const tabs = $("tabs");
    tabs.innerHTML = "";
    const cats = ["All", ...(CATALOG.categories || [])];
    cats.forEach((cat) => {
      const count =
        cat === "All"
          ? CATALOG.items.length
          : (CATALOG.counts && CATALOG.counts[cat]) ||
            CATALOG.items.filter((i) => i.category === cat).length;
      if (cat !== "All" && !count) return;
      const b = document.createElement("button");
      b.className = "tab";
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(builder.tab === cat));
      b.textContent = `${cat} (${count})`;
      b.addEventListener("click", () => {
        builder.tab = cat;
        renderTabs();
        renderCatalog();
      });
      tabs.appendChild(b);
    });
  }

  function filteredCatalog() {
    const q = builder.query.trim().toLowerCase();
    return CATALOG.items.filter((it) => {
      if (builder.tab !== "All" && it.category !== builder.tab) return false;
      if (!q) return true;
      const hay = [it.title, it.type, it.unit, it.standard, it.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function renderCatalog() {
    const list = $("catalogList");
    list.innerHTML = "";
    const results = filteredCatalog();
    $("catalogStatus").textContent = `${results.length} activit${
      results.length === 1 ? "y" : "ies"
    } shown · ${builder.items.length} in playlist`;
    if (!results.length) {
      const li = document.createElement("li");
      li.className = "empty-note";
      li.textContent = "No activities match. Try another search or tab.";
      list.appendChild(li);
      return;
    }
    const inPlaylist = new Set(builder.items);
    results.forEach((it) => {
      const li = document.createElement("li");
      li.className = "catalog-item" + (inPlaylist.has(it.id) ? " added" : "");
      const main = document.createElement("div");
      main.className = "ci-main";
      const title = document.createElement("span");
      title.className = "ci-title";
      title.textContent = it.title;
      const sub = document.createElement("span");
      sub.className = "ci-sub";
      const chip = document.createElement("span");
      chip.className = "type-chip";
      chip.textContent = it.type;
      sub.appendChild(chip);
      if (it.unit) {
        const u = document.createElement("span");
        u.textContent = "Unit " + it.unit;
        sub.appendChild(u);
      }
      if (it.standard) {
        const s = document.createElement("span");
        s.textContent = it.standard;
        sub.appendChild(s);
      }
      main.appendChild(title);
      main.appendChild(sub);

      const addBtn = document.createElement("button");
      addBtn.className = "btn icon";
      addBtn.type = "button";
      if (inPlaylist.has(it.id)) {
        addBtn.textContent = "Remove";
        addBtn.setAttribute(
          "aria-label",
          "Remove " + it.title + " from playlist",
        );
        addBtn.addEventListener("click", () => removeItem(it.id));
      } else {
        addBtn.textContent = "Add";
        addBtn.setAttribute("aria-label", "Add " + it.title + " to playlist");
        addBtn.addEventListener("click", () => addItem(it.id));
      }
      li.appendChild(main);
      li.appendChild(addBtn);
      list.appendChild(li);
    });
  }

  function addItem(id) {
    if (!builder.items.includes(id)) builder.items.push(id);
    afterPlaylistChange();
  }
  function removeItem(id) {
    builder.items = builder.items.filter((x) => x !== id);
    afterPlaylistChange();
  }
  function moveItem(id, dir) {
    const i = builder.items.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= builder.items.length) return;
    const tmp = builder.items[i];
    builder.items[i] = builder.items[j];
    builder.items[j] = tmp;
    afterPlaylistChange();
  }

  function afterPlaylistChange() {
    saveBuilderState();
    renderPlaylist();
    renderCatalog();
    updateShareLink();
  }

  function renderPlaylist() {
    const ul = $("playlistItems");
    ul.innerHTML = "";
    $("playlistEmpty").hidden = builder.items.length > 0;
    builder.items.forEach((id, idx) => {
      const it = byId.get(id);
      if (!it) return;
      const li = document.createElement("li");
      li.className = "pl-item";

      const num = document.createElement("span");
      num.className = "pl-num";
      num.textContent = String(idx + 1);

      const main = document.createElement("div");
      main.className = "pl-main";
      const t = document.createElement("span");
      t.className = "pl-title";
      t.textContent = it.title;
      const sub = document.createElement("span");
      sub.className = "ci-sub";
      sub.textContent = it.type + (it.unit ? " · Unit " + it.unit : "");
      main.appendChild(t);
      main.appendChild(sub);

      const ctr = document.createElement("div");
      ctr.className = "pl-controls";
      const up = mkCtl(
        "↑",
        "Move " + it.title + " up",
        () => moveItem(id, -1),
        idx === 0,
      );
      const down = mkCtl(
        "↓",
        "Move " + it.title + " down",
        () => moveItem(id, 1),
        idx === builder.items.length - 1,
      );
      const rm = mkCtl("✕", "Remove " + it.title, () => removeItem(id), false);
      ctr.appendChild(up);
      ctr.appendChild(down);
      ctr.appendChild(rm);

      li.appendChild(num);
      li.appendChild(main);
      li.appendChild(ctr);
      ul.appendChild(li);
    });
  }
  function mkCtl(label, aria, fn, disabled) {
    const b = document.createElement("button");
    b.className = "btn icon ghost";
    b.type = "button";
    b.textContent = label;
    b.setAttribute("aria-label", aria);
    b.disabled = !!disabled;
    b.addEventListener("click", fn);
    return b;
  }

  function buildPayload() {
    return {
      v: 1,
      title: builder.title || "",
      note: builder.note || "",
      date: builder.date || "",
      items: builder.items.slice(),
    };
  }

  function updateShareLink() {
    const box = $("shareBox");
    if (!builder.items.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    const hash = "#p=" + encodePlaylist(buildPayload());
    const base = location.href.split("#")[0];
    $("shareLink").value = base + hash;
  }

  function copyLink() {
    const input = $("shareLink");
    const flash = $("copiedFlash");
    const done = () => {
      flash.hidden = false;
      setTimeout(() => (flash.hidden = true), 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(input.value).then(done, () => {
        input.select();
        document.execCommand && document.execCommand("copy");
        done();
      });
    } else {
      input.select();
      document.execCommand && document.execCommand("copy");
      done();
    }
  }

  function bindBuilder() {
    $("plTitle").value = builder.title;
    $("plNote").value = builder.note;
    $("plDate").value = builder.date;

    $("plTitle").addEventListener("input", (e) => {
      builder.title = e.target.value;
      saveBuilderState();
      updateShareLink();
    });
    $("plNote").addEventListener("input", (e) => {
      builder.note = e.target.value;
      saveBuilderState();
      updateShareLink();
    });
    $("plDate").addEventListener("input", (e) => {
      builder.date = e.target.value;
      saveBuilderState();
      updateShareLink();
    });
    $("search").addEventListener("input", (e) => {
      builder.query = e.target.value;
      renderCatalog();
    });
    $("copyBtn").addEventListener("click", copyLink);
    $("printBtn").addEventListener("click", () => {
      // Print a student-style preview in a new window.
      window.open($("shareLink").value, "_blank");
    });
    $("previewBtn").addEventListener("click", () => {
      window.open($("shareLink").value, "_blank");
    });
    $("clearBtn").addEventListener("click", () => {
      if (
        !builder.items.length ||
        confirm("Clear all activities from this playlist?")
      ) {
        builder.items = [];
        afterPlaylistChange();
      }
    });
  }

  // =========================================================================
  // STUDENT VIEW
  // =========================================================================
  function studentProgressKey(payload) {
    // Stable key based on title + ordered ids so check-offs persist per playlist.
    return (
      PROGRESS_PREFIX +
      encodePlaylist({ t: payload.title, i: payload.items }).slice(0, 64)
    );
  }

  function renderStudent(payload) {
    document.body.classList.add("student");
    $("builderRoot").hidden = true;
    $("studentRoot").hidden = false;

    $("topTitle").textContent = payload.title || "Your Playlist";
    const sub = [];
    if (payload.date) sub.push(payload.date);
    sub.push(
      "Do these in order. Tap “Open” to start. Check each one off when you finish.",
    );
    $("topSub").textContent = sub.join(" · ");

    if (payload.note) {
      const banner = $("studentNote");
      banner.hidden = false;
      banner.textContent = payload.note;
    }

    const key = studentProgressKey(payload);
    let done = {};
    try {
      done = JSON.parse(localStorage.getItem(key) || "{}");
    } catch (_) {}

    const list = $("studentList");
    list.innerHTML = "";
    const resolved = payload.items.map((id) => byId.get(id)).filter(Boolean);

    if (!resolved.length) {
      const li = document.createElement("li");
      li.className = "empty-note";
      li.textContent =
        "This playlist link could not be read, or the activities are not in the catalog.";
      list.appendChild(li);
      updateProgress(0, 0);
      return;
    }

    function persist() {
      try {
        localStorage.setItem(key, JSON.stringify(done));
      } catch (_) {}
    }
    function recompute() {
      const total = resolved.length;
      const count = resolved.filter((it) => done[it.id]).length;
      updateProgress(count, total);
    }

    resolved.forEach((it, idx) => {
      const li = document.createElement("li");
      li.className = "student-card" + (done[it.id] ? " done" : "");

      const num = document.createElement("div");
      num.className = "sc-num";
      num.textContent = String(idx + 1);

      const main = document.createElement("div");
      main.className = "sc-main";
      const h = document.createElement("h3");
      h.className = "sc-title";
      h.textContent = it.title;
      const type = document.createElement("div");
      type.className = "sc-type";
      type.textContent = it.type + (it.unit ? " · Unit " + it.unit : "");
      main.appendChild(h);
      main.appendChild(type);

      const actions = document.createElement("div");
      actions.className = "sc-actions";
      const open = document.createElement("a");
      open.className = "open-link";
      open.href = it.href;
      open.target = "_blank";
      open.rel = "noopener";
      open.textContent = "Open ▸";
      open.setAttribute("aria-label", "Open " + it.title + " in a new tab");

      const check = document.createElement("button");
      check.className = "check-btn";
      check.type = "button";
      const setLabel = () => {
        check.textContent = done[it.id] ? "✓ Done" : "Mark done";
        check.setAttribute("aria-pressed", String(!!done[it.id]));
      };
      setLabel();
      check.addEventListener("click", () => {
        done[it.id] = !done[it.id];
        li.classList.toggle("done", !!done[it.id]);
        setLabel();
        persist();
        recompute();
      });

      actions.appendChild(open);
      actions.appendChild(check);

      li.appendChild(num);
      li.appendChild(main);
      li.appendChild(actions);
      list.appendChild(li);
    });

    $("resetProgressBtn").addEventListener("click", () => {
      if (confirm("Reset your check-offs for this playlist?")) {
        done = {};
        persist();
        document
          .querySelectorAll(".student-card")
          .forEach((c) => c.classList.remove("done"));
        document.querySelectorAll(".check-btn").forEach((b) => {
          b.textContent = "Mark done";
          b.setAttribute("aria-pressed", "false");
        });
        recompute();
      }
    });

    recompute();
  }

  function updateProgress(count, total) {
    const pct = total ? Math.round((count / total) * 100) : 0;
    $("progressFill").style.width = pct + "%";
    $("progressLabel").textContent = `${count} of ${total} done`;
    const bar = $("progressBar");
    bar.setAttribute("aria-valuenow", String(pct));
    bar.setAttribute("aria-valuetext", `${count} of ${total} done`);
  }

  // =========================================================================
  // INIT
  // =========================================================================
  async function init() {
    applyTheme(localStorage.getItem(THEME_KEY) || "light");
    $("themeBtn").addEventListener("click", toggleTheme);

    await loadCatalog();

    const hash = location.hash || "";
    const m = hash.match(/[#&]p=([^&]+)/);
    if (m) {
      const payload = decodePlaylist(decodeURIComponent(m[1]));
      if (payload) {
        renderStudent(payload);
        return;
      }
    }

    // Builder mode
    loadBuilderState();
    renderTabs();
    bindBuilder();
    renderPlaylist();
    renderCatalog();
    updateShareLink();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
