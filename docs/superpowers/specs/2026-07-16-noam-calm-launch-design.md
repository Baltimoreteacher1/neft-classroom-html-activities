# Noam Calm Launch Design

## Goal

Make noam.eduwonderlab.com feel immediate, calm, and intentionally focused without changing its data model, sync behavior, mature planning tools, or visual identity.

## Evidence

- The live page initially exposes empty hero, main, and navigation containers while the 12,000-line application bundle initializes.
- The first-run Now view renders every empty dashboard card and reaches roughly 4,400 CSS pixels on a phone.
- The live app has no console errors, no horizontal document overflow, and already provides strong task, routine, sync, accessibility, and academic-support systems.
- The connection control and calendar day controls are slightly below the repository's 44px touch-target standard.

## Approaches Considered

1. **Broad redesign** — visually dramatic, but high regression risk and unnecessary because the current identity is cohesive.
2. **New AI daily copilot** — feature-rich, but duplicates existing Academic Help, Right Now, and smart-planning guidance.
3. **Calm launch refinement (selected)** — improves perceived performance, first-run comprehension, and accessibility while preserving established workflows.

## Experience Design

### Instant app shell

The initial HTML will contain a lightweight, accessible loading state in the hero, main workspace, and navigation. It will communicate “Preparing your day” immediately and use restrained skeleton surfaces that match the current visual system. The app's first render will replace this markup and clear aria-busy.

### Focused first run

While the welcome card is visible and no assignments exist, the Now screen will show only the three cards that help a new user begin:

- Morning routine
- Afternoon plan
- Assignment list

The existing Add/Arrange tile remains available. After the user adds an assignment or chooses Start Fresh, the full personalized dashboard returns. No existing user's saved card order or hidden-card settings are changed.

### Touch and accessibility polish

Persistent connection and calendar controls will meet a 44px minimum target. Loading status will be announced politely, decorative skeletons will be hidden from assistive technology, and reduced-motion preferences will disable skeleton animation.

## Architecture

- focus-school/index.html: meaningful boot markup only.
- focus-school/styles.css: boot-shell and touch-target styles.
- focus-school/app.js: clear busy state during render and select a focused first-run card order.
- focus-school/sw.js: bump the cache version so installed PWAs receive the new shell and styles.
- test/focus-school-shell.test.mjs: static regression contracts for the shell, first-run focus, accessibility, and cache version.

No API, KV, Durable Object, sync-worker, schema, or stored-state changes are required.

## Verification

- New shell contract test fails before implementation and passes after.
- Existing Focus School reliability, sync, routine, planning, and academic-help tests remain green.
- Full repository test, validation, and production build pass.
- Browser QA covers fresh desktop and phone-sized first-run states, no horizontal overflow, touch targets, console errors, and installed-PWA cache version.

## Deployment

Deploy only through the guarded ALLOW_DEPLOY=1 npm run deploy:noam direct-upload workflow. Verify the live service worker version and production UI markers after deployment.
