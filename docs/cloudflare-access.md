# Cloudflare Access vs Canvas SCORM

**Do not put Cloudflare Access across the whole `eduwonderlab.com` hostname.**

Canvas SCORM packages are a two-file wrapper that iframes the **live** lesson
on this origin (`docs/scorm.md`). The ZIP does not contain the lesson. If
Access intercepts `https://eduwonderlab.com/lessons/…` (or the JS/CSS/config
that page then loads), a student who is already logged into Canvas sees an
Access sign-in — or a blank frame — **inside the assignment**. Direct-link
Access and Canvas SCORM Access are the same origin.

Application authentication is a separate, frozen model: see
[`AUTH_CONTRACT.md`](../AUTH_CONTRACT.md). Cloudflare Access is **not** one of
those three gates.

## Intended boundary

| Surface                                                                                | Cloudflare Access      | Application auth                    |
| -------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------- |
| Student lessons, homework, standalone activities                                       | **Must not intercept** | None (anonymous)                    |
| `/assets/**`, `/data/**`, lesson `config.json`, images, fonts                          | **Must not intercept** | None                                |
| Public student APIs (`/api/settings/today`, `/api/progress` health/save/load)          | **Must not intercept** | Designed unauthenticated; fail-open |
| Teacher HTML (`isTeacherSurface()` — planner, teacher-tools, answer keys, `/admin`, …) | Optional extra layer   | `SITE_PASSWORD` HTTP Basic          |
| Teacher APIs (`/api/pacing`, other `TEACHER_KEY` routes)                               | Optional extra layer   | `x-teacher-key` / `TEACHER_KEY`     |

Making the entire hostname public is acceptable **only** if teacher/admin
protection stays fully on application auth (the known-good model). Putting
Access only on teacher path prefixes is also acceptable. Putting Access on
`eduwonderlab.com` / `www.eduwonderlab.com` with no path restriction is not.

Do **not** add a bypass for `/api/*` unless every route under it is proven
intentionally public. Teacher APIs must keep `TEACHER_KEY`.

## What a hostname-wide Access app does to class

1. Teacher uploads a SCORM ZIP to Canvas.
2. Canvas hosts `index.html` (the SCO).
3. The SCO sets `iframe src="https://eduwonderlab.com/lessons/1-1/?lms=scorm&embed=1"`.
4. The student's browser GETs EduWonderLab. Access 302s to
   `*.cloudflareaccess.com/cdn-cgi/access/login/…`.
5. The lesson never renders. Score/completion never reach the LMS.

`npm run validate:scorm-self-contained` proves step 3–4: with the origin
blocked, the lesson does not render. That is the architecture, not a packaging
bug.

## How to inspect live Access

Cloudflare One → Access → Applications. Look for a self-hosted application
whose domain is `eduwonderlab.com` and/or `www.eduwonderlab.com` with no path
(or `/*`).

From an anonymous client:

```bash
npm run diagnose:student-access
npm run diagnose:production-access
```

A required student URL classified `CLOUDFLARE ACCESS INTERCEPT` means Canvas
SCORM will fail for that client. `PUBLIC / PAGES REACHED` means the GET reached
Pages, not an Access login page (a raw HTTP 200 is not enough).

Teacher URLs should be `APP AUTH INTERCEPT` (HTTP Basic / `TEACHER_KEY` 401) or
still Access if you left Access on teacher paths only. They must never be
`PUBLIC / PAGES REACHED`.

## After changing Access

1. `npm run diagnose:production-access` — student PUBLIC, teacher not PUBLIC.
2. `npm run validate:scorm-self-contained` — architecture unchanged (still live-iframe).
3. Optional: `npm run smoke:live -- --no-expect` once student URLs reach Pages.
4. One Canvas Student View launch: lesson appears, no Cloudflare login.

## Can I put Access on the entire hostname?

**No.** That breaks every Canvas SCORM assignment that iframes EduWonderLab.
Protect teacher surfaces with `SITE_PASSWORD` / `TEACHER_KEY` (and Access on
teacher paths if you want defense in depth). Leave the student runtime open.
