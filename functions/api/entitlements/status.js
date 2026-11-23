// Cloudflare Pages Function: server-enforced subscription & privacy entitlement status.
// Billing remains disabled (BILLING_ENABLED: false) until explicit business/payment configuration is provided.
// Never collects or exposes student PII.

import { handler } from "../../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  handle: ({ env }) => {
    const billingEnabled = env.FLUENCY_BILLING_ENABLED === "true";
    return {
      schemaVersion: "1.0.0",
      billingEnabled,
      tier: "free",
      status: "active",
      coppaMode: "local-first-no-pii",
      features: {
        corePractice: true,
        accessibilityAndEsol: true,
        billingCheckoutAvailable: billingEnabled,
      },
    };
  },
});
