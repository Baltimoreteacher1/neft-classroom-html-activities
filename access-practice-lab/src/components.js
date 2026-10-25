// Shared UI pieces: listening player, speaking recorder, vocabulary drawer,
// self-checks, tier picker, band switch, progress ring, reading voice toolbar.
import { SPEAKING_CHECKS } from "./grade.js";
import { canRecord, takesFor } from "./recorder.js";
import { waveformSVG } from "./waveform.js";
import { canSpeak, getVoiceOptions } from "./speech.js";
import { findCognatesInText } from "./multilingual.js";
import { glossInline } from "./glossary.js";
import { INLINE_BTN } from "./evidence-ui.js";
import { splitSentences, tagLabel } from "./lang/evidence-notebook.js";
import { LISTEN_NOTE_FIELDS, listeningSegments, signalParts } from "./learning.js";
import { BASE, DOMAIN_META, LEVEL_KEYS, TIERS, asList, bandLabel, html, raw } from "./util.js";

const IGN = raw("data-nsr-ignore");

// Scripts the current page can play, keyed by player id. Views register them
// while rendering so the heard text never has to sit in the DOM.
export const scripts = new Map();
const plays = new Map();
export const playCount = (key) => plays.get(key) || 0;
export const notePlay = (key) => plays.set(key, playCount(key) + 1);

/** Big listen button for a heard script. The transcript is NOT rendered here. */
export function listenPlayerHTML(
  key,
  segments,
  { label = "Listen", rate = 0.9, test = false, maxPlays = Number.POSITIVE_INFINITY, played = null } = {},
) {
  scripts.set(key, asList(segments));
  const limited = Number.isFinite(maxPlays);
  const n = played ?? playCount(key);
  if (!canSpeak())
    return html`<div class="listen-player is-unavailable" role="note">
      <p>
        <strong>Read-aloud is not available in this browser.</strong> Ask your teacher to read the
        listening part to you.
      </p>
    </div>`;
  if (limited) {
    const left = Math.max(0, maxPlays - n);
    return html`<div class="listen-player is-limited" data-player="${key}">
    <button type="button" class="listen-btn" data-listen="${key}" aria-describedby="lp-${key}" ${left ? "" : raw("disabled")}>
      <span class="listen-icon" aria-hidden="true">▶</span>
      <span class="listen-label">${left ? (n ? "Play once more" : "Play") : "Played"}</span>
    </button>
    <div class="listen-meta" id="lp-${key}" role="status">
      <span class="listen-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
      <span>${left ? `Test conditions: you can play this recording ${left === 1 ? "one more time" : `${left} times`}. It cannot be paused.` : "Test conditions: this recording has been played. Choose your answer."}</span>
    </div>
  </div>`;
  }
  return html`<div class="listen-player" data-player="${key}">
    <button type="button" class="listen-btn" data-listen="${key}" aria-describedby="lp-${key}">
      <span class="listen-icon" aria-hidden="true">▶</span>
      <span class="listen-label">${n ? "Listen again" : label}</span>
    </button>
    <button type="button" class="ghost" data-stop-audio>■ Stop audio</button>
    <div class="listen-meta" id="lp-${key}">
      <span class="listen-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
      <span
        >${n ? `Played ${n} time${n === 1 ? "" : "s"}` : test ? "Press play. You may listen more than once." : "Press play to hear it."}</span
      >
    </div>
    <div class="speed" role="group" aria-label="Audio speed">
      <button type="button" class="speed-btn" data-rate="0.75" aria-pressed="${rate <= 0.78}">
        🐢 Slower
      </button>
      <button type="button" class="speed-btn" data-rate="0.9" aria-pressed="${rate > 0.78}">
        Normal
      </button>
    </div>
  </div>`;
}

/**
 * Reading companion bar: read-aloud (voice, speed) when the browser can speak, and the Spanish cognate lens
 * only when `cognates` is on (Learn with help). "Try independently" passes cognates: false.
 */
export function readingToolbarHTML(
  passageKey,
  segments,
  { rate = 0.9, voiceURI = "", showCognates = false, cognates = true } = {},
) {
  scripts.set(passageKey, asList(segments));
  const speech = canSpeak();
  if (!speech && !cognates) return "";
  const voices = speech ? getVoiceOptions("en") : [];

  return html`<div class="reading-toolbar" data-reading-toolbar="${passageKey}">
    <div class="reading-toolbar-controls">
      ${
        speech
          ? html`<button type="button" class="btn btn-secondary reading-play-btn" data-read-passage="${passageKey}">
        <span class="play-icon" aria-hidden="true">🎧</span>
        <span class="play-label">Read Passage Aloud</span>
      </button>
      <button type="button" class="ghost small reading-stop-btn" data-stop-audio>
        ■ Stop
      </button>

      <label class="voice-picker-label">
        <span class="visually-hidden">Choose Reading Voice</span>
        <select class="voice-select" data-select-voice aria-label="Reading voice">
          ${voices.map(
            (v) =>
              html`<option value="${v.id}" ${voiceURI === v.id || (!voiceURI && v.id === "default") ? raw("selected") : ""}>
                🎙️ ${v.name}
              </option>`,
          )}
        </select>
      </label>

      <div class="speed" role="group" aria-label="Reading speed">
        <button type="button" class="speed-btn" data-rate="0.75" aria-pressed="${rate <= 0.78}">
          🐢 0.75x
        </button>
        <button type="button" class="speed-btn" data-rate="0.9" aria-pressed="${rate > 0.78 && rate <= 0.95}">
          0.9x
        </button>
        <button type="button" class="speed-btn" data-rate="1.0" aria-pressed="${rate > 0.95}">
          1.0x
        </button>
      </div>`
          : ""
      }
      ${
        cognates
          ? html`<button
        type="button"
        class="cognate-toggle-btn ${showCognates ? "is-active" : ""}"
        data-toggle-cognates
        aria-pressed="${showCognates}"
      >
        🔍 Spanish Cognates
      </button>`
          : ""
      }
    </div>
    ${
      speech
        ? html`<p class="fine reading-helper-note">
      Tip: Click or tap any sentence in the text below (or focus it and press Enter) to hear just that sentence read aloud in your chosen voice.
    </p>`
        : ""
    }
  </div>`;
}

/**
 * Reading passage as sentence spans for voice playback and cognate exploration.
 * - `tagMode`: each sentence becomes a real <button data-nb-pick="<pickKey>|<index>"> that selects it for the
 *   Evidence Notebook (aria-pressed shows the selection); glossary words are not wrapped in this mode.
 * - `pinned`: Map(sentence index → tag id) shows a visible tag after sentences already in the notebook.
 * - `gist`: array of saved gist notes (Learn with help only) adds a "what is this paragraph mostly about?"
 *   prompt and field after each paragraph. Omit it for a clean, independent passage.
 */
export function renderPassageSentences(
  paragraphs,
  { showCognates = false, glossary = null, tagMode = false, pickKey = "", picked = -1, pinned = null, gist = null } = {},
) {
  const paras = asList(paragraphs);
  const seen = new Set();
  let globalSentIdx = 0;

  return paras.map((para, pIdx) => {
    const sentences = splitSentences(para);
    const body = html`<p>
      ${sentences.map((sentence) => {
        const sIdx = globalSentIdx++;
        const cognates = showCognates ? findCognatesInText(sentence) : [];
        const tag = pinned?.get(sIdx);
        const mark = tag ? html`<span class="badge">${tagLabel(tag)}</span> ` : "";
        if (tagMode)
          return html`<button
          type="button"
          class="reading-sentence ${sIdx === picked ? "is-active-reading-sentence" : ""}"
          style="${INLINE_BTN}"
          data-nb-pick="${pickKey}|${sIdx}"
          aria-pressed="${String(sIdx === picked)}"
        >${sentence}</button> ${mark}`;
        return html`<span
          class="reading-sentence ${cognates.length ? "has-cognates" : ""}"
          data-say="${sentence}"
          data-sent-idx="${sIdx}"
          tabindex="0"
          role="button"
          aria-label="Click to hear: ${sentence}"
        >${glossary ? glossInline(sentence, glossary, seen) : sentence} </span>${mark}`;
      })}
    </p>`;
    if (!gist) return body;
    const id = `gist-${pickKey || "p"}-${pIdx}`;
    return html`${body}<p class="field gist-prompt"><label for="${id}">💭 Gist of paragraph ${pIdx + 1}: what is it mostly about? (a few words)</label>
      <input id="${id}" type="text" data-gist="${pIdx}" value="${gist[pIdx] || ""}" autocomplete="off" ${IGN} /></p>`;
  });
}

/**
 * Transcript, shown only after an answer is checked. `interactive` (Learn with help only) adds
 * per-part replay buttons and taggable signal words; otherwise it is the plain text.
 */
export function transcriptHTML(
  key,
  segments,
  { title = "What you heard", interactive = false, tags = null, target = null, canReplay = canSpeak() } = {},
) {
  const lines = asList(segments);
  if (!lines.length) return "";
  if (!interactive)
    return html`<details class="transcript">
    <summary>📄 ${title}</summary>
    <div class="transcript-body">${lines.map((l) => html`<p>${l}</p>`)}</div>
  </details>`;
  const parts = listeningSegments(lines);
  const tagged = tags || new Set();
  // Stay open across re-renders once the learner is working in it (a diagnosed part or any tag).
  return html`<details class="transcript is-interactive" ${target != null || tags ? raw("open") : ""}>
    <summary>📄 ${title}</summary>
    <div class="transcript-body">
      <p class="fine">${canReplay ? "Press ▶ to replay one part. " : ""}Tap a signal word (however, first, not…) to tag it. Tags are only for this attempt.</p>
      <ol class="transcript-parts">
        ${parts.map(
          (seg) => html`<li class="${seg.index === target ? "is-target" : ""}" ${seg.index === target ? raw('aria-current="true"') : ""}>
            ${canReplay ? html`<button type="button" class="speed-btn" data-replay-seg="transcript:${seg.index}" aria-label="Replay part ${seg.index + 1}">▶ ${seg.index + 1}</button> ` : ""}${signalParts(seg.text).map((p, j) =>
              p.signal
                ? html`<button type="button" class="cat-chip signal-word" data-tag-signal="${seg.index}:${j}" aria-pressed="${String(tagged.has(`${seg.index}:${j}`))}" aria-label="Tag signal word ${p.text}">${p.text}</button>`
                : p.text,
            )}
          </li>`,
        )}
      </ol>
      ${tagged.size ? html`<p class="fine" role="status">Signal words tagged: ${tagged.size}</p>` : ""}
    </div>
  </details>`;
}

/**
 * Listening Strategy Lab (Learn with help only): purpose preview, part-by-part replay after the
 * first listen, and a three-field scratchpad saved on this device for this activity.
 * Part buttons are labelled by number only, so no heard text reaches the page before an answer.
 */
export function listeningStrategyHTML(key, { purpose = null, parts = [], played = false, notes = {}, open = false, canReplay = canSpeak() } = {}) {
  return html`<details class="helpers listen-strategy" data-listen-strategy="${key}" ${open ? raw("open") : ""}>
    <summary>🧭 Listening strategy lab</summary>
    <div class="helper-body">
      ${
        purpose
          ? html`<section aria-labelledby="ls-purpose-${key}">
              <h3 class="helper-title" id="ls-purpose-${key}">Before you listen: your purpose</h3>
              ${purpose.kind ? html`<p><strong>${purpose.label}.</strong> ${purpose.text}</p>` : ""}
              ${purpose.focus.length ? html`<ul>${purpose.focus.map((f) => html`<li>${f}</li>`)}</ul>` : ""}
            </section>`
          : ""
      }
      ${
        canReplay && parts.length > 1
          ? html`<section aria-labelledby="ls-replay-${key}">
              <h3 class="helper-title" id="ls-replay-${key}">Replay one part</h3>
              ${
                played
                  ? html`<div class="speed" role="group" aria-labelledby="ls-replay-${key}">
                      ${parts.map((seg) => html`<button type="button" class="speed-btn" data-replay-seg="bar:${seg.index}">▶ ${seg.kind === "turn" ? "Turn" : "Part"} ${seg.index + 1}</button>`)}
                    </div>`
                  : html`<p class="fine">Listen to the whole recording once. Then you can replay one part at a time.</p>`
              }
            </section>`
          : ""
      }
      <section aria-labelledby="ls-notes-${key}">
        <h3 class="helper-title" id="ls-notes-${key}">My listening notes</h3>
        <p class="fine">Saved only in this browser, for this activity. They are never sent anywhere or added to a progress code.</p>
        ${LISTEN_NOTE_FIELDS.map(
          ([field, label]) => html`<label class="field"><span>${label}</span><textarea rows="2" data-listen-note="${field}" ${IGN}>${notes[field] || ""}</textarea></label>`,
        )}
        <button type="button" class="ghost small" data-clear-listen-notes>Clear my notes</button>
      </section>
    </div>
  </details>`;
}

/** Wrong-answer listening diagnosis with a targeted part replay. Shown in Learn with help only. */
export function listeningTrapHTML(diag, { held = false, hint = "", canReplay = canSpeak() } = {}) {
  const part = diag.segment + 1;
  return html`<div class="feedback is-hint listen-trap" role="status">
    <p class="fb-title">${held ? "Before you see the answer, replay one part" : "Not yet — check this listening trap"}</p>
    <p>${diag.message}</p>
    ${
      canReplay
        ? html`<button type="button" class="btn" data-replay-seg="trap:${diag.segment}">▶ Replay part ${part}</button>`
        : html`<p>Ask your teacher to read part ${part} again.</p>`
    }
    ${held ? html`<p class="fine">After the replay, the answer appears here.</p>` : html`${hint ? html`<p>${hint}</p>` : ""}<button type="button" class="btn" data-retry>Try again</button>`}
  </div>`;
}

/** Recorder block for Speaking. `key` scopes takes to one activity/test item. */
export function recorderHTML(
  key,
  { prompt = "", models = null, level = "A", recording = false, level01 = 0, seconds = 0, activity = {} } = {},
) {
  const takes = takesFor(key);
  // Optional per-activity timing: a preparation countdown and a response time limit. Both off by default.
  const prep = Math.max(0, Math.floor(Number(activity.prepSeconds) || 0));
  const limit = Math.max(0, Math.floor(Number(activity.maxSeconds) || 0));
  if (!canRecord())
    return html`<div class="recorder is-unavailable">
      <p>
        <strong>This browser cannot record.</strong> Say your answer aloud to a partner or your
        teacher, then use the checklist.
      </p>
      ${models ? modelLadderHTML(models, level, activity) : ""}
    </div>`;
  return html`<section
    class="recorder ${recording ? "is-recording" : ""}"
    aria-label="Record your answer"
  >
    <p class="fine">Use a quiet place and check your headphones. Microphone permission is optional: you can practice aloud with a partner instead.</p>
    <div class="rec-main">
      ${
        recording
          ? html`<button type="button" class="rec-btn is-stop" data-rec-stop="${key}">
                <span class="rec-dot" aria-hidden="true"></span>Stop
              </button>
              <div class="rec-live" aria-live="off">
                <span class="rec-meter" style="--lvl:${level01.toFixed(2)}"></span
                ><span class="rec-time">${seconds}s${limit ? ` of ${limit}s` : ""}</span>
              </div>`
          : html`<button type="button" class="rec-btn" data-rec-start="${key}" data-rec-prep="${prep}" data-rec-max="${limit}">
              <span class="rec-dot" aria-hidden="true"></span
              >${takes.length ? "Record again" : "Record my answer"}
            </button>`
      }
      ${prompt ? html`<button type="button" class="ghost" data-say="${prompt}">🔊 Hear the question</button>` : ""}
    </div>
    ${
      takes.length
        ? html`<ol class="takes">
            ${takes.map((t, i) => html`<li><span>Try ${i + 1}${t.seconds ? ` · ${t.seconds}s` : ""}</span>${raw(waveformSVG(t.env))}<audio aria-label="Play recording ${i + 1}" controls preload="none" src="${t.url}"></audio><a class="ghost small" href="${t.url}" download="practice-recording-${i + 1}.${t.extension || "webm"}">Download this recording</a></li>`)}
          </ol>`
        : ""
    }
    ${takes.length > 1 ? compareTakesHTML(takes) : ""}
    <p class="rec-countdown" data-rec-countdown="${key}" role="status"></p>
    <p class="rec-error" data-rec-error="${key}" role="status"></p>
    <p class="fine">Listen to your answer. Choose one detail to add, then record again if you want.</p>
    <p class="fine">Recordings stay in this tab and disappear when you close or reload it. They are never uploaded. Download a recording before leaving if you want to keep it; a progress code does not include audio.</p>
    ${models ? modelLadderHTML(models, level, activity) : ""}
  </section>`;
}

// Oldest kept take against the latest. Only the three most recent takes are kept, so
// "oldest saved" is the honest label. Shows what was recorded, not a judgement of it.
function compareTakesHTML(takes) {
  const first = takes[0];
  const latest = takes[takes.length - 1];
  const cell = (label, take, n) => html`<figure class="compare-cell">
      <figcaption>${label}${take.seconds ? ` · ${take.seconds}s` : ""}</figcaption>
      ${raw(waveformSVG(take.env))}
      <audio aria-label="Play ${label.toLowerCase()}" controls preload="none" src="${take.url}"></audio>
      <span class="fine">Try ${n}</span>
    </figure>`;
  return html`<section class="compare" aria-label="Compare your tries">
    <h4>Compare your tries</h4>
    <p class="fine">Listen to both. Notice what changed, such as a reason added or a clearer ending. Length alone does not make an answer better.</p>
    <div class="compare-grid">
      ${cell("Oldest saved try", first, 1)}
      ${cell("Latest try", latest, takes.length)}
    </div>
  </section>`;
}

export function modelLadderHTML(models, level, activity = {}) {
  const rows = LEVEL_KEYS.filter((k) => models[k]);
  if (!rows.length) return "";
  return html`<details class="ladder">
    <summary>🪜 Hear answers that grow</summary>
    <p class="fine">
      Notice how each response communicates an idea. A short, specific answer can be strong.
      Borrow a useful technique, then explain your own idea. These examples are not WIDA scores.
    </p>
    <ol>
      ${rows.map(
        (k) =>
          html`<li class="${k === level ? "is-you" : ""}">
            <span class="ladder-tier">${TIERS[k].name}</span>
            <p>${models[k]}</p>
            <p class="fine"><strong>Notice:</strong> ${activity.modelNotes?.[k] || (k === "A" ? "Find the main idea. Which words make it clear?" : k === "B" ? "Find a specific detail. How does it help answer the question?" : "Find a connection between ideas. Is every detail useful?")}</p>
            <button type="button" class="ghost small" data-say="${models[k]}">🔊 Listen</button>
          </li>`,
      )}
    </ol>
  </details>`;
}

export function selfCheckHTML(checks, saved = {}, { title = "Check your answer" } = {}) {
  return html`<fieldset class="selfcheck">
    <legend>${title}</legend>
    ${checks.map(
      (c) =>
        html`<label
          ><input
            type="checkbox"
            data-selfcheck="${c.id}"
            ${saved[c.id] ? raw("checked") : ""}
            ${IGN}
          /><span>${c.label}${c.es ? html`<em lang="es">${c.es}</em>` : ""}</span></label
        >`,
    )}
  </fieldset>`;
}
export const speakingChecksHTML = (saved) =>
  selfCheckHTML(SPEAKING_CHECKS, saved, { title: "Speaking checklist" });

export function vocabHTML(activity, shared, { focused = true } = {}) {
  const terms = activity.vocabulary || [];
  const frames = focused || activity.type === "constructed" ? activity.frames || [] : [];
  const focus = focused ? activity.listenFor || activity.readFor || activity.sayFor || activity.writeFor || [] : [];
  if (!terms.length && !frames.length && !focus.length) return "";
  return html`<details class="helpers" ${focused ? raw("open") : ""}>
    <summary>💡 Helpful words and starters</summary>
    <div class="helper-body">
      ${
        focus.length
          ? html`<section>
              <h2 class="helper-title">What to listen or look for</h2>
              <ul>
                ${focus.map((f) => html`<li>${f}</li>`)}
              </ul>
            </section>`
          : ""
      }
      ${
        terms.length
          ? html`<section>
              <h2 class="helper-title">Academic words</h2>
              <dl class="vocab">
                ${terms.map(([en, def, spanish]) => {
                  return html`<div>
                    <dt>
                      <button
                        type="button"
                        class="say-word"
                        data-say="${en}"
                        aria-label="Say ${en}"
                      >
                        🔊</button
                      >${en}
                    </dt>
                    <dd>
                      ${def}${spanish ? html`<span class="es" lang="es"><button type="button" class="say-word" data-say-es="${spanish.split(":")[0]}" aria-label="Escuchar">🔊</button>${spanish}</span>` : ""}
                    </dd>
                  </div>`;
                })}
              </dl>
            </section>`
          : ""
      }
      ${
        frames.length
          ? html`<section>
              <h2 class="helper-title">Sentence starters</h2>
              <ul class="frames">
                ${frames.map((f) => html`<li>${f}</li>`)}
              </ul>
            </section>`
          : ""
      }
      ${shared?.essentialTerms?.length ? html`<p class="fine">${shared.essentialTerms.map(([en, es]) => `${en} = ${es}`).join(" · ")}</p>` : ""}
    </div>
  </details>`;
}

export function tierPickerHTML(domain, level, hrefFor) {
  return html`<nav class="tier-picker" aria-label="Choose your practice support">
    ${LEVEL_KEYS.map(
      (k) =>
        html`<a
          class="tier ${k === level ? "is-current" : ""}"
          href="${hrefFor(k)}"
          ${k === level ? raw('aria-current="page"') : ""}
        >
          <strong>${TIERS[k].name}</strong><span>${TIERS[k].range}</span>
        </a>`,
    )}
  </nav><p class="fine">Support choice changes the task set: Starting uses words and short sentences; Growing connects ideas; Expanding develops details and explanations. Each set still offers optional help. These are not WIDA scores or placement levels.</p>`;
}

export function bandSwitchHTML(band, bands) {
  if (bands.length < 2) return "";
  return html`<div class="band-switch" role="group" aria-label="Grade band">
    ${bands.map((b) => html`<button type="button" class="band-btn" data-set-band="${b}" aria-pressed="${b === band}">${bandLabel(b)}</button>`)}
  </div>`;
}

export function ringHTML(done, total, { size = 56, color = "currentColor", label = "" } = {}) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? Math.min(1, done / total) : 0;
  return raw(
    `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label || `${done} of ${total} done`}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="54%" text-anchor="middle" class="ring-text">${Math.round(pct * 100)}%</text></svg>`,
  );
}

export const domainGlyph = (d) => DOMAIN_META[d]?.glyph || "•";
export const crumbsHTML = (items) =>
  html`<nav class="crumbs" aria-label="Breadcrumb">
    <ol>
      ${items.map(([label, href]) => html`<li>${href ? html`<a href="${href}">${label}</a>` : html`<span aria-current="page">${label}</span>`}</li>`)}
    </ol>
  </nav>`;
export { BASE };
