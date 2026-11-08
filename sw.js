/* =====================================================================
   Aqua Pearl ERP — Service Worker
   يخزّن ملف النظام والأيقونات ليعمل التطبيق بلا إنترنت.

   v61.55 — إصلاح جذرى لصفحة «الموقع مش موجود» (ERR_FAILED)
   ---------------------------------------------------------------------
   كان ملف النظام مخزَّنًا فى مخزن اسمه مربوط برقم النسخة، والمخزن القديم
   يُمسح لحظة تفعيل النسخة الجديدة. فتمرّ ثوانٍ يكون فيها الجهاز بلا نسخة
   محفوظة والجديدة لم تكتمل؛ لو عمل المستخدم تحديث للصفحة فى اللحظة دى
   وتعثّرت الشبكة ثانية واحدة كان الناتج Response.error() — وكروم يعرضها
   «This site can't be reached / ERR_FAILED» وكأن الموقع اختفى.

   العلاج هنا على أربع طبقات:
   ١) ملف النظام فى مخزن ثابت DOC مستقل عن رقم النسخة ولا يُمسح أبدًا،
      والتحديث يستبدله مكانه (put) بدل مسح المخزن كله وإعادة البناء.
   ٢) تنظيف المخازن القديمة يقتصر على مخازن النسخ (aqua-pearl-erp-*) ولا
      يقترب من DOC ولا PLANS.
   ٣) كل مسار فى معالج المستند داخل try/catch، وآخر ملاذ صفحة عربية
      مبنيّة داخل الـ SW نفسه — فلا يوجد طريق ينتهى بـ ERR_FAILED.
   ٤) امتلاء مساحة التخزين (QuotaExceeded) لم يعد يُسقط التخزين كله:
      عند الفشل تُمسح الوسائط وحدها ويبقى ملف النظام.

   v61.60 — أهم إصلاح فيهم كلهم: الملف الناقص مابيتحفظش
   ---------------------------------------------------------------------
   صفحة التشخيص على موبايل حقيقى أثبتت إن الملف المحفوظ على الجهاز كان
   ١٠ كيلو بدل ٣.٣ ميجا — يعنى تحميل اتقطع فى نصّه واتحفظ وكأنه كامل،
   والنظام بيفتح منه كل مرة فيطلع باظ.

   ليه المتصفح ما حسّش؟ كلاودفلير بيدجز مابيبعتش حجم الملف
   (Content-Length) — بيبعته مقطّع (chunked). ولما الحجم مش معروف،
   الاتصال اللى بيتقطع فى النص بيبان للمتصفح وكأن الملف خلص.

   العلاج: ما نحفظش ولا نعرض أى نسخة إلا بعد ما نتأكد إنها كاملة:
     • حجمها معقول (أكبر من ٣٠٠ كيلو)
     • فيها رقم النسخة APP_VER
     • وآخرها </html>
   ولو النسخة المحفوظة على الجهاز طلعت ناقصة بتتمسح لوحدها وبينزّل
   غيرها — فالأجهزة اللى فيها ملف ناقص دلوقتى بتصلّح نفسها من غير
   أى تدخل.
   ===================================================================== */
const VER   = 'v61.97';
const CACHE = 'aqua-pearl-erp-' + VER;   /* الأيقونات والوسائط — يتغيّر مع النسخة */
const DOC   = 'aqua-pearl-doc';          /* ملف النظام — ثابت لا يُمسح أبدًا */
const PLANS = 'aqua-pearl-plans';        /* المخططات (٩ ميجا) — ثابت كذلك */
const DOC_KEY = './index.html';
/* v61.97: أقصى انتظار لأول رد من الشبكة لما مايبقاش فيه نسخة محفوظة.
   بعدها بنطلّع شاشتنا بزرار إعادة بدل ما المتصفح يقطع بنفسه. */
const DOC_NET_TIMEOUT = 25000;
/* v61.74: ملفات الصوت (الأذان والتكبير) فى مخزن مستقل عن رقم النسخة،
   زى المخططات — عشان ما تتحملش من أول وجديد مع كل تحديث. */
const AUDIO = 'aqua-pearl-audio';
/* v61.93: الأدوات التجريبية فى مخزن ثابت مستقل عن رقم النسخة.
   بيتحدّث من الشبكة لما يكون فيه نت، وبيشتغل من المخزن لو مفيش —
   فالأداة اللى فتحتها مرة بتفضل شغالة أوفلاين، وتحديث النظام
   مابيضيّعش تقدّمك المحفوظ لأنه فى localStorage مش فى المخزن. */
const TOOLS = 'aqua-pearl-tools';

/* ملفات صغيرة تُحمَّل مسبقًا. الفيديو والموسيقى والمخططات غير موجودة هنا
   عمدًا: حجمها كبير ولا يحتاجها كل مستخدم فورًا، ومعالج fetch يخزّنها أول
   مرة تُطلب فعلًا. */
const CORE = [
  /* v61.60: الجذر './' اتشال من هنا — المستند مصدره مخزن DOC وحده بعد
     التحقق منه، فما ينفعش يكون فيه نسخة تانية غير متحقَّق منها. */
  './reset.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/icon-180.png',
  './icons/favicon.ico'
];

/* ---------------------------------------------------------------------
   صفحة الطوارئ — تُبنى داخل الـ SW فلا تحتاج شبكة ولا مخزَّنًا
   --------------------------------------------------------------------- */
function offlinePage() {
  const html =
'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1">' +
'<title>Aqua Pearl — مفيش اتصال</title><style>' +
'*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
'background:linear-gradient(160deg,#0d2b45,#12415f);color:#eaf3f8;' +
'font-family:"Segoe UI",Tahoma,system-ui,sans-serif;padding:22px}' +
'.b{max-width:380px;width:100%;text-align:center;background:rgba(255,255,255,.07);' +
'border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:26px 20px}' +
'h1{font-size:20px;margin:0 0 8px}p{font-size:15px;line-height:1.8;color:#c6dbe8;margin:0 0 18px}' +
'button{display:block;width:100%;margin:8px 0;padding:13px;border:0;border-radius:11px;' +
'font-size:16px;font-weight:700;font-family:inherit;cursor:pointer}' +
'.p{background:#1195b2;color:#fff}.g{background:transparent;color:#9fc3d6;border:1px solid rgba(255,255,255,.22)}' +
'small{display:block;margin-top:14px;color:#8fb0c4;font-size:12.5px;line-height:1.7}' +
'</style></head><body><div class="b">' +
'<div style="font-size:40px;margin-bottom:6px">📡</div>' +
'<h1>مفيش اتصال بالإنترنت دلوقتى</h1>' +
'<p>النظام نفسه سليم — الاتصال بس هو اللى اتقطع لحظة. اتأكد من النت واضغط «حاول تانى».</p>' +
'<button class="p" onclick="location.reload()">🔄 حاول تانى</button>' +
'<button class="g" onclick="location.href=\'./reset.html\'">🛠️ إصلاح التخزين</button>' +
'<small>«إصلاح التخزين» بيعيد تحميل ملفات النظام من أول وجديد،<br>ومش بيمسح أى بيانات مسجّلة على الجهاز.</small>' +
'</div></body></html>';
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

/* ---------------------------------------------------------------------
   أدوات صغيرة — كلها لا ترمى استثناء
   --------------------------------------------------------------------- */
async function openCache(name) {
  try { return await caches.open(name); } catch (e) { return null; }
}
async function cacheMatch(name, key) {
  try { const c = await openCache(name); return c ? (await c.match(key)) : null; }
  catch (e) { return null; }
}
/* التخزين مع التعامل مع امتلاء المساحة: نفضّى الوسائط ونحاول مرة واحدة */
async function cachePut(name, key, res) {
  const c = await openCache(name);
  if (!c) return false;
  try { await c.put(key, res); return true; }
  catch (e) {
    try { await caches.delete(CACHE); } catch (e2) {}
    try { await c.put(key, res); return true; } catch (e3) { return false; }
  }
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    /* ملف النظام فى مخزنه الثابت — وما يتحفظش إلا لو كامل.
       v61.97: بننزّله هنا بس لو مفيش نسخة محفوظة بالفعل.
       قبل كده كان بينزّله كل مرة: يعنى أول فتحة للتطبيق كانت بتنزّل
       الـ٣.٥ ميجا مرتين فى نفس اللحظة — مرة للمتصفح عشان يعرض الصفحة
       ومرة هنا — وكل واحدة بتتحمّل كاملة فى الذاكرة كنص. ده اللى كان
       بيخنق الآيفون. دلوقتى الفتحة الأولى نفسها هى اللى بتملا المخزن
       من معالج المستند، ومابنزّلش حاجة زيادة. */
    try {
      let have = null;
      try {
        const old = await cacheMatch(DOC, DOC_KEY);
        if (old) have = await docCheckStream(old.clone());
      } catch (e1) {}
      if (!have) {
        /* v61.97: من غير cache:'reload'. ريلود كانت بتجبر تنزيلة جديدة
           من السيرفر رغم إن المتصفح لسه نازّل نفس الملف من ثانية عشان
           يعرض الصفحة — يعنى ٣.٥ ميجا مرتين فى نفس اللحظة على أول فتحة.
           من غيرها بياخدها من مخزن المتصفح. */
        const r = await fetch(DOC_KEY);
        if (r && r.ok) {
          const copy = r.clone();
          const r2 = await Promise.all([
            cachePut(DOC, DOC_KEY, r),
            docCheckStream(copy)
          ]);
          if (!r2[1]) {
            try { const c = await openCache(DOC); if (c) await c.delete(DOC_KEY); } catch (e3) {}
          }
        }
      }
    } catch (e2) {}
    /* الباقى: كل ملف لوحده. addAll كانت بتفشل كلها لو ملف واحد ناقص. */
    const c = await openCache(CACHE);
    if (c) await Promise.all(CORE.map(u => c.add(u).catch(() => {})));
    try { await self.skipWaiting(); } catch (e3) {}
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    /* v61.55: المسح على مخازن النسخ وحدها. DOC وPLANS لا يُمسّان، فالجهاز
       لا يمرّ أبدًا بلحظة يكون فيها بلا ملف نظام محفوظ. */
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k =>
        (k.indexOf('aqua-pearl-erp-') === 0 && k !== CACHE) ? caches.delete(k) : null
      ));
    } catch (e2) {}
    try { await self.clients.claim(); } catch (e3) {}
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
  /* الصفحة بتسأل «فيه تحديث؟» — عشان لو الرسالة اتبعتت قبل ما الصفحة
     تخلص تحميل، ما تضيعش. */
  if (e.data && e.data.type === 'ap-check-update' && AP_UPD_READY) {
    try { e.source.postMessage({ type: 'ap-update-ready' }); } catch (err) {}
  }
});

/* =====================================================================
   هل النسخة اللى على السيرفر اتغيّرت عن المحفوظة؟
   ---------------------------------------------------------------------
   v61.59: كانت المقارنة بترويسات السيرفر (ETag / Last-Modified /
   Content-Length). واتثبت من صفحة التشخيص على موبايل حقيقى إن
   كلاودفلير بيدجز **مابيبعتش ولا واحدة منهم** — بيضغط الملف ويبعته
   مقطّع (chunked). فالمقارنة كانت بتتم بين فاضى وفاضى، ونتيجتها
   دايمًا «مفيش جديد»: التحديث ما كانش بيتكتشف أبدًا، لا شريط ولا
   تحديث تلقائى، والمستخدم يفضل شايف النسخة اللى قبلها لحد ما يفتح
   مرة تانية.

   دلوقتى المقارنة على رقم النسخة المكتوب جوّه الملف نفسه. ده
   مابيعتمدش على السيرفر ولا على إعداداته خالص.
   ===================================================================== */
const DOC_MIN = 300000;   /* الملف الحقيقى ٣.٣ ميجا — أى حاجة أقل من ٣٠٠ كيلو ناقصة أكيد */
/* بيرجّع رقم النسخة لو الملف كامل، وnull لو ناقص أو مش ملف النظام */
function docCheckText(t) {
  try {
    if (!t || t.length < DOC_MIN) return null;
    const m = t.match(/APP_VER\s*=\s*'([^']+)'/);
    if (!m) return null;
    if (!/<\/html>/i.test(t.slice(-3000))) return null;   /* لازم يكون قافل */
    return m[1];
  } catch (e) { return null; }
}
async function docCheck(r) {
  try { return docCheckText(await r.text()); } catch (e) { return null; }
}
/* v61.97: نفس الفحص بالظبط — بس بيقرا الملف على دفعات بدل ما يحمّله
   كله فى الذاكرة. الفحص محتاج تلات حاجات: الحجم، ورقم النسخة، وإن
   الملف قافل بـ</html>. كلهم بيتحسبوا والملف ماشى، فالذاكرة بتفضل
   كيلوبايتات معدودة بدل ٣.٥ ميجا.
   ده اللى كان بيخنق الآيفون: كل فتحة للتطبيق كانت بتحمّل الملف كله
   كنص مرة على الأقل عشان تفحصه قبل ما تعرضه. */
async function docCheckStream(res) {
  try {
    if (!res || !res.body || typeof res.body.getReader !== 'function') {
      return await docCheck(res);
    }
    const rd = res.body.getReader();
    const dec = new TextDecoder('utf-8');
    let total = 0, ver = null, carry = '', tail = '';
    for (;;) {
      const r = await rd.read();
      if (r.done) break;
      const v = r.value;
      total += (v && v.byteLength) || 0;
      const chunk = dec.decode(v, { stream: true });
      if (!ver) {
        const hay = carry + chunk;
        const m = hay.match(/APP_VER\s*=\s*'([^']+)'/);
        if (m) ver = m[1];
        carry = hay.slice(-200);        /* لو الرقم اتقسم بين دفعتين */
      }
      tail = (tail + chunk).slice(-3000);
    }
    tail = (tail + dec.decode()).slice(-3000);
    if (total < DOC_MIN) return null;
    if (!ver) return null;
    if (!/<\/html>/i.test(tail)) return null;
    return ver;
  } catch (e) { return null; }
}
let AP_UPD_READY = false;
async function notifyUpdate() {
  AP_UPD_READY = true;
  try {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    all.forEach(c => { try { c.postMessage({ type: 'ap-update-ready' }); } catch (e) {} });
  } catch (e) {}
}

/* ---------------------------------------------------------------------
   معالج المستند — المخزَّن أولًا مع تحديث فى الخلفية
   لا يمكن لأى مسار فيه أن ينتهى بخطأ شبكة خام.
   --------------------------------------------------------------------- */
async function handleDoc(evt, req) {
  /* v61.57: أى تحميل جديد للصفحة بيصفّر علم «فيه تحديث». من غيره كان
     العلم يفضل مرفوع بعد ما التحديث يتركّب فعلًا، فيرجع الشريط يظهر
     للمستخدم وهو أصلًا على آخر نسخة. */
  AP_UPD_READY = false;

  /* ١ — النسخة المحفوظة، بشرط إنها كاملة.
     لو ناقصة (تحميل اتقطع فى نصّه واتحفظ) بتتمسح هنا، فالجهاز بيصلّح
     نفسه من غير أى تدخل من المستخدم. */
  let cached = null, cachedVer = null;
  try {
    cached = await cacheMatch(DOC, DOC_KEY);
    if (cached) {
      cachedVer = await docCheckStream(cached.clone());   /* v61.97: بالدفعات */
      if (!cachedVer) {
        try { const c = await openCache(DOC); if (c) await c.delete(DOC_KEY); } catch (e) {}
        cached = null;
      }
    }
  } catch (e) { cached = null; cachedVer = null; }

  /* ٢ — النسخة اللى على السيرفر.
     v61.97: مابقناش نحمّل الملف كله فى الذاكرة قبل ما نرجّع حاجة.
     قبل كده كنا بنعمل res.text() على ٣.٥ ميجا، نتحقق منها، نبنى منها
     ردًا جديدًا، وبعدين نعرض — يعنى المستخدم قاعد مستنى من غير ما
     يشوف أى حاجة، وتلات نسخ من الملف فى ذاكرة الجهاز فى نفس اللحظة.
     أندرويد كان بيبلعها، والآيفون لأ: سفارى عندها سقف ذاكرة للصفحة
     وبتقتل الـSW لو طوّل، فالتنقّل كان بيفضل بلا رد وتطلع رسالة
     «السيرفر وقف يرد».
     دلوقتى بنرجّع رد الشبكة زى ما هو — المتصفح بيبدأ يرسم وهو بينزّل —
     وبناخد نسخة تانية (clone) نتحقق منها ونخزّنها ورا فى الخلفية. */
  let net;
  try {
    net = fetch(req).then(res => {
      if (!res || !res.ok) return null;
      const copy = res.clone(), copy2 = res.clone();
      const done = (async () => {
        try {
          /* بنخزّن وبنفحص فى نفس الوقت: التخزين بيكتب على القرص على
             طول، والفحص ماشى معاه دفعة بدفعة — فمفيش نسخة كاملة فى
             الذاكرة ولا الاتنين بيستنوا بعض. ولو طلع ناقص بنمسحه. */
          const r2 = await Promise.all([
            cachePut(DOC, DOC_KEY, copy2),
            docCheckStream(copy)
          ]);
          const ver = r2[1];
          if (!ver) {
            try { const c = await openCache(DOC); if (c) await c.delete(DOC_KEY); } catch (e1) {}
          }
          return ver;
        } catch (e) { return null; }
      })();
      return { resp: res, ver: done };   /* ver وعد — مش قيمة جاهزة */
    }).catch(() => null);
  } catch (e) { net = Promise.resolve(null); }

  /* ٣ — عندنا نسخة محفوظة سليمة: نعرضها فورًا ونقارن فى الخلفية */
  if (cached) {
    try {
      evt.waitUntil((async () => {
        const r = await net;
        if (!r) return;                          /* مفيش شبكة */
        const ver = await r.ver;                 /* بيخلص بعد ما ينزّل ورا */
        if (!ver) return;                        /* الرد ناقص — مانعملش حاجة */
        if (ver !== cachedVer) notifyUpdate(); else AP_UPD_READY = false;
      })());
    } catch (e) {}
    return cached;
  }

  /* ٤ — مفيش محفوظة: دى الحالة اللى كانت بتعلّق الآيفون.
     v61.97: بنستنى أول رد من الشبكة بمهلة، ونرجّعه فورًا من غير ما
     ننتظر الملف يكمل — المتصفح بيرسم وهو بينزّل. التحقق والتخزين
     ماشيين ورا فى الخلفية، ولو طلع ناقص مابيتخزّنش. ولو مفيش رد
     خالص خلال المهلة بنطلّع شاشتنا اللى فيها زرار إعادة، بدل ما
     نسيب التنقّل معلّق لحد ما المتصفح يقطعه برسالته هو. */
  let r = null;
  try {
    r = await Promise.race([
      net,
      new Promise(res => setTimeout(() => res(null), DOC_NET_TIMEOUT))
    ]);
  } catch (e) { r = null; }

  if (r && r.resp) {
    try { evt.waitUntil(Promise.resolve(r.ver).catch(() => null)); } catch (e) {}
    return r.resp;
  }

  return offlinePage();
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  // لا نتدخّل فى نداءات Firebase أو أى نطاق خارجى
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  /* صفحة الإصلاح: الشبكة أولًا دايمًا (فما ينفعش مخزَّن بايظ يحبسها)،
     ومخزَّنها احتياطى لو مفيش نت — عشان تشتغل فى كل الحالات.
     v61.60: قبل كده كانت بتعدّى من غير أى معالجة، فما كانتش تفتح
     أصلًا من غير إنترنت. */
  if (/\/reset\.html$/.test(path)) {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r && r.ok) { cachePut(CACHE, req, r.clone()); return r; }
      } catch (err) {}
      const hit = await cacheMatch(CACHE, req);
      return hit || offlinePage();
    })());
    return;
  }

  /* v61.55: «مستند» = الجذر أو index.html أو تنقّل لمسار بلا امتداد.
     قبل كده كان أى تنقّل مهما كان مساره بيرجّع index.html من المخزن. */
  const isDoc = path === '/' || path.slice(-1) === '/' ||
                /\/index\.html$/.test(path) ||
                (req.mode === 'navigate' && !/\.[a-zA-Z0-9]{1,6}$/.test(path));

  if (isDoc) { e.respondWith(handleDoc(e, req)); return; }

  // ملف المخططات: مخزن مستقل يعيش عبر التحديثات
  /* الأدوات: الشبكة الأول وبعدين المخزن (stale-while-revalidate) */
  if (/tools\.js$/.test(path)) {
    e.respondWith((async () => {
      const key = './tools.js';
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        if (res && res.ok) { cachePut(TOOLS, key, res.clone()); return res; }
      } catch (err) {}
      const hit = await cacheMatch(TOOLS, key);
      return hit || new Response('', { status: 504, statusText: 'offline' });
    })());
    return;
  }

  const bucket = /plans\.js$/.test(path) ? PLANS
               : (/\.(mp3|m4a|ogg|wav|aac)$/i.test(path) ? AUDIO : CACHE);

  // باقى الملفات: المخزّن أولًا — ولا ترجع أبدًا قيمة فارغة
  e.respondWith((async () => {
    const hit = await cacheMatch(bucket, req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok) { cachePut(bucket, req, res.clone()); }
      return res;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'offline' });
    }
  })());
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
