/**
 * cartridge-files.mjs — the single source of truth for the Common Cartridge
 * file tree the EduWonderLab library export ships, plus a dependency-free ZIP
 * writer. PURE and ISOMORPHIC: no Node built-ins, no DOM — it runs identically
 * in Node (build-library-cartridge.mjs writes the files to disk, zips with the
 * system `zip`, and self-validates) and in the browser (Canvas Studio builds the
 * exact same files and zips them client-side for a one-click `.imscc` download,
 * so a teacher needs no terminal, no Node, and no repo checkout).
 *
 * Because both paths generate from this one module, the package a teacher
 * downloads in the browser is byte-for-byte the package the validated Node tool
 * produces. Covered by cartridge-files.test.mjs (build → zip → unzip → validate).
 *
 * Lives under teacher-tools/canvas-studio/ (not tools/) on purpose: Vite copies
 * teacher-tools/ into dist/ but skips tools/, so this is the only spot a module
 * can be both imported by the Node build AND served to the live Studio page.
 */

/** Normalize any url/path to a lowercase, leading+trailing-slashed key. */
export function norm(u) {
  if (!u) return "";
  let p = String(u).trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.endsWith("/") && !/\.[a-z0-9]+$/i.test(p)) p += "/";
  return p.toLowerCase();
}

const xml = (s) =>
  String(s == null ? "" : s).replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c],
  );

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "item";

const steps = `<ol style="font-size:15px;line-height:1.7;">
  <li><strong>Open the activity</strong> with the button below.</li>
  <li><strong>Complete it.</strong> A <strong>completion code</strong> appears at the end and is copied automatically.</li>
  <li><strong>Return to Canvas</strong> and <strong>paste the code</strong> in the box below.</li>
  <li>Click <strong>Submit Assignment</strong>.</li>
</ol>`;

const linkBtn = (url, title) =>
  `<p style="margin:14px 0;"><a href="${xml(url)}" target="_blank" rel="noopener" style="display:inline-block;background:#12355b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">▶ Open: ${xml(title)}</a></p>`;

const pageHtml = (it, url, pageId) =>
  `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${xml(it.title)}</title><meta name="identifier" content="${pageId}"></head><body>
<h2>${xml(it.title)}</h2>
${it.standard ? `<p><strong>Standard:</strong> ${xml(it.standard)}</p>` : ""}
<p><strong>Type:</strong> ${xml(it.activityType)}</p>
${linkBtn(url, it.title)}
<p style="color:#475569;font-size:14px;">Interactive activity — opens in a new tab. Your progress saves automatically.</p>
</body></html>`;

const assignmentHtml = (it, url) =>
  `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${xml(it.title)}</title></head><body>
<h2>${xml(it.title)}</h2>
${it.standard ? `<p><strong>Standard:</strong> ${xml(it.standard)}</p>` : ""}
<p><strong>How to turn this in:</strong></p>
${steps}
${linkBtn(url, it.title)}
<p style="color:#475569;font-size:14px;">Tip: type your name exactly as it appears in Canvas when asked.</p>
</body></html>`;

const assignmentSettingsXml = (it, ident, pos, groupRef) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<assignment identifier="${ident}" xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
  <title>${xml(it.title)}</title>
  <assignment_group_identifierref>${groupRef}</assignment_group_identifierref>
  <points_possible>100.0</points_possible>
  <grading_type>points</grading_type>
  <submission_types>online_text_entry</submission_types>
  <position>${pos}</position>
  <workflow_state>unpublished</workflow_state>
</assignment>`;

/**
 * Group a flat list of student-safe items into ordered Canvas modules, in the
 * shape buildCartridgeFiles expects. Used by the browser (Canvas Studio), whose
 * library.json items carry { title, url, type, standard, module, moduleKey } and
 * whose `moduleDefs` (library.json.modules) are already in display order.
 *
 * @param {Array} items      [{ title, url, type, standard, module, moduleKey }]
 * @param {Array} moduleDefs [{ key, title }] in display order
 * @returns {Array} modules  [{ key, title, order, items:[{title,url,activityType,standard}] }]
 */
export function buildModulesFromItems(items, moduleDefs = []) {
  const byKey = new Map();
  moduleDefs.forEach((m, i) => byKey.set(m.key, { key: m.key, title: m.title, order: i, items: [] }));
  for (const it of items) {
    let m = byKey.get(it.moduleKey);
    if (!m) {
      m = { key: it.moduleKey || "explore", title: it.module || "Explore & Enrichment", order: 999, items: [] };
      byKey.set(m.key, m);
    }
    m.items.push({
      title: it.title,
      url: it.url,
      activityType: it.activityType || it.type,
      standard: it.standard || null,
    });
  }
  return [...byKey.values()].filter((m) => m.items.length).sort((a, b) => a.order - b.order);
}

/**
 * Build the Common Cartridge file tree from ordered modules.
 * @param {Object} opts
 * @param {Array}  opts.modules  [{ key, title, order, items:[{title,url,activityType,standard}] }]
 * @param {string} opts.mode     "link" (Canvas Pages) | "graded" (text-entry assignments)
 * @param {string} opts.site     base site for relative urls
 * @returns {{ files:[{path,content}], sidecar:Array, itemCount:number, moduleCount:number }}
 */
export function buildCartridgeFiles({ modules, mode = "link", site = "https://eduwonderlab.com" }) {
  const SITE = String(site).replace(/\/$/, "");
  const MODE = mode === "graded" ? "graded" : "link";
  const files = [];
  const resources = [];
  const moduleMeta = [];
  const sidecar = [];
  let pos = 0;
  let itemCount = 0;

  for (const mod of modules) {
    const groupId = "g_" + mod.key.replace(/[^a-z0-9]+/gi, "_");
    const modItems = [];
    for (const it of mod.items) {
      pos += 1;
      itemCount += 1;
      const base = slug(it.url || it.title) + "_" + pos;
      const url = it.url.startsWith("http") ? it.url : `${SITE}${norm(it.url)}`;

      if (MODE === "graded") {
        const ident = "neftlib_" + base;
        const dir = ident;
        files.push({ path: `${dir}/${ident}.html`, content: assignmentHtml(it, url) });
        files.push({ path: `${dir}/assignment_settings.xml`, content: assignmentSettingsXml(it, ident, pos, groupId) });
        resources.push(
          `    <resource identifier="res_${ident}" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="${dir}/${ident}.html">\n` +
            `      <file href="${dir}/${ident}.html"/>\n` +
            `      <file href="${dir}/assignment_settings.xml"/>\n` +
            `    </resource>`,
        );
        modItems.push({ idref: `res_${ident}`, title: it.title, kind: "Assignment" });
      } else {
        const pageId = "page_" + base;
        const pageFile = `wiki_content/${pageId}.html`;
        files.push({ path: pageFile, content: pageHtml(it, url, pageId) });
        resources.push(
          `    <resource identifier="${pageId}" type="webcontent" href="${pageFile}"><file href="${pageFile}"/></resource>`,
        );
        modItems.push({ idref: pageId, title: it.title, kind: "WikiPage" });
      }
      sidecar.push({ module: mod.title, title: it.title, type: it.activityType, url });
    }
    moduleMeta.push({ id: groupId, title: mod.title, order: mod.order, items: modItems });
  }

  /* ---------- assignment groups (graded mode only) ---------- */
  if (MODE === "graded") {
    files.push({
      path: "course_settings/assignment_groups.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<assignmentGroups xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
${moduleMeta
  .map(
    (m, i) =>
      `  <assignmentGroup identifier="${m.id}"><title>${xml(m.title)}</title><position>${i + 1}</position><group_weight>0.0</group_weight></assignmentGroup>`,
  )
  .join("\n")}
</assignmentGroups>`,
    });
  }

  /* ---------- modules ---------- */
  files.push({
    path: "course_settings/module_meta.xml",
    content: `<?xml version="1.0" encoding="UTF-8"?>
<modules xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
${moduleMeta
  .map((m, mi) => {
    const its = m.items
      .map(
        (it, ii) =>
          `    <item identifier="modi_${mi}_${ii}" identifierref="${it.idref}"><content_type>${it.kind}</content_type><title>${xml(it.title)}</title><position>${ii + 1}</position></item>`,
      )
      .join("\n");
    return `  <module identifier="mod_${m.id}"><title>${xml(m.title)}</title><position>${mi + 1}</position><workflow_state>unpublished</workflow_state><items>\n${its}\n  </items></module>`;
  })
  .join("\n")}
</modules>`,
  });

  files.push({
    path: "course_settings/canvas_export.txt",
    content: "Canvas Common Cartridge export — EduWonderLab library (modules of live activities).\n",
  });

  /* ---------- manifest ---------- */
  const courseSettingsFiles = [
    `      <file href="course_settings/module_meta.xml"/>`,
    `      <file href="course_settings/canvas_export.txt"/>`,
  ];
  if (MODE === "graded")
    courseSettingsFiles.unshift(`      <file href="course_settings/assignment_groups.xml"/>`);

  files.push({
    path: "imsmanifest.xml",
    content: `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="neft-library-cartridge" xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1" xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd">
  <metadata><schema>IMS Common Cartridge</schema><schemaversion>1.1.0</schemaversion></metadata>
  <organizations><organization identifier="org_1" structure="rooted-hierarchy"><item identifier="root"/></organization></organizations>
  <resources>
${resources.join("\n")}
    <resource identifier="res_course_settings" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="course_settings/canvas_export.txt">
${courseSettingsFiles.join("\n")}
    </resource>
  </resources>
</manifest>`,
  });

  return { files, sidecar, itemCount, moduleCount: modules.length };
}

/* ======================================================================== *
 *  Dependency-free ZIP writer (STORE method, no compression).
 *  Common Cartridge importers (Canvas/rubyzip) accept stored entries. Used by
 *  the browser to assemble the .imscc; Node keeps using the system `zip`, but
 *  this is also exercised by the test so the browser path is proven.
 * ======================================================================== */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function utf8(str) {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
  // Node fallback (older runtimes); modern Node has TextEncoder globally.
  return Uint8Array.from(Buffer.from(str, "utf8"));
}

/**
 * Build a ZIP archive (stored/uncompressed) from a list of files.
 * @param {Array} entries [{ path, content }]  content is a string or Uint8Array
 * @returns {Uint8Array}  the complete archive bytes
 */
export function zipStore(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  const u16 = (n) => [n & 0xff, (n >>> 8) & 0xff];
  const u32 = (n) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];

  for (const e of entries) {
    const nameBytes = utf8(e.path);
    const data = typeof e.content === "string" ? utf8(e.content) : e.content;
    const crc = crc32(data);
    const size = data.length;

    // Local file header. General-purpose bit 11 (0x0800) = UTF-8 filename.
    const local = [
      ...u32(0x04034b50),
      ...u16(20), // version needed
      ...u16(0x0800), // flags: UTF-8
      ...u16(0), // method: store
      ...u16(0), // mod time
      ...u16(0x21), // mod date (1980-01-01-ish placeholder)
      ...u32(crc),
      ...u32(size), // compressed size
      ...u32(size), // uncompressed size
      ...u16(nameBytes.length),
      ...u16(0), // extra len
    ];
    chunks.push(Uint8Array.from(local), nameBytes, data);

    central.push({
      nameBytes,
      crc,
      size,
      offset,
    });
    offset += local.length + nameBytes.length + size;
  }

  // Central directory
  const centralChunks = [];
  let centralSize = 0;
  for (const c of central) {
    const header = [
      ...u32(0x02014b50),
      ...u16(20), // version made by
      ...u16(20), // version needed
      ...u16(0x0800), // flags: UTF-8
      ...u16(0), // method: store
      ...u16(0), // mod time
      ...u16(0x21), // mod date
      ...u32(c.crc),
      ...u32(c.size),
      ...u32(c.size),
      ...u16(c.nameBytes.length),
      ...u16(0), // extra len
      ...u16(0), // comment len
      ...u16(0), // disk number
      ...u16(0), // internal attrs
      ...u32(0), // external attrs
      ...u32(c.offset),
    ];
    centralChunks.push(Uint8Array.from(header), c.nameBytes);
    centralSize += header.length + c.nameBytes.length;
  }

  const end = [
    ...u32(0x06054b50),
    ...u16(0), // disk number
    ...u16(0), // central dir start disk
    ...u16(central.length),
    ...u16(central.length),
    ...u32(centralSize),
    ...u32(offset), // central dir offset
    ...u16(0), // comment len
  ];

  const all = [...chunks, ...centralChunks, Uint8Array.from(end)];
  const total = all.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}
