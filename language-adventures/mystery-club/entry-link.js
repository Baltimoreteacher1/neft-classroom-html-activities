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

  // The Access Prep link the static export never had in its client bundle. It is added after hydration (like the
  // Mystery Club link below): written into the exported HTML it made React's first render mismatch (error #418) and
  // the client render then removed it again.
  const ACCESS_PREP = "<a class=\"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all bg-[#142d47] text-[#f8d58c] hover:bg-[#1e3f63] hover:text-white shadow-sm\" href=\"/access-practice-lab/access-prep\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-sparkles size-3.5\" aria-hidden=\"true\"><path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\"></path></svg><span>Access Prep</span></a>";

  const install = () => {
    const nav = document.querySelector('header nav[aria-label="Primary"]');
    if (!nav) return false;
    if (!nav.querySelector('a[href="/access-practice-lab/access-prep"]'))
      nav.insertAdjacentHTML("afterbegin", ACCESS_PREP);
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
