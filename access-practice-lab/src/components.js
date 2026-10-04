// Shared UI pieces: listening player, speaking recorder, vocabulary drawer,
// self-checks, tier picker, band switch, progress ring.
import { SPEAKING_CHECKS } from "./grade.js";
import { canRecord, takesFor } from "./recorder.js";
import { canSpeak } from "./speech.js";
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
  { label = "Listen", rate = 0.9, test = false } = {},
) {
  scripts.set(key, asList(segments));
  const n = playCount(key);
  if (!canSpeak())
    return html`<div class="listen-player is-unavailable" role="note">
      <p>
        <strong>Read-aloud is not available in this browser.</strong> Ask your teacher to read the
        listening part to you.
      </p>
    </div>`;
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

export function transcriptHTML(key, segments, { title = "What you heard" } = {}) {
  const lines = asList(segments);
  if (!lines.length) return "";
  return html`<details class="transcript">
    <summary>📄 ${title}</summary>
    <div class="transcript-body">${lines.map((l) => html`<p>${l}</p>`)}</div>
  </details>`;
}

/** Recorder block for Speaking. `key` scopes takes to one activity/test item. */
export function recorderHTML(
  key,
  { prompt = "", models = null, level = "A", recording = false, level01 = 0, seconds = 0, activity = {} } = {},
) {
  const takes = takesFor(key);
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
                ><span class="rec-time">${seconds}s</span>
              </div>`
          : html`<button type="button" class="rec-btn" data-rec-start="${key}">
              <span class="rec-dot" aria-hidden="true"></span
              >${takes.length ? "Record again" : "Record my answer"}
            </button>`
      }
      ${prompt ? html`<button type="button" class="ghost" data-say="${prompt}">🔊 Hear the question</button>` : ""}
    </div>
    ${
      takes.length
        ? html`<ol class="takes">
            ${takes.map((t, i) => html`<li><span>Try ${i + 1}${t.seconds ? ` · ${t.seconds}s` : ""}</span><audio aria-label="Play recording ${i + 1}" controls preload="none" src="${t.url}"></audio><a class="ghost small" href="${t.url}" download="practice-recording-${i + 1}.${t.extension || "webm"}">Download this recording</a></li>`)}
          </ol>`
        : ""
    }
    <p class="rec-error" data-rec-error="${key}" role="status"></p>
    <p class="fine">Listen to your answer. Choose one detail to add, then record again if you want.</p>
    <p class="fine">Recordings stay in this tab and disappear when you close or reload it. They are never uploaded. Download a recording before leaving if you want to keep it; a progress code does not include audio.</p>
    ${models ? modelLadderHTML(models, level, activity) : ""}
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
  return html`<details class="helpers">
    <summary>💡 Help: words &amp; sentence starters <span lang="es">· Ayuda</span></summary>
    <div class="helpers-body">
      ${
        focus.length
          ? html`<section>
              <h2 class="helper-title">A focused clue after your attempt</h2>
              <ul class="chips">
                ${focus.map((f) => html`<li>${f}</li>`)}
              </ul>
            </section>`
          : ""
      }
      ${
        terms.length
          ? html`<section>
              <h2 class="helper-title">Vocabulary support</h2>
              <dl class="vocab">
                ${terms.map(([en, def, es]) => {
                  const spanish = String(es || "").replace(
                    /^\s*(spanish|español|espanol)\s*:\s*/i,
                    "",
                  );
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
