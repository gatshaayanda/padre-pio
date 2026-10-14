const CACHE_VERSION = "padre-pio-shell-v1";
const MEDIA_CACHE = "padre-pio-media-v1";
const SHELL_URLS = ["/", "/offline", "/padre-pio-mark.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.all(SHELL_URLS.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await cache.put(url, response);
      } catch {
        // A failed precache must not prevent the website from opening online.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith("padre-pio-") && key !== CACHE_VERSION && key !== MEDIA_CACHE)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const isPrivateOrForm = /^\/(admin|appointments|appointment|account|requests)(\/|$)/.test(url.pathname);
  if (isPrivateOrForm) {
    event.respondWith(fetch(request).catch(() => caches.match("/offline").then((response) => response || Response.error())));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(async () => {
      const cache = await caches.open(CACHE_VERSION);
      return (await cache.match(request)) || (await cache.match("/offline")) || Response.error();
    }));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/padre-pio-mark.svg") {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
