# Noam School Daily Dugout — Cloudflare + Google Sync Setup

This repo already contains the Noam School Daily Dugout page, Pages Functions, Google OAuth endpoints, `/api/google/daily-sync`, and a Cloudflare Worker Cron scaffold.

Use this guide to finish the Cloudflare/Google account setup.

## What is already committed

- `noam-school/index.html` — Daily Dugout v9 front end.
- `functions/api/google/login.js` — starts Google OAuth.
- `functions/api/google/callback.js` — handles Google OAuth callback.
- `functions/api/google/status.js` — checks connection status.
- `functions/api/google/calendar.js` — syncs Calendar only.
- `functions/api/google/classroom.js` — syncs Classroom only.
- `functions/api/google/daily-sync.js` — syncs Calendar + Classroom in one request.
- `functions/_lib/google.js` — shared Google OAuth/session helpers.
- `workers/noam-school-cron.js` — background sync Worker scaffold.
- `workers/wrangler.toml.example` — Worker Cron config template.
- `wrangler.pages.toml.example` — Pages config template.

## Current update behavior

The page already updates in the browser:

1. Daily reminders reset once per day.
2. Today Plan resets once per day.
3. Monday–Sunday checklist resets every Monday.
4. Schedule highlights current/next blocks based on the current time.
5. Google Daily Sync runs once per day when the page opens, after Google OAuth is configured.

The Worker Cron setup below adds true background syncing even when the page is not opened.

---

## Step 1 — Create Google OAuth credentials

In Google Cloud Console:

1. Create or open a project.
2. Enable these APIs:
   - Google Calendar API
   - Google Classroom API
3. Go to **APIs & Services → OAuth consent screen**.
4. Configure consent screen.
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
6. Choose **Web application**.
7. Add this authorized redirect URI:

```txt
https://neft-classroom-html-activities.pages.dev/api/google/callback
```

8. Copy the generated:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

Do not commit the client secret to GitHub.

---

## Step 2 — Create the KV namespace

From Terminal:

```bash
npx wrangler login
npx wrangler kv namespace create NOAM_SCHOOL_KV
```

Copy the returned namespace ID.

Optional preview namespace:

```bash
npx wrangler kv namespace create NOAM_SCHOOL_KV --preview
```

---

## Step 3 — Bind KV and variables to the Pages project

Cloudflare Dashboard path:

**Workers & Pages → neft-classroom-html-activities → Settings**

Add the following.

### Variables

Production variables:

```txt
APP_BASE_URL=https://neft-classroom-html-activities.pages.dev
GOOGLE_CLIENT_ID=<paste client id>
```

### Secrets

Production secret:

```txt
GOOGLE_CLIENT_SECRET=<paste client secret>
```

### KV binding

Go to **Settings → Bindings → Add → KV namespace**.

Use this binding name exactly:

```txt
NOAM_SCHOOL_KV
```

Select the namespace created in Step 2.

Then redeploy the Pages project.

---

## Step 4 — Test the page-level daily sync

Open:

```txt
https://neft-classroom-html-activities.pages.dev/noam-school/
```

Then:

1. Open the **Google Sync** tab.
2. Click **Connect Google**.
3. Sign in with Noam's school Google account.
4. Approve access.
5. Return to Daily Dugout.
6. Click **Daily sync now**.

Expected result:

- Calendar events appear.
- Google Classroom courses sync into Classes.
- Coursework appears in Google Sync and can be imported/auto-suggested as assignments.
- The homepage shows a last-updated status.

---

## Step 5 — Deploy the background Cron Worker

After the page-level sync works, deploy the Worker.

From the repo root:

```bash
cd workers
cp wrangler.toml.example wrangler.toml
```

Edit `workers/wrangler.toml`:

- Replace `<NOAM_SCHOOL_KV_NAMESPACE_ID>` with the KV namespace ID.
- Confirm the cron times.

Then set the Google secrets for the Worker:

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

Deploy:

```bash
npx wrangler deploy
```

Check health:

```bash
curl https://noam-school-cron.<YOUR_WORKERS_SUBDOMAIN>.workers.dev/health
```

---

## Suggested Cron schedule

The example uses UTC:

```toml
crons = ["0 12 * * 1-5", "0 21 * * 1-5"]
```

That means:

- Weekday morning UTC check
- Weekday afternoon UTC check

Adjust if needed for the school day.

---

## Notes

- Pages Functions use `context.env.NOAM_SCHOOL_KV`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_BASE_URL`.
- The Worker Cron uses `NOAM_SCHOOL_KV`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
- The user must connect Google once from the Daily Dugout page before the Worker can refresh that user's session in the background.
- If Google does not return a refresh token, disconnect/reconnect and approve access again.
