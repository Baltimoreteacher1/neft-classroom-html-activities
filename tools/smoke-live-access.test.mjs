#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import { isCloudflareAccess } from "../scripts/lib/cloudflare-access.mjs";

test("the live Access interstitial is recognised", () => {
  const body = `<!DOCTYPE html><html><head><title>Sign in ・ Cloudflare Access</title></head><body></body></html>`;
  assert.equal(isCloudflareAccess(body), true);
});

test("a real lesson page is not Access", () => {
  assert.equal(
    isCloudflareAccess("<!DOCTYPE html><html><head><title>Lesson 1-1</title></head></html>"),
    false,
  );
});

test("empty or non-string is not Access", () => {
  assert.equal(isCloudflareAccess(""), false);
  assert.equal(isCloudflareAccess(null), false);
});
