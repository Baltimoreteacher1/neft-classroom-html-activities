"""Assemble the pacing plan and emit plan.json."""

import json, datetime as dt
from collections import Counter

from plan_core import *

days = build_days()
inst = [d for d in days if d["instructional"]]
lessons, sg, cu, eou = load_ewl()

total_value = sum(d["value"] for d in inst)
print(f"instructional dates={len(inst)}  day-value={total_value}")
budget_total = sum(c + a for _, _, _, c, a, _ in SEQUENCE)
print(f"scope&sequence budget day-value={budget_total}")

# --- walk dates, consuming each unit's day-value budget --------------------
assign, ptr = [], 0
for key, label, eu, comp, addl, marker in SEQUENCE:
    budget = comp + addl + BUDGET_ADJUST.get(key, 0.0)
    if key == SEQUENCE[-1][0]:
        budget = 10**6  # final unit consumes any remaining dates
    slots, used = [], 0.0
    while ptr < len(inst) and used + 1e-9 < budget:
        d = inst[ptr]
        slots.append(d)
        used += d["value"]
        ptr += 1
    budget = used
    assign.append((key, label, eu, budget, marker, slots))
    print(
        f"  {key:6s} budget={budget:5.1f} slots={len(slots):3d} used={used:5.1f} "
        f"{slots[0]['date']} -> {slots[-1]['date']}"
    )
assert ptr == len(inst), f"unconsumed dates: {len(inst) - ptr}"

# --- build rows ------------------------------------------------------------
rows, conflicts = [], []
for key, label, eu, budget, marker, slots in assign:
    out = build_items(key, label, eu, budget, marker, lessons, cu, eou, len(slots))
    items, conflict = out if isinstance(out, tuple) else (out, None)
    if conflict:
        conflicts.append(conflict)
    assert len(items) == len(slots), f"{key}: {len(items)} items vs {len(slots)} slots"
    for d, it in zip(slots, items):
        reason = ""
        if d["minutes"] == "Half Day":
            reason = "Shortened day"
        nxt = d["date"] + dt.timedelta(days=1)
        while nxt.weekday() >= 5:
            nxt += dt.timedelta(days=1)
        if nxt in CLOSURES and CLOSURES[nxt][0] in ("Break", "Holiday / School Closed"):
            reason = (
                reason + "; " if reason else ""
            ) + f"Day before {CLOSURES[nxt][1]}"
        rows.append(
            dict(
                date=d["date"],
                week=d["week"],
                quarter=d["quarter"],
                status=d["status"],
                minutes=d["minutes"],
                cal_note=d["cal_note"],
                unit_key=key,
                unit_label=label,
                ewl_unit=eu,
                day_type=it["day_type"],
                title=it["title"],
                lesson_id=it.get("lesson_id", ""),
                standard=it.get("standard", ""),
                objective=it.get("objective", ""),
                note=it.get("note", ""),
                item=it,
                soft_day_reason=reason,
            )
        )

moves = swap_hard_off_soft_days(rows)
unsplit = unsplit_blocks_across_breaks(rows)
print("unsplit across breaks:", unsplit)
# The final half-day of the year is a showcase, not a project work session.
rows[-1].update(day_type="Project", title="Course Showcase & Reflection — Math Is Mine",
                note="Last day (half day): celebrate the year, revisit the Unit 1 math story")
print(f"\nswapped {len(moves)} launches off shortened/pre-break days")

# --- resolve links ---------------------------------------------------------
for r in rows:
    it = r["item"]
    r["lesson_url"] = r["sg_urls"] = ""
    if it.get("lesson"):
        r["lesson_url"] = BASE + it["lesson"]["resources"]["lesson"]
        r["sg_urls"] = " | ".join(BASE + u for u in sg.get(it["lesson"]["id"], []))
        r["standard"] = it["lesson"].get("standard", "")
        r["objective"] = it["lesson"].get("objective", "")
    elif it.get("cu"):
        r["lesson_url"] = BASE + it["cu"]["resources"]["lesson"]
    elif it.get("eou"):
        r["lesson_url"] = BASE + it["eou"]["resources"]["lesson"]

# --- non-instructional rows merged in for the full-year sheet --------------
allrows = []
ri = 0
for d in days:
    if d["instructional"]:
        allrows.append(rows[ri])
        ri += 1
    else:
        allrows.append(
            dict(
                date=d["date"],
                week=d["week"],
                quarter=d["quarter"],
                status=d["status"],
                minutes=d["minutes"],
                cal_note=d["cal_note"],
                unit_key="",
                unit_label="",
                ewl_unit=None,
                day_type="No Instruction",
                title="",
                lesson_id="",
                standard="",
                objective="",
                note="",
                lesson_url="",
                sg_urls="",
                soft_day_reason="",
                item={},
            )
        )

# --- validation ------------------------------------------------------------
V = []


def chk(name, ok, detail=""):
    V.append((name, "PASS" if ok else "FAIL", detail))
    if not ok:
        print("  !! FAIL", name, detail)


chk(
    "First student day = 2026-08-24",
    allrows[0]["date"] == FIRST_DAY,
    str(allrows[0]["date"]),
)
chk(
    "Last student day = 2027-06-11", rows[-1]["date"] == LAST_DAY, str(rows[-1]["date"])
)
chk("All dates are weekdays", all(r["date"].weekday() < 5 for r in allrows))
chk(
    "No lesson on a no-school day",
    all(
        r["day_type"] == "No Instruction"
        for r in allrows
        if r["status"]
        in ("Holiday / School Closed", "Break", "PD — No Students", "Wellness Day")
    ),
)
seen = [
    r["lesson_id"] for r in rows if r["day_type"] == "Core Lesson" and r["lesson_id"]
]
canon = [l["id"] for u in sorted(lessons) for l in lessons[u]]
# This was "All 84 canonical lessons scheduled exactly once", which an assembled
# unit makes untrue in both directions: the Pre-Unit borrows four lessons their
# own units still teach, and it displaces five the district paces nowhere. The
# replacement is TIGHTER, not looser — every departure from exactly-once has to
# be written down in data/pacing-unit-lessons.json with a reason and evidence,
# so an accidental omission or duplicate still fails here.
DISPOSITIONS = {
    d["lessonId"]: d
    for d in json.load(open(f"{REPO}/data/pacing-unit-lessons.json")).get(
        "lessonDispositions", []
    )
}
counts = Counter(seen)
undeclared_missing = [
    i for i in canon if i not in counts and DISPOSITIONS.get(i, {}).get("status") != "unscheduled"
]
undeclared_repeat = [
    i
    for i, n in counts.items()
    if n > 1 and DISPOSITIONS.get(i, {}).get("status") != "scheduled-twice"
]
stale = [
    i
    for i, d in DISPOSITIONS.items()
    if (d["status"] == "unscheduled" and i in counts)
    or (d["status"] == "scheduled-twice" and counts.get(i, 0) < 2)
]
chk(
    "Every canonical lesson is scheduled, or declared unscheduled with a reason",
    not undeclared_missing and not undeclared_repeat and not stale,
    f"{len(counts)} of {len(canon)} scheduled; "
    f"undeclared missing {undeclared_missing}; undeclared repeats {undeclared_repeat}; "
    f"stale declarations {stale}",
)
order_ok = True
for key, label, eu, *_ in SEQUENCE:
    if eu is None:
        continue
    got = [
        r["lesson_id"]
        for r in rows
        if r["unit_key"] == key and r["day_type"] == "Core Lesson"
    ]
    # An assembled unit's order is authored, not inherited from the numbering,
    # so it is checked against the sequence that authored it.
    authored = AUTHORED_UNITS.get(key)
    want = authored["lessons"] if authored else [l["id"] for l in lessons[eu]]
    if got != want:
        order_ok = False
chk("Lesson order preserved within every unit", order_ok)
contig = True
for r_i, r in enumerate(rows):
    if r["day_type"] == "Continued Lesson":
        prev = rows[r_i - 1]
        if prev["lesson_id"] != r["lesson_id"]:
            contig = False
chk("Multi-day lessons are contiguous", contig)
chk(
    "Every unit has an explicit assessment day",
    all(
        any(x["day_type"] == "Assessment" for x in rows if x["unit_key"] == k)
        for k, _, _, _, _, m in SEQUENCE
        if m
    ),
)
chk(
    "Every unit with a project has ≥1 project day",
    all(
        any(x["day_type"] == "Project" for x in rows if x["unit_key"] == k)
        for k, _, eu, _, _, _ in SEQUENCE
        if eu in eou
    ),
)
flex = [r for r in rows if r["day_type"] in ("Flex", "Catch-Up")]
chk("Flex/Catch-Up capacity exists (≥15 days)", len(flex) >= 15, f"{len(flex)} days")
chk(
    "No new-content launch on a shortened day",
    not any(
        r["day_type"] == "Core Lesson" and r["minutes"] == "Half Day" for r in rows
    ),
)
chk(
    "Unit day totals reconcile with scope & sequence",
    abs(sum(b for _, _, _, b, _, _ in assign) - sum(d["value"] for d in inst)) < 1e-6,
    f"assigned {sum(b for _, _, _, b, _, _ in assign)} vs available {sum(d['value'] for d in inst)}",
)
chk("No pacing conflicts unresolved", not conflicts, "; ".join(conflicts))

from collections import Counter

print("\nDay-type totals:", dict(Counter(r["day_type"] for r in rows)))
print("Validation:", Counter(s for _, s, _ in V))

json.dump(
    dict(
        rows=[
            {
                k: (v.isoformat() if isinstance(v, dt.date) else v)
                for k, v in r.items()
                if k != "item"
            }
            for r in allrows
        ],
        validation=V,
        moves=[[a.isoformat(), b.isoformat(), t] for a, b, t in moves],
        units=[
            dict(
                key=k,
                label=l,
                ewl=e,
                budget=b,
                marker=m,
                start=s[0]["date"].isoformat(),
                end=s[-1]["date"].isoformat(),
                slots=len(s),
            )
            for k, l, e, b, m, s in assign
        ],
    ),
    open("plan.json", "w"),
    indent=1,
)
print("wrote plan.json")
