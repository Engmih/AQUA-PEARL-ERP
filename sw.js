/* =====================================================================
   Aqua Pearl ERP — Service Worker
   يخزّن ملف النظام والأيقونات ليعمل التطبيق بلا إنترنت.
   استراتيجية: الشبكة أولًا للملف الرئيسى (ليصل التحديث فورًا) مع الرجوع
   للنسخة المخزّنة عند انقطاع الشبكة، والمخزّن أولًا للأيقونات.
   ===================================================================== */
const CACHE = 'aqua-pearl-erp-v61.27';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/icon-180.png',
  './icons/favicon.ico',
  './intro.mp4',
  './intro.webm',
  './theme.m4a',
  './theme.ogg',
  './intro.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // لا نتدخّل فى نداءات Firebase أو أى نطاق خارجى
  if (url.origin !== self.location.origin) return;

  const isDoc = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  if (isDoc) {
    // الشبكة أولًا: أى نسخة جديدة ترفعها تصل للمستخدم فورًا
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // باقى الملفات: المخزّن أولًا
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});

/* =====================================================================
   v61.20 — الإشعارات التى تصل والتطبيق مقفول
   الرسالة تأتى من Firebase Cloud Messaging عبر Apps Script، فيعرضها
   المتصفح حتى لو النظام مغلق تمامًا. الضغط عليها يفتح النظام.
   ===================================================================== */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {
    try { d = { notification: { title: 'Aqua Pearl', body: e.data.text() } }; } catch (e2) { d = {}; }
  }
  const n = d.notification || d.data || {};
  const title = n.title || 'Aqua Pearl ERP';
  const body  = n.body  || '';
  const url   = (d.data && d.data.url) || n.url || './index.html';
  const tag   = (d.data && d.data.tag) || n.tag || 'aqua-pearl';
  e.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    tag: tag,
    renotify: true,
    data: { url: url },
    vibrate: [80, 40, 80]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './index.html';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.indexOf(self.registration.scope) === 0 && 'focus' in c) return c.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
