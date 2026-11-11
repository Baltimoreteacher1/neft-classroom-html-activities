/**
 * The family handout (access-practice-lab/guides/family-handout[-es].pdf/.docx) and its QR (qr-family.svg/.png).
 *
 *   node --test tools/access-intro-family-handout.test.mjs
 *
 * Reads the committed outputs of `node scripts/generate-intro-guide.mjs --only=family`: the QR files match a fresh
 * encode and a scanner (CoreImage) reads them, and a rasterized PDF page, back to the /practice-together URL; each PDF
 * is one tagged Letter page with its language, a title, embedded fonts, no text under 11 pt and a link to the page;
 * each Word file passes the docx accessibility rules, links the page and renders to one page. Missing poppler,
 * LibreOffice or a Swift toolchain SKIP locally and FAIL in CI.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Resvg } from "@resvg/resvg-js";
import JSZip from "jszip";
import { absUrl, ROUTES } from "../access-practice-lab/src/intro/data.js";
import { FAMILY_HANDOUT } from "../access-practice-lab/src/intro/family-data.js";
import { FAMILY_URL, familyHandoutModel } from "../scripts/lib/intro-family-handout.mjs";
import { minTextSize } from "../scripts/lib/pdf-text-sizes.mjs";
import { qrSvg } from "../shared/qr/qr-code.mjs";
import { readQrCodes } from "./lib/access-intro-qr-read.mjs";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { auditDocx } from "./validate-docx-a11y.mjs";

const LAB = join(REPO_ROOT, "access-practice-lab");
const GUIDES = join(LAB, "guides");
const SCRATCH = mkdtempSync(join(tmpdir(), "intro-family-handout-"));
const has = (tool) => {
  try {
    execFileSync("which", [tool], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const poppler = has("pdfinfo") && has("pdftoppm") && has("pdffonts");
const office = has("soffice");
const skip = (ok, what) => (ok ? false : process.env.CI ? false : `${what} is not installed`);
const onDisk = (publicPath) => join(LAB, publicPath.replace("/access-practice-lab/", ""));
const pdfPages = (file) =>
  Number(/Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [file], { encoding: "utf8" }))[1]);
const LANGS = { en: "en", es: "es" };

test("FAMILY_HANDOUT names the four files, in /guides, and every file exists", () => {
  assert.deepEqual(FAMILY_HANDOUT, {
    en: {
      pdf: "/access-practice-lab/guides/family-handout.pdf",
      docx: "/access-practice-lab/guides/family-handout.docx",
    },
    es: {
      pdf: "/access-practice-lab/guides/family-handout-es.pdf",
      docx: "/access-practice-lab/guides/family-handout-es.docx",
    },
  });
  for (const f of Object.values(FAMILY_HANDOUT).flatMap((o) => Object.values(o)))
    assert.ok(
      existsSync(onDisk(f)),
      `${f} is missing: run node scripts/generate-intro-guide.mjs --only=family`,
    );
});

test("the handout model: the family URL, three steps, two activities, the data.js facts, a teacher line", () => {
  assert.equal(FAMILY_URL, absUrl(ROUTES.together));
  assert.equal(FAMILY_URL, "https://thelanguagepage.com/access-practice-lab/practice-together");
  const en = familyHandoutModel("en");
  const es = familyHandoutModel("es");
  for (const m of [en, es]) {
    assert.equal(m.steps.length, 3);
    assert.equal(m.choices.length, 2);
    assert.equal(m.facts.length, 3);
    assert.ok(m.teacher && m.title && m.what && m.short);
  }
  assert.match(en.facts[0], /^No account is needed/);
  assert.match(en.facts[1], /^A microphone is never required/);
  assert.match(es.facts[0], /^No se necesita una cuenta/);
  assert.deepEqual(
    en.choices.map((c) => c.name),
    ["Let’s Talk", "Let’s Write"],
  );
  assert.deepEqual(
    es.choices.map((c) => c.name),
    ["Hablemos", "Escribamos"],
  );
  const text = JSON.stringify([en, es]).toLowerCase();
  for (const bad of ["score", "points", "streak", "wida", "translat", "free"])
    assert.ok(!text.includes(bad), `the handout claims "${bad}"`);
});

test("qr-family.svg is a fresh encode of the family URL", () => {
  assert.equal(
    readFileSync(join(GUIDES, "qr-family.svg"), "utf8").trim(),
    qrSvg(FAMILY_URL, { px: 144 }),
    "qr-family.svg is stale: run node scripts/generate-intro-guide.mjs --only=family",
  );
});

test("a scanner reads the QR PNG, the SVG and the printed PDF pages back to the family URL", {
  skip:
    (!poppler || process.platform !== "darwin") &&
    !process.env.CI &&
    "CoreImage decoder and poppler need macOS",
}, () => {
  const fromSvg = join(SCRATCH, "svg.png");
  const svg = readFileSync(join(GUIDES, "qr-family.svg"), "utf8");
  execFileSync("node", [
    "-e",
    `require("fs").writeFileSync(${JSON.stringify(fromSvg)}, Buffer.from(${JSON.stringify([...new Resvg(svg, { fitTo: { mode: "width", value: 600 } }).render().asPng()])}))`,
  ]);
  const pages = ["en", "es"].map((l) => {
    const out = join(SCRATCH, `page-${l}`);
    execFileSync("pdftoppm", [
      "-r",
      "150",
      "-png",
      "-singlefile",
      onDisk(FAMILY_HANDOUT[l].pdf),
      out,
    ]);
    return `${out}.png`;
  });
  const files = [join(GUIDES, "qr-family.png"), fromSvg, ...pages];
  const read = readQrCodes(files);
  assert.ok(read, "no decoder available");
  for (const f of files)
    assert.deepEqual(read[f], [FAMILY_URL], `${f} does not scan to ${FAMILY_URL}`);
});

for (const lang of ["en", "es"]) {
  const pdf = () => onDisk(FAMILY_HANDOUT[lang].pdf);
  test(`family handout PDF (${lang}): one tagged page, language, title, fonts, 11 pt, link`, {
    skip: skip(poppler, "poppler"),
  }, () => {
    const bytes = readFileSync(pdf());
    assert.ok(bytes.length < 1024 * 1024, `${bytes.length} bytes`);
    assert.equal(pdfPages(pdf()), 1);
    const info = execFileSync("pdfinfo", [pdf()], { encoding: "utf8" });
    assert.match(info, /Tagged:\s+yes/);
    assert.match(info, /Page size:\s+612 x 792/, "Letter");
    assert.match(info, new RegExp(`Title:\\s+.*${familyHandoutModel(lang).title}`));
    const raw = bytes.toString("latin1");
    assert.match(raw, new RegExp(`/Lang\\s*\\(${LANGS[lang]}`));
    const fonts = execFileSync("pdffonts", [pdf()], { encoding: "utf8" })
      .trim()
      .split("\n")
      .slice(2);
    assert.ok(
      fonts.length > 0 && fonts.every((l) => /\syes\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/.test(l)),
      `every font embedded:\n${fonts.join("\n")}`,
    );
    const min = minTextSize(bytes);
    assert.ok(min >= 10.99, `smallest text is ${min} pt`);
    const uris = new Set([...raw.matchAll(/\/URI \(([^)]*)\)/g)].map((m) => m[1]));
    assert.deepEqual([...uris], [FAMILY_URL]);
    const text = execFileSync("pdftotext", [pdf(), "-"], { encoding: "utf8" });
    assert.ok(
      text.replace(/\s+/g, "").includes(familyHandoutModel(lang).short),
      "short link printed",
    );
  });

  test(`family handout Word file (${lang}): accessibility rules, a real hyperlink, no text under 11 pt`, async () => {
    const buf = readFileSync(onDisk(FAMILY_HANDOUT[lang].docx));
    assert.deepEqual(await auditDocx(buf), []);
    const zip = await JSZip.loadAsync(buf);
    const rels = await zip.file("word/_rels/document.xml.rels").async("string");
    assert.ok(rels.includes(`Target="${FAMILY_URL}"`), "hyperlink to the family page");
    const doc = await zip.file("word/document.xml").async("string");
    assert.ok(!/w:sz w:val="(\d|1\d|20)"/.test(doc), "no run under 11 pt");
    const core = await zip.file("docProps/core.xml").async("string");
    assert.ok(core.includes(familyHandoutModel(lang).title), "document title");
  });

  test(`family handout Word file (${lang}) renders to one page in LibreOffice`, {
    skip: skip(office && poppler, "LibreOffice or poppler"),
  }, () => {
    const dir = mkdtempSync(join(SCRATCH, "lo-"));
    execFileSync(
      "soffice",
      [
        `-env:UserInstallation=file://${join(SCRATCH, "profile")}`,
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        dir,
        onDisk(FAMILY_HANDOUT[lang].docx),
      ],
      { stdio: "ignore", timeout: 180000 },
    );
    const out = readdirSync(dir).find((f) => f.endsWith(".pdf"));
    assert.ok(out, "LibreOffice wrote a PDF");
    assert.equal(pdfPages(join(dir, out)), 1);
  });
}
