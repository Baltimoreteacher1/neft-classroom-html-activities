// Keyed SVG scene renderer. `set(items)` makes the DOM match a step's scene: items that keep their id tween their
// numeric attributes (x, y, width, points, transform channels, opacity), new items fade in (optionally from
// `item.from`), removed items fade out. With animate:false every change is applied at once.
const SVG_NS = "http://www.w3.org/2000/svg";
const XF_DEFAULTS = { tx: 0, ty: 0, rot: 0, dil: 1, mir: 1 };
const XF_CHANNELS = Object.keys(XF_DEFAULTS);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const round = (n) => Math.round(n * 1000) / 1000;

// Transform of an item, applied right to left to a point of the original geometry:
// translate(tx ty) . translate(p) . rotate(rot) . scale(dil) . rotate(ma) . scale(1 mir) . rotate(-ma) . translate(-p)
export function xfString(nums, fixed = {}) {
  const { px = 0, py = 0, ma = 0 } = fixed;
  const c = (name) => nums[`x:${name}`];
  return (
    `translate(${round(c("tx"))} ${round(c("ty"))}) translate(${px} ${py}) rotate(${round(c("rot"))}) ` +
    `scale(${round(c("dil"))}) rotate(${ma}) scale(1 ${round(c("mir"))}) rotate(${-ma}) translate(${-px} ${-py})`
  );
}

function flatten(item, from = null) {
  const nums = {};
  const strs = {};
  const arrays = {};
  for (const [name, value] of Object.entries(item.a || {})) {
    if (typeof value === "number") nums[`a:${name}`] = value;
    else if (Array.isArray(value)) {
      arrays[name] = value.length;
      value.forEach((n, i) => {
        nums[`a:${name}:${i}`] = n;
      });
    } else strs[name] = String(value);
  }
  if (item.xf) for (const name of XF_CHANNELS) nums[`x:${name}`] = item.xf[name] ?? XF_DEFAULTS[name];
  nums.o = item.o ?? 1;
  if (from) {
    for (const [name, value] of Object.entries(from.a || {}))
      if (typeof value === "number") nums[`a:${name}`] = value;
      else if (Array.isArray(value))
        value.forEach((n, i) => {
          nums[`a:${name}:${i}`] = n;
        });
    if (item.xf) for (const name of XF_CHANNELS) if (name in (from.xf || {})) nums[`x:${name}`] = from.xf[name];
    if ("o" in from) nums.o = from.o;
  }
  return { nums, strs, arrays };
}

function applyNums(rec, nums) {
  const { el, shape } = rec;
  for (const key of Object.keys(nums))
    if (key.startsWith("a:") && !key.includes(":", 2)) el.setAttribute(key.slice(2), round(nums[key]));
  for (const [name, length] of Object.entries(shape.arrays)) {
    const parts = [];
    for (let i = 0; i < length; i += 2) parts.push(`${round(nums[`a:${name}:${i}`])},${round(nums[`a:${name}:${i + 1}`])}`);
    el.setAttribute(name, parts.join(" "));
  }
  if (shape.xf) el.setAttribute("transform", xfString(nums, shape.xf));
  el.setAttribute("opacity", round(nums.o));
}

export function createScene(svg, translate, uid = "an") {
  const layer = document.createElementNS(SVG_NS, "g");
  svg.append(layer);
  const records = new Map();
  let raf = 0;
  let active = new Set();

  const finish = (rec) => {
    rec.cur = { ...rec.tween.to };
    applyNums(rec, rec.cur);
    rec.tween = null;
    active.delete(rec);
    if (rec.leaving) {
      rec.el.remove();
      records.delete(rec.id);
    }
  };
  const frame = (now) => {
    raf = 0;
    for (const rec of [...active]) {
      const t = Math.min(1, (now - rec.tween.start) / rec.tween.duration);
      if (t >= 1) finish(rec);
      else {
        const k = ease(t);
        const nums = {};
        for (const key of Object.keys(rec.tween.to)) nums[key] = rec.tween.from[key] + (rec.tween.to[key] - rec.tween.from[key]) * k;
        rec.cur = nums;
        applyNums(rec, nums);
      }
    }
    if (active.size) raf = requestAnimationFrame(frame);
  };
  const retarget = (rec, to, animate, duration) => {
    const from = {};
    for (const key of Object.keys(to)) from[key] = key in rec.cur ? rec.cur[key] : to[key];
    const moves = Object.keys(to).some((key) => from[key] !== to[key]);
    if (!animate || !moves) {
      rec.cur = { ...to };
      rec.tween = null;
      active.delete(rec);
      applyNums(rec, rec.cur);
      if (rec.leaving) {
        rec.el.remove();
        records.delete(rec.id);
      }
      return;
    }
    rec.tween = { from, to, duration, start: performance.now() };
    active.add(rec);
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const resolve = (value) => (typeof value === "string" ? value : translate(value.key, value.vars));

  return {
    set(items, { animate = true, duration = 650 } = {}) {
      const seen = new Set();
      const ordered = [];
      for (const it of items) {
        seen.add(it.id);
        let rec = records.get(it.id);
        const fresh = !rec;
        if (fresh) {
          const el = document.createElementNS(SVG_NS, it.tag);
          el.dataset.id = it.id;
          rec = { id: it.id, el, cur: {}, tween: null, leaving: false, shape: null };
          records.set(it.id, rec);
        }
        rec.leaving = false;
        rec.el.__leaving = false;
        const target = flatten(it);
        rec.shape = { arrays: target.arrays, xf: it.xf ? { px: it.xf.px, py: it.xf.py, ma: it.xf.ma } : null };
        for (const [name, value] of Object.entries(target.strs)) rec.el.setAttribute(name, value.replaceAll("{uid}", uid));
        rec.el.setAttribute("class", it.cls || "");
        if (it.role) rec.el.dataset.role = it.role;
        else delete rec.el.dataset.role;
        if (it.text !== undefined) rec.el.textContent = resolve(it.text);
        if (fresh) {
          const start = flatten(it, it.from || { o: 0 }).nums;
          rec.cur = start;
          applyNums(rec, start);
        }
        retarget(rec, target.nums, animate, duration);
        ordered.push(rec);
      }
      for (const rec of records.values()) {
        if (seen.has(rec.id) || rec.leaving) continue;
        rec.leaving = true;
        rec.el.__leaving = true;
        retarget(rec, { ...rec.cur, o: 0 }, animate, Math.min(duration, 300));
      }
      let cursor = layer.firstChild;
      for (const rec of ordered) {
        while (cursor?.__leaving) cursor = cursor.nextSibling;
        if (cursor === rec.el) cursor = cursor.nextSibling;
        else layer.insertBefore(rec.el, cursor);
      }
    },
    // Complete every running tween now (used when the user jumps with the scrubber).
    flush() {
      for (const rec of [...active]) finish(rec);
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      active = new Set();
      records.clear();
      layer.remove();
    },
  };
}
