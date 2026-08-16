"""SY26-27 Grade 6 Math Planning Calendar — core data model.

Sources (read-only):
  A) Copy of Copy of School Year 2026-2027 TEMPLATE with individual calendars.docx
  B) Course 1 scope and sequence.xls  (sheet "Course 1")
  C) ~/neft-classroom-html-activities/data/curriculum-launch-manifest.json (EduWonderLab canonical)
"""

import json, datetime as dt, os

D = dt.date
# Overridable so the provenance scripts can be RE-RUN from a checkout that is
# not at ~/. Re-running them is how this plan is verified: the generator
# reproduces the committed plan-baseline.json byte for byte, which is what makes
# it evidence rather than a script that once produced something.
REPO = os.environ.get("REPO") or os.path.expanduser("~/neft-classroom-html-activities")
BASE = "https://eduwonderlab.com"

FIRST_DAY = D(2026, 8, 24)
LAST_DAY = D(2027, 6, 11)

# ---------------------------------------------------------------- calendar facts
# SOURCE-DERIVED from the SY26-27 calendar DOCX (day-annotated month grids).
CLOSURES = {  # date -> (School Status, label)
    D(2026, 9, 7): ("Holiday / School Closed", "Labor Day (Schools & Offices closed)"),
    D(2026, 9, 21): ("Wellness Day", "Wellness Day — no students"),
    D(2026, 10, 16): ("PD — No Students", "BTU / PSASA / Quest"),
    D(2026, 11, 3): ("Holiday / School Closed", "Election Day"),
    D(2026, 11, 6): ("PD — No Students", "Systemic PD"),
    D(2026, 11, 25): ("Wellness Day", "Wellness Day — no students"),
    D(2026, 11, 26): ("Holiday / School Closed", "Thanksgiving"),
    D(2026, 11, 27): ("Holiday / School Closed", "Thanksgiving"),
    D(2027, 1, 8): (
        "PD — No Students",
        "School-Based PD (month grid) / Systemic PD (month note) — see Notes",
    ),
    D(2027, 1, 18): ("Holiday / School Closed", "Dr. Martin Luther King Jr. Day"),
    D(2027, 2, 5): ("PD — No Students", "Systemic PD"),
    D(2027, 2, 15): ("Holiday / School Closed", "Presidents Day"),
    D(2027, 3, 5): (
        "PD — No Students",
        "School-Based PD (month grid) / Systemic PD (month note) — see Notes",
    ),
    D(2027, 3, 10): ("Wellness Day", "Wellness Day — no students"),
    D(2027, 5, 7): ("PD — No Students", "Systemic PD"),
    D(2027, 5, 31): (
        "Holiday / School Closed",
        "Memorial Day (Schools & Offices closed)",
    ),
}
BREAKS = [
    ("Winter Break", D(2026, 12, 23), D(2027, 1, 1)),
    ("Spring Break", D(2027, 3, 26), D(2027, 4, 2)),
]
for _n, _a, _b in BREAKS:
    d = _a
    while d <= _b:
        if d.weekday() < 5:
            CLOSURES[d] = ("Break", _n)
        d += dt.timedelta(days=1)

HALF_DAYS = {
    D(2026, 10, 15): "Half Day — Parent-Teacher Conference",
    D(2026, 10, 23): "Early Release — teacher gradebook finalization",
    D(2027, 1, 15): "Early Release — teacher gradebook finalization",
    D(2027, 3, 25): "Early Release — teacher gradebook finalization",
    D(2027, 6, 11): "Half Day — LAST DAY of school; teacher gradebook finalization",
}

QUARTERS = [  # (label, start, end) — starts SOURCE-DERIVED; ends = day before next start
    ("Q1", D(2026, 8, 24), D(2026, 10, 23)),
    ("Q2", D(2026, 10, 26), D(2027, 1, 18)),
    ("Q3", D(2027, 1, 19), D(2027, 4, 2)),
    ("Q4", D(2027, 4, 5), D(2027, 6, 11)),
]

MILESTONES = {
    D(2026, 8, 24): "FIRST DAY OF SCHOOL",
    D(2026, 9, 23): "Q1 progress-report term ends",
    D(2026, 10, 26): "Q2 STARTS",
    D(2026, 12, 1): "Q2 progress-report term ends",
    D(2027, 1, 19): "Q3 STARTS",
    D(2027, 2, 19): "Q3 progress-report term ends",
    D(2027, 4, 5): "Q4 STARTS",
    D(2027, 5, 6): "Q4 progress-report term ends",
    D(2027, 6, 11): "LAST DAY OF SCHOOL",
}
CONFERENCE_WINDOWS = [
    (D(2026, 10, 19), D(2026, 10, 23)),
    (D(2026, 12, 7), D(2026, 12, 11)),
    (D(2027, 3, 1), D(2027, 3, 4)),
    (D(2027, 5, 17), D(2027, 5, 21)),
]
TESTING_WINDOW = (
    D(2027, 3, 29),
    D(2027, 5, 28),
)  # "MCAP Window" on the calendar; MSTAR on the S&S

PRE_YEAR_PD = (D(2026, 8, 18), D(2026, 8, 21), "School and Systemic PD (no students)")

# ---------------------------------------------------------------- scope & sequence
# SOURCE-DERIVED from "Course 1" sheet: teaching order, unit names,
# "Number of Instructional Components" + "Additional Unit Days" = unit day budget.
SEQUENCE = [
    # key, district label, EWL unit, components, additional, S&S assessment marker
    ("PRE", "Pre-Unit: Course 1 Pre Unit", 1, 10.0, 1.0, "Unit Quiz"),
    ("U3", "Unit 3: Ratios & Rates", 3, 19.0, 2.0, "Unit Assessment"),
    ("U4", "Unit 4: Understand and Use Percentages", 4, 15.0, 2.0, "Unit Assessment"),
    (
        "U6",
        "Unit 6: Numerical and Algebraic Expressions",
        6,
        17.0,
        2.0,
        "Unit Assessment",
    ),
    (
        "U7",
        "Unit 7: Integers, Rational Numbers, and the Coordinate Plane",
        7,
        19.0,
        2.0,
        "Unit Assessment",
    ),
    ("U8", "Unit 8: Equations & Inequalities", 8, 20.0, 2.0, "Unit Assessment"),
    (
        "U9",
        "Unit 9: Relationships Between Two Variables",
        9,
        13.0,
        2.0,
        "Unit Assessment",
    ),
    (
        "U5",
        "Unit 5: Solve Area, Surface Area, and Volume Problems",
        5,
        18.0,
        1.0,
        "Unit Assessment",
    ),
    (
        "U2",
        "Unit 2: Understanding the World Around Us Through Statistics",
        2,
        16.0,
        1.0,
        "Unit Assessment",
    ),
    ("MSTAR", "MSTAR Preparation & Take MSTAR", None, 9.0, 0.0, None),
    ("U10", "Unit 10: Math Is...", 10, 8.5, 0.0, None),
]

# CONFLICT RESOLUTION (calendar is authoritative for dates):
#   Wk 11 (Nov 2-6): S&S assumes 4 days; calendar has Nov 3 Election Day AND Nov 6
#     Systemic PD -> 3 days.  Shortfall 1.0, falls inside Unit 4's span.
#   Wk 30 (Mar 22-26): S&S assumes 5 days; calendar has Mar 25 early release (0.5)
#     and Mar 26 Spring Break -> 3.5 days.  Shortfall 1.5, falls inside Unit 5's span.
# The 2.5 lost days are absorbed as flex in the units where they actually occur.
BUDGET_ADJUST = {"U4": -1.0, "U5": -1.5}

UNIT_ACCENT = {  # restrained, print-safe; colour is never the only cue
    1: "2F5C8F",
    2: "1F6F5C",
    3: "8A4B2A",
    4: "5B4A8A",
    5: "1D6A73",
    6: "7A3E5C",
    7: "34617A",
    8: "6B5A1F",
    9: "3F6B3A",
    10: "2F5C8F",
    None: "555555",
}


# ---------------------------------------------------------------- calendar build
# District week numbering (SOURCE-DERIVED from the calendar's "Wk" column):
# sequential Mondays, skipping the two weeks that are entirely break.
def _week_map():
    m, d, n, skip = {}, D(2026, 8, 24), 0, {D(2026, 12, 28), D(2027, 3, 29)}
    while d <= D(2027, 6, 7):
        if d not in skip:
            n += 1
            m[d] = n
        d += dt.timedelta(days=7)
    return m


WEEK_OF_MONDAY = _week_map()


def build_days():
    days, i = [], FIRST_DAY
    while i <= LAST_DAY:
        if i.weekday() < 5:
            monday = i - dt.timedelta(days=i.weekday())
            wk = WEEK_OF_MONDAY.get(monday, 0)
            q = next((q for q, a, b in QUARTERS if a <= i <= b), "")
            if i in CLOSURES:
                status, note = CLOSURES[i]
                mins = "No Students"
            elif i in HALF_DAYS:
                status, note, mins = (
                    "Half Day / Early Release",
                    HALF_DAYS[i],
                    "Half Day",
                )
            else:
                status, note, mins = "Full Instructional Day", "", "Full Day"
            extra = []
            if i in MILESTONES:
                extra.append(MILESTONES[i])
            if any(a <= i <= b for a, b in CONFERENCE_WINDOWS):
                extra.append("Parent-teacher conference window")
            if TESTING_WINDOW[0] <= i <= TESTING_WINDOW[1]:
                extra.append("State testing window (MCAP/MSTAR)")
            days.append(
                dict(
                    date=i,
                    week=wk,
                    quarter=q,
                    status=status,
                    minutes=mins,
                    cal_note="; ".join([n for n in [note] + extra if n]),
                    instructional=status
                    in ("Full Instructional Day", "Half Day / Early Release"),
                    value=0.5 if mins == "Half Day" else 1.0,
                )
            )
        i += dt.timedelta(days=1)
    return days


# ---------------------------------------------------------------- EduWonderLab data
def load_ewl():
    m = json.load(open(f"{REPO}/data/curriculum-launch-manifest.json"))
    lessons = {}
    for l in m["lessons"]:
        lessons.setdefault(l["unit"], []).append(l)
    for u in lessons:
        lessons[u].sort(key=lambda x: x["lesson"])
    sg = {}
    for s in m["smallGroups"]:
        sg.setdefault(s["parent"], []).append(s["resources"]["lesson"])
    cu = {c["parent"]: c for c in m["catchUps"]}
    eou = {e["unit"]: e for e in m["endOfUnit"]}
    return lessons, sg, cu, eou


# ---------------------------------------------------------------- allocation
SOFT = {"Flex", "Catch-Up", "Review", "Reteach", "Project", "MCAP / Testing"}

# Units the district ASSEMBLES rather than inherits from the curriculum's own
# numbering. Ids only, with a written reason; titles resolve from the manifest.
AUTHORED_UNITS = json.load(open(f"{REPO}/data/pacing-unit-lessons.json")).get("units", {})


def authored_sequence(key, lessons):
    """The lesson list for a paced unit whose membership is an authored decision.

    Most paced units are one curriculum unit taught in its own order, so
    `lessons[ewl_unit]` is right and this returns None. The Pre-Unit is not: it
    is a prerequisite-fluency sequence drawn from three canonical units, and
    reading its membership off the unit numbering produced the Unit 1 "Math
    Is..." arc — a coherent-looking list of the wrong lessons, which is why no
    ordering fix would have caught it.
    """
    entry = AUTHORED_UNITS.get(key)
    if not entry:
        return None
    by_id = {l["id"]: l for group in lessons.values() for l in group}
    missing = [i for i in entry["lessons"] if i not in by_id]
    if missing:
        raise SystemExit(f"authored sequence for {key} names unknown lessons: {missing}")
    return [by_id[i] for i in entry["lessons"]]


def build_items(key, label, ewl_unit, budget, assess_marker, lessons, cu, eou, n_slots):
    """Return an ordered list of item dicts sized to n_slots."""
    if key == "MSTAR":
        items = [
            dict(
                day_type="Review",
                title="MSTAR Preparation — Retrieval & Task Types",
                lesson_id="",
                note="Cumulative review; task-type familiarisation",
            )
            for _ in range(3)
        ]
        items += [
            dict(
                day_type="MCAP / Testing",
                title="MSTAR Administration — school dates TBD",
                lesson_id="",
                note="Exact building schedule not in source; confirm with admin",
            )
            for _ in range(n_slots - 3)
        ]
        return items

    ls = authored_sequence(key, lessons) or lessons[ewl_unit]
    has_assess = assess_marker is not None
    has_project = ewl_unit in eou
    n_l = len(ls)
    proj_days = 2 if has_project else 0
    mandatory = n_l + (2 if has_assess else 0) + proj_days
    surplus = n_slots - mandatory
    conflict = None
    while surplus < 0 and proj_days > 1:
        proj_days -= 1
        surplus += 1
    if surplus < 0 and has_assess:
        has_assess = "assess-only"
        surplus += 1  # drop the dedicated review day
    if surplus < 0:
        conflict = f"{label}: budget {n_slots} < minimum {mandatory}"
        surplus = 0

    # spend surplus: catch-up anchors first, then second days for lessons
    anchors = [l["id"] for l in ls if l["id"] in cu]
    second = {}
    if key == "PRE" and surplus > 0:
        # First week of school: extend the opening lesson rather than adding an early
        # catch-up, so Day 1-2 carry routines, math community and the entry math story.
        second[ls[0]["id"]] = 1
        surplus -= 1
    use_cu = set(anchors[:surplus])
    surplus -= len(use_cu)
    idx = 0
    while surplus > 0:
        lid = ls[idx % n_l]["id"]
        if second.get(lid, 0) < 1:  # cap at 2 days per lesson
            second[lid] = 1
            surplus -= 1
        idx += 1
        if idx > n_l * 3:
            break
    trailing_flex = surplus

    items = []
    for l in ls:
        nd = 1 + second.get(l["id"], 0)
        for d in range(nd):
            items.append(
                dict(
                    day_type="Core Lesson" if d == 0 else "Continued Lesson",
                    title=l["title"] + (f" — Day {d + 1}" if nd > 1 else ""),
                    lesson_id=l["id"],
                    standard=l.get("standard", ""),
                    objective=l.get("objective", ""),
                    lesson=l,
                    note="",
                )
            )
        if l["id"] in use_cu:
            c = cu[l["id"]]
            items.append(
                dict(
                    day_type="Catch-Up",
                    title=c["title"],
                    lesson_id=c["id"],
                    standard=c.get("standard", ""),
                    objective=c.get("objective", ""),
                    cu=c,
                    note="Catch-Up station — targeted repair",
                )
            )
    for _ in range(trailing_flex):
        items.append(
            dict(
                day_type="Flex",
                title="Flex / Catch-Up",
                lesson_id="",
                note="Unassigned buffer — absorb slippage or extend a lesson",
            )
        )
    if has_assess is True:
        items.append(
            dict(
                day_type="Review",
                title="Unit Review & Retrieval",
                lesson_id="",
                note="Mixed retrieval across the unit",
            )
        )
    if has_assess:
        items.append(
            dict(
                day_type="Assessment",
                title=f"{assess_marker} — {label.split(':')[0]}",
                lesson_id="",
                note="Scope & sequence marks this assessment for this unit",
            )
        )
    if has_project:
        e = eou[ewl_unit]
        for d in range(proj_days):
            items.append(
                dict(
                    day_type="Project",
                    title=f"{e['title']} — Day {d + 1}",
                    lesson_id="",
                    eou=e,
                    note="Culminating project (multi-day in source)",
                )
            )
    return items, conflict


def swap_hard_off_soft_days(rows):
    """Move new-content launches off half days and off the last day before a long break."""
    soft_types = {"Flex", "Catch-Up", "Review", "Project"}
    multi = {r["lesson_id"] for r in rows if r["day_type"] == "Continued Lesson"}
    moves = []
    for i, r in enumerate(rows):
        if r["day_type"] not in ("Core Lesson", "Assessment"):
            continue
        if r["lesson_id"] in multi:
            continue  # never split a multi-day lesson block
        if not (r["soft_day_reason"]):
            continue
        for j in (
            list(range(i + 1, min(i + 6, len(rows))))
            + list(range(max(0, i - 5), i))[::-1]
        ):
            o = rows[j]
            if o["unit_key"] != r["unit_key"] or o["day_type"] not in soft_types:
                continue
            if o["soft_day_reason"]:
                continue
            keys = ("day_type", "title", "lesson_id", "standard", "objective", "item", "note")
            for k in keys:
                r[k], o[k] = o.get(k, ""), r.get(k, "")
            moves.append((r["date"], o["date"], r["title"]))
            break
    return moves


def unsplit_blocks_across_breaks(rows, gap_days=4):
    """A multi-day lesson must not straddle a long interruption.

    Swap the block one slot earlier with the preceding soft item; the soft item
    becomes the re-entry day after the break, which is where it belongs anyway.
    """
    soft_types = {"Flex", "Catch-Up", "Review"}
    keys = ("day_type", "title", "lesson_id", "standard", "objective", "item", "note")
    fixed = []
    for i in range(len(rows) - 1):
        a, b = rows[i], rows[i + 1]
        if (b["date"] - a["date"]).days < gap_days:
            continue
        if b["day_type"] != "Continued Lesson":
            continue
        j = i
        while j >= 0 and rows[j]["lesson_id"] == b["lesson_id"]:
            j -= 1
        if j < 0 or rows[j]["day_type"] not in soft_types or rows[j]["unit_key"] != b["unit_key"]:
            continue
        block = list(range(j + 1, i + 1)) + [i + 1]
        stash = {k: rows[j].get(k, "") for k in keys}
        for src, dst in zip(block, [j] + block[:-1]):
            for k in keys:
                rows[dst][k] = rows[src].get(k, "")
        for k in keys:
            rows[block[-1]][k] = stash[k]
        rows[block[-1]]["note"] = (stash.get("note") or "") + \
            " · Re-entry after the break — retrieval before new content"
        fixed.append((b["lesson_id"], rows[j]["date"], rows[block[-1]]["date"]))
    return fixed
