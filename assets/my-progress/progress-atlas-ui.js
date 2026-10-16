/* ==========================================================================
 * progress-atlas-ui.js — the Learning Atlas's string builders: state badges,
 * the "grown this week" block, the time-to-revisit list, the text/list view
 * (the equal-value alternative to the map) and the detail panel. Pure functions over a view model; exposes NTAtlasUI.
 *
 * Every visible string carries its Spanish sibling through NTProgressSections.t.
 * Framing is capability and next step, never a deficit: connections say what
 * helps, states say where a skill is, nothing here says what a student lacks.
 * ========================================================================== */
(function (root) {
  "use strict";
  var V = root.NTProgressSections;
  var M = root.NTAtlasModel;
  if (!V || !M) return;
  var t = V.t;
  var esc = V.esc;

  var STATE = {
    notyet: {
      en: "Not yet",
      es: "Todavía no",
      say: t(
        "You have not started this one. It is waiting for you.",
        "Aún no la empiezas. Te está esperando.",
      ),
    },
    revisit: {
      en: "Worth another look",
      es: "Vale la pena repasar",
      say: t("A little practice here will pay off.", "Un poco de práctica aquí rinde mucho."),
    },
    growing: {
      en: "Getting there",
      es: "Vas avanzando",
      say: t("You are landing more than you miss.", "Aciertas más de lo que fallas."),
    },
    solid: {
      en: "Solid",
      es: "Firme",
      say: t("Your recent work on this is steady.", "Tu trabajo reciente en esto es constante."),
    },
    owned: {
      en: "Owned",
      es: "Lo dominas",
      say: t(
        "You proved this twice, a week apart.",
        "Lo demostraste dos veces, con una semana de diferencia.",
      ),
    },
  };
  var STRENGTH = {
    core: { en: "Big help", es: "Gran ayuda" },
    supporting: { en: "Helps along the way", es: "Ayuda en el camino" },
    fluency: { en: "Makes it smoother", es: "Lo hace más fluido" },
  };

  /** 16x16 state shapes. Shape, not colour, carries the meaning. */
  var ICON = {
    notyet:
      '<circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.2 2"/>',
    revisit:
      '<path d="M13 8a5 5 0 1 1-1.6-3.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M13.4 1.8v3.6H9.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    growing:
      '<circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 2.5a5.5 5.5 0 0 0 0 11z" fill="currentColor"/>',
    solid: '<circle cx="8" cy="8" r="6" fill="currentColor"/>',
    owned:
      '<path d="M8 1.3l1.9 4.3 4.6.4-3.5 3 1.1 4.5L8 11.2 3.9 13.5 5 9 1.5 6l4.6-.4z" fill="currentColor"/>',
    clock:
      '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 4.6V8l2.4 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  };
  function icon(kind, extra) {
    return (
      '<svg class="at-ico ' +
      (extra || "") +
      '" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">' +
      ICON[kind] +
      "</svg>"
    );
  }
  function badge(state) {
    return (
      '<span class="at-badge s-' +
      state +
      '">' +
      icon(state) +
      '<span class="at-badge-t">' +
      t(STATE[state].en, STATE[state].es) +
      "</span></span>"
    );
  }
  function dueChip() {
    return (
      '<span class="at-badge at-due">' +
      icon("clock") +
      '<span class="at-badge-t">' +
      t("Time to revisit", "Hora de repasar") +
      "</span></span>"
    );
  }
  function name(node) {
    return t(node.en, node.es);
  }
  function agoText(days) {
    if (days <= 0) return ["today", "hoy"];
    if (days === 1) return ["yesterday", "ayer"];
    return [days + " days ago", "hace " + days + " días"];
  }

  /* ----------------------------------------------------------- the stats */

  function statsHtml(vm) {
    var g = vm.growth;
    var owned = vm.counts.owned;
    var detail;
    if (g.grown == null)
      detail = t(
        "Your first week is the baseline. Come back after you practice and this fills in.",
        "Tu primera semana es el punto de partida. Vuelve después de practicar y aquí aparecerá tu avance.",
      );
    else if (!g.grown)
      detail = t(
        "Practice a skill this week and watch it move up.",
        "Practica una habilidad esta semana y verás cómo sube.",
      );
    else {
      var bits = [];
      if (g.started) bits.push([g.started + " started", g.started + " empezadas"]);
      if (g.up) bits.push([g.up + " moved up", g.up + " subieron"]);
      if (g.owned) bits.push([g.owned + " owned", g.owned + " dominadas"]);
      detail = t(
        bits
          .map(function (b) {
            return b[0];
          })
          .join(" · "),
        bits
          .map(function (b) {
            return b[1];
          })
          .join(" · "),
      );
    }
    function card(n, label, cls) {
      return (
        '<div class="up-card ' +
        (cls || "") +
        '"><div class="up-num">' +
        esc(n) +
        '</div><div class="up-lbl">' +
        label +
        "</div></div>"
      );
    }
    return (
      '<div class="at-stats"><h3 class="at-stats-h">' +
      t("Skills grown this week", "Habilidades que crecieron esta semana") +
      '</h3><div class="up-cards">' +
      card(
        g.grown == null ? "—" : g.grown,
        t("Skills grown", "Habilidades que crecieron"),
        "at-grown",
      ) +
      card(g.practiced, t("Skills practiced", "Habilidades practicadas")) +
      card(g.proofs, t("Proofs passed", "Pruebas superadas")) +
      card(owned + " / " + vm.counts.total, t("Skills owned", "Habilidades dominadas")) +
      '</div><p class="at-note" data-at="grown-note">' +
      detail +
      "</p></div>"
    );
  }

  function legendHtml() {
    return (
      '<ul class="at-legend" aria-label="' +
      esc("States · Estados") +
      '">' +
      M.STATES.map(function (s) {
        return "<li>" + badge(s) + "</li>";
      }).join("") +
      "</ul>"
    );
  }

  /* ------------------------------------------------- time to revisit list */

  function proofButton(st, node, cls) {
    var label;
    if (st.phase === "challenge") label = t("I know this — prove it", "Ya lo sé: demuéstralo");
    else if (st.phase === "recheck") label = t("Take my re-check", "Hacer mi repaso de prueba");
    else return "";
    return (
      '<button type="button" class="at-btn ' +
      (cls || "") +
      '" data-act="check" data-code="' +
      esc(node.code) +
      '" data-fk="check-' +
      esc(node.code) +
      '">' +
      label +
      "</button>"
    );
  }

  function dueHtml(vm) {
    var due = vm.statuses
      .filter(function (s) {
        return s.due || s.phase === "recheck";
      })
      .sort(function (a, b) {
        return a.lastTs - b.lastTs;
      })
      .slice(0, 6);
    var body;
    if (!due.length)
      body =
        '<p class="at-note">' +
        t(
          "Nothing is waiting. Skills you practiced recently are fresh.",
          "Nada está esperando. Las habilidades que practicaste hace poco están frescas.",
        ) +
        "</p>";
    else
      body =
        '<ul class="at-due-list">' +
        due
          .map(function (s) {
            var n = s.node;
            var why =
              s.phase === "recheck" && !s.due
                ? t("Your re-check is ready.", "Tu repaso de prueba está listo.")
                : s.dueReason === "band"
                  ? t("A little practice here pays off.", "Un poco de práctica aquí rinde mucho.")
                  : t(
                      "Last practiced " +
                        (s.daysSince || 0) +
                        " days ago. A quick refresh keeps it strong.",
                      "Última práctica hace " +
                        (s.daysSince || 0) +
                        " días. Un repaso rápido la mantiene fuerte.",
                    );
            return (
              '<li class="at-due-item"><div><p class="at-due-name">' +
              name(n) +
              " " +
              badge(s.state) +
              '</p><p class="at-meta">' +
              why +
              '</p></div><div class="at-due-act"><a class="up-link" href="/curriculum/units/?q=' +
              encodeURIComponent(n.code) +
              '" data-fk="p-' +
              esc(n.code) +
              '">' +
              t("Practice this", "Practicar esto") +
              "</a>" +
              proofButton(s, n, "ghost") +
              "</div></li>"
            );
          })
          .join("") +
        "</ul>";
    return (
      '<div class="at-due"><h3>' +
      icon("clock", "at-h-ico") +
      t("Time to revisit", "Hora de repasar") +
      "</h3>" +
      body +
      "</div>"
    );
  }

  /* ----------------------------------------------- detail + text list view */

  function edgeRows(edges, side, vm) {
    return edges
      .map(function (e) {
        var other = vm.graph.byCode[side === "in" ? e.from : e.to];
        var s = STRENGTH[e.strength] || STRENGTH.core;
        return (
          '<li class="at-edge"><p class="at-edge-head">' +
          '<button type="button" class="at-link" data-act="goto" data-code="' +
          esc(other.code) +
          '" data-fk="g-' +
          esc(other.code) +
          "-" +
          side +
          '">' +
          name(other) +
          '</button> <span class="at-tag">' +
          t(s.en, s.es) +
          '</span></p><p class="at-edge-why">' +
          t(e.en, e.es) +
          "</p></li>"
        );
      })
      .join("");
  }

  function actionsHtml(st, node) {
    var out = "";
    if (st.phase === "wait")
      out +=
        '<p class="at-note">' +
        t(
          "You showed this skill. Your re-check opens on " +
            new Date(st.readyAt).toLocaleDateString() +
            ".",
          "Mostraste esta habilidad. Tu repaso de prueba se abre el " +
            new Date(st.readyAt).toLocaleDateString() +
            ".",
        ) +
        "</p>";
    else if (st.phase === "owned")
      out +=
        '<p class="at-note">' +
        t(
          "You own this skill since " + new Date(st.ownedAt).toLocaleDateString() + ".",
          "Dominas esta habilidad desde el " + new Date(st.ownedAt).toLocaleDateString() + ".",
        ) +
        "</p>";
    else if (st.phase === "none")
      out +=
        '<p class="at-note">' +
        t(
          "The proof check for this skill is not ready yet. Keep practicing in lessons and games.",
          "La prueba de esta habilidad todavía no está lista. Sigue practicando en lecciones y juegos.",
        ) +
        "</p>";
    return (
      '<div class="at-actions">' +
      proofButton(st, node, "") +
      '<a class="at-btn ghost" href="/curriculum/units/?q=' +
      encodeURIComponent(node.code) +
      '">' +
      t("Practice this", "Practicar esto") +
      "</a></div>" +
      out
    );
  }

  /** A node's full story: used by the detail panel and by every list row. */
  function nodeBody(st, vm) {
    var n = st.node;
    var evidence =
      st.lastTs && st.state !== "notyet"
        ? '<p class="at-meta">' +
          t(
            "Last practiced " + agoText(st.daysSince)[0],
            "Última práctica " + agoText(st.daysSince)[1],
          ) +
          "</p>"
        : "";
    var helps = n.prereqs.length
      ? "<h4>" +
        t("These skills help you here", "Estas habilidades te ayudan aquí") +
        '</h4><ul class="at-edges">' +
        edgeRows(n.prereqs, "in", vm) +
        "</ul>"
      : '<p class="at-note">' +
        t(
          "This is a starting point. It builds on what you already know.",
          "Este es un punto de partida. Se apoya en lo que ya sabes.",
        ) +
        "</p>";
    var leads = n.leads.length
      ? "<h4>" +
        t("This helps you with", "Esto te ayuda con") +
        '</h4><ul class="at-edges">' +
        edgeRows(n.leads, "out", vm) +
        "</ul>"
      : "";
    return (
      '<p class="at-badges">' +
      badge(st.state) +
      (st.due ? dueChip() : "") +
      "</p><p>" +
      STATE[st.state].say +
      "</p>" +
      evidence +
      actionsHtml(st, n) +
      helps +
      leads
    );
  }

  function unitOf(vm, node) {
    var u = vm.graph.units[node.col];
    return u ? t(u.en, u.es) : "";
  }

  function detailHtml(vm, code) {
    var st = vm.byCode[code];
    if (!st) return "";
    return (
      '<h3 id="at-detail-title">' +
      name(st.node) +
      ' <span class="up-code">' +
      esc(st.node.code) +
      '</span></h3><p class="at-meta">' +
      unitOf(vm, st.node) +
      "</p>" +
      nodeBody(st, vm)
    );
  }

  function listHtml(vm) {
    return vm.graph.units
      .map(function (u, col) {
        var nodes = vm.statuses.filter(function (s) {
          return s.node.col === col;
        });
        return (
          '<section class="at-unit" aria-labelledby="at-u-' +
          col +
          '"><h4 id="at-u-' +
          col +
          '">' +
          t(u.en, u.es) +
          '</h4><ul class="at-list">' +
          nodes
            .map(function (s) {
              return (
                '<li class="at-item s-' +
                s.state +
                '"><details data-code="' +
                esc(s.node.code) +
                '"><summary data-fk="s-' +
                esc(s.node.code) +
                '"><span class="at-item-name">' +
                name(s.node) +
                '</span><span class="at-item-state">' +
                badge(s.state) +
                (s.due ? dueChip() : "") +
                '</span></summary><div class="at-item-body">' +
                nodeBody(s, vm) +
                "</div></details></li>"
              );
            })
            .join("") +
          "</ul></section>"
        );
      })
      .join("");
  }

  root.NTAtlasUI = {
    STATE: STATE,
    icon: icon,
    ICON: ICON,
    badge: badge,
    name: name,
    dueChip: dueChip,
    statsHtml: statsHtml,
    legendHtml: legendHtml,
    dueHtml: dueHtml,
    detailHtml: detailHtml,
    listHtml: listHtml,
  };
})(typeof window !== "undefined" ? window : globalThis);
