// No longer used: previous version cached all GETs and served stale app bundles after deploy.
// Kept so existing registrations can update to this file, then unregister (see index.html).
self.addEventListener("install", function () {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.registration.unregister();
    })
  );
});
