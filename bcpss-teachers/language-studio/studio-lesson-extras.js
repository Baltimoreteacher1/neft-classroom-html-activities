// Language Studio Player — lessons: step extras (Spanish gloss, kind placeholder, student link + QR).
import { renderQrSvg } from "../qr-svg.js";
import { announce, copyText, esc, h } from "./studio-core.js";
import { studentUrl } from "./studio-lesson-data.js";

/** Spanish glosses for this step: items that carry `es`, plus the lesson's own vocabulary (unit cards, then helper cards). */
export function glossPairs(studioVocab, lesson, activity) {
  const seen = new Map();
  const add = (term, es) => {
    const key = String(term || "").toLowerCase();
    if (key && es && !seen.has(key)) seen.set(key, { term, es });
  };
  for (const item of activity.payload?.items || [])
    if (item && typeof item === "object") add(item.term, item.es);
  const byTerm = new Map((studioVocab || []).map((v) => [String(v.term).toLowerCase(), v]));
  for (const v of lesson.vocab || [])
    add(v.term, byTerm.get(String(v.term).toLowerCase())?.es ?? v.card?.es);
  return [...seen.values()];
}

export function glossNode(pairs) {
  return h(
    "section",
    { class: "sl-gloss", "aria-labelledby": "slGlossH" },
    h("h3", { id: "slGlossH", lang: "es" }, "En español"),
    pairs.length
      ? h(
          "ul",
          null,
          pairs.map((p) => h("li", null, `${p.term} = `, h("span", { lang: "es" }, p.es))),
        )
      : h("p", null, "No Spanish help for this step yet."),
  );
}

export function placeholder(root, failed, retry) {
  root.replaceChildren(
    h(
      "div",
      { class: "st-card st-stage--placeholder", role: failed ? "alert" : null },
      h("h3", null, "This activity is getting its finishing touches"),
      h(
        "p",
        { class: "st-run__mission" },
        failed
          ? "It did not load. Check your connection and try again, or move to the next step."
          : "Check back soon. It will be ready shortly.",
      ),
      failed && retry
        ? h(
            "p",
            null,
            h("button", { type: "button", class: "st-btn", onclick: retry }, "Try again"),
          )
        : null,
    ),
  );
}

export function sharePanel(app, lesson, route, step) {
  const url = studentUrl(app, { lesson: lesson.id, step: step.id, track: route.track });
  const qr = h("div", { class: "sl-qr" });
  try {
    qr.innerHTML = renderQrSvg(url, {
      sizePx: 168,
      label: `QR code: student link to ${esc(step.label)}`,
    });
  } catch {
    qr.append(h("p", null, "The QR code is not available. Copy the link instead."));
  }
  const field = h("input", {
    type: "text",
    readonly: true,
    id: "slShareUrl",
    class: "sl-url",
    value: url,
  });
  return h(
    "details",
    { class: "sl-share" },
    h("summary", null, "Student link and QR code"),
    h(
      "div",
      { class: "sl-share__body" },
      h("label", { for: "slShareUrl" }, "Student link for this step"),
      field,
      h(
        "button",
        {
          type: "button",
          class: "st-btn st-btn--sm",
          onclick: async () =>
            announce(
              (await copyText(url))
                ? "Link copied."
                : "Copy did not work. Select the link and copy it.",
            ),
        },
        "Copy link",
      ),
      qr,
    ),
  );
}
