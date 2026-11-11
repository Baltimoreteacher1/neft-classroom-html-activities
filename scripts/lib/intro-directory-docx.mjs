// The Site Directory as an editable Word file: the same model as the PDF, with Heading 1 per grade band, Heading 2 per
// domain and Heading 3 per support level, so Word's navigation pane is the table of contents.
import { HeadingLevel } from "docx";
import {
  bold,
  buildDocument,
  dataTable,
  heading,
  link,
  list,
  MUTED,
  para,
  run,
  toBuffer,
} from "./intro-docx-kit.mjs";

const DOMAINS = ["Listening", "Reading", "Speaking", "Writing", "Model-Test"];

function counts(m) {
  const present = DOMAINS.filter((d) => m.bands.some((b) => b.domains.some((x) => x.id === d)));
  const name = (d) => m.bands.flatMap((b) => b.domains).find((x) => x.id === d).name;
  const cell = (t) => [para(String(t), { spacing: { after: 0 } })];
  const rows = m.bands.map((b) => [
    cell(b.label),
    ...present.map((d) => cell(b.domains.find((x) => x.id === d)?.count ?? "–")),
    cell(b.count),
  ]);
  rows.push([
    cell("All bands"),
    ...present.map((d) =>
      cell(m.bands.reduce((n, b) => n + (b.domains.find((x) => x.id === d)?.count || 0), 0)),
    ),
    cell(m.total),
  ]);
  const w = Math.floor(10512 / (present.length + 2));
  return dataTable(
    ["Grade band", ...present.map(name), "Total"],
    rows,
    Array(present.length + 2).fill(w),
  );
}

const row = (r) =>
  para(
    [link(r.title, r.url), run(`  ${r.skill}${r.time ? `, ${r.time}` : ""}`, { color: MUTED })],
    { spacing: { after: 30 } },
  );

export async function buildDirectoryDocx(m) {
  const children = [
    heading(m.title, HeadingLevel.HEADING_1),
    para([bold(m.subtitle)]),
    para(
      `Generated ${m.generated} from the lab's activity index. Every title is a link. Use the navigation pane (View, Navigation Pane) to jump to a grade band or domain. Support levels are classroom support choices, not WIDA proficiency levels.`,
    ),
    para([
      bold(`${m.total} activities`),
      run(
        `, ${m.tests.length} practice tests and ${m.places.reduce((n, g) => n + g.items.length, 0)} other places on the site.`,
      ),
    ]),
    counts(m),
    ...m.bands.flatMap((b) => [
      heading(`${b.label} (${b.count} activities)`, HeadingLevel.HEADING_1, {
        pageBreakBefore: true,
      }),
      ...(b.note ? [para(b.note)] : []),
      ...b.domains.flatMap((d) => [
        heading(`${b.label} · ${d.name} (${d.count})`, HeadingLevel.HEADING_2),
        ...d.levels.flatMap((l) => [
          heading(`${l.name} (${l.rows.length})`, HeadingLevel.HEADING_3),
          ...l.rows.map(row),
        ]),
      ]),
    ]),
    heading(`Practice tests (${m.tests.length})`, HeadingLevel.HEADING_1, {
      pageBreakBefore: true,
    }),
    para("Classroom practice; these are not official ACCESS tests."),
    ...m.tests.map((t) =>
      para(
        [
          link(t.title, t.url),
          run(`  ${t.bandLabel}, ${t.items} items, ${t.minutes} min`, { color: MUTED }),
        ],
        { spacing: { after: 30 } },
      ),
    ),
    heading("Other places on the site", HeadingLevel.HEADING_1, { pageBreakBefore: true }),
    para(
      'The More menu of the lab, group by group. Pages marked "password required" are behind the teacher password.',
    ),
    ...m.places.flatMap((g) => [
      heading(g.title, HeadingLevel.HEADING_2),
      ...g.items.map((i) =>
        list([
          link(i.label, i.url),
          ...(i.gated ? [bold(" (password required)")] : []),
          run(`  ${i.short}`, { color: MUTED }),
          ...(i.note ? [run(`. ${i.note}`)] : []),
        ]),
      ),
    ]),
  ];
  return toBuffer(
    buildDocument({
      title: m.title,
      description: "Appendix: every domain and activity on the site, with links.",
      headerText: m.title,
      children,
    }),
  );
}
