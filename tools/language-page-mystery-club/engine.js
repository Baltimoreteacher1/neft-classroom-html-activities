(() => {
  "use strict";
  const stories = window.MYSTERY_STORIES || [];
  const stateKey = "language-page:mystery-studio:v1";
  const initial = {
    pathway: "developing",
    domain: "all",
    progress: {},
    settings: { large: false, motion: false },
    notebook: [],
    accessResponses: {},
    accessDone: [],
  };
  let state = readState();
  let active = null;
  const $ = (s, root = document) => root.querySelector(s);
  const esc = (s = "") =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  function readState() {
    try {
      return {
        ...initial,
        ...JSON.parse(localStorage.getItem(stateKey) || "{}"),
        progress: JSON.parse(localStorage.getItem(stateKey) || "{}").progress || {},
        settings: JSON.parse(localStorage.getItem(stateKey) || "{}").settings || initial.settings,
        notebook: JSON.parse(localStorage.getItem(stateKey) || "{}").notebook || [],
      };
    } catch {
      return { ...initial, progress: {}, notebook: [] };
    }
  }
  function save() {
    localStorage.setItem(stateKey, JSON.stringify(state));
  }
  function progressFor(id) {
    return state.progress[id] || { scene: 0, done: [], answers: {}, branches: {} };
  }
  const domainNames = {
    listening: "Listening",
    speaking: "Speaking",
    reading: "Reading",
    writing: "Writing",
  };
  const pathwayInfo = {
    guided: { label: "Guided", starter: true, example: true },
    developing: { label: "Developing", starter: true, example: false },
    independent: { label: "Independent", starter: false, example: false },
  };
  function init() {
    const launchParams = new URLSearchParams(location.search);
    if (["guided", "developing", "independent"].includes(launchParams.get("pathway")))
      state.pathway = launchParams.get("pathway");
    if (["all", "listening", "speaking", "reading", "writing"].includes(launchParams.get("domain")))
      state.domain = launchParams.get("domain");
    save();
    $("#pathway").value = state.pathway;
    $("#domain").value = state.domain;
    $("#pathway").addEventListener("change", (e) => {
      state.pathway = e.target.value;
      save();
      drawCards();
      if (active) renderScene();
    });
    $("#domain").addEventListener("change", (e) => {
      state.domain = e.target.value;
      save();
      drawCards();
    });
    $("#settings-open").addEventListener("click", () => $("#settings-dialog").showModal());
    $("#large-text").checked = !!state.settings.large;
    $("#reduce-motion").checked = !!state.settings.motion;
    applySettings();
    $("#large-text").addEventListener("change", (e) => {
      state.settings.large = e.target.checked;
      applySettings();
      save();
    });
    $("#reduce-motion").addEventListener("change", (e) => {
      state.settings.motion = e.target.checked;
      applySettings();
      save();
    });
    $("#teacher-guide").addEventListener("click", toggleGuide);
    $("#print-report").addEventListener("click", printReport);
    drawCards();
    const params = new URLSearchParams(location.search);
    const id = params.get("story");
    if (id && stories.some((s) => s.id === id)) openStory(id);
    if (params.get("teacher") === "1") toggleGuide();
  }
  function applySettings() {
    document.body.classList.toggle("large-text", !!state.settings.large);
    document.body.classList.toggle("reduce-motion", !!state.settings.motion);
  }
  function drawCards() {
    const grid = $("#story-grid");
    const visible = stories.filter((s) => s.band === "3-5" || s.band === "6-8");
    grid.innerHTML = visible
      .map((s, i) => {
        const p = progressFor(s.id);
        const finished = p.done.length === s.scenes.length;
        const activeDomain =
          state.domain === "all" || s.scenes.some((x) => x.activity.domain === state.domain);
        return `<article class="story-card"><div class="story-cover" aria-hidden="true"><span class="case">CASE ${s.number} · ${s.band === "3-5" ? "GRADES 3–5" : "GRADES 6–8"}</span><span class="cover-title">${esc(s.title.replace("The Lantern in the Stacks · ", ""))}</span></div><div class="story-body"><h3>${esc(s.title)}</h3><p class="subtitle">${esc(s.subtitle)}</p><div class="story-meta"><span>${esc(s.time)}</span><span>${esc(s.keyUse)}</span><span>${s.scenes.length} scenes</span></div><p class="story-objective">${esc(s.objective)}</p><button class="primary start-story" data-story="${s.id}" aria-label="${p.scene ? "Resume" : "Start"} ${esc(s.title)}">${finished ? "Read again" : p.scene ? "Resume case" : "Start case"} <span aria-hidden="true">→</span></button><p class="saved">${finished ? "Case complete" : p.scene ? `Saved at scene ${Math.min(p.scene + 1, s.scenes.length)} of ${s.scenes.length}` : "Progress saves on this device"}${!activeDomain ? " · includes other language domains" : ""}</p></div></article>`;
      })
      .join("");
    grid
      .querySelectorAll(".start-story")
      .forEach((b) => b.addEventListener("click", () => openStory(b.dataset.story)));
    const count = Object.values(state.progress).filter((p) => p.done && p.done.length).length;
    $("#progress-summary").textContent = count
      ? `${count} ${count === 1 ? "case has" : "cases have"} progress saved on this device.`
      : "Your progress is saved in this browser.";
  }
  function openStory(id) {
    active = stories.find((s) => s.id === id);
    if (!active) return;
    const p = progressFor(id);
    if (p.done.length === active.scenes.length) {
      state.progress[id] = { scene: 0, done: [], answers: {}, branches: {} };
      save();
    } else p.scene = Math.min(p.scene || 0, active.scenes.length - 1);
    state.progress[id] = p;
    save();
    $("#reader").hidden = false;
    renderScene();
    $("#reader").scrollIntoView({
      behavior: state.settings.motion ? "instant" : "smooth",
      block: "start",
    });
  }
  function sceneSvg(scene, idx) {
    const room = {
      classroom: ["#dce8dd", "#b8895a", "CLASSROOM"],
      hallway: ["#d7e5e7", "#9c7859", "HALLWAY"],
      artroom: ["#f2dfb7", "#ba8051", "ART ROOM"],
      cafeteria: ["#f1dcb8", "#b5624c", "CAFETERIA"],
      gym: ["#d8e5da", "#557b78", "GYM"],
      library: ["#dbe3df", "#76513d", "LIBRARY"],
      courtyard: ["#dce9d9", "#96784d", "COURTYARD"],
      garden: ["#d7e8d0", "#47795f", "SCHOOL GARDEN"],
      archive: ["#ccd9df", "#553d39", "BELLWEATHER ARCHIVE"],
    };
    const [sky, wood, label] = room[scene.art] || room.classroom;
    const arch = scene.art === "archive";
    const floor =
      scene.art === "garden"
        ? '<path d="M0 320 Q180 270 360 326 T720 310V440H0Z" fill="#72925c"/><path d="M0 365 Q200 340 420 370T720 350V440H0Z" fill="#96764e"/>'
        : `<path d="M0 315 Q180 290 380 320T720 304V440H0Z" fill="${arch ? "#604a46" : "#9a795d"}"/>`;
    let setpiece = "";
    if (scene.art === "classroom")
      setpiece = `<rect x="52" y="92" width="235" height="142" rx="7" fill="#f4e6c6" stroke="#17324d" stroke-width="7"/><rect x="76" y="117" width="186" height="94" fill="#74a89a"/><path d="M143 172q40-48 70 0" fill="none" stroke="#f2c15b" stroke-width="11"/><rect x="475" y="116" width="183" height="118" fill="#b8895a" stroke="#17324d" stroke-width="7"/><path d="M480 156H650M480 197H650" stroke="#f2c15b" stroke-width="9"/><text x="106" y="255" fill="#17324d" font-size="19" font-weight="700">CELEBRATION</text>`;
    else if (scene.art === "hallway")
      setpiece = `<path d="M40 115h130v150H40zM555 88h120v177H555z" fill="#e9d5b1" stroke="#17324d" stroke-width="6"/><path d="M66 142h78M66 173h78M575 120h80M575 152h80" stroke="#bc7652" stroke-width="8"/><path d="M240 294l70-15 50 15 70-18" stroke="#dbe8e7" stroke-width="8" fill="none"/><text x="275" y="264" fill="#17324d" font-size="18" font-weight="700">${esc(scene.title.toUpperCase().slice(0, 24))}</text>`;
    else if (scene.art === "artroom")
      setpiece = `<rect x="80" y="110" width="194" height="130" fill="#eee0c3" stroke="#17324d" stroke-width="6"/><path d="M112 201l52-62 49 62" fill="#4c8a84" stroke="#17324d" stroke-width="4"/><rect x="435" y="211" width="230" height="24" fill="#b77b4d"/><path d="M475 208q55-62 107 0" fill="#3c7d8a"/><text x="467" y="270" fill="#17324d" font-size="16" font-weight="700">WET PAINT</text>`;
    else if (scene.art === "cafeteria")
      setpiece = `<path d="M75 199h570v28H75zM100 228v62m510-62v62" fill="#bf7850" stroke="#17324d" stroke-width="5"/><rect x="138" y="142" width="152" height="66" rx="12" fill="#367a89" stroke="#17324d" stroke-width="5"/><rect x="433" y="142" width="152" height="66" rx="12" fill="#367a89" stroke="#17324d" stroke-width="5"/><path d="M176 151l19 19-19 19-19-19z" fill="#f2c15b"/><text x="151" y="260" fill="#17324d" font-size="18" font-weight="700">LUNCH LINE</text>`;
    else if (scene.art === "gym")
      setpiece = `<path d="M80 92h560v190H80z" fill="#d9e7dc" stroke="#17324d" stroke-width="7"/><path d="M100 235h520M360 95v190M125 110v104h126V110M595 110V214H470V110" fill="none" stroke="#477b7b" stroke-width="6"/><circle cx="360" cy="201" r="47" fill="none" stroke="#477b7b" stroke-width="5"/><text x="283" y="140" fill="#17324d" font-size="17" font-weight="700">SCHOOL SHOWCASE</text>`;
    else if (scene.art === "library")
      setpiece = `<rect x="58" y="94" width="220" height="170" fill="#e3c99c" stroke="#17324d" stroke-width="7"/><path d="M70 145h194M70 194h194" stroke="#8d5b43" stroke-width="10"/><path d="M94 110h28v30H94zM147 108h38v32h-38zM214 107h24v32h-24zM97 157h35v32H97zM153 157h26v32h-26zM213 157h30v33h-30z" fill="#437d7a"/><rect x="410" y="110" width="238" height="130" rx="6" fill="#f8f2e4" stroke="#17324d" stroke-width="6"/><text x="442" y="159" fill="#17324d" font-size="17" font-weight="700">MEET BY THE</text><text x="445" y="190" fill="#b35f4a" font-size="22" font-weight="700">LIBRARY · 3:00</text>`;
    else if (scene.art === "courtyard")
      setpiece = `<path d="M70 240h580" stroke="#8d674c" stroke-width="14"/><path d="M95 240v70m520-70v70" stroke="#17324d" stroke-width="9"/><rect x="478" y="110" width="174" height="120" fill="#e7d2ad" stroke="#17324d" stroke-width="7"/><text x="496" y="155" fill="#17324d" font-size="17" font-weight="700">LIBRARY</text><path d="M515 176h95" stroke="#ba7651" stroke-width="7"/><circle cx="178" cy="211" r="37" fill="#e8c45f"/>`;
    else if (scene.art === "garden")
      setpiece = `<path d="M92 292V130m0 77q40-69 86-29t78-22m0 136V126m0 79q47-64 91-27t75-21" fill="none" stroke="#36745c" stroke-width="12"/><path d="M78 145l14-18 14 18M236 142l14-18 14 18" fill="#f2c15b"/><path d="M472 295V112m0 38h95m-95 45h122" stroke="#8d674c" stroke-width="10"/><path d="M454 118l24-19 19 19" fill="#d96e53"/><rect x="552" y="103" width="68" height="97" rx="8" fill="#d9eff3" stroke="#17324d" stroke-width="5"/><path d="M560 176h52" stroke="#357c92" stroke-width="7"/>`;
    else
      setpiece = `<path d="M50 104h620v174H50z" fill="#836553" stroke="#382e31" stroke-width="8"/><path d="M74 157h570M74 211h570" stroke="#c7a275" stroke-width="9"/><path d="M104 115h33v39h-33zM169 114h43v40h-43zM241 113h29v41h-29zM303 113h37v41h-37zM388 113h31v42h-31zM460 114h41v40h-41zM554 113h45v41h-45z" fill="#547b7a"/><rect x="282" y="289" width="165" height="30" rx="8" fill="#d8c8a7" stroke="#352b2e" stroke-width="5"/><path d="M340 281q21-35 48 0" fill="none" stroke="#f2c15b" stroke-width="10"/><text x="241" y="351" fill="#fff4d5" font-size="16" font-weight="700">ARCHIVE EVIDENCE DESK</text>`;
    const people = [
      ["Maya", "#f2c15b", "#a75e43"],
      ["Leo", "#347e88", "#d39b70"],
      ["Zara", "#c86d55", "#85503e"],
    ];
    const chars = people
      .map(([name, shirt, skin], i) => {
        const x = 230 + i * 110;
        return `<g aria-hidden="true"><path d="M${x - 24} 311q24-21 48 0v83h-48z" fill="${shirt}" stroke="#17324d" stroke-width="4"/><circle cx="${x}" cy="283" r="24" fill="${skin}" stroke="#17324d" stroke-width="4"/><path d="M${x - 24} 278q6-37 42-20l10 16" fill="${name === "Maya" ? "#24323f" : name === "Leo" ? "#3c3027" : "#202a35"}"/><circle cx="${x - 8}" cy="285" r="2.5" fill="#17324d"/><circle cx="${x + 8}" cy="285" r="2.5" fill="#17324d"/><text x="${x - 26}" y="416" fill="#17324d" font-size="13" font-weight="700">${name.toUpperCase()}</text></g>`;
      })
      .join("");
    const clue = arch
      ? `<g><path d="M335 303q25-13 50 0v61q-25 13-50 0z" fill="#f2c15b" stroke="#17324d" stroke-width="5"/><path d="M333 303q28-25 54 0M345 368v14m31-14v14" fill="none" stroke="#17324d" stroke-width="5"/><circle cx="353" cy="332" r="9" fill="#fff5c8"/></g>`
      : `<g><rect x="321" y="326" width="76" height="55" rx="12" fill="#367f8d" stroke="#17324d" stroke-width="5"/><path d="M341 326q18-21 36 0" fill="none" stroke="#17324d" stroke-width="5"/><path d="M342 346l13 12 14-12" fill="none" stroke="#f2c15b" stroke-width="5"/></g>`;
    const title = scene.title.replace(/&/g, "&amp;").toUpperCase();
    return `<svg viewBox="0 0 720 440" role="img" aria-labelledby="art-title-${idx}"><title id="art-title-${idx}">${esc(scene.title)} — ${esc(scene.text)}</title><rect width="720" height="440" fill="${sky}"/><path d="M0 255Q170 238 360 258T720 250V0H0Z" fill="${arch ? "#24384a" : "#f1ddad"}" opacity="${arch ? ".48" : ".55"}"/><circle cx="609" cy="68" r="39" fill="#f2c15b" opacity=".75"/><rect y="276" width="720" height="164" fill="${wood}" opacity=".13"/>${floor}${setpiece}${chars}${clue}<rect x="19" y="17" width="194" height="28" rx="7" fill="#17324d" opacity=".9"/><text x="31" y="36" fill="white" font-size="13" font-weight="700" letter-spacing="1.2">${esc(label)} · ${idx + 1}</text><text x="477" y="413" fill="#17324d" font-size="12" font-weight="700">${esc(title.slice(0, 27))}</text></svg>`;
  }
  function renderScene() {
    if (!active) return;
    const p = progressFor(active.id);
    const idx = p.scene || 0;
    const sc = active.scenes[idx];
    const reader = $("#reader");
    const prev = idx > 0;
    const currentDone = p.done.includes(idx);
    const pct = Math.round((p.done.length / active.scenes.length) * 100);
    reader.innerHTML = `<div class="reader-top"><h2>${esc(active.title)}</h2><button id="close-reader">Close case</button></div><div class="reader-progress" aria-label="Case progress"><span style="width:${pct}%"></span></div><div class="scene-layout"><div class="scene-art">${sceneSvg(sc, idx)}</div><article class="scene-content"><p class="scene-count">SCENE ${String(idx + 1).padStart(2, "0")} OF ${active.scenes.length} · ${esc(active.keyUse.toUpperCase())}</p><h1 id="reader-title" tabindex="-1">${esc(sc.title)}</h1><p class="scene-text">${esc(sc.text)}</p><div class="dialogue" aria-label="Character dialogue">${sc.dialogue.map(([who, line], i) => `<div class="speech"><span class="speaker">${esc(who)}</span><span class="speech-text">${esc(line)}</span><button class="speak-line" data-line="${i}" aria-label="Play ${esc(who)}’s line">▶ Listen</button></div>`).join("")}</div><div id="activity" class="activity"></div></article></div><div class="notebook" aria-live="polite"><h3>Evidence notebook · ${state.notebook.length} clue${state.notebook.length === 1 ? "" : "s"}</h3><div class="notebook-list">${state.notebook.length ? state.notebook.map((x) => `<span class="notebook-chip">${esc(x)}</span>`).join("") : '<span class="subtitle">Collect clues as you investigate.</span>'}</div></div><div class="reader-nav"><button id="scene-prev" class="secondary" ${prev ? "" : "disabled"}>← Previous</button><p>${currentDone ? "Scene task completed" : "Complete the activity to continue"} · ${pct}% complete</p><button id="scene-next" class="primary" ${currentDone ? "" : "disabled"}>${idx === active.scenes.length - 1 ? "Finish case" : "Next scene"} →</button></div>`;
    $("#close-reader").addEventListener("click", () => {
      reader.hidden = true;
      active = null;
      drawCards();
    });
    $("#scene-prev").addEventListener("click", () => moveScene(-1));
    $("#scene-next").addEventListener("click", () => moveScene(1));
    reader.querySelectorAll(".speak-line").forEach((b) =>
      b.addEventListener("click", () => {
        const [who, line] = sc.dialogue[Number(b.dataset.line)];
        speak(`${who} says: ${line}`);
      }),
    );
    renderActivity(sc.activity, idx, p);
    $("#reader-title").focus({ preventScroll: true });
  }
  function moveScene(delta) {
    const p = progressFor(active.id);
    if (delta > 0 && p.scene === active.scenes.length - 1 && p.done.includes(p.scene)) {
      finishCase();
      return;
    }
    const n = p.scene + delta;
    if (n < 0 || n >= active.scenes.length) return;
    if (delta > 0 && !p.done.includes(p.scene)) return;
    p.scene = n;
    state.progress[active.id] = p;
    save();
    renderScene();
  }
  function finishCase() {
    const p = progressFor(active.id);
    const next = stories.find((s) => Number(s.number) === Number(active.number) + 1);
    const reader = $("#reader");
    reader.innerHTML = `<div class="reader-top"><h2>${esc(active.title)}</h2><button id="close-reader">Close case</button></div><div class="completion"><p class="eyebrow">${active.band === "6-8" ? "CHAPTER FILED" : "CASE CLOSED"}</p><h1 tabindex="-1">${active.band === "6-8" ? "Chapter complete" : "Mystery solved"}</h1><p>${esc(active.scenes.at(-1).text)}</p><div class="completion-evidence"><strong>Your case work</strong><p>${p.done.length} scene activities completed · ${state.notebook.filter((x) => x.startsWith(`${active.id}:`)).length} clues collected · pathway: ${esc(pathwayInfo[state.pathway].label)}</p></div><label for="reflection"><strong>Final reflection</strong><span class="subtitle">What detail helped you most? How did you use language to explain your thinking?</span></label><textarea id="reflection" placeholder="Write a note to your future investigator self.">${esc(p.reflection || "")}</textarea><div class="activity-actions"><button id="save-reflection" class="small-button primary-small">Save reflection on this device</button>${next && active.band === "6-8" ? `<a class="primary" href="?story=${encodeURIComponent(next.id)}#reader">Next chapter →</a>` : '<a class="secondary" href="#stories">Choose another case</a>'}<button id="review-case" class="secondary">Review scenes</button></div><p class="subtitle">Your response is stored only in this browser. It is not a score or proficiency rating.</p></div>`;
    $("#close-reader").addEventListener("click", () => {
      reader.hidden = true;
      active = null;
      drawCards();
    });
    $("#reader-title")?.focus();
    reader.querySelector("h1").focus();
    $("#save-reflection").addEventListener("click", () => {
      const q = progressFor(active.id);
      q.reflection = $("#reflection").value;
      state.progress[active.id] = q;
      save();
      announce("Reflection saved on this device.");
    });
    $("#review-case").addEventListener("click", () => {
      const q = progressFor(active.id);
      q.scene = 0;
      state.progress[active.id] = q;
      save();
      renderScene();
    });
    reader.scrollIntoView({
      behavior: state.settings.motion ? "instant" : "smooth",
      block: "start",
    });
    drawCards();
  }
  function speak(text) {
    if (!("speechSynthesis" in window)) {
      announce(
        "Audio playback is not available in this browser. Read the dialogue text on screen.",
      );
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }
  function announce(text) {
    let live = $("#activity-live");
    if (!live) {
      live = document.createElement("div");
      live.id = "activity-live";
      live.className = "visually-hidden";
      live.setAttribute("aria-live", "polite");
      $("#activity").append(live);
    }
    live.textContent = text;
  }
  function saveClue(label) {
    const k = `${active.id}: ${label}`;
    if (!state.notebook.includes(k)) state.notebook.push(k);
    save();
  }
  function renderActivity(a, idx, p) {
    const box = $("#activity");
    const prev = p.answers[idx] || {};
    let submitted = false;
    const guided = state.pathway === "guided";
    const faded = guided && p.done.length >= 3;
    const frame =
      a.frame && state.pathway !== "independent"
        ? faded || state.pathway === "developing"
          ? `<details><summary>Show a sentence support</summary><p class="frame"><strong>Language support:</strong> ${esc(a.frame)}</p></details>`
          : `<p class="frame"><strong>Language support:</strong> ${esc(a.frame)}</p>`
        : "";
    const example = guided
      ? `<details><summary>${faded ? "Optional model" : "See a model"}</summary><p>${esc(exampleFor(a))}</p></details>`
      : "";
    const plan = languagePlan(a, active);
    let html = `<div class="activity-head"><strong>Investigation activity</strong><span class="domain-tag">${domainNames[a.domain]} · ${pathwayInfo[state.pathway].label}</span></div><p class="activity-prompt">${esc(a.prompt)}</p>${frame}<details><summary>Teacher language target</summary><p><strong>Language Expectation reference:</strong> ${esc(plan.reference)} · <strong>Key Language Use:</strong> ${esc(active.keyUse)} · <strong>Grade cluster:</strong> ${esc(plan.cluster)}</p><p><strong>Language function:</strong> ${esc(plan.function)} · <strong>Mode:</strong> ${esc(plan.mode)} (${esc(domainNames[a.domain])})</p><p><strong>Expected response:</strong> ${esc(plan.expected)}</p><p><strong>Scaffolds:</strong> Guided: ${esc(a.frame || "audio model and visual context")}; Developing: optional sentence start and vocabulary; Independent: extended response without default frames.</p><p><strong>Success evidence:</strong> ${esc(plan.success)}</p></details>`;
    if (a.type === "clue" || a.type === "notebook") {
      const clues =
        a.clues ||
        a.options.map((x, i) => ({
          label: String(x),
          detail:
            i === a.answer
              ? "This detail is supported by the available source."
              : "This statement adds an idea the source does not confirm.",
        }));
      html += `<p>Choose a card to inspect it. The detail will be added to your notebook.</p><div>${clues.map((c, i) => `<div class="clue-card"><button data-inspect="${i}" aria-expanded="false">＋ ${esc(c.label)}</button><div class="clue-detail" id="clue-detail-${i}" hidden>${esc(c.detail)}</div></div>`).join("")}</div><div class="choice-list" role="group" aria-label="Choose the strongest clue">${clues.map((c, i) => `<button class="choice" data-answer="${i}" aria-pressed="${prev.choice === i ? "true" : "false"}">${esc(c.label)}</button>`).join("")}</div>`;
    } else if (a.type === "timeline") {
      const order = prev.order || a.items.map((_, i) => i);
      html += `<p>Use Move up and Move down to arrange the cards. Keyboard and touch friendly.</p><ol class="timeline-list" id="timeline-list">${order.map((itemPos, pos) => `<li class="timeline-item" data-item="${itemPos}"><span class="domain-tag">${pos + 1}</span><p>${esc(a.items[itemPos])}</p><button data-move="-1" aria-label="Move ${esc(a.items[itemPos])} up" ${pos === 0 ? "disabled" : ""}>↑</button><button data-move="1" aria-label="Move ${esc(a.items[itemPos])} down" ${pos === order.length - 1 ? "disabled" : ""}>↓</button></li>`).join("")}</ol><button id="check-order" class="small-button primary-small">Check sequence</button>`;
    } else if (a.type === "writing" || a.type === "speaking") {
      html += `<label for="student-response"><strong>${a.type === "speaking" ? "Rehearse your explanation" : "Write your first attempt"}</strong></label><textarea id="student-response" placeholder="${guided ? "Use the sentence support above if it helps." : "Write your response here."}">${esc(prev.draft || "")}</textarea><div class="activity-actions"><button id="read-draft" class="small-button">▶ Hear my draft</button>${a.type === "speaking" ? '<button id="record-toggle" class="small-button">● Optional microphone</button>' : ""}<button id="check-draft" class="small-button primary-small">${prev.feedback ? "Check revision" : "Get feedback"}</button></div><p class="subtitle">${a.type === "speaking" ? "Microphone is optional. You may rehearse aloud and use the self-review checklist." : "Your draft stays on this device. Feedback uses the task criteria and does not score language proficiency."}</p><div id="revision-box"></div>`;
      if (prev.feedback) html += `<p class="feedback" role="status">${esc(prev.feedback)}</p>`;
    } else if (a.type === "listening") {
      html += `<button id="play-audio" class="small-button">▶ Play / replay audio</button><p class="frame"><strong>Transcript:</strong> ${esc(a.audio || a.prompt)}</p><div class="choice-list" role="group" aria-label="Listening answers">${a.options.map((o, i) => `<button class="choice" data-answer="${i}" aria-pressed="${prev.choice === i ? "true" : "false"}">${esc(o)}</button>`).join("")}</div>`;
    } else if (a.type === "branch") {
      const selected = p.branches[idx];
      html += `<p>Choose a path. The story keeps the facts consistent while the team investigates from a different starting point.</p><div class="choice-list" role="group" aria-label="Investigation paths">${a.options.map((o, i) => `<button class="choice" data-branch="${i}" aria-pressed="${selected === i ? "true" : "false"}">${esc(o.label)}</button>`).join("")}</div>${selected !== undefined ? `<p class="feedback">${esc(a.options[selected].result)}</p>` : ""}`;
    } else {
      html += `<div class="choice-list" role="group" aria-label="Answer choices">${a.options.map((o, i) => `<button class="choice" data-answer="${i}" aria-pressed="${prev.choice === i ? "true" : "false"}">${esc(o)}</button>`).join("")}</div>`;
    }
    html += `${example}<div id="task-feedback" aria-live="polite">${prev.feedback && a.type !== "writing" && a.type !== "speaking" ? `<p class="feedback">${esc(prev.feedback)}</p>` : ""}</div><div class="activity-actions"><button id="submit-activity" class="small-button primary-small">${a.type === "writing" || a.type === "speaking" ? "Save response" : "Check my thinking"}</button></div>`;
    box.innerHTML = html;
    box.querySelectorAll("[data-inspect]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.inspect);
        const d = $(`#clue-detail-${i}`, box);
        d.hidden = !d.hidden;
        b.setAttribute("aria-expanded", String(!d.hidden));
        b.textContent = `${d.hidden ? "＋" : "−"} ${a.clues?.[i]?.label || a.options[i]}`;
        if (!d.hidden) saveClue(a.clues?.[i]?.label || a.options[i]);
      }),
    );
    box.querySelectorAll("[data-answer]").forEach((b) =>
      b.addEventListener("click", () => {
        box
          .querySelectorAll("[data-answer]")
          .forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        const ans = {
          ...(progressFor(active.id).answers[idx] || {}),
          choice: Number(b.dataset.answer),
        };
        putAnswer(idx, ans);
      }),
    );
    box.querySelectorAll("[data-branch]").forEach((b) =>
      b.addEventListener("click", () => {
        const q = progressFor(active.id);
        q.branches[idx] = Number(b.dataset.branch);
        state.progress[active.id] = q;
        save();
        renderScene();
      }),
    );
    box.querySelectorAll("[data-move]").forEach((b) =>
      b.addEventListener("click", () => {
        const list = $("#timeline-list");
        const li = b.closest("li");
        const dir = Number(b.dataset.move);
        const next = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
        if (next) {
          if (dir < 0) list.insertBefore(li, next);
          else list.insertBefore(next, li);
          list.querySelectorAll(".timeline-item").forEach((it, i) => {
            it.querySelector(".domain-tag").textContent = i + 1;
            it.querySelector('[data-move="-1"]').disabled = i === 0;
            it.querySelector('[data-move="1"]').disabled = i === list.children.length - 1;
          });
        }
      }),
    );
    $("#check-order")?.addEventListener("click", () => {
      const order = [...$("#timeline-list").children].map((x) => Number(x.dataset.item));
      const correct = JSON.stringify(order) === JSON.stringify(a.order);
      showFeedback(a, correct);
      if (correct) completeScene(idx);
    });
    box
      .querySelectorAll("#play-audio,#read-draft")
      .forEach((b) =>
        b.addEventListener("click", () =>
          speak(a.audio || $("#student-response")?.value || a.prompt),
        ),
      );
    $("#submit-activity")?.addEventListener("click", () => {
      const q = progressFor(active.id);
      let ans = q.answers[idx] || {};
      if (a.type === "writing" || a.type === "speaking") {
        const draft = $("#student-response").value.trim();
        if (!draft) {
          showFeedback(a, false, "Add a first attempt before checking your thinking.");
          return;
        }
        const count = words(draft).length;
        const old = ans.firstDraft;
        if (!old) {
          ans = {
            ...ans,
            firstDraft: draft,
            draft,
            feedback: `You named ${count} word${count === 1 ? "" : "s"}. Next, check the task criteria: ${a.criteria.join("; ").toLowerCase()}. Add a specific clue and explain how it connects to your idea, then revise.`,
          };
          putAnswer(idx, ans);
          completeIfRevisionNeeded(idx, a, ans);
          renderScene();
          $("#student-response")?.focus();
          return;
        }
        if (draft === old) {
          showFeedback(
            a,
            false,
            "Make a revision first. Add or change a detail so the second attempt improves on the first.",
          );
          return;
        }
        ans = {
          ...ans,
          draft,
          feedback: `Revision saved. Review your response against each task criterion, then use the checklist to identify the evidence and reasoning you included.`,
        };
        putAnswer(idx, ans);
        renderScene();
        completeIfRevisionNeeded(idx, a, ans);
        return;
      }
      if (a.type === "branch") {
        if (q.branches[idx] === undefined) {
          showFeedback(a, false, "Choose an investigation path before continuing.");
          return;
        }
        completeScene(idx);
        return;
      }
      if (ans.choice === undefined) {
        showFeedback(a, false, "Select a response first. Revisit the clues and try again.");
        return;
      }
      const correct = ans.choice === a.answer;
      showFeedback(a, correct);
      if (correct) {
        if (a.type === "clue" || a.type === "notebook")
          saveClue(a.clues?.[ans.choice]?.label || String(a.options[ans.choice]));
        completeScene(idx);
      } else {
        const p2 = progressFor(active.id);
        p2.answers[idx] = {
          ...ans,
          feedback:
            a.feedback ||
            `That choice does not fit the strongest evidence yet. ${a.frame || "Inspect the clues and try again."}`,
        };
        state.progress[active.id] = p2;
        save();
      }
    });
    $("#check-draft")?.addEventListener("click", () => $("#submit-activity").click());
    const record = $("#record-toggle");
    if (record) setupRecorder(record);
  }
  function words(s) {
    return s.trim().split(/\s+/).filter(Boolean);
  }
  function putAnswer(idx, ans) {
    const p = progressFor(active.id);
    p.answers[idx] = ans;
    state.progress[active.id] = p;
    save();
  }
  function showFeedback(a, ok, custom) {
    const box = $("#task-feedback");
    if (box)
      box.innerHTML = `<p class="feedback" role="status">${esc(custom || (ok ? a.feedback : `${a.feedback} ${a.frame || "Use a clue detail to revise your idea."}`))}</p>`;
    announce(custom || (ok ? a.feedback : "Review the clue and make another attempt."));
  }
  function completeIfRevisionNeeded(idx, a, ans) {
    if (ans.firstDraft && ans.draft && ans.draft !== ans.firstDraft) {
      const panel = $("#activity");
      if (panel) {
        const status = document.createElement("div");
        status.className = "feedback";
        status.setAttribute("role", "status");
        status.innerHTML = `Revision is saved. Check each criterion below. <ul>${a.criteria.map((c, i) => `<li><label><input type="checkbox" class="self-check" data-check="${i}"> ${esc(c)}</label></li>`).join("")}</ul><button id="finish-writing" class="small-button primary-small">Finish this response</button>`;
        panel.append(status);
        $("#finish-writing", status).addEventListener("click", () => {
          const checks = [...status.querySelectorAll(".self-check")];
          if (checks.length && checks.some((c) => !c.checked)) {
            status.insertAdjacentHTML(
              "beforeend",
              '<p class="frame">Review each criterion. Select the ones your response meets, then revise if a piece is missing.</p>',
            );
            return;
          }
          completeScene(idx);
        });
      }
    }
  }
  function completeScene(idx) {
    const p = progressFor(active.id);
    if (!p.done.includes(idx)) p.done.push(idx);
    if (idx < active.scenes.length - 1) p.scene = idx + 1;
    state.progress[active.id] = p;
    save();
    renderScene();
  }
  function exampleFor(a) {
    if (a.frame) return a.frame.replace(/__+/g, "a clue detail").replace(/\.{3}/g, "");
    if (a.criteria) return `A strong response will ${a.criteria.join(", ").toLowerCase()}.`;
    return "Look for a detail that is directly supported by the story.";
  }
  function activityFunction(a) {
    return (
      {
        clue: "describe and interpret a clue",
        notebook: "record a source accurately",
        sort: "classify an observation or compare details",
        dialogue: "ask and clarify",
        timeline: "sequence events",
        connect: "justify a claim with evidence",
        listening: "identify and compare oral details",
        branch: "evaluate an investigative path",
        speaking: "explain or justify orally",
        writing: "explain or argue in writing",
      }[a.type] || "interpret and communicate information"
    );
  }
  function languagePlan(a, s) {
    const selected = new URLSearchParams(location.search).get("cluster");
    const clusterId = s.band === "6-8" ? "6-8" : selected === "4-5" ? "4-5" : "2-3";
    const cluster =
      s.band === "6-8"
        ? "Grades 6–8"
        : selected === "2-3"
          ? "Grades 2–3 (Grade 3) cluster"
          : selected === "4-5"
            ? "Grades 4–5 cluster"
            : "Grades 2–3 (Grade 3) or Grades 4–5";
    const mode = ["listening", "reading"].includes(a.domain) ? "Interpretive" : "Expressive";
    const standard =
      ["garden", "sound"].includes(s.id) && s.keyUse === "Explain" ? "ELD-SC" : "ELD-LA";
    const reference =
      s.band === "3-5" && !["2-3", "4-5"].includes(selected)
        ? `${standard}.2-3.${s.keyUse}.${mode} · ${standard}.4-5.${s.keyUse}.${mode}`
        : `${standard}.${clusterId}.${s.keyUse}.${mode}`;
    const expected =
      a.options && a.answer !== undefined
        ? String(a.options[a.answer])
        : a.items && a.order
          ? a.order.map((i) => a.items[i]).join(" → ")
          : a.criteria
            ? `A response that meets: ${a.criteria.join("; ")}`
            : a.evidence || "A response consistent with the scene evidence.";
    return {
      function: activityFunction(a),
      cluster,
      expected,
      reference,
      mode,
      success: (
        a.criteria || [a.evidence || "Use a specific detail that matches the prompt."]
      ).join("; "),
    };
  }
  function setupRecorder(btn) {
    let recorder = null,
      chunks = [];
    let url = null;
    btn.addEventListener("click", async () => {
      if (recorder?.state === "recording") {
        recorder.stop();
        btn.textContent = "● Optional microphone";
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        showFeedback(
          active.scenes[progressFor(active.id).scene].activity,
          false,
          "Recording is not available here. Rehearse aloud or use Hear my draft; a microphone is never required.",
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorder = new MediaRecorder(stream);
        chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (url) URL.revokeObjectURL(url);
          url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
          let play = $("#recorded-play");
          if (!play) {
            play = document.createElement("button");
            play.id = "recorded-play";
            play.className = "small-button";
            play.textContent = "▶ Replay my recording";
            btn.parentElement.append(play);
          }
          play.onclick = () => new Audio(url).play();
          announce(
            "Recording saved temporarily in this page. Use Replay my recording to review it.",
          );
        };
        recorder.start();
        btn.textContent = "■ Stop recording";
        announce("Recording started. Select Stop recording when you finish.");
      } catch {
        showFeedback(
          active.scenes[progressFor(active.id).scene].activity,
          false,
          "Microphone access was not granted. You can still complete the speaking task by rehearsing aloud and reviewing your written plan.",
        );
        btn.textContent = "● Optional microphone";
      }
    });
  }
  function toggleGuide() {
    const guide = $("#guide");
    if (!guide.hidden) {
      guide.hidden = true;
      return;
    }
    guide.hidden = false;
    guide.innerHTML = `<p class="eyebrow">TEACHER FIELD GUIDE</p><h2>Language objectives &amp; formative evidence</h2><p>Grade clusters follow ACCESS grouping: Grade 3 uses Grades 2–3; Grades 4–5 and 6–8 remain distinct. Select a cluster for direct links. Pathways are adjustable support choices, not proficiency classifications. Activities are original practice aligned to the WIDA ELD Standards Framework (2020); no official endorsement is implied.</p><label>Launch grade cluster <select id="teacher-cluster"><option value="2-3">Grade 3 · Grades 2–3 cluster</option><option value="4-5">Grades 4–5 cluster</option><option value="6-8">Grades 6–8 cluster</option></select></label><div class="guide-grid">${stories
      .map(
        (s) =>
          `<article class="guide-card"><h3>${esc(s.title)}</h3><p><strong>Cluster:</strong> ${s.band === "3-5" ? "Grades 2–3 (Grade 3); Grades 4–5" : "Grades 6–8"}</p><p><strong>Key Language Use:</strong> ${esc(s.keyUse)} · <strong>Domain focus:</strong> ${s.teacher.domains.join(", ")}</p><p><strong>Objective:</strong> ${esc(s.objective)}</p><p><strong>Vocabulary:</strong> ${s.vocabulary.map(esc).join(", ")}</p><p><strong>Summary:</strong> ${esc(s.setting)} — ${esc(s.subtitle)}.</p><p><strong>Look for:</strong> ${esc(s.scenes.at(-1).activity.criteria?.join("; ") || s.scenes.at(-1).activity.evidence)}</p><p><strong>Follow-up:</strong> ${esc(s.teacher.followup)}</p><a data-launch="${esc(s.id)}" href="?story=${encodeURIComponent(s.id)}#reader">Direct student launch →</a> · <button class="link-button" data-copy="${esc(s.id)}">Copy launch link</button><details><summary>Activity-by-activity language evidence</summary><ul>${s.scenes
            .map((scene, i) => {
              const a = scene.activity;
              const f = activityFunction(a);
              const expected =
                a.evidence ||
                a.criteria?.join("; ") ||
                "Choose a response consistent with the evidence shown.";
              const support =
                a.frame || "Offer a model, rereading, oral rehearsal, or independent response.";
              const criteria = a.criteria?.join("; ") || a.evidence;
              return `<li><strong>Scene ${i + 1} · ${esc(scene.title)}:</strong> ${esc(f)} (${esc(a.domain)}); expected response: ${esc(expected)}; support: ${esc(support)}; success evidence: ${esc(criteria)}.</li>`;
            })
            .join("")}</ul></details></article>`,
      )
      .join(
        "",
      )}</div><section class="guide-card" style="margin-top:16px"><h3>ACCESS Skills Studio · optional original practice</h3><p>Practice tasks cover Listening, Speaking, Reading, and Writing for Grades 2–3, 4–5, and 6–8. Tasks provide attempts, retry feedback, and instructional prompts. This studio does not predict ACCESS scores.</p><label>Grade cluster <select id="access-cluster"><option value="2-3">Grades 2–3</option><option value="4-5">Grades 4–5</option><option value="6-8">Grades 6–8</option></select></label> <button class="secondary" id="open-access">Open Skills Studio</button><div id="access-task"></div></section>`;
    const clusterSelect = $("#teacher-cluster");
    const queryCluster = new URLSearchParams(location.search).get("cluster");
    if (["2-3", "4-5", "6-8"].includes(queryCluster)) clusterSelect.value = queryCluster;
    const launchUrl = (id) =>
      `?story=${encodeURIComponent(id)}&cluster=${encodeURIComponent(clusterSelect.value)}&pathway=${encodeURIComponent(state.pathway)}&domain=${encodeURIComponent(state.domain)}#reader`;
    guide.querySelectorAll("[data-launch]").forEach((a) => {
      a.href = launchUrl(a.dataset.launch);
    });
    clusterSelect.addEventListener("change", () =>
      guide
        .querySelectorAll("[data-launch]")
        .forEach((a) => (a.href = launchUrl(a.dataset.launch))),
    );
    guide.querySelectorAll("[data-copy]").forEach((b) =>
      b.addEventListener("click", async () => {
        const url = new URL(launchUrl(b.dataset.copy), location.href).href;
        try {
          await navigator.clipboard.writeText(url);
          b.textContent = "Copied";
        } catch {
          prompt("Copy student launch link:", url);
        }
      }),
    );
    $("#open-access").addEventListener("click", () => renderAccessStudio());
    guide.scrollIntoView({
      behavior: state.settings.motion ? "instant" : "smooth",
      block: "start",
    });
  }
  function renderAccessStudio() {
    const id = $("#access-cluster").value;
    const tasks = window.ACCESS_STUDIO_TASKS[id];
    const holder = $("#access-task");
    const cards = Object.entries(tasks).flatMap(([domain, base]) => [
      { ...base, domain, slot: "1" },
      ...(base.alternate ? [{ ...base.alternate, domain, slot: "2" }] : []),
    ]);
    const cardHtml = cards
      .map((task) => {
        const key = `${id}:${task.domain}:${task.slot}`;
        const saved = state.accessResponses[key] || {};
        const input = task.options
          ? `<div class="choice-list" role="group" aria-label="${esc(task.title)} responses">${task.options.map((option, i) => `<button class="choice" data-answer="${i}" aria-pressed="false">${esc(option)}</button>`).join("")}</div>`
          : `<label>My response<textarea data-response aria-label="${esc(task.title)} response" placeholder="${esc(task.frame || "Write or plan your response here.")}">${esc(saved.draft || "")}</textarea></label><p class="subtitle">${esc(task.success)}</p><button class="small-button primary-small" data-self-review>Save attempt and get feedback</button>`;
        return `<article class="guide-card" data-access="${task.domain}" data-slot="${task.slot}" data-correct="${task.answer ?? ""}"><span class="domain-tag">${domainNames[task.domain]} · TASK ${task.slot}</span><h3>${esc(task.title)}</h3><p>${esc(task.prompt)}</p>${task.audio ? `<button class="small-button" data-play="${esc(task.audio)}">▶ Listen · transcript: ${esc(task.audio)}</button>` : ""}${task.frame ? `<p class="frame">${esc(task.frame)}</p>` : ""}${input}<p class="access-feedback" aria-live="polite">${saved.feedback ? `<span class="feedback">${esc(saved.feedback)}</span>` : ""}</p><p class="subtitle"><strong>Support:</strong> ${esc(task.support || "Use the model and retry with one specific detail.")}</p></article>`;
      })
      .join("");
    holder.innerHTML = `<h3>Original practice · ${id === "2-3" ? "Grades 2–3" : id === "4-5" ? "Grades 4–5" : "Grades 6–8"}</h3><p>Each domain has two original practice prompts. Attempts and drafts save only in this browser. There is no ACCESS score or proficiency estimate.</p><div class="guide-grid">${cardHtml}</div>`;
    holder
      .querySelectorAll("[data-play]")
      .forEach((button) => button.addEventListener("click", () => speak(button.dataset.play)));
    holder.querySelectorAll("[data-answer]").forEach((button) =>
      button.addEventListener("click", () => {
        const card = button.closest(".guide-card");
        const key = `${id}:${card.dataset.access}:${card.dataset.slot}`;
        const correct = Number(button.dataset.answer) === Number(card.dataset.correct);
        if (correct) {
          button.setAttribute("aria-pressed", "true");
          state.accessDone = [...new Set([...state.accessDone, key])];
          save();
        }
        card.querySelector(".access-feedback").innerHTML =
          `<span class="feedback">${correct ? "That response matches the task evidence. Review the support and explain why it fits." : "Review the task support, then try another response."}</span>`;
      }),
    );
    holder.querySelectorAll("[data-self-review]").forEach((button) =>
      button.addEventListener("click", () => {
        const card = button.closest(".guide-card");
        const key = `${id}:${card.dataset.access}:${card.dataset.slot}`;
        const response = card.querySelector("[data-response]").value.trim();
        const prior = state.accessResponses[key] || {};
        const output = card.querySelector(".access-feedback");
        if (!response) {
          output.innerHTML =
            '<span class="feedback">Write or rehearse a first attempt before saving.</span>';
          return;
        }
        if (!prior.first) {
          const feedback =
            "First attempt saved locally. Compare it with the success look-fors, then revise with a more specific detail or clearer connection.";
          state.accessResponses[key] = { first: response, draft: response, feedback };
          save();
          output.innerHTML = `<span class="feedback">${feedback}</span>`;
          return;
        }
        if (response === prior.first) {
          output.innerHTML =
            '<span class="feedback">Revise your first attempt before submitting again. Add or change a detail.</span>';
          return;
        }
        const feedback =
          "Revision saved locally. Check each success look-for. A teacher or student can review the response; no automated language score is produced.";
        state.accessResponses[key] = { ...prior, draft: response, feedback };
        save();
        output.innerHTML = `<span class="feedback">${feedback}</span><p><label><input type="checkbox" class="access-check"> I included a detail that fits the prompt.</label></p><p><label><input type="checkbox" class="access-check"> I explained a connection or sequence.</label></p><button class="small-button" data-finish-access>Finish self-review</button>`;
        card.querySelector("[data-finish-access]").addEventListener("click", () => {
          if ([...card.querySelectorAll(".access-check")].some((box) => !box.checked)) {
            output.insertAdjacentHTML(
              "beforeend",
              '<p class="frame">Review both look-fors. Revise again if one is missing.</p>',
            );
            return;
          }
          state.accessDone = [...new Set([...state.accessDone, key])];
          save();
          output.insertAdjacentHTML(
            "beforeend",
            '<p class="feedback">Self-review complete. Response remains on this device.</p>',
          );
        });
      }),
    );
  }
  function printReport() {
    const rows = stories
      .map((s) => {
        const p = progressFor(s.id);
        const answers = Object.values(p.answers || {}).filter((x) => x.draft).length;
        return `<tr><td>${esc(s.title)}</td><td>${p.done.length}/${s.scenes.length}</td><td>${answers} saved draft(s)</td><td>${esc(s.objective)}</td></tr>`;
      })
      .join("");
    const w = window.open("", "_blank");
    if (!w) {
      alert("Allow this page to open a print window, then choose Print or Save as PDF.");
      return;
    }
    w.document.write(
      `<!doctype html><html lang="en"><meta charset="utf-8"><title>Local Case Progress Report</title><style>body{font:15px Arial;color:#24323f;margin:28px}h1{color:#17324d}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:8px;text-align:left}th{background:#eef3ef}p{max-width:850px}</style><h1>Mystery Club · Case Progress Report</h1><p>Generated from progress saved in this browser on ${new Date().toLocaleDateString()}. This report is local to this device and is not uploaded.</p><table><thead><tr><th>Case</th><th>Scenes complete</th><th>Drafts saved</th><th>Language objective</th></tr></thead><tbody>${rows}</tbody></table><p>Pathway preference: ${esc(pathwayInfo[state.pathway].label)}. Student drafts and recorded media are not included.</p><script>window.onload=()=>window.print()<\/script></html>`,
    );
    w.document.close();
  }
  window.addEventListener("DOMContentLoaded", init);
})();
