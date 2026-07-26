import { figureBlock } from "./small-group-labs.js";
import {
  markScene,
  mountAuthoredArt,
  mountThemeArt,
  themeDisplayName,
} from "./small-group-storyboard.js";
import { renderLaunchStoryBeats } from "./premium.js";
import {
  celebrate,
  createVoiceMemo,
  el,
  esc,
  sectionHeading as heading,
  speak,
  studentVoice,
  VOCAB_LANGS,
} from "./small-group-ui.js";
import { configureVocabImage } from "./vocab-images.js";

const confidenceOptions = [
  { value: 1, emoji: "🌱", label: "I need a model" },
  { value: 2, emoji: "🧭", label: "I can try with support" },
  { value: 3, emoji: "✨", label: "I can explain a step" },
];

// Unbiased in-place shuffle for answer-option rows.
function shuffle(list) {
  for (let index = list.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

export function makePulse(state, key, onSelect, initial) {
  const pulse = el("div", "sg-pulse");
  pulse.setAttribute("role", "group");
  pulse.setAttribute(
    "aria-label",
    key === "before" ? "How ready do you feel?" : "How do you feel now?",
  );
  confidenceOptions.forEach((option) => {
    const button = el("button", "sg-pulse-btn", `${option.emoji} ${esc(option.label)}`);
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.onclick = () => {
      state[key] = option.value;
      [...pulse.children].forEach((child) => child.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      onSelect?.(option.value);
    };
    if (initial === option.value) {
      state[key] = option.value;
      button.setAttribute("aria-pressed", "true");
    }
    pulse.appendChild(button);
  });
  return pulse;
}

// Mission text and launch.visual are authored independently by the generator,
// so they can drift (a "Prime factors of 60" figure beside a mission about 84).
// If the figure's title/caption names an anchor number (≥ 10) the mission text
// never mentions, the figure belongs to different content — skip it.
function missionFigureMatches(visual, context) {
  const anchors = `${visual?.title || ""} ${visual?.unit || ""}`.match(/\d+(?:\.\d+)?/g) || [];
  const big = anchors.filter((value) => Number(value) >= 10);
  return !big.length || big.some((value) => String(context).includes(value));
}

export function createMissionSection(config, variant, onDone) {
  const missionContent = config.noticeAndWonder || {};
  const context =
    missionContent.context ||
    config.launch?.narrative ||
    config.contentObjective ||
    "Let's build this skill together.";
  const section = el("section", "sg-sec");
  section.id = "sg-launch";
  section.appendChild(
    heading(
      1,
      variant === "group2" ? "Challenge briefing" : "Mission briefing",
      "Launch the mission",
    ),
  );

  const mission = el("div", "sg-mission");
  const copy = el("div", "sg-mission-copy sg-scene-enter");

  // Tap-to-reveal story beats when launch.narrative has enough sentences.
  // Keep a distinct notice/wonder context paragraph when present so the
  // math-rich mission brief is never replaced by generic framing.
  const storyHost = el("div", "sg-mission-story");
  const beats = renderLaunchStoryBeats(storyHost, config);
  const narrative = (config.launch?.narrative || "").trim();
  const authoredContext = (missionContent.context || "").trim();
  const distinctContext = authoredContext && authoredContext !== narrative ? authoredContext : null;
  if (!beats) {
    storyHost.appendChild(el("p", "sg-context", esc(context)));
  } else if (distinctContext) {
    storyHost.appendChild(el("p", "sg-context", esc(distinctContext)));
  }
  copy.appendChild(storyHost);

  const speakText = [beats ? narrative : "", distinctContext || (!beats ? context : "")]
    .filter(Boolean)
    .join(" ");
  const tools = el("div", "sg-toolrow");
  const read = el("button", "btn ghost", "🔊 Read the mission");
  read.type = "button";
  read.setAttribute("aria-pressed", "false");
  read.onclick = () => speak(speakText || context, read);
  tools.appendChild(read);
  copy.appendChild(tools);

  // Photos and screenshots are gone by design: the mission panel shows the
  // lesson's math figure when one exists, otherwise theme art (storyboard skin)
  // or a quiet emoji tile.
  const missionFigure = missionFigureMatches(config.launch?.visual, context)
    ? figureBlock(config.launch?.visual)
    : null;
  const visual = el("div", `sg-mission-visual sg-scene-enter${missionFigure ? " has-figure" : ""}`);
  const themeCaption = config.launch?.contextImage || themeDisplayName(config.theme) || "";
  // A math figure that matches the problem always wins (it's part of the work);
  // otherwise prefer authored scene art, then the code-drawn theme SVG, then a
  // decorative emoji. Authored art falls back through the same chain on error.
  const sceneArt = config.launch?.sceneImage || config.sceneArt;
  const missionFallback = () => {
    if (config.theme && mountThemeArt(visual, config.theme, themeCaption, config.heroFigure)) {
      visual.classList.add("has-theme");
    } else {
      visual.classList.add("no-image");
      visual.textContent = variant === "group2" ? "🔎" : "🧩";
      visual.setAttribute("aria-hidden", "true");
    }
  };
  if (missionFigure) {
    visual.appendChild(missionFigure);
  } else if (sceneArt && mountAuthoredArt(visual, sceneArt, missionFallback)) {
    visual.classList.add("has-art");
  } else {
    missionFallback();
  }
  mission.append(copy, visual);
  section.appendChild(mission);
  markScene(section, "mission");

  const launchRow = el("div", "row");
  const launch = el(
    "button",
    "btn",
    variant === "group2" ? "Enter the challenge →" : "Start my mission →",
  );
  launch.type = "button";
  const status = el("span", "sg-match-status");
  status.setAttribute("aria-live", "polite");
  let complete = false;
  // The mission now caps the studio (after practice and supports), so it
  // hands off to the Apply workbench rather than back to Build.
  launch.onclick = () => {
    if (!complete) {
      complete = true;
      launch.textContent = "Mission accepted ✓";
      onDone();
    }
    document.getElementById("sg-apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  launchRow.append(launch, status);
  section.appendChild(launchRow);
  return section;
}

function definitionLine(label, text, lang, dir = "ltr") {
  const line = el("p", "sg-vdef-line");
  line.lang = lang;
  line.dir = dir;
  // The language tag only clarifies things when two lanes are on screen; in
  // English-only mode it is noise, so an empty label renders a clean definition.
  if (label) line.appendChild(el("strong", "sg-vdef-language", esc(label)));
  line.appendChild(document.createTextNode(text));
  return line;
}

export function createVocabularySection(config, onDone, store = null) {
  // Catch-ups span several lessons, so they keep more of their word list.
  const words = (config.vocabulary || []).slice(0, 8);
  if (!words.length) return null;
  const section = el("section", "sg-sec");
  section.id = "sg-vocab";
  section.appendChild(heading(3, "Language power", "Unlock the math words"));
  markScene(section, "vocab");
  section.appendChild(
    el(
      "p",
      null,
      "Read each word and its meaning. Use the speaker to hear the word, then finish the quick match.",
    ),
  );

  // Home-language lane picker — only shows languages this lesson carries.
  const available = VOCAB_LANGS.filter((lang) =>
    words.some((word) => word[`term${lang.suffix}`] || word[`definition${lang.suffix}`]),
  );
  let currentLang =
    available.find((lang) => lang.id === store?.get("vocabLang")) ||
    available.find((lang) => lang.id === "es") ||
    available[0] ||
    null;
  const grid = el("div", "sg-vgrid sg-scene-stagger");

  if (available.length) {
    const bar = el("div", "sg-langbar");
    bar.appendChild(el("span", "block-lab", "Language:"));
    const buttons = [];
    // The device lane is read once at render time by every section, so
    // switching it must re-render the whole studio. We persist the studio's
    // structural state, so a reload lands the student back in place — now in
    // the chosen lane. Boot lane is captured so a no-op re-pick doesn't reload.
    let bootLane = "en";
    try {
      bootLane = window.localStorage.getItem("nt-sg-lang") === "es" ? "es" : "en";
    } catch {
      /* private mode */
    }
    const choose = (lang) => {
      currentLang = lang;
      const nextLane = lang ? lang.id : "en";
      store?.set("vocabLang", nextLane);
      let laneChanged = false;
      try {
        laneChanged = window.localStorage.getItem("nt-sg-lang") !== nextLane;
        window.localStorage.setItem("nt-sg-lang", nextLane);
      } catch {
        /* private mode — vocab cards still switch below */
      }
      buttons.forEach(([button, id]) =>
        button.setAttribute("aria-pressed", String(id === nextLane)),
      );
      renderCards();
      // Reload only when the Spanish lane actually flips, so problem stems,
      // steps, and hints re-render in the chosen language.
      if (laneChanged && (nextLane === "es" || bootLane === "es")) {
        bootLane = nextLane;
        window.location.reload();
      }
    };
    const englishOnly = el("button", "sg-langbtn", "English only");
    englishOnly.type = "button";
    englishOnly.setAttribute("aria-pressed", String(!currentLang));
    englishOnly.onclick = () => choose(null);
    buttons.push([englishOnly, "en"]);
    bar.appendChild(englishOnly);
    available.forEach((lang) => {
      const button = el("button", "sg-langbtn", esc(lang.toggleLabel || lang.label));
      button.type = "button";
      button.lang = lang.id;
      button.setAttribute("aria-pressed", String(currentLang?.id === lang.id));
      button.onclick = () => choose(lang);
      buttons.push([button, lang.id]);
      bar.appendChild(button);
    });
    if (store?.get("vocabLang") === "en") currentLang = null;
    buttons.forEach(([button, id]) =>
      button.setAttribute("aria-pressed", String(id === (currentLang ? currentLang.id : "en"))),
    );
    section.appendChild(bar);
  }

  const renderCards = () => {
    grid.innerHTML = "";
    words.forEach((word) => {
      const card = el("article", "sg-vcard");
      // Vocabulary keeps its illustration (Joel directive 2026-07-16: word +
      // definition + image); the resolver supplies loading/fallback states.
      const picture = el("div", "sg-vcard-picture");
      const image = document.createElement("img");
      configureVocabImage(image, word);
      picture.appendChild(image);
      card.appendChild(picture);
      card.appendChild(el("div", "sg-vterm", esc(word.term)));
      const secondaryTerm = currentLang && word[`term${currentLang.suffix}`];
      if (secondaryTerm) {
        const translation = el(
          "div",
          "sg-vtranslations",
          `<span class="sg-vlang-tag">${esc(currentLang.id.toUpperCase())}:</span> <span lang="${currentLang.id}" dir="${currentLang.dir}">${esc(secondaryTerm)}</span>`,
        );
        if (currentLang.id === "es") {
          const speakEs = el("button", "sg-speak-inline", "🔊");
          speakEs.type = "button";
          speakEs.setAttribute("aria-label", `Escuchar ${secondaryTerm}`);
          speakEs.onclick = () => speak(secondaryTerm, speakEs, currentLang.speech);
          translation.appendChild(speakEs);
        }
        card.appendChild(translation);
      }
      const speaker = el("button", "sg-speak", "🔊");
      speaker.type = "button";
      speaker.setAttribute("aria-label", `Hear ${word.term}`);
      speaker.onclick = () => speak(word.term, speaker);
      card.appendChild(speaker);
      const definition = el("div", "sg-vdef");
      const definitionText =
        word.definition || word.visual || "Use this word in today's math talk.";
      const secondaryDef = currentLang && word[`definition${currentLang.suffix}`];
      // Label the English line only when a second lane is present to compare it to.
      const englishLine = definitionLine(secondaryDef ? "English" : "", definitionText, "en");
      const speakDef = el("button", "sg-speak-inline", "🔊");
      speakDef.type = "button";
      speakDef.setAttribute("aria-label", `Hear the meaning of ${word.term}`);
      speakDef.onclick = () => speak(definitionText, speakDef);
      englishLine.appendChild(speakDef);
      definition.appendChild(englishLine);
      if (secondaryDef)
        definition.appendChild(
          definitionLine(currentLang.label, secondaryDef, currentLang.id, currentLang.dir),
        );
      if (Array.isArray(word.examples) && word.examples.length) {
        const examples = el("div", "sg-vexamples");
        // Examples are authored as strings or {text, isExample} objects;
        // non-examples render with a ✗ so the contrast teaches too.
        word.examples.slice(0, 4).forEach((example) => {
          const isObject = typeof example === "object" && example !== null;
          const text = isObject ? example.text : example;
          if (text == null || text === "") return;
          const isExample = isObject ? example.isExample !== false : true;
          examples.appendChild(
            el(
              "span",
              `sg-vexample${isExample ? "" : " not"}`,
              `${isExample ? "✓" : "✗"} ${esc(String(text))}`,
            ),
          );
        });
        definition.appendChild(examples);
      }
      card.appendChild(definition);
      grid.appendChild(card);
    });
  };
  renderCards();
  section.appendChild(grid);

  const match = el("div", "sg-match");
  match.appendChild(el("div", "sg-eyebrow", "Quick word match"));
  const prompt = el("p", "sg-talk-q");
  const options = el("div", "sg-match-options");
  const status = el("div", "sg-match-status");
  status.setAttribute("aria-live", "polite");
  let index = 0;

  const renderRound = () => {
    const word = words[index];
    prompt.textContent = word.definition || word.visual || `Choose the term for word ${index + 1}.`;
    options.innerHTML = "";
    // Shuffled every round so the answer position never becomes a pattern.
    shuffle([...words]).forEach((candidate) => {
      const button = el("button", "sg-match-btn", esc(candidate.term));
      button.type = "button";
      button.onclick = () => {
        if (candidate.term !== word.term) {
          button.classList.add("wrong");
          button.disabled = true;
          status.textContent = "Not that word yet—compare the meaning and try another.";
          return;
        }
        button.classList.add("correct");
        status.textContent = `Yes—${word.term} matches. ${index + 1} of ${words.length} unlocked.`;
        index++;
        if (index >= words.length) {
          [...options.children].forEach((child) => (child.disabled = true));
          status.textContent = `All ${words.length} words unlocked. Say one out loud in your next step.`;
          celebrate("🔓");
          onDone();
          return;
        }
        window.setTimeout(renderRound, 450);
      };
      options.appendChild(button);
    });
  };
  match.append(prompt, options, status);
  section.appendChild(match);
  renderRound();

  // Bonus cloze round — put each word to work inside its authored sentence.
  const clozeWords = words.filter((word) => word.cloze?.includes("___"));
  if (clozeWords.length) {
    const cloze = el("div", "sg-cloze");
    cloze.appendChild(el("div", "sg-eyebrow", "Bonus · use the word"));
    const sentence = el("p", "sg-cloze-sentence");
    const chipRow = el("div", "sg-match-options");
    const clozeStatus = el("div", "sg-match-status");
    clozeStatus.setAttribute("aria-live", "polite");
    let clozeIndex = 0;
    const renderCloze = () => {
      const word = clozeWords[clozeIndex];
      sentence.innerHTML = "";
      const [before, ...rest] = word.cloze.split("___");
      sentence.appendChild(document.createTextNode(before));
      const blank = el("span", "sg-cloze-blank", "?");
      sentence.appendChild(blank);
      sentence.appendChild(document.createTextNode(rest.join("___")));
      chipRow.innerHTML = "";
      shuffle([...words]).forEach((candidate) => {
        const chip = el("button", "sg-match-btn", esc(candidate.term));
        chip.type = "button";
        chip.onclick = () => {
          if (candidate.term !== word.term) {
            chip.classList.add("wrong");
            chip.disabled = true;
            clozeStatus.textContent =
              "Read the whole sentence again — which word fits the meaning?";
            return;
          }
          blank.textContent = word.term;
          blank.classList.add("ok");
          chip.classList.add("correct");
          [...chipRow.children].forEach((child) => (child.disabled = true));
          clozeIndex++;
          if (clozeIndex >= clozeWords.length) {
            clozeStatus.textContent = "Every word placed in a real sentence. That is ownership.";
            celebrate("📚");
            return;
          }
          clozeStatus.textContent = `Sentence ${clozeIndex} of ${clozeWords.length} complete.`;
          window.setTimeout(renderCloze, 600);
        };
        chipRow.appendChild(chip);
      });
    };
    cloze.append(sentence, chipRow, clozeStatus);
    section.appendChild(cloze);
    renderCloze();
  }
  return section;
}

function talkFor(config, variant) {
  const talks = config.turnAndTalk || [];
  const preferred =
    variant === "group2" ? ["connect", "reflect", "explore"] : ["launch", "explore", "practice"];
  for (const phase of preferred) {
    const talk = talks.find((candidate) => candidate.phase === phase);
    if (talk) return talk;
  }
  return talks[0] || null;
}

export function selectedTalk(config, variant) {
  return talkFor(config, variant);
}

export function createTalkSection(config, variant, onDone) {
  const talk = talkFor(config, variant);
  if (!talk) return null;
  const section = el("section", "sg-sec");
  section.id = "sg-talk";
  markScene(section, "talk");
  section.appendChild(
    heading(
      4,
      "Say it out loud",
      variant === "group2" ? "Solve one — then check the math" : "Talk the math through",
    ),
  );
  const card = el("div", "sg-talk sg-scene-enter");
  // If this shared talk is used for Group 2, anchor it to a completed problem
  // and the lesson's mathematical check.
  if (variant === "group2")
    card.appendChild(
      el(
        "p",
        "sg-talk-lead",
        "First pick a problem you just solved. Explain the check you used and what the result means in this problem.",
      ),
    );
  card.appendChild(el("p", "sg-talk-q", esc(talk.question)));
  const talkTools = el("div", "sg-toolrow");
  const readQuestion = el("button", "btn ghost", "🔊 Read the question");
  readQuestion.type = "button";
  readQuestion.setAttribute("aria-pressed", "false");
  readQuestion.onclick = () => speak(talk.question, readQuestion);
  talkTools.appendChild(readQuestion);
  card.appendChild(talkTools);
  card.appendChild(
    el(
      "p",
      "sg-solo-note",
      "With a partner? Rotate the roles below. On your own? Answer out loud, then switch roles and argue back at yourself — explaining is how the math sticks.",
    ),
  );

  const roles =
    variant === "group2"
      ? [
          "Solver: show the steps",
          "Checker: run the lesson check",
          "Connector: explain what it means",
          "Reporter: share the result",
        ]
      : [
          "Solver: explain one step",
          "Coach: ask a helpful question",
          "Checker: test the math",
          "Reporter: share the group's idea",
        ];
  const rolebar = el("div", "sg-rolebar");
  rolebar.appendChild(el("span", "sg-role", esc(roles[0])));
  const rotate = el("button", "sg-role-btn", "↻ Rotate roles");
  rotate.type = "button";
  let roleIndex = 0;
  rotate.onclick = () => {
    roleIndex = (roleIndex + 1) % roles.length;
    rolebar.querySelector(".sg-role").textContent = roles[roleIndex];
  };
  rolebar.appendChild(rotate);
  card.appendChild(rolebar);

  const stems = (talk.stems || []).slice(0, 3);
  if (stems.length) {
    card.appendChild(el("p", "block-lab", "Sentence frames"));
    const frames = el("div", "sg-frames");
    stems.forEach((stem) => {
      const text = typeof stem === "string" ? stem : stem.en;
      const spanish =
        typeof stem === "object" && stem.es ? ` <span lang="es">· ${esc(stem.es)}</span>` : "";
      frames.appendChild(el("span", "sg-frame", `${esc(text)}${spanish}`));
    });
    card.appendChild(frames);
  }
  if (talk.wordBank?.length) {
    card.appendChild(el("p", "block-lab", "Word bank"));
    const bank = el("div", "sg-wordbank");
    talk.wordBank
      .slice(0, 10)
      .forEach((word) => bank.appendChild(el("span", "sg-word", esc(word))));
    card.appendChild(bank);
  }

  const timer = el("div", "sg-timer");
  const clock = el("div", "sg-clock", "1:00");
  // role=timer without aria-live: a per-second countdown must not narrate
  // sixty updates to a screen reader.
  clock.setAttribute("role", "timer");
  const track = el("div", "sg-timer-track");
  const fill = el("div", "sg-timer-fill");
  track.appendChild(fill);
  const start = el("button", "btn", "Start optional talk timer");
  start.type = "button";
  let remaining = 60;
  let interval = 0;
  const draw = () => {
    clock.textContent = `0:${String(remaining).padStart(2, "0")}`;
    fill.style.width = `${(remaining / 60) * 100}%`;
  };
  start.onclick = () => {
    if (interval) {
      window.clearInterval(interval);
      interval = 0;
      remaining = 60;
      start.textContent = "Start optional talk timer";
      draw();
      return;
    }
    start.textContent = "Reset timer";
    interval = window.setInterval(() => {
      remaining--;
      draw();
      if (remaining <= 0) {
        window.clearInterval(interval);
        interval = 0;
        clock.textContent = "Share!";
        start.textContent = "Start again";
      }
    }, 1000);
  };
  timer.append(clock, track, start);
  card.appendChild(timer);

  // Optional "record our best explanation" — device-local playback only, so a
  // group can hear their reasoning back and refine it (ties into the reciprocal-
  // questioning discourse work). Never uploads; nothing to grade.
  card.appendChild(
    createVoiceMemo(
      variant === "group2"
        ? "Optional: record your explanation of the check and what the result means."
        : "Optional: record your group’s best explanation, then play it back.",
    ),
  );

  const done = el("button", "btn ghost", "✓ I said my thinking out loud");
  done.type = "button";
  done.onclick = () => {
    done.disabled = true;
    done.textContent = "✓ Talk complete";
    onDone();
  };
  card.appendChild(el("div", "row")).appendChild(done);
  section.appendChild(card);
  return section;
}

export function createReflectionSection(config, state, onDone, store = null) {
  const section = el("section", "sg-sec");
  section.id = "sg-reflect";
  section.hidden = true;
  markScene(section, "reflect");
  section.appendChild(heading(7, "Growth check", "Name what changed"));
  const card = el("div", "sg-reflect sg-scene-enter");
  const growth = el("div", "sg-growth");
  growth.appendChild(el("div", "sg-growth-icon", "🌱"));
  const copy = el(
    "div",
    null,
    `<h3>You did real mathematical work.</h3><p>Choose how you feel now. Growth can mean a clearer step, a better question, or a stronger explanation.</p>`,
  );
  growth.appendChild(copy);
  card.appendChild(growth);

  // Success-criteria self-check — the same goals promised in the learning
  // map, restated as claims the student can now honestly tap to own.
  const criteria = [
    config.contentObjective && studentVoice(config.contentObjective),
    config.languageObjective && studentVoice(config.languageObjective),
    config.launch?.conceptIntro?.keyIdea &&
      `I can explain the key idea: ${config.launch.conceptIntro.keyIdea}`,
  ].filter(Boolean);
  if (criteria.length) {
    const checklist = el("div", "sg-criteria");
    checklist.appendChild(
      el("span", "block-lab", "Check your goals — tap each one you can honestly claim"),
    );
    let met = 0;
    criteria.forEach((criterion, index) => {
      const item = el(
        "button",
        "sg-checkstep",
        `<span class="tick">•</span><span>${esc(criterion)}</span>`,
      );
      item.type = "button";
      item.setAttribute("aria-pressed", "false");
      const claim = () => {
        item.classList.add("on");
        item.setAttribute("aria-pressed", "true");
        item.querySelector(".tick").textContent = "✓";
      };
      item.onclick = () => {
        if (item.classList.contains("on")) return;
        claim();
        store?.addTo("criteriaMet", index);
        if (++met >= criteria.length) celebrate("🎯");
      };
      if (store?.has("criteriaMet", index)) {
        claim();
        met++;
      }
      checklist.appendChild(item);
    });
    card.appendChild(checklist);
  }
  const message = el("div", "sg-match-status");
  message.setAttribute("aria-live", "polite");
  card.appendChild(
    makePulse(
      state,
      "after",
      (value) => {
        store?.set("pulseAfter", value);
        const change = state.before ? value - state.before : 0;
        message.textContent =
          change > 0
            ? "Your confidence grew. Name the move that helped."
            : change === 0
              ? "Steady confidence counts. Name one idea that became clearer."
              : "Honest reflection is smart. Name the next support you will use.";
      },
      store?.get("pulseAfter"),
    ),
  );
  const label = document.createElement("label");
  label.htmlFor = `${config.lessonId}-growth`;
  label.className = "block-lab";
  label.textContent = "One move that helped me…";
  const response = el("textarea", "sg-ta");
  response.id = label.htmlFor;
  response.placeholder = "A model, a hint, a question, a partner explanation…";
  response.value = store?.get("growthNote") || "";
  response.oninput = () => store?.set("growthNote", response.value);
  const finish = el("button", "btn", "Finish the studio");
  finish.type = "button";
  let complete = false;
  finish.onclick = () => {
    if (!state.after) {
      message.textContent = "Choose the confidence pulse that fits you now.";
      return;
    }
    if (!complete) {
      complete = true;
      onDone();
      celebrate("🎉");
    }
    finish.disabled = true;
    finish.textContent = "Studio complete ✓";
    message.textContent = "Your thinking is the win. You are ready for the next move.";
  };
  card.append(label, response, el("div", "row"));
  card.lastElementChild.append(finish, message);
  section.appendChild(card);
  return {
    section,
    reveal: () => {
      section.hidden = false;
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  };
}
