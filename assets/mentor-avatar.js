/*!
 * mentor-avatar.js — Neft Lesson Platform · mentor portrait renderer.
 *
 * Builds a flat-illustration SVG portrait of a mentor from a compact set of
 * features carried on their roster entry (skin, hair, facial hair, glasses,
 * clothing, head covering). One renderer, so a mentor looks the same
 * everywhere they appear: Unit 0, the in-lesson pill, the panel.
 *
 * WHY DRAWN AND NOT PHOTOGRAPHED:
 *   Photographs of these people are a mix of copyrighted, unavailable, and —
 *   for the older figures — invented by later artists. A portrait misattributed
 *   to a real person is worse than no portrait. These are honest illustrations:
 *   recognisably a person, drawn to resemble them, not claiming to be a photo.
 *
 * The features are DESCRIPTIVE, never a category. `skin` is a palette key the
 * same way `hair` is; nothing here is grouped, counted, sorted, or filtered on.
 *
 * LAYER ORDER matters and is the thing that makes this read as a face rather
 * than a pile of shapes:
 *   background → long hair (behind shoulders) → skull hair → neck → clothing
 *   → ears → face → beard → fringe/head covering → brows → eyes → nose
 *   → mouth (drawn ON the beard) → moustache → glasses → earrings
 *
 * Exposes window.NTMentorAvatar with svg(mentor, lab, size, opts) plus the
 * SKIN / HAIR / STYLES tables the roster test asserts against.
 *
 * No DOM writes, no storage, no side effects. Safe to load anywhere.
 */
(function () {
  "use strict";

  if (window.NTMentorAvatar && window.NTMentorAvatar.__loaded) return;

  /* ── palettes ───────────────────────────────────────────────────────── */

  var SKIN = {
    s1: { base: "#f4d4bc", shade: "#e0b899", line: "#c9986f" },
    s2: { base: "#eec49a", shade: "#d8a97c", line: "#bb8657" },
    s3: { base: "#dda579", shade: "#c48c60", line: "#a06f45" },
    s4: { base: "#bd7f4e", shade: "#a26a3e", line: "#83512c" },
    s5: { base: "#96603a", shade: "#7d4e2d", line: "#613a20" },
    s6: { base: "#75462a", shade: "#5f3721", line: "#472817" },
    s7: { base: "#55301c", shade: "#432416", line: "#2f180e" },
  };

  var HAIR = {
    black: "#1b1614",
    darkbrown: "#3a2318",
    brown: "#6a4526",
    auburn: "#87401f",
    blonde: "#c9a352",
    gray: "#9a9a99",
    white: "#eae7e3",
    saltpepper: "#5b5957",
  };

  var STYLES = {
    hair: [
      "short",
      "crop",
      "curls",
      "afro",
      "wave",
      "parted",
      "bob",
      "bun",
      "long",
      "wavylong",
      "ringlets",
      "receding",
      "bald",
      "wig18",
      "cap",
      "turban",
      "headwrap",
      "hijab",
    ],
    beard: ["none", "mustache", "goatee", "sideburns", "short", "full"],
    glasses: ["none", "round", "rectangular", "cateye"],
    clothes: [
      "collar",
      "suit",
      "uniform",
      "lab",
      "robe",
      "ruff",
      "cravat",
      "dress",
      "sari",
      "shawl",
    ],
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var COVER = { turban: 1, headwrap: 1, hijab: 1, cap: 1 };

  /* ── clothing (shoulders start at y=78) ─────────────────────────────── */

  function clothing(f) {
    var c = f.clothes || "collar";
    var col = f.clothesColor || "#3f4c63";
    var accent = f.clothesAccent || "#f8fafc";
    var trim = f.tie || "#b91c1c";
    var shoulders =
      '<path d="M16 100 Q17 84 32 78 Q40 75 50 82 Q60 75 68 78 Q83 84 84 100 Z" fill="' +
      col +
      '"/>';

    if (c === "ruff") {
      return (
        shoulders +
        '<ellipse cx="50" cy="78" rx="21" ry="6.5" fill="' +
        accent +
        '"/>' +
        '<ellipse cx="50" cy="78" rx="21" ry="6.5" fill="none" stroke="#cfd5df" stroke-width="0.7"/>' +
        '<ellipse cx="50" cy="77.5" rx="12" ry="3.6" fill="' +
        accent +
        '" stroke="#dde2e9" stroke-width="0.6"/>'
      );
    }
    if (c === "cravat") {
      return (
        shoulders +
        '<path d="M43 78 Q50 76 57 78 Q56 90 50 93 Q44 90 43 78 Z" fill="' +
        accent +
        '"/>' +
        '<path d="M46 82 Q50 87 54 82" fill="none" stroke="#cbd5e1" stroke-width="0.9"/>'
      );
    }
    if (c === "suit") {
      return (
        shoulders +
        '<path d="M41 78 Q50 79 50 92 Q44 86 38 100 L34 100 Q35 82 41 78 Z" fill="' +
        accent +
        '"/>' +
        '<path d="M59 78 Q50 79 50 92 Q56 86 62 100 L66 100 Q65 82 59 78 Z" fill="' +
        accent +
        '"/>' +
        '<path d="M47 83 L53 83 L54.5 100 L45.5 100 Z" fill="' +
        trim +
        '"/>'
      );
    }
    if (c === "uniform") {
      return (
        shoulders +
        '<path d="M42 78 Q50 80 50 91 Q45 85 40 100 L36 100 Q37 82 42 78 Z" fill="' +
        accent +
        '"/>' +
        '<path d="M58 78 Q50 80 50 91 Q55 85 60 100 L64 100 Q63 82 58 78 Z" fill="' +
        accent +
        '"/>' +
        '<rect x="25" y="86" width="11" height="4" rx="2" fill="' +
        trim +
        '"/>' +
        '<rect x="64" y="86" width="11" height="4" rx="2" fill="' +
        trim +
        '"/>' +
        '<circle cx="50" cy="95" r="1.7" fill="' +
        trim +
        '"/>'
      );
    }
    if (c === "lab") {
      return (
        '<path d="M16 100 Q17 84 32 78 Q40 75 50 82 Q60 75 68 78 Q83 84 84 100 Z" fill="#f1f5f9"/>' +
        '<path d="M42 77 Q50 80 50 94 Q44 86 39 100 L35 100 Q36 81 42 77 Z" fill="' +
        col +
        '"/>' +
        '<path d="M58 77 Q50 80 50 94 Q56 86 61 100 L65 100 Q64 81 58 77 Z" fill="' +
        col +
        '"/>'
      );
    }
    if (c === "robe") {
      return (
        shoulders +
        '<path d="M41 77 Q50 82 50 100 L44 100 Q38 88 37 79 Z" fill="' +
        accent +
        '"/>' +
        '<path d="M59 77 Q50 82 50 100 L56 100 Q62 88 63 79 Z" fill="' +
        accent +
        '"/>'
      );
    }
    if (c === "sari" || c === "shawl") {
      return (
        shoulders +
        '<path d="M28 100 Q33 84 50 79 Q62 76 70 82 L74 100 Z" fill="' +
        accent +
        '" opacity="0.95"/>' +
        '<path d="M31 100 Q36 86 51 82" fill="none" stroke="' +
        trim +
        '" stroke-width="1.6" opacity="0.8"/>'
      );
    }
    if (c === "dress") {
      return (
        shoulders + '<path d="M38 79 Q50 89 62 79 L63 85 Q50 96 37 85 Z" fill="' + accent + '"/>'
      );
    }
    return (
      shoulders +
      '<path d="M42 78 Q50 80 50 90 Q45 84 41 79 Z" fill="' +
      accent +
      '"/>' +
      '<path d="M58 78 Q50 80 50 90 Q55 84 59 79 Z" fill="' +
      accent +
      '"/>'
    );
  }

  /* ── long hair mass, drawn behind the shoulders ─────────────────────── */

  function hairBehind(f, hc) {
    var s = f.hair || "short";
    if (s === "long" || s === "parted")
      // narrow, rounded fall — a wide box reads as a hood, not as hair
      return (
        '<path d="M31 42 Q29 66 32 78 Q34 83 38 83 Q34 66 35 46 Z" fill="' +
        hc +
        '"/>' +
        '<path d="M69 42 Q71 66 68 78 Q66 83 62 83 Q66 66 65 46 Z" fill="' +
        hc +
        '"/>'
      );
    if (s === "wavylong")
      return (
        '<path d="M31 42 Q28 66 31 78 Q33 84 38 83 Q33 74 36 64 Q32 58 35 46 Z" fill="' +
        hc +
        '"/>' +
        '<path d="M69 42 Q72 66 69 78 Q67 84 62 83 Q67 74 64 64 Q68 58 65 46 Z" fill="' +
        hc +
        '"/>'
      );
    if (s === "ringlets")
      return (
        '<path d="M32 44 Q30 62 33 72 Q36 76 39 74 Q35 62 36 48 Z" fill="' +
        hc +
        '"/>' +
        '<path d="M68 44 Q70 62 67 72 Q64 76 61 74 Q65 62 64 48 Z" fill="' +
        hc +
        '"/>' +
        '<circle cx="31.5" cy="58" r="5.6" fill="' +
        hc +
        '"/><circle cx="68.5" cy="58" r="5.6" fill="' +
        hc +
        '"/>' +
        '<circle cx="33" cy="68" r="4.8" fill="' +
        hc +
        '"/><circle cx="67" cy="68" r="4.8" fill="' +
        hc +
        '"/>'
      );
    if (s === "wig18")
      return (
        '<path d="M31 42 Q29 62 32 72 Q35 76 39 74 Q35 62 36 46 Z" fill="' +
        hc +
        '"/>' +
        '<path d="M69 42 Q71 62 68 72 Q65 76 61 74 Q65 62 64 46 Z" fill="' +
        hc +
        '"/>' +
        '<circle cx="30" cy="56" r="6.4" fill="' +
        hc +
        '"/><circle cx="70" cy="56" r="6.4" fill="' +
        hc +
        '"/>' +
        '<circle cx="31.5" cy="67" r="5.6" fill="' +
        hc +
        '"/><circle cx="68.5" cy="67" r="5.6" fill="' +
        hc +
        '"/>'
      );
    if (s === "bob")
      return (
        '<path d="M31 42 Q29 60 32 70 Q35 74 39 72 Q35 60 36 46 Z" fill="' +
        hc +
        '"/>' +
        '<path d="M69 42 Q71 60 68 70 Q65 74 61 72 Q65 60 64 46 Z" fill="' +
        hc +
        '"/>'
      );
    if (s === "bun" || s === "updo")
      return (
        '<circle cx="50" cy="21" r="8.5" fill="' +
        hc +
        '"/>' +
        '<path d="M32 42 Q31 60 35 68 L65 68 Q69 60 68 42 Z" fill="' +
        hc +
        '"/>'
      );
    return "";
  }

  /* ── skull hair, drawn under the face so it reads as a hairline ─────── */

  function hairSkull(f, hc) {
    var s = f.hair || "short";
    if (s === "bald") return "";
    if (COVER[s]) return "";
    if (s === "afro") return '<ellipse cx="50" cy="40" rx="28" ry="26" fill="' + hc + '"/>';
    if (s === "curls")
      return (
        '<ellipse cx="50" cy="40" rx="24.5" ry="23.5" fill="' +
        hc +
        '"/>' +
        '<circle cx="32" cy="30" r="7" fill="' +
        hc +
        '"/><circle cx="43" cy="22" r="7.5" fill="' +
        hc +
        '"/>' +
        '<circle cx="57" cy="22" r="7.5" fill="' +
        hc +
        '"/><circle cx="68" cy="30" r="7" fill="' +
        hc +
        '"/>'
      );
    if (s === "wig18")
      return (
        '<ellipse cx="50" cy="39" rx="25" ry="23" fill="' +
        hc +
        '"/>' +
        '<circle cx="34" cy="26" r="7" fill="' +
        hc +
        '"/><circle cx="50" cy="20" r="7.5" fill="' +
        hc +
        '"/>' +
        '<circle cx="66" cy="26" r="7" fill="' +
        hc +
        '"/>'
      );
    if (s === "receding") return '<ellipse cx="50" cy="42" rx="22.5" ry="21" fill="' + hc + '"/>';
    // the common case: a slightly oversized skull so hair shows as a crown
    return '<ellipse cx="50" cy="40" rx="23.5" ry="22.5" fill="' + hc + '"/>';
  }

  /* ── fringe / hairline, drawn ON the face ───────────────────────────── */

  function fringe(f, hc) {
    var s = f.hair || "short";
    if (s === "bald") return "";
    if (COVER[s]) return "";
    if (s === "receding")
      // temples only — the forehead stays bare
      return (
        '<path d="M28.5 44 Q29 33 36 29 Q33 38 33.5 46 Z" fill="' +
        hc +
        '"/>' +
        '<path d="M71.5 44 Q71 33 64 29 Q67 38 66.5 46 Z" fill="' +
        hc +
        '"/>'
      );
    if (s === "crop" || s === "short")
      return (
        '<path d="M28 42 Q30 28 50 28 Q70 28 72 42 Q66 34 50 34 Q34 34 28 42 Z" fill="' + hc + '"/>'
      );
    if (s === "afro" || s === "curls")
      return (
        '<path d="M27 42 Q30 27 50 27 Q70 27 73 42 Q66 33 50 33 Q34 33 27 42 Z" fill="' + hc + '"/>'
      );
    if (s === "parted")
      return (
        '<path d="M28 43 Q29 28 50 28 Q71 28 72 43 Q70 33 54 33 L50 30 Q34 32 28 43 Z" fill="' +
        hc +
        '"/>'
      );
    if (s === "wave" || s === "wavylong")
      return (
        '<path d="M28 43 Q29 28 50 28 Q71 28 72 43 Q69 34 61 33 Q55 38 45 33 Q34 33 28 43 Z" fill="' +
        hc +
        '"/>'
      );
    if (s === "bun" || s === "updo")
      return (
        '<path d="M30 42 Q32 28 50 28 Q68 28 70 42 Q64 33 50 33 Q36 33 30 42 Z" fill="' + hc + '"/>'
      );
    if (s === "wig18")
      return (
        '<path d="M27 41 Q30 27 50 27 Q70 27 73 41 Q66 32 50 32 Q34 32 27 41 Z" fill="' + hc + '"/>'
      );
    // long, bob, ringlets
    return (
      '<path d="M28 43 Q29 28 50 28 Q71 28 72 43 Q65 33 50 33 Q35 33 28 43 Z" fill="' + hc + '"/>'
    );
  }

  /* ── head coverings, drawn ON the face ──────────────────────────────── */

  function covering(f) {
    var s = f.hair || "";
    var c = f.wrapColor || "#e7e5e4";
    if (s === "hijab") {
      return (
        // outer drape falling past the shoulders
        '<path d="M50 15 Q75 15 76 45 Q77 66 72 82 L28 82 Q23 66 24 45 Q25 15 50 15 Z" fill="' +
        c +
        '"/>' +
        // inner opening framing the face
        '<path d="M50 21 Q69 21 70 44 Q70 49 69 53 Q62 32 50 32 Q38 32 31 53 Q30 49 30 44 Q31 21 50 21 Z" fill="' +
        c +
        '"/>' +
        '<path d="M31 52 Q38 31 50 31 Q62 31 69 52" fill="none" stroke="#00000018" stroke-width="1.4"/>'
      );
    }
    if (s === "headwrap") {
      return (
        '<path d="M26 42 Q25 20 50 19 Q75 20 74 42 Q72 33 50 32 Q28 33 26 42 Z" fill="' +
        c +
        '"/>' +
        '<path d="M26 38 Q34 27 50 26 Q66 27 74 38 Q72 30 62 24 Q50 21 38 24 Q28 30 26 38 Z" fill="' +
        c +
        '" opacity="0.55"/>' +
        '<path d="M68 24 Q77 20 76 28 Q74 33 68 31 Z" fill="' +
        c +
        '"/>'
      );
    }
    if (s === "turban") {
      return (
        '<path d="M26 43 Q24 19 50 18 Q76 19 74 43 Q71 32 50 31 Q29 32 26 43 Z" fill="' +
        c +
        '"/>' +
        '<path d="M27 39 Q36 28 50 27 Q64 28 73 39" fill="none" stroke="#00000020" stroke-width="1.8"/>' +
        '<path d="M28 33 Q38 23 50 22 Q62 23 72 33" fill="none" stroke="#00000018" stroke-width="1.8"/>' +
        '<path d="M30 27 Q40 20 50 20 Q60 20 70 27" fill="none" stroke="#00000012" stroke-width="1.6"/>'
      );
    }
    if (s === "cap") {
      // a filled dome, not a rim: an inner cut-out leaves only a thin band
      // visible above the face oval and reads as a headband.
      return (
        '<path d="M27 41 Q26 17 50 17 Q74 17 73 41 Z" fill="' +
        c +
        '"/>' +
        '<path d="M25.5 40 Q50 35 74.5 40 Q74.5 45 50 43 Q25.5 45 25.5 40 Z" fill="' +
        c +
        '"/>' +
        '<path d="M25.5 40 Q50 35 74.5 40" fill="none" stroke="#00000022" stroke-width="1.2"/>'
      );
    }
    return "";
  }

  /* ── facial hair (mouth is drawn after, so it stays visible) ────────── */

  function beard(f, hc) {
    var b = f.beard || "none";
    if (b === "none" || b === "mustache") return "";
    if (b === "goatee")
      return '<path d="M44 70 Q50 66 56 70 Q55 79 50 81 Q45 79 44 70 Z" fill="' + hc + '"/>';
    if (b === "sideburns")
      return (
        '<path d="M29.5 44 Q28.5 56 33 62 L36.5 60 Q33 54 34 45 Z" fill="' +
        hc +
        '"/>' +
        '<path d="M70.5 44 Q71.5 56 67 62 L63.5 60 Q67 54 66 45 Z" fill="' +
        hc +
        '"/>'
      );
    if (b === "short")
      // hugs the jaw, leaves the cheeks and mouth area open
      return (
        '<path d="M31 52 Q31 68 42 76 Q50 79 58 76 Q69 68 69 52 Q67 63 60 68 Q50 72 40 68 Q33 63 31 52 Z" fill="' +
        hc +
        '" opacity="0.92"/>'
      );
    if (b === "full")
      return (
        '<path d="M30 48 Q29 70 40 80 Q50 85 60 80 Q71 70 70 48 Q68 62 62 68 Q50 73 38 68 Q32 62 30 48 Z" fill="' +
        hc +
        '"/>' +
        '<path d="M40 78 Q50 88 60 78 Q50 84 40 78 Z" fill="' +
        hc +
        '"/>'
      );
    return "";
  }

  function mustache(f, hc) {
    var b = f.beard || "none";
    if (b === "mustache" || b === "full" || b === "goatee" || b === "short") {
      return (
        '<path d="M41 64.5 Q45.5 61.5 50 63.5 Q54.5 61.5 59 64.5 Q54 67.5 50 66 Q46 67.5 41 64.5 Z" fill="' +
        hc +
        '"/>'
      );
    }
    return "";
  }

  /* ── glasses ────────────────────────────────────────────────────────── */

  function glasses(f) {
    var g = f.glasses || "none";
    if (g === "none") return "";
    var st = f.glassesColor || "#3b3a38";
    if (g === "round")
      return (
        '<g fill="#ffffff" fill-opacity="0.14" stroke="' +
        st +
        '" stroke-width="1.7" stroke-linecap="round">' +
        '<circle cx="41" cy="52" r="7.2"/><circle cx="59" cy="52" r="7.2"/>' +
        '<path d="M48.2 52 Q50 50.6 51.8 52"/><path d="M33.8 50.5 L28.5 48.5"/><path d="M66.2 50.5 L71.5 48.5"/></g>'
      );
    if (g === "cateye")
      return (
        '<g fill="#ffffff" fill-opacity="0.14" stroke="' +
        st +
        '" stroke-width="1.7" stroke-linecap="round">' +
        '<path d="M33 50 Q33 57.5 41 57.5 Q48.5 57.5 47.5 50 Q44 46.5 33 50 Z"/>' +
        '<path d="M67 50 Q67 57.5 59 57.5 Q51.5 57.5 52.5 50 Q56 46.5 67 50 Z"/>' +
        '<path d="M47.5 51 L52.5 51"/><path d="M33 49 L28 47"/><path d="M67 49 L72 47"/></g>'
      );
    return (
      '<g fill="#ffffff" fill-opacity="0.14" stroke="' +
      st +
      '" stroke-width="1.7" stroke-linecap="round">' +
      '<rect x="33" y="46.8" width="15" height="10.4" rx="2.6"/>' +
      '<rect x="52" y="46.8" width="15" height="10.4" rx="2.6"/>' +
      '<path d="M48 52 L52 52"/><path d="M33 49.5 L28 47.5"/><path d="M67 49.5 L72 47.5"/></g>'
    );
  }

  /* ── the portrait ───────────────────────────────────────────────────── */

  function svg(mentor, lab, size, opts) {
    var s = Number(size) || 72;
    var o = opts || {};
    var f = (mentor && mentor.face) || {};
    var skin = SKIN[f.skin] || SKIN.s3;
    var hc = HAIR[f.hairColor] || HAIR.black;
    var labColor = (lab && lab.color) || "#334155";
    var uid = "ma-" + String((mentor && mentor.id) || "x").replace(/[^a-z0-9-]/gi, "");

    return (
      '<svg class="ma-svg" viewBox="0 0 100 100" width="' +
      s +
      '" height="' +
      s +
      '" role="img" aria-label="Illustration of ' +
      esc((mentor && mentor.name) || "a mathematician") +
      '" focusable="false">' +
      "<defs>" +
      '<clipPath id="' +
      uid +
      '-c"><circle cx="50" cy="50" r="49"/></clipPath>' +
      '<linearGradient id="' +
      uid +
      '-bg" x1="0" y1="0" x2="0.35" y2="1">' +
      '<stop offset="0%" stop-color="' +
      labColor +
      '" stop-opacity="0.22"/>' +
      '<stop offset="100%" stop-color="' +
      labColor +
      '" stop-opacity="0.55"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<g clip-path="url(#' +
      uid +
      '-c)">' +
      '<rect width="100" height="100" fill="url(#' +
      uid +
      '-bg)"/>' +
      hairBehind(f, hc) +
      hairSkull(f, hc) +
      // neck
      '<path d="M43 62 L43 80 Q50 85 57 80 L57 62 Z" fill="' +
      skin.shade +
      '"/>' +
      clothing(f) +
      // ears
      '<ellipse cx="28.6" cy="51" rx="3.6" ry="5.2" fill="' +
      skin.shade +
      '"/>' +
      '<ellipse cx="71.4" cy="51" rx="3.6" ry="5.2" fill="' +
      skin.shade +
      '"/>' +
      // face: oval with a jaw taper
      '<path d="M50 24 C63 24 71.5 33 71.5 45 C71.5 57 66 69 57.5 73.5 C54.5 75 45.5 75 42.5 73.5 C34 69 28.5 57 28.5 45 C28.5 33 37 24 50 24 Z" fill="' +
      skin.base +
      '"/>' +
      beard(f, hc) +
      fringe(f, hc) +
      covering(f) +
      // brows
      '<path d="M35.5 44 Q40.5 41.3 45.5 43.4" fill="none" stroke="' +
      hc +
      '" stroke-width="2.1" stroke-linecap="round"/>' +
      '<path d="M54.5 43.4 Q59.5 41.3 64.5 44" fill="none" stroke="' +
      hc +
      '" stroke-width="2.1" stroke-linecap="round"/>' +
      // eyes
      '<ellipse cx="41" cy="52" rx="3.1" ry="3.4" fill="#fdfdfc"/>' +
      '<ellipse cx="59" cy="52" rx="3.1" ry="3.4" fill="#fdfdfc"/>' +
      '<circle cx="41.3" cy="52.3" r="1.75" fill="' +
      (f.eyes || "#3b2416") +
      '"/>' +
      '<circle cx="59.3" cy="52.3" r="1.75" fill="' +
      (f.eyes || "#3b2416") +
      '"/>' +
      // nose
      '<path d="M50 53.5 L48.6 59.5 Q50 60.6 51.4 59.5" fill="none" stroke="' +
      skin.line +
      '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      // mouth — after the beard on purpose, so a bearded face still has one
      '<path d="M45.2 67.5 Q50 71 54.8 67.5" fill="none" stroke="#96574a" stroke-width="1.9" stroke-linecap="round"/>' +
      mustache(f, hc) +
      glasses(f) +
      (f.earrings
        ? '<circle cx="28.6" cy="58" r="1.9" fill="' +
          esc(f.earrings) +
          '"/><circle cx="71.4" cy="58" r="1.9" fill="' +
          esc(f.earrings) +
          '"/>'
        : "") +
      "</g>" +
      (o.ring === false
        ? ""
        : '<circle cx="50" cy="50" r="48" fill="none" stroke="' +
          labColor +
          '" stroke-width="3"/>') +
      "</svg>"
    );
  }

  window.NTMentorAvatar = {
    __loaded: true,
    svg: svg,
    SKIN: SKIN,
    HAIR: HAIR,
    STYLES: STYLES,
  };
})();
