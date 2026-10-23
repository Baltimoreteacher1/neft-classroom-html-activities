// The Math Tool Drawer. It opens loaded with the problem the learner is working on (every tool at once, so
// switching tabs keeps their numbers), and a bar above the tools switches between "Use this problem" and
// "Try my own numbers". Reading the numbers is problem-numbers.js; drawing is drill-tools.js; this file holds
// the state and the clicks.
import { defaults, renderTool } from "./drill-tools.js";
import { t } from "./i18n.js";
import { answerStillHidden } from "./live-help.js";
import { drawerSeed } from "./problem-numbers.js";

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const DNL_PRESETS = {
  speed: { a: 35, b: 1, labelA: "Miles", labelB: "Hours" },
  cost: { a: 4.5, b: 1, labelA: "Dollars ($)", labelB: "Items" },
  percent: { a: 25, b: 25, labelA: "Part", labelB: "Percent (%)" },
  recipe: { a: 3, b: 2, labelA: "Cups Flour", labelB: "Cups Sugar" },
};

export function createDrillToolbox({ getState, longDivision }) {
  const box = {
    activeTool: "numberline",
    s: defaults(),
    mode: "free",
    syncedItem: null,
    availableTools: [],
    viewport: null,

    isLocked() {
      const { item, itemDone } = getState();
      return (
        this.mode === "problem" &&
        Boolean(this.syncedItem) &&
        this.syncedItem === item &&
        answerStillHidden(item, itemDone)
      );
    },

    applySeed(seed) {
      const s = (this.s = defaults());
      if (seed.nl) s.nl = { ...s.nl, ...seed.nl };
      if (seed.vertical) s.vertical = { op: seed.vertical.op, terms: seed.vertical.terms };
      if (seed.tenFrame != null) s.tenFrame = seed.tenFrame;
      else if (seed.problem?.kind === "binary") s.tenFrame = 0;
      if (seed.grid) s.mult = { row: seed.grid.rows, col: seed.grid.cols };
      if (seed.splitTarget) {
        const target = seed.splitTarget;
        const left = target > 10 ? Math.floor(target / 10) * 10 : Math.floor(target / 2);
        s.split = {
          target,
          left,
          right: target - left,
          times: Math.min(seed.problem.a, seed.problem.b),
        };
      }
      if (seed.division) s.div = { ...seed.division };
      if (seed.pizza)
        s.pizza = {
          slices: seed.pizza.slices,
          eaten: Array.from({ length: seed.pizza.shaded }, (_, i) => i),
        };
      if (seed.denominators) s.denominators = seed.denominators;
      if (seed.balance)
        s.balance = {
          lx: seed.balance.coeff,
          lc: seed.balance.constant,
          rv: seed.balance.rhs,
          rvText: "",
        };
      if (seed.integers) {
        const { pos, neg, next } = seed.integers;
        const value = next.value < 0 ? `(${next.value})`.replace("-", "−") : next.value;
        s.ints = {
          pos,
          neg,
          note:
            next.op === "+"
              ? t("Start with the first number. Now add {value}.", { value })
              : t("Start with the first number. Now take away {value}.", { value }),
        };
      }
      if (seed.rateLine) s.dnl = { step: 1, ...seed.rateLine };
      if (seed.tape)
        s.tape = {
          ...defaults().tape,
          a: seed.tape.a,
          b: seed.tape.b,
          labelA: "Part A",
          labelB: "Part B",
        };
    },

    /** Load the problem's own numbers into every tool; optionally jump to the tool that suits it. */
    syncFromProblem(item, { pickTool = true } = {}) {
      if (!item) return;
      const seed = drawerSeed(item);
      this.syncedItem = item;
      this.mode = "problem";
      this.availableTools = seed.tools || (seed.tool ? [seed.tool] : []);
      this.applySeed(seed);
      if (seed.tool && (pickTool || !this.availableTools.includes(this.activeTool)))
        this.activeTool = seed.tool;
    },

    /** A new problem was shown: load it, and redraw if the drawer is open. */
    onProblem(item) {
      this.syncFromProblem(item);
      this.refresh();
    },

    openTool(toolName, syncItem = null) {
      const drawer = document.querySelector("#drill-toolbox");
      if (!drawer) return;
      drawer.open = true;
      if (syncItem) this.syncFromProblem(syncItem, { pickTool: false });
      this.activeTool = toolName;
      if (this.mode === "problem" && !this.availableTools.includes(toolName))
        this.availableTools = [...this.availableTools, toolName];
      this.refresh();
      drawer.scrollIntoView({ behavior: "smooth", block: "center" });
    },

    refresh() {
      const drawer = document.querySelector("#drill-toolbox");
      const picker = drawer?.querySelector(".drill-tool-picker");
      picker?.setAttribute(
        "aria-label",
        t("Math tools for this problem"),
      );
      picker?.querySelectorAll(".tool-btn").forEach((btn) => {
        const selected = btn.dataset.tool === this.activeTool;
        btn.hidden = this.mode === "problem" && !this.availableTools.includes(btn.dataset.tool);
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-controls", "drill-tool-viewport");
        btn.setAttribute("aria-selected", String(selected));
        btn.tabIndex = selected ? 0 : -1;
        btn.classList.toggle("active", selected);
      });
      this.render(this.viewport || document.querySelector("#drill-tool-viewport"));
    },

    bar() {
      const item = this.syncedItem;
      if (!item) return "";
      const text = String(item.expr ?? item.question ?? "").replace(/\s*=\s*[?□].*$/, "").trim();
      if (!text) return "";
      const on = this.mode === "problem";
      return `<div class="tool-problem-bar"><span>${esc(t("Your problem"))}: <strong>${esc(text)}</strong></span>
        <button type="button" class="mini-tool-btn" data-use-problem aria-pressed="${on}">${esc(t("Use this problem"))}</button>
        <button type="button" class="mini-tool-btn" data-free-numbers aria-pressed="${!on}">${esc(t("Try my own numbers"))}</button></div>`;
    },

    render(container) {
      if (!container) return;
      this.viewport = container;
      const locked = this.isLocked();
      const html = renderTool(this.activeTool, this.s, {
        locked,
        longDivisionHtml: (dividend, divisor, hide) =>
          longDivision.renderHtml(dividend, divisor, { isSolver: false, hideAnswer: hide }),
      });
      container.innerHTML = this.bar() + html;
      if (this.activeTool === "longdivision")
        longDivision.wireEvents(container, this.s.div.dividend, this.s.div.divisor, null, {
          hideAnswer: locked,
        });
    },

    wire(container) {
      if (!container) return;
      container.addEventListener("click", (event) => {
        const hit = (selector) => event.target.closest(selector);
        const s = this.s;
        const done = () => {
          this.render(this.viewport);
          return true;
        };
        const tab = hit("[data-tool]");
        if (tab) {
          this.activeTool = tab.dataset.tool;
          return this.refresh();
        }
        if (hit("[data-use-problem]")) {
          this.syncFromProblem(this.syncedItem, { pickTool: false });
          return this.refresh();
        }
        if (hit("[data-free-numbers]")) {
          this.mode = "free";
          this.s = defaults();
          return this.refresh();
        }
        // Long division
        const preset = hit("[data-ld-preset]");
        if (preset) {
          const [dividend, divisor] = preset.dataset.ldPreset.split(":").map(Number);
          s.div = { dividend, divisor };
          return done();
        }
        if (hit("#ld-btn-load")) {
          s.div = {
            dividend: Math.max(1, Number(container.querySelector("#ld-in-dividend")?.value) || 432),
            divisor: Math.max(1, Number(container.querySelector("#ld-in-divisor")?.value) || 12),
          };
          return done();
        }
        // Number line (place a marker) and the column board
        if (hit("[data-nl-place]")) {
          const n = Number(container.querySelector("#nl-in")?.value);
          if (Number.isFinite(n)) s.nl.pos = n;
          return done();
        }
        const tick = hit(".nl-tick");
        if (tick) return ((s.nl.pos = Number(tick.dataset.val)), done());
        const vcOp = hit("[data-vc-op]");
        if (vcOp) return ((s.vertical.op = vcOp.dataset.vcOp), done());
        if (hit("[data-vc-set]")) {
          s.vertical.terms = [container.querySelector("#vc-in-a")?.value ?? "", container.querySelector("#vc-in-b")?.value ?? ""];
          return done();
        }
        // Ten frame
        if (hit("[data-tf-add]")) return ((s.tenFrame = Math.min(20, s.tenFrame + 1)), done());
        if (hit("[data-tf-sub]")) return ((s.tenFrame = Math.max(0, s.tenFrame - 1)), done());
        if (hit("[data-tf-clear]")) return ((s.tenFrame = 0), done());
        const slot = hit("[data-slot]");
        if (slot) {
          const i = Number(slot.dataset.slot);
          s.tenFrame = i + 1 === s.tenFrame ? i : i + 1;
          return done();
        }
        const cell = hit(".mg-cell");
        if (cell) {
          s.mult = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
          return done();
        }
        // Balance scale
        const b = s.balance;
        if (hit("[data-bal-add-x]"))
          return ((b.lx = Math.min(20, b.lx + 1)), (b.rvText = ""), done());
        if (hit("[data-bal-sub-x]"))
          return ((b.lx = Math.max(1, b.lx - 1)), (b.rvText = ""), done());
        if (hit("[data-bal-add-lc]"))
          return ((b.lc = Math.min(99, b.lc + 1)), (b.rvText = ""), done());
        if (hit("[data-bal-sub-lc]"))
          return ((b.lc = Math.max(-99, b.lc - 1)), (b.rvText = ""), done());
        if (hit("[data-bal-sub-both]")) {
          if (this.isLocked())
            b.rvText = `${b.rvText || b.rv} ${b.lc > 0 ? "−" : "+"} ${Math.abs(b.lc)}`;
          else b.rv -= b.lc;
          b.lc = 0;
          return done();
        }
        if (hit("[data-bal-div-both]")) {
          if (this.isLocked())
            b.rvText = b.rvText ? `(${b.rvText}) ÷ ${b.lx}` : `${b.rv} ÷ ${b.lx}`;
          else b.rv /= b.lx;
          b.lx = 1;
          return done();
        }
        if (hit("[data-bal-reset]")) {
          if (this.mode === "problem" && this.syncedItem)
            this.syncFromProblem(this.syncedItem, { pickTool: false });
          else s.balance = defaults().balance;
          return done();
        }
        // Integer chips
        const i = s.ints;
        if (hit("[data-int-add-pos]")) return ((i.pos = Math.min(15, i.pos + 1)), done());
        if (hit("[data-int-sub-pos]")) return ((i.pos = Math.max(0, i.pos - 1)), done());
        if (hit("[data-int-add-neg]")) return ((i.neg = Math.min(15, i.neg + 1)), done());
        if (hit("[data-int-sub-neg]")) return ((i.neg = Math.max(0, i.neg - 1)), done());
        if (hit("[data-int-add-pair]"))
          return ((i.pos = Math.min(15, i.pos + 1)), (i.neg = Math.min(15, i.neg + 1)), done());
        if (hit("[data-int-cancel-pairs]")) {
          const pairs = Math.min(i.pos, i.neg);
          i.pos -= pairs;
          i.neg -= pairs;
          return done();
        }
        if (hit("[data-int-clear]")) return ((i.pos = 0), (i.neg = 0), done());
        // Double number line
        const dnlTick = hit("[data-dnl-step]");
        if (dnlTick) return ((s.dnl.step = Number(dnlTick.dataset.dnlStep)), done());
        const dnlSet = hit("[data-dnl-set-step]");
        if (dnlSet) return ((s.dnl.step = Number(dnlSet.dataset.dnlSetStep)), done());
        const dnlPreset = hit("[data-dnl-preset]");
        if (dnlPreset) {
          s.dnl = { step: 2, ...DNL_PRESETS[dnlPreset.dataset.dnlPreset] };
          return done();
        }
        // Pizza
        const p = s.pizza;
        const slice = hit("[data-slice]");
        if (slice) {
          const n = Number(slice.dataset.slice);
          p.eaten = p.eaten.includes(n) ? p.eaten.filter((x) => x !== n) : [...p.eaten, n];
          return done();
        }
        const pizzaSet = hit("[data-pizza-set]");
        if (pizzaSet)
          return ((p.slices = Number(pizzaSet.dataset.pizzaSet)), (p.eaten = [0]), done());
        if (hit("[data-pizza-eat-one]")) {
          const next = Array.from({ length: p.slices }, (_, k) => k).find(
            (k) => !p.eaten.includes(k),
          );
          if (next !== undefined) p.eaten = [...p.eaten, next];
          return done();
        }
        if (hit("[data-pizza-reset]")) return ((p.eaten = []), done());
        // Splitter
        const sp = s.split;
        const splitPreset = hit("[data-split-preset]");
        if (splitPreset) {
          sp.target = Number(splitPreset.dataset.splitPreset);
          sp.left = Math.floor(sp.target / 2);
          sp.right = sp.target - sp.left;
          return done();
        }
        const splitMode = hit("[data-split-mode]");
        if (splitMode) {
          sp.left =
            splitMode.dataset.splitMode === "tens"
              ? sp.target - (sp.target % 10)
              : Math.floor(sp.target / 2);
          sp.right = sp.target - sp.left;
          return done();
        }
        // Tape diagram
        const tp = s.tape;
        const tapePreset = hit("[data-tape-preset]");
        if (tapePreset) {
          [tp.a, tp.b] = tapePreset.dataset.tapePreset.split(":").map(Number);
          return done();
        }
        const tapeMode = hit("[data-tape-mode]");
        if (tapeMode) return ((tp.mode = tapeMode.dataset.tapeMode), done());
        const tapeUnit = hit("[data-tape-unit]");
        if (tapeUnit) return ((tp.unit = Number(tapeUnit.dataset.tapeUnit)), done());
        if (hit("#tape-set-total"))
          return (
            (tp.total = Math.max(
              tp.a + tp.b,
              Number(container.querySelector("#tape-in-total")?.value) || 40,
            )),
            done()
          );
        if (hit("#tape-set-diff"))
          return (
            (tp.diff = Math.max(1, Number(container.querySelector("#tape-in-diff")?.value) || 4)),
            done()
          );
        return false;
      });

      container.addEventListener("keydown", (event) => {
        if (!event.target.matches?.(".tool-btn")) return;
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const tabs = [...container.querySelectorAll(".tool-btn:not([hidden])")];
        const index = tabs.indexOf(event.target);
        if (index < 0 || !tabs.length) return;
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next].click();
        tabs[next].focus();
      });

      container.addEventListener("input", (event) => {
        const slider = event.target.closest("[data-split-slider]");
        if (!slider) return;
        this.s.split.left = Number(slider.value);
        this.s.split.right = this.s.split.target - this.s.split.left;
        this.render(this.viewport);
      });
    },
  };
  return box;
}
