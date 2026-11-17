// Teacher Hub sections start folded (access-teacher/hub-folds.js). Browser tests that drive several sections open
// them the way a teacher does: by clicking each section heading. Sections that render late are opened as they appear.
export async function openHubSections(page) {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => {
      for (const b of document.querySelectorAll('.fold-toggle[aria-expanded="false"]')) b.click();
    });
    await page.waitForTimeout(250);
  }
}
