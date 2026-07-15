import { celebrate, el, esc } from "./small-group-ui.js";

const confidenceOptions = [
  { value: 1, emoji: "🌱", label: "I need a model" },
  { value: 2, emoji: "🧭", label: "I can try with support" },
  { value: 3, emoji: "✨", label: "I can explain a step" },
];

function heading(number, eyebrow, title) {
  return el(
    "div",
    "sg-h",
    `<span class="n">${number}</span><div><div class="sg-eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2></div>`,
  );
}

function makePulse(state, key, onSelect) {
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
    pulse.appendChild(button);
  });
  return pulse;
}

function speak(text, button, lang = "en-US") {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    button.disabled = true;
    button.textContent = "Read aloud unavailable";
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.92;
  button.setAttribute("aria-pressed", "true");
  utterance.onend = () => button.setAttribute("aria-pressed", "false");
  window.speechSynthesis.speak(utterance);
}

function starterButtons(starters, textarea) {
  const row = el("div", "sg-toolrow");
  (starters || []).slice(0, 3).forEach((starter) => {
    const button = el("button", "btn ghost", esc(starter));
    button.type = "button";
    button.onclick = () => {
      textarea.value = `${starter} `;
      textarea.focus();
    };
    row.appendChild(button);
  });
  return row;
}

export function createMissionSection(config, variant, state, onDone) {
  const notice = config.noticeAndWonder || {};
  const context =
    notice.context ||
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
  copy.appendChild(makePulse(state, "before"));

  const visual = el("div", `sg-mission-visual${notice.image ? "" : " no-image"}`);
  if (notice.image) {
    const image = document.createElement("img");
    image.src = notice.image;
    image.alt = notice.imageAlt || "Visual for this lesson's math mission";
    image.loading = "eager";
    visual.appendChild(image);
  } else {
    visual.textContent = variant === "group2" ? "🔎" : "🧩";
    visual.setAttribute("aria-hidden", "true");
  }
  mission.append(copy, visual);
  section.appendChild(mission);

  const writeGrid = el("div", "sg-write-grid");
  const noticeBox = el("div", "sg-write");
  const noticeInput = el("textarea", "sg-ta");
  noticeInput.id = `${config.lessonId}-notice`;
  noticeInput.placeholder =
    variant === "group2" ? "Make a prediction or spot a pattern…" : "Write one thing you notice…";
  const noticeLabel = document.createElement("label");
  noticeLabel.htmlFor = noticeInput.id;
  noticeLabel.textContent = variant === "group2" ? "Predict" : "Notice";
  noticeBox.appendChild(noticeLabel);
  noticeBox.appendChild(starterButtons(notice.noticeStarters, noticeInput));
  noticeBox.appendChild(noticeInput);

  const wonderBox = el("div", "sg-write");
  const wonderInput = el("textarea", "sg-ta");
  wonderInput.id = `${config.lessonId}-wonder`;
  wonderInput.placeholder =
    variant === "group2"
      ? "What would you test or try to disprove?"
      : "Write one question you wonder…";
  const wonderLabel = document.createElement("label");
  wonderLabel.htmlFor = wonderInput.id;
  wonderLabel.textContent = variant === "group2" ? "Test" : "Wonder";
  wonderBox.appendChild(wonderLabel);
  wonderBox.appendChild(starterButtons(notice.wonderStarters, wonderInput));
  wonderBox.appendChild(wonderInput);
  writeGrid.append(noticeBox, wonderBox);
  section.appendChild(writeGrid);

  const launchRow = el("div", "row");
  const launch = el(
    "button",
    "btn",
    variant === "group2" ? "Enter the challenge →" : "Build it together →",
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

function translationsFor(word) {
  return [
    word.termEs ? `<span lang="es"><b>ES:</b> ${esc(word.termEs)}</span>` : "",
    word.termVi ? `<span lang="vi"><b>VI:</b> ${esc(word.termVi)}</span>` : "",
    word.termAr ? `<span lang="ar" dir="rtl"><b>AR:</b> ${esc(word.termAr)}</span>` : "",
  ].filter(Boolean);
}

export function createVocabularySection(config, onDone) {
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

  const grid = el("div", "sg-vgrid");
  words.forEach((word) => {
    const card = el("article", "sg-vcard");
    card.appendChild(el("div", "sg-vterm", esc(word.term)));
    const translations = translationsFor(word);
    if (translations.length)
      card.appendChild(el("div", "sg-vtranslations", translations.join(" · ")));
    const speaker = el("button", "sg-speak", "🔊");
    speaker.type = "button";
    speaker.setAttribute("aria-label", `Hear ${word.term}`);
    speaker.onclick = () => speak(word.term, speaker);
    card.appendChild(speaker);
    const reveal = el("button", "btn ghost", "Reveal meaning");
    reveal.type = "button";
    const definition = el(
      "div",
      "sg-vdef",
      esc(word.definition || word.visual || "Use this word in today's math talk."),
    );
    definition.hidden = true;
    reveal.onclick = () => {
      definition.hidden = !definition.hidden;
      reveal.textContent = definition.hidden ? "Reveal meaning" : "Hide meaning";
    };
    card.append(reveal, definition);
    grid.appendChild(card);
  });
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
          status.textContent = `All ${words.length} words unlocked. Use one in your team talk.`;
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
      "Small-group voices",
      variant === "group2" ? "Defend it to a skeptic" : "Talk the math through",
    ),
  );
  const card = el("div", "sg-talk");
  card.appendChild(el("p", "sg-talk-q", esc(talk.question)));

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

  const done = el("button", "btn ghost", "✓ We shared our thinking");
  done.type = "button";
  done.onclick = () => {
    done.disabled = true;
    done.textContent = "✓ Team talk complete";
    onDone();
  };
  card.appendChild(el("div", "row")).appendChild(done);
  section.appendChild(card);
  return section;
}

export function createReflectionSection(config, state, onDone) {
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
  const message = el("div", "sg-match-status");
  message.setAttribute("aria-live", "polite");
  card.appendChild(
    makePulse(state, "after", (value) => {
      const change = state.before ? value - state.before : 0;
      message.textContent =
        change > 0
          ? "Your confidence grew. Name the move that helped."
          : change === 0
            ? "Steady confidence counts. Name one idea that became clearer."
            : "Honest reflection is smart. Name the next support you will use.";
    }),
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
