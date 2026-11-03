// Assessment canvas: split-pane stimulus | question, question navigation, timer, review and results.
// Drives an AssessmentSession; every state change goes through the session, so a reload restores exactly what was on screen.
import { fmtClock, h } from "./dom.js";
import { FEEDBACK_NOTICE, observeWriting } from "../feedback/writing-feedback.js";
import { distractorNote, isObjective, scoreItem, wordCount } from "./scoring.js";
import { instruction, renderQuestion } from "./renderers.js";
import { TIERS } from "./session.js";
import { ACCESS_Toolbar } from "./toolbar.js";

const fmt = (ms) => fmtClock(ms / 1000);
const STATUS_TEXT = { correct: "Correct", incorrect: "Not yet", "needs-review": "Needs teacher review", unanswered: "No answer" };

export class AssessmentCanvas {
  /**
   * @param {HTMLElement} root
   * @param {import("./session.js").AssessmentSession} session
   * @param {object} deps
   * @param {(snapshot: object) => void} [deps.save]    persist { session, tools, prefs }
   * @param {object} [deps.prefs]                        saved UI preferences (zoom, split, timerHidden, ...)
   * @param {object} [deps.tools]                        saved toolbar state
   * @param {Record<string, (stim: object, ctx: object) => HTMLElement>} [deps.stimulusRenderers]
   * @param {(result: object) => void} [deps.onSubmit]
   * @param {(href: string) => void} [deps.onExit]
   */
  constructor(root, session, deps = {}) {
    this.root = root;
    this.doc = root.ownerDocument;
    this.session = session;
    this.deps = deps;
    this.prefs = { split: 52, timerHidden: false, ...(deps.prefs || {}) };
    this.toolState = deps.tools || session.tools || { highlights: {}, eliminated: {}, marks: [] };
    session.tools = this.toolState;
    session.onToolsChange = () => this.save();
    this.view = session.status === "submitted" ? "results" : "question";
    this.response = null; // live renderer handle
    this.timer = null;
    this.warned = new Set();
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────
  mount() {
    const d = this.doc;
    this.root.replaceChildren();
    this.canvas = h(d, "section", { class: "acc-canvas", id: "accCanvas", "data-mode": this.session.mode, "aria-labelledby": "accCanvasTitle" });
    this.live = h(d, "div", { class: "acc-visually-hidden", role: "status", "aria-live": "polite", id: "accLive" });
    this.head = h(d, "header", { class: "acc-canvas-head" });
    this.toolHost = h(d, "div", { class: "acc-toolbar-host" });
    this.body = h(d, "div", { class: "acc-canvas-body" });
    this.canvas.append(this.head, this.toolHost, this.body, this.live);
    this.root.append(this.canvas);
    this.toolbar = new ACCESS_Toolbar({
      host: this.canvas,
      getScopes: () => this.scopes(),
      getLineHost: () => this.stimWrap || null,
      state: this.toolState,
      prefs: this.deps.prefs?.toolbar,
      onPrefs: (p) => this.savePrefs({ toolbar: p }),
      onState: () => this.save(),
      announce: (m) => this.say(m),
      markControl: () => ({ marked: this.session.marked.has(this.session.current.id), toggle: () => this.toggleMark() }),
      stimulusKey: () => this.session.current.stimulus || this.session.current.id,
    });
    // On phones the tools fold into a disclosure so the passage starts on the first screen; on larger screens they stay open.
    const details = h(d, "details", { class: "acc-tools-details" }, h(d, "summary", { text: "Tools: highlighter, line reader, text size, cross-out" }), this.toolbar.render());
    details.open = !this.doc.defaultView.matchMedia?.("(max-width: 40rem)").matches;
    this.toolHost.append(details);
    this.startTimer();
    this.draw();
    return this;
  }
  destroy() {
    this.response?.destroy?.();
    clearInterval(this.timer);
    this.toolbar?.destroy();
    this.root.replaceChildren();
  }
  say(msg) {
    this.live.textContent = "";
    queueMicrotask(() => {
      this.live.textContent = msg;
    });
  }
  snapshot() {
    return { session: this.session.serialize(), tools: this.toolState, prefs: this.prefs };
  }
  save() {
    this.deps.save?.(this.snapshot());
  }
  savePrefs(p) {
    this.prefs = { ...this.prefs, ...p };
    this.save();
  }

  // ── timer ─────────────────────────────────────────────────────────────────
  startTimer() {
    if (this.session.config.minutes == null) return;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.onTick(), 1000);
  }
  onTick() {
    const s = this.session;
    if (s.status !== "active") return;
    const left = s.remainingMs();
    if (this.timerEl && !this.prefs.timerHidden) this.timerEl.textContent = fmt(left);
    for (const m of [10, 5, 1]) if (left <= m * 60000 && !this.warned.has(m) && left > 0 && s.config.minutes > m) {
      this.warned.add(m);
      this.say(`${m} ${m === 1 ? "minute" : "minutes"} remaining.`);
    }
    if (s.tick()) {
      this.say("Time is up. Your answers were submitted.");
      this.finish(true);
    }
  }

  // ── drawing ───────────────────────────────────────────────────────────────
  draw() {
    this.drawHead();
    if (this.view === "review") return this.drawReview();
    if (this.view === "results") return this.drawResults();
    this.drawQuestion();
  }
  drawHead() {
    const d = this.doc;
    const s = this.session;
    const bits = [h(d, "p", { class: "acc-canvas-title", id: "accCanvasTitle", "data-i18n-skip": "", text: s.set.title }), h(d, "span", { class: `acc-badge is-${s.mode}`, text: s.mode === "summative" ? "Test simulation" : "Learning mode" })];
    if (this.view === "question") {
      const sum = s.summary();
      bits.push(h(d, "span", { class: "acc-progress", text: `Question ${s.index + 1} of ${s.items.length} · ${sum.answered} answered` }));
      bits.push(h(d, "progress", { class: "acc-bar", max: String(s.items.length), value: String(sum.answered), "aria-label": "Questions answered" }));
    }
    if (s.config.minutes != null && !s.locked) {
      this.timerEl = h(d, "span", { class: "acc-timer", "aria-hidden": "true", text: this.prefs.timerHidden ? "Timer hidden" : fmt(s.remainingMs()) });
      const toggle = h(d, "button", { type: "button", class: "acc-btn acc-timer-toggle", "aria-pressed": String(!this.prefs.timerHidden), text: this.prefs.timerHidden ? "Show timer" : "Hide timer" });
      toggle.addEventListener("click", () => {
        this.savePrefs({ timerHidden: !this.prefs.timerHidden });
        this.drawHead();
      });
      bits.push(this.timerEl, toggle);
    }
    this.head.replaceChildren(...bits);
  }

  // stimulus ----------------------------------------------------------------
  stimulusFor(item) {
    return item.stimulus ? this.session.set.stimuli?.find((x) => x.id === item.stimulus) : null;
  }
  scopes() {
    const out = {};
    for (const el of this.stimScroll?.querySelectorAll("[data-scope]") || []) out[el.dataset.scope] = el;
    return out;
  }
  renderStimulus(item) {
    const d = this.doc;
    const stim = this.stimulusFor(item);
    const wrap = h(d, "div", { class: "acc-stim-wrap" });
    const scroll = h(d, "div", { class: "acc-stim-scroll", tabindex: "0", role: "region", "aria-label": stim ? `${stim.title || "Passage"}` : "Directions" });
    wrap.append(scroll);
    this.stimWrap = wrap;
    this.stimScroll = scroll;
    if (!stim) {
      scroll.append(h(d, "p", { class: "acc-empty", text: "This question has no passage. Read the question on the right." }));
      return wrap;
    }
    scroll.append(h(d, "h2", { class: "acc-stim-title", text: stim.title || "" }));
    if (stim.kind === "passage") {
      stim.paragraphs.forEach((text, i) =>
        scroll.append(h(d, "p", { class: "acc-para" }, h(d, "span", { class: "acc-pnum", "aria-label": `Paragraph ${i + 1}`, text: String(i + 1) }), h(d, "span", { class: "acc-ptext", "data-scope": `${stim.id}:p${i + 1}`, text }))),
      );
    } else if (stim.kind === "image") {
      scroll.append(h(d, "figure", { class: "acc-figure" }, h(d, "img", { src: stim.src, alt: stim.alt }), stim.caption ? h(d, "figcaption", { text: stim.caption }) : null));
    } else if (stim.kind === "table") {
      scroll.append(
        h(d, "table", { class: "acc-table" }, h(d, "caption", { text: stim.caption || stim.title || "" }), h(d, "thead", {}, h(d, "tr", {}, ...stim.columns.map((c) => h(d, "th", { scope: "col", text: c })))), h(d, "tbody", {}, ...stim.rows.map((r) => h(d, "tr", {}, ...r.map((c, i) => h(d, i === 0 ? "th" : "td", i === 0 ? { scope: "row", text: String(c) } : { text: String(c) })))))),
      );
    } else if (stim.kind === "audio") {
      const custom = this.deps.stimulusRenderers?.audio;
      if (custom) scroll.append(custom(stim, { doc: d, session: this.session, item, announce: (m) => this.say(m), mode: this.session.mode }));
      else scroll.append(h(d, "p", { class: "acc-hint", text: "Audio playback is not available in this view." }), stim.transcript !== false && this.session.mode === "formative" ? h(d, "details", {}, h(d, "summary", { text: "Show the transcript" }), h(d, "p", { text: stim.script })) : null);
    } else {
      for (const t of stim.paragraphs || [stim.text]) scroll.append(h(d, "p", { class: "acc-prompt-text", text: t }));
    }
    return wrap;
  }

  // question ----------------------------------------------------------------
  drawQuestion() {
    this.response?.destroy?.();
    this.response = null;
    const d = this.doc;
    const s = this.session;
    const item = s.current;
    const split = h(d, "div", { class: "acc-split", style: `--acc-split:${this.prefs.split}%` });
    const stimPane = h(d, "section", { class: "acc-stim", "aria-label": "Passage and materials" }, this.renderStimulus(item));
    const sep = h(d, "div", { class: "acc-resizer", role: "separator", tabindex: "0", "aria-orientation": "vertical", "aria-label": "Resize passage and question panels. Use the Left and Right arrow keys.", "aria-valuemin": "25", "aria-valuemax": "75", "aria-valuenow": String(this.prefs.split) });
    this.bindResizer(sep, split);
    const qpane = h(d, "section", { class: "acc-qpane", "aria-label": "Question" }, this.renderNav(), this.renderQuestionBody(item));
    split.append(stimPane, sep, qpane);
    this.body.replaceChildren(split);
    this.toolbar.refresh();
    this.toolbar.syncMark();
  }
  bindResizer(sep, split) {
    const set = (v) => {
      const val = Math.min(75, Math.max(25, v));
      split.style.setProperty("--acc-split", `${val}%`);
      sep.setAttribute("aria-valuenow", String(Math.round(val)));
      this.prefs.split = val;
    };
    sep.addEventListener("keydown", (e) => {
      const step = { ArrowLeft: -5, ArrowRight: 5 }[e.key];
      if (step === undefined) return;
      set(this.prefs.split + step);
      this.savePrefs({});
      e.preventDefault();
    });
    sep.addEventListener("pointerdown", (e) => {
      sep.setPointerCapture?.(e.pointerId);
      const rect = split.getBoundingClientRect();
      const move = (m) => set(((m.clientX - rect.left) / rect.width) * 100);
      const up = () => {
        sep.removeEventListener("pointermove", move);
        sep.removeEventListener("pointerup", up);
        this.savePrefs({});
      };
      sep.addEventListener("pointermove", move);
      sep.addEventListener("pointerup", up);
    });
  }
  renderNav() {
    const d = this.doc;
    const s = this.session;
    const nav = h(d, "nav", { class: "acc-qnav", "aria-label": "Question navigation" });
    const ol = h(d, "ol", { class: "acc-qnav-list" });
    for (const row of s.summary().rows) {
      const here = row.number - 1 === s.index;
      const state = [row.answered ? "answered" : "not answered", row.marked ? "marked for review" : ""].filter(Boolean).join(", ");
      const b = h(d, "button", { type: "button", class: `acc-qdot${row.answered ? " is-answered" : ""}${row.marked ? " is-marked" : ""}${here ? " is-current" : ""}`, "aria-label": `Question ${row.number}, ${state}`, "aria-current": here ? "step" : undefined, disabled: s.config.navigation === "forward-only" && row.number - 1 < s.index }, h(d, "span", { text: String(row.number) }));
      b.addEventListener("click", () => this.goto(row.number - 1));
      ol.append(h(d, "li", {}, b));
    }
    nav.append(ol);
    return nav;
  }
  goto(i) {
    if (!this.session.goto(i)) return;
    this.view = "question";
    this.save();
    this.draw();
    this.focusQuestion();
  }
  focusQuestion() {
    const t = this.body.querySelector(".acc-stem");
    t?.focus();
    this.say(`Question ${this.session.index + 1} of ${this.session.items.length}.`);
  }

  renderQuestionBody(item) {
    const d = this.doc;
    const s = this.session;
    const prefix = `q-${item.id}`;
    const awaiting = s.mode === "formative" && s.awaitingRevision(item.id);
    const locked = s.locked || awaiting;
    const meta = [item.domain, item.klu].filter(Boolean).join(" · ");
    const box = h(d, "div", { class: "acc-q" });
    if (meta) box.append(h(d, "p", { class: "acc-q-meta", text: meta }));
    box.append(h(d, "h2", { class: "acc-stem", id: `${prefix}-stem`, tabindex: "-1", text: item.stem }), h(d, "p", { class: "acc-instruction", text: instruction(item) }));
    const handle = renderQuestion(item, {
      doc: d,
      prefix,
      response: s.responses[item.id],
      readOnly: locked,
      mode: s.mode,
      session: s,
      toolbar: this.toolbar,
      announce: (m) => this.say(m),
      onChange: (value) => {
        s.setResponse(item.id, value);
        this.save();
        this.refreshChrome(item);
      },
    });
    this.response = handle;
    box.append(handle.el);
    if (s.mode === "formative") box.append(this.renderFormative(item));
    box.append(this.renderActions(item));
    return box;
  }
  refreshChrome(item) {
    // Update only the parts that depend on whether the item is answered; never re-render the response control.
    this.drawHead();
    const nav = this.body.querySelector(".acc-qnav");
    nav?.replaceWith(this.renderNav());
    const check = this.body.querySelector("[data-act=check]");
    if (check) check.disabled = !this.session.answered(item.id);
  }

  // formative ---------------------------------------------------------------
  renderFormative(item) {
    const d = this.doc;
    const s = this.session;
    const wrap = h(d, "div", { class: "acc-formative", "data-formative": "true" });
    const attempts = s.attemptList(item.id);
    const last = attempts[attempts.length - 1];
    if (last && s.awaitingRevision(item.id)) wrap.append(this.renderFeedback(item, last));
    // support ladder
    const ladder = h(d, "div", { class: "acc-ladder", role: "group", "aria-label": "Support" });
    const ever = s.tierEver(item.id);
    for (const t of TIERS) {
      if (!item.support?.[t.key]) continue;
      const open = (s.supports[item.id] || []).some((x) => x.tier === t.tier);
      const unlocked = t.tier <= ever + 1;
      const b = h(d, "button", { type: "button", class: "acc-btn acc-tier", "data-support-tier": String(t.tier), "aria-pressed": String(open), "aria-disabled": unlocked ? undefined : "true", text: `${t.tier}. ${t.label}` });
      b.addEventListener("click", () => {
        // Decided at click time: opening support 1 unlocks support 2 without redrawing the page.
        if (t.tier > s.tierEver(item.id) + 1) return this.say(`Open support ${t.tier - 1} first.`);
        const got = s.requestSupport(item.id, t.tier);
        if (!got) return;
        this.save();
        this.showSupport(wrap, got);
        b.setAttribute("aria-pressed", "true");
        this.drawLadderState();
      });
      ladder.append(b);
    }
    this.ladder = ladder;
    wrap.append(ladder);
    this.supportBox = h(d, "div", { class: "acc-support", role: "region", "aria-label": "Support content", "aria-live": "polite" });
    wrap.append(this.supportBox);
    for (const sup of s.supports[item.id] || []) {
      if (sup.attempt === s.attemptNo(item.id) || s.awaitingRevision(item.id)) {
        const def = TIERS.find((t) => t.tier === sup.tier);
        this.supportBox.append(this.supportCard({ tier: sup.tier, label: def.label, content: item.support[def.key] }));
      }
    }
    return wrap;
  }
  drawLadderState() {
    const ever = this.session.tierEver(this.session.current.id);
    for (const b of this.ladder.querySelectorAll("[data-support-tier]")) b.toggleAttribute("aria-disabled", Number(b.dataset.supportTier) > ever + 1);
  }
  supportCard(got) {
    const d = this.doc;
    const card = h(d, "div", { class: `acc-support-card tier-${got.tier}` }, h(d, "h3", { text: got.label }));
    const paras = String(got.content).split("\n\n");
    for (const p of paras) card.append(h(d, "p", { text: p }));
    return card;
  }
  showSupport(wrap, got) {
    this.supportBox.querySelector(`.tier-${got.tier}`)?.remove();
    this.supportBox.append(this.supportCard(got));
    this.say(`${got.label} opened.`);
  }
  renderFeedback(item, attempt) {
    const d = this.doc;
    const s = this.session;
    const score = scoreItem(item, attempt.response);
    const independent = attempt.n === 1 && attempt.tier === 0;
    let title;
    let authored = ""; // the item's own explanation or distractor note: content, stays in English
    let generic = ""; // interface guidance: translated
    if (score.status === "correct") {
      title = independent ? "Correct on your own." : attempt.tier > 0 ? "Correct, with support." : "Correct after revising.";
      authored = item.explanation || "";
    } else if (score.status === "needs-review") {
      title = "Saved for teacher review.";
      generic = "This response is not scored by the lab. Use the checklist, then revise or move on.";
    } else {
      title = "Not yet.";
      authored = distractorNote(item, attempt.response) || "";
      if (score.detail) generic = `${Object.values(score.detail).filter(Boolean).length} of ${Object.values(score.detail).length} parts are correct.`;
      else if (!authored) generic = "Look again at the evidence, open a support, then revise.";
    }
    const el = h(d, "div", { class: `acc-feedback is-${score.status}`, role: "status" }, h(d, "p", { class: "acc-feedback-title", text: title }), authored ? h(d, "p", { "data-i18n-skip": "", text: authored }) : null, generic ? h(d, "p", { text: generic }) : null);
    const c = item.constructed?.checklist || item.speaking?.checklist;
    if (c) {
      // Self-check: the learner ticks what they can honestly say about their own response. Ticks are saved and counted as evidence of reflection, never as a score.
      const saved = (this.toolState.selfCheck ||= {})[item.id] || [];
      el.append(
        h(d, "p", { class: "acc-hint", text: "Check your own response. Tick what is true." }),
        h(d, "ul", { class: "acc-checklist" }, ...c.map((x, i) => {
          const box = h(d, "input", { type: "checkbox", id: `${this.prefix || "q"}-sc-${item.id}-${i}` });
          box.checked = saved.includes(i);
          box.addEventListener("change", () => {
            const cur = new Set(this.toolState.selfCheck[item.id] || []);
            box.checked ? cur.add(i) : cur.delete(i);
            this.toolState.selfCheck[item.id] = [...cur].sort((a, b) => a - b);
            this.save();
          });
          return h(d, "li", {}, h(d, "label", { for: box.id }, box, h(d, "span", { text: ` ${x}` })));
        })),
      );
    }
    if (item.type === "constructed-response" && score.status === "needs-review") {
      const stim = s.set.stimuli?.find((z) => z.id === item.stimulus);
      const stimText = [...(stim?.paragraphs || []), ...(stim?.rows || []).flat(), ...(stim?.columns || [])].join(" ");
      const obs = observeWriting(attempt.response, item, stimText);
      el.append(
        h(d, "div", { class: "acc-writing-feedback", "data-evidence": "rule-based" },
          h(d, "p", { class: "acc-feedback-title", text: "What the lab counted" }),
          h(d, "ul", {}, ...obs.observations.map((t) => h(d, "li", { text: t }))),
          obs.nextMoves.length ? h(d, "p", { class: "acc-feedback-title", text: "Try next" }) : null,
          obs.nextMoves.length ? h(d, "ul", {}, ...obs.nextMoves.map((t) => h(d, "li", { text: t }))) : null,
          h(d, "p", { class: "acc-hint", text: FEEDBACK_NOTICE }),
        ),
      );
    }
    if (score.status !== "correct" && s.attemptList(item.id).length >= s.config.maxAttempts) el.append(h(d, "p", { class: "acc-hint", text: "That was your last attempt on this question. Move on, and try a similar one later." }));
    return el;
  }

  // actions -----------------------------------------------------------------
  renderActions(item) {
    const d = this.doc;
    const s = this.session;
    const row = h(d, "div", { class: "acc-actions" });
    const back = h(d, "button", { type: "button", class: "acc-btn", "data-act": "prev", text: "Back", disabled: s.index === 0 || s.config.navigation === "forward-only" });
    back.addEventListener("click", () => this.goto(s.index - 1));
    row.append(back);
    if (s.mode === "formative" && !s.locked) {
      const awaiting = s.awaitingRevision(item.id);
      const canRevise = awaiting && s.attemptList(item.id).length < s.config.maxAttempts && s.attemptList(item.id).at(-1).correct !== true;
      if (!awaiting) {
        const check = h(d, "button", { type: "button", class: "acc-btn primary", "data-act": "check", text: "Check my answer", disabled: !s.answered(item.id) });
        check.addEventListener("click", () => {
          if (!s.check(item.id)) return;
          this.save();
          this.draw();
          this.body.querySelector(".acc-feedback")?.scrollIntoView?.({ block: "nearest" });
          this.say(this.body.querySelector(".acc-feedback-title")?.textContent || "Checked.");
        });
        row.append(check);
      } else if (canRevise) {
        const rev = h(d, "button", { type: "button", class: "acc-btn primary", "data-act": "revise", text: "Revise and try again" });
        rev.addEventListener("click", () => {
          if (!s.newAttempt(item.id)) return;
          this.save();
          this.draw();
          this.response.focus();
          this.say(`Attempt ${s.attemptNo(item.id)}. Your last answer was cleared.`);
        });
        row.append(rev);
      }
    }
    const last = s.index === s.items.length - 1;
    const next = h(d, "button", { type: "button", class: `acc-btn${last ? "" : " primary"}`, "data-act": last ? "review" : "next", text: last ? "Review answers" : "Next" });
    next.addEventListener("click", () => (last ? this.openReview() : this.goto(s.index + 1)));
    row.append(next);
    if (!last) {
      const rv = h(d, "button", { type: "button", class: "acc-btn", "data-act": "review", text: "Review all" });
      rv.addEventListener("click", () => this.openReview());
      row.append(rv);
    }
    return row;
  }
  toggleMark() {
    const s = this.session;
    const id = s.current.id;
    s.mark(id, !s.marked.has(id));
    this.save();
    this.refreshChrome(s.current);
  }

  // review ------------------------------------------------------------------
  openReview() {
    this.view = "review";
    this.save();
    this.draw();
    this.body.querySelector(".acc-review-title")?.focus();
  }
  drawReview() {
    const d = this.doc;
    const s = this.session;
    const sum = s.summary();
    const rows = sum.rows.map((r) => {
      const go = h(d, "button", { type: "button", class: "acc-btn", "aria-label": `Go to question ${r.number}`, text: "Go to question" });
      go.addEventListener("click", () => this.goto(r.number - 1));
      return h(d, "tr", { class: r.answered ? "" : "is-unanswered" }, h(d, "th", { scope: "row", text: String(r.number) }), h(d, "td", { "data-i18n-skip": "", text: s.items[r.number - 1].stem }), h(d, "td", { text: r.answered ? "Answered" : "Not answered" }), h(d, "td", { text: r.marked ? "Marked for review" : "" }), h(d, "td", {}, go));
    });
    const submit = h(d, "button", { type: "button", class: "acc-btn primary", "data-act": "submit", text: sum.unanswered.length ? `Submit with ${sum.unanswered.length} unanswered` : "Submit my answers" });
    submit.addEventListener("click", () => this.finish(false));
    const back = h(d, "button", { type: "button", class: "acc-btn", text: "Keep working", "data-act": "resume" });
    back.addEventListener("click", () => this.goto(Math.min(s.index, s.items.length - 1)));
    this.body.replaceChildren(
      h(d, "section", { class: "acc-review" }, h(d, "h2", { class: "acc-review-title", tabindex: "-1", text: "Review your answers" }), h(d, "p", { text: `${sum.answered} of ${sum.total} answered.${sum.unanswered.length ? ` Not answered: ${sum.unanswered.join(", ")}.` : ""}${sum.marked.length ? ` Marked for review: ${sum.marked.join(", ")}.` : ""}` }), h(d, "table", { class: "acc-table" }, h(d, "caption", { class: "acc-visually-hidden", text: "Your answers" }), h(d, "thead", {}, h(d, "tr", {}, ...["#", "Question", "Status", "Mark", "Action"].map((c) => h(d, "th", { scope: "col", text: c })))), h(d, "tbody", {}, ...rows)), h(d, "div", { class: "acc-actions" }, back, submit)),
    );
  }
  /** Evidence is written to storage BEFORE the results screen appears, so leaving right away cannot lose it. */
  async finish(expired) {
    if (this.finishing) return;
    this.finishing = true;
    const result = this.session.submit();
    this.view = "results";
    this.save();
    try {
      await this.deps.onSubmit?.(result, { expired });
    } finally {
      this.finishing = false;
    }
    this.draw();
    this.body.querySelector(".acc-results-title")?.focus();
  }
  drawResults() {
    const d = this.doc;
    const s = this.session;
    const r = s.result || s.submit();
    const stat = (label, value) => h(d, "div", { class: "acc-stat" }, h(d, "dt", { text: label }), h(d, "dd", { text: String(value) }));
    const rows = r.rows.map((row) => {
      const item = s.items[row.number - 1];
      const answer = isObjective(item) ? "" : "";
      return h(d, "tr", {}, h(d, "th", { scope: "row", text: String(row.number) }), h(d, "td", { text: item.domain || "" }), h(d, "td", { text: STATUS_TEXT[row.status] || row.status }), h(d, "td", { text: row.status === "correct" ? (row.independent ? "On my own" : "With support or revision") : "" }), h(d, "td", {}, row.status === "unanswered" ? "" : h(d, "span", { class: "acc-kind", "data-kind": row.status === "needs-review" ? "not-scored" : "auto-scored", text: row.status === "needs-review" ? "Not scored by the lab" : "Auto-scored by answer key" })), answer ? h(d, "td", { text: answer }) : null);
    });
    const objective = r.objectiveTotal;
    this.body.replaceChildren(
      h(d, "section", { class: "acc-results" }, h(d, "h2", { class: "acc-results-title", tabindex: "-1", text: "Session complete" }), h(d, "p", { text: s.mode === "summative" ? "Your answers were submitted. This is practice: it is not an official score." : "Nice work. This shows what you did on your own and what you did with support." }), h(d, "dl", { class: "acc-stats" }, stat("Objective questions right", `${r.correct} of ${objective}`), stat("Right on your own", r.independentCorrect), stat("Right with support or revision", r.supportedCorrect), stat("Saved for teacher review", r.needsReview), stat("Not answered", r.unanswered), stat("Time", fmt(r.durationMs))), h(d, "table", { class: "acc-table" }, h(d, "caption", { text: "Question by question" }), h(d, "thead", {}, h(d, "tr", {}, ...["#", "Domain", "Result", "How", "Evidence"].map((c) => h(d, "th", { scope: "col", text: c })))), h(d, "tbody", {}, ...rows)), h(d, "p", { class: "acc-hint", text: "Practice results describe practice only. They are not a WIDA or ACCESS score or level." }), h(d, "div", { class: "acc-actions" }, h(d, "a", { class: "acc-btn primary", href: "/access-practice-lab/assess", text: "Choose another practice" }))),
    );
  }
}

export { wordCount };
