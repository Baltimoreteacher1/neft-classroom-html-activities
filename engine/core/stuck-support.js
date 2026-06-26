// Shared "I'm stuck" student support bar.
//
// A single, consistent help affordance students can open whenever they're
// stuck — surfaced across lessons by the engine, not authored per page. It
// consolidates the supports teachers asked for: a hint, the first step, an
// example, vocabulary help, a sentence starter, and a plain-language
// ("simpler words") restatement. Each option draws from whatever the lesson
// config already provides, with a useful generic fallback so the support is
// always there even for lessons that didn't author extra fields.
//
// ESOL-friendly: vocabulary help shows the Spanish definition when present,
// and the sentence starters are templated frames (not open prose) so multilingual
// learners have a scaffold to fill in — without lowering the math demand.

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function buildHint(item) {
  const authored =
    (Array.isArray(item?.hints) && item.hints[0]) ||
    item?.hint ||
    item?.scaffold;
  return (
    authored ||
    "Reread the question and underline exactly what it is asking you to find. What information are you given?"
  );
}

function buildFirstStep(item) {
  return (
    item?.scaffold ||
    (Array.isArray(item?.hints) && item.hints[0]) ||
    "Start by writing down what you already KNOW — list the numbers and facts from the problem. Then decide what you need to find."
  );
}

function buildExample(item) {
  return (
    item?.workedExample ||
    item?.explanation ||
    "Look back at the <strong>Learn It</strong> section above — it walks through a worked example of this kind of problem step by step."
  );
}

function buildVocab(config) {
  const vocab = Array.isArray(config?.vocabulary) ? config.vocabulary : [];
  if (!vocab.length) return "";
  return (
    `<ul class="stuck-vocab">` +
    vocab
      .slice(0, 6)
      .map((v) => {
        const term = esc(v.term || "");
        const def = esc(v.definition || v.def || "");
        const es = v.definitionEs || v.termEs;
        return `<li><strong>${term}</strong> — ${def}${es ? `<br><span class="stuck-es" lang="es">${esc(es)}</span>` : ""}</li>`;
      })
      .join("") +
    `</ul>`
  );
}

function buildSentenceStarter(item, config) {
  const authored = item?.sentenceFrame || config?.connect?.prompt;
  if (authored) return `<p class="stuck-frame">${esc(authored)}</p>`;
  return `<ul class="stuck-frames">
      <li>I know that <span class="stuck-blank"></span>.</li>
      <li>I need to find <span class="stuck-blank"></span>.</li>
      <li>First, I <span class="stuck-blank"></span>. Then I <span class="stuck-blank"></span>.</li>
      <li>My answer is <span class="stuck-blank"></span> because <span class="stuck-blank"></span>.</li>
    </ul>`;
}

function buildSimpler(item) {
  return (
    item?.simpler ||
    "In simpler words: take it one small step at a time. Ask yourself — what is the <strong>first</strong> thing I can figure out with the numbers I have? Do that step, then look again."
  );
}

/**
 * Mount the "I'm stuck" support bar inside `host`.
 * @param {HTMLElement} host
 * @param {object} opts { config, state, item }  item is optional (per-problem).
 */
export function mountStuckSupport(host, opts = {}) {
  if (!host) return null;
  const { config = {}, item = null } = opts;

  const options = [
    {
      key: "hint",
      icon: "💡",
      label: "Hint",
      html: `<p>${esc(buildHint(item))}</p>`,
    },
    {
      key: "first",
      icon: "👣",
      label: "Show me the first step",
      html: `<p>${esc(buildFirstStep(item))}</p>`,
    },
    {
      key: "example",
      icon: "📖",
      label: "See an example",
      html: `<p>${buildExample(item)}</p>`,
    },
    {
      key: "vocab",
      icon: "📚",
      label: "Vocabulary help",
      html: buildVocab(config),
    },
    {
      key: "frame",
      icon: "✍️",
      label: "Sentence starter",
      html: buildSentenceStarter(item, config),
    },
    {
      key: "simpler",
      icon: "🔤",
      label: "Explain it in simpler words",
      html: `<p>${buildSimpler(item)}</p>`,
    },
  ].filter((o) => o.html && o.html.trim());

  const wrap = document.createElement("section");
  wrap.className = "stuck-support";
  wrap.innerHTML = `
    <button type="button" class="stuck-toggle" aria-expanded="false">
      🤔 I'm stuck — get help
    </button>
    <div class="stuck-body" hidden>
      <div class="stuck-chips" role="group" aria-label="Help options">
        ${options
          .map(
            (o) =>
              `<button type="button" class="stuck-chip" data-help="${o.key}">${o.icon} ${esc(o.label)}</button>`,
          )
          .join("")}
      </div>
      <div class="stuck-panel" role="region" aria-live="polite" hidden></div>
    </div>`;

  const toggle = wrap.querySelector(".stuck-toggle");
  const body = wrap.querySelector(".stuck-body");
  const panel = wrap.querySelector(".stuck-panel");
  toggle.addEventListener("click", () => {
    const open = body.hidden;
    body.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  });

  wrap.querySelectorAll(".stuck-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const opt = options.find((o) => o.key === chip.dataset.help);
      const active = chip.classList.contains("is-active");
      wrap
        .querySelectorAll(".stuck-chip")
        .forEach((c) => c.classList.remove("is-active"));
      if (active) {
        panel.hidden = true;
        return;
      }
      chip.classList.add("is-active");
      panel.innerHTML = opt ? opt.html : "";
      panel.hidden = false;
    });
  });

  host.append(wrap);
  return wrap;
}
