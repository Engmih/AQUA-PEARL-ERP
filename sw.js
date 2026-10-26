/* =====================================================================
   Aqua Pearl ERP — Service Worker
   يخزّن ملف النظام والأيقونات ليعمل التطبيق بلا إنترنت.
   استراتيجية: الشبكة أولًا للملف الرئيسى (ليصل التحديث فورًا) مع الرجوع
   للنسخة المخزّنة عند انقطاع الشبكة، والمخزّن أولًا للأيقونات.
   ===================================================================== */
const CACHE = 'aqua-pearl-erp-v61.53';
/* v61.50: المخططات (٩ ميجا) فى مخزن مستقل عن رقم النسخة، فما تتنزّلش
   تانى مع كل تحديث للبرنامج. */
const PLANS = 'aqua-pearl-plans';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/icon-180.png',
  './icons/favicon.ico'
];
/* الفيديو والموسيقى لا تُحمّل مسبقًا: حجمها كبير ولا يحتاجها كل مستخدم فورًا.
   معالج fetch يخزّنها أول مرة تُطلب فعلًا، والنسخة المطلوبة وحدها. */

self.addEventListener('install', e => {
  e.waitUntil(
    /* v61.49: كل ملف لوحده. addAll كانت بتفشل كلها لو ملف واحد ناقص
       (أيقونة مثلًا)، فالنظام نفسه ما كانش بيتخزّن ويفضل ينزّل كل مرة. */
    caches.open(CACHE)
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== PLANS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
  /* v61.49: الصفحة بتسأل «فيه تحديث؟» — عشان لو الرسالة اتبعتت قبل ما
     الصفحة تخلص تحميل، ما تضيعش. */
  if (e.data && e.data.type === 'ap-check-update' && AP_UPD_READY) {
    try { e.source.postMessage({ type: 'ap-update-ready' }); } catch (err) {}
  }
});

/* هل النسخة اللى على السيرفر اتغيّرت عن المحفوظة؟ */
function stamp(r) {
  try {
    return r.headers.get('etag') || r.headers.get('last-modified') ||
           r.headers.get('content-length') || '';
  } catch (e) { return ''; }
}
function changed(a, b) {
  const x = stamp(a), y = stamp(b);
  return !!(x && y && x !== y);
}
let AP_UPD_READY = false;
async function notifyUpdate() {
  AP_UPD_READY = true;
  try {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    all.forEach(c => { try { c.postMessage({ type: 'ap-update-ready' }); } catch (e) {} });
  } catch (e) {}
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // لا نتدخّل فى نداءات Firebase أو أى نطاق خارجى
  if (url.origin !== self.location.origin) return;

  const isDoc = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  if (isDoc) {
    /* ===================================================================
       v61.49 — المخزَّن أولًا مع تحديث فى الخلفية
       كان «الشبكة أولًا»: يعنى كل مرة يفتح فيها أى حد التطبيق كان
       بينزّل الملف كامل (١٢ ميجا) قبل ما يشوف أى حاجة — بطء شديد على
       الموبايل واستهلاك باقة كبير.
       دلوقتى: بنعرض النسخة المحفوظة فورًا، وننزّل الجديدة فى الخلفية،
       ولو اتغيّرت بنقول للصفحة تعرض زرار «فيه تحديث».
       =================================================================== */
    e.respondWith((async () => {
      const cache  = await caches.open(CACHE);
      const cached = await cache.match('./index.html');
      const net = fetch(req).then(res => {
        if (res && res.ok) { cache.put('./index.html', res.clone()).catch(() => {}); }
        return res;
      }).catch(() => null);

      if (cached) {
        e.waitUntil((async () => {
          const res = await net;
          if (res && res.ok && changed(cached, res)) notifyUpdate();
        })());
        return cached;
      }
      const res = await net;
      return res || (await cache.match('./')) || Response.error();
    })());
    return;
  }

  // ملف المخططات: مخزن مستقل يعيش عبر التحديثات
  const bucket = url.pathname.endsWith('plans.js') ? PLANS : CACHE;

  // باقى الملفات: المخزّن أولًا
  e.respondWith(
    caches.open(bucket).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) c.put(req, res.clone()).catch(() => {});
      return res;
    }).catch(() => hit)))
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
