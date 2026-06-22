# Focus School - Cloudflare Subdomain Deployment Instructions

This document provides instructions for deploying the rebranded **Focus School** app as a standalone project under the custom subdomain `https://focus.eduwonderlab.com`.

---

## ☁️ Cloudflare Pages Setup

1. **Create a New Project**:
   - In your Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
   - Select your repository (`neft-classroom-html-activities`).

2. **Configure Build Settings**:
   - **Project Name**: `focus-school` (or `noam-school-focus`)
   - **Production Branch**: `main`
   - **Framework Preset**: *None* (since this is a static HTML app)
   - **Build Command**: *Leave empty* (no build script is required for this subdirectory)
   - **Build Output Directory**: `/focus-school` (this ensures only the files in the `focus-school` directory are deployed as the root of the new subdomain)

3. **Bind Cloudflare KV Namespace (for Syncing)**:
   - Go to your newly created Page project settings -> **Settings** -> **Functions** -> **KV namespace bindings**.
   - Under **Production** (and optionally Preview), add a binding:
     - **Variable Name**: `NOAM_SCHOOL_KV`
     - **KV Namespace**: Select `NOAM_SCHOOL_KV` (ID: `59075911253f400f807345430425946c`).
   - This shares the backend synchronization state between the main site and the subdomain.

---

## 🌐 Custom Subdomain Routing

1. **Map Custom Domain**:
   - In the Pages project dashboard, click the **Custom domains** tab -> **Set up a custom domain**.
   - Enter: `focus.eduwonderlab.com`.

2. **DNS Mapping**:
   - Cloudflare will automatically set up the CNAME record mapping `focus` subdomain to your Cloudflare Pages URL (e.g. `focus-school.pages.dev`).
   - If managing DNS outside Cloudflare, manually add a CNAME record:
     - **Name/Host**: `focus`
     - **Target**: `focus-school.pages.dev`

---

## 🔄 Redirect Verification

- The main EduWonderLab site Pages project now has permanent `301` redirects from the old path (`/noam-school-v10/`) to the new subdomain `https://focus.eduwonderlab.com/`.
- Once deployed, check that visiting:
  - `https://eduwonderlab.com/noam-school`
  - `https://eduwonderlab.com/noam-school-v10/`
  redirects cleanly to `https://focus.eduwonderlab.com/` and preserves any sub-paths correctly.
