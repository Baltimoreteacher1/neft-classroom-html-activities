// Monthly Language & Culture Calendar (access-teacher/culture-calendar.js)
// Maps each month's literacy/cultural observances to deep links into My Passport, Newsroom, Survival Vocabulary, and Guided Units.

const MONTHS = [
  { m: "January", theme: "New Year Goals & Community Voices", passport: "passport", newsroom: "newsroom", vocab: "packs/survival-vocabulary", unit: "guided-units/newcomer-survival" },
  { m: "February", theme: "Black History & Civic Storytelling", passport: "passport", newsroom: "newsroom", vocab: "wordlab", unit: "guided-units/evidence-and-argument" },
  { m: "March", theme: "Women in Science & Discovery", passport: "passport", newsroom: "newsroom", vocab: "wordlab", unit: "guided-units/cause-and-effect" },
  { m: "April", theme: "Poetry & Earth Month", passport: "passport", newsroom: "newsroom", vocab: "packs/survival-vocabulary", unit: "guided-units/cause-and-effect" },
  { m: "May", theme: "AAPI Heritage & Global Traditions", passport: "passport", newsroom: "newsroom", vocab: "packs/survival-vocabulary", unit: "guided-units/newcomer-survival" },
  { m: "June", theme: "Summer Reading & Family Stories", passport: "passport", newsroom: "newsroom", vocab: "reading-path/decodable", unit: "guided-units/cvc-blending" },
  { m: "July", theme: "Community Helpers & Local Maps", passport: "passport", newsroom: "newsroom", vocab: "packs/survival-vocabulary", unit: "guided-units/newcomer-survival" },
  { m: "August", theme: "Back-to-School Welcome & Routines", passport: "passport", newsroom: "newsroom", vocab: "packs/survival-vocabulary", unit: "guided-units/newcomer-survival" },
  { m: "September", theme: "Hispanic Heritage & Multilingual Pride", passport: "passport", newsroom: "newsroom", vocab: "packs/survival-vocabulary", unit: "guided-units/newcomer-survival" },
  { m: "October", theme: "Fall Harvest & Descriptive Writing", passport: "passport", newsroom: "newsroom", vocab: "wordlab", unit: "guided-units/cause-and-effect" },
  { m: "November", theme: "Native Heritage & Gratitude", passport: "passport", newsroom: "newsroom", vocab: "wordlab", unit: "guided-units/evidence-and-argument" },
  { m: "December", theme: "Winter Celebrations & Reflection", passport: "passport", newsroom: "newsroom", vocab: "packs/survival-vocabulary", unit: "guided-units/newcomer-survival" },
];

export function mountCultureCalendar(container) {
  if (!container) return;
  const nowIdx = new Date().getMonth();
  let selectedIdx = nowIdx;

  const draw = () => {
    const cur = MONTHS[selectedIdx];
    container.innerHTML = `<section class="panel no-print" style="margin:1rem 0;" aria-labelledby="ccTitle">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
        <div>
          <p class="eyebrow">Monthly Teaching &amp; Culture Calendar</p>
          <h2 id="ccTitle" style="margin:0;">${cur.m}: ${cur.theme}</h2>
        </div>
        <label class="acc-field" for="ccMonthSelect">
          <span class="sr-only">Select month</span>
          <select id="ccMonthSelect" class="acc-select">
            ${MONTHS.map((item, i) => `<option value="${i}" ${i === selectedIdx ? "selected" : ""}>${item.m}</option>`).join("")}
          </select>
        </label>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.85rem;">
        <a class="btn small" href="/access-practice-lab/${cur.passport}">My Passport Stops</a>
        <a class="btn small" href="/access-practice-lab/${cur.newsroom}">Newsroom Prompts</a>
        <a class="btn small" href="/access-practice-lab/${cur.vocab}">Vocabulary Pack</a>
        <a class="btn btn-primary small" href="/access-practice-lab/${cur.unit}">Open Guided Unit</a>
      </div>
    </section>`;
    container.querySelector("#ccMonthSelect")?.addEventListener("change", (e) => {
      selectedIdx = Number(e.target.value) || 0;
      draw();
    });
  };
  draw();
}
