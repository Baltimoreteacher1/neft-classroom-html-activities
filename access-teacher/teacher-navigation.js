// Keeps the long Teacher Hub oriented around its four task groups and opens
// the relevant group before an in-page link scrolls to one of its tools.
const nav = document.getElementById("thTaskNav");
const links = [...(nav?.querySelectorAll('a[href^="#task-"]') || [])];
const targets = links
  .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
  .filter((item) => item.section);

function openContainingGroup(target) {
  const element = typeof target === "string" ? document.getElementById(target.replace(/^#/, "")) : target;
  const group = element?.matches?.("details.th-task-group")
    ? element
    : element?.closest?.("details.th-task-group");
  if (group) group.open = true;
  const sec = element?.closest?.("section.th-sec[data-fold], #classEvidencePanel[data-fold]");
  const toggle = sec?.querySelector?.(':scope > .fold-head .fold-toggle[aria-expanded="false"]');
  if (toggle) toggle.click();
  return group;
}

function revealHashTarget() {
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash.slice(1));
  if (openContainingGroup(id)) return;
  // Some targets (notably Family Trip and resource cards) are rendered after
  // page load. Wait for that exact target, then reveal its group.
  const observer = new MutationObserver(() => {
    if (openContainingGroup(id)) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 10000);
}

if (nav && targets.length) {
  const setCurrent = (current) => {
    for (const { link } of targets) {
      if (link === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };
  const hashTarget = targets.find(({ section }) => `#${section.id}` === location.hash);
  setCurrent(hashTarget?.link || targets[0].link);

  if ("IntersectionObserver" in window) {
    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target, entry.boundingClientRect.top);
          else visible.delete(entry.target);
        }
        const active = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
        const item = targets.find(({ section }) => section === active);
        if (item) setCurrent(item.link);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    targets.forEach(({ section }) => observer.observe(section));
  }

  nav.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#task-"]');
    const item = targets.find((target) => target.link === link);
    if (item) {
      item.section.open = true;
      setCurrent(item.link);
    }
  });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href*="#"]');
  if (!link) return;
  const url = new URL(link.href, location.href);
  if (url.origin === location.origin && url.pathname === location.pathname) {
    openContainingGroup(url.hash);
  }
}, true);

revealHashTarget();
window.addEventListener("hashchange", revealHashTarget);

// Resource library cards point at sections teacher.js renders per grade band (K–1 has no tests, weekly links
// or forms). Once the hub has rendered, hide any card whose section is not on the page.
const libraryCards = [...document.querySelectorAll("#thLibrary [data-lib-target]")];
const hubRoot = document.getElementById("hub");
function syncLibrary() {
  if (!hubRoot || hubRoot.querySelector(".boot")) return;
  for (const card of libraryCards) {
    card.closest("li").hidden = !document.getElementById(card.dataset.libTarget);
  }
}
if (libraryCards.length && hubRoot) {
  syncLibrary();
  new MutationObserver(syncLibrary).observe(hubRoot, { childList: true });
}
