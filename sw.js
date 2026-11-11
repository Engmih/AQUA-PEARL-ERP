/* ============================================================
   Trust Group ERP — kill-switch service worker
   الغرض الوحيد: إبطال أي service worker قديم عالق (زي نسخة اتنشرت بالغلط)
   بيمسح كل الكاش، يلغي نفسه، ويعيد تحميل الصفحات المفتوحة — تلقائيًا.
   أي متصفح عنده sw.js قديم بيلاقي الملف ده عند فحص التحديث فيتصلّح لوحده.
   ============================================================ */
self.addEventListener('install', function (e) { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    try {
      var keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    } catch (_) {}
    try { await self.registration.unregister(); } catch (_) {}
    try {
      var cs = await self.clients.matchAll({ type: 'window' });
      cs.forEach(function (c) { try { c.navigate(c.url); } catch (_) {} });
    } catch (_) {}
  })());
});

/* مفيش كاش — كل الطلبات بتروح للشبكة مباشرة */
self.addEventListener('fetch', function (e) { return; });
