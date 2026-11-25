// Routine blocks, family "talk": partner talk protocol, four-corners talk line, info-gap cards.
// Source data: connections[0].partner_talk_protocol, esol_pack.talk_line, esol_pack.info_gap. All student-facing.
import { cards, chips, h, kv, list, p } from "./nodes.js";

const conn = (d) => d?.connections?.[0] || null;

export const TALK_BLOCKS = [
  {
    id: "partner",
    family: "talk",
    title: "Partner talk protocol",
    blurb: "Two roles, two prompts and the talk moves partners use.",
    audience: "student",
    part: "rt-partner",
    paths: ["connections[].partner_talk_protocol"],
    source: (d) => conn(d)?.partner_talk_protocol,
    build(s) {
      return [
        h(s.protocol_name),
        cards([
          { title: `Partner A · ${s.role_a_title}`, lines: [s.role_a_prompt] },
          { title: `Partner B · ${s.role_b_title}`, lines: [s.role_b_prompt] },
        ]),
        h("Talk moves"),
        kv((s.talk_moves || []).map((m) => [m.label, m.stem])),
      ];
    },
  },
  {
    id: "talkline",
    family: "talk",
    title: "Talk line (four corners)",
    blurb: "Statements to stand behind, the four corners and stems for your level.",
    audience: "student",
    part: "rt-talkline",
    paths: ["esol_pack.talk_line"],
    source: (d) => d?.esol_pack?.talk_line,
    build(s, band) {
      const stems = s.stems?.[band] || {};
      return [
        h("Statements"),
        list(s.statements, true),
        chips(s.corners, "Corners"),
        h("Say it like this"),
        kv([
          ["Agree", stems.agree],
          ["Disagree", stems.disagree],
          ["Not sure", stems.unsure],
        ]),
      ];
    },
  },
  {
    id: "infogap",
    family: "talk",
    title: "Info-gap cards",
    blurb: "Partner A and Partner B each hold half of the words. Ask, listen, fill in.",
    audience: "student",
    part: "rt-infogap",
    paths: ["esol_pack.info_gap"],
    source: (d) => d?.esol_pack?.info_gap,
    build(s) {
      const card = (who, c) => ({
        title: `Partner ${who}: I know`,
        lines: [
          ...c.knows.map((k) => `${k.term}: ${k.def}${k.cognate ? ` (${k.cognate})` : ""}`),
          `I need to find out: ${c.needs.join(", ")}`,
        ],
      });
      return [
        cards([card("A", s.card_a), card("B", s.card_b)], true),
        h("Ask like this"),
        list(s.question_stems),
        h("Rules"),
        list(s.rules),
        p(s.task),
      ];
    },
  },
];
