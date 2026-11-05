// Mode hors-ligne : on essaie toujours le réseau d'abord, et on garde une copie pour quand il n'y en a pas.
const CACHE = "lueur-v1";
const CORE = ["./", "index.html", "styles.css", "essentiels.js", "news.json", "manifest.webmanifest", "icon.svg", "icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // les photos des articles passent directement
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(url.pathname.endsWith("news.json") ? "news.json" : e.request, copy)); }
      return r;
    }).catch(() => caches.match(url.pathname.endsWith("news.json") ? "news.json" : e.request).then(r => r || caches.match("index.html")))
  );
});
