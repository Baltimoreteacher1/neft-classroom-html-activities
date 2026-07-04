# IT Unlock Email — Automatic Grade Passback

Copy-paste this to your Canvas / LMS administrator when you want to remove the
last manual step (importing scores) for the **interactive, non-quiz** lessons.

> **You do not need this to start.** Bulk import, native auto-graded quizzes,
> and the completion-code grade flow all work today with zero admin help. Send
> this only to unlock fully automatic passback for the interactive lessons.

The wizard at `/teacher-tools/canvas-setup/` renders this same email with a
**Copy email** button. Keep the two in sync if you edit either.

---

**To:** Canvas / LMS Administrator
**From:** Joel Neft — Grade 6 Math
**Subject:** Enable automatic grade passback for my Grade 6 math activities

Hi,

I run a set of interactive Grade 6 math lessons that my students complete online.
I already import them into Canvas myself as Common Cartridge packages and native
QTI quizzes, and the quizzes grade themselves in the gradebook — that part needs
nothing from you.

The one piece I can't do alone is **automatic grade passback for the interactive
(non-quiz) lessons**. Today I work around it by having students paste a
completion code into a Text-Entry assignment and matching scores by hand. To make
that automatic, I'd like you to enable **one** of the following for my course —
whichever fits district policy best:

**Option A — Register my activity site as an LTI 1.3 external tool** (preferred)

In Admin → Developer Keys → **+ LTI Key**, create a key with these values (I'll
confirm the exact production URLs before you save):

- **Target Link URI:** `https://eduwonderlab.com/`
- **OpenID Connect Login URL:** `https://eduwonderlab.com/lti/login`
- **Redirect URIs:** `https://eduwonderlab.com/lti/launch`
- **Public JWK / JWKS URL:** `https://eduwonderlab.com/.well-known/jwks.json`
- **Scopes:** AGS (Assignment and Grade Services) result + score, and Names and
  Role Provisioning (for roster). No account-admin scopes.
- Placement: course navigation / assignment, scoped to my course only.

Then turn the key **On** and add the resulting **Client ID** to my course's
external apps. Send me the Client ID and Deployment ID and I'll finish the
configuration on my end.

**Option B — Enable the SCORM uploader for my course**

In my course's feature options (or account-level if that's how it's set), turn on
**SCORM upload** so I can upload SCORM 1.2 packages that report scores straight to
the gradebook. Nothing else needed — I'll upload and grade them myself.

**Why this is low-risk**

- It's the same standards-based grade passback Canvas already uses for tools your
  district has approved (e.g. Google Drive/Assignments and Nearpod both pass
  grades back via LTI). This is one more LTI tool, scoped to a single teacher's
  course.
- No account-admin scopes, no student PII beyond the existing Canvas roster, and
  the scope is limited to my course's own submissions and grades.
- If you'd rather not enable either, no problem — my current import workflow works
  without admin help, so nothing breaks either way.

I'm happy to hop on a quick call or send a sample package / LTI config JSON for
whichever option is easiest on your end.

Thank you,
Joel Neft
Grade 6 Math
