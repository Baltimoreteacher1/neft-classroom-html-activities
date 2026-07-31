// tool-drawer.js — point-of-use access to a lesson's interactive tools from
// INSIDE the lesson, without leaving it.
//
// The problem this solves: `?mode=tools` is a full-page takeover. Reaching a
// manipulative mid-lesson meant navigating away from the studio — abandoning the
// tab you were on, the problem you were mid-way through, and (in a small group)
// the table you had joined. So in practice the tools were a before/after resource
// and never a during-the-lesson one.
//
// The design, in one sentence: an additive chip at each natural point in the
// lesson opens the tools in a modal `<dialog>`, and closing it puts the student
// back exactly where they were.
//
// Non-interference guarantees — these are requirements, not side effects:
//   • ADDITIVE ONLY. Mounts after the studio renders and appends chips at the end
//     of existing panels. It never reorders, rewrites, or removes lesson content.
//   • NO STATE CONTACT. It never reads or writes the lesson store, never marks a
//     phase done, and never counts toward the progress meter. Opening a tool is
//     not progress and must not look like it.
//   • SEPARATE WIDGET INSTANCES. Cards are built from the config, so the copies
//     in the drawer are independent of any widget mounted in the lesson flow —
//     playing in the drawer cannot disturb an in-lesson model.
//   • NATIVE TOP LAYER. A `<dialog>` opened with showModal() renders in the top
//     layer, so it cannot lose a z-index fight with the annotation canvas or any
//     docked chrome, and it needs no fixed-position stacking of its own.
//   • REVERSIBLE FOCUS. Escape and the backdrop close it; focus returns to the
//     chip that opened it.
//
// Lazy by design: nothing is built until the first open, so a lesson nobody opens
// the drawer on pays only for one chip per point.

import { toolMeta } from "./tool-catalog.js";
import { buildToolCard, collectTools } from "./tools-mode.js";

const STYLE_ID = "nt-tool-drawer-style";
const CSS = `
.nt-toolpoint { margin: 18px 0 4px; padding: 12px 14px; border: 1px dashed #cdd9e5; border-radius: 14px; background: rgba(255,255,255,.72); display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.nt-toolpoint-label { font: 700 11px/1.3 var(--font-ui, system-ui, sans-serif); letter-spacing: .1em; text-transform: uppercase; color: var(--sg-deep, #0b2540); }
.nt-toolpoint-hint { font: 400 13px/1.4 var(--font-body, system-ui, sans-serif); color: #5f6f80; flex: 1 1 180px; min-width: 0; }
.nt-toolchip { display: inline-flex; align-items: center; gap: 7px; font: 700 14px/1 var(--font-ui, system-ui, sans-serif); padding: 10px 16px; border-radius: 999px; cursor: pointer; border: 1px solid var(--sg, #12355b); background: #fff; color: var(--sg-deep, #0b2540); }
.nt-toolchip:hover { background: var(--sg-soft, #eef2fa); }
.nt-toolchip:focus-visible { outline: 3px solid var(--sg-pop, #2f8f7d); outline-offset: 2px; }
dialog.nt-tool-dialog { width: min(940px, 96vw); max-width: 96vw; max-height: 92vh; padding: 0; border: 0; border-radius: 18px; background: #fff; color: var(--ink, #12355b); box-shadow: 0 24px 64px rgba(18,53,91,.32); overflow: hidden; }
dialog.nt-tool-dialog::backdrop { background: rgba(18,53,91,.48); }
.nt-tool-dialog-head { display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px 12px; border-bottom: 1px solid #e2ebf3; background: #f7fafd; position: sticky; top: 0; }
.nt-tool-dialog-head h2 { font: 800 20px/1.2 var(--font-display, "Outfit", system-ui, sans-serif); margin: 0; color: var(--ink, #12355b); }
.nt-tool-dialog-head p { font: 400 13px/1.45 var(--font-body, system-ui, sans-serif); margin: 4px 0 0; color: #5f6f80; max-width: 56ch; }
.nt-tool-dialog-close { margin-left: auto; flex: none; font: 700 15px/1 var(--font-ui, system-ui, sans-serif); border: 1px solid #cdd9e5; background: #fff; color: var(--ink, #12355b); border-radius: 999px; padding: 9px 15px; cursor: pointer; }
.nt-tool-dialog-close:hover { background: #eef4f9; }
.nt-tool-dialog-body { padding: 16px 20px 24px; overflow: auto; max-height: calc(92vh - 84px); display: grid; gap: 18px; }
.nt-tool-dialog-body .nt-tool-card { margin: 0; }
@media (max-width: 560px) {
  dialog.nt-tool-dialog { width: 100vw; max-width: 100vw; max-height: 100vh; border-radius: 0; }
  .nt-tool-dialog-body { max-height: calc(100vh - 92px); }
}
@media print { .nt-toolpoint { display: none !important; } }
`;

function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

// Which lesson sections' tools belong at which stop in the small-group sequence.
// `sections` is a PREFERENCE, not a filter: a tool is offered first where its
// lesson actually authored it, so the chip reads as "here is the model for THIS
// work" — but a stop whose sections authored nothing still offers the lesson's
// tools rather than going empty. Which section a config happens to hold a model in
// is an authoring detail; a student mid-practice needs the model either way.
const POINTS = [
  {
    tabId: "sg-tab-learn",
    sections: ["explore", "connect"],
    hint: "Open the model we just used and try it yourself.",
  },
  {
    tabId: "sg-tab-guided",
    sections: ["practice", "explore"],
    hint: "Stuck on a step? Work it out on the model first.",
  },
  {
    tabId: "sg-tab-practice",
    sections: ["practice"],
    hint: "Use the model to check your thinking before you answer.",
  },
  {
    tabId: "sg-tab-more",
    sections: ["launch", "reflect", "connect"],
    hint: "Build your own examples with the tools from this lesson.",
  },
];

/**
 * Shared modal for every tool chip on the page. One dialog, rendered lazily and
 * reused: cards are (re)built per open so a chip that offers two tools shows two,
 * and a student always gets a fresh model rather than someone else's leftovers.
 */
function createDrawer() {
  let dialog = null;
  let body = null;
  let lastTrigger = null;

  const build = () => {
    if (dialog?.isConnected) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "nt-tool-dialog";
    dialog.setAttribute("aria-labelledby", "nt-tool-dialog-title");
    dialog.innerHTML = `
      <div class="nt-tool-dialog-head">
        <div>
          <h2 id="nt-tool-dialog-title">Math Tools</h2>
          <p>Practice space — nothing here is graded, and your lesson stays exactly where you left it.</p>
        </div>
        <button type="button" class="nt-tool-dialog-close">Close</button>
      </div>
      <div class="nt-tool-dialog-body"></div>`;
    body = dialog.querySelector(".nt-tool-dialog-body");
    dialog.querySelector(".nt-tool-dialog-close").addEventListener("click", () => close());
    // Backdrop click closes, matching the vocabulary and info popups.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
    // Escape closes a modal dialog natively, firing `cancel` then `close` without
    // going through our close() — so teardown hangs off the event, not the button.
    dialog.addEventListener("close", teardown);
    document.body.appendChild(dialog);
    return dialog;
  };

  // Drop the widgets (a mounted manipulative should not keep running behind a
  // closed dialog) and hand focus back to whatever opened it. Idempotent, so it
  // is safe on both the native `close` event and the fallback path.
  function teardown() {
    if (body) body.innerHTML = "";
    const trigger = lastTrigger;
    lastTrigger = null;
    trigger?.focus?.();
  }

  const close = () => {
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close(); // fires `close` → teardown
      return;
    }
    // Environments without HTMLDialogElement (JSDOM, very old engines): no
    // `close` event to listen for, so tear down directly.
    dialog.removeAttribute("open");
    teardown();
  };

  /**
   * @param {Array<{v: object, section: string}>} tools tools to show
   * @param {HTMLElement|null} trigger element focus returns to on close
   * @param {string} heading dialog title
   */
  const open = (tools, trigger, heading) => {
    ensureStyles();
    build();
    lastTrigger = trigger || null;
    dialog.querySelector("#nt-tool-dialog-title").textContent = heading || "Math Tools";
    body.innerHTML = "";
    for (const tool of tools) {
      // No editor in the drawer: mid-lesson this is a student surface, and the
      // "change the numbers" authoring affordance belongs on the standalone
      // Interactive Tools page where a teacher is setting work up.
      body.appendChild(buildToolCard(tool, { showEditor: false }));
    }
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", ""); // JSDOM / very old engines
    body.scrollTop = 0;
    dialog.querySelector(".nt-tool-dialog-close")?.focus?.();
  };

  return {
    open,
    close,
    get element() {
      return dialog;
    },
  };
}

/** One chip row: the label, why it is here, and a button per offered tool. */
function buildPoint(tools, hint, drawer) {
  const row = document.createElement("div");
  row.className = "nt-toolpoint";
  const label = document.createElement("span");
  label.className = "nt-toolpoint-label";
  label.textContent = "🧰 Math tools";
  const hintNode = document.createElement("span");
  hintNode.className = "nt-toolpoint-hint";
  hintNode.textContent = hint;
  row.append(label, hintNode);

  // One chip per tool when there are few, a single "open all" chip when many, so
  // the row never turns into a wall of buttons inside a lesson step.
  if (tools.length > 2) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "nt-toolchip";
    chip.textContent = `Open ${tools.length} tools`;
    chip.addEventListener("click", () => drawer.open(tools, chip, "Math Tools"));
    row.appendChild(chip);
    return row;
  }
  for (const tool of tools) {
    const meta = toolMeta(tool.v);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "nt-toolchip";
    chip.textContent = `Open the ${meta.name}`;
    chip.addEventListener("click", () => drawer.open([tool], chip, meta.name));
    row.appendChild(chip);
  }
  return row;
}

/**
 * Mount point-of-use tool access into an already-rendered small-group studio.
 *
 * @param {object} config the lesson config (source of truth for the tools)
 * @param {{ panels?: Array<{id: string, panel: HTMLElement}>, hero?: HTMLElement|null }} opts
 *   `panels` are the studio's tab panels (id + element); `hero` gets the
 *   all-tools entry so the tools are reachable from the top of the lesson too.
 * @returns {{ points: number, drawer: object|null }} how many chip rows mounted
 */
export function mountToolDrawer(config, { panels = [], hero = null } = {}) {
  if (typeof document === "undefined") return { points: 0, drawer: null };
  const tools = collectTools(config);
  if (!tools.length) return { points: 0, drawer: null };

  ensureStyles();
  const drawer = createDrawer();
  const byId = new Map(panels.filter((p) => p?.id && p?.panel).map((p) => [p.id, p.panel]));
  let points = 0;

  for (const point of POINTS) {
    const panel = byId.get(point.tabId);
    if (!panel) continue;
    const preferred = tools.filter((t) => point.sections.includes(t.section));
    const forPoint = preferred.length ? preferred : tools;
    panel.appendChild(buildPoint(forPoint, point.hint, drawer));
    points += 1;
  }

  // Hero entry: every tool in the lesson, one tap from the top. Without it a
  // student on a tab whose sections authored no tool has no way in at all.
  if (hero) {
    const row = document.createElement("div");
    row.className = "nt-toolpoint";
    const label = document.createElement("span");
    label.className = "nt-toolpoint-label";
    label.textContent = "🧰 Math tools";
    const hint = document.createElement("span");
    hint.className = "nt-toolpoint-hint";
    hint.textContent =
      tools.length === 1
        ? "The hands-on model for this lesson, open any time."
        : `${tools.length} hands-on models for this lesson, open any time.`;
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "nt-toolchip";
    chip.textContent = tools.length === 1 ? "Open the tool" : "Open the tools";
    chip.addEventListener("click", () => drawer.open(tools, chip, "Math Tools"));
    row.append(label, hint, chip);
    hero.appendChild(row);
    points += 1;
  }

  return { points, drawer };
}

export default mountToolDrawer;
