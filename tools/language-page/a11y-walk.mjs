// Keyboard walk + structural accessibility checks for one loaded page. Pure measurement, no opinions about the site:
// each check returns a list of plain-English problems, empty when the page is fine.
//   walkProblems(page, maxTabs)  Tab through the page: every stop needs a name and a visible indicator, no tabindex > 0,
//                                no stop outside the viewport once focused, no focus loss mid-page.
//   layoutProblems(page)         horizontal overflow and non-inline controls under 24 CSS px (WCAG 2.2 target size, AA).

function focusInfo() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const labelled = el.getAttribute("aria-labelledby");
  const name = (
    el.getAttribute("aria-label") ||
    (labelled
      ? labelled
          .split(/\s+/)
          .map((i) => document.getElementById(i)?.textContent || "")
          .join(" ")
      : "") ||
    el.getAttribute("alt") ||
    (el.labels ? [...el.labels].map((l) => l.textContent).join(" ") : "") ||
    el.textContent ||
    el.getAttribute("title") ||
    el.getAttribute("placeholder") ||
    el.value ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim();
  const outline =
    cs.outlineStyle !== "none" &&
    (Number.parseFloat(cs.outlineWidth) || 0) >= 1 &&
    cs.outlineColor !== "rgba(0, 0, 0, 0)";
  const shadow = cs.boxShadow && cs.boxShadow !== "none";
  return {
    label: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${el.className && typeof el.className === "string" ? `.${el.className.split(" ")[0]}` : ""}`,
    name: name.slice(0, 50),
    tabindex: el.getAttribute("tabindex"),
    inViewport: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
    indicator: outline || shadow,
  };
}

export async function walkProblems(page, maxTabs = 60) {
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
  });
  const problems = [];
  const seen = new Set();
  let stops = 0;
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    const f = await page.evaluate(focusInfo);
    if (!f) {
      if (stops > 3) break; // focus left the document: the walk wrapped to browser chrome
      problems.push(`focus lost after ${stops} Tab stops`);
      break;
    }
    const k = `${f.label}|${f.name}`;
    if (seen.has(k)) break;
    seen.add(k);
    stops += 1;
    if (!f.name) problems.push(`${f.label}: focusable control with no accessible name`);
    if (!f.indicator) problems.push(`${f.label} "${f.name}": no visible focus indicator`);
    if (f.tabindex && Number(f.tabindex) > 0)
      problems.push(`${f.label}: positive tabindex ${f.tabindex}`);
    if (!f.inViewport) problems.push(`${f.label} "${f.name}": focused but not scrolled into view`);
  }
  if (stops < 3) problems.push(`only ${stops} keyboard stops on the page`);
  return problems;
}

export async function layoutProblems(page) {
  return page.evaluate(() => {
    const out = [];
    const over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    if (over > 1) out.push(`horizontal overflow ${over}px`);
    const sel = "a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab]";
    for (const el of document.querySelectorAll(sel)) {
      let r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === "hidden" || cs.display === "none") continue;
      if (el.closest("[hidden],[inert]")) continue;
      if (el.tagName === "A" && cs.display === "inline") continue; // inline text links are exempt (2.5.8)
      // A checkbox or radio is also operated through its label, so the label's box is its target.
      const label =
        el.closest("label") || (el.id ? document.querySelector(`label[for="${el.id}"]`) : null);
      if (
        label &&
        label.getBoundingClientRect().width >= 24 &&
        label.getBoundingClientRect().height >= 24
      ) {
        const lr = label.getBoundingClientRect();
        r = { width: Math.max(r.width, lr.width), height: Math.max(r.height, lr.height) };
      }
      if (r.width < 24 || r.height < 24)
        out.push(
          `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}" is ${Math.round(r.width)}x${Math.round(r.height)}px (under 24)`,
        );
    }
    return out;
  });
}
