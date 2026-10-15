/* EWL.Rat — exact rational arithmetic for every Curriculum 2.0 surface.
 *
 * Why: 3/5, 6/10, 60/100, 0.6 and 60% are one number. A float-based tool that says
 * 0.1 + 0.2 !== 0.3 teaches the wrong lesson, so everything here is a BigInt
 * numerator/denominator, reduced, with the sign on the numerator.
 *
 *   Rat.of(3, 5)            -> 3/5
 *   Rat.parse("60%")        -> 3/5     (also "3/5", "0.6", "1 1/2", "-2", "1,250", "0.(3)")
 *   a.add(b) .sub .mul .div .neg .inv .pow(int) .abs
 *   a.cmp(b) a.eq(b) a.lt(b) a.isInt() a.isZero() a.sign()
 *   a.frac()  "3/5"       a.mixed()  "1 1/2"      a.percent()  "60%"
 *   a.decimal(places?)    -> {text, repeating, terminating}   0.6 / "0.(3)"
 *   a.num()               -> JS number (display / SVG geometry only, never for judging equality)
 *
 * Judging equality always goes through eq(); num() exists for drawing.
 * Plain-browser IIFE, no dependencies. Loaded in a node:vm context by tools/ewl-core.test.mjs.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});

  function babs(a) {
    return a < 0n ? -a : a;
  }
  function gcd(a, b) {
    a = babs(a);
    b = babs(b);
    while (b) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a;
  }

  function Rat(n, d) {
    if (d === 0n) throw new RangeError("Rat: denominator is zero");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    var g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
    Object.freeze(this);
  }

  function big(x) {
    if (typeof x === "bigint") return x;
    if (typeof x === "number") {
      if (!Number.isInteger(x))
        throw new TypeError("Rat.of: integers only, got " + x + " (use Rat.parse for decimals)");
      return BigInt(x);
    }
    if (typeof x === "string" && /^-?\d+$/.test(x.trim())) return BigInt(x.trim());
    throw new TypeError("Rat.of: not an integer: " + x);
  }

  Rat.of = function (n, d) {
    if (n instanceof Rat) return d === undefined ? n : n.div(Rat.of(d));
    return new Rat(big(n), d === undefined ? 1n : big(d));
  };

  /** Parse "3/5", "0.6", "60%", "1 1/2", "-2", "1,250", "0.(3)", "1/3%". Returns null when it is not a number. */
  Rat.parse = function (s) {
    if (s instanceof Rat) return s;
    if (typeof s === "number") {
      if (!Number.isFinite(s)) return null;
      return Number.isInteger(s) ? Rat.of(s) : Rat.parse(String(s));
    }
    if (typeof s !== "string") return null;
    var t = s
      .replace(/[−–—]/g, "-")
      .replace(/ /g, " ")
      .replace(/(\d),(?=\d{3}(\D|$))/g, "$1")
      .replace(/\$/g, "")
      .trim();
    if (!t) return null;
    var pct = false;
    if (t[t.length - 1] === "%") {
      pct = true;
      t = t.slice(0, -1).trim();
    }
    var m;
    var v = null;
    if ((m = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(t))) {
      if (BigInt(m[4]) === 0n) return null;
      var w = BigInt(m[2]) * BigInt(m[4]) + BigInt(m[3]);
      v = new Rat(m[1] ? -w : w, BigInt(m[4]));
    } else if ((m = /^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(t))) {
      var a = Rat.parse(m[1]);
      var b = Rat.parse(m[2]);
      if (!a || !b || b.isZero()) return null;
      v = a.div(b);
    } else if ((m = /^(-?)(\d*)\.(\d*)\((\d+)\)$/.exec(t))) {
      // repeating decimal 0.(3) or 1.2(45)
      var ip = m[2] || "0";
      var nr = m[3] || "";
      var rp = m[4];
      var den = (10n ** BigInt(rp.length) - 1n) * 10n ** BigInt(nr.length);
      var numr = BigInt(ip + nr + rp) - BigInt(ip + nr);
      v = new Rat(m[1] ? -numr : numr, den);
    } else if ((m = /^(-?)(\d*)\.?(\d*)$/.exec(t)) && (m[2] || m[3])) {
      var frac = m[3] || "";
      var all = BigInt((m[2] || "0") + frac);
      v = new Rat(m[1] ? -all : all, 10n ** BigInt(frac.length));
    } else {
      return null;
    }
    return pct ? v.div(Rat.of(100)) : v;
  };

  var P = Rat.prototype;
  P.add = function (o) {
    o = Rat.of(o);
    return new Rat(this.n * o.d + o.n * this.d, this.d * o.d);
  };
  P.sub = function (o) {
    o = Rat.of(o);
    return new Rat(this.n * o.d - o.n * this.d, this.d * o.d);
  };
  P.mul = function (o) {
    o = Rat.of(o);
    return new Rat(this.n * o.n, this.d * o.d);
  };
  P.div = function (o) {
    o = Rat.of(o);
    if (o.n === 0n) throw new RangeError("Rat: division by zero");
    return new Rat(this.n * o.d, this.d * o.n);
  };
  P.neg = function () {
    return new Rat(-this.n, this.d);
  };
  P.abs = function () {
    return new Rat(babs(this.n), this.d);
  };
  P.inv = function () {
    return Rat.of(1).div(this);
  };
  P.pow = function (k) {
    if (!Number.isInteger(k) || Math.abs(k) > 64)
      throw new RangeError("Rat.pow: integer exponent within +/-64");
    var r = new Rat(this.n ** BigInt(Math.abs(k)), this.d ** BigInt(Math.abs(k)));
    return k < 0 ? r.inv() : r;
  };
  P.cmp = function (o) {
    o = Rat.of(o);
    var l = this.n * o.d;
    var r = o.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  };
  P.eq = function (o) {
    var r = o instanceof Rat ? o : Rat.parse(o);
    return !!r && this.n === r.n && this.d === r.d;
  };
  P.lt = function (o) {
    return this.cmp(o) < 0;
  };
  P.gt = function (o) {
    return this.cmp(o) > 0;
  };
  P.isInt = function () {
    return this.d === 1n;
  };
  P.isZero = function () {
    return this.n === 0n;
  };
  P.sign = function () {
    return this.n < 0n ? -1 : this.n > 0n ? 1 : 0;
  };
  P.floor = function () {
    var q = this.n / this.d;
    return this.n < 0n && this.n % this.d !== 0n ? q - 1n : q;
  };

  P.frac = function () {
    return this.d === 1n ? String(this.n) : this.n + "/" + this.d;
  };
  P.mixed = function () {
    if (this.d === 1n || babs(this.n) < this.d) return this.frac();
    var w = babs(this.n) / this.d;
    var r = babs(this.n) % this.d;
    var sign = this.n < 0n ? "-" : "";
    return r === 0n ? sign + w : sign + w + " " + r + "/" + this.d;
  };
  /** True when the decimal expansion ends (denominator has only factors 2 and 5). */
  P.isTerminating = function () {
    var d = this.d;
    while (d % 2n === 0n) d /= 2n;
    while (d % 5n === 0n) d /= 5n;
    return d === 1n;
  };
  /** Exact decimal expansion. Repeating blocks show in parentheses: 1/3 -> "0.(3)". */
  P.decimal = function (maxPlaces) {
    var limit = maxPlaces == null ? 40 : maxPlaces;
    var neg = this.n < 0n;
    var n = babs(this.n);
    var ip = n / this.d;
    var rem = n % this.d;
    var digits = "";
    var seen = new Map();
    var repeatAt = -1;
    while (rem !== 0n && digits.length < limit) {
      var key = String(rem);
      if (seen.has(key)) {
        repeatAt = seen.get(key);
        break;
      }
      seen.set(key, digits.length);
      rem *= 10n;
      digits += String(rem / this.d);
      rem %= this.d;
    }
    var text;
    if (repeatAt >= 0)
      text = ip + "." + digits.slice(0, repeatAt) + "(" + digits.slice(repeatAt) + ")";
    else text = digits ? ip + "." + digits : String(ip);
    return {
      text: (neg ? "-" : "") + text,
      repeating: repeatAt >= 0,
      terminating: rem === 0n,
    };
  };
  /** "60%" for 3/5; "33 1/3%" for 1/3 so the percent stays exact. */
  P.percent = function () {
    var p = this.mul(100);
    if (p.isInt()) return p.n + "%";
    var d = p.decimal(6);
    return (d.terminating ? d.text : p.mixed()) + "%";
  };
  P.num = function () {
    return Number(this.n) / Number(this.d);
  };
  P.toString = function () {
    return this.frac();
  };
  P.toJSON = function () {
    return this.frac();
  };

  Rat.gcd = function (a, b) {
    return Number(gcd(big(a), big(b)));
  };
  Rat.ZERO = Rat.of(0);
  Rat.ONE = Rat.of(1);
  /** Every equal-value name for a rational: {frac, simplest, hundredths?, decimal, percent}. */
  Rat.names = function (r) {
    r = Rat.of(r);
    var d = r.decimal(12);
    return {
      simplest: r.frac(),
      mixed: r.mixed(),
      decimal: d.text,
      percent: r.percent(),
      terminating: d.terminating,
    };
  };
  /** Equivalent fractions of r with the given denominators (only those that divide evenly). */
  Rat.equivalents = function (r, denominators) {
    r = Rat.of(r);
    var out = [];
    for (var i = 0; i < denominators.length; i++) {
      var d = BigInt(denominators[i]);
      var n = r.n * d;
      if (n % r.d === 0n) out.push({ n: Number(n / r.d), d: Number(d) });
    }
    return out;
  };

  EWL.Rat = Rat;
})(typeof window !== "undefined" ? window : globalThis);
