/* ==========================================================================
 * progress-atlas.js — the Learning Atlas on My Progress, and its public API.
 *
 * A keyboard-navigable map of the Grade 6 standards in the order the class
 * learns them, with plain-language "this helps you with that" connections,
 * a text view that says everything the map says, a "time to revisit" list,
 * "I know this — prove it" checks that can earn Owned, and a "skills grown
 * this week" block. Everything is read from this device and stays on it.
 *
 *   NTProgressAtlas.mount(el)      the full Atlas (My Progress)
 *   NTProgressAtlas.mountMini(el)  a compact card for the dashboard
 *   NTProgressAtlas.snapshot()     compact summary, or null until loaded
 *   NTProgressAtlas.load()         Promise that resolves when data is ready
 *   NTProgressAtlas.restore(stores) merge nt-atlas:v1 from a My Progress backup
 *
 * Reads: nt-signal:v1 and the other My Progress stores (read-only, through
 * NTProgressStores). Writes: only nt-atlas:v1, only from a proof the student
 * chose to take and from a once-a-day snapshot of where each skill stands.
 * ========================================================================== */
(function (root) {
  "use strict";
  var S = root.NTProgressStores;
  var V = root.NTProgressSections;
  var M = root.NTAtlasModel;
  var ST = root.NTAtlasStore;
  var UI = root.NTAtlasUI;
  var MAP = root.NTAtlasMap;
  if (!S || !V || !M || !ST || !UI) return;
  var t = V.t;
  var esc = V.esc;
  var HREF = "/curriculum/my-progress/#learning-atlas";
  var NARROW = 720;

  var data = null;
  var loading = null;
  var instances = [];

  function getJson(url) {
    var cache = root.NTJsonCache;
    if (cache && cache.json) return cache.json(url, { credentials: "omit" });
    return root.fetch(url, { credentials: "omit" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  function load() {
    if (data) return Promise.resolve(data);
    if (!loading)
      loading = Promise.all([
        getJson("/data/standards-prerequisites.json"),
        getJson("/data/atlas-student-why.json"),
        getJson("/data/retrieval-bank.json"),
      ]).then(
        function (r) {
          var counts = {};
          Object.keys(r[2].bank || {}).forEach(function (c) {
            counts[c] = r[2].bank[c].length;
          });
          data = {
            graph: M.buildGraph(r[0], r[1], r[2].sequence),
            bank: r[2].bank || {},
            counts: counts,
          };
          return data;
        },
        function (e) {
          loading = null;
          throw e;
        },
      );
    return loading;
  }

  /** The whole picture, derived from the stores. Never writes. */
  function compute(storage, now) {
    var snap = S.collect(storage);
    var store = ST.readStore(storage);
    var statuses = M.statusAll(data.graph, S.skillRows(snap), store, data.counts, now);
    var byCode = {};
    var counts = { total: statuses.length };
    M.STATES.forEach(function (s) {
      counts[s] = 0;
    });
    statuses.forEach(function (s) {
      byCode[s.node.code] = s;
      counts[s.state] += 1;
    });
    return {
      graph: data.graph,
      statuses: statuses,
      byCode: byCode,
      store: store,
      counts: counts,
      growth: M.growth(store, statuses, now),
      next: M.nextUp(data.graph, statuses),
      now: now,
    };
  }

  function sameRanks(a, b) {
    var ka = Object.keys(a);
    return (
      ka.length === Object.keys(b).length &&
      ka.every(function (k) {
        return a[k] === b[k];
      })
    );
  }

  /** Once a day, remember where each skill stands so next week can show growth. */
  function recordSnapshot(vm) {
    var next = ST.touchSnap(vm.store, vm.statuses, vm.now);
    var last = vm.store.snaps[vm.store.snaps.length - 1];
    var today = next.snaps[next.snaps.length - 1];
    if (
      last &&
      Math.floor(last.at / ST.DAY) === Math.floor(today.at / ST.DAY) &&
      sameRanks(last.r, today.r)
    )
      return vm;
    ST.writeStore(root.localStorage, next);
    return compute(root.localStorage, vm.now);
  }

  function miniHtml(snap) {
    var c = snap.counts;
    var line = t(
      c.owned + " owned · " + c.solid + " solid · " + c.growing + " getting there",
      c.owned + " dominadas · " + c.solid + " firmes · " + c.growing + " avanzando",
    );
    var grown =
      snap.grown == null
        ? t(
            "Practice a skill and your growth shows up here.",
            "Practica una habilidad y tu avance aparecerá aquí.",
          )
        : t(
            snap.grown + " skills grown this week",
            snap.grown + " habilidades crecieron esta semana",
          );
    var dots = snap.nodes
      .map(function (n) {
        return (
          '<span class="at-dot s-' +
          M.STATES[n.s] +
          (n.d ? " is-due" : "") +
          '">' +
          UI.icon(M.STATES[n.s]) +
          "</span>"
        );
      })
      .join("");
    var next = snap.next
      ? '<p class="at-mini-next">' +
        '<span class="at-kicker">' +
        esc("Next up · Sigue") +
        "</span><strong>" +
        t(snap.next.en, snap.next.es) +
        "</strong></p>"
      : "";
    var summary =
      c.owned +
      " owned, " +
      c.solid +
      " solid, " +
      c.growing +
      " getting there, " +
      c.revisit +
      " worth another look, " +
      c.notyet +
      " not yet, of " +
      c.total +
      " skills";
    return (
      '<div class="at-mini"><h3 class="at-mini-h">' +
      t("My Learning Atlas", "Mi Atlas de aprendizaje") +
      '</h3><div class="at-dots" role="img" aria-label="' +
      esc(summary) +
      '">' +
      dots +
      '</div><p class="at-mini-line">' +
      line +
      '</p><p class="at-mini-grown"><strong>' +
      grown +
      "</strong></p>" +
      (snap.due
        ? '<p class="at-mini-due">' +
          UI.icon("clock") +
          t(snap.due + " ready to revisit", snap.due + " listas para repasar") +
          "</p>"
        : "") +
      next +
      '<a class="at-btn" href="' +
      esc(snap.href) +
      '">' +
      t("Open my Atlas", "Abrir mi Atlas") +
      "</a></div>"
    );
  }

  function snapshot() {
    if (!data) return null;
    var vm = compute(root.localStorage, Date.now());
    var next = vm.next && vm.next.status.node;
    return {
      v: 1,
      at: vm.now,
      total: vm.counts.total,
      counts: {
        notyet: vm.counts.notyet,
        revisit: vm.counts.revisit,
        growing: vm.counts.growing,
        solid: vm.counts.solid,
        owned: vm.counts.owned,
        total: vm.counts.total,
      },
      due: vm.statuses.filter(function (s) {
        return s.due;
      }).length,
      ready: vm.statuses.filter(function (s) {
        return s.phase === "recheck";
      }).length,
      grown: vm.growth.grown,
      practiced: vm.growth.practiced,
      next: next ? { code: next.code, en: next.en, es: next.es, why: vm.next.why } : null,
      nodes: vm.statuses.map(function (s) {
        return { c: s.node.code, s: s.rank, d: s.due ? 1 : 0, u: s.node.col };
      }),
      href: HREF,
    };
  }

  /* ------------------------------------------------------------ the page */

  function skeleton() {
    return (
      '<section class="up-section at-root" id="learning-atlas" aria-labelledby="at-title"><h2 id="at-title">' +
      t("My Learning Atlas", "Mi Atlas de aprendizaje") +
      '</h2><p class="at-note">' +
      t(
        "Every Grade 6 skill, in the order our class learns them. Each line shows how one skill helps you with the next. Pick a skill to see more, or prove one you already know.",
        "Todas las habilidades de 6.º grado, en el orden en que las aprende nuestra clase. Cada línea muestra cómo una habilidad te ayuda con la siguiente. Elige una para ver más, o demuestra una que ya sabes.",
      ) +
      '</p><div data-at="body"><p class="at-note" role="status">' +
      t("Loading your Atlas…", "Cargando tu Atlas…") +
      "</p></div></section>"
    );
  }

  function bodySkeleton(inst) {
    function tab(act, val, current, label) {
      return (
        '<button type="button" class="at-tab" data-act="' +
        act +
        '" data-val="' +
        val +
        '" aria-pressed="' +
        (current === val) +
        '" data-fk="' +
        act +
        "-" +
        val +
        '">' +
        label +
        "</button>"
      );
    }
    return (
      '<div data-at="stats"></div><div data-at="check" class="at-check" role="region" aria-labelledby="at-check-title" hidden></div>' +
      '<div data-at="due"></div><div class="at-toolbar"><div class="at-seg" role="group" aria-label="' +
      "View · Vista" +
      '">' +
      tab("view", "map", inst.view, t("Map", "Mapa")) +
      tab("view", "list", inst.view, t("List", "Lista")) +
      '</div><div class="at-seg at-lang" role="group" aria-label="' +
      "Map labels · Etiquetas del mapa" +
      '">' +
      tab("lang", "en", inst.lang, "English") +
      tab("lang", "es", inst.lang, "Español") +
      "</div></div>" +
      '<div data-at="legend"></div><p class="at-sr" role="status" aria-live="polite" data-at="live"></p>' +
      '<div class="at-map-scroll" data-at="map" role="region" aria-label="' +
      "Learning map · Mapa de aprendizaje" +
      '"></div><div class="at-detail" data-at="detail"></div><div class="at-list-wrap" data-at="list"></div>'
    );
  }

  function visible(el) {
    return !el.closest("[hidden]");
  }

  function q(inst, name) {
    return inst.el.querySelector('[data-at="' + name + '"]');
  }

  function paint(inst) {
    var active = root.document.activeElement;
    var key = active && inst.el.contains(active) ? active.getAttribute("data-fk") : null;
    var vm = inst.vm;
    if (!inst.sel || !vm.byCode[inst.sel])
      inst.sel = vm.next ? vm.next.status.node.code : vm.graph.nodes[0].code;
    q(inst, "stats").innerHTML = UI.statsHtml(vm);
    q(inst, "due").innerHTML = UI.dueHtml(vm);
    q(inst, "legend").innerHTML = UI.legendHtml();
    q(inst, "map").innerHTML = MAP.mapHtml(vm, inst.sel, inst.lang);
    q(inst, "detail").innerHTML = UI.detailHtml(vm, inst.sel);
    q(inst, "list").innerHTML = UI.listHtml(vm);
    applyView(inst);
    if (key) {
      var again = inst.el.querySelector('[data-fk="' + key + '"]');
      if (again && visible(again)) again.focus();
    }
  }

  function applyView(inst) {
    var map = inst.view === "map";
    q(inst, "map").hidden = !map;
    q(inst, "detail").hidden = !map;
    q(inst, "legend").hidden = !map;
    q(inst, "list").hidden = map;
    inst.el.querySelectorAll('[data-act="view"], [data-act="lang"]').forEach(function (b) {
      var cur = b.getAttribute("data-act") === "view" ? inst.view : inst.lang;
      b.setAttribute("aria-pressed", String(b.getAttribute("data-val") === cur));
    });
    inst.el.querySelector(".at-lang").hidden = !map;
  }

  function refresh(inst) {
    inst.vm = compute(root.localStorage, Date.now());
    paint(inst);
  }

  function select(inst, code, focus) {
    inst.sel = code;
    var vm = inst.vm;
    inst.el.querySelectorAll(".at-node").forEach(function (g) {
      var on = g.getAttribute("data-code") === code;
      g.classList.toggle("is-selected", on);
      g.setAttribute("aria-pressed", String(on));
      g.setAttribute("tabindex", on ? "0" : "-1");
    });
    inst.el.querySelectorAll(".at-edge-line").forEach(function (p) {
      p.classList.toggle("is-in", p.getAttribute("data-to") === code);
      p.classList.toggle("is-out", p.getAttribute("data-from") === code);
    });
    q(inst, "detail").innerHTML = UI.detailHtml(vm, code);
    var st = vm.byCode[code];
    q(inst, "live").textContent = st.node.en + ". " + UI.STATE[st.state].en + ".";
    if (focus) {
      var g = inst.el.querySelector('.at-node[data-code="' + code + '"]');
      if (g) g.focus();
    }
  }

  function gotoNode(inst, code) {
    if (inst.view === "list") {
      var d = inst.el.querySelector('details[data-code="' + code + '"]');
      if (d) {
        d.open = true;
        d.querySelector("summary").focus();
      }
      return;
    }
    select(inst, code, true);
  }

  function closeCheck(inst, code, retry) {
    var host = q(inst, "check");
    host.hidden = true;
    host.innerHTML = "";
    refresh(inst);
    if (retry) return startCheck(inst, code);
    var back = inst.el.querySelector(
      '[data-fk="check-' + code + '"], [data-fk="n-' + code + '"], [data-fk="s-' + code + '"]',
    );
    if (back && visible(back)) back.focus();
  }

  function startCheck(inst, code) {
    var st = inst.vm.byCode[code];
    if (!st || (st.phase !== "challenge" && st.phase !== "recheck") || !root.NTAtlasCheck) return;
    var rec = inst.vm.store.nodes[code];
    var items = M.pickItems(data.bank[code], rec);
    if (items.length < M.CHECK_SIZE) return;
    var kind = st.phase === "recheck" ? "r" : "c";
    var host = q(inst, "check");
    root.NTAtlasCheck.open(host, {
      node: st.node,
      kind: kind,
      items: items,
      finish: function (score, ids) {
        var res = M.applyCheck(ST.readStore(root.localStorage), code, kind, score, ids, Date.now());
        ST.writeStore(root.localStorage, res.store);
        return res.outcome;
      },
      onClose: function (retry) {
        closeCheck(inst, code, retry);
      },
    });
    if (host.scrollIntoView) host.scrollIntoView({ block: "nearest" });
  }

  function onKey(inst, e) {
    var g = e.target.closest && e.target.closest(".at-node");
    if (!g) return;
    var node = inst.vm.graph.byCode[g.getAttribute("data-code")];
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(inst, node.code, true);
      return;
    }
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].indexOf(e.key) < 0)
      return;
    e.preventDefault();
    var to = MAP.neighbor(inst.vm.graph, node, e.key);
    if (!to) return;
    inst.el.querySelectorAll(".at-node").forEach(function (n) {
      n.setAttribute("tabindex", n.getAttribute("data-code") === to.code ? "0" : "-1");
    });
    var target = inst.el.querySelector('.at-node[data-code="' + to.code + '"]');
    if (target) target.focus();
  }

  function onClick(inst, e) {
    var el = e.target.closest && e.target.closest("[data-act], .at-node");
    if (!el) return;
    if (el.classList.contains("at-node")) return select(inst, el.getAttribute("data-code"), true);
    var act = el.getAttribute("data-act");
    if (act === "view" || act === "lang") {
      inst[act] = el.getAttribute("data-val");
      applyView(inst);
      if (act === "lang") q(inst, "map").innerHTML = MAP.mapHtml(inst.vm, inst.sel, inst.lang);
    } else if (act === "goto") gotoNode(inst, el.getAttribute("data-code"));
    else if (act === "check") startCheck(inst, el.getAttribute("data-code"));
  }

  function docLang() {
    var l = (root.document.documentElement.lang || root.navigator.language || "en").slice(0, 2);
    return l === "es" ? "es" : "en";
  }

  function mount(el) {
    if (!el || !MAP || el.__atlas) return;
    var inst = {
      el: el,
      sel: null,
      view: root.innerWidth < NARROW ? "list" : "map",
      lang: docLang(),
      vm: null,
    };
    el.__atlas = inst;
    el.innerHTML = skeleton();
    var body = el.querySelector('[data-at="body"]');
    el.addEventListener("click", function (e) {
      if (inst.vm) onClick(inst, e);
    });
    el.addEventListener("keydown", function (e) {
      if (inst.vm) onKey(inst, e);
    });
    load().then(
      function () {
        inst.vm = recordSnapshot(compute(root.localStorage, Date.now()));
        body.innerHTML = bodySkeleton(inst);
        instances.push(inst);
        paint(inst);
      },
      function () {
        body.innerHTML =
          '<p class="at-note" role="status">' +
          t(
            "The Atlas could not load right now. Your progress is safe on this device. Try again in a moment.",
            "El Atlas no se pudo cargar ahora. Tu progreso está a salvo en este dispositivo. Inténtalo de nuevo en un momento.",
          ) +
          "</p>";
      },
    );
  }

  function mountMini(el) {
    if (!el || el.__atlasMini) return;
    el.__atlasMini = true;
    el.classList.add("at-root");
    function draw() {
      var snap = snapshot();
      if (snap) el.innerHTML = miniHtml(snap);
    }
    load().then(draw, function () {});
    root.addEventListener("storage", draw);
  }

  function restore(stores) {
    var raw = stores && stores[ST.STORE_KEY];
    if (typeof raw !== "string") return false;
    try {
      var merged = ST.mergeStores(ST.readStore(root.localStorage), JSON.parse(raw));
      if (!ST.writeStore(root.localStorage, merged)) return false;
    } catch (_e) {
      return false;
    }
    instances.forEach(function (inst) {
      refresh(inst);
    });
    return true;
  }

  root.addEventListener("storage", function () {
    instances.forEach(function (inst) {
      if (q(inst, "check").hidden) refresh(inst);
    });
  });

  root.NTProgressAtlas = {
    load: load,
    mount: mount,
    mountMini: mountMini,
    snapshot: snapshot,
    restore: restore,
  };

  function boot() {
    root.document.querySelectorAll("[data-atlas-mini]").forEach(mountMini);
  }
  if (root.document.readyState === "loading")
    root.document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
