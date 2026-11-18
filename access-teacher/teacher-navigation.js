// Keeps the long Teacher Hub oriented around its four task groups.
const nav = document.getElementById("thTaskNav");
const links = [...(nav?.querySelectorAll('a[href^="#task-"]') || [])];
const targets = links
  .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
  .filter((item) => item.section);

if (nav && targets.length && "IntersectionObserver" in window) {
  const visible = new Map();
  const setCurrent = (current) => {
    for (const { link } of targets) {
      if (link === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };
  const hashTarget = targets.find(({ section }) => `#${section.id}` === location.hash);
  setCurrent(hashTarget?.link || targets[0].link);

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
  nav.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#task-"]');
    if (link && targets.some((item) => item.link === link)) setCurrent(link);
  });
}
