import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const lessonsDir = path.join(root, "lessons");
const dataDir = path.join(root, "data");

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyOeIR6HcP_DxYgQRT9IbiWojIVPleXAhdKhwucpg1f5sqHovlQ1ea08XrhPvOamkuKVw/exec";

// Retrieve list of all lesson IDs
function getLessonIds() {
  const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;
  return fs.readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => fs.existsSync(path.join(lessonsDir, d, "config.json")))
    .sort((a, b) => {
      const ma = a.match(LESSON_DIR_RE);
      const mb = b.match(LESSON_DIR_RE);
      return (
        Number(ma[1]) - Number(mb[1]) ||
        Number(ma[2]) - Number(mb[2]) ||
        (a.endsWith("-flagship") ? 1 : 0) - (b.endsWith("-flagship") ? 1 : 0)
      );
    });
}

// Fetch with redirect support (Google Apps Script redirects to googleusercontent.com)
async function fetchWithRedirect(url) {
  const response = await fetch(url, {
    redirect: "follow"
  });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.text();
}

async function generateSlidesForLesson(id) {
  const url = `${WEB_APP_URL}?lesson=${encodeURIComponent(id)}`;
  console.log(`[${id}] Requesting slides generation...`);
  
  const html = await fetchWithRedirect(url);
  
  // Check if authorization or sign-in page is returned first
  if (
    html.includes("unable to open the file") || 
    html.includes("AccountChooser") || 
    html.includes("signIn") || 
    html.includes("accounts.google.com")
  ) {
    throw new Error("Authorization Required! Please open the Apps Script project and run selfTest once to authorize scopes.");
  }
  
  // Extract the URL using regex matching href='...' in the success page
  const match = html.match(/href='([^']+)'/);
  if (match && match[1]) {
    return match[1];
  }
  
  // Try fallback double quotes matching
  const matchDouble = html.match(/href="([^"]+)"/);
  if (matchDouble && matchDouble[1]) {
    // Make sure we don't accidentally match a google accounts URL
    if (!matchDouble[1].includes("accounts.google.com")) {
      return matchDouble[1];
    }
  }
  
  throw new Error("Could not extract presentation URL from response HTML.");
}

async function main() {
  const ids = getLessonIds();
  console.log(`Found ${ids.length} lessons to generate Google Slides for.`);
  
  const resultsFile = path.join(dataDir, "google-slides-urls.json");
  let urlMap = {};
  
  if (fs.existsSync(resultsFile)) {
    try {
      urlMap = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
      console.log(`Loaded ${Object.keys(urlMap).length} existing mapped URLs from data/google-slides-urls.json`);
    } catch (e) {
      console.warn("Failed to parse existing data/google-slides-urls.json, starting fresh.");
    }
  }
  
  // Processes lessons sequentially with a small delay to prevent rate limits
  for (const id of ids) {
    if (urlMap[id]) {
      console.log(`[${id}] Already generated: ${urlMap[id]}`);
      continue;
    }
    
    let retries = 2;
    while (retries >= 0) {
      try {
        const url = await generateSlidesForLesson(id);
        urlMap[id] = url;
        console.log(`[${id}] SUCCESS: ${url}`);
        
        // Save incrementally
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(resultsFile, JSON.stringify(urlMap, null, 2), "utf8");
        break;
      } catch (err) {
        console.error(`[${id}] FAILED (Retries left: ${retries}): ${err.message}`);
        retries--;
        if (retries < 0) {
          if (err.message.includes("Authorization Required")) {
            console.error("\nAborting bulk generation: OAuth authorization is required on the Google Account.");
            process.exit(1);
          }
        } else {
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Wait 1.5 seconds between lessons
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log(`\nSlides generation complete. Total slides mapped: ${Object.keys(urlMap).length}/${ids.length}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
