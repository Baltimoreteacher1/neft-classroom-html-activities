// The Starter Kit as data: built once from the family's choices and the chosen real activity, then drawn as HTML on
// the screen (kit.js), as a PDF (kit-pdf.js) and as the one-page card. One source, so the three can never disagree.
import { t } from "./i18n.js";
import { activityUrl, domainUrl, labUrl } from "./picks.js";

const SPLIT = {
  5: [1, 1, 2, 1],
  10: [1, 2, 5, 2],
  15: [2, 3, 7, 3],
};

/** The home routine, scaled to the minutes the family has and shaped by the kind of activity. */
export function routine(pick, minutes) {
  const [ready, talk, practice, share] = SPLIT[minutes] || SPLIT[10];
  const kind = pick.domain === "Speaking" ? "speaking" : "writing";
  const lessHelp = pick.level === "C";
  return [
    { mins: ready, title: t("kit.r.ready"), text: t(lessHelp ? "kit.r.readyLess" : `kit.r.ready_${kind}`) },
    { mins: talk, title: t("kit.r.talk"), text: t(`kit.r.talk_${kind}`) },
    { mins: practice, title: t("kit.r.practice"), text: t(`kit.r.practice_${kind}`) },
    { mins: share, title: t(`kit.r.share_${kind}`), text: t(`kit.r.shareText_${kind}`) },
  ];
}

export function kitData(state, pick, origin = location.origin) {
  const kind = pick.domain === "Speaking" ? "speaking" : "writing";
  const lang = t("meta.code");
  const url = activityUrl(pick, origin);
  return {
    lang,
    title: t("kit.title"),
    first: {
      heading: t("kit.a.title"),
      name: pick.title,
      practice: lang === "es" ? pick.skillEs : pick.skill,
      minutes: pick.minutes,
      steps: t(`kit.a.steps_${kind}`),
      supportsTitle: t("kit.a.supportsTitle"),
      supports: t("kit.a.supports"),
      url,
      qrLabel: t("kit.a.qr"),
    },
    routineHeading: t("kit.b.title"),
    routineIntro: t("kit.b.intro", { n: state.minutes }),
    routine: routine(pick, state.minutes),
    sayHeading: t("kit.c.title"),
    say: t("kit.c.say"),
    sayNote: t("kit.c.note"),
    helpHeading: t("kit.d.title"),
    help: [
      { title: t("kit.d.unsure"), text: t("kit.d.unsureText") },
      { title: t("kit.d.mistake"), text: t("kit.d.mistakeText") },
      { title: t("kit.d.frustrated"), text: t("kit.d.frustratedText") },
    ],
    trackerHeading: t("kit.e.title"),
    trackerIntro: t("kit.e.intro"),
    trackerCols: [t("kit.e.date"), t("kit.e.activity"), t("kit.e.status"), t("kit.e.practiced"), t("kit.e.next")],
    tracker: state.tracker.map((row) => ({
      ...row,
      statusLabel: row.status ? t(`kit.e.${row.status}`) : "",
    })),
    returnHeading: t("kit.f.title"),
    returnLines: [
      { label: t("kit.f.site"), value: labUrl(origin), url: labUrl(origin) },
      { label: t("kit.f.speaking"), value: domainUrl("Speaking", pick.band, origin), url: domainUrl("Speaking", pick.band, origin) },
      { label: t("kit.f.writing"), value: domainUrl("Writing", pick.band, origin), url: domainUrl("Writing", pick.band, origin) },
      { label: t("kit.f.again"), value: url, url },
      { label: t("kit.f.kit"), value: t("kit.f.kitHow"), url: "" },
    ],
    footer: t("kit.footer"),
    cardTitle: t("kit.card.title"),
  };
}
