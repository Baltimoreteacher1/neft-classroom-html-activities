// Our Class Investigation — the page.
//
// One real question runs all year. This page lets a student join a class by
// code (or work on their own, with no server at all), add a measurement through
// a guided form, watch the class's data fill a live graph, and open the tool each
// unit adds. Everything a student sends is saved on the device first and goes out
// when the network allows (see sync.js); everything a student types into a unit
// tool is practice and is never stored.

import { barSvg, dotPlotSvg, histogramSvg, scatterSvg } from "./charts.js";
import { displayCode } from "./contract.js";
import { announce, h } from "./dom.js";
import { buildForm } from "./form.js";
import { getLang, pick, setLang, tr } from "./i18n.js";
import { createStore } from "./store.js";
import { createClient, flushQueue, refreshDataset } from "./sync.js";
import { buildTeacherPanel } from "./teacher.js";
import {
  activeFields,
  choiceFields,
  getTemplate,
  numericFields,
  resolveOptions,
  TEMPLATES,
} from "./templates.js";
import { buildToolbox } from "./unit-cards.js";

const POLL_MS = 20_000;

export function startApp(root) {
  let lang = getLang();
  const store = createStore();
  const client = createClient();
  let enginePromise = null;
  const engine = () => {
    enginePromise ??= import("./engine-tools.js").catch(() => null);
    return enginePromise;
  };

  const ui = {
    viewId: store.state.templateId,
    followActive: true,
    info: null, // last /info answer
    joinError: "",
    soloChosen: false,
    thanks: "",
    chart: "",
    vars: {},
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    serverDown: false,
  };

  const els = Object.fromEntries(
    ["status", "join", "invest", "form", "graph", "tools", "teacher"].map((name) => [
      name,
      h("div", { id: `ci-${name}`, class: "ci-section" }),
    ]),
  );
  const live = h("div", { class: "ci-sr", role: "status", "aria-live": "polite" });
  root.replaceChildren(live, ...Object.values(els));
  let toolbox = null;

  /* ── derived state ── */
  const viewTemplate = () => getTemplate(ui.viewId) ?? TEMPLATES[0];
  const infoFor = (id) => ui.info?.investigations.find((i) => i.templateId === id) ?? null;
  const viewOptions = () => {
    const t = viewTemplate();
    if (store.mode === "class")
      return resolveOptions(t, infoFor(t.id)?.options ?? store.state.cache?.options);
    return resolveOptions(t, store.state.templateId === t.id ? store.state.options : {});
  };
  const viewFields = () => activeFields(viewTemplate(), viewOptions());
  const dataset = () => store.dataset(ui.viewId);
  const viewStatus = () =>
    store.mode === "class" ? (infoFor(ui.viewId)?.status ?? "open") : "open";

  /* ── network ── */
  async function loadClass() {
    if (store.mode !== "class") return;
    const r = await client.info(store.state.code);
    ui.serverDown = false;
    if (r.ok) {
      ui.info = r.data;
      const active = infoFor(r.data.active);
      store.setInvestigation(r.data.active, active?.options ?? {});
      if (ui.followActive || !infoFor(ui.viewId)) ui.viewId = r.data.active;
      ui.joinError = "";
    } else if (r.status === 404) {
      store.leaveClass();
      ui.info = null;
      ui.joinError = "noClass";
    } else if (r.status !== 0) {
      ui.serverDown = true;
    }
  }

  async function loadData() {
    if (store.mode !== "class") return;
    await refreshDataset(store, client, ui.viewId);
  }

  async function sendQueue() {
    if (!store.pending().length) return;
    const r = await flushQueue(store, client);
    if (r.sent) announce(live, tr("allSent", lang));
    if (r.sent || r.rejected) await loadData();
  }

  async function tick() {
    if (store.mode === "class" && ui.online) {
      await loadClass();
      await sendQueue();
      await loadData();
    }
    drawAll(true);
  }

  /* ── drawing ── */
  function drawHeader() {
    document.documentElement.lang = lang;
    document.title = `${tr("title", lang)} · Neft Teacher`;
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("ci-h1", tr("title", lang));
    set("ci-tagline", tr("tagline", lang));
    set("ci-back", tr("back", lang));
    set("ci-skip", tr("skip", lang));
    const switcher = document.getElementById("ci-lang");
    if (switcher) {
      switcher.setAttribute("aria-label", tr("langLabel", lang));
      switcher.replaceChildren(
        ...[
          ["en", "English"],
          ["es", "Español"],
        ].map(([code, name]) =>
          h("button", {
            type: "button",
            class: "ci-langbtn",
            lang: code,
            "aria-pressed": String(lang === code),
            text: name,
            onclick: () => {
              lang = code;
              setLang(code);
              drawAll();
            },
          }),
        ),
      );
    }
  }

  function drawStatus() {
    const pending = store.pending().length;
    const rejected = store.rejected().length;
    const children = [
      h("span", {
        class: "ci-pill",
        text: tr(store.mode === "class" ? "modeClass" : "modeSolo", lang),
      }),
    ];
    if (store.mode === "class") {
      children.push(
        h("span", { class: "ci-pill", text: tr(ui.online ? "online" : "offline", lang) }),
      );
      children.push(
        h("span", {
          class: "ci-pill",
          text: pending ? tr("waiting", lang, { n: pending }) : tr("allSent", lang),
        }),
      );
      if (pending) {
        children.push(
          h("button", {
            type: "button",
            class: "ci-btn ci-btn-quiet",
            text: tr("syncNow", lang),
            onclick: tick,
          }),
        );
      }
      if (ui.serverDown)
        children.push(h("span", { class: "ci-pill ci-pill-warn", text: tr("serverDown", lang) }));
    }
    els.status.replaceChildren(
      ...[
        h("div", { class: "ci-statusbar" }, children),
        rejected
          ? h("p", { class: "ci-note", text: tr("rejectedNote", lang, { n: rejected }) })
          : null,
      ].filter(Boolean),
    );
  }

  function drawJoin() {
    if (store.mode === "class") {
      els.join.replaceChildren(
        h("section", { class: "ci-card ci-joined" }, [
          h("p", {}, [
            h("strong", { text: tr("inClass", lang, { code: displayCode(store.state.code) }) }),
            " ",
            h("button", {
              type: "button",
              class: "ci-btn ci-btn-quiet",
              text: tr("leaveBtn", lang),
              onclick: () => {
                store.leaveClass();
                ui.info = null;
                ui.viewId = store.state.templateId;
                ui.followActive = true;
                drawAll();
              },
            }),
          ]),
        ]),
      );
      return;
    }
    if (ui.soloChosen) {
      els.join.replaceChildren(
        h("section", { class: "ci-card ci-joined" }, [
          h("p", {}, [
            h("strong", { text: tr("modeSolo", lang) }),
            ". ",
            tr("soloNote", lang),
            " ",
            h("button", {
              type: "button",
              class: "ci-btn ci-btn-quiet",
              text: tr("joinTitle", lang),
              onclick: () => {
                ui.soloChosen = false;
                drawJoin();
                els.join.querySelector("input")?.focus();
              },
            }),
          ]),
        ]),
      );
      return;
    }
    const code = h("input", {
      type: "text",
      id: "ci-code",
      class: "ci-codeinput",
      maxlength: 12,
      autocomplete: "off",
      autocapitalize: "characters",
      spellcheck: "false",
      "aria-describedby": "ci-code-msg",
      value: new URLSearchParams(location.search).get("code") ?? "",
    });
    const msg = h("p", {
      class: "ci-error",
      id: "ci-code-msg",
      role: "alert",
      text: ui.joinError ? tr(ui.joinError, lang) : "",
    });
    const join = async (event) => {
      event.preventDefault();
      if (!store.joinClass(code.value)) {
        msg.textContent = tr("badCode", lang);
        code.focus();
        return;
      }
      ui.followActive = true;
      ui.joinError = "";
      await loadClass();
      if (store.mode === "class") {
        await loadData();
        announce(live, tr("inClass", lang, { code: displayCode(store.state.code) }));
      }
      drawAll();
    };
    els.join.replaceChildren(
      h("section", { class: "ci-card", "aria-labelledby": "ci-join-title" }, [
        h("h2", { id: "ci-join-title", text: tr("joinTitle", lang) }),
        h("p", { text: tr("joinHelp", lang) }),
        h("form", { class: "ci-joinform", onsubmit: join, novalidate: true }, [
          h("label", { for: "ci-code", text: tr("codeLabel", lang) }),
          code,
          h("button", {
            type: "submit",
            class: "ci-btn ci-btn-primary",
            text: tr("joinBtn", lang),
          }),
          h("button", {
            type: "button",
            class: "ci-btn",
            text: tr("soloBtn", lang),
            onclick: () => {
              ui.soloChosen = true;
              drawJoin();
            },
          }),
        ]),
        msg,
        h("p", { class: "ci-small", text: tr("soloNote", lang) }),
      ]),
    );
  }

  function drawInvest() {
    const t = viewTemplate();
    const n = dataset().length;
    const status = viewStatus();
    const kids = [
      h("h2", { text: tr("investTitle", lang) }),
      h("h3", { class: "ci-question-title", text: pick(t.title, lang) }),
      h("p", { class: "ci-bigq", text: pick(t.question, lang) }),
      h("p", { class: "ci-small" }, [
        h("strong", { text: `${tr("whyTitle", lang)}: ` }),
        pick(t.why, lang),
      ]),
      h("p", {}, [
        h("span", {
          class: "ci-pill",
          text: tr(status === "closed" ? "statusClosed" : "statusOpen", lang),
        }),
        " ",
        h("span", { class: "ci-pill", text: tr("dotsCount", lang, { n }) }),
        store.mode === "class" && ui.viewId !== store.state.templateId
          ? h("span", { class: "ci-pill ci-pill-warn", text: ` ${tr("notActive", lang)}` })
          : null,
      ]),
    ];
    if (store.mode === "solo") {
      const select = h(
        "select",
        {
          id: "ci-pick",
          class: "ci-select",
          onchange: (e) => {
            store.setInvestigation(e.target.value, {});
            ui.viewId = e.target.value;
            ui.chart = "";
            drawAll();
          },
        },
        TEMPLATES.map((x) => h("option", { value: x.id, text: pick(x.title, lang) })),
      );
      select.value = ui.viewId;
      kids.push(
        h(
          "div",
          { class: "ci-chooser" },
          h("label", { for: "ci-pick", text: tr("pickInvest", lang) }),
          select,
        ),
      );
      if (t.options.length) {
        for (const opt of t.options) {
          kids.push(
            h(
              "label",
              { class: "ci-check" },
              h("input", {
                type: "checkbox",
                checked: viewOptions()[opt.id],
                onchange: (e) => {
                  store.setInvestigation(t.id, {
                    ...store.state.options,
                    [opt.id]: e.target.checked,
                  });
                  drawAll();
                },
              }),
              h(
                "span",
                {},
                pick(opt.label, lang),
                h("small", { text: ` ${pick(opt.note, lang)}` }),
              ),
            ),
          );
        }
      }
    } else {
      kids.push(h("p", { class: "ci-small", text: tr("teacherPicks", lang) }));
      const all = ui.info?.investigations ?? [];
      if (all.length > 1) {
        const select = h(
          "select",
          {
            id: "ci-view",
            class: "ci-select",
            onchange: async (e) => {
              ui.viewId = e.target.value;
              ui.followActive = ui.viewId === ui.info.active;
              await loadData();
              drawAll();
            },
          },
          all.map((i) =>
            h("option", { value: i.templateId, text: pick(getTemplate(i.templateId).title, lang) }),
          ),
        );
        select.value = ui.viewId;
        kids.push(
          h(
            "div",
            { class: "ci-chooser" },
            h("label", { for: "ci-view", text: tr("viewOther", lang) }),
            select,
          ),
        );
      }
    }
    els.invest.replaceChildren(h("section", { class: "ci-card" }, kids));
  }

  function drawForm() {
    const t = viewTemplate();
    let blockedReason;
    if (store.mode === "class" && ui.viewId !== store.state.templateId)
      blockedReason = "notActiveForm";
    else if (viewStatus() === "closed") blockedReason = "closedForm";
    else if (store.mode === "class" && !ui.info)
      blockedReason = ui.serverDown ? "serverDown" : null;
    const form = buildForm({
      template: t,
      options: viewOptions(),
      lang,
      store,
      blockedReason,
      onAdded: () => {
        ui.thanks = store.mode === "class" ? (ui.online ? "thanks" : "thanksQueued") : "thanks";
        announce(live, tr(ui.thanks, lang));
        drawAll();
        if (store.mode === "class") tick();
      },
      onNextPerson: () => {
        ui.thanks = "";
        drawForm();
      },
    });
    els.form.replaceChildren(
      ...[
        ui.thanks
          ? h("p", { class: "ci-thanks", role: "status", text: tr(ui.thanks, lang) })
          : null,
        form,
      ].filter(Boolean),
    );
  }

  function chartChoices(fields) {
    const nums = numericFields(fields);
    const kinds = [];
    if (nums.length) kinds.push("dot", "hist");
    if (nums.length >= 2) kinds.push("scatter");
    if (choiceFields(fields).length) kinds.push("bar");
    return kinds;
  }

  function drawGraph() {
    const fields = viewFields();
    const entries = dataset();
    const kinds = chartChoices(fields);
    if (!kinds.includes(ui.chart)) ui.chart = kinds[0];
    const nums = numericFields(fields);
    const cats = choiceFields(fields);
    const label = (f) => pick(f.short, lang);
    const unit = (f) => pick(f.unit, lang);
    ui.vars.one = nums.some((f) => f.id === ui.vars.one) ? ui.vars.one : nums[0]?.id;
    ui.vars.x = nums.some((f) => f.id === ui.vars.x) ? ui.vars.x : nums[0]?.id;
    ui.vars.y =
      nums.some((f) => f.id === ui.vars.y) && ui.vars.y !== ui.vars.x
        ? ui.vars.y
        : nums.find((f) => f.id !== ui.vars.x)?.id;

    const numberOf = (f) =>
      entries
        .filter((e) => typeof e.v[f.id] === "number")
        .map((e) => ({ v: e.v[f.id], mine: e.mine }));
    let svg = "";
    if (ui.chart === "dot" || ui.chart === "hist") {
      const f = nums.find((x) => x.id === ui.vars.one);
      const o = { label: label(f), unit: unit(f), step: f.step, lang };
      svg = (ui.chart === "dot" ? dotPlotSvg : histogramSvg)(numberOf(f), o);
    } else if (ui.chart === "scatter") {
      const fx = nums.find((x) => x.id === ui.vars.x);
      const fy = nums.find((x) => x.id === ui.vars.y);
      const pairs = entries
        .filter((e) => typeof e.v[fx.id] === "number" && typeof e.v[fy.id] === "number")
        .map((e) => ({ x: e.v[fx.id], y: e.v[fy.id], mine: e.mine }));
      svg = scatterSvg(pairs, {
        xLabel: label(fx),
        yLabel: label(fy),
        xUnit: unit(fx),
        yUnit: unit(fy),
        lang,
      });
    } else {
      const f = cats[0];
      const bars = f.choices.map((c) => {
        const mine = entries.filter((e) => e.v[f.id] === c.id);
        return {
          id: c.id,
          label: pick(c.label, lang),
          n: mine.length,
          mine: mine.some((e) => e.mine),
        };
      });
      svg = barSvg(bars, { label: pick(f.label, lang), lang });
    }

    const tabNames = { dot: "viewDot", hist: "viewHist", scatter: "viewScatter", bar: "viewBar" };
    const tabs = h(
      "div",
      { class: "ci-tabs", role: "group", "aria-label": tr("graphTitle", lang) },
      kinds.map((k) =>
        h("button", {
          type: "button",
          class: "ci-tab",
          "aria-pressed": String(ui.chart === k),
          text: tr(tabNames[k], lang),
          onclick: () => {
            ui.chart = k;
            drawGraph();
          },
        }),
      ),
    );
    const varSelect = (id, labelKey, key, onlyOthers) => {
      const select = h(
        "select",
        {
          id,
          class: "ci-select",
          onchange: (e) => {
            ui.vars[key] = e.target.value;
            drawGraph();
          },
        },
        nums
          .filter((f) => !onlyOthers || f.id !== onlyOthers)
          .map((f) => h("option", { value: f.id, text: label(f) })),
      );
      select.value = ui.vars[key];
      return h(
        "div",
        { class: "ci-chooser" },
        h("label", { for: id, text: tr(labelKey, lang) }),
        select,
      );
    };
    const pickers = [];
    if ((ui.chart === "dot" || ui.chart === "hist") && nums.length > 1)
      pickers.push(varSelect("ci-var", "showVar", "one"));
    if (ui.chart === "scatter") {
      pickers.push(varSelect("ci-varx", "xVar", "x"), varSelect("ci-vary", "yVar", "y", ui.vars.x));
    }

    const box = h("div", { class: "ci-chartbox" });
    box.innerHTML = svg;
    els.graph.replaceChildren(
      h("section", { class: "ci-card", "aria-labelledby": "ci-graph-title" }, [
        h("h2", { id: "ci-graph-title", text: tr("graphTitle", lang) }),
        h("div", { class: "ci-row ci-wrapnarrow" }, [tabs, ...pickers]),
        box,
        h(
          "p",
          { class: "ci-small" },
          `${tr("legendMine", lang)}${ui.chart === "hist" ? ` · ${tr("histNote", lang)}` : ""}`,
        ),
        dataTable(fields, entries),
      ]),
    );
  }

  function dataTable(fields, entries) {
    const head = h("tr", {}, [
      h("th", { scope: "col", text: tr("tableDot", lang) }),
      ...fields.map((f) =>
        h("th", { scope: "col", text: `${label2(f)}${f.unit ? ` (${pick(f.unit, lang)})` : ""}` }),
      ),
      h("th", { scope: "col", text: tr("tableSource", lang) }),
    ]);
    const rows = entries.map((e, i) =>
      h("tr", {}, [
        h("th", { scope: "row", text: `${i + 1}${e.mine ? ` (${tr("you", lang)})` : ""}` }),
        ...fields.map((f) => {
          const v = e.v[f.id];
          const text =
            f.kind === "choice" ? pick(f.choices.find((c) => c.id === v)?.label, lang) : (v ?? "");
          return h("td", { text: String(text) });
        }),
        h("td", { text: tr(e.s === "home" ? "srcHome" : "srcClass", lang) }),
      ]),
    );
    return h("details", { class: "ci-table" }, [
      h("summary", { text: tr("tableToggle", lang) }),
      h(
        "div",
        { class: "ci-tablewrap" },
        h("table", {}, [h("thead", {}, head), h("tbody", {}, rows)]),
      ),
    ]);
  }
  const label2 = (f) => pick(f.short, lang);

  function drawTools(rebuild = true) {
    if (rebuild || !toolbox) {
      toolbox = buildToolbox({ lang, fields: viewFields(), entries: dataset, engine });
      els.tools.replaceChildren(toolbox.el);
    } else {
      toolbox.refresh();
    }
  }

  function drawTeacher() {
    els.teacher.replaceChildren(
      buildTeacherPanel({
        lang,
        store,
        client,
        engine,
        onChange: async () => {
          await loadClass();
          await loadData();
          drawAll(true);
        },
      }),
    );
  }

  /** Redraw everything. `dataOnly` keeps the open tool and the teacher panel untouched. */
  function drawAll(dataOnly = false) {
    drawHeader();
    drawStatus();
    drawJoin();
    drawInvest();
    drawGraph();
    if (dataOnly) {
      if (!els.form.contains(document.activeElement)) drawForm();
      drawTools(false);
    } else {
      drawForm();
      drawTools(true);
      drawTeacher();
    }
  }

  /* ── go ── */
  window.addEventListener("online", () => {
    ui.online = true;
    tick();
  });
  window.addEventListener("offline", () => {
    ui.online = false;
    drawStatus();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
  setInterval(() => {
    if (!document.hidden && store.mode === "class") tick();
  }, POLL_MS);

  drawAll();
  if (store.mode === "class") tick().then(() => drawAll());
}
