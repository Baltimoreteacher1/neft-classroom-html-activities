// #/design — the design-system specimen: every shared/ui component in light and dark, with a right-to-left
// switch. Developer and reviewer reference inside the teacher Studio (same gate as every other Studio route).
// Sample copy is original and uses no student data. Components come from shared/ui; styles from the --ds-* tokens.
import {
  createActivityCard,
  createBadge,
  createBandSelector,
  createButton,
  createCard,
  createDialog,
  createPrintSheet,
  createTabs,
  createVocabularyCard,
  BADGE_TONES,
  BUTTON_VARIANTS,
} from "../../../shared/ui/index.js";
import { h } from "../core/dom.js";
import { TIERS } from "../data/taxonomy.js";

const SHEETS = [
  "/engine/styles/ds-tokens.generated.css",
  "/shared/ui/fonts.css",
  "/shared/ui/theme.css",
  "/shared/ui/ui.css",
  "/shared/ui/print.css",
  new URL("./specimen.css", import.meta.url).href,
];

function ensureCss() {
  for (const href of SHEETS) {
    if (document.querySelector(`link[data-ds-css="${href}"]`)) continue;
    document.head.append(h("link", { rel: "stylesheet", href, "data-ds-css": href }));
  }
}

const group = (title, ...kids) =>
  h("section", { class: "ds-group" }, h("h3", { class: "ds-group__title" }, title), kids);

function buttonGroup() {
  const row = BUTTON_VARIANTS.map((v) => createButton({ label: v[0].toUpperCase() + v.slice(1), variant: v }));
  row.push(createButton({ label: "Disabled", variant: "secondary", disabled: true }));
  row.push(createButton({ label: "Show hints", variant: "secondary", pressed: false }));
  return group("Buttons", h("div", { class: "ds-row" }, row));
}

function badgeGroup() {
  const tones = BADGE_TONES.map((t) => createBadge({ label: t[0].toUpperCase() + t.slice(1), tone: t, srPrefix: "Status" }));
  return group("Badges", h("div", { class: "ds-row" }, tones));
}

function cardGroup() {
  return group(
    "Cards",
    h(
      "div",
      { class: "ds-grid" },
      createCard({ title: "Plain card", body: "A titled surface. Heading level is chosen by the page.", meta: createBadge({ label: "Draft", tone: "warn" }) }),
      createCard({ title: "Linked card", href: "#/design", body: "The whole card is one link, one tab stop.", footer: "Opens this page" }),
    ),
  );
}

function tabsGroup(theme) {
  const panel = (text) => h("p", {}, text);
  return group(
    "Tabs",
    createTabs({
      label: `Sample tabs (${theme})`,
      tabs: [
        { id: "words", label: "Words", panel: panel("Arrow keys move between tabs. Home and End jump to the first and last.") },
        { id: "frames", label: "Sentence frames", panel: panel("In a right-to-left page the arrow keys swap direction.") },
        { id: "print", label: "Print", panel: panel("Each panel is focusable so keyboard users can reach its content.") },
      ],
    }),
  );
}

function bandGroup(theme) {
  const bands = TIERS.map((t) => ({ value: t.id, label: t.short, hint: t.levels }));
  return group(
    "Band selector",
    createBandSelector({
      name: `ds-band-${theme}`,
      label: "Support for this lesson",
      hint: "Teacher-side choice. Students never see these labels.",
      bands,
      value: "dev",
    }),
  );
}

function dialogGroup(theme) {
  const stay = createButton({ label: "Keep editing", variant: "secondary", onClick: () => dialog.close() });
  const save = createButton({ label: "Save", variant: "primary", onClick: () => dialog.close() });
  const dialog = createDialog({
    title: "Save this lesson plan?",
    body: h("p", {}, "Focus stays inside this dialog. Escape or Close returns you to the button you used."),
    actions: [stay, save],
  });
  const opener = createButton({ label: `Open dialog (${theme})`, variant: "secondary", onClick: () => dialog.open(opener) });
  return group("Dialog", opener);
}

function vocabGroup() {
  return group(
    "Vocabulary card",
    createVocabularyCard({
      term: "compare",
      partOfSpeech: "verb",
      definition: "To look at two things and say how they are alike and how they are different.",
      example: "I compare my two drawings.",
      translations: [
        { lang: "es", language: "Spanish", text: "comparar" },
        { lang: "ar", language: "Arabic", text: "يقارن", dir: "rtl" },
      ],
      onSpeak: () => {},
    }),
  );
}

function activityGroup() {
  return group(
    "Activity card",
    createActivityCard({
      title: "Sort and explain",
      summary: "Partners sort ten word cards into two groups and tell why, using the sentence frame.",
      href: "#/find",
      minutes: 15,
      skills: ["Speaking"],
    }),
  );
}

function sheetGroup() {
  return group(
    "Print sheet",
    createPrintSheet({
      title: "Compare two things",
      subtitle: "Read the frame. Then write your own sentence.",
      sections: [
        { heading: "Frame", body: "Both ___ and ___ are ___, but only ___ is ___." },
        { heading: "My sentence", lines: 3 },
      ],
      footer: "Inspired by WIDA ACCESS, not official, not a score, not a placement tool.",
    }),
  );
}

function themePanel(theme) {
  return h(
    "section",
    { class: "ds-panel ui-page", "data-ui-theme": theme, "aria-labelledby": `ds-${theme}-title` },
    h("h2", { class: "ds-panel__title", id: `ds-${theme}-title` }, theme === "light" ? "Light" : "Dark"),
    buttonGroup(),
    badgeGroup(),
    cardGroup(),
    tabsGroup(theme),
    bandGroup(theme),
    dialogGroup(theme),
    vocabGroup(),
    activityGroup(),
    sheetGroup(),
  );
}

export function render({ root }) {
  ensureCss();
  const stage = h("div", { class: "ds-stage" }, themePanel("light"), themePanel("dark"));
  const rtl = createButton({
    label: "Right-to-left",
    variant: "secondary",
    pressed: false,
    onClick: (on) => stage.setAttribute("dir", on ? "rtl" : "ltr"),
  });
  stage.setAttribute("dir", "ltr");
  root.append(
    h(
      "div",
      { class: "ds-specimen" },
      h("h1", {}, "Design system"),
      h("p", { class: "ds-lead" }, "Every shared component in light and dark. Toggle right-to-left to check logical layout. Colours, type, spacing and motion come from engine/design/tokens.json."),
      h("div", { class: "ds-tools ui-no-print" }, rtl),
      stage,
    ),
  );
}
