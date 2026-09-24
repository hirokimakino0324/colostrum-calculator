/* 牛舎で電波が届かなくても開けるようにするためのキャッシュ */
var CACHE = 'colostrum-v7';
var ASSETS = [
  './',
  './index.html',
  './setup.html',
  './farms.json',
  './qrcode.min.js',
  './qr.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* 1つ失敗しても残りはキャッシュする */
      return Promise.all(ASSETS.map(function (u) {
        return c.add(new Request(u, { cache: 'reload', mode: u.indexOf('http') === 0 ? 'no-cors' : 'same-origin' }))
                .catch(function () { return null; });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* まずネットワーク、だめならキャッシュ（更新を取りこぼさず、圏外でも動く） */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy).catch(function () {}); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
