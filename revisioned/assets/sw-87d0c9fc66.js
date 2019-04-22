const CACHE_NAME = "jvo-sh-notes-cache";
const urlsToCache = ["/notes/revisioned/aliasing", "/notes/revisioned/nat_traversal", "/notes/revisioned/mail"];

self.addEventListener("install", event => {
    event.waitUntil(async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urlsToCache);
    });
});
