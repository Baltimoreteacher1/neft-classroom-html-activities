// "I want to…": the nine things a teacher does after the tour, each with one verified lab page. This one list feeds
// the kit's Quick Reference card (Component E), its PDF and DOCX pages, and the permanent Quick Start page
// (/start/quick-start), so a link is written once. Every `to` is a destination id from sitemap.js or a route
// from intro/data.js (tools/access-tour2.test.mjs checks that each one exists).
import { DEST_BY_ID } from "../../sitemap.js";
import { ROUTES, SITE } from "../data.js";

const dest = (id) => `/${DEST_BY_ID[id].href}`;
const routes = ROUTES;

export const QUICK_TASKS = [
  {
    id: "listening",
    icon: "listening",
    want: "Find a listening activity",
    text: "Open the Activity library, choose Listening, then pick a grade band and a support level.",
    links: [
      { label: "Activity library", route: dest("library") },
      { label: "Listening practice", route: dest("listening") },
    ],
  },
  {
    id: "speaking",
    icon: "speaking",
    want: "Find a speaking activity",
    text: "Open the Activity library, choose Speaking, then pick a grade band and a support level.",
    links: [
      { label: "Activity library", route: dest("library") },
      { label: "Speaking Studio", route: dest("speak") },
    ],
  },
  {
    id: "reading",
    icon: "reading",
    want: "Find a reading activity",
    text: "Open the Activity library, choose Reading, or open the Immersive Reader to read any text with audio and word help.",
    links: [
      { label: "Activity library", route: dest("library") },
      { label: "Immersive Reader", route: dest("reader") },
    ],
  },
  {
    id: "writing",
    icon: "writing",
    want: "Find a writing activity",
    text: "Open the Activity library, choose Writing, or go straight to the Writing Studio for longer tasks.",
    links: [
      { label: "Activity library", route: dest("library") },
      { label: "Writing Studio", route: dest("write") },
    ],
  },
  {
    id: "supports",
    icon: "help",
    want: "Choose language supports",
    text: "Pick Starting, Building or Stretching support in the library. Students open frames, word banks and models inside the activity.",
    links: [{ label: "Activity Guide", route: routes.activities }],
  },
  {
    id: "practice",
    icon: "launch",
    want: "Give students practice",
    text: "Launch Studio makes a student link, a QR code and a printable card for any activity.",
    links: [{ label: "Launch Studio", route: dest("launch") }],
  },
  {
    id: "feedback",
    icon: "growth",
    want: "Use feedback and revision",
    text: "Students check their work, revise, and see it in My Passport and the Growth Map on their own device.",
    links: [
      { label: "My Passport", route: dest("passport") },
      { label: "Growth Map", route: dest("growth") },
    ],
  },
  {
    id: "plan",
    icon: "conversation",
    want: "Plan a short lesson",
    text: "Run the Teacher Tour’s Classroom Launch Studio again for a new 5, 10, 15 or 20 minute lesson kit.",
    links: [{ label: "Teacher Tour", route: routes.tour }],
  },
  {
    id: "saved",
    icon: "bookmark",
    want: "Return to my saved lesson",
    text: "Open the Teacher Tour and choose Continue Where I Left Off. Saved work stays in this browser on this device.",
    links: [{ label: "Teacher Tour", route: routes.tour }],
  },
];

/** Where to find more: the teaching pages teachers use most after the tour. */
export const MORE_RESOURCES = [
  { label: "Teacher Quick Start", route: ROUTES.quickStart },
  { label: "Teacher start page", route: ROUTES.start },
  { label: "Activity Guide", route: ROUTES.activities },
  { label: "Whole-Class Studio", route: dest("classroom") },
  { label: "Everything on the site", route: dest("explore") },
];

export const pageUrl = (route) => `${SITE.host}${SITE.base}${route}`;

/** Flat list for plain text and documents: { want, text, url, label }. */
export const quickRows = () =>
  QUICK_TASKS.map((q) => ({
    want: q.want,
    text: q.text,
    label: q.links[0].label,
    url: pageUrl(q.links[0].route),
  }));
