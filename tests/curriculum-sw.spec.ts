import { expect, test } from "@playwright/test";

/**
 * Service-worker lifecycle regression for the curriculum hub.
 *
 * The hub reloads itself when a NEW service worker replaces an old one, so a
 * student with the page open during a deploy gets fresh HTML instead of stale
 * cached markup. That behaviour is deliberate — see the SW stale-refresh fix.
 *
 * But sw.js also calls clients.claim(), which fires `controllerchange` the FIRST
 * time a worker takes control of a previously-uncontrolled page. On a fresh
 * session there is nothing stale to refresh, so the hub was reloading on every
 * first visit: every student loaded the site's heaviest page twice, and usage
 * telemetry counted one visit as two until nt-usage.js grew a dedupe.
 *
 * This asserts both halves: one document on a fresh session, and the refresh
 * machinery still present for the replacement case.
 */

// The shared config sets serviceWorkers: "block". This spec is ABOUT the
// service worker, so it must opt back in or it verifies nothing at all.
test.use({ serviceWorkers: "allow" });

test("a fresh visit to the hub builds exactly one document", async ({ page }) => {
  let documents = 0;
  await page.exposeFunction("__docInit", () => {
    documents += 1;
  });
  // addInitScript runs once per document, so it counts navigations the page
  // performs on itself — which a normal load-event listener cannot see.
  await page.addInitScript(() => {
    (window as unknown as { __docInit?: () => void }).__docInit?.();
  });

  await page.goto("/curriculum/");
  // Generous: the reload, when it happened, occurred after the SW activated,
  // which is well after load.
  await page.waitForTimeout(5000);

  expect(
    documents,
    "the hub reloaded itself on a fresh session — clients.claim() fired " +
      "controllerchange with no previous controller, and the refresh handler " +
      "did not guard for that case",
  ).toBe(1);
});

test("the stale-content refresh handler is still wired", async ({ page }) => {
  await page.goto("/curriculum/");
  // Guard the guard: if a future edit removes the controllerchange listener
  // entirely, first-visit reloads stop AND so does the refresh-after-deploy
  // behaviour the listener exists for. Both must survive.
  const html = await page.content();
  expect(html).toContain("controllerchange");
  expect(html).toContain("serviceWorker.controller");
});
