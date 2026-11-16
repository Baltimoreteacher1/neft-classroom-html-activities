// Overlay surfaces for the Math Gaming Runtime shell: title, pause, settings,
// key bindings, level complete, the Time Machine, Reality Shift and the two
// reasoning prompts (prediction, explanation). All of them are native controls
// in the DOM over the stage, so they are keyboard- and screen-reader-operable
// by construction, and the simulation never advances while one is open.

import { el } from "./chrome.js";
import { ACTIONS, keyName } from "./input.js";
import { Multiverse, PRIME, SHIFTED } from "./multiverse.js";

const btn = (g, cls, key, onClick, attrs) =>
  el(`button${cls}`, { type: "button", on: { click: onClick }, ...attrs }, g.t(key));

// ---------- title ----------
export function openTitle(g) {
  g.mode = "title";
  g.$("hud").hidden = true;
  const hasSave = g.save.completed.length > 0 || g.save.checkpoint;
  const levels = el(
    "div.row.center",
    { role: "group", "aria-label": g.t("mapTitle") },
    g.def.levels.map((lv, i) => {
      const open = i <= g.save.unlocked || lv.lesson === g.lesson;
      const done = g.save.completed.includes(lv.id);
      return el(
        "button",
        {
          type: "button",
          "aria-pressed": String(i === g.levelIndex),
          disabled: !open,
          title: open ? "" : g.t("locked"),
          on: {
            click: () => {
              g.levelIndex = i;
              g.previewLevel(i);
              openTitle(g);
            },
          },
        },
        `${done ? "✓ " : ""}${i + 1}. ${g.tx(lv.title)}`,
      );
    }),
  );
  const cp = g.save.checkpoint;
  const block = el(
    "div.titleblock",
    null,
    el("h1", null, g.tx(g.def.title)),
    el("p", null, g.tx(g.def.tagline)),
    el(
      "div.row.center",
      null,
      cp && cp.level === g.levelIndex
        ? btn(g, ".primary", "continue", () => g.startLevel(g.levelIndex, cp), { id: "start" })
        : btn(g, ".primary", "start", () => g.startLevel(g.levelIndex), { id: "start" }),
      cp && cp.level === g.levelIndex
        ? btn(g, "", "restart", () => g.startLevel(g.levelIndex))
        : null,
      btn(g, "", "settings", () => openSettings(g, () => openTitle(g))),
      el(
        "button",
        {
          type: "button",
          lang: g.lang === "en" ? "es" : "en",
          "aria-label": g.t("langName"),
          on: {
            click: () => {
              g.setSetting("lang", g.lang === "en" ? "es" : "en");
              openTitle(g);
            },
          },
        },
        g.t("lang"),
      ),
    ),
    el("p.muted", null, g.t("calm")),
    hasSave || g.def.levels.length > 1 ? levels : null,
    el("p.muted", null, g.storageNote),
  );
  g.openVeil(block, "title");
}

// ---------- pause ----------
export function openPause(g) {
  const cp = g.save.checkpoint;
  g.openVeil(
    el(
      "div.card",
      { role: "dialog", "aria-modal": "true", "aria-label": g.t("paused") },
      el("h2", null, g.t("paused")),
      el(
        "div.stack",
        null,
        btn(g, ".primary", "resume", () => g.resume()),
        cp && cp.level === g.levelIndex
          ? btn(g, "", "checkpoint", () => g.startLevel(g.levelIndex, cp))
          : null,
        btn(g, "", "restart", () => g.startLevel(g.levelIndex)),
        btn(g, "", "timeMachine", () => openTimeline(g)),
        btn(g, "", "settings", () => openSettings(g, () => openPause(g))),
        btn(g, "", "mapTitle", () => openTitle(g)),
      ),
      el("p.muted", null, g.t("moveHint")),
      el("p.muted", null, g.t("calm")),
    ),
  );
}

// ---------- settings ----------
export function openSettings(g, back) {
  const range = (key) =>
    el(
      "label.field",
      null,
      g.t(key),
      el("input", {
        type: "range",
        min: 0,
        max: 1,
        step: 0.05,
        value: g.settings[key],
        "aria-label": g.t(key),
        on: {
          input: (e) => {
            g.audio.unlock();
            g.setSetting(key, Number(e.target.value));
            if (key === "sfx") g.audio.sfx("tick");
          },
        },
      }),
    );
  const check = (key, help) => {
    const input = el("input", {
      type: "checkbox",
      "aria-label": g.t(key),
      on: { change: (e) => g.setSetting(key, e.target.checked) },
    });
    input.checked = !!g.settings[key];
    return el(
      "label.field",
      null,
      el("span", null, g.t(key), help ? el("small.muted", null, ` ${g.t(help)}`) : null),
      input,
    );
  };
  g.openVeil(
    el(
      "div.card",
      { role: "dialog", "aria-modal": "true", "aria-label": g.t("settings") },
      el("h2", null, g.t("settings")),
      range("sfx"),
      range("music"),
      range("voice"),
      check("reduced"),
      check("lowfx"),
      check("contrast"),
      g.nextStop ? check("guide", "guideHelp") : null,
      el(
        "div.row",
        null,
        btn(g, "", "controls", () => openControls(g, back)),
        btn(g, ".primary", "back", back),
      ),
    ),
  );
}

function openControls(g, back) {
  const again = () => openControls(g, back);
  g.openVeil(
    el(
      "div.card",
      { role: "dialog", "aria-modal": "true", "aria-label": g.t("controls") },
      el("h2", null, g.t("controls")),
      el(
        "div.keys",
        null,
        ACTIONS.map((a) =>
          el(
            "button",
            {
              type: "button",
              on: {
                click: (e) => {
                  e.currentTarget.textContent = g.t("remap", { action: g.t(`a${a}`) });
                  const grab = (k) => {
                    k.preventDefault();
                    k.stopPropagation();
                    window.removeEventListener("keydown", grab, true);
                    if (k.code !== "Escape") {
                      g.input.rebind(a, k.code);
                      g.setSetting("keys", g.input.keys);
                    }
                    again();
                  };
                  window.addEventListener("keydown", grab, true);
                },
              },
            },
            `${g.t(`a${a}`)}: ${g.input.keys[a].map(keyName).join(" / ")}`,
          ),
        ),
      ),
      el(
        "div.row",
        null,
        btn(g, ".primary", "back", () => openSettings(g, back)),
      ),
    ),
  );
}

// ---------- level complete ----------
export function openComplete(g) {
  const s = g.evidence.summary();
  const last = g.levelIndex >= g.def.levels.length - 1;
  const line = (key, n) => (n > 0 ? el("p", null, g.t(key, { n })) : null);
  g.openVeil(
    el(
      "div.card",
      { role: "dialog", "aria-modal": "true", "aria-label": g.t("levelDone") },
      el("h2", null, `${g.t("levelDone")} · ${g.tx(g.level.title)}`),
      g.level.discovery ? el("p", null, g.tx(g.level.discovery)) : null,
      line("evDecisions", s.decisions),
      line("evRevised", s.revised),
      line("evPredict", s.predictions),
      line("evDemos", s.demonstrations),
      line("evTransfer", s.transferPassed),
      line("evExplain", s.explanations),
      line("evIndependent", s.independent),
      last ? el("p", null, g.t("allDone")) : null,
      el(
        "div.row",
        null,
        last
          ? btn(g, ".primary", "finish", () => openTitle(g))
          : btn(g, ".primary", "next", () => g.startLevel(g.levelIndex + 1)),
        btn(g, "", "replay", () => {
          g.closeVeil();
          startReplay(g, g.timeline.head, () => {
            g.mode = "done";
            openComplete(g);
          });
        }),
        btn(g, "", "replayLevel", () => g.startLevel(g.levelIndex)),
      ),
    ),
  );
}

// ---------- Time Machine ----------
const outcomeWord = (g, o) => g.t(o ? (o.ok ? "worked" : "failed") : "pending");

function nodeButton(g, node, firstFail, onPick) {
  const o = node.outcome;
  return el(
    `button.node${o ? (o.ok ? ".ok" : ".bad") : ""}${node.id === firstFail ? ".fail1" : ""}`,
    {
      type: "button",
      "aria-label": g.t("rewindTo", { label: g.tx(node.label) }),
      on: { click: () => onPick(node) },
    },
    g.tx(node.label),
    el("small", null, outcomeWord(g, o)),
    node.id === firstFail ? el("small", null, g.t("firstFail")) : null,
  );
}

export function openTimeline(g) {
  if (g.mode !== "play" && g.mode !== "pause") return;
  g.mode = "pause";
  g.support("time-machine");
  const tl = g.timeline;
  tl.close();
  const path = tl
    .path()
    .slice(1)
    .filter((id) => tl.nodes[id].kind !== "travel");
  const leaves = tl.leaves().filter((id) => id !== 0);
  const fail = tl.firstFailure();
  const rewind = (node) => {
    tl.rewindTo(node.id);
    g.subject.drain(g.events);
    g.events.length = 0;
    g.audio.sfx("rewind");
    g.sweep();
    g.resume();
    g.refreshHud();
    g.toast(g.t("rewound"));
    g.onRewind?.(node);
  };
  const others = leaves.filter((id) => id !== tl.head);
  g.openVeil(
    el(
      "div.card.wide",
      { role: "dialog", "aria-modal": "true", "aria-label": g.t("timeMachine") },
      el("h2", null, `↺ ${g.t("timeMachine")}`),
      path.length ? el("p.muted", null, g.t("timelineHelp")) : el("p", null, g.t("timelineEmpty")),
      path.length
        ? el(
            "div.track",
            null,
            path.map((id) => nodeButton(g, tl.nodes[id], fail, rewind)),
          )
        : null,
      others.length
        ? el(
            "div.paths",
            null,
            el("h3", null, g.t("compare")),
            others.map((leaf, i) =>
              el(
                "div.row",
                null,
                el(
                  "span",
                  null,
                  `${g.t("branch", { n: i + 1 })}: ${tl
                    .path(leaf)
                    .slice(1)
                    .map((id) => g.tx(tl.nodes[id].label))
                    .join(" → ")}`,
                ),
                btn(g, "", "compare", () => openCompare(g, tl.head, leaf)),
                btn(g, "", "replay", () => {
                  g.closeVeil();
                  startReplay(g, leaf);
                }),
              ),
            ),
          )
        : null,
      el(
        "div.row",
        null,
        btn(g, ".primary", "resume", () => g.resume()),
        path.length
          ? btn(g, "", "replay", () => {
              g.closeVeil();
              startReplay(g, tl.head);
            })
          : null,
      ),
    ),
  );
}

function openCompare(g, a, b) {
  const tl = g.timeline;
  const cmp = tl.compare(a, b);
  const column = (title, ids, leaf) =>
    el(
      "div",
      null,
      el("h3", null, title),
      ids.length
        ? ids.map((id) =>
            el("p", null, `${g.tx(tl.nodes[id].label)} — ${outcomeWord(g, tl.nodes[id].outcome)}`),
          )
        : el("p.muted", null, "—"),
      g.compareDetail ? el("p.muted", null, g.compareDetail(leaf)) : null,
    );
  g.openVeil(
    el(
      "div.card.wide",
      { role: "dialog", "aria-modal": "true", "aria-label": g.t("compare") },
      el("h2", null, g.t("compare")),
      cmp.shared.length > 1
        ? el(
            "p.muted",
            null,
            cmp.shared
              .slice(1)
              .map((id) => g.tx(tl.nodes[id].label))
              .join(" → "),
          )
        : null,
      el(
        "div.cmp",
        null,
        column(g.t("thisPath"), cmp.a, a),
        column(g.t("branch", { n: 1 }), cmp.b, b),
      ),
      el(
        "div.row",
        null,
        btn(g, ".primary", "back", () => openTimeline(g)),
      ),
    ),
  );
}

/** Play a recorded branch back, then hand control to `after` (default: the Time Machine). */
export function startReplay(g, leaf, after) {
  g.replayer = g.timeline.replay(leaf);
  g.replayAfter = after;
  g.mode = "replay";
  g.acc = 0;
  g.$("toast").hidden = false;
  g.$("toast").textContent = g.t("replaying");
  g.toastUntil = 0;
  const stop = el(
    "button.prompt",
    { type: "button", id: "stopReplay", on: { click: () => endReplay(g) } },
    g.t("stopReplay"),
  );
  g.$("frame").append(stop);
  stop.focus();
}

export function endReplay(g) {
  if (g.mode !== "replay") return;
  g.replayVerified = g.replayer.verify();
  g.replayer.end();
  g.replayer = null;
  g.shadowRoot.getElementById("stopReplay")?.remove();
  g.$("toast").hidden = true;
  g.subject.drain(g.events);
  g.events.length = 0;
  const after = g.replayAfter;
  g.replayAfter = null;
  if (after) return after();
  g.mode = "pause";
  openTimeline(g);
}

// ---------- Reality Shift ----------
export function openShift(g) {
  const mv = /** @type {Multiverse} */ (g.subject);
  if (!(mv instanceof Multiverse)) return;
  g.mode = "pause";
  const body = el("div.stack");
  const view = mv.investigate();
  const rows = (list) =>
    list.map((r) =>
      el(
        "tr",
        null,
        el("th", { scope: "row" }, g.measureLabel ? g.measureLabel(r.key) : r.key),
        el("td", null, g.fmt ? g.fmt(r.key, r.prime) : String(r.prime)),
        el("td", null, g.fmt ? g.fmt(r.key, r.shifted) : String(r.shifted)),
      ),
    );
  if (mv.shifted) {
    body.append(
      el(
        "table",
        null,
        el(
          "thead",
          null,
          el(
            "tr",
            null,
            el("th", null, ""),
            el("th", { scope: "col" }, g.t("realityA")),
            el("th", { scope: "col" }, g.t("realityB")),
          ),
        ),
        el(
          "tbody",
          null,
          el("tr", null, el("th", { colspan: 3 }, g.t("changed"))),
          rows(view.changed),
          el("tr", null, el("th", { colspan: 3 }, g.t("invariant"))),
          rows(view.invariant),
        ),
      ),
    );
    if (g.drawInvestigation) {
      const c = el("canvas", {
        width: 680,
        height: 220,
        role: "img",
        "aria-label": g.t("investigate"),
      });
      c.style.cssText = "width:100%;height:auto;border-radius:12px";
      g.drawInvestigation(c.getContext("2d"), mv, 680, 220);
      body.append(c);
    }
    body.append(
      el(
        "div.row",
        null,
        btn(g, ".gold", "shiftSwitch", () => {
          g.decide(
            "switch",
            { en: "Switched reality", es: "Cambió de realidad" },
            { type: "switch", reality: mv.active === PRIME ? SHIFTED : PRIME },
            { mechanic: "reality-shift" },
          );
          g.subject.drain(g.events);
          for (const e of g.events) g.handle(e);
          g.events.length = 0;
          g.resume();
        }),
        btn(g, "", "shiftClose", () => {
          g.decide(
            "collapse",
            { en: "Closed the second reality", es: "Cerró la segunda realidad" },
            { type: "collapse" },
            { mechanic: "reality-shift" },
          );
          g.subject.drain(g.events);
          g.events.length = 0;
          g.refreshHud();
          g.resume();
        }),
      ),
    );
  }
  // The game supplies the one condition that may be changed here.
  g.buildShift?.(body, mv, (change, label) => {
    g.decide(
      "shift",
      label,
      { type: "shift", change },
      { mechanic: "reality-shift", detail: change },
    );
    g.subject.drain(g.events);
    for (const e of g.events) g.handle(e);
    g.events.length = 0;
    g.resume();
  });
  g.openVeil(
    el(
      "div.card.wide",
      { role: "dialog", "aria-modal": "true", "aria-label": g.t("shift") },
      el("h2", null, `◈ ${g.t("shift")}`),
      body,
      el(
        "div.row",
        null,
        btn(g, ".primary", "resume", () => g.resume()),
      ),
    ),
  );
}

// ---------- reasoning prompts ----------
/**
 * @param {{prompt: string, options: Array<{label: string, value: any}>, mechanic: string, expectOk?: (value: any) => boolean}} o
 * @returns {Promise<any>} the chosen value
 */
export function openPredict(g, o) {
  return new Promise((resolve) => {
    g.openPanel(g.t("predict"), (body) => {
      body.append(
        el("p.note", null, o.prompt),
        el(
          "div.chips",
          null,
          o.options.map((opt) =>
            el(
              "button",
              {
                type: "button",
                on: {
                  click: () => {
                    g.prediction = {
                      mechanic: o.mechanic,
                      choice: opt.value,
                      expectOk: o.expectOk ? o.expectOk(opt.value) : true,
                    };
                    g.toast(g.t("predictLocked"));
                    g.closePanel();
                    resolve(opt.value);
                  },
                },
              },
              opt.label,
            ),
          ),
        ),
      );
    });
  });
}

/**
 * A short explanation tied to something that just changed. It is recorded as
 * reasoning evidence for the teacher to read; it is never auto-scored as right
 * or wrong and never blocks play.
 * @param {{prompt: string, frames?: string[], mechanic: string}} o
 */
export function openExplain(g, o) {
  return new Promise((resolve) => {
    g.openPanel(g.t("explain"), (body) => {
      const area = el("textarea", { "aria-label": o.prompt, maxlength: 280 });
      const done = (text) => {
        if (text)
          g.evidence.record({
            level: g.level.id,
            lesson: g.level.lesson,
            mechanic: o.mechanic,
            strand: "reasoning",
            detail: { kind: "explanation", text, frame: frameUsed },
          });
        if (frameUsed) g.support("sentence-frame");
        g.persist();
        g.closePanel();
        resolve(text);
      };
      let frameUsed = false;
      body.append(
        el("p.note", null, o.prompt),
        el("p.muted", null, g.t("explainHelp")),
        o.frames?.length
          ? el(
              "div.chips",
              null,
              o.frames.map((f) =>
                el(
                  "button",
                  {
                    type: "button",
                    on: {
                      click: () => {
                        frameUsed = true;
                        area.value = `${f} `;
                        area.focus();
                      },
                    },
                  },
                  f,
                ),
              ),
            )
          : null,
        area,
        el(
          "div.row",
          null,
          btn(g, ".primary", "explainSave", () => done(area.value.trim())),
          btn(g, ".ghost", "explainSkip", () => done("")),
        ),
      );
    });
  });
}
