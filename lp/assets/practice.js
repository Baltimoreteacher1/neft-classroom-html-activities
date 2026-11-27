// Practice engine for every set page. The page is complete without this script (all items listed, printable);
// this adds: student mode (one item per screen, progress, calm feedback), teacher view (answer key and notes),
// project view, listening audio (device voice), glossary popovers, local-only speaking recorder, writing helpers.
import { $, $$, download, escapeHtml, readJson, speech, store, toast, tr } from "./lib.js";

const root = document.documentElement;
const app = $("[data-practice]");
const data = readJson("set-data");
if (app && data) init();

function init() {
  const kind = app.dataset.practice;
  const steps = $$(".items > li", app);
  let mode = "student";
  let index = 0;
  const firstTry = new Map(); // item id -> correct on first try
  const answered = new Set();

  /* ---------- stepper (student mode) ---------- */
  const stepper = document.createElement("div");
  stepper.className = "stepper no-print";
  stepper.innerHTML = `<p class="progress-label" aria-live="polite"></p><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${steps.length}" aria-label="Progress"><span></span></div>`;
  const nav = document.createElement("div");
  nav.className = "btn-row step-nav no-print";
  nav.innerHTML = `<button type="button" class="btn secondary small" data-prev>${tr("practice.back", "Back")}</button><button type="button" class="btn small" data-next>${tr("practice.next", "Next")}</button>`;
  const list = $(".items", app);
  list.before(stepper);
  list.after(nav);
  const done = document.createElement("div");
  done.className = "q-card done-card";
  done.hidden = true;
  nav.after(done);

  function render() {
    const student = mode === "student";
    stepper.hidden = !student;
    nav.hidden = !student;
    for (const [i, el] of steps.entries()) el.classList.toggle("step-hidden", student && i !== index);
    for (const el of $$("[data-teacher]", app)) el.hidden = student;
    for (const el of $$(".teacher-note", app)) el.hidden = student;
    if (!student) {
      done.hidden = true;
      return;
    }
    const n = Math.min(index + 1, steps.length);
    $(".progress-label", stepper).textContent = `${n} / ${steps.length}`;
    $(".progress > span", stepper).style.width = `${(answered.size / steps.length) * 100}%`;
    $(".progress", stepper).setAttribute("aria-valuenow", String(answered.size));
    $("[data-prev]", nav).disabled = index === 0;
    $("[data-next]", nav).textContent = index === steps.length - 1 ? tr("practice.check", "Check") : tr("practice.next", "Next");
  }
  function go(i) {
    if (i >= steps.length) return finish();
    index = Math.max(0, i);
    store.set(`pos:${data.id}`, index);
    done.hidden = true;
    list.hidden = false;
    render();
    const target = steps[index];
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: false });
  }
  function finish() {
    const total = data.items?.length || steps.length;
    const right = [...firstTry.values()].filter(Boolean).length;
    list.hidden = true;
    stepper.hidden = true;
    nav.hidden = true;
    done.hidden = false;
    done.innerHTML = data.items
      ? `<h2>${escapeHtml(tr("practice.done", "You finished this set."))}</h2><p class="stat">${right} / ${total}</p><p>${escapeHtml(tr("practice.firstTry", "Right on the first try. Every question you tried again counts as practice too."))}</p>`
      : `<h2>${escapeHtml(tr("practice.done", "You finished this set."))}</h2><p>${escapeHtml(tr("practice.checkNext", "Look back at your checklist. Which part will you practice next time?"))}</p>`;
    store.remove(`pos:${data.id}`);
    const again = document.createElement("button");
    again.type = "button";
    again.className = "btn";
    again.textContent = tr("practice.restart", "Practice again");
    again.addEventListener("click", restart);
    done.append(again);
    store.set(`done:${data.id}`, data.items ? { at: Date.now(), right, total } : { at: Date.now() });
    done.setAttribute("tabindex", "-1");
    done.focus();
  }
  function restart() {
    firstTry.clear();
    answered.clear();
    for (const c of $$(".choice", app)) {
      c.setAttribute("aria-pressed", "false");
      c.classList.remove("right", "wrong");
      c.disabled = false;
    }
    for (const f of $$(".feedback", app)) {
      f.hidden = true;
      f.textContent = "";
    }
    go(0);
  }
  $("[data-prev]", nav).addEventListener("click", () => go(index - 1));
  $("[data-next]", nav).addEventListener("click", () => go(index + 1));

  /* ---------- modes, print, project ---------- */
  for (const b of $$("[data-mode]")) {
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      for (const x of $$("[data-mode]")) x.setAttribute("aria-pressed", String(x === b));
      root.classList.toggle("student-mode", mode === "student");
      list.hidden = false;
      render();
    });
  }
  const projectBtn = $("[data-project]");
  projectBtn?.addEventListener("click", async () => {
    const on = !root.classList.contains("project-mode");
    root.classList.toggle("project-mode", on);
    projectBtn.querySelector("[data-i18n]").textContent = on ? tr("practice.exitProject", "Exit project view") : tr("practice.project", "Project this");
    try {
      if (on && !document.fullscreenElement) await document.documentElement.requestFullscreen();
      if (!on && document.fullscreenElement) await document.exitFullscreen();
    } catch {}
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && root.classList.contains("project-mode")) projectBtn?.click();
  });
  // Exit project view is reachable even though the chrome is hidden: keep the mode bar visible.
  $(".mode-bar")?.classList.add("keep-in-project");

  /* ---------- multiple choice ---------- */
  if (data.items) {
    const byId = new Map(data.items.map((it) => [it.id, it]));
    app.addEventListener("click", (e) => {
      const btn = e.target.closest(".choice");
      if (!btn) return;
      const card = btn.closest("[data-item]");
      const item = byId.get(card.dataset.item);
      const choice = item.choices[Number(btn.dataset.choice)];
      const fb = $(".feedback", card);
      btn.setAttribute("aria-pressed", "true");
      if (!firstTry.has(item.id)) firstTry.set(item.id, choice.correct);
      answered.add(item.id);
      if (choice.correct) {
        btn.classList.add("right");
        for (const other of $$(".choice", card)) if (other !== btn) other.disabled = true;
        fb.className = "feedback right";
        fb.innerHTML = `<strong>${escapeHtml(tr("practice.yes", "Yes."))}</strong> ${escapeHtml(choice.why)}`;
      } else {
        btn.classList.add("wrong");
        btn.disabled = true;
        fb.className = "feedback wrong";
        fb.innerHTML = `<strong>${escapeHtml(tr("practice.notQuite", "Not quite."))}</strong> ${escapeHtml(choice.why)} <span>${escapeHtml(tr("practice.tryAgain", "Try again"))}.</span>`;
      }
      fb.hidden = false;
      render();
    });
    // Keyboard: in student view, 1-4 or A-D chooses an answer on the question on screen.
    document.addEventListener("keydown", (e) => {
      if (mode !== "student" || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      const k = e.key.toLowerCase();
      const n = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
      if (n < 0) return;
      const btn = $$(".choice", steps[index])[n];
      if (btn && !btn.disabled) {
        e.preventDefault();
        btn.click();
        btn.focus();
      }
    });
  }

  /* ---------- reading: listen to the passage, Spanish help ---------- */
  const readBtn = $("[data-read-passage]", app);
  if (readBtn) {
    let reading = false;
    const label = readBtn.querySelector("[data-i18n]");
    const stop = () => {
      reading = false;
      speech.stop();
      for (const s of $$(".passage .sentence", app)) s.classList.remove("speaking-now");
      label.textContent = tr("practice.listenPassage", "Listen to the passage");
    };
    if (!speech.supported) readBtn.hidden = true;
    readBtn.addEventListener("click", () => {
      if (reading) return stop();
      reading = true;
      label.textContent = tr("practice.stop", "Stop");
      const parts = $$(".passage h2, .passage .sentence", app).map((el) => ({ el, text: el.textContent }));
      speech.speakChunks(parts, {
        onChunk: (c) => {
          for (const s of $$(".passage .speaking-now", app)) s.classList.remove("speaking-now");
          c.el.classList.add("speaking-now");
        },
        onDone: stop,
      });
    });
  }
  const esBtn = $("[data-spanish-help]", app);
  if (esBtn) {
    const apply = (on) => {
      app.classList.toggle("show-es", on);
      esBtn.setAttribute("aria-pressed", String(on));
    };
    apply(!!store.get("spanishHelp"));
    esBtn.addEventListener("click", () => {
      const on = esBtn.getAttribute("aria-pressed") !== "true";
      store.set("spanishHelp", on);
      apply(on);
    });
  }

  /* ---------- glossary popover (reading) ---------- */
  if (data.glossary) {
    const gloss = new Map(data.glossary.map((g) => [g.term.toLowerCase(), g]));
    let pop = null;
    let opener = null;
    const close = () => {
      pop?.remove();
      pop = null;
      opener?.setAttribute("aria-expanded", "false");
    };
    app.addEventListener("click", (e) => {
      const term = e.target.closest(".term");
      if (!term) return;
      e.stopPropagation();
      close();
      const g = gloss.get(term.dataset.term.toLowerCase());
      if (!g) return;
      opener = term;
      term.setAttribute("aria-expanded", "true");
      pop = document.createElement("div");
      pop.className = "gloss-pop";
      pop.setAttribute("role", "dialog");
      pop.setAttribute("aria-label", g.term);
      const es = app.classList.contains("show-es") ? `<p lang="es" class="muted">${escapeHtml(g.es)}: ${escapeHtml(g.esDefinition)}</p>` : "";
      pop.innerHTML = `<p><strong>${escapeHtml(g.term)}</strong>: ${escapeHtml(g.definition)}</p>${es}<div class="btn-row"><button type="button" class="btn small ghost" data-gloss-say>${escapeHtml(tr("read.listen", "Listen"))}</button><button type="button" class="btn small secondary" data-gloss-close>${escapeHtml(tr("display.close", "Close"))}</button></div>`;
      document.body.append(pop);
      const r = term.getBoundingClientRect();
      pop.style.top = `${window.scrollY + r.bottom + 6}px`;
      pop.style.left = `${Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 8))}px`;
      $("[data-gloss-say]", pop).addEventListener("click", () => speech.speak(`${g.term}. ${g.definition}`));
      $("[data-gloss-close]", pop).addEventListener("click", () => {
        close();
        term.focus();
      });
      $("[data-gloss-say]", pop).focus();
    });
    document.addEventListener("click", (e) => {
      if (pop && !pop.contains(e.target)) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && pop) {
        close();
        opener?.focus();
      }
    });
  }

  /* ---------- listening ---------- */
  if (kind === "listening") {
    const playBtn = $("[data-play]", app);
    const speed = $("[data-speed]", app);
    const lines = $$(".transcript .line", app);
    const transcript = $("[data-transcript]", app);
    let playing = false;
    if (!speech.supported) {
      $("[data-no-speech]", app).hidden = false;
      playBtn.disabled = true;
      transcript.open = true;
    }
    const label = (key, en) => {
      playBtn.querySelector("[data-i18n]").textContent = tr(key, en);
    };
    playBtn?.addEventListener("click", () => {
      if (playing) {
        speech.stop();
        return;
      }
      playing = true;
      label("practice.stop", "Stop");
      const chunks = data.script.map((l, i) => ({ text: `${l.speaker}. ${l.text}`, el: lines[i] }));
      speech.speakChunks(chunks, {
        rate: Number(speed.value),
        onChunk: (c) => {
          for (const l of lines) l.classList.remove("speaking-now");
          c.el?.classList.add("speaking-now");
        },
        onDone: () => {
          playing = false;
          for (const l of lines) l.classList.remove("speaking-now");
          label("practice.replay", "Play again");
        },
      });
    });
    transcript?.addEventListener("toggle", () => {
      $("summary [data-i18n]", transcript).textContent = transcript.open ? tr("practice.hideTranscript", "Hide the words") : tr("practice.transcript", "Show the words");
    });
  }

  /* ---------- speaking ---------- */
  for (const box of $$("[data-recorder]", app)) recorder(box);

  /* ---------- writing ---------- */
  for (const task of $$(".task[data-min]", app)) writing(task);

  /* ---------- self-check boxes persist ---------- */
  for (const cb of $$("[data-check]", app)) {
    const key = `check:${cb.dataset.check}`;
    cb.checked = !!store.get(key);
    cb.addEventListener("change", () => store.set(key, cb.checked));
  }

  root.classList.add("student-mode");
  // Pick up where the student left off on this device (cleared when the set is finished).
  const saved = Number(store.get(`pos:${data.id}`, 0)) || 0;
  if (saved > 0 && saved < steps.length) {
    index = saved;
    toast(`${tr("practice.resumed", "Picked up where you left off")}: ${saved + 1} / ${steps.length}`);
  }
  render();
}

/* ---------- speaking recorder: think time -> record -> play back. Audio never leaves the page. ---------- */
function recorder(box) {
  const think = Number(box.dataset.think) || 20;
  const respond = Number(box.dataset.respond) || 45;
  const card = box.closest(".task");
  const prompt = $(".q-stem", card)?.textContent || "";
  const canRecord = typeof MediaRecorder === "function" && navigator.mediaDevices?.getUserMedia;
  let timer = null;
  let rec = null;
  let url = null;
  box.innerHTML = `<div class="btn-row"><button type="button" class="btn secondary small" data-hear>${escapeHtml(tr("read.listen", "Listen"))}</button><button type="button" class="btn small" data-begin>${escapeHtml(tr("practice.start", "Start"))}</button></div><div class="rec-stage" aria-live="polite"></div>`;
  const stage = $(".rec-stage", box);
  $("[data-hear]", box).addEventListener("click", () => speech.speak(prompt));
  $("[data-begin]", box).addEventListener("click", startThink);

  function clear() {
    clearInterval(timer);
    timer = null;
  }
  function startThink() {
    clear();
    let left = think;
    stage.innerHTML = `<p class="label">${escapeHtml(tr("practice.think", "Think time"))}</p><p class="countdown" data-left>${left}</p><button type="button" class="btn small secondary" data-ready>${escapeHtml(tr("practice.skipThink", "I'm ready"))}</button>`;
    $("[data-ready]", stage).addEventListener("click", startRecording);
    timer = setInterval(() => {
      left -= 1;
      const el = $("[data-left]", stage);
      if (el) el.textContent = String(left);
      if (left <= 0) startRecording();
    }, 1000);
  }
  async function startRecording() {
    clear();
    if (!canRecord) {
      stage.innerHTML = `<p>Recording is not available on this device. Say your answer out loud to a partner or to yourself, then open the sample answers.</p>`;
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      stage.innerHTML = `<p>The microphone is turned off for this site. You can still say your answer out loud, then compare it with the sample answers.</p>`;
      return;
    }
    const chunks = [];
    rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      for (const t of stream.getTracks()) t.stop();
      if (url) URL.revokeObjectURL(url);
      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      url = URL.createObjectURL(blob);
      const ext = (rec.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
      stage.innerHTML = `<p class="label">${escapeHtml(tr("practice.playMine", "Play my answer"))}</p><audio controls src="${url}"></audio><div class="btn-row"><a class="btn small secondary" href="${url}" download="my-answer-${card.dataset.task}.${ext}">${escapeHtml(tr("practice.download", "Download my recording"))}</a><button type="button" class="btn small ghost" data-again>${escapeHtml(tr("practice.tryAgain", "Try again"))}</button></div><p class="muted">${escapeHtml(tr("practice.recordingPrivate", "Your recording stays on this device. It is never uploaded."))}</p>`;
      $("[data-again]", stage).addEventListener("click", startThink);
    };
    rec.start();
    let elapsed = 0;
    stage.innerHTML = `<p><span class="rec-dot" aria-hidden="true"></span> Recording… <span class="countdown" data-elapsed>0</span> / ${respond}s</p><button type="button" class="btn small" data-stop>${escapeHtml(tr("practice.stop", "Stop"))}</button>`;
    $("[data-stop]", stage).addEventListener("click", stop);
    $("[data-stop]", stage).focus();
    timer = setInterval(() => {
      elapsed += 1;
      const el = $("[data-elapsed]", stage);
      if (el) el.textContent = String(elapsed);
      // A gentle limit: recording stops a little after the suggested time so nobody is cut off mid-sentence.
      if (elapsed >= respond + 15) stop();
    }, 1000);
  }
  function stop() {
    clear();
    if (rec && rec.state !== "inactive") rec.stop();
  }
}

/* ---------- writing helpers: frames, word count, drafts on this device ---------- */
function writing(task) {
  const id = task.dataset.task;
  const area = $("[data-text]", task);
  const count = $("[data-count]", task);
  const min = Number(task.dataset.min);
  const max = Number(task.dataset.max);
  const orgFields = $$("[data-org]", task);
  const saved = store.get(`writing:${id}`, {}) || {};
  if (saved.text) area.value = saved.text;
  for (const f of orgFields) f.value = saved.org?.[f.dataset.org] || "";
  const save = () =>
    store.set(`writing:${id}`, { text: area.value, org: Object.fromEntries(orgFields.map((f) => [f.dataset.org, f.value])) });
  const update = () => {
    const n = area.value.trim() ? area.value.trim().split(/\s+/).length : 0;
    const status =
      n < min
        ? tr("practice.keepGoing", "Keep going.")
        : n > max
          ? tr("practice.tooLong", "That is more than the goal. Check that every sentence helps.")
          : tr("practice.inRange", "Right in the goal range.");
    count.textContent = `${n} ${tr("practice.words", "words")} (goal: ${min}–${max}). ${status}`;
  };
  area.addEventListener("input", () => {
    update();
    save();
  });
  for (const f of orgFields) f.addEventListener("input", save);
  for (const b of $$("[data-frame]", task)) {
    b.addEventListener("click", () => {
      const frame = b.dataset.frame;
      const start = area.selectionStart ?? area.value.length;
      const before = area.value.slice(0, start);
      const sep = before && !/\s$/.test(before) ? " " : "";
      area.value = `${before}${sep}${frame} ${area.value.slice(start)}`;
      const blank = area.value.indexOf("___", start);
      area.focus();
      if (blank >= 0) area.setSelectionRange(blank, blank + 3);
      update();
      save();
      toast(tr("practice.starterAdded", "Starter added. Replace ___ with your words."));
    });
  }
  // Keep a copy: a plain-text file with the prompt, the plan and the writing. Made on the device; nothing is sent.
  const dl = document.createElement("button");
  dl.type = "button";
  dl.className = "btn small secondary no-print";
  dl.textContent = tr("practice.downloadWriting", "Download my writing");
  dl.addEventListener("click", () => {
    const prompt = $(".q-stem", task)?.textContent.trim() || "";
    const plan = orgFields
      .map((f) => `${task.querySelector(`label[for="${f.id}"]`)?.textContent.trim() || "Plan"}: ${f.value.trim()}`)
      .join("\n");
    const text = `${prompt}\n\n${plan}\n\n${area.value.trim()}\n`;
    download(`my-writing-${id}.txt`, text, "text/plain");
  });
  count.after(dl);
  document.addEventListener("lp:lang", update);
  update();
}
