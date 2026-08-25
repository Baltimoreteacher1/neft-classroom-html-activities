#!/usr/bin/env node
/**
 * SCORM packages are live-site wrappers, not bundled lessons.
 *
 * A ZIP that happens to import in Canvas can still be a thin iframe of
 * eduwonderlab.com. These tests pin that architecture and fail if a second
 * production origin, or a missing launch URL, appears in the SCO.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { buildScormFiles, zipStore } from "../../functions/_lib/scorm.js";
import {
  ALLOWED_LESSON_HOSTS,
  classifyScoUrls,
  extraZipEntries,
  iframeDataSrc,
  missingZipEntries,
  REPRESENTATIVE_TARGETS,
} from "./lib/scorm-containment.mjs";
import { readZip } from "./zip-read.mjs";

test("a CDN URL in the SCO is an unexpected production dependency", () => {
  const html = `<iframe id="lesson" data-src="https://eduwonderlab.com/lessons/1-1/?lms=scorm&embed=1"></iframe>
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">`;
  const { problems } = classifyScoUrls(html);
  assert.ok(
    problems.some((p) => p.includes("fonts.googleapis.com")),
    `expected CDN to be flagged, got ${JSON.stringify(problems)}`,
  );
});

test("the live lesson URL on eduwonderlab.com is the allowed launch", () => {
  const html = `<iframe id="lesson" data-src="https://eduwonderlab.com/lessons/5-1/?lms=scorm&embed=1"></iframe>
<a href="https://eduwonderlab.com/lessons/5-1/">Open the activity directly</a>`;
  const { problems, src } = classifyScoUrls(html);
  assert.deepEqual(problems, []);
  assert.match(src, /^https:\/\/eduwonderlab\.com\/lessons\/5-1\//);
});

test("a package with extra zip entries is no longer a two-file wrapper", () => {
  assert.deepEqual(extraZipEntries(["imsmanifest.xml", "index.html"]), []);
  assert.deepEqual(extraZipEntries(["imsmanifest.xml", "index.html", "assets/app.js"]), [
    "assets/app.js",
  ]);
  assert.deepEqual(missingZipEntries(["index.html"]), ["imsmanifest.xml"]);
});

test("representative packages are two-file live wrappers of eduwonderlab.com", () => {
  for (const spec of REPRESENTATIVE_TARGETS) {
    const pkg = buildScormFiles(spec);
    const zip = zipStore(pkg.files);
    const entries = readZip(zip);
    const names = entries.map((e) => e.name);
    assert.deepEqual(missingZipEntries(names), [], `${spec.target}: missing zip entries`);
    assert.deepEqual(extraZipEntries(names), [], `${spec.target}: extra zip entries ${names}`);
    const html = entries.find((e) => e.name === "index.html").text();
    const { problems, src } = classifyScoUrls(html);
    assert.deepEqual(problems, [], `${spec.target}: ${problems.join("; ")}`);
    const host = new URL(src).hostname;
    assert.ok(ALLOWED_LESSON_HOSTS.includes(host), `${spec.target}: host ${host}`);
    assert.match(src, /lms=scorm/, `${spec.target}: missing lms=scorm launch flag`);
    assert.equal(iframeDataSrc(html), src);
    assert.match(pkg.lessonUrl, /^https:\/\/eduwonderlab\.com\//);
  }
});
