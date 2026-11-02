// Centralised grade-adaptive system (Enterprise 8). One registry controls, for each grade 1-8:
// layout and navigation complexity, typography, iconography, spacing, illustration language,
// manipulatives, language complexity, animation, feedback style, independence, practice density,
// response controls and progress visualisation. The shared engines stay common; the grade picks the presentation.
//
// The attributes below are written onto <html> and read by grade-system.css. Nothing here labels a learner.

const MOTION = { bounce: 520, gentle: 380, smooth: 260, crisp: 180, minimal: 120 };

export const GRADE_SYSTEM = Object.freeze({
  1: {
    header: "storybook",
    nav: "one-task",
    card: "sticker",
    path: "stepping-stones",
    feedback: "friendly-burst",
    motion: "bounce",
    controls: "jumbo",
    density: "airy",
    progress: "garden",
    illustration: "picture-book",
    language: "spoken-short",
    independence: "guided",
    type: "round-large",
    manipulatives: ["counting collections", "ten-frames", "number bonds", "number paths"],
    practiceItems: 5,
    targetPx: 60,
    scaleRem: 1.14,
  },
  2: {
    header: "workshop",
    nav: "guided-steps",
    card: "block-tab",
    path: "ladder",
    feedback: "friendly-burst",
    motion: "bounce",
    controls: "large",
    density: "airy",
    progress: "tower",
    illustration: "block-craft",
    language: "plain-short",
    independence: "guided",
    type: "round-large",
    manipulatives: [
      "base-ten blocks",
      "place-value houses",
      "number-line journeys",
      "money models",
    ],
    practiceItems: 6,
    targetPx: 56,
    scaleRem: 1.1,
  },
  3: {
    header: "studio",
    nav: "visual-discovery",
    card: "dot-grid",
    path: "trail-map",
    feedback: "strategy-card",
    motion: "gentle",
    controls: "large",
    density: "roomy",
    progress: "constellation",
    illustration: "array-pattern",
    language: "plain",
    independence: "scaffolded",
    type: "humanist",
    manipulatives: ["arrays", "equal groups", "area models", "fact families"],
    practiceItems: 8,
    targetPx: 52,
    scaleRem: 1.06,
  },
  4: {
    header: "lab",
    nav: "investigate-compare",
    card: "notebook",
    path: "numbered-route",
    feedback: "strategy-card",
    motion: "gentle",
    controls: "standard",
    density: "roomy",
    progress: "checklist-bars",
    illustration: "diagram",
    language: "academic-light",
    independence: "scaffolded",
    type: "humanist",
    manipulatives: ["fraction bars", "area models", "angle tools", "factor trees"],
    practiceItems: 8,
    targetPx: 48,
    scaleRem: 1.03,
  },
  5: {
    header: "blueprint",
    nav: "design-and-test",
    card: "blueprint",
    path: "numbered-route",
    feedback: "model-and-reason",
    motion: "smooth",
    controls: "standard",
    density: "balanced",
    progress: "checklist-bars",
    illustration: "technical-line",
    language: "academic",
    independence: "fading",
    type: "grotesque",
    manipulatives: ["decimal grids", "fraction operations", "volume builders", "coordinate grids"],
    practiceItems: 10,
    targetPx: 46,
    scaleRem: 1,
  },
  6: {
    header: "reasoning-lab",
    nav: "analytical-workspace",
    card: "panel",
    path: "domain-lanes",
    feedback: "diagnostic",
    motion: "smooth",
    controls: "standard",
    density: "balanced",
    progress: "domain-bars",
    illustration: "diagram-flat",
    language: "academic",
    independence: "fading",
    type: "grotesque",
    manipulatives: ["tape diagrams", "double number lines", "balance models", "coordinate planes"],
    practiceItems: 10,
    targetPx: 44,
    scaleRem: 1,
  },
  7: {
    header: "strategy-desk",
    nav: "strategy-workspace",
    card: "row",
    path: "domain-lanes",
    feedback: "compare-strategies",
    motion: "crisp",
    controls: "compact",
    density: "compact",
    progress: "domain-bars",
    illustration: "linked-views",
    language: "formal",
    independence: "independent",
    type: "grotesque",
    manipulatives: [
      "proportion tables",
      "signed number lines",
      "probability models",
      "linked graphs",
    ],
    practiceItems: 12,
    targetPx: 44,
    scaleRem: 0.98,
  },
  8: {
    header: "algebra-workspace",
    nav: "modeling-studio",
    card: "ledger",
    path: "dependency-graph",
    feedback: "evidence",
    motion: "minimal",
    controls: "compact",
    density: "compact",
    progress: "domain-bars",
    illustration: "coordinate",
    language: "formal",
    independence: "independent",
    type: "grotesque-mono",
    manipulatives: [
      "linked graphs and tables",
      "transformation tools",
      "system solvers",
      "function machines",
    ],
    practiceItems: 12,
    targetPx: 44,
    scaleRem: 0.96,
  },
});

export const GRADE_SYSTEM_GRADES = Object.freeze(Object.keys(GRADE_SYSTEM).map(Number));

const ATTRIBUTES = [
  "header",
  "nav",
  "card",
  "path",
  "feedback",
  "motion",
  "controls",
  "density",
  "progress",
  "illustration",
  "language",
  "independence",
  "type",
];

export function gradeSystem(grade) {
  const profile = GRADE_SYSTEM[Number(grade)];
  return profile ? { grade: Number(grade), ...profile, motionMs: MOTION[profile.motion] } : null;
}

// Original vector scenes, one per grade. Each uses the grade's own mathematical model, so the hero tells the
// learner what kind of mathematics lives here before any label is read.
const S = (inner) =>
  `<svg viewBox="0 0 320 170" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const SCENES = {
  1: S(
    `<rect width="320" height="170" rx="22" fill="#fff3e8"/><circle cx="268" cy="38" r="22" fill="#f6c453"/><g stroke="#f6c453" stroke-width="4" stroke-linecap="round"><path d="M268 4v8M268 64v8M234 38h8M294 38h8"/></g><path d="M0 138c60-26 120 6 180-8s100-8 140 8v32H0z" fill="#bfe3c4"/><rect x="28" y="40" width="148" height="60" rx="10" fill="#fff" stroke="#c94f64" stroke-width="4"/><path d="M102 40v60M28 70h148" stroke="#c94f64" stroke-width="2" opacity=".4"/><g fill="#c94f64"><circle cx="48" cy="55" r="9"/><circle cx="68" cy="55" r="9"/><circle cx="88" cy="55" r="9"/><circle cx="122" cy="55" r="9"/><circle cx="142" cy="55" r="9"/><circle cx="48" cy="85" r="9"/><circle cx="68" cy="85" r="9"/></g><g transform="translate(206 92)"><circle cx="14" cy="14" r="14" fill="#e65f4d"/><path d="M14 0c0-8 6-10 10-10" stroke="#3a7d44" stroke-width="3" fill="none"/></g><g transform="translate(236 104)"><circle cx="14" cy="14" r="14" fill="#e65f4d"/><path d="M14 0c0-8 6-10 10-10" stroke="#3a7d44" stroke-width="3" fill="none"/></g><g transform="translate(266 96)"><circle cx="14" cy="14" r="14" fill="#e65f4d"/><path d="M14 0c0-8 6-10 10-10" stroke="#3a7d44" stroke-width="3" fill="none"/></g>`,
  ),
  2: S(
    `<rect width="320" height="170" rx="18" fill="#fff3dc"/><g stroke="#70400f" stroke-width="2"><rect x="30" y="38" width="22" height="100" fill="#f2c15b"/><path d="M30 58h22M30 78h22M30 98h22M30 118h22" fill="none"/><rect x="66" y="38" width="22" height="100" fill="#f2c15b"/><path d="M66 58h22M66 78h22M66 98h22M66 118h22" fill="none"/><rect x="108" y="88" width="50" height="50" fill="#8dc7c3"/><path d="M108 108h50M108 128h50M128 88v50M148 88v50" fill="none"/><rect x="170" y="118" width="20" height="20" fill="#e9835f"/><rect x="194" y="118" width="20" height="20" fill="#e9835f"/><rect x="218" y="118" width="20" height="20" fill="#e9835f"/></g><path d="M236 52h56M236 72h56M236 92h56" stroke="#70400f" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9"/><text x="246" y="46" font-size="18" font-weight="800" fill="#70400f" font-family="Georgia,serif">13 = 10 + 3</text>`,
  ),
  3: S(
    `<rect width="320" height="170" rx="16" fill="#edf6e8"/><g fill="#43804b"><circle cx="40" cy="44" r="9"/><circle cx="70" cy="44" r="9"/><circle cx="100" cy="44" r="9"/><circle cx="130" cy="44" r="9"/><circle cx="40" cy="74" r="9"/><circle cx="70" cy="74" r="9"/><circle cx="100" cy="74" r="9"/><circle cx="130" cy="74" r="9"/><circle cx="40" cy="104" r="9"/><circle cx="70" cy="104" r="9"/><circle cx="100" cy="104" r="9"/><circle cx="130" cy="104" r="9"/></g><path d="M26 130h120" stroke="#2e5c35" stroke-width="3"/><path d="M26 124v12M146 124v12" stroke="#2e5c35" stroke-width="3"/><text x="64" y="152" font-size="15" font-weight="800" fill="#2e5c35" font-family="Georgia,serif">3 × 4 = 12</text><g stroke="#2e5c35" stroke-width="2.5" fill="#fff"><rect x="190" y="38" width="100" height="34" rx="6"/><rect x="190" y="82" width="100" height="34" rx="6"/></g><path d="M215 38v34M240 38v34M265 38v34M215 82v34M240 82v34M265 82v34" stroke="#2e5c35" stroke-width="2"/><path d="M190 140h100" stroke="#1fa6a2" stroke-width="4" stroke-linecap="round"/>`,
  ),
  4: S(
    `<rect width="320" height="170" rx="14" fill="#e8f4f0"/><g stroke="#15564d" stroke-width="2.5" fill="#fff"><rect x="24" y="30" width="160" height="30" rx="4"/><rect x="24" y="70" width="160" height="30" rx="4"/><rect x="24" y="110" width="160" height="30" rx="4"/></g><path d="M64 30v30M104 30v30M144 30v30M44 70v30M64 70v30M84 70v30M104 70v30M124 70v30M144 70v30M164 70v30" stroke="#15564d" stroke-width="2"/><rect x="24" y="30" width="80" height="30" fill="#1fa6a2" opacity=".85"/><rect x="24" y="70" width="80" height="30" fill="#1fa6a2" opacity=".85"/><path d="M214 130 266 56 292 130z" fill="none" stroke="#15564d" stroke-width="3"/><path d="M214 130h78" stroke="#15564d" stroke-width="3"/><path d="M232 130a22 22 0 0 0-8-17" fill="none" stroke="#d8613c" stroke-width="3"/><text x="198" y="30" font-size="15" font-weight="800" fill="#15564d" font-family="Georgia,serif">2/4 = 1/2</text>`,
  ),
  5: S(
    `<rect width="320" height="170" rx="12" fill="#eaf2f8"/><g stroke="#8fb0cc" stroke-width="1"><path d="M0 34h320M0 68h320M0 102h320M0 136h320M40 0v170M100 0v170M160 0v170M220 0v170M280 0v170"/></g><rect x="30" y="28" width="100" height="100" fill="#fff" stroke="#21496a" stroke-width="3"/><path d="M50 28v100M70 28v100M90 28v100M110 28v100M30 48h100M30 68h100M30 88h100M30 108h100" stroke="#21496a" stroke-width=".9"/><rect x="30" y="68" width="100" height="60" fill="#326c9e" opacity=".55"/><path d="M200 120l30-18h54l-30 18zM200 120v-44l30-18v44M230 102V58h54v44" fill="#fff" stroke="#21496a" stroke-width="3" stroke-linejoin="round"/><text x="150" y="156" font-size="14" font-weight="700" fill="#21496a" font-family="ui-monospace,Menlo,monospace">0.6 × 5 = 3.0</text>`,
  ),
  6: S(
    `<rect width="320" height="170" rx="10" fill="#e3f2f1"/><g stroke="#12575a" stroke-width="3" stroke-linecap="round"><path d="M28 54h264M28 112h264"/><path d="M28 44v20M108 44v20M188 44v20M268 44v20M28 102v20M108 102v20M188 102v20M268 102v20"/></g><g font-size="13" font-weight="800" fill="#12575a" font-family="ui-monospace,Menlo,monospace"><text x="24" y="36">0</text><text x="100" y="36">3</text><text x="180" y="36">6</text><text x="260" y="36">9</text><text x="24" y="144">0</text><text x="100" y="144">5</text><text x="180" y="144">10</text><text x="260" y="144">15</text></g><path d="M108 64v38M188 64v38M268 64v38" stroke="#1fa6a2" stroke-width="3" stroke-dasharray="5 5"/><circle cx="188" cy="54" r="7" fill="#1fa6a2"/><circle cx="188" cy="112" r="7" fill="#1fa6a2"/><text x="40" y="162" font-size="12" font-weight="700" fill="#12575a" font-family="ui-monospace,Menlo,monospace">3 : 5 = 6 : 10</text>`,
  ),
  7: S(
    `<rect width="320" height="170" rx="8" fill="#faeee8"/><g stroke="#e0c3b6" stroke-width="1"><path d="M40 20v130M80 20v130M120 20v130M160 20v130M200 20v130M30 40h170M30 80h170M30 120h170"/></g><path d="M30 20v130h175" stroke="#713522" stroke-width="2.5" fill="none"/><path d="M30 150 196 24" stroke="#d8613c" stroke-width="4" stroke-linecap="round"/><circle cx="113" cy="87" r="6" fill="#713522"/><circle cx="154" cy="56" r="6" fill="#713522"/><g transform="translate(222 28)"><rect width="78" height="116" rx="6" fill="#fff" stroke="#713522" stroke-width="2"/><path d="M0 28h78M0 56h78M0 84h78M39 0v116" stroke="#713522" stroke-width="1.5"/><g font-size="12" font-weight="700" fill="#713522" font-family="ui-monospace,Menlo,monospace"><text x="9" y="20">x</text><text x="50" y="20">y</text><text x="9" y="48">2</text><text x="50" y="48">3</text><text x="9" y="76">4</text><text x="50" y="76">6</text><text x="9" y="104">6</text><text x="50" y="104">9</text></g></g>`,
  ),
  8: S(
    `<rect width="320" height="170" rx="6" fill="#16303f"/><g stroke="#2f5163" stroke-width="1"><path d="M40 12v146M80 12v146M120 12v146M160 12v146M200 12v146M16 36h188M16 70h188M16 104h188M16 138h188"/></g><path d="M16 104h192M100 10v150" stroke="#cfe3ee" stroke-width="2"/><path d="M28 148 196 28" stroke="#7fe0dc" stroke-width="4" stroke-linecap="round"/><path d="M28 34 196 140" stroke="#ffc47a" stroke-width="4" stroke-linecap="round"/><circle cx="108" cy="89" r="7" fill="#fff" stroke="#16303f" stroke-width="2"/><g font-size="14" font-weight="700" font-family="ui-monospace,Menlo,monospace"><text x="222" y="52" fill="#7fe0dc">y = 3x/2 − 1</text><text x="222" y="84" fill="#ffc47a">y = −x/2 + 2</text><text x="222" y="124" fill="#e8f3f9">(2, 2)</text></g>`,
  ),
};

export const gradeScene = (grade) => SCENES[Number(grade)] || "";

const camel = (name) => `gs${name[0].toUpperCase()}${name.slice(1)}`;

export function applyGradeSystem(grade, root = document.documentElement) {
  const profile = gradeSystem(grade);
  if (!profile) {
    delete root.dataset.gradeSystem;
    for (const name of ATTRIBUTES) delete root.dataset[camel(name)];
    for (const token of ["--gs-motion-ms", "--gs-target", "--gs-scale"]) root.style.removeProperty(token);
    return null;
  }
  root.dataset.gradeSystem = String(profile.grade);
  for (const name of ATTRIBUTES) root.dataset[camel(name)] = profile[name];
  root.style.setProperty("--gs-motion-ms", `${profile.motionMs}ms`);
  root.style.setProperty("--gs-target", `${profile.targetPx}px`);
  root.style.setProperty("--gs-scale", String(profile.scaleRem));
  return profile;
}
