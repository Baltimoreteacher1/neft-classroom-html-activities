# Noam School v10 Upgrade

> **v11 (current): rebuilt as an executive-function planner + installable PWA.**
> The app at `/noam-school-v10/` is now a multi-file, offline-first product
> (`index.html` shell + `app.js` + `styles.css` + `sw.js` + `manifest.webmanifest`
>
> - `icons/`). Highlights for a middle-school student with EF challenges:
>
> * **Right Now** — surfaces the single highest-priority task so there's never a
>   decision to make about what to start.
> * **Break it down** — one-tap step templates (worksheet, essay, study, project…)
>   turn a big task into small checkable steps.
> * **Focus timer** — distraction-free overlay with focus/break cycles, partial
>   credit, wake-lock, and points.
> * **Daily routines** — morning / after-school / shutdown checklists.
> * **Momentum** — streaks, points, and wins for motivation.
> * **Accessibility** — light/dark/high-contrast themes, text scaling, readable
>   font, reduced-motion, full keyboard + focus-trap + screen-reader support.
> * **Offline & installable** — service worker caches the app shell; installs to
>   desktop/home screen and runs with no internet.
> * **Sync** — data lives in IndexedDB with a synchronous localStorage mirror
>   (never loses the last action), a downloadable JSON backup for moving between
>   devices, and **optional** Cloudflare-KV cloud sync (off by default, behind a
>   12+ char secret code; backend at `functions/api/state.js`, needs a
>   `NOAM_SCHOOL_KV` binding — degrades gracefully to local-only if absent).
>
> Validated in-browser: offline reload, install/manifest, persistence, focus
> timer, anti-farming point logic, and zero console errors. Audited across
> correctness, security, accessibility (WCAG 2.1 AA), and PWA dimensions.

## v10 (original test version)

This branch adds a safer test version of the Noam School app at:

```txt
/noam-school-v10/
```

## Added features

1. **Paste from Google Classroom**
   - Works when the school blocks Google Classroom API/OAuth.
   - No password storage.
   - No Google tokens.
   - No admin approval needed.
   - Noam copies visible Classroom To-do/Assigned text and pastes it into the app.
   - The app previews parsed assignments before adding them.

2. **Movable homepage cards**
   - Cards can be moved with up/down arrows.
   - Cards can be hidden or shown in the Customize tab.
   - Homepage order saves in browser localStorage.

3. **Gmail browser links**
   - Open Gmail buttons use Gmail web URLs.
   - Teacher email buttons open Gmail compose in the browser instead of Apple Mail.

4. **Customize tab**
   - Student name.
   - Optional Gmail address.
   - Homepage card order.
   - Hide/show card controls.
   - Reset homepage controls.

5. **Optional AI daily update**
   - Adds Cloudflare Pages Function:

```txt
/functions/api/ai/daily-update.js
```

The front end calls:

```txt
/api/ai/daily-update
```

## Cloudflare setup for AI

In Cloudflare Pages project settings, add this secret:

```txt
OPENAI_API_KEY=<your OpenAI API key>
```

Optional variable:

```txt
OPENAI_MODEL=gpt-4.1-mini
```

Do not put the API key in HTML or GitHub.

## Test sequence

1. Deploy this branch as a preview.
2. Open `/noam-school-v10/`.
3. Test Paste Classroom with sample copied text.
4. Test moving and hiding homepage cards.
5. Test Gmail buttons and confirm Gmail opens in browser.
6. Add `OPENAI_API_KEY` in Cloudflare secrets.
7. Turn on AI in the AI Updates tab.
8. Generate a daily update.

## Suggested next step after testing

If v10 works well, copy/merge `noam-school-v10/index.html` into `noam-school/index.html` so the live URL keeps working:

```txt
https://neft-classroom-html-activities.pages.dev/noam-school/
```
