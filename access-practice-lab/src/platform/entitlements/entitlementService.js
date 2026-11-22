/**
 * Subscription & Entitlements Service.
 * Tiers: "free" | "pro" (Teacher Pro) | "district" (School / District).
 * Defaults to "pro" preview mode locally so all features work out-of-the-box,
 * while cleanly supporting gated limits when switched to "free" in Diagnostics.
 */

import { STORAGE_KEYS, readStorage, updateStorage } from "../services/storageService.js";
import { logEvent } from "../services/logger.js";

export const TIERS = Object.freeze({
  free: {
    id: "free",
    label: "Free Starter",
    price: "$0",
    cadence: "forever",
    maxRosterStudents: 3,
    canExportReports: false,
    canGenerateUnlimitedSprints: false,
    canSaveUnlimitedClips: false,
    maxSavedClips: 2,
    canUseCustomBridgeText: false,
  },
  pro: {
    id: "pro",
    label: "Teacher Pro",
    price: "$12",
    cadence: "per month",
    maxRosterStudents: 45,
    canExportReports: true,
    canGenerateUnlimitedSprints: true,
    canSaveUnlimitedClips: true,
    maxSavedClips: 100,
    canUseCustomBridgeText: true,
  },
  district: {
    id: "district",
    label: "School & District",
    price: "Custom",
    cadence: "per school year",
    maxRosterStudents: 500,
    canExportReports: true,
    canGenerateUnlimitedSprints: true,
    canSaveUnlimitedClips: true,
    maxSavedClips: 1000,
    canUseCustomBridgeText: true,
  },
});

export function getEntitlementState() {
  const saved = readStorage(STORAGE_KEYS.ENTITLEMENTS);
  const tierId = TIERS[saved.tier] ? saved.tier : "pro";
  return {
    tier: tierId,
    limits: TIERS[tierId],
  };
}

export function setEntitlementTier(tierId) {
  const valid = TIERS[tierId] ? tierId : "pro";
  updateStorage(STORAGE_KEYS.ENTITLEMENTS, { tier: valid });
  logEvent("entitlements", "tier_changed", { tier: valid });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tlp:entitlement-change", { detail: { tier: valid } }));
  }
  return getEntitlementState();
}

export function checkFeatureAccess(featureKey, currentCount = 0) {
  const { tier, limits } = getEntitlementState();
  switch (featureKey) {
    case "roster_add":
      return {
        allowed: currentCount < limits.maxRosterStudents,
        tier,
        limit: limits.maxRosterStudents,
        reason: `Free Starter includes up to ${limits.maxRosterStudents} roster students.`,
      };
    case "export_report":
      return {
        allowed: limits.canExportReports,
        tier,
        reason: "CSV and Printable Evidence Reports are included in Teacher Pro.",
      };
    case "unlimited_sprints":
      return {
        allowed: limits.canGenerateUnlimitedSprints,
        tier,
        reason: "4-Week Domain Sprint plans are included in Teacher Pro.",
      };
    case "save_clip":
      return {
        allowed: limits.canSaveUnlimitedClips || currentCount < limits.maxSavedClips,
        tier,
        limit: limits.maxSavedClips,
        reason: `Free Starter includes up to ${limits.maxSavedClips} saved Pride Clips.`,
      };
    case "custom_bridge":
      return {
        allowed: limits.canUseCustomBridgeText,
        tier,
        reason: "Custom lesson text scanning is included in Teacher Pro (sample texts are always free).",
      };
    default:
      return { allowed: true, tier };
  }
}
