#!/usr/bin/env node

import assert from "node:assert/strict";
import { chromium } from "playwright";
import { skipExit } from "./lib/skip-exit.mjs";

if (process.env.MWB_RUNTIME_TEST !== "1") {
  console.log(
    "↷ Live Board runtime test skipped (set MWB_RUNTIME_TEST=1 with local Vite + Worker)",
  );
  // SKIP, not PASS: the live runtime was never exercised.
  process.exit(skipExit("MWB_RUNTIME_TEST is not set"));
}

const pageUrl = process.env.MWB_PAGE_URL || "http://127.0.0.1:5173/curriculum/math-workbench/";
const socketUrl = process.env.MWB_SOCKET_URL || "ws://127.0.0.1:8799/live";
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.goto(pageUrl, { waitUntil: "domcontentloaded" });
  const result = await page.evaluate(
    async ({ socketUrl }) => {
      const code = `security-${Date.now().toString(36)}`;
      const token = "a".repeat(64);
      const otherToken = "b".repeat(64);
      const connect = (role, host = "") =>
        new Promise((resolve) => {
          const query = new URLSearchParams({ code, role });
          if (host) query.set("host", host);
          const socket = new WebSocket(`${socketUrl}?${query}`);
          const timer = setTimeout(() => resolve({ opened: false, socket }), 3000);
          socket.addEventListener(
            "open",
            () => {
              clearTimeout(timer);
              resolve({ opened: true, socket });
            },
            { once: true },
          );
          socket.addEventListener(
            "error",
            () => {
              clearTimeout(timer);
              resolve({ opened: false, socket });
            },
            { once: true },
          );
        });

      const missing = await connect("teacher");
      const teacher = await connect("teacher", token);
      const forged = await connect("monitor", otherToken);
      const student = await connect("student");
      const board = new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 3000);
        student.socket.addEventListener(
          "message",
          (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "board") {
              clearTimeout(timer);
              resolve(message.snap);
            }
          },
          { once: true },
        );
      });
      teacher.socket.send(JSON.stringify({ type: "board", snap: '{"secure":true}' }));
      const snap = await board;
      teacher.socket.close();
      student.socket.close();
      await new Promise((resolve) => setTimeout(resolve, 250));
      const reclaimed = await connect("teacher", otherToken);
      reclaimed.socket.close();

      return {
        missingOpened: missing.opened,
        teacherOpened: teacher.opened,
        forgedOpened: forged.opened,
        studentOpened: student.opened,
        snap,
        reclaimedOpened: reclaimed.opened,
      };
    },
    { socketUrl },
  );

  assert.deepEqual(result, {
    missingOpened: false,
    teacherOpened: true,
    forgedOpened: false,
    studentOpened: true,
    snap: '{"secure":true}',
    reclaimedOpened: true,
  });
  console.log(
    "✓ Live Board rejects forged hosts, relays boards, and releases expired capabilities",
  );
} finally {
  await browser.close();
}
