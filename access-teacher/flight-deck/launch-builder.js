const SCAFFOLDS = ["bilingual", "frames", "visual"];
export const LaunchBuilder = Object.freeze({
  build(base, options = {}) {
    const origin = typeof location !== "undefined" ? location.origin : "https://eduwonderlab.com";
    const url = new URL(base, origin);
    const selected = SCAFFOLDS.filter((key) => Boolean(options[key]));
    for (const scaffold of selected) url.searchParams.append("scaffold", scaffold);
    if (options.timerOff) url.searchParams.set("timer", "off");
    return url.href;
  },
});
