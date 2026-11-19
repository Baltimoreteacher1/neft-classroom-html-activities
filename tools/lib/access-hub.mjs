// Teacher Hub task groups and secondary sections start folded. Browser tests that drive several sections open
// them the way a teacher does: by clicking each heading. Sections that render late are opened as they appear.
export async function openHubSections(page) {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => {
      for (const summary of document.querySelectorAll(
        "details.th-task-group:not([open]) > summary",
      )) {
        summary.click();
      }
      for (const b of document.querySelectorAll('.fold-toggle[aria-expanded="false"]')) b.click();
    });
    await page.waitForTimeout(250);
  }
}
