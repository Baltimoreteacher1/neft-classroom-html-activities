// A teacher's own video for a skill, English and/or Spanish. The teacher builds a link (#videos=v1.…) and sends
// it to the class; opening it saves the links on that device and the skill's Learn panel shows them. Only https
// links are kept, and they open in a new tab: the lab embeds nothing from another site.
import { getLang, t } from "./i18n.js";
import { profileKey, profiles, readLocal, writeLocal } from "./school-tools.js";

export const VIDEOS_KEY = "ewl-fluency-videos-v1";
export const MAX_VIDEOS = 24;
export const MAX_URL = 300;

// Returns the cleaned https URL, or "" for anything else (other schemes, credentials, no host, too long).
export function cleanVideoUrl(value) {
  const text = String(value ?? "").trim();
  if (!text || text.length > MAX_URL) return "";
  try {
    const url = new URL(text);
    if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password)
      return "";
    return url.href;
  } catch {
    return "";
  }
}

// { "3:mul-0-5": { en, es } } with at least one valid link per entry, at most MAX_VIDEOS entries.
export function cleanVideos(value, isSkillKey = (key) => /^\d:[\w-]{1,40}$/.test(key)) {
  const out = {};
  if (!value || typeof value !== "object") return out;
  for (const [key, links] of Object.entries(value)) {
    if (Object.keys(out).length >= MAX_VIDEOS) break;
    if (!isSkillKey(key)) continue;
    const en = cleanVideoUrl(links?.en);
    const es = cleanVideoUrl(links?.es);
    if (en || es) out[key] = { ...(en ? { en } : {}), ...(es ? { es } : {}) };
  }
  return out;
}

const toB64 = (text) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
const fromB64 = (text) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0)),
  );

export function encodeVideos(value) {
  const videos = cleanVideos(value);
  return Object.keys(videos).length ? `v1.${toB64(JSON.stringify(videos))}` : null;
}

export function decodeVideos(token) {
  const match = /^v1\.([\w-]{1,6000})$/.exec(String(token || "").trim());
  if (!match) return null;
  try {
    const videos = cleanVideos(JSON.parse(fromB64(match[1])));
    return Object.keys(videos).length ? videos : null;
  } catch {
    return null;
  }
}

export const videosUrl = (value, base = "https://eduwonderlab.com/math/fluency-lab/") => {
  const token = encodeVideos(value);
  return token ? `${base}#videos=${token}` : null;
};

const key = () => profileKey(VIDEOS_KEY, profiles().active);
export const loadVideos = () => cleanVideos(readLocal(key(), {}));

// A new link adds to, and replaces per skill, what the device already has.
export function saveVideos(videos) {
  const merged = cleanVideos({ ...loadVideos(), ...cleanVideos(videos) });
  writeLocal(key(), merged);
  return merged;
}

export function acceptVideosFromHash(hash) {
  const match = /(?:^#|&)videos=([^&]+)/.exec(String(hash || ""));
  const videos = match ? decodeVideos(decodeURIComponent(match[1])) : null;
  if (videos) saveVideos(videos);
  return videos;
}

// The links to show for one skill in the learner's language first. Empty when the teacher set none.
export function videoLinksFor(skillKey, lang, videos = loadVideos()) {
  const entry = videos[skillKey];
  if (!entry) return [];
  const order = lang === "es" ? ["es", "en"] : ["en", "es"];
  return order.filter((code) => entry[code]).map((code) => ({ lang: code, href: entry[code] }));
}

const escapeAttr = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// The Learn panel's video slot: one link per language the teacher gave, empty markup when there is none.
export function videoSlotHtml(skillKey) {
  const links = videoLinksFor(skillKey, getLang());
  if (!links.length) return "";
  const names = { en: "English", es: "Español" };
  return `<p class="learn-video" data-skill-video><strong>${escapeAttr(t("Your teacher's video"))}</strong> ${links
    .map(
      (link) =>
        `<a class="outline-action" href="${escapeAttr(link.href)}" target="_blank" rel="noopener noreferrer" lang="${link.lang}">${escapeAttr(t("Watch the video ({language})", { language: names[link.lang] }))}<span class="fl4-visually-hidden"> ${escapeAttr(t("(opens in a new tab)"))}</span></a>`,
    )
    .join(" ")}</p>`;
}
