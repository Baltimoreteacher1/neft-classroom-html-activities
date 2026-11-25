#!/usr/bin/env node
/**
 * Mint a signed flag override for the X-Flags-Overrides header.
 *   FLAGS_SIGNING_KEY=<secret> node tools/flags-sign.mjs --hours=2 flag_a=on flag_b=off
 * The key comes from the environment only and is never printed. Exit 0 ok, 1 bad usage, 3 error.
 */
import { signOverrides } from "../shared/flags/evaluate.js";

const args = process.argv.slice(2);
const hours = Number(args.find((a) => a.startsWith("--hours="))?.slice(8) ?? 1);
const pairs = args.filter((a) => !a.startsWith("--"));
try {
  if (!(hours > 0 && hours <= 720) || pairs.length === 0) {
    console.error("usage: flags-sign.mjs [--hours=1..720] flag=on|off ...");
    process.exit(1);
  }
  const overrides = {};
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (!key || !["on", "off"].includes(value)) {
      console.error(`bad override "${pair}" (want flag=on|off)`);
      process.exit(1);
    }
    overrides[key] = value === "on";
  }
  const expires = new Date(Date.now() + hours * 3_600_000).toISOString();
  const signed = await signOverrides({ overrides, expires }, process.env.FLAGS_SIGNING_KEY);
  console.log(JSON.stringify(signed));
} catch (err) {
  console.error(`flags-sign error: ${err.message}`);
  process.exit(3);
}
