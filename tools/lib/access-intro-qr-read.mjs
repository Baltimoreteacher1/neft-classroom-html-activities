// Reads QR codes out of PNG images with macOS CoreImage (CIDetector), an implementation independent of
// shared/qr/qr-code.mjs, so "the encoder works" is proved by a scanner and not by itself. Used by the introduction
// guide tests on the QR PNG and on rasterized pages of the PDFs and Word files. Returns null when there is no Swift
// toolchain (non-macOS), so callers can SKIP locally and FAIL in CI.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SWIFT = `
import Foundation
import CoreImage
let detector = CIDetector(ofType: CIDetectorTypeQRCode, context: nil, options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])!
for path in CommandLine.arguments.dropFirst() {
  guard let image = CIImage(contentsOf: URL(fileURLWithPath: path)) else { print("\\(path)\\t!unreadable"); continue }
  let found = detector.features(in: image).compactMap { ($0 as? CIQRCodeFeature)?.messageString }
  print("\\(path)\\t" + found.joined(separator: "\\t"))
}
`;

let binary;
function build() {
  if (binary) return binary;
  try {
    execFileSync("swiftc", ["--version"], { stdio: "ignore" });
  } catch {
    return null;
  }
  const dir = mkdtempSync(join(tmpdir(), "intro-qr-"));
  const src = join(dir, "read.swift");
  writeFileSync(src, SWIFT);
  binary = join(dir, "read");
  execFileSync("swiftc", ["-O", src, "-o", binary], { stdio: "ignore" });
  return existsSync(binary) ? binary : null;
}

/** { path: [decoded strings] } for each PNG, or null when no decoder is available. */
export function readQrCodes(pngPaths) {
  const bin = build();
  if (!bin) return null;
  mkdirSync(tmpdir(), { recursive: true });
  const out = execFileSync(bin, pngPaths, { encoding: "utf8" });
  const result = {};
  for (const line of out.trim().split("\n")) {
    const [path, ...found] = line.split("\t");
    result[path] = found.filter((s) => s && !s.startsWith("!"));
  }
  return result;
}
