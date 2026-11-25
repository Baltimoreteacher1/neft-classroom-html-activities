// Teacher Family tab: copyable text-message-sized tips (160 characters or fewer, English and Spanish) for the unit.
// The teacher copies a tip and sends it through their own channel; this page sends nothing and stores nothing.
// Tips are built by shared/bcpss-family-tips.js from the unit's authored family block. Behind `family_text_tips`.
import { buildTips, MAX_TIP_CHARS, tipLength } from "../shared/bcpss-family-tips.js";
import { pageFlag } from "../shared/flags/page-flag.js";

export const TIPS_FLAG = "family_text_tips";
const KIND_LABEL = { ask: "Ask", say: "Say it", try: "Try at home", celebrate: "Celebrate" };

function node(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...kids);
  return n;
}

function copyButton(text, lang, live) {
  const b = node("button", { type: "button", class: "bh-btn bh-btn-ghost bh-btn-sm" }, `Copy ${lang === "es" ? "Spanish" : "English"}`);
  b.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      live.textContent = `${lang === "es" ? "Spanish" : "English"} message copied.`;
    } catch {
      live.textContent = "Copy was blocked. Select the message and copy it by hand.";
    }
  });
  return b;
}

function tipRow(tip, live) {
  const line = (lang, text) =>
    node(
      "div",
      { class: "bh-tip-line", lang },
      node("p", { class: "bh-tip-text" }, text),
      node("span", { class: "bh-tip-count" }, `${tipLength(text)}/${MAX_TIP_CHARS}`),
      copyButton(text, lang, live),
    );
  return node("li", { class: "bh-tip", "data-tip": tip.id }, node("strong", {}, KIND_LABEL[tip.kind]), line("en", tip.en), line("es", tip.es));
}

/** Fill `box` with the unit's tips. Safe to call again; a stale call (box removed) does nothing. */
export async function mountFamilyTips(box, unitId, fetchImpl = (...a) => fetch(...a)) {
  if (!(await pageFlag(TIPS_FLAG, fetchImpl))) return;
  let guide;
  try {
    const res = await fetchImpl(`/api/bcpss/family-guide/${encodeURIComponent(unitId)}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    guide = await res.json();
  } catch {
    return;
  }
  if (!box.isConnected) return;
  const tips = buildTips(guide);
  if (!tips.length) return;
  const live = node("p", { class: "visually-hidden", role: "status", "aria-live": "polite" });
  box.replaceChildren(
    node("h4", {}, "Text-message tips for families"),
    node("p", { class: "bh-muted" }, `Short messages in English and Spanish, ${MAX_TIP_CHARS} characters or fewer. Copy one and send it from your own phone or app; this site sends nothing.`),
    live,
    node("ul", { class: "bh-tips" }, ...tips.map((t) => tipRow(t, live))),
  );
}
