# Noam School v10 Upgrade

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
