// Activity card: one classroom activity with its time, materials and a single action link. Materials are
// stated plainly (paper and pencil by default); nothing here implies a physical manipulative.
import { createBadge } from "./badge.js";
import { createButton } from "./button.js";
import { createCard } from "./card.js";

/**
 * createActivityCard({ title, summary, href, minutes, materials, skills, actionLabel, headingLevel })
 * The action link's accessible name is "<actionLabel>: <title>" so it still contains its visible label.
 */
export function createActivityCard({
  title,
  summary,
  href,
  minutes,
  materials = "Paper and pencil",
  skills = [],
  actionLabel = "Open activity",
  headingLevel = 3,
} = {}) {
  if (!title) throw new Error("createActivityCard: title is required");
  if (!href) throw new Error("createActivityCard: href is required");
  const action = createButton({ label: actionLabel, href, variant: "primary" });
  action.setAttribute("aria-label", `${actionLabel}: ${title}`);
  const meta = [
    minutes ? createBadge({ label: `${minutes} min`, tone: "info", srPrefix: "Time" }) : null,
    createBadge({ label: materials, tone: "neutral", srPrefix: "Materials" }),
    ...skills.map((s) => createBadge({ label: s, tone: "neutral", srPrefix: "Skill" })),
  ];
  const card = createCard({ title, headingLevel, meta, body: summary, footer: action });
  card.classList.add("ui-activity");
  return card;
}
