# The Language Page: what works offline (measured)

Tested 2026-11-20 against the live site `https://thelanguagepage.com/access-practice-lab/` with Playwright (Chromium via the node
API, not the MCP browser) and against this branch served locally. Offline = `context.setOffline(true)`.
Important: the lab skips its service worker in a driven browser unless the URL carries `?sw=1`
(`src/main.js` `registerOffline`), so every run opened the first page with `?sw=1`. A real browser or the app does not need it.

Method: open the home page online, wait for the worker to activate and warm its cache (1,545 cache entries), open each
surface online and make progress, go offline, open each surface with a fresh navigation AND reload it.

## Result table (live site, desktop Chromium, visited online first)

| Surface                                                          | Works offline?                         | Evidence                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                                                             | Yes                                    | Fresh navigation answered by the service worker, HTTP 200, h1 "Practice English for school, one step at a time"; reload also OK.                                                                                                                                                                                                                               |
| Listening activity (`/Listening/A/classroom-directions`)         | Yes                                    | h1 "Weather Words: Follow a Direction"; the choice picked online was still selected after offline reload.                                                                                                                                                                                                                                                      |
| Reading activity (`/Reading/A/read-main-idea`)                   | Yes                                    | Renders. Answer picked and checked online survived: still selected, feedback "try again" shown (second run).                                                                                                                                                                                                                                                   |
| Speaking activity (`/Speaking/A/speak-ask-for-help`)             | Yes                                    | Renders; picked answer survived.                                                                                                                                                                                                                                                                                                                               |
| Speaking recorder page (`/Speaking/A/v3-s-a-2`) | Not tested offline | Recorded online only (see data inventory). The recorder code makes no network call, but that was read, not run offline. |
| Writing activity (`/Writing/A/v3-w-a-1`)                         | Yes                                    | Typed text autosaved to `accessPracticeLab:v1:Writing:A` and was in the box again after offline navigation.                                                                                                                                                                                                                                                    |
| Games hub and Escape Room                                        | Yes                                    | Both render (h1 "Language Games", "Language Escape Room"). Game progress not exercised.                                                                                                                                                                                                                                                                        |
| Privacy page, Passport | Yes | Both render offline (h1 "Your privacy in the lab", "My Passport"). |
| Saved progress (localStorage)                                    | Yes                                    | Same keys and sizes before and after: `accessPracticeLab:v1:Listening:A`, `...:Speaking:A`, `...:Reading:A`, `...:Writing:A`, prefs. Offline does not touch storage.                                                                                                                                                                                           |
| Activity never opened online before                              | **No on the live site today**          | `Something went wrong` error panel for `/Listening/A/lv5-lunch-line-mc`, `/Reading/A/read-supporting-detail`, `/start`. Cause: the page imports `/shared/class-platform/client.js` and `/shared/qr/qr-code.mjs`, which the worker did not save. **Fixed on this branch** (below); with the fix the same pages render offline (local run, HTTP cache disabled). |
| Mr. Neft question helper (`POST /api/language-guide`)            | No                                     | Online only. Without a network the page falls back to the Site Guide answers (code path in `src/intro/guide.js`).                                                                                                                                                                                                                                              |
| Class features (join a class, share work, voice notes, class AI) | No                                     | Online only (`/api/class/*`).                                                                                                                                                                                                                                                                                                                                  |
| Home page intro video                                            | No                                     | The video file is a Range request, which the worker never touches (`route()` returns "network"); its poster and player script were also unavailable when the HTTP cache was off.                                                                                                                                                                               |
| Cloudflare analytics beacon                                      | No (harmless)                          | `/cdn-cgi/rum` fails offline; nothing depends on it.                                                                                                                                                                                                                                                                                                           |

Not verified: anything inside the iPhone or Android app. See "Native caveats".

## Service worker audit (`access-practice-lab/sw.js`)

Versioning and invalidation are sound: the cache name is `ewl-access-<hash of index.html + content + pictures>`
(generated by `tools/sync-access-shell.mjs`), hashed `?v=` files are cache-first, everything else is network-first with a
3.5 s timeout then the saved copy, the previous build is kept for tabs opened before a deploy, and `/api/`, `config.json`,
`sw.js`, Range requests and cross-origin requests are never touched. `tools/access-sw.test.mjs` passes.

Defects found:

1. **Fixed here.** Modules imported from outside the lab folder were not saved: `/shared/class-platform/{client,book-merge,social}.js`,
   `/shared/qr/qr-code.mjs` (only `contract.js` and the math-language bridge were listed). Effect: any lab page that imports
   them shows "Something went wrong" offline unless the browser's 4-hour HTTP copy happens to still be valid. Measured on the
   live site (activities not opened before) and locally with the HTTP cache disabled (Listening activity error panel).
   Edit: `OUTSIDE_MODULES` gained those four plus `contract.js`, `OUTSIDE` now matches `/shared/(class-platform|qr)/*.js|mjs`.
   The cache name changes with this commit anyway (it hashes `index.html`, which gained the app script tag).
2. **Fixed here.** `/family-app/home-link.js` (the Home button and the language seed) was never saved, so it vanished offline after 4 hours.
   Now matched by `OUTSIDE`.
3. **Not fixed, by design pinned in a test.** `/assets/nt-chrome.js` is deliberately "network" (`tools/access-sw.test.mjs`).
   Offline, the shared chrome script is absent; the page is usable.
4. **Not fixed (needs a design decision).** The first page load is not controlled by the worker, so the shared files that
   page loads (`/assets/mobile-access.css`, the three fonts, `/shared/save-resume/*`, `/assets/nt-*.js`, and in the app the
   `native-app/*` files) are only saved on the second controlled page load. One online visit followed by an offline launch
   the next day (after the 4-hour HTTP copy lapses) can therefore miss fonts and mobile styles. Reproduced locally with
   the HTTP cache disabled. Fix idea: add those URLs to `OUTSIDE_MODULES` so `warmOffline` saves them.
5. Home video assets (`/assets/studio-video/*`, poster) are not saved. Cosmetic.

## Native caveats (for native testing)

- Service workers in an iOS WKWebView only run for App-Bound Domains (`WKAppBoundDomains` in Info.plist plus
  `limitsNavigationsToAppBoundDomains` in the Capacitor config). Without it `navigator.serviceWorker` is unavailable, and every
  row of the table above becomes online-only on iPhone. Verify on a device. The app's offline text is written for the case
  where the worker runs.
- On Android WebView service workers work for `https://` origins loaded from the remote URL.
- `navigator.webdriver` is false in the apps, so the lab registers the worker without `?sw=1`.
