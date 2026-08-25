import { getPreferredLang, setPreferredLang } from "./i18n.js";
import { renderLaunchStoryBeats } from "./premium.js";
import { figureBlock } from "./small-group-labs.js";
import {
  markScene,
  mountAuthoredArt,
  mountThemeArt,
  themeDisplayName,
} from "./small-group-storyboard.js";
import {
  celebrate,
  createVoiceMemo,
  el,
  esc,
  framesRow,
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

// --- Bonus round: "Use it in writing" (Group 2 only) -------------------------
// Group 1 and catch-up finish vocabulary with the chip cloze — a supported,
// recognition-level task. Group 2 is the enrichment tier, and following one
// multiple-choice round (the word match) with a second one (the cloze) asks
// nothing new of them. These helpers back a PRODUCTIVE round instead: the
// student writes their own sentence and gets specific, nameable feedback.

// Words too common to count as evidence that a sentence reached for the
// lesson's context. Kept small on purpose — this list only filters the
// context-word pool, it never rejects a student's sentence by itself.
const WRITE_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "both",
  "but",
  "by",
  "can",
  "each",
  "for",
  "from",
  "has",
  "have",
  "in",
  "into",
  "is",
  "it",
  "its",
  "like",
  "make",
  "makes",
  "of",
  "on",
  "one",
  "or",
  "same",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "two",
  "use",
  "used",
  "uses",
  "using",
  "was",
  "what",
  "when",
  "which",
  "with",
  "you",
  "your",
]);

const normalizeWrite = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Loose stem so "inverse operations" satisfies a prompt about "inverse
// operation" (and "multiplied" satisfies "multiply"). Deliberately generous:
// a false accept costs nothing, a false reject reads as the app calling a
// correct sentence wrong.
const writeStem = (token) => (token.length > 5 ? token.slice(0, token.length - 2) : token);

// Did the sentence actually put the term to work? A multi-word term counts
// when each of its content words appears (in any order, any inflection), so
// "I used an inverse operation" satisfies "Inverse operation".
function usesTerm(sentence, term) {
  const normalTerm = normalizeWrite(term);
  if (!normalTerm) return true;
  if (sentence.includes(normalTerm)) return true;
  const keyWords = normalTerm.split(" ").filter((token) => !WRITE_STOPWORDS.has(token));
  if (!keyWords.length) return false;
  return keyWords.every((token) => sentence.includes(writeStem(token)));
}

// Content words drawn from the word's own example/definition and the lesson
// title — the vocabulary of the math this sentence should be about.
function contextWords(word, config) {
  const pool = normalizeWrite(
    `${word.visual || ""} ${word.definition || ""} ${config.title || ""} ${config.objective || ""}`,
  ).split(" ");
  const termTokens = new Set(normalizeWrite(word.term).split(" "));
  return [
    ...new Set(
      pool.filter(
        (token) => token.length >= 4 && !WRITE_STOPWORDS.has(token) && !termTokens.has(token),
      ),
    ),
  ];
}

// Constructive check. Every failure names the ONE thing to change, and the
// student can always keep their sentence anyway (see the escape button below),
// so nothing here can trap anyone.
function checkWriting(raw, word, context) {
  const text = String(raw || "").trim();
  const sentence = normalizeWrite(text);
  const wordCount = sentence ? sentence.split(" ").length : 0;
  if (!wordCount) {
    return { ok: false, message: "Write your sentence in the box, then check it." };
  }
  if (wordCount < 6) {
    return {
      ok: false,
      message: `Good start — stretch it into a full sentence (at least 6 words). You have ${wordCount}.`,
    };
  }
  if (!usesTerm(sentence, word.term)) {
    return {
      ok: false,
      message: `Strong sentence — now work the word "${word.term}" into it.`,
    };
  }
  const definition = normalizeWrite(word.definition);
  if (definition && definition.length > 12 && sentence.includes(definition)) {
    return {
      ok: false,
      message: "That is the definition copied over. Say it in your own words instead.",
    };
  }
  const hasNumber = /\d/.test(text);
  const hasContext = context.some((token) => sentence.includes(token));
  if (!hasNumber && !hasContext) {
    return {
      ok: false,
      message:
        "Almost — tie it to today's math. Add a number, an example, or where you would use it.",
    };
  }
  return {
    ok: true,
    message: `That is your own sentence, and "${word.term}" is doing real work in it.`,
  };
}

// A sentence to compare against — never a "right answer" to be scored, only a
// model. Prefers the authored cloze (a real sentence with a real blank).
function modelSentence(word) {
  if (word.cloze?.includes("___")) return word.cloze.split("___").join(word.term.toLowerCase());
  const definition = word.definition || word.visual || "";
  const example = word.visual && word.definition ? ` For example: ${word.visual}.` : "";
  return `${word.term} means ${definition}${definition.endsWith(".") ? "" : "."}${example}`;
}

// The writing prompt: a short real context, so the student has something to
// write ABOUT rather than a bare "use it in a sentence".
function writePrompt(word) {
  if (word.visual) {
    return `Look at ${word.visual}. Write one sentence that explains what is happening — and use "${word.term}".`;
  }
  return `Teach a classmate what "${word.term}" means in today's math. Write one sentence that uses the word.`;
}

// Builds the Group 2 bonus: one card per word, each with a prompt, a place to
// write, a check that names what to fix, and a model to compare against. It is
// optional and ungated — the section is already complete when this renders.
function createWritingBonus(config, words, store, langRef) {
  // Lesson vocabulary lists lead with a concept entry whose "term" is the
  // lesson title ("Solve Multiplication and Division Equations"). That is a
  // heading, not a word — asking a student to work it into a sentence is
  // unwritable — so prefer real terms and only fall back if a lesson has none.
  const usable = words.filter((word) => word.definition || word.visual);
  const short = usable.filter((word) => word.term.trim().split(/\s+/).length <= 3);
  const picks = (short.length ? short : usable).slice(0, 4);
  if (!picks.length) return null;
  const saved = store?.get("vocabWriting") || {};
  const wrap = el("div", "sg-cloze sg-write");
  wrap.appendChild(el("div", "sg-eyebrow", "Bonus · use the word in writing"));
  wrap.appendChild(
    el(
      "p",
      "sg-write-intro",
      "No word bank this time — these are your sentences. Write one for each word, check it, then compare it with a model. You can keep your own version either way.",
    ),
  );
  const spanishLines = [];

  picks.forEach((word) => {
    const context = contextWords(word, config);
    const item = el("div", "sg-write-item");
    const fieldId = `sg-write-${normalizeWrite(word.term).split(" ").join("-")}`;

    const label = el("label", "sg-write-prompt", esc(writePrompt(word)));
    label.setAttribute("for", fieldId);
    item.appendChild(label);

    // Spanish support: the definition in the student's lane, plus permission to
    // plan in Spanish. Updated in place on a lane switch so a student mid-
    // sentence never loses their writing.
    const spanish = el("p", "sg-write-es");
    spanish.lang = "es";
    const refreshSpanish = () => {
      const lang = langRef();
      const secondary = lang && word[`definition${lang.suffix}`];
      spanish.hidden = !secondary;
      spanish.textContent = secondary
        ? `${secondary} — puedes planear tu oración en español y luego escribirla en inglés.`
        : "";
      if (lang) spanish.lang = lang.id;
    };
    refreshSpanish();
    spanishLines.push(refreshSpanish);
    item.appendChild(spanish);

    const field = document.createElement("textarea");
    field.className = "sg-write-input";
    field.id = fieldId;
    field.rows = 3;
    field.placeholder = "Write your sentence here…";
    field.value = saved[word.term] || "";
    // Save/resume: the studio store already persists this section's language
    // lane, so student writing rides the same channel (device-local only).
    field.oninput = () => {
      const next = { ...(store?.get("vocabWriting") || {}) };
      next[word.term] = field.value;
      store?.set("vocabWriting", next);
    };
    item.appendChild(field);

    const status = el("div", "sg-match-status sg-write-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const model = el("div", "sg-write-model");
    model.hidden = true;
    const showModel = () => {
      if (!model.hidden) return;
      model.innerHTML = `<span class="sg-write-modellab">A model sentence</span> ${esc(modelSentence(word))}`;
      model.hidden = false;
    };

    const actions = el("div", "sg-write-actions");
    const check = el("button", "btn sg-write-check", "Check my sentence");
    check.type = "button";
    const keep = el("button", "btn sg-write-keep", "Keep mine anyway →");
    keep.type = "button";
    keep.hidden = true;
    const peek = el("button", "btn sg-write-peek", "Show me a model sentence");
    peek.type = "button";
    // The escape hatch is present from the first render, before any attempt.
    peek.onclick = () => {
      showModel();
      status.textContent = "Compare the model with yours — what did each of you make clear?";
    };
    const accept = (message, emoji) => {
      item.classList.add("done");
      status.textContent = message;
      keep.hidden = true;
      showModel();
      store?.addTo("vocabWritingDone", word.term);
      celebrate(emoji);
    };
    check.onclick = () => {
      const result = checkWriting(field.value, word, context);
      if (result.ok) {
        accept(`${result.message} Compare it with the model below.`, "✍️");
        return;
      }
      status.textContent = result.message;
      // Second thoughts are welcome, but never required: after one miss the
      // student can accept their own sentence and move on.
      keep.hidden = false;
    };
    keep.onclick = () =>
      accept("Kept — that is your sentence. Here is a model to compare it with.", "📝");
    actions.append(check, keep, peek);
    item.append(actions, status, model);

    if (store?.has("vocabWritingDone", word.term) && field.value.trim()) {
      item.classList.add("done");
      showModel();
      status.textContent = "Saved from earlier — compare yours with the model.";
    }
    wrap.appendChild(item);
  });

  wrap.dataset.sgWriteLangHook = "1";
  wrap.__refreshLang = () => spanishLines.forEach((fn) => fn());
  return wrap;
}

export function createVocabularySection(config, variant, onDone, store = null) {
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
      variant === "group2"
        ? "Read each word and its meaning. Use the speaker to hear the word, finish the quick match, then write the words into sentences of your own."
        : "Read each word and its meaning. Use the speaker to hear the word, then finish the quick match.",
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
  // Group 2's writing bonus, if this lesson gets one — declared here so the
  // language picker below can refresh its Spanish support line.
  let bonus = null;
  const grid = el("div", "sg-vgrid sg-scene-stagger");

  if (available.length) {
    const bar = el("div", "sg-langbar");
    bar.appendChild(el("span", "block-lab", "Language:"));
    const buttons = [];
    // The device lane is read once at render time by every section, so
    // switching it must re-render the whole studio. We persist the studio's
    // structural state, so a reload lands the student back in place — now in
    // the chosen lane. Boot lane is captured so a no-op re-pick doesn't reload.
    // Reads the SHARED preference (`nt-lang`), not a studio-private key — a
    // student who picked Español in a lesson arrives here already in Spanish.
    let bootLane = "en";
    try {
      bootLane = getPreferredLang() === "es" ? "es" : "en";
    } catch {
      /* private mode */
    }
    const choose = (lang) => {
      currentLang = lang;
      const nextLane = lang ? lang.id : "en";
      store?.set("vocabLang", nextLane);
      let laneChanged = false;
      try {
        // Writing the shared preference also stamps <html lang>, which is what
        // switches the lesson engine's CSS-gated bilingual spans — so the
        // choice carries back out of the studio as well as into it.
        laneChanged = getPreferredLang() !== nextLane;
        setPreferredLang(nextLane);
      } catch {
        /* private mode — vocab cards still switch below */
      }
      buttons.forEach(([button, id]) =>
        button.setAttribute("aria-pressed", String(id === nextLane)),
      );
      renderCards();
      // Writing bonus refreshes its Spanish support IN PLACE — re-rendering it
      // would throw away a sentence the student is part-way through.
      bonus?.__refreshLang?.();
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
    const rawDef = word.definition || word.visual || `Word ${index + 1}`;
    prompt.innerHTML = `Which term means: <strong>"${esc(rawDef)}"</strong>?`;
    options.innerHTML = "";
    // Filter out target word to select max 3 distractors for clear, focused choices (max 4 total options)
    const distractors = shuffle(words.filter((w) => w.term !== word.term)).slice(0, 3);
    const roundChoices = shuffle([word, ...distractors]);
    roundChoices.forEach((candidate) => {
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

  // Bonus round. Group 2 (enrichment) PRODUCES language — the word match just
  // above was already a choose-the-right-answer task, and a chip cloze after it
  // asks for nothing new. Group 1 and catch-up keep the supported chip cloze.
  if (variant === "group2") {
    bonus = createWritingBonus(config, words, store, () => currentLang);
    if (bonus) section.appendChild(bonus);
    return section;
  }

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
      const clozeDistractors = shuffle(words.filter((w) => w.term !== word.term)).slice(0, 3);
      const clozeChoices = shuffle([word, ...clozeDistractors]);
      clozeChoices.forEach((candidate) => {
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
    // The {en, es} stem shape and its markup now live in one place
    // (framesRow in small-group-ui.js), shared with the practice renderer, so
    // the two cannot drift apart.
    card.appendChild(el("p", "block-lab", "Sentence frames"));
    const frames = framesRow(stems);
    if (frames) card.appendChild(frames);
  }
  // Academic vocabulary belongs IN the talk: when the prompt authors no word
  // bank, hand students this lesson's own math terms so the conversation
  // happens in the language of the discipline.
  const bankWords = talk.wordBank?.length
    ? talk.wordBank
    : (Array.isArray(config.vocabulary) ? config.vocabulary : [])
        .map((v) => v && v.term)
        .filter(Boolean)
        .slice(0, 5);
  if (bankWords.length) {
    card.appendChild(el("p", "block-lab", "Use these math words"));
    const bank = el("div", "sg-wordbank");
    bankWords.slice(0, 10).forEach((word) => bank.appendChild(el("span", "sg-word", esc(word))));
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
