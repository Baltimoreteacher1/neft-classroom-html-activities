// Create · SCORM 1.2 package for one resource: imsmanifest.xml + index.html, where index.html is the same offline
// student page as "Download HTML" with the SCORM boot (studio/export/html.js): it marks the attempt incomplete on
// launch, completed at the finish screen, and reports session time. Nothing is fetched at run time (the page's CSP is
// default-src 'none'), so the package works on any LMS without reaching this site. Pure apart from the injected
// `html` and `JSZip`, so Node tests build real packages.

const xml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c],
  );

/** A manifest identifier: letters, digits, hyphens; starts with a letter (an XML NMTOKEN that every LMS accepts). */
export function scormId(activity) {
  const base = String(activity?.id || "activity").replace(/[^A-Za-z0-9-]/g, "");
  return `LP-CREATE-${base || "activity"}`;
}

/** SCORM 1.2 manifest for a single SCO launched from index.html. */
export function scormManifest(activity) {
  const id = scormId(activity);
  const title = xml(String(activity?.title || "Activity").slice(0, 200));
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${id}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${id}-ORG">
    <organization identifier="${id}-ORG">
      <title>${title}</title>
      <item identifier="${id}-ITEM" identifierref="${id}-RES" isvisible="true">
        <title>${title}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="${id}-RES" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>
`;
}

/**
 * @param {object} activity the built resource
 * @param {{html: string, JSZip: Function}} deps html = studentHtml(activity, {lang, scorm: true})
 * @returns {Promise<Uint8Array>} the .zip bytes
 */
export async function buildScorm(activity, { html, JSZip }) {
  if (typeof html !== "string" || !html.includes("LMSInitialize")) throw new Error("scorm-html");
  const zip = new JSZip();
  // a fixed date keeps two builds of the same resource byte-identical
  const date = new Date(Date.UTC(2026, 0, 1));
  zip.file("imsmanifest.xml", scormManifest(activity), { date });
  zip.file("index.html", html, { date });
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
