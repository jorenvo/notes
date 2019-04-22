const cacheName = "jvo-sh-notes-cache";
const urlsToCache = [
    "./notes/",
    "./notes/aliasing/",
    "./notes/nat_traversal/",
    "./notes/mail/"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener("fetch", event => {
    // respondWith has to be called synchronously here. It takes a
    // promise, use an async IIFE to generate this promise.
    event.respondWith(
        (async function() {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(event.request);

            if (cachedResponse) {
                console.log(`cache hit for ${event.request.url}`);
                return cachedResponse;
            } else {
                console.log(`cache miss for ${event.request.url}`);
                return fetch(event.request);
            }
        })()
    );
});
