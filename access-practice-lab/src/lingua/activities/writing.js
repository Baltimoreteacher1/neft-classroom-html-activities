import { WRITING } from "../data.js";
import { draftOf, saveDraft, recordAnswer, awardXP, countSession, escapeHtml, toast, levelName } from "../core.js";

export const meta = {
  id: "writing",
  title: "Writing Studio",
  skill: "Writing",
  level: "Building–Stretch",
  blurb: "Real purposes — landlord, client, café review — with a starter bank, live checks on your draft and a model to compare.",
  icon: "writing",
  accent: "#1f6f8b",
  time: "8 min"
};

const CONNECTORS = ["because", "however", "but", "so", "although", "therefore", "also", "first", "then", "finally", "instead", "while", "after", "before"];

export function mount(root) {
  let promptId = null;
  let checked = false;
  let checks = [];
  let showModel = false;
  let awarded = false;
  let xp = 0;

  const prompt = () => WRITING.find((w) => w.id === promptId);

  function library() {
    root.innerHTML = `<div class="act">
      <p class="act-prompt">What do you need to write?</p>
      <p class="act-hint">Each task has a real audience and purpose. Your draft saves on this device as you type.</p>
      <div class="activity-grid">
        ${WRITING.map((w) => `<button type="button" class="activity-card" data-action="open" data-id="${w.id}" style="--accent-c:#1f6f8b">
          <span class="icon" aria-hidden="true">${w.id === "w4" ? "⭐" : "✉️"}</span>
          <h3>${escapeHtml(w.title)}</h3>
          <p>${escapeHtml(w.purpose)} · ${escapeHtml(w.audience)}</p>
          <div class="foot"><span class="pill level">${levelName(w.lvl)}</span><span class="pill time">${w.target[0]}–${w.target[1]} words</span></div>
        </button>`).join("")}
      </div>
    </div>`;
  }

  function computeChecks(text, p) {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const lower = text.toLowerCase();
    const lines = trimmed.split(/\n+/).filter((l) => l.trim());
    const used = CONNECTORS.filter((c) => new RegExp(`\\b${c}\\b`, "i").test(lower));
    const list = [
      { label: `Length: ${words} word${words === 1 ? "" : "s"} (target ${p.target[0]}–${p.target[1]})`, ok: words >= p.target[0] && words <= p.target[1] },
      { label: "Opens with a greeting that names the person", ok: /^\s*(hi|hello|dear)\b[^\n]*,/i.test(trimmed) },
      { label: "Closes with thanks or a sign-off", ok: /(thanks|thank you|regards|best wishes|yours|sincerely|cheers)/i.test(lower) },
      { label: `Uses linking words${used.length ? " (" + used.slice(0, 3).join(", ") + ")" : ""}`, ok: used.length >= 2 },
      { label: "Starts with a capital letter and ends with punctuation", ok: /^[A-Z]/.test(trimmed) && /[.!?]$/.test(trimmed) }
    ];
    if (p.target[0] >= 60) {
      list.push({ label: "Uses at least two paragraphs", ok: lines.length >= 2 });
    }
    return list;
  }

  function render() {
    const p = prompt();
    if (!p) return library();
    const draft = draftOf(p.id);
    const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;
    const passed = checks.filter((c) => c.ok).length;

    root.innerHTML = `<div class="act">
      <div class="act-head">
        <button class="btn btn-sm" data-action="back">← All tasks</button>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="pill level">${levelName(p.lvl)}</span><span class="pill time">${p.target[0]}–${p.target[1]} words</span></div>
      </div>

      <div class="q-card">
        <h3 style="font-size:1.35rem">${escapeHtml(p.title)}</h3>
        <p class="small muted" style="margin-top:4px"><strong>To:</strong> ${escapeHtml(p.audience)} · <strong>Aim:</strong> ${escapeHtml(p.purpose)}</p>
        <hr class="soft" />
        <p class="small" style="font-weight:700;margin-bottom:8px">Your draft should include:</p>
        <ul class="checklist">
          ${p.checklist.map((c) => `<li><span class="tick" aria-hidden="true"></span><span>${escapeHtml(c)}</span></li>`).join("")}
        </ul>
        <div class="starters">
          ${p.starters.map((s) => `<button type="button" data-action="starter" data-text="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}
        </div>

        <textarea class="editor" data-editor aria-label="Your draft" placeholder="Start writing here…" style="margin-top:16px">${escapeHtml(draft)}</textarea>
        <div class="textarea-row">
          <span class="wordcount" data-count>${words} words</span>
          <span class="small muted">Saved automatically on this device</span>
        </div>

        <div class="act-actions">
          <button class="btn btn-primary" data-action="check">Check my draft</button>
          <button class="btn btn-sm" data-action="model">${showModel ? "Hide model answer" : "Show a model answer"}</button>
        </div>

        ${showModel ? `<div class="model-answer"><strong>Model answer — read after you have written yours</strong>${escapeHtml(p.model).split("\n").map((line) => `<p>${line || "&nbsp;"}</p>`).join("")}</div>` : ""}

        ${checked ? `<div class="feedback" style="margin-top:18px">
          <strong>${passed >= checks.length - 1 ? "Strong draft — " : "Good start — "}${passed} of ${checks.length} checks passing.</strong>
          <ul class="checklist" style="margin-top:10px">
            ${checks.map((c) => `<li class="${c.ok ? "ok" : ""}"><span class="tick" aria-hidden="true"></span><span>${escapeHtml(c.label)}</span></li>`).join("")}
          </ul>
          <span class="rule">Reading it aloud once will catch most of what is left.</span>
        </div>` : ""}
      </div>
    </div>`;
  }

  function updateCount() {
    const editor = root.querySelector("[data-editor]");
    const counter = root.querySelector("[data-count]");
    if (!editor || !counter) return;
    const t = editor.value.trim();
    counter.textContent = `${t ? t.split(/\s+/).length : 0} words`;
  }

  function onInput(e) {
    if (!e.target.matches("[data-editor]")) return;
    const p = prompt();
    saveDraft(p.id, e.target.value);
    updateCount();
  }

  function checkDraft() {
    const p = prompt();
    const text = root.querySelector("[data-editor]")?.value || "";
    checks = computeChecks(text, p);
    checked = true;
    const passed = checks.filter((c) => c.ok).length;
    if (!awarded && passed >= 4) {
      awarded = true;
      xp += awardXP(15);
      recordAnswer("writing", p.id, true);
      countSession();
      toast("Draft checked — +15 XP");
    } else if (!awarded) {
      recordAnswer("writing", p.id, false);
    }
    render();
    root.querySelector(".feedback")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function onClick(e) {
    const target = e.target.closest("[data-action]");
    if (target?.dataset.action === "starter") {
      const editor = root.querySelector("[data-editor]");
      if (editor) {
        const text = target.dataset.text;
        const start = editor.selectionStart ?? editor.value.length;
        const end = editor.selectionEnd ?? editor.value.length;
        const before = editor.value.slice(0, start);
        const after = editor.value.slice(end);
        const glue = before && !/\s$/.test(before) ? " " : "";
        editor.value = `${before}${glue}${text}${after}`;
        editor.focus();
        editor.selectionStart = editor.selectionEnd = (before + glue + text).length;
        saveDraft(promptId, editor.value);
        updateCount();
      }
      return;
    }
    if (!target) return;
    const action = target.dataset.action;
    if (action === "open") {
      promptId = target.dataset.id;
      checked = false;
      checks = [];
      showModel = false;
      awarded = false;
      render();
    } else if (action === "back") {
      promptId = null;
      library();
    } else if (action === "check") {
      checkDraft();
    } else if (action === "model") {
      showModel = !showModel;
      render();
    }
  }

  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  library();

  return {
    destroy() {
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
    }
  };
}
