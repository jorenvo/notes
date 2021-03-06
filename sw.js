// when an asset changes:
// - update urlsToCache
// - update this cache name by appending a new date +%s
const cacheName = "jvo-sh-notes-cache-1590543131";
const urlsToCache = [
    "/notes/",
    "/notes/aliasing/",
    "/notes/nat_traversal/",
    "/notes/mail/",
    "/notes/multi_website/",

    // all revisioned assets:
    // $ fd -t f . revisioned | sort | sed 's/\(.*\)/"\/notes\/\1",/' | cpy
    "/notes/revisioned/aliasing/Reconstruction-Mitchell-Checkerboard-925f574d7c.png",
    "/notes/revisioned/aliasing/jittered_spheres_10px-9c149c15d3.png",
    "/notes/revisioned/aliasing/jittered_spheres_1_05px-8e01b9a8b7.png",
    "/notes/revisioned/aliasing/jittered_spheres_1px-3583b882a1.png",
    "/notes/revisioned/aliasing/multi_jittered_spheres_1_05px-ea76482930.png",
    "/notes/revisioned/aliasing/uniform_samples-6609ac2fe4.svg",
    "/notes/revisioned/aliasing/uniform_samples_larger_spheres-4d8ebdfcac.png",
    "/notes/revisioned/aliasing/uniform_samples_larger_spheres-6907424969.svg",
    "/notes/revisioned/aliasing/uniform_spheres_1_05px-777279d15d.png",
    "/notes/revisioned/aliasing/uniform_spheres_1px-9a1b889fc3.png",
    "/notes/revisioned/assets/favicon-034aad3767.png",
    "/notes/revisioned/assets/maps/style-85e4af3f95.css.map",
    "/notes/revisioned/assets/style-ea23070d5d.css",
    "/notes/revisioned/assets/sw-loader-649419f22f.js",
    "/notes/revisioned/mail/gmail_archive-63756bcc13.png",
    "/notes/revisioned/multi_website/inheritance-d21bc7ee7c.png",
    "/notes/revisioned/multi_website/published_unpublished-197a5a0926.png",
    "/notes/revisioned/multi_website/website_selector-fb2100c036.png",
    "/notes/revisioned/nat_traversal/graphs/flow_alice_bob-c7f5262a7f.png",
    "/notes/revisioned/nat_traversal/graphs/flow_alice_broker_bob-d71e1cfe54.png",
    "/notes/revisioned/nat_traversal/graphs/flow_alice_register-b1dd2f01a0.png",
    "/notes/revisioned/nat_traversal/graphs/flow_bob_alice-e1d6f68f30.png",
    "/notes/revisioned/nat_traversal/graphs/flow_bob_register-f34455a377.png",
    "/notes/revisioned/nat_traversal/graphs/flow_full-3c45bc4331.png",
];

self.addEventListener("install", event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            // cache: reload to always check the server, otherwise
            // unrevisioned urls like /notes/multi_website can be
            // fetched from a browser cache which will be out of date.
            const requests = urlsToCache.map(
                url => new Request(url, {cache: "reload"})
            );
            return cache.addAll(requests);
        })
    );
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        (async function() {
            const cacheNames = await caches.keys();

            return Promise.all(
                cacheNames.map(function(name) {
                    if (cacheName != name) {
                        console.log(`deleting old cache ${name}`);
                        return caches.delete(name);
                    } else {
                        console.log(`keeping current cache ${name}`);
                        return Promise.resolve();
                    }
                })
            );
        })()
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
