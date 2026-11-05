# Site organisation and migration to thelanguagepage.com

- thelanguagepage.com and www are attached to the Pages project `neft-classroom-html-activities` (one codebase). Host routing lives in
  `functions/_lib/language-page.js`; only the lab prefixes are served there, `/` redirects (302) to `/access-practice-lab/`, everything
  else redirects to eduwonderlab.com, www redirects (308) to the apex. robots.txt and sitemap.xml are generated per host.
- eduwonderlab.com keeps serving every existing URL. No old-origin redirects are added until the new origin is verified, and the old site is not deactivated.
- localStorage does not cross origins. Progress moves by user-initiated export/import at `/access-practice-lab/move` (`src/transfer.js`).
- Rollback: remove the custom domain in Cloudflare Pages (Custom domains tab) and delete its CNAME; eduwonderlab.com is unaffected.
- Open: public sections `/learn /worlds /practice /growth /teacher /families` are aliases to be added without removing existing routes.
