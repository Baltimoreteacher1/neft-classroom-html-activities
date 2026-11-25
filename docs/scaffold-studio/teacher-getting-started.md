# Scaffold Studio: getting started (teachers)

**What it is.** A set of supports that help students read, write and speak, and that fade as they need them less. You do not prepare anything. Nothing is handed out.

**Open it.** Go to `/access-practice-lab/supports?scaffold=preview`. Students will not see it until the release switch is turned on (see "Turning it on").

**What students get**
1. **Support dial:** Full, Partial, Hint, On my own. The student picks. "I need more help" is always there, always works, and is never counted against them.
2. **Tap a word:** meaning, an example, a home-language gloss (Spanish today) and a Listen button. Grades 3-5 can also show a picture; grades 6-8 do not by default.
3. **Sentence builder:** long sentences split into who / did / where / when, with the part named in words.
4. **Ask the passage:** it points to the sentence that answers the question. If the answer is not in the text, it says so and does not guess.
5. **Write:** a sentence frame that gets smaller at each step, then feedback in a fixed order: what is working, one next step, why it helps. It says plainly what it cannot check.
6. **Say it first:** model, repeat, own version. The recording stays in the tab; Private mode keeps nothing.

**What you get.** In Teacher view, press CSV or JSON for independence evidence: per unit and domain, how many activities at each support step, how many on their own, and when the student asked for more help. It is counts only. It never contains a score, level or placement.

**Fading, in one line.** After two activities in a row done well at one step, the dial *suggests* one step less. After two requests for help, it suggests one step more. You can pin or turn fading off. The student is always in control.

**Turning it on.** Set `studentRelease` to `true` in `access-practice-lab/content/scaffold/release.json`. The content gate refuses this while any support is not approved, so review comes first (`needs-human-review.md`).

**What it is not.** It does not predict ACCESS scores, place students or grade speech. The WIDA level you plan with is yours; this tool never estimates one.
