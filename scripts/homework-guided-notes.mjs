/**
 * Guided family notes content + HTML sections for interactive homework.
 * Derives bilingual EN/ES content from lesson config.json fields.
 */

import {
  plainObjective,
  translateFamilyText,
  translateLanguageObjective,
  translateConceptLine,
  spanishKernel,
  spanishKeyIdea,
  polishSpanish,
} from "./homework-spanish.mjs";

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function firstTurnAndTalk(config) {
  const talks = Array.isArray(config.turnAndTalk) ? config.turnAndTalk : [];
  return talks[0] || null;
}

function conceptIntro(config) {
  return config.launch?.conceptIntro || config.explore?.conceptIntro || null;
}

function keyIdea(config) {
  const intro = conceptIntro(config);
  if (intro?.keyIdea) return intro.keyIdea;
  if (intro?.intro) return intro.intro;
  const talk = firstTurnAndTalk(config);
  return talk?.kernel || config.contentObjective || "";
}

function keyIdeaEs(config) {
  return spanishKeyIdea(config);
}

function learningTonight(config) {
  const vocab = config.vocabulary || [];
  const en =
    config.familyNotes?.learningTonight?.en ||
    plainObjective(config.contentObjective) ||
    config.title ||
    "tonight's math idea";
  const es =
    config.familyNotes?.learningTonight?.es ||
    config.contentObjectiveEs ||
    translateFamilyText(config.contentObjective, vocab) ||
    `Practicar: ${config.title || "la lección de hoy"}`;
  return { en, es };
}

function languageTonightEs(config) {
  const vocab = config.vocabulary || [];
  return (
    config.languageObjectiveEs ||
    translateLanguageObjective(config.languageObjective, vocab) ||
    "Usen las palabras del vocabulario al explicar."
  );
}

function buildConceptSteps(config) {
  const intro = conceptIntro(config);
  const custom = config.familyNotes?.conceptSteps;
  if (Array.isArray(custom) && custom.length) return custom;

  const vocab = config.vocabulary || [];
  const lines = [];
  if (intro?.intro) {
    lines.push({
      en: intro.intro,
      es: intro.introEs || polishSpanish(translateConceptLine(intro.intro, vocab), config),
    });
  }
  if (intro?.iDo?.lines) {
    intro.iDo.lines.slice(0, 4).forEach((line, i) => {
      lines.push({
        en: line,
        es: intro.iDo.linesEs?.[i] || polishSpanish(translateConceptLine(line, vocab), config),
      });
    });
  }
  if (lines.length < 2 && intro?.keyIdea) {
    lines.push({ en: intro.keyIdea, es: keyIdeaEs(config) });
  }
  if (lines.length < 2) {
    const talk = firstTurnAndTalk(config);
    if (talk?.kernel) {
      lines.push({
        en: talk.kernel,
        es: spanishKernel(config) || keyIdeaEs(config),
      });
    }
  }
  return lines.slice(0, 4).map((row, idx) => ({
    stepNum: idx + 1,
    en: row.en,
    es: row.es,
  }));
}

function watchForCues(config) {
  const custom = config.familyNotes?.watchFor;
  if (Array.isArray(custom) && custom.length) return custom;

  const vocab = (config.vocabulary || []).slice(0, 3);
  const cues = vocab.map((v) => ({
    icon: "👀",
    en: `Listen for the word "${v.term}" — it means: ${v.definition}`,
    es: `Escucha la palabra "${v.termEs || v.term}" — significa: ${v.definitionEs || v.definition}`,
  }));

  if (cues.length < 2) {
    cues.push({
      icon: "✋",
      en: "Let your student try first. Ask \"What do you notice?\" before giving hints.",
      es: "Deja que tu estudiante intente primero. Pregunta \"¿Qué observas?\" antes de dar pistas.",
    });
  }
  return cues.slice(0, 3);
}

function tryTogetherActivity(config) {
  const custom = config.familyNotes?.tryTogether;
  if (custom) return custom;

  const intro = conceptIntro(config);
  const weDo = intro?.weDo;
  const explore = config.explore;
  const narrative = config.launch?.narrative || config.explore?.narrative || "";

  const steps = [];
  const vocab = config.vocabulary || [];
  if (weDo?.lines?.length) {
    weDo.lines.forEach((line, i) => {
      steps.push({
        en: line,
        es: weDo.linesEs?.[i] || translateConceptLine(line, vocab),
        hint:
          i === weDo.lines.length - 1
            ? "Both numbers must change the same way."
            : "Point to each number as you talk.",
        hintEs:
          i === weDo.lines.length - 1
            ? "Ambos números deben cambiar de la misma manera."
            : "Señalen cada número mientras hablan.",
      });
    });
  } else if (explore?.instructions) {
    steps.push({
      en: explore.instructions,
      es: translateConceptLine(explore.instructions, vocab) ||
        "Completen la tabla o el diagrama juntos, una fila a la vez.",
      hint: "Use pencil and paper if the screen feels crowded.",
      hintEs: "Usen lápiz y papel si la pantalla se siente llena.",
    });
    steps.push({
      en: "Check: did BOTH parts change the same way?",
      es: "Verifiquen: ¿cambiaron AMBAS partes de la misma manera?",
      hint: "This is the big idea of the lesson.",
      hintEs: "Esta es la idea principal de la lección.",
    });
  } else {
    const talk = firstTurnAndTalk(config);
    steps.push({
      en: talk?.question || "Ask your student to explain today's idea using one vocabulary word.",
      es: "Pídele a tu estudiante que explique la idea de hoy usando una palabra del vocabulario.",
      hint: "A complete sentence is enough — perfection is not the goal.",
      hintEs: "Una oración completa es suficiente — no busquen perfección.",
    });
    steps.push({
      en: "Sketch or act out the situation together (measuring cups, blocks, coins — anything at home).",
      es: "Dibujen o actúen la situación juntos (tazas, bloques, monedas — lo que tengan en casa).",
      hint: "Hands-on beats memorizing steps.",
      hintEs: "Hacerlo con las manos es mejor que memorizar pasos.",
    });
  }

  return {
    titleEn: weDo?.title || "Try this together",
    titleEs: weDo?.titleEs || "Inténtenlo juntos",
    scenarioEn: narrative ? narrative.split(".")[0] + "." : "",
    scenarioEs: narrative
      ? translateConceptLine(narrative.split(".")[0], config.vocabulary || []) ||
        "Usen la historia de la lección para conectar la matemática con la vida real."
      : "",
    steps: steps.slice(0, 4),
  };
}

function stuckTips(config) {
  const custom = config.familyNotes?.stuckTips;
  if (custom) return custom;

  return {
    say: [
      {
        en: "What do you already know that could help?",
        es: "¿Qué ya sabes que podría ayudarte?",
      },
      {
        en: "Can you draw a picture or table for this?",
        es: "¿Puedes dibujar un dibujo o una tabla para esto?",
      },
      {
        en: "Let's check one step at a time — no rush.",
        es: "Revisemos un paso a la vez — sin prisa.",
      },
    ],
    dontSay: [
      {
        en: "That's wrong — let me just tell you.",
        es: "Está mal — déjame decírtelo yo.",
      },
      {
        en: "I was never good at math either.",
        es: "Yo tampoco era bueno en matemáticas.",
      },
      {
        en: "This should be easy.",
        es: "Esto debería ser fácil.",
      },
    ],
  };
}

function conceptVisualSvg(config) {
  const unit = Number(config.unit) || 0;
  const standard = String(config.standard || "");
  const themeEmoji = config.themeEmoji || "📚";

  if (unit === 3 || standard.startsWith("6.RP")) {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Ratio table example">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#dff2ee" stroke="#1fa6a2" stroke-width="2"/>
        <text x="210" y="48" text-anchor="middle" font-size="14" font-weight="700" fill="#12355b">Ratio Table / Tabla de razones</text>
        ${[
          ["Batch", "A", "B"],
          ["1", "2", "3"],
          ["2", "4", "6"],
          ["3", "6", "9"],
        ]
          .map((row, r) =>
            row
              .map((cell, c) => {
                const x = 40 + c * 110;
                const y = 70 + r * 28;
                const fill = r === 0 ? "#12355b" : "#ffffff";
                const color = r === 0 ? "#ffffff" : "#21313f";
                return `<rect x="${x}" y="${y}" width="100" height="24" rx="4" fill="${fill}" stroke="#d7e2ed"/><text x="${x + 50}" y="${y + 16}" text-anchor="middle" font-size="12" font-weight="600" fill="${color}">${cell}</text>`;
              })
              .join(""),
          )
          .join("")}
        <text x="210" y="188" text-anchor="middle" font-size="11" fill="#5f6f80">× same number on BOTH columns → equivalent ratio</text>
      </svg>`;
  }

  if (unit === 6 || standard.startsWith("6.EE")) {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Exponent example">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fef7e0" stroke="#f2c15b" stroke-width="2"/>
        <text x="60" y="70" font-size="42" font-weight="800" fill="#12355b">2</text>
        <text x="78" y="55" font-size="22" font-weight="800" fill="#d9795d">3</text>
        <text x="120" y="70" font-size="28" fill="#12355b">= 2 × 2 × 2 = 8</text>
        <text x="40" y="110" font-size="13" fill="#21313f">Base = 2 · Exponent = 3 · Multiply 2 three times</text>
        <text x="40" y="135" font-size="13" fill="#21313f" lang="es">Base = 2 · Exponente = 3 · Multiplica 2 tres veces</text>
        <text x="40" y="165" font-size="12" fill="#5f6f80">${themeEmoji} NOT 2 + 2 + 2 — that's addition!</text>
      </svg>`;
  }

  if (unit >= 10 || standard.startsWith("6.G")) {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Volume prism">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fce6de" stroke="#d9795d" stroke-width="2"/>
        <polygon points="80,140 180,140 210,110 110,110" fill="#dff2ee" stroke="#1fa6a2" stroke-width="2"/>
        <polygon points="180,140 210,110 210,60 180,90" fill="#b8ddd8" stroke="#1fa6a2" stroke-width="2"/>
        <polygon points="80,140 110,110 110,60 80,90" fill="#1fa6a2" opacity="0.35" stroke="#1fa6a2" stroke-width="2"/>
        <text x="95" y="155" font-size="11" fill="#12355b">L</text>
        <text x="195" y="155" font-size="11" fill="#12355b">W</text>
        <text x="218" y="88" font-size="11" fill="#12355b">H</text>
        <text x="240" y="80" font-size="16" font-weight="700" fill="#12355b">V = L × W × H</text>
        <text x="240" y="105" font-size="13" fill="#21313f">Volume = cubic units (in³)</text>
        <text x="240" y="125" font-size="13" fill="#21313f" lang="es">Volumen = unidades cúbicas (in³)</text>
      </svg>`;
  }

  const steps = buildConceptSteps(config);
  return `
    <div class="concept-fallback-visual" aria-hidden="true">
      ${steps
        .slice(0, 3)
        .map(
          (s, i) =>
            `<div class="concept-fallback-step step-color-${i + 1}"><span class="step-dot">${i + 1}</span><span>${esc(s.en.split(".")[0])}</span></div>`,
        )
        .join("")}
    </div>`;
}

export function selectQuickCheckProblems(practice = {}) {
  const onLevel = Array.isArray(practice.onLevel) ? practice.onLevel : [];
  const approaching = Array.isArray(practice.approaching) ? practice.approaching : [];
  const optional = Array.isArray(practice.optional) ? practice.optional : [];
  const pool = [...approaching, ...onLevel, ...optional].filter(isPrintable);
  const preferred = pool.filter((p) =>
    ["multiple-choice", "drag-sort", "matching-game", "fill-table"].includes(p.type),
  );
  const picked = (preferred.length ? preferred : pool).slice(0, 2);
  return picked;
}

function isPrintable(it) {
  if (!it || typeof it !== "object") return false;
  return [
    "multiple-choice",
    "fill-table",
    "matching-game",
    "drag-sort",
    "error-analysis",
    "open-response",
  ].includes(it.type);
}

export function renderWelcomeBanner(config, lessonId) {
  const themeEmoji = config.themeEmoji || "🏠";
  const title = config.title || "Tonight's Lesson";
  const unit = config.unit || 1;
  const standard = config.standard || "";

  return `
    <header class="family-welcome card" aria-label="Family Math Night welcome">
      <div class="welcome-hero">
        <span class="welcome-emoji" aria-hidden="true">${esc(themeEmoji)}</span>
        <div class="welcome-titles">
          <p class="welcome-tag">Unit ${unit} · ${esc(standard)}</p>
          <h1 class="welcome-title-en">Family Math Night</h1>
          <h1 class="welcome-title-es" lang="es">Ayuda a tu estudiante</h1>
          <p class="welcome-lesson">${esc(title)} · Lesson ${esc(lessonId)}</p>
        </div>
      </div>
      <p class="welcome-lead bilingual-block">
        <span class="lang-en"><strong>English:</strong> You don't need to be a math expert. This page helps you <em>guide</em> your student — with pictures, steps, and words in both languages.</span>
        <span class="lang-es" lang="es"><strong>Español:</strong> No necesitas ser experto en matemáticas. Esta página te ayuda a <em>guiar</em> a tu estudiante — con dibujos, pasos y palabras en dos idiomas.</span>
      </p>
      <a href="/curriculum/" class="back-link">⬅ Curriculum Hub / Centro curricular</a>
    </header>`;
}

export function renderLearningTonight(config) {
  const { en, es } = learningTonight(config);
  const langObj = config.languageObjective || "";
  const langObjEs = languageTonightEs(config);

  return `
    <section class="guided-section card section-learn" aria-label="What we are learning tonight">
      <h2 class="section-title">📖 What we're learning tonight / Qué aprendemos hoy</h2>
      <div class="bilingual-grid">
        <div class="bilingual-col lang-en">
          <span class="lang-label">English</span>
          <p class="learning-big">${esc(en.charAt(0).toUpperCase() + en.slice(1))}.</p>
          ${langObj ? `<p class="learning-sub">Also practice saying: <em>${esc(plainObjective(langObj))}</em></p>` : ""}
        </div>
        <div class="bilingual-col lang-es" lang="es">
          <span class="lang-label">Español</span>
          <p class="learning-big">${esc(es.endsWith(".") ? es : `${es}.`)}</p>
          ${langObj ? `<p class="learning-sub">También practiquen: <em>${esc(langObjEs.replace(/^Puedo\s/i, "").replace(/\.$/, ""))}</em></p>` : ""}
        </div>
      </div>
    </section>`;
}

export function renderConceptExplainer(config) {
  const steps = buildConceptSteps(config);
  const keyEn = keyIdea(config);
  const keyEs = keyIdeaEs(config);

  return `
    <section class="guided-section card section-visual" aria-label="Visual concept explainer">
      <h2 class="section-title">🎯 The big idea / La idea principal</h2>
      <div class="concept-visual-wrap">${conceptVisualSvg(config)}</div>
      <div class="key-idea-banner">
        <p class="lang-en"><strong>Watch for this:</strong> ${esc(keyEn)}</p>
        <p class="lang-es" lang="es"><strong>Observa esto:</strong> ${esc(keyEs)}</p>
      </div>
      <ol class="guided-steps">
        ${steps
          .map(
            (s) => `
          <li class="guided-step step-color-${s.stepNum}">
            <span class="step-badge">Step ${s.stepNum} / Paso ${s.stepNum}</span>
            <p class="lang-en">${esc(s.en)}</p>
            <p class="lang-es" lang="es">${esc(s.es)}</p>
          </li>`,
          )
          .join("")}
      </ol>
      <ul class="watch-for-list">
        ${watchForCues(config)
          .map(
            (c) => `
          <li>
            <span class="watch-icon">${c.icon}</span>
            <div>
              <p class="lang-en">${esc(c.en)}</p>
              <p class="lang-es" lang="es">${esc(c.es)}</p>
            </div>
          </li>`,
          )
          .join("")}
      </ul>
    </section>`;
}

export function renderTryTogether(config) {
  const activity = tryTogetherActivity(config);

  return `
    <section class="guided-section card section-together" aria-label="Try this together">
      <h2 class="section-title">🤝 Try this together / Inténtenlo juntos</h2>
      ${
        activity.scenarioEn
          ? `<p class="try-scenario lang-en">${esc(activity.scenarioEn)}</p>
             <p class="try-scenario lang-es" lang="es">${esc(activity.scenarioEs)}</p>`
          : ""
      }
      <p class="try-together-note bilingual-block">
        <span class="lang-en">Work side by side. You ask questions; your student does the thinking.</span>
        <span class="lang-es" lang="es">Trabajen juntos. Tú haces preguntas; tu estudiante piensa.</span>
      </p>
      <ol class="together-steps">
        ${activity.steps
          .map(
            (step, i) => `
          <li class="together-step step-color-${(i % 4) + 1}">
            <div class="together-step-head">
              <span class="step-badge">Step ${i + 1} / Paso ${i + 1}</span>
            </div>
            <p class="lang-en"><strong>First…</strong> ${esc(step.en)}</p>
            <p class="lang-es" lang="es"><strong>Primero…</strong> ${esc(step.es)}</p>
            ${
              step.hint
                ? `<p class="step-hint">💡 ${esc(step.hint)} · ${esc(
                    step.hintEs ||
                      "Tómense su tiempo — el proceso importa más que la respuesta perfecta.",
                  )}</p>`
                : ""
            }
          </li>`,
          )
          .join("")}
      </ol>
    </section>`;
}

export function renderStuckSection(config) {
  const tips = stuckTips(config);

  return `
    <section class="guided-section card section-stuck" aria-label="If your student gets stuck">
      <h2 class="section-title">💬 If your student gets stuck / Si se atora</h2>
      <div class="stuck-grid">
        <div class="stuck-panel stuck-say">
          <h3 class="stuck-heading">✅ What to say / Qué decir</h3>
          <ul>
            ${tips.say
              .map(
                (t) => `<li><p class="lang-en">${esc(t.en)}</p><p class="lang-es" lang="es">${esc(t.es)}</p></li>`,
              )
              .join("")}
          </ul>
        </div>
        <div class="stuck-panel stuck-dont">
          <h3 class="stuck-heading">🚫 What NOT to say / Qué evitar</h3>
          <ul>
            ${tips.dontSay
              .map(
                (t) => `<li><p class="lang-en">${esc(t.en)}</p><p class="lang-es" lang="es">${esc(t.es)}</p></li>`,
              )
              .join("")}
          </ul>
        </div>
      </div>
      <p class="stuck-footer bilingual-block">
        <span class="lang-en">Struggle is part of learning. Short breaks and snacks are allowed!</span>
        <span class="lang-es" lang="es">La dificultad es parte del aprendizaje. ¡Descansos y meriendas están permitidos!</span>
      </p>
    </section>`;
}

export function renderCelebration() {
  return `
    <section class="guided-section card section-celebrate" aria-label="Celebration">
      <h2 class="section-title">🎉 You did it together! / ¡Lo lograron juntos!</h2>
      <p class="celebrate-text lang-en">High five! Whether every answer was perfect or not, you showed up for your student tonight. That matters.</p>
      <p class="celebrate-text lang-es" lang="es">¡Chócalas! No importa si cada respuesta fue perfecta — estuviste con tu estudiante esta noche. Eso importa.</p>
      <p class="celebrate-sub bilingual-block">
        <span class="lang-en">Answers save automatically on this device. Tap <strong>Check This Problem</strong> anytime.</span>
        <span class="lang-es" lang="es">Las respuestas se guardan solas en este dispositivo. Toquen <strong>Revisar esta pregunta</strong> cuando quieran.</span>
      </p>
    </section>`;
}

export function renderQuickCheckIntro() {
  return `
    <section class="guided-section card section-quick-intro" aria-label="Quick check introduction">
      <h2 class="section-title">✅ Quick check / Repaso rápido</h2>
      <p class="bilingual-block">
        <span class="lang-en">One or two problems to try on the screen. Use <strong>Check This Problem</strong> for instant feedback — no need to finish everything at once.</span>
        <span class="lang-es" lang="es">Una o dos preguntas en pantalla. Usen <strong>Revisar esta pregunta</strong> para retroalimentación al instante — no tienen que terminar todo de una vez.</span>
      </p>
    </section>`;
}

export function renderWordsToKnow(vocabList, resolveVocabImage, vocabImageAlt) {
  if (!Array.isArray(vocabList) || vocabList.length === 0) return "";

  return `
    <section class="guided-section card section-vocab vocab-section" aria-label="Words to know">
      <h2 class="section-title">📚 Words to know / Palabras clave</h2>
      <p class="vocab-family-note bilingual-block">
        <span class="lang-en">Tap a card to flip. Use these words when you talk about the math together.</span>
        <span class="lang-es" lang="es">Toquen una tarjeta para voltearla. Usen estas palabras cuando hablen de la matemática juntos.</span>
      </p>
      <div class="vocab-container">
        ${vocabList
          .map((v) => {
            const term = v.term || "";
            const termEs = v.termEs || "";
            const definition = v.definition || "";
            const definitionEs = v.definitionEs || "";
            const visual = v.visual || "";
            const imgSrc = resolveVocabImage(term, v.image);
            const imgAlt = vocabImageAlt(term, definition);
            return `
            <div class="vocab-card" onclick="this.classList.toggle('flipped')">
              <div class="vocab-card-inner">
                <div class="vocab-card-front">
                  <div class="vocab-thumb-wrap">
                    <img class="vocab-thumb" src="${esc(imgSrc)}" alt="${esc(imgAlt)}" loading="lazy" width="72" height="72" />
                  </div>
                  <h3>${esc(term)}</h3>
                  ${termEs ? `<p class="vocab-es" lang="es">${esc(termEs)}</p>` : ""}
                  ${visual ? `<div class="vocab-visual-hint">💡 ${esc(visual)}</div>` : ""}
                  <div class="flip-prompt">Tap / Toca ➔</div>
                </div>
                <div class="vocab-card-back">
                  <p class="vocab-def">${esc(definition)}</p>
                  ${definitionEs ? `<p class="vocab-def-es" lang="es">${esc(definitionEs)}</p>` : ""}
                  ${visual ? `<p class="vocab-back-visual">📌 ${esc(visual)}</p>` : ""}
                </div>
              </div>
            </div>`;
          })
          .join("")}
      </div>
    </section>`;
}

export const GUIDED_NOTES_CSS = `
/* Family guided notes layout */
.family-welcome {
  background: linear-gradient(135deg, var(--navy), var(--navy-light));
  color: var(--white);
  border: none;
  padding: 28px 24px;
}
.welcome-hero {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}
.welcome-emoji { font-size: 48px; line-height: 1; }
.welcome-tag {
  margin: 0 0 4px;
  font-family: var(--font-display);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--teal-light);
  font-weight: 800;
}
.welcome-title-en, .welcome-title-es {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(26px, 5vw, 34px);
  font-weight: 800;
  line-height: 1.15;
}
.welcome-title-es { color: var(--amber); font-size: clamp(22px, 4.5vw, 30px); margin-top: 2px; }
.welcome-lesson { margin: 8px 0 0; font-size: 16px; color: var(--teal-light); font-weight: 600; }
.welcome-lead { margin: 0 0 12px; font-size: 15px; line-height: 1.5; }
.family-welcome .back-link { color: var(--amber); margin: 0; }
.family-welcome .back-link:hover { color: var(--white); }

.bilingual-block, .bilingual-grid { display: flex; flex-direction: column; gap: 10px; }
.bilingual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 640px) {
  .bilingual-grid { grid-template-columns: 1fr; }
}
.bilingual-col {
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
}
.lang-label {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--teal);
  margin-bottom: 6px;
}
.lang-en { margin: 0 0 6px; }
.lang-es { margin: 0; color: var(--muted); font-style: normal; }
.learning-big { font-size: 17px; font-weight: 700; color: var(--navy); margin: 0 0 8px; line-height: 1.4; }
.learning-sub { font-size: 14px; margin: 0; color: var(--ink); }

.guided-section { scroll-margin-top: 16px; }
.section-learn { border-left: 4px solid var(--teal); }
.section-visual { border-left: 4px solid var(--amber); }
.section-together { border-left: 4px solid #5b8def; }
.section-vocab { border-left: 4px solid var(--coral); }
.section-stuck { border-left: 4px solid #9b59b6; }
.section-quick-intro { border-left: 4px solid var(--success); }
.section-celebrate {
  border-left: 4px solid var(--amber);
  background: linear-gradient(180deg, var(--amber-light), var(--white));
  text-align: center;
}

.concept-visual-wrap { margin: 12px 0 16px; overflow-x: auto; }
.concept-svg { width: 100%; max-width: 420px; height: auto; display: block; margin: 0 auto; }
.concept-fallback-visual { display: flex; flex-direction: column; gap: 8px; }
.concept-fallback-step {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  font-weight: 600; font-size: 14px;
}
.step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 800; color: var(--white);
  flex-shrink: 0;
}
.step-color-1 .step-dot, .step-color-1.step-badge { background: #5b8def; }
.step-color-2 .step-dot, .step-color-2.step-badge { background: var(--success); }
.step-color-3 .step-dot, .step-color-3.step-badge { background: var(--amber); color: var(--navy); }
.step-color-4 .step-dot, .step-color-4.step-badge { background: var(--coral); }

.key-idea-banner {
  background: var(--teal-light);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  margin-bottom: 16px;
  border: 1px solid #b8ddd8;
}
.key-idea-banner p { margin: 0 0 6px; font-size: 14.5px; }
.key-idea-banner p:last-child { margin-bottom: 0; }

.guided-steps, .together-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.guided-step, .together-step {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  background: var(--white);
}
.step-badge {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--white);
  padding: 3px 8px;
  border-radius: 99px;
  margin-bottom: 8px;
}
.guided-step p, .together-step p { margin: 0 0 6px; font-size: 14.5px; line-height: 1.45; }
.step-hint {
  margin: 8px 0 0 !important;
  padding: 8px 10px;
  background: var(--hint-bg);
  border-radius: var(--radius-sm);
  font-size: 13px !important;
  color: var(--hint);
}

.watch-for-list { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.watch-for-list li {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 10px 12px; background: var(--cream); border-radius: var(--radius-sm);
}
.watch-icon { font-size: 20px; flex-shrink: 0; }

.try-scenario { font-size: 15px; font-weight: 600; color: var(--navy); margin: 0 0 8px; }
.try-together-note { font-size: 14px; margin: 0 0 14px; color: var(--muted); }

.stuck-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 12px;
}
@media (max-width: 640px) { .stuck-grid { grid-template-columns: 1fr; } }
.stuck-panel {
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  border: 1px solid var(--line);
}
.stuck-say { background: var(--success-bg); border-color: var(--success); }
.stuck-dont { background: var(--error-bg); border-color: var(--error); }
.stuck-heading { margin: 0 0 10px; font-family: var(--font-display); font-size: 14px; color: var(--navy); }
.stuck-panel ul { margin: 0; padding-left: 16px; }
.stuck-panel li { margin-bottom: 10px; font-size: 14px; }
.stuck-panel li p { margin: 0 0 4px; }
.stuck-footer { font-size: 14px; color: var(--muted); margin: 0; }

.celebrate-text { font-size: 17px; font-weight: 700; color: var(--navy); margin: 0 0 8px; }
.celebrate-sub { font-size: 14px; margin: 0; }

.problems-container .problem-section { border-left: 4px solid var(--teal); }
.problems-container .problem-number-badge::after {
  content: " / Repaso";
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}
`;
