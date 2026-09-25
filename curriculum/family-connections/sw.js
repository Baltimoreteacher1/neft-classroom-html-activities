// Retire only this hub's cache. Authenticated teacher pages and live weeks must
// always come from the network; no offline availability is promised here.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("family-connections-"))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  );
});
