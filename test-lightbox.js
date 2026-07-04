import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Log page console messages
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  const filePath = 'http://localhost:5173/blood-on-the-river/chapter-10/index.html';
  console.log('Loading page:', filePath);
  await page.goto(filePath);

  // Wait for the active scene panel to load
  await page.waitForSelector('#activeScenePanel');
  
  // Find the image
  const img = await page.$('.scene-img');
  if (!img) {
    console.error('No .scene-img found on page!');
    await browser.close();
    return;
  }
  
  const src = await img.getAttribute('src');
  console.log('Found .scene-img with src:', src);

  // Click the image
  console.log('Clicking the image...');
  await img.click();

  // Wait a moment for any DOM changes or transitions
  await page.waitForTimeout(500);

  // Take screenshot
  const screenshotPath = '/Users/joelneft/.gemini/antigravity/brain/f5ee7dda-5eae-43ce-91c1-99153873a44f/lightbox_screenshot.png';
  console.log('Taking screenshot and saving to:', screenshotPath);
  await page.screenshot({ path: screenshotPath });

  // Check if lightboxModal was created and has class open
  const lightbox = await page.$('#lightboxModal');
  if (lightbox) {
    const className = await lightbox.getAttribute('class');
    const isVisible = await lightbox.isVisible();
    console.log('Lightbox element found in DOM! Class:', className, 'Visible:', isVisible);
  } else {
    console.log('Lightbox element NOT found in DOM!');
  }

  await browser.close();
}

run().catch(console.error);
