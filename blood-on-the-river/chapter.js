// Blood on the River — chapter renderer (compact, image-light layout)

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m],
  );
}

// Slow, clear read-aloud for vocabulary and summaries (ESOL support).
window.speakText = function (text, lang = "en") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "es" ? "es-ES" : "en-US";
  u.rate = 0.78;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
};

function renderChapter(data) {
  const $ = (s) => document.querySelector(s);
  document.title = `Blood on the River — Chapter ${data.chapter}`;
  $("[data-chapter-title]").textContent = `Chapter ${data.chapter}`;
  $("[data-hero-kicker]").textContent = `Chapter ${data.chapter}`;
  $("[data-hero-copy]").textContent = data.heroCopy;
  $("[data-open-chapter]").textContent = "Start reading ▸";
  $("[data-brand]").textContent = `Chapter ${data.chapter}`;
  const sc = $("[data-scene-count]");
  if (sc) sc.textContent = `${data.scenes.length} parts`;

  // Quick facts
  $("#snapshotGrid").innerHTML = (data.snapshot || [])
    .map(
      (s) =>
        `<li><span class="fk">${esc(s[0])}</span><span class="fv">${esc(s[1])}</span></li>`,
    )
    .join("");

  // What happens (plain-language outline)
  $("#structureList").innerHTML = (data.structure || [])
    .map((x) => `<li>${esc(x)}</li>`)
    .join("");

  // Vocabulary — compact list with read-aloud
  $("#vocabGrid").innerHTML = data.vocab
    .map(
      (v) => `<li class="vrow">
        <span class="vword">${esc(v[0])}
          <button class="speak" type="button" data-text="${esc(v[0])}: ${esc(v[1])}" title="Read aloud" aria-label="Read ${esc(v[0])} aloud">🔊</button>
        </span>
        <span class="vdef">${esc(v[1])}</span>
      </li>`,
    )
    .join("");

  // Scenes — compact rows, optional "why it matters & check" toggle
  $("#sceneStack").innerHTML = data.scenes
    .map(
      (s) => `<article class="scene">
        <div class="scene-no">${esc(s.n)}</div>
        <div class="scene-body">
          <div class="scene-top">
            <h3>${esc(s.title)}</h3>
            <span class="scene-page">${esc(s.page)}</span>
          </div>
          <p class="quote">${esc(s.quote)}
            <button class="speak" type="button" data-text="${esc(s.quote)}. ${esc(s.summary)}" title="Read aloud" aria-label="Read this part aloud">🔊</button>
          </p>
          <p class="scene-sum">${esc(s.summary)}</p>
          <details class="more">
            <summary>Why it matters &amp; check</summary>
            <div class="more-body">
              <p>${esc(s.explain)}</p>
              <div class="check">
                <strong>Quick check</strong>
                <ol>${s.check.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>
              </div>
            </div>
          </details>
        </div>
      </article>`,
    )
    .join("");

  // Quick check question
  $("#quickQuestion").textContent = data.quick.question;
  $("#choices").innerHTML = data.quick.choices
    .map(
      (c, i) =>
        `<label class="choice"><input type="radio" name="q1" data-correct="${i === data.quick.correct}"> ${esc(c)}</label>`,
    )
    .join("");

  // I can statements
  $("#icanList").innerHTML = data.ican
    .map((x) => `<li>${esc(x)}</li>`)
    .join("");

  bindInteractions(data.quick.feedback, data.chapter);
}

function bindInteractions(feedbackText, chapterNumber) {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const status = $("#status");

  function show(msg) {
    if (!status) return;
    status.textContent = msg;
    status.classList.add("show");
    clearTimeout(show.t);
    show.t = setTimeout(() => status.classList.remove("show"), 1400);
  }

  function saveChapterCompleted(chNum) {
    try {
      const a = JSON.parse(
        localStorage.getItem("neft_chapters_completed") || "[]",
      );
      if (!a.includes(chNum)) {
        a.push(chNum);
        localStorage.setItem("neft_chapters_completed", JSON.stringify(a));
        show(`Chapter ${chNum} complete!`);
      }
    } catch (e) {}
  }

  // Read-aloud (vocabulary + scene quotes)
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".speak");
    if (b) {
      e.preventDefault();
      window.speakText(b.dataset.text, "en");
    }
  });

  // Comprehension choice
  $$(".choice input").forEach((input) =>
    input.addEventListener("change", () => {
      $$(".choice").forEach((ch) =>
        ch.classList.remove("correct", "incorrect"),
      );
      input
        .closest(".choice")
        .classList.add(
          input.dataset.correct === "true" ? "correct" : "incorrect",
        );
      const fb = $(".feedback");
      if (fb)
        fb.textContent =
          input.dataset.correct === "true"
            ? feedbackText
            : "Try again — look back at the parts above.";
      if (input.dataset.correct === "true") saveChapterCompleted(chapterNumber);
    }),
  );

  // Tools
  const printBtn = $("#printBtn");
  if (printBtn) printBtn.addEventListener("click", () => window.print());
  const topBtn = $("#topBtn");
  if (topBtn)
    topBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  const largeBtn = $("#largeTextBtn");
  if (largeBtn)
    largeBtn.addEventListener("click", () => {
      document.body.classList.toggle("large-text");
      show(
        document.body.classList.contains("large-text")
          ? "Large text on"
          : "Large text off",
      );
    });
  const contrastBtn = $("#contrastBtn");
  if (contrastBtn)
    contrastBtn.addEventListener("click", () => {
      document.body.classList.toggle("high-contrast");
      show(
        document.body.classList.contains("high-contrast")
          ? "High contrast on"
          : "High contrast off",
      );
    });
}
