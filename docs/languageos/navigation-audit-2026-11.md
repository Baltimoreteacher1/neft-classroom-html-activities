# The Language Page: navigation and layout audit (2026-11-11)

**The publisher's concern:** the activities are strong, but the site feels disjointed, hard to navigate and
overwhelming for teachers, families and students. They want every activity kept, more games and interactive features
added, and the whole site made easy to move through.

**Method:** I crawled 54 top-level sections of the live site (thelanguagepage.com, build 2026.11.04.1) in a 1280×768
browser and measured page length (in screens), visible controls, headings, breadcrumbs and back links. I also read the
code that builds the navigation (`src/nav.js`, `src/views/home.js`, `src/home-registry.js`, `src/intro/*`,
`src/components.js` `crumbsHTML`, `functions/_lib/language-page.js`). Then I checked each finding against three people:
a teacher planning tomorrow's lesson, a parent on a phone with ten minutes, and a grade 6 student who just finished one
activity.

## 1. Findings

Severity: **S1** blocks or misleads people · **S2** adds a lot of friction · **S3** polish.

### 1.1 Structure: no single map of the site (root cause, S1)

Five lists describe the site, each written by hand, and they disagree with each other:

| List                                         | Where it shows  | Destinations                                                        |
| -------------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `nav.js` `menuGroups`                        | the "More" menu | 67 links in 8 groups; one group, "Studios and missions", has **27** |
| `home-registry.js`                           | home page cards | 66 cards                                                            |
| `intro/site-guide-data.js` + `intro/data.js` | the Site Guide  | a separate set of curated activities                                |
| search index                                 | search          | its own set of pages                                                |
| `nav.js` `footerHTML`                        | the footer      | 14 links                                                            |

Because nothing ties a page to a section, the top-menu highlight, the breadcrumb and the menu group can each place the
same page somewhere different:

| Page            | Top-menu highlight | Breadcrumb                  | Menu group           |
| --------------- | ------------------ | --------------------------- | -------------------- |
| Voice Lab       | Practice           | Lab › Practice › Voice Lab  | Studios and missions |
| Speaking Studio | Practice           | Lab › Speaking Studio       | Studios and missions |
| Language City   | Create & Explore   | Lab › Language City         | (missing)            |
| Growth Map      | My Growth          | Lab › Passport › Growth Map | Plan and review      |
| Learn Hub       | Practice           | My Home › Learn             | Practice by skill    |
| Game Studio     | Create & Explore   | _(no breadcrumb)_           | Studios and missions |

### 1.2 Navigation (S1)

- **The top row put a niche studio ahead of the four skills.** It read Access Prep · Continue · Practice ·
  Create & Explore · My Growth · **Science of Reading** · Families. Speaking and Writing, two of the four ACCESS skills,
  had no top-level entry. Teachers had no door at all.
- **"Practice" opened a 7.9-screen activity library** with 83 controls. "Create & Explore" opened an 11-screen Game
  Studio with 93 controls. Neither top link opened an overview of its own section.
- **The "More" menu was a wall of 67 links.** There was no way to see a whole section on one page.
- **Breadcrumbs used four different roots** ("Lab", "My Home", "Passport" in the middle, or none at all) on 51 views
  built by hand. The Game Studio, Teachers Start, Practice Together, Journey, Reading Room and Assessment Simulator had
  no breadcrumb.
- **There was no way to move sideways.** After an activity, the only ways forward were the browser's Back button, the
  home page or the 67-link menu. No page showed the places next to it.
- **The Teacher Expedition link silently leaves the site** (thelanguagepage.com/access-expedition/ returns 308 to
  eduwonderlab.com).

### 1.3 Overload: page length and density (S1/S2)

| Page                 |  Screens | Controls | Notes                                 |
| -------------------- | -------: | -------: | ------------------------------------- |
| Access Prep hub      | **46.3** |  **935** | one page holds the whole prep library |
| Reading Room         | **38.7** |  **361** | the full shelf loads at once          |
| Passport             |     14.0 |      197 |                                       |
| Game Studio          |     11.0 |       93 |                                       |
| Teachers: Start Here |      9.6 |       66 |                                       |
| Speaking Studio      |      8.6 |       31 |                                       |
| Growth Map           |      8.4 |       22 |                                       |
| **Home**             |  **8.3** |  **143** | 17 h2 sections                        |
| Family Corner        |      8.3 |       63 |                                       |

On the home page, a returning student meets at least six competing starting points before the halfway mark: Start
Mission 1, "Start today's mission" (three length buttons), a second and different "Today's mission" block, "Choose a
skill to begin", four studio cards, and "Explore all activities". The same four skills appear three times, under three
sets of names.

### 1.4 Naming (S2)

The same idea goes by several names, and several ideas share almost the same name:

- Speaking: _Expression Studio_ (home card) · _Speaking Studio_ (`/speak`) · _Speaking_ room · _Voice Lab_.
- Writing: _Composition Studio_ · _Writing Studio_ · _Writing_ room · _Sentence Lab_.
- Reading: _Reading Atelier_ · _Reading Room_ · _Reading Ladder_ · _Reading_ room.
- Words: _Word Lab_ · _Word Builder_ (its breadcrumb says _Vocabulary & Morphology_) · _Word cards_.
- Worlds: _Language Worlds_ · _Language World: Science Exhibition_ · _Language Adventures · 9 Story Worlds_ ·
  _Language City_ · _Language Reality Engine_.
- Progress: _My Learning Journey_ · _My Journey Map_ · _My Language Path_ · _My Growth_ · _Growth Map_ · _Passport_ ·
  _portfolio_ · _collection book_.
- Test prep: _Access Prep_ · _Practice tests_ · _Assessment simulator_ · _Road to ACCESS_ · _Skill check-in_.

### 1.5 Audience entry points (S2)

- Teachers: Start Here and Families: Practice Together are good curated starts, but they end at their curated items.
  Neither shows the rest of the site, so a teacher who finishes the tour has nowhere obvious to go next.
- On phones only the Families door was on the top row; teachers had to open "More".

### 1.6 Mobile (S2)

At 375 px the header took three rows, and Teachers was hidden. The new section bar and the Explore filters were
checked at 375 px with no sideways page scroll.

### 1.7 Bugs found during the audit

- Every game in Spanish mode showed a stray `">` because bilingual markup was placed inside an `aria-label`
  (`src/games/screens.js`). **Fixed.**
- The static header in `index.html`, shown before JavaScript runs, listed links the live header no longer had
  ("Language Studios"). **Fixed** (it now matches the live header).

## 2. Design principles for the fix

1. **One map.** Every destination is declared once (section, skill, audience, kind, grade bands). The navigation, the
   section bar, the directory, the start pages and the footer all read from it, so they cannot drift apart.
2. **Every page says where it is.** It shows its section › skill, the places next to it, and "See all".
3. **Sections, not walls.** Each top link opens a section page with filters. No menu group has more than 10 links.
4. **Doors by audience.** Teachers and Families each get a labelled door on the top row at every width. Each start
   page ends with a map of everything that audience can use.
5. **Keep every URL and every activity.** Nothing was removed. Old URLs still resolve, and the home page keeps every
   element that other tests and teachers' links use.

## 3. What was built (this change)

| #   | Change                                                                                                                                                                                                                                                                                                                                                                                               | Files                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Site map**: 69 destinations, 7 sections (Practice, Games & Worlds, ACCESS Prep, My Progress, For Teachers, For Families, Help), 6 skill groups, audience and kind tags, grade bands, route matching                                                                                                                                                                                                | `src/sitemap.js`                                                                                                                     |
| 2   | **New top row**: Access Prep · Home · Practice · Games & Worlds · My Progress · **Teachers** · Families. The current link comes from the site map                                                                                                                                                                                                                                                    | `src/nav.js`, `index.html`                                                                                                           |
| 3   | **"More" menu rebuilt** from the site map, grouped by section (and by skill inside Practice), with "See all" in each group. Largest group: 27 links before, 7 after                                                                                                                                                                                                                                  | `src/nav.js`                                                                                                                         |
| 4   | **Section bar** under the header on every section page: section › skill, the places next to this one, and "See all". It scrolls sideways on phones                                                                                                                                                                                                                                                   | `src/wayfinding.js`, `src/shell.js`, `wayfinding.css`                                                                                |
| 5   | **Explore**: `/explore` lists everything, and `/explore/<section>` gives each section its own page. Filters for who it is for, skill, kind and keyword are kept in the URL, so a teacher can share a filtered view. K–3 sees only the pages it can open                                                                                                                                              | `src/views/explore.js`, `src/main.js`, `src/early/gate.js`                                                                           |
| 6   | **One breadcrumb root**: every trail starts at "Home" (51 views), and game pages now have a full trail                                                                                                                                                                                                                                                                                               | `src/components.js`, `src/games/screens.js`                                                                                          |
| 7   | **Home "Find your way"**: six section tiles right after the start screen, so the page's structure is visible at a glance                                                                                                                                                                                                                                                                             | `src/sitemap-ui.js`, `src/views/home.js`                                                                                             |
| 8   | **Teachers: Start Here** now ends with "Your teacher toolkit": every part of the site, grouped like the menu                                                                                                                                                                                                                                                                                         | `src/intro/start.js`                                                                                                                 |
| 9   | **Families: Practice Together** now ends with "Everything for families"                                                                                                                                                                                                                                                                                                                              | `src/intro/family.js`                                                                                                                |
| 10  | **Footer** rebuilt from the site-map sections                                                                                                                                                                                                                                                                                                                                                        | `src/nav.js`                                                                                                                         |
| 11  | **Three new games**, one for each gap in the Game Studio: **Direction Dash** (Listening, Inform: hear a direction, then act it out on an illustrated scene), **Evidence Hunt** (Reading, Argue/Explain: find the sentence that proves a claim, link it, write it), **Connector Climb** (Writing, Explain/Argue/Narrate: join ideas with the right connector and punctuation, then order a paragraph) | `src/games/{direction-dash,evidence-hunt,connector-climb}*.js`, `content/games/*.json`, `games-{j,k,l}.css`, `src/games/registry.js` |
| 12  | **Tests**: `tools/access-sitemap.test.mjs`. It checks that every entry is complete and in both languages, that every lab route parses and locates back to its own entry, the section bar, the Explore filters, the K–3 rule and the navigation                                                                                                                                                       | `tools/`                                                                                                                             |

## 4. Recommended next phases (not in this change)

| Priority | Recommendation                                                                                                                                                                                                                                                             | Why                                                |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| P1       | Split the Access Prep hub (46 screens) into tabs or sub-pages: What the test is · Practice by part · Full tests · 12-week Road                                                                                                                                             | The longest page on the site, with 935 controls    |
| P1       | Paginate or shelve the Reading Room (39 screens) by level and theme, with a "Continue reading" row                                                                                                                                                                         | The full shelf loads at once                       |
| P1       | Settle one name per idea (§1.4). Suggestion: the four skill rooms are "Listening / Reading / Speaking / Writing practice" everywhere, retiring "Expression Studio", "Composition Studio", "Reading Atelier" and "Sound Studio"                                             | Students meet three names for the same room        |
| P2       | Merge the home page's two "Today's mission" blocks and the duplicate studio/skill rows into one "Today" card, then move the weekly goal and growth to My Progress (this means updating `tools/access-journey-pages.test.mjs` and the e2e suites that click those elements) | Cuts the home page from about 8 screens to about 4 |
| P2       | Move the home-registry cards, the Site Guide's curated lists and the search index onto `src/sitemap.js` as their source                                                                                                                                                    | Finishes the single source of truth                |
| P2       | Serve `/access-expedition/` on thelanguagepage.com, or keep the "(EduWonderLab)" label                                                                                                                                                                                     | It currently leaves the site without warning       |
| P3       | A "Keep going" strip after an activity is finished, using the site map's skill links                                                                                                                                                                                       | Gives a next step without going back home          |
