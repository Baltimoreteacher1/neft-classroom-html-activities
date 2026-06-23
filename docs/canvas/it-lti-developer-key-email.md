**To:** BCPS Canvas Administrator / IT
**From:** Joel Neft — Grade 6 Math Teacher
**Subject:** Request to register one LTI 1.3 Developer Key for my Canvas course

---

Hi,

I've built a set of interactive Grade 6 math lessons that I use with my
students. I'd like them to launch from inside Canvas and report grades back to
the Canvas gradebook automatically.

This uses **LTI 1.3**, the standards-based integration mechanism Canvas already
supports natively — the same kind of connection used by tools like Google Drive
and Nearpod. No custom code runs inside Canvas; it is a standard Developer Key
registration.

Could you please create **one LTI 1.3 Developer Key**, scoped to my course or
sub-account, with the values below?

**Tool name:** Neft Lessons
**Owner:** Joel Neft (jdneft@gmail.com)

**Configuration URLs**

| Field                                | Value                                              |
| ------------------------------------ | -------------------------------------------------- |
| Target Link / Redirect URI           | `https://neft-lti.jdneft.workers.dev/lti/launch`   |
| OpenID Connect Initiation URL        | `https://neft-lti.jdneft.workers.dev/lti/login`    |
| Public JWK URL                       | `https://neft-lti.jdneft.workers.dev/lti/jwks`     |
| Deep Linking (content selection) URL | `https://neft-lti.jdneft.workers.dev/lti/deeplink` |

**LTI Advantage services to enable**

- **Assignment and Grade Services (AGS)** — lets a completed lesson post its
  score to the gradebook.
- **Deep Linking** — lets me add a lesson as an assignment from inside Canvas.
- **Names and Role Provisioning (NRPS)** — _optional_; used only to match a
  student to their existing gradebook row.

**Placements:** Assignment Selection and Link Selection (for Deep Linking).

**Scope & privacy:** my courses only. The tool receives only the student name
and ID already present in the Canvas roster — no additional personal information
is collected or stored. It runs on standard cloud hosting.

Once the key is created, Canvas will generate a **Client ID** and a
**Deployment ID**. Please send those back to me and I'll complete the
connection on my end.

If a full LTI 1.3 registration isn't something you're able to enable, a lighter
alternative that solves part of this is turning on the **SCORM package
uploader** for my course, and I can fall back to that. LTI is the cleaner,
fully-supported option if it's available.

Thank you very much — happy to hop on a quick call if that's easier.

Joel Neft
Grade 6 Math, Baltimore County Public Schools

---

_Note: the four URLs above go live once the integration Worker is deployed.
Send this once the tool endpoints are stood up so the addresses resolve when
IT tests them._
