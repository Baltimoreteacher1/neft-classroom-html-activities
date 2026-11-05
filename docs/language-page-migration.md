# The Language Page (thelanguagepage.com): migration record

The ACCESS Practice Lab is served at `https://thelanguagepage.com/` from the **same Cloudflare Pages project and
the same codebase** as eduwonderlab.com. There is one engine and one deploy; nothing is copied, so nothing can drift.

## What the host does

`functions/_lib/language-page.js` is the single source of truth for hostnames and the lab's path allow-list.
`functions/_middleware.js` calls it before any gate runs.

| Request on thelanguagepage.com                                                                                         | Answer                                                                               |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `www.` anything                                                                                                        | 308 to the apex, same path and query                                                 |
| `/`                                                                                                                    | 302 to `/access-practice-lab/` (temporary: the landing page may become its own page) |
| `/robots.txt`, `/sitemap.xml`                                                                                          | generated for this host (the static files name eduwonderlab.com)                     |
| `/access-practice-lab/*`, `/assets/*`, `/shared/*`, `/data/*`, `/cdn-cgi/*`, `/family-app/home-link.js`, `/api/signal` | served (the measured set the lab loads)                                              |
| anything else (lessons, curriculum, teacher tools, `/access-teacher/`)                                                 | 308 to the same path on eduwonderlab.com                                             |

Lab HTML on this host is renamed on the way out: `<title>`, the wordmark ("The Language Page, Powered by EduWonderLab"),
and a self-referencing `<link rel="canonical">` plus `og:` tags. `access-practice-lab/src/brand.js` keeps the running app saying
the same thing; `tools/access-move.test.mjs` fails if the two spellings drift.

**The Teacher Hub is not served here.** Its rosters and typed official scores live in the teacher's browser on
eduwonderlab.com; a second origin would show an empty hub and ask for a second sign-in.

**eduwonderlab.com answers exactly as before.** Nothing on the old host is redirected; `functions/language-page-host.test.mjs`
and `validate:route-contract` pin that.

## Moving a learner's progress

localStorage belongs to one origin, so work saved on eduwonderlab.com is invisible on thelanguagepage.com. The lab has a
`/move` page ("Move my progress", in the footer) on both hosts, built on `src/transfer.js`:

- **Send/receive:** the sender opens the other site and answers its "ready" message with the data, addressed to that exact origin;
  the receiver accepts a message only from the exact partner origin, only after the learner opened it to receive, shows kinds
  and counts of what is arriving (never the work), and writes nothing until the learner presses "Add to this device".
- **File:** download a progress file on one site, choose it on the other (same checks), for blocked pop-ups.
- **Nothing is deleted at either end, nothing goes to a server.** Work already on the receiving device always wins: known record
  families merge through `store.js` `importProgressData`; any other lab key is added only when absent.
- Every key under `accessPracticeLab:` moves (including learner notes and the evidence notebook). The teacher's `accessTeacher:*`
  data never travels with student progress.
- The existing Passport code (`ACCESS1.`) is unchanged and still readable.

Tests: `tools/access-move.test.mjs` (11), `tools/access-move-e2e.mjs` (two origins, `localhost` and `127.0.0.1`, plus a third-origin
attack and a bad file), `functions/language-page-host.test.mjs` (12).

## Redirect map (old to new) and staged release

Paths are identical on both hosts (`/access-practice-lab/...`), so the map is "same path, new host". It is **not enabled**:

1. **Stage 1 (this release):** the new host serves the lab; the old host is untouched; `/move` works on both.
2. **Stage 2:** after the domain is verified live and a learner has moved real progress end to end, announce the new address inside
   the lab (a dismissible notice on eduwonderlab.com linking to `/move`).
3. **Stage 3 (only after Joel agrees):** redirect `eduwonderlab.com/access-practice-lab/*` to the new host with 301/308. Keep
   `/access-practice-lab/move` on eduwonderlab.com **permanently un-redirected** so a learner who arrives late can still export.
   Per CLAUDE.md, changing what an existing URL answers is agreed with Joel first; `validate:route-contract` makes it blocking.

## Cloudflare steps

Pages project custom domains: add `thelanguagepage.com` and `www.thelanguagepage.com`. The zone is in the same Cloudflare account
(Full DNS, zero records before this change); Pages creates the proxied CNAMEs and provisions the certificate. The domain is not
claimed live until `curl -I https://thelanguagepage.com/access-practice-lab/` returns the lab with a valid certificate.

## Rollback

Remove the two custom domains from the Pages project (DNS records go with them). The code is inert on any other host, so no deploy
is needed to roll back. eduwonderlab.com is never changed by this migration.

## Open items

- Google Search Console / Bing Webmaster verification for the new domain needs account access.
- Email templates and Canvas packages that link to the lab keep the eduwonderlab.com URL until Stage 3.
