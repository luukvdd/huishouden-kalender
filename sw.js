const CACHE = 'thuis-v5';
const LOCAL = [
  './index.html', './kalender.html', './boodschappen.html', './todo.html',
  './instellingen.html', './manifest.json', './sw.js', './icon.svg', './taken.csv'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      cache.addAll(LOCAL);
      cache.add('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap').catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  } else {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});

let morningTimer = null;
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_MORNING') {
    if (morningTimer) clearTimeout(morningTimer);
    morningTimer = setTimeout(async () => {
      await self.registration.showNotification('🌅 Goedemorgen! — Thuis Apps', {
        body: e.data.summary || 'Bekijk je taken voor vandaag.',
        icon: './icon.svg',
        badge: './icon.svg',
        tag: 'morning-briefing',
        requireInteraction: false,
      });
    }, e.data.msUntil);
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    if (list.length) return list[0].focus();
    return clients.openWindow('./index.html');
  }));
});
