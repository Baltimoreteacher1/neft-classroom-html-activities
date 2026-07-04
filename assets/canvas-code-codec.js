/**
 * canvas-code-codec.js — single source of truth for Neft "Canvas completion codes".
 *
 * A completion code is a short, copy-paste string a student pastes into a Canvas
 * assignment (Text Entry) to prove they finished an activity and at what score.
 * The SAME file is used by:
 *   - the lesson engine (engine/core/canvas-code.js) to GENERATE the code, and
 *   - the teacher merge tool (teacher-tools/canvas-grades/) to DECODE + verify it.
 * Keeping one codec guarantees the two sides never drift.
 *
 * FORMAT:  NTG1.<base64url(JSON payload)>.<CHK>
 *   payload keys (compact): n name, p period, a activityId, t title,
 *                           s score, m maxScore, pc percent, st stars, d date(YYYYMMDD)
 *   CHK = 4-char checksum over the encoded body + a fixed salt.
 *
 * SECURITY: the salt is shipped in public client code, so the checksum is
 * tamper-RESISTANT (editing the score invalidates the code) but not tamper-PROOF.
 * It is meant for formative classroom work. For high-stakes grades, treat the
 * EduPulse/D1 record as the source of truth, not the pasted code.
 */
(function (global) {
  "use strict";

  var PREFIX = "NTG1";
  var SALT = "neft-canvas-v1"; // obfuscation, not a secret (see header)

  function num(v) {
    if (v === undefined || v === null || v === "") return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }
  function today() {
    return new Date().toISOString().slice(0, 10).replace(/-/g, "");
  }
  function toB64url(str) {
    var utf8 = unescape(encodeURIComponent(str));
    return global.btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function fromB64url(b64) {
    b64 = String(b64).replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return decodeURIComponent(escape(global.atob(b64)));
  }
  function checksum(s) {
    var h = 5381;
    s = String(s);
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    var out = (h >>> 0).toString(36).toUpperCase().slice(-4);
    while (out.length < 4) out = "0" + out;
    return out;
  }

  /** Build a completion code from a graded result. */
  function encode(p) {
    p = p || {};
    var payload = {
      n: String(p.studentName || "").trim(),
      p: String(p.classPeriod || "").trim(),
      a: String(p.activityId || "").trim(),
      t: String(p.activityTitle || "").trim(),
      s: num(p.score),
      m: num(p.maxScore),
      pc: num(p.percent),
      st: num(p.stars),
      d: p.date || today(),
    };
    var body = toB64url(JSON.stringify(payload));
    return PREFIX + "." + body + "." + checksum(body + SALT);
  }

  /**
   * Decode + verify a code. Tolerates surrounding text (e.g. pasted from a
   * Canvas SpeedGrader submission) by scanning for the code pattern.
   * Returns { ok, payload?, code?, reason? }.
   */
  function decode(raw) {
    try {
      var m = String(raw || "").match(/NTG1\.([A-Za-z0-9_-]+)\.([A-Z0-9]{4})/);
      if (!m) return { ok: false, reason: "not-a-code" };
      var body = m[1];
      var chk = m[2];
      if (checksum(body + SALT) !== chk) {
        return { ok: false, reason: "checksum", code: m[0] };
      }
      var payload = JSON.parse(fromB64url(body));
      return {
        ok: true,
        payload: payload,
        code: PREFIX + "." + body + "." + chk,
      };
    } catch (e) {
      return { ok: false, reason: "parse" };
    }
  }

  var api = { encode: encode, decode: decode, PREFIX: PREFIX };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.NeftCanvasCodec = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
