# WIDA Data Studio — privacy

- **Nothing is uploaded.** All parsing (CSV, XLSX, PDF text), validation, analysis and report generation run in the browser. There is no server-side storage, no OCR service and no AI service; the Data Explorer is a fixed set of local computations.
- **Storage:** browser `localStorage` on the teacher's device, beside the Teacher Hub roster (see the architecture doc for keys). Student names are the hub's aliases.
- **Access:** `/access-teacher/*` is behind the site's teacher gate (HTTP Basic, `SITE_PASSWORD`) on eduwonderlab.com; pages carry `noindex`. This protects the page, not the device: anyone using the same browser profile can see the data, as with the rest of the Teacher Hub.
- **Import confirmation:** every import goes through validation and review; nothing is saved until the teacher confirms. Conflicts are kept unless the teacher chooses to replace them. The last 10 imports can be undone.
- **Deletion:** delete a single result; delete all MODEL results and studio settings; the Teacher Hub's own *Remove everything* clears ACCESS results and the roster.
- **Audit log:** the last 500 actions (import, undo, delete, print, export) with time and counts, never names or scores.
- **Exports:** reports carry a confidentiality line, the data sources and dates; CSV exports are generated locally. Demo exports are prefixed `synthetic-`.
- **Demo mode:** fictional students only, generated on the fly, never written to the real stores.
- **Not done:** no server accounts, role-based server authorization or encrypted server storage exist for this module, because no student data leaves the device. A shared or school-wide version would need those, plus a data-processing review, before handling identifiable records off-device.
