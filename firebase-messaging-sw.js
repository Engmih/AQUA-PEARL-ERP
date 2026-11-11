/* Trust ERP — Service Worker لإشعارات Push في الخلفية.
   لازم يتحط في نفس فولدر index.html على GitHub Pages (بنفس الاسم ده بالظبط). */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDkrAPP0PtdlSuA06qc4ATbymIJJqhm1Zk",
  authDomain: "trust-group-erp.firebaseapp.com",
  projectId: "trust-group-erp",
  storageBucket: "trust-group-erp.firebasestorage.app",
  messagingSenderId: "113101269874",
  appId: "1:113101269874:web:f0cfdf163f3f3e1c720beb"
});

const messaging = firebase.messaging();

/* الرسائل data-only — بنبني الإشعار بنفسنا (مفيش تكرار) */
messaging.onBackgroundMessage(function (payload) {
  const d = (payload && payload.data) || {};
  self.registration.showNotification(d.title || 'Trust ERP', {
    body: d.body || '',
    dir: 'rtl',
    lang: 'ar',
    icon: d.icon || './icon-192.png',
    badge: './icon-192.png',
    data: d,
    tag: d.tag || undefined
  });
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cl) {
      for (const c of cl) {
        try { if ('focus' in c) { if (c.navigate) c.navigate(url); return c.focus(); } } catch (err) {}
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
