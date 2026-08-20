/**
 * EduWonderLab Enterprise Small-Group Google Sheets Live Telemetry Bridge
 * Architecture: Web client connector dispatching student check scores and cluster placements to Google Apps Script.
 * Compliant with Global Development Rules.
 */

(function (global) {
  "use strict";

  class GoogleSheetsSyncBridge {
    constructor(options = {}) {
      this.sheetId = options.sheetId || "10Ae13ZcZgySdSE8mN-aD31zqc4bHjJUPyIR0iTHBH04";
      this.sectionName = options.sectionName || "Section 603";
      this.webhookUrl = options.webhookUrl || null;
      this.lastSync = null;
    }

    /**
     * Dispatches student cluster update payload to Google Sheets webhook
     */
    async syncClusters(studentScores, skillFocus = "Unit Practice Standard") {
      const payload = {
        sheetId: this.sheetId,
        section: this.sectionName,
        timestamp: new Date().toISOString(),
        skillFocus: skillFocus,
        scores: studentScores || {},
      };

      if (!this.webhookUrl) {
        console.info(
          "[GOOGLE SHEETS BRIDGE] Webhook URL not configured. Staging local telemetry payload:",
          payload,
        );
        this.lastSync = payload;
        return { status: "STAGED_LOCALLY", data: payload };
      }

      try {
        const _response = await fetch(this.webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        this.lastSync = payload;
        return { status: "SYNCED", data: payload };
      } catch (err) {
        console.error("[GOOGLE SHEETS BRIDGE] Sync error:", err);
        return { status: "ERROR", message: err.message };
      }
    }
  }

  const bridgeInstance = new GoogleSheetsSyncBridge();
  global.EWGoogleSheetsBridge = bridgeInstance;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { GoogleSheetsSyncBridge, bridgeInstance };
  }
})(typeof window !== "undefined" ? window : this);
