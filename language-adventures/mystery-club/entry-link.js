(() => {
  const upgradeLegacyLaunches = () => {
    for (const anchor of document.querySelectorAll(
      'a[href*="/language-adventures/adventures/mystery-files/mf-01/"]',
    )) {
      const target = new URL(anchor.href, location.href);
      const elementary = target.searchParams.get("band") === "3-5";
      const story = elementary ? "mascot" : "lantern-1";
      const cluster = elementary ? "2-3" : "6-8";
      const pathway = ["guided", "developing", "independent"].includes(
        target.searchParams.get("pathway"),
      )
        ? target.searchParams.get("pathway")
        : "developing";
      const query = new URLSearchParams({ story, cluster, pathway, domain: "all" });
      anchor.href = `/language-adventures/mystery-club/?${query.toString()}#reader`;
      anchor.dataset.mysteryClubLaunch = story;
    }
  };

  const install = () => {
    const nav = document.querySelector('header nav[aria-label="Primary"]');
    if (!nav) return false;
    if (!nav.querySelector("[data-language-page-story-studio]")) {
      const link = document.createElement("a");
      link.href = "/language-adventures/mystery-club/";
      link.textContent = "Mystery Club";
      link.dataset.languagePageStoryStudio = "";
      link.style.cssText =
        "display:inline-flex;align-items:center;min-height:44px;padding:6px 12px;border:1px solid #142d47;border-radius:999px;background:#142d47;color:#fff;text-decoration:none;font-weight:700";
      nav.append(link);
    }
    upgradeLegacyLaunches();
    return true;
  };

  const afterLoad = () => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 24) window.clearInterval(timer);
    }, 250);
  };

  if (document.readyState === "complete") window.setTimeout(afterLoad, 1200);
  else window.addEventListener("load", () => window.setTimeout(afterLoad, 1200), { once: true });
})();
