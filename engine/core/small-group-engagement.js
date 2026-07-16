import { figureBlock } from "./small-group-labs.js";
import {
  celebrate,
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

export function isImageSource(value) {
  const source = typeof value === "string" ? value.trim() : "";
  return (
    /^(?:https?:\/\/|\/\/|data:image\/|blob:|\/|\.\.?\/)/i.test(source) ||
    /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(source)
  );
}

function makePulse(state, key, onSelect, initial) {
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

export function createMissionSection(config, variant, state, onDone, store = null) {
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
  const copy = el("div", "sg-mission-copy");
  copy.appendChild(el("p", "sg-context", esc(context)));
  const tools = el("div", "sg-toolrow");
  const read = el("button", "btn ghost", "🔊 Read the mission");
  read.type = "button";
  read.setAttribute("aria-pressed", "false");
  read.onclick = () => speak(context, read);
  tools.appendChild(read);
  copy.appendChild(tools);
  copy.appendChild(el("p", "block-lab", "Private readiness pulse"));
  copy.appendChild(
    makePulse(
      state,
      "before",
      (value) => store?.set("pulseBefore", value),
      store?.get("pulseBefore"),
    ),
  );

  const imageCandidate = missionContent.image || config.launch?.contextImage;
  const imageSrc = isImageSource(imageCandidate) ? imageCandidate : null;
  const missionFigure = imageSrc ? null : figureBlock(config.launch?.visual);
  const visual = el(
    "div",
    `sg-mission-visual${imageSrc || missionFigure ? "" : " no-image"}${missionFigure ? " has-figure" : ""}`,
  );
  if (imageSrc) {
    const image = document.createElement("img");
    image.src = imageSrc;
    image.alt = missionContent.imageAlt || "Visual for this lesson's math mission";
    image.loading = "eager";
    visual.appendChild(image);
  } else if (missionFigure) {
    visual.appendChild(missionFigure);
  } else {
    visual.textContent = variant === "group2" ? "🔎" : "🧩";
    visual.setAttribute("aria-hidden", "true");
  }
  mission.append(copy, visual);
  section.appendChild(mission);

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
  launch.onclick = () => {
    if (!state.before) {
      status.textContent = "Choose the readiness pulse that fits you right now.";
      return;
    }
    if (!complete) {
      complete = true;
      onDone();
    }
    document.getElementById("sg-build")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  launchRow.append(launch, status);
  section.appendChild(launchRow);
  return section;
}

function definitionLine(label, text, lang, dir = "ltr") {
  const line = el("p", "sg-vdef-line");
  line.lang = lang;
  line.dir = dir;
  const language = el("strong", "sg-vdef-language", esc(label));
  line.append(language, document.createTextNode(text));
  return line;
}

export function createVocabularySection(config, onDone, store = null) {
  const words = (config.vocabulary || []).slice(0, 4);
  if (!words.length) return null;
  const section = el("section", "sg-sec");
  section.id = "sg-vocab";
  section.appendChild(heading(3, "Language power", "Unlock the math words"));
  section.appendChild(
    el(
      "p",
      null,
      "Tap each card to reveal its meaning. Use the speaker to hear the word, then finish the quick match.",
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
  const grid = el("div", "sg-vgrid");

  if (available.length) {
    const bar = el("div", "sg-langbar");
    bar.appendChild(el("span", "block-lab", "Also show:"));
    const buttons = [];
    const choose = (lang) => {
      currentLang = lang;
      store?.set("vocabLang", lang ? lang.id : "en");
      buttons.forEach(([button, id]) =>
        button.setAttribute("aria-pressed", String(id === (lang ? lang.id : "en"))),
      );
      renderCards();
    };
    const englishOnly = el("button", "sg-langbtn", "English only");
    englishOnly.type = "button";
    englishOnly.setAttribute("aria-pressed", String(!currentLang));
    englishOnly.onclick = () => choose(null);
    buttons.push([englishOnly, "en"]);
    bar.appendChild(englishOnly);
    available.forEach((lang) => {
      const button = el("button", "sg-langbtn", esc(lang.label));
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
          `<span lang="${currentLang.id}" dir="${currentLang.dir}">${esc(secondaryTerm)}</span>`,
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
      const reveal = el("button", "btn ghost", "Reveal meaning");
      reveal.type = "button";
      const definition = el("div", "sg-vdef");
      definition.appendChild(
        definitionLine(
          "English",
          word.definition || word.visual || "Use this word in today's math talk.",
          "en",
        ),
      );
      const secondaryDef = currentLang && word[`definition${currentLang.suffix}`];
      if (secondaryDef)
        definition.appendChild(
          definitionLine(currentLang.label, secondaryDef, currentLang.id, currentLang.dir),
        );
      if (Array.isArray(word.examples) && word.examples.length) {
        const examples = el("div", "sg-vexamples");
        word.examples
          .slice(0, 3)
          .forEach((example) => examples.appendChild(el("span", "sg-vexample", esc(example))));
        definition.appendChild(examples);
      }
      definition.hidden = true;
      reveal.onclick = () => {
        definition.hidden = !definition.hidden;
        reveal.textContent = definition.hidden ? "Reveal meaning" : "Hide meaning";
      };
      card.append(reveal, definition);
      grid.appendChild(card);
    });
  };
  renderCards();
  section.appendChild(grid);

  const match = el("div", "sg-match");
  match.appendChild(el("div", "sg-eyebrow", "60-second word match"));
  const prompt = el("p", "sg-talk-q");
  const options = el("div", "sg-match-options");
  const status = el("div", "sg-match-status");
  status.setAttribute("aria-live", "polite");
  let index = 0;

  const renderRound = () => {
    const word = words[index];
    prompt.textContent = word.definition || word.visual || `Choose the term for word ${index + 1}.`;
    options.innerHTML = "";
    words.forEach((candidate, optionIndex) => {
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
      if (optionIndex === (index + 1) % words.length) options.prepend(button);
      else options.appendChild(button);
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
      words.forEach((candidate) => {
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
  section.appendChild(
    heading(
      4,
      "Say it out loud",
      variant === "group2" ? "Defend it to a skeptic" : "Talk the math through",
    ),
  );
  const card = el("div", "sg-talk");
  card.appendChild(el("p", "sg-talk-q", esc(talk.question)));
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
          "Conjecturer: make the claim",
          "Skeptic: challenge the claim",
          "Modeler: show another representation",
          "Reporter: share the evidence",
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
    talk.wordBank.slice(0, 7).forEach((word) => bank.appendChild(el("span", "sg-word", esc(word))));
    card.appendChild(bank);
  }

  const timer = el("div", "sg-timer");
  const clock = el("div", "sg-clock", "1:00");
  clock.setAttribute("role", "timer");
  clock.setAttribute("aria-live", "polite");
  const track = el("div", "sg-timer-track");
  const fill = el("div", "sg-timer-fill");
  track.appendChild(fill);
  const start = el("button", "btn", "Start talk timer");
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
      start.textContent = "Start talk timer";
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
  section.appendChild(heading(7, "Growth check", "Name what changed"));
  const card = el("div", "sg-reflect");
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
