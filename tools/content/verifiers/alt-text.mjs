// Verifier: alt text and image provenance. Every informative image reference in a unit or lesson must carry alt text, decorative
// images must be marked decorative, and no image may be fetched from outside the repository. It REPORTS; it never edits.
//
// What counts as an image reference (the studio and lesson payloads have no inline images today: `media.images` is [] in all 1,584
// lessons and the only pictures are emoji icons and vocabulary picture cues, so a clean sweep is a statement about those shapes):
//   - an entry of `media.images[]`            a string cannot carry alt text, so a bare string is ALT_MISSING
//   - an object whose `src`, `url`, `image`, `img`, `file`, `path` or `href` names an image file (png jpg jpeg gif webp svg avif)
//   - a string with an <img> tag
//   - a vocabulary picture cue (`cue` next to `term`): the written description the picture is drawn from, which is also its alt text
//   - an `icon` (emoji): decorative by definition, so it must sit beside visible text (`label`, `text`, `term`, `prompt`, `command`)
//
// Findings:
//   ALT_MISSING             error  informative image with no alt (or an <img> without alt)
//   ALT_WEAK                warn   alt is a filename, a generic word ("image", "photo"), shorter than 3 characters, or starts "image of"
//   ALT_DECORATIVE_HAS_ALT  warn   decorative:true together with a non-empty alt (a screen reader would read it)
//   ALT_EXTERNAL_IMAGE      error  http(s):// or protocol-relative image reference (nothing is fetched from outside the repo)
//   ALT_ICON_ONLY           error  an icon with no visible text beside it, so it is the only carrier of meaning
//   ALT_CUE_THIN            warn   a picture cue under 4 words or equal to the term
//   ALT_CUE_DUPLICATE       warn   two different terms in one unit share one cue (two pictures cannot match one description)
//   ALT_CUES_CHECKED        info   cues examined (coverage floor: a parser that sees no cues fails)
//   ALT_REFS_CHECKED        info   image references examined (0 today; not floored)
//   ALT_DECORATIVE_ICONS    info   icons seen
//
// data: URIs are inside the page, not fetched, so they are not external; they still need alt. Hand-read false-positive classes:
// a `href` to a downloadable file that is not an image is not matched (extension test); the word "image" inside a normal cue
// ("an image of a clock") is only a warn for alt fields, never for cues.
import { rootOf, walkObjects } from "./lib/walk.mjs";

export const name = "alt-text";
export const coverageCodes = ["ALT_CUES_CHECKED"];

const IMAGE_FILE = /\.(?:png|jpe?g|gif|webp|svg|avif)(?:[?#].*)?$/i;
const IMAGE_KEYS = ["src", "url", "image", "img", "file", "path", "href"];
const EXTERNAL = /^(?:https?:)?\/\//i;
const IMG_TAG = /<img\b[^>]*>/gi;
const VISIBLE_TEXT = ["label", "text", "term", "prompt", "command", "title", "say"];
const GENERIC_ALT =
  /^(?:image|picture|photo|photograph|graphic|figure|icon|img|pic|illustration|diagram)s?$/i;

const at = (code, severity, path, message, evidence = {}) => ({
  code,
  severity,
  path,
  message,
  evidence,
});
const words = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

function refSource(obj) {
  for (const k of IMAGE_KEYS) {
    const v = obj[k];
    if (typeof v === "string" && (IMAGE_FILE.test(v) || v.startsWith("data:image/"))) return v;
  }
  return null;
}

function altProblems(path, obj, src) {
  const out = [];
  if (EXTERNAL.test(src))
    out.push(
      at("ALT_EXTERNAL_IMAGE", "error", path, "image is fetched from outside the repository", {
        src,
      }),
    );
  const alt = typeof obj.alt === "string" ? obj.alt.trim() : "";
  if (obj.decorative === true) {
    if (alt)
      out.push(
        at("ALT_DECORATIVE_HAS_ALT", "warn", path, "decorative image carries alt text", { alt }),
      );
    return out;
  }
  if (!alt) {
    out.push(
      at(
        "ALT_MISSING",
        "error",
        path,
        "informative image has no alt text and is not marked decorative",
        { src },
      ),
    );
    return out;
  }
  const file = src.split(/[/?#]/).filter(Boolean).pop() || "";
  if (
    alt.length < 3 ||
    GENERIC_ALT.test(alt) ||
    alt.toLowerCase() === file.toLowerCase() ||
    /^image of\b/i.test(alt)
  )
    out.push(
      at("ALT_WEAK", "warn", path, 'alt text is generic, a filename, or starts "image of"', {
        alt,
      }),
    );
  return out;
}

export function verify(target) {
  const findings = [];
  const cues = new Map(); // cue -> Set(term)
  let cueCount = 0;
  let refs = 0;
  let icons = 0;
  for (const { path, obj } of walkObjects(rootOf(target))) {
    if (Array.isArray(obj.images))
      obj.images.forEach((entry, i) => {
        if (typeof entry !== "string") return;
        refs += 1;
        const where = `${path ? `${path}.` : ""}images[${i}]`;
        findings.push(
          at("ALT_MISSING", "error", where, "a bare image string cannot carry alt text", {
            src: entry,
          }),
        );
        if (EXTERNAL.test(entry))
          findings.push(
            at(
              "ALT_EXTERNAL_IMAGE",
              "error",
              where,
              "image is fetched from outside the repository",
              { src: entry },
            ),
          );
      });
    const src = refSource(obj);
    if (src) {
      refs += 1;
      findings.push(...altProblems(path, obj, src));
    }
    if (typeof obj.cue === "string" && typeof obj.term === "string") {
      cueCount += 1;
      const n = words(obj.cue).length;
      if (n < 4 || obj.cue.trim().toLowerCase() === obj.term.trim().toLowerCase())
        findings.push(
          at("ALT_CUE_THIN", "warn", path, "picture cue is too short to describe a picture", {
            term: obj.term,
            cue: obj.cue,
          }),
        );
      if (EXTERNAL.test(obj.cue.trim()) || IMAGE_FILE.test(obj.cue.trim()))
        findings.push(
          at(
            "ALT_EXTERNAL_IMAGE",
            "error",
            path,
            "picture cue is a file or URL, not a description",
            { cue: obj.cue },
          ),
        );
      const key = obj.cue.trim().toLowerCase();
      cues.set(key, (cues.get(key) || new Set()).add(obj.term.trim().toLowerCase()));
    }
    if (typeof obj.icon === "string") {
      icons += 1;
      if (!VISIBLE_TEXT.some((k) => typeof obj[k] === "string" && obj[k].trim()))
        findings.push(
          at("ALT_ICON_ONLY", "error", path, "icon has no visible text beside it", {
            icon: obj.icon,
          }),
        );
    }
  }
  const walkStrs = JSON.stringify(rootOf(target));
  for (const tag of walkStrs.match(IMG_TAG) || []) {
    refs += 1;
    const alt = /\balt\s*=\s*\\?["']([^"'\\]*)/i.exec(tag);
    const decorative = /\b(?:aria-hidden\s*=\s*\\?["']true|role\s*=\s*\\?["']presentation)/i.test(
      tag,
    );
    if (EXTERNAL.test(/\bsrc\s*=\s*\\?["']([^"'\\]*)/i.exec(tag)?.[1] || ""))
      findings.push(
        at("ALT_EXTERNAL_IMAGE", "error", "", "<img> loads from outside the repository", {
          tag: tag.slice(0, 120),
        }),
      );
    if (!(alt && alt[1].trim()) && !(alt && decorative))
      findings.push(
        at("ALT_MISSING", "error", "", "<img> has no alt text", { tag: tag.slice(0, 120) }),
      );
  }
  for (const [cue, terms] of cues)
    if (terms.size > 1)
      findings.push(
        at("ALT_CUE_DUPLICATE", "warn", "", "different terms share one picture cue", {
          cue,
          terms: [...terms],
        }),
      );
  findings.push(at("ALT_CUES_CHECKED", "info", "", "picture cues examined", { n: cueCount }));
  findings.push(at("ALT_REFS_CHECKED", "info", "", "image references examined", { n: refs }));
  findings.push(at("ALT_DECORATIVE_ICONS", "info", "", "icons seen", { n: icons }));
  return findings;
}

const unit = (studio, lessons = []) => ({
  id: "fx-alt",
  grade: "3",
  subject: "ELA",
  studio,
  lessons,
});
const cue = "A red barn beside a tall silver silo.";

export const fixtures = {
  bad: [
    {
      name: "image without alt, external image, bare string, img tag",
      target: unit(
        {
          vocab: [{ term: "barn", cue }],
          figure: { src: "/images/barn.png" },
          far: { src: "https://cdn.example.com/barn.jpg", alt: "A red barn in a field" },
        },
        [{ id: "fx-l01", media: { images: ["/images/silo.png"] }, note: '<img src="/a.png">' }],
      ),
      expect: ["ALT_MISSING", "ALT_EXTERNAL_IMAGE"],
    },
    {
      name: "weak alt, decorative with alt",
      target: unit({
        vocab: [{ term: "barn", cue }],
        a: { src: "/images/barn.png", alt: "image" },
        b: { src: "/images/frame.svg", decorative: true, alt: "a frame" },
      }),
      expect: ["ALT_WEAK", "ALT_DECORATIVE_HAS_ALT"],
    },
    {
      name: "icon alone and a thin cue",
      target: unit({ vocab: [{ term: "barn", cue: "A barn." }], options: [{ icon: "🐄" }] }),
      expect: ["ALT_ICON_ONLY", "ALT_CUE_THIN"],
    },
    {
      name: "one cue for two terms",
      target: unit({
        vocab: [
          { term: "barn", cue },
          { term: "silo", cue },
        ],
      }),
      expect: ["ALT_CUE_DUPLICATE"],
    },
  ],
  good: [
    {
      name: "alt present, decorative marked, local files, icon beside a label",
      target: unit(
        {
          vocab: [{ term: "barn", cue, icon: "🏠" }],
          figure: { src: "/images/barn.png", alt: "A red barn beside a tall silver silo" },
          rule: { src: "/images/divider.svg", decorative: true },
          options: [{ icon: "🐄", label: "cow" }],
          tag: '<img src="/images/a.png" alt="A cow in a field">',
        },
        [
          {
            id: "fx-l01",
            media: { images: [{ src: "/images/silo.png", alt: "A tall silver silo" }], audio: [] },
          },
        ],
      ),
    },
  ],
};
