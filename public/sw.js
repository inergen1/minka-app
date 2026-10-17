// Minka offline support: pages are network-first (fall back to the cached copy),
// hashed build assets are cache-first. All user data lives in localStorage.
const CACHE = "minka-v1";
const PAGES = ["/today", "/areas", "/goals", "/habits", "/calendar", "/review"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([...PAGES, "/manifest.webmanifest", "/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || (await cache.match("/today")) || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|woff2?)$/.test(url.pathname)) e.respondWith(cacheFirst(e.request));
  else e.respondWith(networkFirst(e.request));
});
