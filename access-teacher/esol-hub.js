// ESOL Teacher Hub Organizer (access-teacher/esol-hub.js):
// Puts the two things ESOL teachers reach for most right at the top of the Teacher Hub:
//   1. WIDA Materials — organized clearly by the 4 WIDA domains (Listening, Reading, Speaking, Writing)
//      plus ACCESS Prep, Practice Tests, WIDA Data Studio, Weekly Links, and Printable Packets.
//   2. Just Activities — standalone classroom activities, unit activities by grade/subject, search,
//      vocabulary, reading room, games, printables, and newcomer packs without test-prep clutter.
// Stays in sync with the hub's grade band (`th:band`) and can jump straight to `#activities` filtered by domain.
import { BAND_INFO, CONTENT_BANDS, isEarlyBand } from "/access-practice-lab/src/bands.js";
import { BASE, bandLabel, html, icon, toHtml } from "/access-practice-lab/src/util.js";
import { hubBand } from "/access-teacher/command-center.js";

export const WIDA_DOMAINS = Object.freeze([
  {
    id: "Listening",
    slug: "listening",
    icon: "listening",
    blurb: "Audio tasks, spoken directions, and listening scripts.",
    studio: "/wida-access/listening/",
    studioLabel: "Listening Studio",
  },
  {
    id: "Reading",
    slug: "reading",
    icon: "reading",
    blurb: "Academic texts across ELA, math, science, and social studies.",
    studio: "/wida-access/reading/",
    studioLabel: "Reading Studio",
  },
  {
    id: "Speaking",
    slug: "speaking",
    icon: "speaking",
    blurb: "Prompted recording tasks with three-tier sample models.",
    studio: "/wida-access/speaking/",
    studioLabel: "Speaking Studio",
  },
  {
    id: "Writing",
    slug: "writing",
    icon: "writing",
    blurb: "Constructed responses with scaffolds and mentor models.",
    studio: "/wida-access/writing/",
    studioLabel: "Writing Studio",
  },
]);

export function widaDomainLinks(band = "6-8") {
  const b = CONTENT_BANDS.includes(band) ? band : "6-8";
  const early = isEarlyBand(b);
  return WIDA_DOMAINS.map((d) => ({
    ...d,
    practiceHref: `${BASE}/${d.id}?grades=${encodeURIComponent(b)}`,
    studioHref: early ? "" : d.studio,
  }));
}

export function widaEssentials(band = "6-8") {
  const b = CONTENT_BANDS.includes(band) ? band : "6-8";
  const early = isEarlyBand(b);
  return [
    {
      id: "access-prep",
      label: "ACCESS Prep Hub",
      note: "All test-style practice in one place",
      href: `${BASE}/access-prep?grades=${encodeURIComponent(b)}`,
      icon: "tests",
    },
    ...(!early
      ? [
          {
            id: "tests",
            label: "WIDA Practice Tests",
            note: "Full domain tests with teacher keys",
            href: "#tests",
            icon: "tests",
          },
        ]
      : []),
    {
      id: "data-studio",
      label: "WIDA Data Studio",
      note: "Import ACCESS scores & class patterns",
      href: "/access-teacher/predictive/",
      icon: "growth",
    },
    ...(!early
      ? [
          {
            id: "weekly",
            label: "Road to ACCESS Weekly",
            note: "One link a week + family prompt",
            href: "#weekly",
            icon: "calendar",
          },
        ]
      : []),
    {
      id: "printables",
      label: "Printable WIDA Packets",
      note: "Student & teacher packets (Word / PDF)",
      href: "#printables",
      icon: "print",
    },
  ];
}

export function justActivityLinks(band = "6-8") {
  const b = CONTENT_BANDS.includes(band) ? band : "6-8";
  const q = `?grades=${encodeURIComponent(b)}`;
  return [
    {
      id: "all-activities",
      label: "All Activities & Answer Keys",
      note: "Browse every activity for this band and build a playlist.",
      href: "#activities",
      icon: "grid",
      filterDomain: "",
    },
    {
      id: "unit-activities",
      label: "Activities by Grade, Subject & Unit",
      note: "Pick K–8 grade, subject (ELA, Math, Science, SS), and unit.",
      href: "/access-teacher/classroom/",
      icon: "classroom",
    },
    {
      id: "resource-finder",
      label: "Search All Activities",
      note: "Filter every activity, studio, and game by skill and time.",
      href: `${BASE}/search?for=teacher&grades=${encodeURIComponent(b)}`,
      icon: "search",
    },
    {
      id: "vocab",
      label: "Vocabulary & Word Study",
      note: "Custom word lists, flashcards, and academic root builders.",
      href: `${BASE}/vocab-sets${q}`,
      icon: "words",
    },
    {
      id: "reading-room",
      label: "Reading Room",
      note: "Leveled stories and content passages with audio support.",
      href: `${BASE}/reading-room${q}`,
      icon: "reading",
    },
    {
      id: "games",
      label: "Games & Interactive Worlds",
      note: "Skill-building language games with no timers.",
      href: `${BASE}/explore/play${q}`,
      icon: "worlds",
    },
    {
      id: "printables-act",
      label: "Printable Activities",
      note: "Ready-to-print worksheets and answer keys.",
      href: "#printables",
      icon: "print",
    },
    {
      id: "newcomer",
      label: "Newcomer Resource Packs",
      note: "Bilingual survival vocabulary, routines, and speaking cards.",
      href: `${BASE}/packs${q}`,
      icon: "library",
    },
  ];
}

export function mountEsolHub(host) {
  if (!host) return;
  let band = hubBand();

  function setBand(next) {
    if (!CONTENT_BANDS.includes(next) || next === band) return;
    band = next;
    try {
      const url = new URL(location.href);
      url.searchParams.set("grades", band);
      history.replaceState(history.state, "", url);
    } catch {}
    const { CustomEvent: Ev } = document.defaultView || globalThis;
    document.dispatchEvent(new Ev("th:band", { detail: { band, from: "esol-hub" } }));
    render();
  }

  function render() {
    const domains = widaDomainLinks(band);
    const essentials = widaEssentials(band);
    const activities = justActivityLinks(band);
    const bandText = bandLabel(band);

    host.innerHTML = toHtml(html`
      <div class="eh-band-bar">
        <div>
          <p class="eh-band-kicker">Showing ESOL materials for</p>
          <strong class="eh-band-current">${bandText}</strong>
        </div>
        <div class="band-switch" role="group" aria-label="Grade band for WIDA materials and activities">
          ${CONTENT_BANDS.map(
            (b) => html`<button
              type="button"
              class="band-btn"
              data-eh-band="${b}"
              aria-pressed="${String(b === band)}"
              aria-label="${bandLabel(b)}"
            >
              ${BAND_INFO[b]?.short || b}
            </button>`,
          )}
        </div>
      </div>

      <section class="eh-section" id="thWidaDomains" aria-labelledby="ehWidaTitle">
        <div class="th-block-head">
          <h2 id="ehWidaTitle">WIDA Materials by Domain</h2>
          <p>
            Jump straight into Listening, Reading, Speaking, or Writing materials, plus ACCESS prep and WIDA data.
          </p>
        </div>

        <div class="eh-domain-grid">
          ${domains.map(
            (d) => html`<article class="eh-domain-card is-${d.slug}">
              <div class="eh-domain-head">
                <span class="eh-domain-ico" aria-hidden="true">${icon(d.icon)}</span>
                <h3>${d.id}</h3>
              </div>
              <p class="eh-domain-blurb">${d.blurb}</p>
              <div class="eh-domain-actions">
                <a class="btn btn-primary small" href="${d.practiceHref}">Open ${d.id} practice →</a>
                ${
                  d.studioHref
                    ? html`<a class="btn small" href="${d.studioHref}">${d.studioLabel}</a>`
                    : ""
                }
                <a class="eh-domain-link" href="#activities" data-eh-domain-filter="${d.id}">
                  ${d.id} activities &amp; answer keys
                </a>
              </div>
            </article>`,
          )}
        </div>

        <div class="eh-essentials" aria-label="WIDA and ACCESS essentials">
          <p class="eh-sub-label">WIDA &amp; ACCESS Essentials</p>
          <ul class="eh-ess-grid" role="list">
            ${essentials.map(
              (item) => html`<li>
                <a class="eh-ess-card" href="${item.href}">
                  <span class="eh-ess-ico" aria-hidden="true">${icon(item.icon)}</span>
                  <span>
                    <strong>${item.label}</strong>
                    <span>${item.note}</span>
                  </span>
                </a>
              </li>`,
            )}
          </ul>
        </div>
      </section>

      <section class="eh-section" id="thJustActivities" aria-labelledby="ehActTitle">
        <div class="th-block-head">
          <h2 id="ehActTitle">Just Activities</h2>
          <p>
            Ready-to-use classroom activities, unit practice, games, reading, and printables — no test-prep setup needed.
          </p>
        </div>

        <ul class="eh-act-grid" role="list">
          ${activities.map(
            (item) => html`<li>
              <a
                class="eh-act-card"
                href="${item.href}"
                ${item.filterDomain !== undefined ? `data-eh-domain-filter="${item.filterDomain}"` : ""}
              >
                <span class="eh-act-ico" aria-hidden="true">${icon(item.icon)}</span>
                <span class="eh-act-text">
                  <strong>${item.label}</strong>
                  <span>${item.note}</span>
                </span>
              </a>
            </li>`,
          )}
        </ul>
      </section>
    `);
  }

  host.addEventListener("click", (e) => {
    const bandBtn = e.target.closest("[data-eh-band]");
    if (bandBtn) {
      setBand(bandBtn.dataset.ehBand);
      host.querySelector(`[data-eh-band="${bandBtn.dataset.ehBand}"]`)?.focus({ preventScroll: true });
      return;
    }
    const domLink = e.target.closest("[data-eh-domain-filter]");
    if (domLink) {
      const domain = domLink.dataset.ehDomainFilter || "";
      const { CustomEvent: Ev } = document.defaultView || globalThis;
      document.dispatchEvent(new Ev("th:filter-domain", { detail: { domain } }));
    }
  });

  document.addEventListener("th:band", (e) => {
    if (e.detail?.from !== "esol-hub" && CONTENT_BANDS.includes(e.detail?.band)) {
      band = e.detail.band;
      render();
    }
  });

  render();
}
