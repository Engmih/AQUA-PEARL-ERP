/* =====================================================================
   Aqua Pearl ERP — الأدوات التجريبية  (tools.js)
   ملف منفصل عن النظام عن قصد: مابينزلش على جهاز المستخدم إلا لما
   المدير يفتح الدرج بنفسه. العميل والموظف والشريك عمرهم ما يحمّلوه
   ولا يشوفوا سطر من كوده — وده الحماية الحقيقية الوحيدة المتاحة فى
   تطبيق بلا سيرفر، أقوى بكتير من إخفاء بـCSS أو شرط فى الواجهة.

   الملف مالوش أى تأثير على النظام: مابيعدّلش DB ولا بيكتب غير فى
   مفاتيح localStorage الخاصة بيه (apTool_*)، وكل دواله مسبوقة بـapT.
   ===================================================================== */
(function(){
'use strict';
if(window.AP_TOOLS_READY) return;

/* ───────── أدوات مساعدة محلية ───────── */
const $$=(s,r)=>(r||document).querySelector(s);
const esc2=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n2=v=>{const x=Number(v);return isFinite(x)?x:0;};
const fm=v=>{try{return fmtN(Math.round(n2(v)));}catch(e){return String(Math.round(n2(v)));}};
const fmm=v=>fm(v)+' ج.م';
function lsGet(k,d){ try{ const v=localStorage.getItem('apTool_'+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
function lsSet(k,v){ try{ localStorage.setItem('apTool_'+k,JSON.stringify(v)); }catch(e){} }
function buzz(ms){ try{ if(apTSound()&&navigator.vibrate) navigator.vibrate(ms||12); }catch(e){} }
function apTSound(){ return lsGet('fx',true)!==false; }
function apTSoundSet(v){ lsSet('fx',!!v); apTRender(); }

/* ───────── الهيكل: درج + صفحات ───────── */
/* خريطة الصفحات: كل أداة بتسجّل نفسها هنا */
const AP_T_HTML={}, AP_T_INIT={};
const TOOLS=[
  {id:'calc',  ic:'🔢', name:'الآلة الحاسبة',   sub:'بالنِسب والسجل'},
  {id:'tasbih',ic:'📿', name:'المسبحة',          sub:'عدّاد بيتحفظ لوحده'},
  {id:'fin',   ic:'🎨', name:'حاسبة التشطيب',    sub:'من باقاتك الحقيقية، بند بند'},
  {id:'sudoku',ic:'🔲', name:'سودوكو',           sub:'ألغاز حقيقية بحل وحيد', g:1},
  {id:'xo',    ic:'⭕', name:'إكس أو',            sub:'ضد الكمبيوتر أو اتنين', g:1},
  {id:'mem',   ic:'🧠', name:'الذاكرة',           sub:'بطاقات متطابقة', g:1},
  {id:'guess', ic:'🎯', name:'خمّن الرقم',        sub:'أعلى / أقل', g:1},
  {id:'slide', ic:'🧩', name:'ترتيب الأرقام',     sub:'ألغاز قابلة للحل دايمًا', g:1},
  {id:'quiz',  ic:'❓', name:'معلومات عامة',       sub:'٥ تصنيفات', g:1},
  {id:'cw',    ic:'📝', name:'كلمات متقاطعة',     sub:'شبكة جديدة كل مرة', g:1}
];
let apTOpen=false, apTPage='';

function apTAllowed(id){
  try{ if(typeof apToolState==='function'){ const st=apToolState(id);
    if(st==='off') return false;
    if(st==='all') return true;
    return !!(CURRENT_USER&&CURRENT_USER.admin); } }catch(e){}
  return !!(CURRENT_USER&&CURRENT_USER.admin);
}
function apTList(){ return TOOLS.filter(t=>apTAllowed(t.id)); }

window.apToolsDrawer=function(open){
  const d=$$('#apTDrawer'); if(!d) return;
  apTOpen=(open!==false);
  if(apTOpen){ apTRender(); d.classList.add('open'); }
  else { d.classList.remove('open'); apTPage=''; }
};
window.apToolsGo=function(id){ apTPage=id||''; apTRender(); };

function apTRender(){
  const b=$$('#apTBody'); if(!b) return;
  if(!apTPage){
    const L=apTList(), tools=L.filter(t=>!t.g), games=L.filter(t=>t.g);
    const row=t=>'<button class="apTItem" onclick="apToolsGo(\''+t.id+'\')">'
      +'<span class="apTIc">'+t.ic+'</span>'
      +'<span class="apTTx"><b>'+esc2(t.name)+'</b><i>'+esc2(t.sub)+'</i></span>'
      +'<span class="apTAr">‹</span></button>';
    b.innerHTML=(tools.length?'<div class="apTList">'+tools.map(row).join('')+'</div>':'')
      +(games.length?'<h4 class="apTSec">🎮 ألعاب وتسلية</h4><div class="apTList">'
        +games.map(row).join('')+'</div>':'')
      +'<label class="apTFx"><input type="checkbox" '+(apTSound()?'checked':'')
      +' onchange="apTSoundSet(this.checked)"> المؤثرات والاهتزاز</label>'
      +'<p class="apTNote">أدوات تحت التجربة — منفصلة تمامًا عن حسابات النظام، '
      +'ومابتكتبش أى حاجة فى بيانات العملاء.</p>';
    const h=$$('#apTHead'); if(h) h.textContent='Aqua Pearl Smart Tools';
    const bk=$$('#apTBack'); if(bk) bk.style.display='none';
    return;
  }
  const t=TOOLS.find(x=>x.id===apTPage);
  if(!t||!apTAllowed(t.id)){ apTPage=''; apTRender(); return; }
  const h=$$('#apTHead'); if(h) h.textContent=t.ic+' '+t.name;
  const bk=$$('#apTBack'); if(bk) bk.style.display='';
  const H=AP_T_HTML[t.id]; if(!H){ apTPage=''; apTRender(); return; }
  b.innerHTML=H();
  const after=AP_T_INIT[t.id];
  if(after) try{ after(); }catch(e){ console.warn('tool init',e); }
}
window.apTRender=apTRender;
window.apTSoundSet=apTSoundSet;
window.apToolsBack=function(){ apTPage=''; apTRender(); };

/* =====================================================================
   ٢) الآلة الحاسبة — بالنِسب وسجل آخر ٢٠ عملية
   الحساب بيمشى على أعداد JS العادية، والعرض بيتقرّب لـ١٢ رقم معنوى
   عشان ماتطلعش 0.30000000000000004.
   ===================================================================== */
let cAcc=null, cOp=null, cCur='0', cFresh=true;
function cTidy(v){
  if(!isFinite(v)) return '0';
  let r=Number(v);
  /* toFixed(12) بيقتل 0.30000000000000004 من غير ما يضيّع دقة الأعداد
     الصحيحة الكبيرة — بخلاف toPrecision اللى كان بيقرّب آخر رقم فيها */
  if(Math.abs(r)<1e15) r=Number(r.toFixed(12));
  return (Math.abs(r)>=1e15||(r!==0&&Math.abs(r)<1e-9))?r.toExponential(6):String(r);
}
function cNorm(t){ return (t===''||t==='-'||t==='.'||t==='-.')?'0':t; }
function cShow(){
  const d=$$('#tcDisp'); if(d) d.textContent=cCur;
  const s=$$('#tcSub');
  if(s) s.textContent=(cAcc!==null&&cOp)?(cTidy(cAcc)+' '+({'+':'+','-':'−','*':'×','/':'÷'}[cOp]||cOp)):'';
}
function cHist(line){
  const h=lsGet('calcHist',[]); h.unshift(line);
  lsSet('calcHist',h.slice(0,20));
  const e=$$('#tcHist'); if(e) e.innerHTML=apTCalcHistHTML();
}
function apTCalcHistHTML(){
  const h=lsGet('calcHist',[]);
  if(!h.length) return '<p class="apTNote">مفيش عمليات لسه.</p>';
  return h.map(x=>'<div class="apTHRow" onclick="apTCalcUse(\''+String(x.r).replace(/'/g,'')+'\')">'
    +'<span>'+esc2(x.e)+'</span><b>'+esc2(x.r)+'</b></div>').join('');
}
window.apTCalcUse=function(v){ cCur=String(v); cFresh=true; cShow(); };
function cApply(){
  if(cAcc===null||!cOp) return Number(cCur);
  const b=Number(cCur), a=cAcc;
  let r;
  switch(cOp){ case '+':r=a+b;break; case '-':r=a-b;break; case '*':r=a*b;break;
    case '/':r=(b===0?NaN:a/b);break; default:r=b; }
  if(cOp==='/'&&b===0){ try{ toast('مفيش قسمة على صفر — العملية اتلغت','err'); }catch(e){} return a; }
  cHist({e:cTidy(a)+' '+({'+':'+','-':'−','*':'×','/':'÷'}[cOp])+' '+cTidy(b),r:cTidy(r)});
  return r;
}
window.apTCalcKey=function(k){
  buzz(10);
  if(k==='C'){ cAcc=null;cOp=null;cCur='0';cFresh=true; }
  else if(k==='⌫'){ cCur=cNorm(cCur.length>1?cCur.slice(0,-1):'0'); cFresh=(cCur==='0'); }
  else if(k==='±'){ cCur=cCur.startsWith('-')?cCur.slice(1):('-'+cCur); }
  else if(k==='.'){ if(cFresh){cCur='0.';cFresh=false;} else if(cCur.indexOf('.')<0) cCur+='.'; }
  else if(k==='%'){
    /* النسبة بالمنطق اللى بتستخدمه: ٥٠٠٠ + ١٠٪ = ٥٥٠٠، و١٠٪ لوحدها = ٠٫١ */
    const b=Number(cCur);
    if(cAcc!==null&&(cOp==='+'||cOp==='-')) cCur=cTidy(cAcc*b/100);
    else cCur=cTidy(b/100);
    cFresh=true;
  }
  else if('0123456789'.indexOf(k)>=0){ if(cFresh){cCur=k;cFresh=false;} else cCur=(cCur==='0'?k:cCur+k); }
  else if(k==='='){ const r=cApply(); cCur=cTidy(r); cAcc=null; cOp=null; cFresh=true; }
  else { const r=cApply(); cAcc=Number(cTidy(r)); cOp=k; cCur=cTidy(r); cFresh=true; }
  cShow();
};
window.apTCalcCopy=function(){
  try{ navigator.clipboard.writeText(cCur).then(function(){ toast('اتنسخ ✔','ok'); }); }catch(e){}
};
window.apTCalcClear=function(){ lsSet('calcHist',[]); const e=$$('#tcHist'); if(e) e.innerHTML=apTCalcHistHTML(); };
window.apTPct=function(){
  const a=n2(($$('#tpA')||{}).value), b=n2(($$('#tpB')||{}).value);
  const o=$$('#tpOut'); if(!o) return;
  o.innerHTML='<b style="color:var(--aqua)">'+fmm(b*a/100)+'</b>'
    +(b?'<span class="gray-note" style="direction:ltr;display:inline-block"> · '
      +a+'% \u00d7 '+fm(b)+'</span>':'');
};
function apTCalcHTML(){
  const K=[['C','⌫','%','/'],['7','8','9','*'],['4','5','6','-'],['1','2','3','+'],['±','0','.','=']];
  return '<div class="apTCalc">'
    +'<div class="apTDisp"><i id="tcSub"></i><b id="tcDisp">0</b></div>'
    +'<div class="apTPad">'+K.map(row=>row.map(k=>{
      const op='*/+-='.indexOf(k)>=0, fn=('C⌫%±'.indexOf(k)>=0);
      return '<button class="apTK'+(op?' op':'')+(fn?' fn':'')+(k==='='?' eq':'')
        +'" onclick="apTCalcKey(\''+(k==="'"?"\\'":k)+'\')">'
        +({'*':'×','/':'÷','-':'−'}[k]||k)+'</button>';
    }).join('')).join('')+'</div>'
    +'<button class="btn ghost sm" style="width:100%;margin-top:7px" onclick="apTCalcCopy()">📋 نسخ النتيجة</button>'
  +'</div>'
  +'<div class="apTCard"><h4>٪ كام من كام</h4><div class="grid g2">'
    +'<div class="form-row"><label>النسبة ٪</label><input type="number" id="tpA" value="7.5" step="0.5" oninput="apTPct()"></div>'
    +'<div class="form-row"><label>من مبلغ</label><input type="number" id="tpB" value="1000000" step="1000" oninput="apTPct()"></div>'
  +'</div><div id="tpOut" style="font-size:17px;font-weight:800;padding:4px 2px"></div></div>'
  +'<div class="apTCard"><h4>آخر ٢٠ عملية '
    +'<button class="btn ghost sm" style="float:left" onclick="apTCalcClear()">🧹 مسح</button></h4>'
    +'<div id="tcHist">'+apTCalcHistHTML()+'</div></div>';
}
function apTCalcAfter(){ cAcc=null;cOp=null;cCur='0';cFresh=true; cShow(); apTPct(); }

/* =====================================================================
   ٣) المسبحة — العدّاد بيتحفظ لوحده ومابيتصفّرش بقفل التطبيق
   ===================================================================== */
const ATHKAR=['سبحان الله','الحمد لله','الله أكبر','لا إله إلا الله','أستغفر الله',
              'سبحان الله وبحمده','لا حول ولا قوة إلا بالله','اللهم صلِّ على محمد'];
function tbState(){
  const d=lsGet('tasbih',null)||{};
  return {z:d.z||ATHKAR[0], n:n2(d.n), goal:d.goal==null?33:d.goal,
          day:d.day||'', today:n2(d.today), custom:d.custom||[]};
}
function tbSave(s){ lsSet('tasbih',s); }
function tbToday(s){
  let t; try{ t=todayISO(); }catch(e){ t=new Date().toISOString().slice(0,10); }
  if(s.day!==t){ s.day=t; s.today=0; }
  return s;
}
function apTTasbihHTML(){
  const s=tbToday(tbState());
  const all=ATHKAR.concat(s.custom||[]);
  const goal=n2(s.goal), pct=goal>0?Math.min(100,Math.round(s.n/goal*100)):0;
  const R=52, C=2*Math.PI*R;
  return '<div class="apTTb">'
    +'<select id="tbZ" onchange="apTTbZikr(this.value)">'
      +all.map(z=>'<option'+(z===s.z?' selected':'')+'>'+esc2(z)+'</option>').join('')
      +'<option value="__new">➕ ذِكر من عندك…</option></select>'
    +'<div class="apTRing">'
      +'<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="'+R+'" class="bgc"/>'
      +'<circle cx="60" cy="60" r="'+R+'" class="fgc" id="tbArc" '
      +'stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-pct/100)).toFixed(1)+'"/></svg>'
      +'<div class="apTNum"><b id="tbN">'+fm(s.n)+'</b><i id="tbG">'+(goal?'من '+fm(goal):'مفتوح')+'</i></div>'
    +'</div>'
    +'<div class="apTZk" id="tbZk">'+esc2(s.z)+'</div>'
    +'<button class="apTTap" onclick="apTTbTap()">سبِّح</button>'
    +'<div class="apTGoals">'+[33,99,100,0].map(g=>
      '<button class="apTG'+(goal===g?' on':'')+'" onclick="apTTbGoal('+g+')">'
      +(g?fm(g):'مفتوح')+'</button>').join('')+'</div>'
    +'<div class="apTBtns">'
      +'<button class="btn ghost" onclick="apTTbReset()">🔄 تصفير</button>'
      +'<span class="apTDay">النهاردة: <b id="tbT">'+fm(s.today)+'</b></span>'
    +'</div>'
  +'</div>';
}
function apTTasbihAfter(){}
window.apTTbZikr=function(v){
  const s=tbState();
  if(v==='__new'){
    const z=prompt('اكتب الذِكر:');
    if(z&&z.trim()){ s.custom=(s.custom||[]).concat([z.trim()]); s.z=z.trim(); }
    tbSave(s); apTRender(); return;
  }
  s.z=v; s.n=0; tbSave(s); apTRender();
};
window.apTTbGoal=function(g){ const s=tbState(); s.goal=g; tbSave(s); apTRender(); };
window.apTTbTap=function(){
  const s=tbToday(tbState());
  s.n=n2(s.n)+1; s.today=n2(s.today)+1;
  const goal=n2(s.goal);
  tbSave(s);
  const nEl=$$('#tbN'), tEl=$$('#tbT'), arc=$$('#tbArc');
  if(nEl) nEl.textContent=fm(s.n);
  if(tEl) tEl.textContent=fm(s.today);
  if(arc){ const R=52,C=2*Math.PI*R, pct=goal>0?Math.min(100,s.n/goal*100):0;
    arc.setAttribute('stroke-dashoffset',(C*(1-pct/100)).toFixed(1)); }
  if(goal>0&&s.n===goal){ buzz([30,60,30]); try{ toast('تمّت '+fm(goal)+' 🤍','ok'); }catch(e){} }
  else buzz(12);
};
window.apTTbReset=function(){
  const s=tbState();
  const go=function(){ s.n=0; tbSave(s); apTRender(); };
  try{ confirmBox('🔄 تصفير العدّاد',
      '<p>هيترجع العدّاد صفر. إحصائية النهاردة هتفضل زى ما هى.</p>','🔄 صفّر',go); }
  catch(e){ if(confirm('تصفير العدّاد؟')) go(); }
};

/* =====================================================================
   ٤) حاسبة التشطيب — من باقات النظام الحقيقية
   مابتخترعش أسعار: بتاخد سعر المتر الرسمى للباقة من FIN_PKGS (نفس
   الأرقام اللى فى استمارة الحجز وشاشة عرض الوحدة)، وتستخدمه كمرجع،
   وتفصّل عليه بنود بكميات حقيقية — لأن مساحة الدهانات مش مساحة الشقة،
   ومساحة الأرضيات مش مساحة الشقة كمان. وبتوريك الفرق بين تفصيلتك
   وسعر الباقة الرسمى عشان تعرف إنت فوق ولا تحت.
   ===================================================================== */
function finPkgs(){
  try{ if(typeof FIN_PKGS==='object'&&FIN_PKGS) return FIN_PKGS; }catch(e){}
  return {};
}
/* البنود الافتراضية.
   الكمية بتتولّد من المساحة والغرف والحمامات — مش من مساحة الوحدة
   وبس، لأن الدهانات بتتحسب على الحوائط والسقف (≈٣ أمثال المساحة)
   والأرضيات على الأرضيات والحوائط الرطبة (≈١٫١٥).
   وسعر الوحدة (up) أسعار سوق تقريبية لمستوى CLASSIC، بتتضاعف
   للباقات الأعلى بنسبة سعر مترها لسعر متر الكلاسيك.
   والفرق بين مجموع البنود دى وسعر الباقة الرسمى بيتحط فى بند
   «بنود أخرى ومستلزمات ومصنعيات» بدل ما نضخّم أسعار الوحدة. */
const FIN_BASE_PM=6500;
const FIN_ITEMS=[
  {k:'floor', n:'الأرضيات والحوائط',  u:'م²',   q:(a,r,b)=>Math.round(a*1.15), up:800},
  {k:'paint', n:'الدهانات',            u:'م²',   q:(a,r,b)=>Math.round(a*3.0),  up:160},
  {k:'gyp',   n:'الأسقف الجبسية',      u:'م²',   q:(a,r,b)=>Math.round(a*0.35), up:400},
  {k:'doors', n:'الأبواب والنجارة',    u:'باب',  q:(a,r,b)=>r+b+1,              up:9000},
  {k:'elec',  n:'الأعمال الكهربائية',  u:'م²',   q:(a,r,b)=>Math.round(a),      up:700},
  {k:'plumb', n:'الأعمال الصحية',      u:'حمام', q:(a,r,b)=>Math.max(1,b),      up:70000},
  {k:'kitch', n:'المطبخ',              u:'مقطوعية', q:()=>1,                    up:120000},
  {k:'light', n:'الإضاءة',             u:'م²',   q:(a,r,b)=>Math.round(a),      up:250},
  {k:'ac',    n:'التكييفات',           u:'وحدة', q:(a,r,b)=>r+1,                up:35000, opt:true},
  {k:'smart', n:'Smart Home ونظام الصوت', u:'مقطوعية', q:()=>1,                 up:70000, lux:true},
  {k:'misc',  n:'بنود أخرى ومستلزمات ومصنعيات', u:'مقطوعية', q:()=>1, up:0, bal:true}
];
function finState(){
  const d=lsGet('fin',null)||{};
  return {pkg:d.pkg||'premium', area:d.area||140, rooms:d.rooms==null?3:d.rooms,
          baths:d.baths==null?2:d.baths, sup:!!d.sup, ac:!!d.ac,
          q:d.q||{}, p:d.p||{}, pkgOf:d.pkgOf||''};
}
let apTF=null;
function finRows(st){
  const P=finPkgs()[st.pkg], pm=P?n2(P.pm):0;
  const lux=(st.pkg==='luxury');
  const f=FIN_BASE_PM>0?(pm/FIN_BASE_PM):1;          /* معامل مستوى الباقة */
  const official=Math.round(n2(st.area)*pm);
  const items=FIN_ITEMS.filter(it=>(it.lux?lux:true)&&(it.opt?st.ac:true));
  const mine=st.pkgOf===st.pkg;
  const out=items.filter(it=>!it.bal).map(it=>{
    const qd=it.q(n2(st.area),n2(st.rooms),n2(st.baths));
    const q=(mine&&st.q[it.k]!=null)?n2(st.q[it.k]):qd;
    const pd=Math.round(n2(it.up)*f/10)*10;           /* سعر سوق تقريبى لمستوى الباقة */
    const price=(mine&&st.p[it.k]!=null)?n2(st.p[it.k]):pd;
    return {k:it.k,n:it.n,u:it.u,q:q,qd:qd,price:price,pd:pd,total:q*price};
  });
  /* بند الموازنة: الفرق لحد سعر الباقة الرسمى — قابل للتعديل زى أى بند */
  const bal=items.find(it=>it.bal);
  if(bal){
    const sum=out.reduce((a,r)=>a+r.total,0);
    const pd=Math.max(0,Math.round(official-sum));
    const price=(mine&&st.p[bal.k]!=null)?n2(st.p[bal.k]):pd;
    out.push({k:bal.k,n:bal.n,u:bal.u,q:1,qd:1,price:price,pd:pd,total:price,bal:true});
  }
  return out;
}
function apTFinHTML(){
  const st=finState(), PK=finPkgs();
  const keys=Object.keys(PK);
  if(!keys.length) return '<p class="apTNote">مش لاقى باقات التشطيب فى النظام.</p>';
  return '<div class="apTCard">'
    +'<div class="form-row"><label>🎨 الباقة</label>'
      +'<select id="tfPkg" onchange="apTFinPkg(this.value)">'
      +keys.map(k=>'<option value="'+k+'"'+(k===st.pkg?' selected':'')+'>'
        +esc2(PK[k].ar)+' — '+esc2(PK[k].name)+' · '+fm(PK[k].pm)+' ج.م/م²</option>').join('')
      +'</select><span class="gray-note" id="tfTag"></span></div>'
    +'<div class="grid g2">'
      +'<div class="form-row"><label>📐 مساحة الوحدة (م²)</label>'
        +'<input type="number" id="tfArea" value="'+st.area+'" step="1" oninput="apTFinCalc(1)"></div>'
      +'<div class="form-row"><label>🚪 عدد الغرف</label>'
        +'<input type="number" id="tfRooms" value="'+st.rooms+'" step="1" min="0" oninput="apTFinCalc(1)"></div>'
      +'<div class="form-row"><label>🚿 عدد الحمامات</label>'
        +'<input type="number" id="tfBaths" value="'+st.baths+'" step="1" min="0" oninput="apTFinCalc(1)"></div>'
      +'<div class="form-row"><label>❄️ التكييفات</label>'
        +'<select id="tfAc" onchange="apTFinCalc(1)">'
        +'<option value="0"'+(!st.ac?' selected':'')+'>من غير تكييفات</option>'
        +'<option value="1"'+(st.ac?' selected':'')+'>تشمل التكييفات</option></select></div>'
    +'</div>'
    +'<label class="apTFx"><input type="checkbox" id="tfSup" '+(st.sup?'checked':'')
      +' onchange="apTFinCalc()"> إضافة إشراف الشركة ١٥٪ على قيمة الأعمال</label>'
  +'</div>'
  +'<div id="tfOut"></div>'
  +'<div class="apTBtns">'
    +'<button class="btn ghost" onclick="apTFinReset()">↺ رجّع الافتراضى</button>'
    +'<button class="btn aqua" onclick="apTFinSave()">💾 حفظ</button>'
    +'<button class="btn green" onclick="apTFinPrint()">🖨️ طباعة / PDF</button>'
  +'</div>'
  +'<p class="apTNote">النتائج تقديرية ولا تمثل عرض سعر أو تعاقدًا مُلزمًا.</p>';
}
window.apTFinPkg=function(k){
  const st=finState(); st.pkg=k; st.q={}; st.p={}; st.pkgOf=k; lsSet('fin',st);
  apTRender();
};
function apTFinRead(keepEdits){
  const st=finState();
  st.area=n2(($$('#tfArea')||{}).value);
  st.rooms=Math.max(0,Math.round(n2(($$('#tfRooms')||{}).value)));
  st.baths=Math.max(0,Math.round(n2(($$('#tfBaths')||{}).value)));
  st.ac=(($$('#tfAc')||{}).value==='1');
  st.sup=!!(($$('#tfSup')||{}).checked);
  st.pkg=(($$('#tfPkg')||{}).value)||st.pkg;
  if(!keepEdits){
    document.querySelectorAll('[data-fq]').forEach(el=>{ st.q[el.dataset.fq]=n2(el.value); });
    document.querySelectorAll('[data-fp]').forEach(el=>{ st.p[el.dataset.fp]=n2(el.value); });
    st.pkgOf=st.pkg;
  }
  return st;
}
window.apTFinCalc=function(resetQty){
  const st=apTFinRead(!!resetQty);
  if(resetQty){ st.q={}; st.p={}; st.pkgOf=''; }
  lsSet('fin',st); apTF=st;
  const rows=finRows(st), P=finPkgs()[st.pkg]||{};
  const sum=rows.reduce((a,r)=>a+r.total,0);
  const sup=st.sup?Math.round(sum*0.15):0;
  const tot=sum+sup;
  const official=Math.round(n2(st.area)*n2(P.pm));
  const diff=tot-official;
  const perM=n2(st.area)>0?Math.round(tot/n2(st.area)):0;
  const o=$$('#tfOut'); if(!o) return;
  const body=rows.map(r=>'<tr>'
    +'<td>'+esc2(r.n)+'</td>'
    +'<td>'+(r.bal?'<i class="apTU">موازنة</i>'
      :'<input type="number" data-fq="'+r.k+'" value="'+r.q+'" step="1" oninput="apTFinCalc()" class="apTMini"> <i class="apTU">'+r.u+'</i>')+'</td>'
    +'<td><input type="number" data-fp="'+r.k+'" value="'+r.price+'" step="50" oninput="apTFinCalc()" class="apTMini"></td>'
    +'<td><b>'+fm(r.total)+'</b></td>'
    +'<td>'+(sum>0?(r.total/sum*100).toFixed(1):'0')+'٪</td></tr>').join('');
  const bars=rows.slice().sort((a,b)=>b.total-a.total).map(r=>{
    const pc=sum>0?(r.total/sum*100):0;
    return '<div class="apTBar"><span>'+esc2(r.n)+'</span>'
      +'<div><i style="width:'+pc.toFixed(1)+'%"></i></div>'
      +'<b>'+pc.toFixed(0)+'٪</b></div>';
  }).join('');
  const tile=(ic,lb,v,c)=>'<div class="apTTile"><span>'+ic+'</span><div><i>'+lb+'</i><b'
    +(c?' style="color:'+c+'"':'')+'>'+v+'</b></div></div>';
  o.innerHTML='<div class="apTTiles">'
      +tile('🧾','إجمالى الأعمال',fmm(sum))
      +(sup?tile('📐','إشراف ١٥٪',fmm(sup),'var(--amber)'):'')
      +tile('💰','الإجمالى',fmm(tot),'var(--aqua)')
      +tile('📊','متوسط المتر',fmm(perM))
      +tile('🏷️','سعر الباقة الرسمى',fmm(official))
      +tile(Math.abs(diff)<official*0.03?'✔️':'⚠️','الفرق عن الباقة',
            (diff>0?'+':'')+fmm(diff),Math.abs(diff)<official*0.03?'var(--green)':'var(--amber)')
    +'</div>'
    +'<div class="apTCard"><h4>توزيع التكلفة</h4>'+bars+'</div>'
    +'<div class="tbl-wrap"><table class="tbl"><thead><tr>'
      +'<th>البند</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالى</th><th>٪</th>'
    +'</tr></thead><tbody>'+body+'</tbody>'
    +'<tfoot><tr><th colspan="3">الإجمالى</th><th>'+fm(tot)+'</th><th>100٪</th></tr></tfoot></table></div>';
  const tg=$$('#tfTag'); if(tg) tg.textContent=P.tag||'';
};
function apTFinAfter(){ apTFinCalc(); }
window.apTFinSave=function(){ apTFinRead(); lsSet('fin',apTFinRead()); try{ toast('اتحفظ على الجهاز ده ✔','ok'); }catch(e){} };
window.apTFinReset=function(){
  const st=finState(); st.q={}; st.p={}; st.pkgOf=''; lsSet('fin',st); apTRender();
  try{ toast('رجعت للكميات والأسعار الافتراضية','ok'); }catch(e){}
};
window.apTFinPrint=function(){
  const st=apTF||finState(), rows=finRows(st), P=finPkgs()[st.pkg]||{};
  const sum=rows.reduce((a,r)=>a+r.total,0), sup=st.sup?Math.round(sum*0.15):0, tot=sum+sup;
  const perM=n2(st.area)>0?Math.round(tot/n2(st.area)):0;
  const w=window.open('','_blank'); if(!w){ try{ toast('المتصفح منع النافذة','err'); }catch(e){} return; }
  w.document.write('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">'
    +'<title>تقدير تشطيب — '+esc2(P.ar||'')+'</title><style>'
    +'body{font-family:Tahoma,Arial,sans-serif;direction:rtl;padding:26px;color:#15293b}'
    +'h1{color:#0b2a4a;font-size:20px;margin:0 0 2px}h2{color:#1195b2;font-size:13.5px;margin:0 0 16px;font-weight:600}'
    +'table{width:100%;border-collapse:collapse;margin-bottom:12px}'
    +'td,th{border:1px solid #dbe6ee;padding:6px 8px;font-size:12.5px}'
    +'thead th{background:#0b2a4a;color:#fff}tfoot th{background:#e3f3f8}'
    +'.nt{font-size:11.5px;color:#5b7186;border-top:1px dashed #dbe6ee;padding-top:9px}'
    +'</style></head><body>'
    +'<h1>Aqua Pearl City — تقدير تكلفة تشطيب</h1>'
    +'<h2>'+esc2(P.ar||'')+' ('+esc2(P.name||'')+') · '+fm(st.area)+' م² · '
    +fm(st.rooms)+' غرف و'+fm(st.baths)+' حمامات · '+(new Date()).toLocaleDateString('ar-EG')+'</h2>'
    +'<table><thead><tr><th>البند</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة</th><th>الإجمالى</th><th>٪</th></tr></thead><tbody>'
    +rows.map(r=>'<tr><td>'+esc2(r.n)+'</td><td>'+fm(r.q)+'</td><td>'+esc2(r.u)+'</td><td>'+fm(r.price)
      +'</td><td>'+fm(r.total)+'</td><td>'+(sum>0?(r.total/sum*100).toFixed(1):'0')+'٪</td></tr>').join('')
    +'</tbody><tfoot>'
    +'<tr><th colspan="4">إجمالى الأعمال</th><th colspan="2">'+fm(sum)+'</th></tr>'
    +(sup?'<tr><th colspan="4">إشراف الشركة ١٥٪</th><th colspan="2">'+fm(sup)+'</th></tr>':'')
    +'<tr><th colspan="4">الإجمالى</th><th colspan="2">'+fm(tot)+'</th></tr>'
    +'<tr><th colspan="4">متوسط تكلفة المتر</th><th colspan="2">'+fm(perM)+'</th></tr>'
    +'</tfoot></table>'
    +(st.sup?'<p class="nt">'+esc2((typeof FIN_SUPERVISION_TEXT!=='undefined')?FIN_SUPERVISION_TEXT:'')+'</p>':'')
    +'<p class="nt">النتائج تقديرية ولا تمثل عرض سعر أو إيجابًا أو تعاقدًا مُلزمًا للشركة. '
    +'سعر متر الباقة الرسمى '+fm(P.pm)+' ج.م/م²، وتوزيع التكلفة على البنود تقديرى قابل للمراجعة.</p>'
    +'</body></html>');
  w.document.close(); setTimeout(function(){ try{ w.print(); }catch(e){} },350);
};

AP_T_HTML.calc =apTCalcHTML;  AP_T_INIT.calc =apTCalcAfter;
AP_T_HTML.tasbih=apTTasbihHTML;AP_T_INIT.tasbih=apTTasbihAfter;
AP_T_HTML.fin  =apTFinHTML;   AP_T_INIT.fin  =apTFinAfter;


/* =====================================================================
   🎮 ألعاب وتسلية — كلها من غير أى مكتبة خارجية
   كل لعبة بتحفظ تقدّمها وأفضل نتيجة فى localStorage، فالخروج من
   الدرج أو قفل التطبيق مابيضيّعش حاجة.
   ===================================================================== */
function gScore(k,d){ return lsGet('g_'+k,d); }
function gSave(k,v){ lsSet('g_'+k,v); }
function gBar(html){ return '<div class="apTBtns" style="margin:0 0 9px">'+html+'</div>'; }
function mmss(sec){ sec=Math.max(0,Math.round(sec));
  return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0'); }

/* ═════════════ ١) سودوكو ═════════════
   توليد حقيقى: شبكة كاملة بالـbacktracking العشوائى، وبعدين بنشيل
   خانات واحدة واحدة ونتأكد بعد كل شيلة إن الحل لسه وحيد (العدّاد
   بيقف عند حلّين). فمفيش لغز مكرر ولا لغز بأكتر من حل. */
function sdBox(r,c){ return (Math.floor(r/3)*3)+Math.floor(c/3); }
function sdOk(g,i,v){
  const r=Math.floor(i/9), c=i%9;
  for(let k=0;k<9;k++){
    if(g[r*9+k]===v) return false;
    if(g[k*9+c]===v) return false;
  }
  const br=Math.floor(r/3)*3, bc=Math.floor(c/3)*3;
  for(let a=0;a<3;a++)for(let b2=0;b2<3;b2++) if(g[(br+a)*9+bc+b2]===v) return false;
  return true;
}
function sdShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i];a[i]=a[j];a[j]=t; } return a; }
function sdFill(g,i){
  if(i>=81) return true;
  if(g[i]) return sdFill(g,i+1);
  const nums=sdShuffle([1,2,3,4,5,6,7,8,9]);
  for(let k=0;k<9;k++){
    const v=nums[k];
    if(sdOk(g,i,v)){ g[i]=v; if(sdFill(g,i+1)) return true; g[i]=0; }
  }
  return false;
}
function sdCount(g,limit){
  /* عدّاد الحلول — بيقف أول ما يوصل للحد عشان مايعلّقش */
  let best=-1, min=10;
  for(let i=0;i<81;i++){
    if(g[i]) continue;
    let n=0;
    for(let v=1;v<=9;v++) if(sdOk(g,i,v)) n++;
    if(n===0) return 0;
    if(n<min){ min=n; best=i; if(n===1) break; }
  }
  if(best<0) return 1;
  let total=0;
  for(let v=1;v<=9;v++){
    if(!sdOk(g,best,v)) continue;
    g[best]=v; total+=sdCount(g,limit-total); g[best]=0;
    if(total>=limit) break;
  }
  return total;
}
function sdMake(level){
  const sol=new Array(81).fill(0); sdFill(sol,0);
  const puz=sol.slice();
  const target={easy:44,med:34,hard:28}[level]||34;
  const order=sdShuffle(Array.from({length:81},(_,i)=>i));
  let clues=81;
  for(let n=0;n<order.length&&clues>target;n++){
    const i=order[n], keep=puz[i];
    if(!keep) continue;
    puz[i]=0;
    if(sdCount(puz.slice(),2)!==1){ puz[i]=keep; } else clues--;
  }
  return {sol,puz,clues};
}
function sdState(){
  const d=lsGet('sudoku',null);
  if(d&&d.puz&&d.puz.length===81) return d;
  return null;
}
function sdNew(level){
  const m=sdMake(level);
  const st={level:level,puz:m.puz,sol:m.sol,cur:m.puz.slice(),
    notes:{},sel:-1,t:0,hints:0,undo:[],redo:[],done:false,paused:false,start:Date.now()};
  lsSet('sudoku',st); return st;
}
let SD=null, SD_T=null;
function sdTick(){
  clearInterval(SD_T);
  SD_T=setInterval(function(){
    if(!SD||SD.done||SD.paused) return;
    SD.t=n2(SD.t)+1;
    const e=$$('#sdT'); if(e) e.textContent=mmss(SD.t);
    if(SD.t%10===0) lsSet('sudoku',SD);
  },1000);
}
function apTSudokuHTML(){
  SD=sdState();
  const best=gScore('sdBest',{easy:0,med:0,hard:0});
  const lv={easy:'سهل',med:'متوسط',hard:'صعب'};
  if(!SD) return '<div class="apTCard"><h4>اختار المستوى</h4>'
    +'<div class="apTBtns">'+Object.keys(lv).map(k=>
      '<button class="btn '+(k==='easy'?'green':(k==='med'?'aqua':'red'))+'" onclick="apTSdNew(\'' +k+ '\')">'
      +lv[k]+(best[k]?' · '+mmss(best[k]):'')+'</button>').join('')+'</div>'
    +'<p class="apTNote">كل لغز بيتولّد من الأول وبحل وحيد — مفيش شبكة ثابتة ولا لغز بيتكرر.</p></div>';
  return apTSdBoard();
}
function apTSdBoard(){
  const lv={easy:'سهل',med:'متوسط',hard:'صعب'}[SD.level];
  const best=gScore('sdBest',{easy:0,med:0,hard:0})[SD.level]||0;
  let cells='';
  for(let i=0;i<81;i++){
    const fixed=!!SD.puz[i], v=SD.cur[i];
    const r=Math.floor(i/9), c=i%9;
    const sel=(SD.sel===i);
    const peer=(SD.sel>=0)&&(Math.floor(SD.sel/9)===r||SD.sel%9===c||sdBox(Math.floor(SD.sel/9),SD.sel%9)===sdBox(r,c));
    const same=(SD.sel>=0&&v&&SD.cur[SD.sel]===v);
    const bad=v&&!fixed&&v!==SD.sol[i];
    const nt=SD.notes[i]||[];
    cells+='<div class="sdC'+(fixed?' fx':'')+(sel?' sel':'')+(peer&&!sel?' pr':'')
      +(same&&!sel?' sm':'')+(bad?' bad':'')
      +(c%3===2&&c<8?' br':'')+(r%3===2&&r<8?' bb':'')+'" onclick="apTSdSel('+i+')">'
      +(v?v:(nt.length?'<u>'+nt.join('')+'</u>':''))+'</div>';
  }
  const left=SD.cur.filter((v,i)=>!v).length;
  return gBar(
     '<span class="apTDay">⏱ <b id="sdT">'+mmss(SD.t)+'</b> · '+lv
     +(best?' · أفضل '+mmss(best):'')+' · فاضل '+left+'</span>'
    +'<button class="btn ghost sm" onclick="apTSdPause()">'+(SD.paused?'▶️ كمّل':'⏸ وقف')+'</button>'
    +'<button class="btn ghost sm" onclick="apTSdQuit()">🔄 لعبة جديدة</button>')
  +'<div class="sdWrap'+(SD.paused?' pz':'')+'"><div class="sdG">'+cells+'</div>'
    +(SD.paused?'<div class="sdPz">موقوفة</div>':'')+'</div>'
  +'<div class="sdKeys">'+[1,2,3,4,5,6,7,8,9].map(v=>
      '<button class="apTK" onclick="apTSdPut('+v+')">'+v+'</button>').join('')
    +'<button class="apTK fn" onclick="apTSdPut(0)">⌫</button></div>'
  +gBar('<button class="btn '+(SD.note?'aqua':'ghost')+' sm" onclick="apTSdNote()">✏️ ملاحظات '+(SD.note?'(شغّالة)':'')+'</button>'
    +'<button class="btn ghost sm" onclick="apTSdUndo()">↶</button>'
    +'<button class="btn ghost sm" onclick="apTSdRedo()">↷</button>'
    +'<button class="btn ghost sm" onclick="apTSdHint()">💡 تلميح ('+(3-n2(SD.hints))+')</button>'
    +'<button class="btn green sm" onclick="apTSdCheck()">✔️ تحقّق</button>')
  +(SD.done?'<p class="apTWin">🎉 خلصتها فى '+mmss(SD.t)+'</p>':'');
}
window.apTSdNew=function(l){ SD=sdNew(l); apTRender(); sdTick(); };
window.apTSdQuit=function(){
  const go=function(){ lsSet('sudoku',null); SD=null; clearInterval(SD_T); apTRender(); };
  try{ confirmBox('🔄 لعبة جديدة','<p>هتسيب اللعبة الحالية وتبدأ من الأول.</p>','ابدأ من الأول',go); }
  catch(e){ go(); }
};
window.apTSdPause=function(){ SD.paused=!SD.paused; lsSet('sudoku',SD); apTRender(); };
window.apTSdSel=function(i){ if(SD.paused||SD.done) return; SD.sel=i; lsSet('sudoku',SD); apTRender(); };
window.apTSdNote=function(){ SD.note=!SD.note; lsSet('sudoku',SD); apTRender(); };
window.apTSdPut=function(v){
  if(SD.paused||SD.done) return;
  const i=SD.sel; if(i<0||SD.puz[i]) return;
  SD.undo=(SD.undo||[]).concat([{i:i,v:SD.cur[i],n:(SD.notes[i]||[]).slice()}]);
  if(SD.undo.length>120) SD.undo.shift();
  SD.redo=[];
  if(SD.note&&v){
    const nt=SD.notes[i]||[];
    const k=nt.indexOf(v);
    SD.notes[i]=(k>=0)?nt.filter(x=>x!==v):nt.concat([v]).sort();
  }else{
    SD.cur[i]=v||0;
    if(v) SD.notes[i]=[];
  }
  buzz(8); sdDone(); lsSet('sudoku',SD); apTRender();
};
function sdDone(){
  if(SD.cur.some((v,i)=>v!==SD.sol[i])) return;
  SD.done=true; clearInterval(SD_T);
  const b=gScore('sdBest',{easy:0,med:0,hard:0});
  if(!b[SD.level]||SD.t<b[SD.level]){ b[SD.level]=SD.t; gSave('sdBest',b);
    try{ toast('رقم قياسى جديد! '+mmss(SD.t),'ok'); }catch(e){} }
  else { try{ toast('تمام — خلصتها فى '+mmss(SD.t),'ok'); }catch(e){} }
  buzz([40,60,40]);
}
window.apTSdUndo=function(){
  if(!SD.undo||!SD.undo.length) return;
  const u=SD.undo.pop();
  SD.redo=(SD.redo||[]).concat([{i:u.i,v:SD.cur[u.i],n:(SD.notes[u.i]||[]).slice()}]);
  SD.cur[u.i]=u.v; SD.notes[u.i]=u.n; lsSet('sudoku',SD); apTRender();
};
window.apTSdRedo=function(){
  if(!SD.redo||!SD.redo.length) return;
  const r=SD.redo.pop();
  SD.undo=(SD.undo||[]).concat([{i:r.i,v:SD.cur[r.i],n:(SD.notes[r.i]||[]).slice()}]);
  SD.cur[r.i]=r.v; SD.notes[r.i]=r.n; lsSet('sudoku',SD); apTRender();
};
window.apTSdHint=function(){
  if(SD.done||SD.paused) return;
  if(n2(SD.hints)>=3){ try{ toast('خلصت التلميحات','err'); }catch(e){} return; }
  const empty=[]; for(let i=0;i<81;i++) if(SD.cur[i]!==SD.sol[i]) empty.push(i);
  if(!empty.length) return;
  const i=(SD.sel>=0&&SD.cur[SD.sel]!==SD.sol[SD.sel])?SD.sel:empty[Math.floor(Math.random()*empty.length)];
  SD.cur[i]=SD.sol[i]; SD.notes[i]=[]; SD.hints=n2(SD.hints)+1; SD.sel=i;
  sdDone(); lsSet('sudoku',SD); apTRender();
};
window.apTSdCheck=function(){
  const wrong=SD.cur.filter((v,i)=>v&&v!==SD.sol[i]).length;
  const left=SD.cur.filter(v=>!v).length;
  try{ toast(wrong?(wrong+' خانة غلط'):(left?('كله سليم — فاضل '+left)+' خانة':'تمام ✔'), wrong?'err':'ok'); }catch(e){}
};
AP_T_HTML.sudoku=apTSudokuHTML; AP_T_INIT.sudoku=function(){ if(SD&&!SD.done) sdTick(); };


/* ═════════════ ٢) إكس أو ═════════════ */
const XO_W=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function xoWin(b){ for(const w of XO_W){ const [a,c,d]=w; if(b[a]&&b[a]===b[c]&&b[a]===b[d]) return {p:b[a],w:w}; }
  return b.indexOf('')<0?{p:'-',w:null}:null; }
function xoMinimax(b,me,turn){
  const r=xoWin(b);
  if(r) return {s:r.p==='-'?0:(r.p===me?10:-10)};
  let best=null;
  for(let i=0;i<9;i++){
    if(b[i]) continue;
    b[i]=turn;
    const v=xoMinimax(b,me,turn==='X'?'O':'X').s;
    b[i]='';
    const sc=v>0?v-1:(v<0?v+1:0);
    if(best===null||(turn===me?sc>best.s:sc<best.s)) best={s:sc,i:i};
  }
  return best;
}
function xoState(){
  const d=lsGet('xo',null)||{};
  return {b:(d.b&&d.b.length===9)?d.b:['','','','','','','','',''],
    turn:d.turn||'X', mode:d.mode||'cpu', hard:d.hard!==false,
    w:gScore('xoW',{win:0,lose:0,draw:0}), over:d.over||null};
}
function xoSave(st){ lsSet('xo',{b:st.b,turn:st.turn,mode:st.mode,hard:st.hard,over:st.over}); }
let XO=null;
function apTXoHTML(){
  XO=xoState();
  const r=XO.over;
  return gBar('<button class="btn '+(XO.mode==='cpu'?'aqua':'ghost')+' sm" onclick="apTXoMode(\'cpu\')">ضد الكمبيوتر</button>'
    +'<button class="btn '+(XO.mode==='two'?'aqua':'ghost')+' sm" onclick="apTXoMode(\'two\')">اتنين</button>'
    +(XO.mode==='cpu'?'<button class="btn '+(XO.hard?'red':'ghost')+' sm" onclick="apTXoHard()">'
      +(XO.hard?'صعب':'عادى')+'</button>':''))
  +'<div class="xoG">'+XO.b.map((v,i)=>'<button class="xoC'+(r&&r.w&&r.w.indexOf(i)>=0?' win':'')
      +'" onclick="apTXoPlay('+i+')">'+(v||'')+'</button>').join('')+'</div>'
  +'<p class="apTWin">'+(r?(r.p==='-'?'تعادل':(r.p+' كسب'))
      :(XO.mode==='two'?('دور '+XO.turn):(XO.turn==='X'?'دورك':'بيفكّر…')))+'</p>'
  +gBar('<span class="apTDay">كسبت <b>'+fm(XO.w.win)+'</b> · خسرت <b>'+fm(XO.w.lose)
      +'</b> · تعادل <b>'+fm(XO.w.draw)+'</b></span>'
    +'<button class="btn ghost sm" onclick="apTXoReset()">🔄 لوحة جديدة</button>'
    +'<button class="btn ghost sm" onclick="apTXoZero()">🧹 صفّر العدّاد</button>');
}
window.apTXoMode=function(m){ XO.mode=m; XO.b=['','','','','','','','','']; XO.turn='X'; XO.over=null; xoSave(XO); apTRender(); };
window.apTXoHard=function(){ XO.hard=!XO.hard; xoSave(XO); apTRender(); };
window.apTXoReset=function(){ XO.b=['','','','','','','','','']; XO.turn='X'; XO.over=null; xoSave(XO); apTRender(); };
window.apTXoZero=function(){ gSave('xoW',{win:0,lose:0,draw:0}); apTRender(); };
function xoEnd(){
  const r=xoWin(XO.b);
  if(!r) return false;
  XO.over=r;
  const w=gScore('xoW',{win:0,lose:0,draw:0});
  if(XO.mode==='cpu'){ if(r.p==='X') w.win++; else if(r.p==='O') w.lose++; else w.draw++; }
  else { if(r.p==='-') w.draw++; }
  gSave('xoW',w); xoSave(XO); return true;
}
window.apTXoPlay=function(i){
  if(XO.over||XO.b[i]) return;
  if(XO.mode==='cpu'&&XO.turn!=='X') return;
  XO.b[i]=XO.turn; buzz(10);
  if(xoEnd()){ apTRender(); return; }
  if(XO.mode==='two'){ XO.turn=XO.turn==='X'?'O':'X'; xoSave(XO); apTRender(); return; }
  XO.turn='O'; xoSave(XO); apTRender();
  setTimeout(function(){
    if(XO.over) return;
    let mv;
    if(XO.hard) mv=xoMinimax(XO.b.slice(),'O','O').i;
    else { const free=XO.b.map((v,k)=>v?-1:k).filter(k=>k>=0);
           mv=free[Math.floor(Math.random()*free.length)]; }
    if(mv==null) return;
    XO.b[mv]='O';
    if(!xoEnd()) XO.turn='X';
    xoSave(XO); apTRender();
  },260);
};
AP_T_HTML.xo=apTXoHTML;

/* ═════════════ ٣) الذاكرة ═════════════ */
const MEM_ICONS=['🌊','🏖️','🏝️','⛵','🐚','🐬','🌴','☀️','🦩','🪸','🧿','🛟','🐟','🦀','🌅','⚓'];
function memState(){
  const d=lsGet('mem',null);
  if(d&&d.cards) return d;
  return null;
}
function memNew(size){
  const [c,r]={s1:[4,3],s2:[4,4],s3:[6,4]}[size]||[4,4];
  const pairs=(c*r)/2;
  const pool=sdShuffle(MEM_ICONS.slice()).slice(0,pairs);
  const cards=sdShuffle(pool.concat(pool)).map((ic,i)=>({i:i,ic:ic,up:false,done:false}));
  const st={size:size,c:c,r:r,cards:cards,moves:0,t:0,open:[],done:false};
  lsSet('mem',st); return st;
}
let MM=null, MM_T=null;
function memTick(){ clearInterval(MM_T); MM_T=setInterval(function(){
  if(!MM||MM.done) return; MM.t=n2(MM.t)+1;
  const e=$$('#mmT'); if(e) e.textContent=mmss(MM.t);
  if(MM.t%10===0) lsSet('mem',MM); },1000); }
function apTMemHTML(){
  MM=memState();
  const names={s1:'4×3',s2:'4×4',s3:'6×4'};
  const best=gScore('memBest',{});
  if(!MM) return '<div class="apTCard"><h4>اختار الحجم</h4><div class="apTBtns">'
    +Object.keys(names).map(k=>'<button class="btn aqua" onclick="apTMemNew(\''+k+'\')">'+names[k]
      +(best[k]?' · '+mmss(best[k].t)+' / '+best[k].m+' حركة':'')+'</button>').join('')
    +'</div></div>';
  const b=best[MM.size];
  return gBar('<span class="apTDay">⏱ <b id="mmT">'+mmss(MM.t)+'</b> · حركات <b>'+fm(MM.moves)+'</b>'
      +(b?' · أفضل '+mmss(b.t)+'/'+b.m:'')+'</span>'
    +'<button class="btn ghost sm" onclick="apTMemQuit()">🔄 جديدة</button>')
  +'<div class="mmG" style="grid-template-columns:repeat('+MM.c+',1fr)">'
    +MM.cards.map(c=>'<button class="mmC'+(c.up||c.done?' up':'')+(c.done?' ok':'')
      +'" onclick="apTMemFlip('+c.i+')"><span>'+(c.up||c.done?c.ic:'')+'</span></button>').join('')
  +'</div>'+(MM.done?'<p class="apTWin">🎉 خلصتها فى '+mmss(MM.t)+' و'+fm(MM.moves)+' حركة</p>':'');
}
window.apTMemNew=function(s){ MM=memNew(s); apTRender(); memTick(); };
window.apTMemQuit=function(){ lsSet('mem',null); MM=null; clearInterval(MM_T); apTRender(); };
window.apTMemFlip=function(i){
  if(!MM||MM.done) return;
  const c=MM.cards[i];
  if(!c||c.done||c.up||MM.open.length>=2) return;
  c.up=true; MM.open.push(i); buzz(8);
  if(MM.open.length===2){
    MM.moves=n2(MM.moves)+1;
    const [a,b]=MM.open.map(k=>MM.cards[k]);
    if(a.ic===b.ic){
      a.done=b.done=true; a.up=b.up=false; MM.open=[];
      if(MM.cards.every(x=>x.done)){
        MM.done=true; clearInterval(MM_T);
        const best=gScore('memBest',{}), cur=best[MM.size];
        if(!cur||MM.t<cur.t){ best[MM.size]={t:MM.t,m:MM.moves}; gSave('memBest',best);
          try{ toast('رقم قياسى! '+mmss(MM.t),'ok'); }catch(e){} }
        buzz([40,60,40]);
      }
      lsSet('mem',MM); apTRender(); return;
    }
    lsSet('mem',MM); apTRender();
    setTimeout(function(){
      if(!MM) return;
      MM.open.forEach(k=>{ if(MM.cards[k]) MM.cards[k].up=false; });
      MM.open=[]; lsSet('mem',MM); apTRender();
    },720);
    return;
  }
  lsSet('mem',MM); apTRender();
};
AP_T_HTML.mem=apTMemHTML; AP_T_INIT.mem=function(){ if(MM&&!MM.done) memTick(); };


/* ═════════════ ٥) خمّن الرقم ═════════════ */
function guNew(lv){
  const max={e:50,m:200,h:1000}[lv]||200;
  const tries={e:8,m:9,h:12}[lv]||9;
  const st={lv:lv,max:max,n:1+Math.floor(Math.random()*max),left:tries,log:[],done:0,t0:Date.now()};
  lsSet('guess',st); return st;
}
let GU=null;
function apTGuHTML(){
  GU=lsGet('guess',null);
  const nm={e:'سهل (١–٥٠)',m:'متوسط (١–٢٠٠)',h:'صعب (١–١٠٠٠)'};
  const best=gScore('guBest',{});
  if(!GU) return '<div class="apTCard"><h4>اختار المستوى</h4><div class="apTBtns">'
    +Object.keys(nm).map(k=>'<button class="btn aqua" onclick="apTGuNew(\''+k+'\')">'+nm[k]
      +(best[k]?' · أفضل '+best[k]+' محاولات':'')+'</button>').join('')+'</div></div>';
  const done=GU.done;
  return gBar('<span class="apTDay">'+nm[GU.lv]+' · فاضل <b>'+fm(GU.left)+'</b> محاولة</span>'
    +'<button class="btn ghost sm" onclick="apTGuQuit()">🔄 جديدة</button>')
  +(done?'':'<div class="apTCard"><div class="apTBtns">'
    +'<input type="number" id="guIn" placeholder="رقمك" style="flex:2" '
    +'onkeydown="if(event.key===\'Enter\')apTGuTry()">'
    +'<button class="btn aqua" onclick="apTGuTry()">خمّن</button></div></div>')
  +(GU.log.length?'<div class="apTCard">'+GU.log.map(l=>
      '<div class="apTHRow"><span>'+l.h+'</span><b>'+l.v+'</b></div>').join('')+'</div>':'')
  +(done===1?'<p class="apTWin">🎉 صح! الرقم '+GU.n+' فى '+fm(GU.log.length)+' محاولة</p>'
    :done===2?'<p class="apTWin" style="color:var(--red)">خلصت المحاولات — الرقم كان '+GU.n+'</p>':'');
}
window.apTGuNew=function(l){ GU=guNew(l); apTRender(); setTimeout(()=>{const i=$$('#guIn');if(i)i.focus();},60); };
window.apTGuQuit=function(){ lsSet('guess',null); GU=null; apTRender(); };
window.apTGuTry=function(){
  if(!GU||GU.done) return;
  const el=$$('#guIn'); const v=Math.round(n2(el&&el.value));
  if(!v||v<1||v>GU.max){ try{ toast('اكتب رقم بين ١ و'+GU.max,'err'); }catch(e){} return; }
  GU.left=n2(GU.left)-1;
  const h=v===GU.n?'صح 🎯':(v<GU.n?'أعلى ⬆️':'أقل ⬇️');
  GU.log=[{v:v,h:h}].concat(GU.log);
  if(v===GU.n){
    GU.done=1; buzz([40,60,40]);
    const best=gScore('guBest',{}); const t=GU.log.length;
    if(!best[GU.lv]||t<best[GU.lv]){ best[GU.lv]=t; gSave('guBest',best);
      try{ toast('رقم قياسى! '+t+' محاولات','ok'); }catch(e){} }
  } else if(GU.left<=0){ GU.done=2; }
  lsSet('guess',GU); apTRender();
  setTimeout(()=>{const i=$$('#guIn');if(i)i.focus();},60);
};
AP_T_HTML.guess=apTGuHTML;


/* ═════════════ ٦) ترتيب الأرقام (Sliding Puzzle) ═════════════
   التوليد بيتأكد إن اللغز قابل للحل: بنعدّ الانقلابات، وقاعدة الحل
   بتختلف لو عرض الشبكة فردى أو زوجى. */
function slSolvable(a,n){
  const v=a.filter(x=>x), inv=(function(){ let c=0;
    for(let i=0;i<v.length;i++)for(let j=i+1;j<v.length;j++) if(v[i]>v[j]) c++;
    return c; })();
  if(n%2===1) return inv%2===0;
  const row=Math.floor(a.indexOf(0)/n);          /* من فوق، صفر-أساس */
  const fromBottom=n-row;
  return (fromBottom%2===0)?(inv%2===1):(inv%2===0);
}
function slNew(n){
  let a;
  do{ a=sdShuffle(Array.from({length:n*n},(_,i)=>i)); }
  while(!slSolvable(a,n)||a.every((v,i)=>v===(i+1)%(n*n)));
  const st={n:n,a:a,m:0,t:0,done:false}; lsSet('slide',st); return st;
}
let SL=null, SL_T=null;
function slTick(){ clearInterval(SL_T); SL_T=setInterval(function(){
  if(!SL||SL.done) return; SL.t=n2(SL.t)+1;
  const e=$$('#slT'); if(e) e.textContent=mmss(SL.t);
  if(SL.t%10===0) lsSet('slide',SL); },1000); }
function slWin(st){ return st.a.every((v,i)=>v===((i+1)%(st.n*st.n))); }
function apTSlHTML(){
  SL=lsGet('slide',null);
  const best=gScore('slBest',{});
  if(!SL||!SL.a) return '<div class="apTCard"><h4>اختار الحجم</h4><div class="apTBtns">'
    +[3,4].map(n=>'<button class="btn aqua" onclick="apTSlNew('+n+')">'+n+'×'+n
      +(best[n]?' · '+mmss(best[n].t)+' / '+best[n].m+' حركة':'')+'</button>').join('')+'</div>'
    +'<p class="apTNote">اللغز بيتولّد عشوائى، والنظام بيتأكد إنه قابل للحل قبل ما يبدأ.</p></div>';
  const b=best[SL.n];
  return gBar('<span class="apTDay">⏱ <b id="slT">'+mmss(SL.t)+'</b> · حركات <b>'+fm(SL.m)+'</b>'
      +(b?' · أفضل '+mmss(b.t)+'/'+b.m:'')+'</span>'
    +'<button class="btn ghost sm" onclick="apTSlQuit()">🔄 جديدة</button>')
  +'<div class="slG" style="grid-template-columns:repeat('+SL.n+',1fr)">'
    +SL.a.map((v,i)=>v?('<button class="slC" onclick="apTSlMove('+i+')">'+v+'</button>')
      :'<div class="slE"></div>').join('')+'</div>'
  +(SL.done?'<p class="apTWin">🎉 رتّبتها فى '+mmss(SL.t)+' و'+fm(SL.m)+' حركة</p>':'');
}
window.apTSlNew=function(n){ SL=slNew(n); apTRender(); slTick(); };
window.apTSlQuit=function(){ lsSet('slide',null); SL=null; clearInterval(SL_T); apTRender(); };
window.apTSlMove=function(i){
  if(!SL||SL.done) return;
  const n=SL.n, e=SL.a.indexOf(0);
  const ri=Math.floor(i/n), ci=i%n, re=Math.floor(e/n), ce=e%n;
  if(Math.abs(ri-re)+Math.abs(ci-ce)!==1) return;
  SL.a[e]=SL.a[i]; SL.a[i]=0; SL.m=n2(SL.m)+1; buzz(8);
  if(slWin(SL)){
    SL.done=true; clearInterval(SL_T);
    const best=gScore('slBest',{}), cur=best[SL.n];
    if(!cur||SL.t<cur.t){ best[SL.n]={t:SL.t,m:SL.m}; gSave('slBest',best);
      try{ toast('رقم قياسى! '+mmss(SL.t),'ok'); }catch(e){} }
    buzz([40,60,40]);
  }
  lsSet('slide',SL); apTRender();
};
AP_T_HTML.slide=apTSlHTML; AP_T_INIT.slide=function(){ if(SL&&!SL.done) slTick(); };

/* ═════════════ ٨) اختبار معلومات عامة ═════════════
   بنك محلى قابل للتوسّع. كل جولة ٨ أسئلة عشوائية بلا تكرار داخل
   الجولة، والاختيارات بتتخلط كل مرة. */
const QZ_BANK={
  sci:{n:'علوم', q:[
    ['أكبر عضو في جسم الإنسان؟',['الجلد','الكبد','الرئة','المخ'],0],
    ['الغاز الذي تمتصه النباتات في التمثيل الضوئي؟',['ثاني أكسيد الكربون','الأكسجين','النيتروجين','الهيدروجين'],0],
    ['عدد عظام جسم الإنسان البالغ؟',['206','180','250','300'],0],
    ['أسرع شيء في الكون؟',['الضوء','الصوت','الريح','الرصاصة'],0],
    ['الكوكب الأقرب للشمس؟',['عطارد','الزهرة','الأرض','المريخ'],0],
    ['ما العنصر الأكثر وفرة في القشرة الأرضية؟',['الأكسجين','الحديد','السيليكون','الألومنيوم'],0],
    ['درجة غليان الماء عند مستوى سطح البحر؟',['100 °م','90 °م','120 °م','80 °م'],0],
    ['أي فيتامين يُنتجه الجلد بفعل الشمس؟',['د','ج','أ','ب12'],0]
  ]},
  geo:{n:'جغرافيا', q:[
    ['أطول نهر في العالم؟',['النيل','الأمازون','المسيسيبي','اليانجتسي'],0],
    ['عاصمة أستراليا؟',['كانبرا','سيدني','ملبورن','بيرث'],0],
    ['أكبر صحراء حارة في العالم؟',['الصحراء الكبرى','صحراء جوبي','كالاهاري','أتاكاما'],0],
    ['في أي قارة تقع مصر؟',['أفريقيا','آسيا','أوروبا','أمريكا'],0],
    ['أعلى قمة جبلية في العالم؟',['إفرست','كيليمنجارو','مونت بلان','K2'],0],
    ['البحر الذي يفصل مصر عن السعودية؟',['البحر الأحمر','المتوسط','العرب','قزوين'],0],
    ['أكبر دولة في العالم مساحةً؟',['روسيا','كندا','الصين','أمريكا'],0],
    ['محافظة الإسماعيلية تطل على؟',['قناة السويس','البحر المتوسط','النيل مباشرة','خليج العقبة'],0]
  ]},
  his:{n:'تاريخ', q:[
    ['في أي عام افتُتحت قناة السويس؟',['1869','1859','1882','1901'],0],
    ['من بنى الهرم الأكبر؟',['خوفو','خفرع','منقرع','رمسيس'],0],
    ['في أي عام كانت حرب أكتوبر؟',['1973','1967','1956','1948'],0],
    ['عاصمة مصر في العصر الفاطمي؟',['القاهرة','الفسطاط','الإسكندرية','طيبة'],0],
    ['من أول من وضع تقويمًا شمسيًا؟',['المصريون القدماء','الرومان','الإغريق','البابليون'],0],
    ['في أي عام تم تأميم قناة السويس؟',['1956','1952','1967','1973'],0],
    ['حجر رشيد اكتُشف سنة؟',['1799','1822','1750','1850'],0],
    ['من فك رموز اللغة المصرية القديمة؟',['شامبليون','كارتر','ماسبيرو','هيرودوت'],0]
  ]},
  spo:{n:'رياضة', q:[
    ['كم لاعبًا في فريق كرة القدم داخل الملعب؟',['11','10','12','9'],0],
    ['كل كام سنة بيتقام كأس العالم؟',['4','2','3','5'],0],
    ['النادي الأكثر تتويجًا بدوري أبطال أفريقيا؟',['الأهلي','الزمالك','الترجي','الوداد'],0],
    ['عدد أشواط مباراة كرة السلة الرسمية؟',['4','2','3','5'],0],
    ['أول دولة عربية استضافت كأس العالم؟',['قطر','السعودية','الإمارات','المغرب'],0],
    ['كم شوطًا في مباراة التنس للرجال في البطولات الكبرى؟',['حتى 5 مجموعات','3 مجموعات','4 مجموعات','مجموعتان'],0],
    ['المسافة الرسمية لسباق الماراثون؟',['42.195 كم','40 كم','45 كم','21 كم'],0]
  ]},
  gen:{n:'معلومات عامة', q:[
    ['كم عدد ألوان قوس قزح؟',['7','6','5','8'],0],
    ['العملة الرسمية لليابان؟',['الين','اليوان','الوون','الروبية'],0],
    ['كم يومًا في السنة الكبيسة؟',['366','365','364','367'],0],
    ['أكبر محيط في العالم؟',['الهادئ','الأطلنطي','الهندي','المتجمد'],0],
    ['كم عدد حروف اللغة العربية؟',['28','26','30','29'],0],
    ['ما الحيوان الذي يُلقب بسفينة الصحراء؟',['الجمل','الحصان','الفيل','الحمار'],0],
    ['كم ضلعًا في الشكل السداسي؟',['6','5','7','8'],0],
    ['أي معدن سائل في درجة حرارة الغرفة؟',['الزئبق','الحديد','النحاس','الرصاص'],0]
  ]}
};
function qzNew(cat){
  const pool=[];
  Object.keys(QZ_BANK).forEach(k=>{
    if(cat!=='all'&&cat!==k) return;
    QZ_BANK[k].q.forEach((q,i)=>pool.push({k:k,i:i}));
  });
  const pick=sdShuffle(pool).slice(0,8);
  const qs=pick.map(p=>{
    const raw=QZ_BANK[p.k].q[p.i];
    const opts=raw[1].map((t,i)=>({t:t,ok:i===raw[2]}));
    return {cat:QZ_BANK[p.k].n, q:raw[0], o:sdShuffle(opts.slice())};
  });
  const st={cat:cat,qs:qs,i:0,score:0,pick:null,done:false};
  lsSet('quiz',st); return st;
}
let QZ=null;
function apTQzHTML(){
  QZ=lsGet('quiz',null);
  const best=gScore('qzBest',{});
  if(!QZ||!QZ.qs){
    const cats=Object.keys(QZ_BANK);
    return '<div class="apTCard"><h4>اختار التصنيف</h4><div class="apTBtns">'
      +'<button class="btn aqua" onclick="apTQzNew(\'all\')">الكل'+(best.all?' · أفضل '+best.all+'/8':'')+'</button>'
      +cats.map(k=>'<button class="btn ghost" onclick="apTQzNew(\''+k+'\')">'+esc2(QZ_BANK[k].n)
        +(best[k]?' · '+best[k]+'/8':'')+'</button>').join('')+'</div>'
      +'<p class="apTNote">٨ أسئلة عشوائية كل جولة، من غير تكرار داخل الجولة.</p></div>';
  }
  if(QZ.done){
    const pc=Math.round(QZ.score/QZ.qs.length*100);
    return '<div class="apTCard" style="text-align:center">'
      +'<p class="apTWin">'+(pc>=75?'🎉 ':'')+'نتيجتك <b>'+QZ.score+' من '+QZ.qs.length+'</b> ('+pc+'٪)</p>'
      +'<div class="apTBtns"><button class="btn aqua" onclick="apTQzNew(\''+QZ.cat+'\')">🔄 جولة تانية</button>'
      +'<button class="btn ghost" onclick="apTQzQuit()">التصنيفات</button></div></div>';
  }
  const q=QZ.qs[QZ.i];
  return gBar('<span class="apTDay">سؤال <b>'+(QZ.i+1)+'</b> من '+QZ.qs.length
      +' · '+esc2(q.cat)+' · صح <b>'+QZ.score+'</b></span>'
    +'<button class="btn ghost sm" onclick="apTQzQuit()">🔄 جديدة</button>')
  +'<div class="spBar" style="margin-bottom:9px"><i style="width:'+((QZ.i)/QZ.qs.length*100)+'%"></i></div>'
  +'<div class="apTCard"><h4 style="font-size:15px;line-height:1.6">'+esc2(q.q)+'</h4>'
  +q.o.map((o,k)=>{
      let cls='';
      if(QZ.pick!=null){ if(o.ok) cls=' ok'; else if(k===QZ.pick) cls=' no'; }
      return '<button class="qzO'+cls+'" onclick="apTQzPick('+k+')">'+esc2(o.t)+'</button>';
    }).join('')
  +(QZ.pick!=null?'<div class="apTBtns"><button class="btn aqua" style="width:100%" onclick="apTQzNext()">'
    +(QZ.i+1>=QZ.qs.length?'النتيجة':'السؤال اللى بعده ←')+'</button></div>':'')
  +'</div>';
}
window.apTQzNew=function(c){ QZ=qzNew(c); apTRender(); };
window.apTQzQuit=function(){ lsSet('quiz',null); QZ=null; apTRender(); };
window.apTQzPick=function(k){
  if(!QZ||QZ.pick!=null||QZ.done) return;
  QZ.pick=k;
  if(QZ.qs[QZ.i].o[k].ok){ QZ.score++; buzz(10); } else buzz([25,30,25]);
  lsSet('quiz',QZ); apTRender();
};
window.apTQzNext=function(){
  if(!QZ) return;
  QZ.i++; QZ.pick=null;
  if(QZ.i>=QZ.qs.length){
    QZ.done=true;
    const b=gScore('qzBest',{});
    if(!b[QZ.cat]||QZ.score>b[QZ.cat]){ b[QZ.cat]=QZ.score; gSave('qzBest',b); }
  }
  lsSet('quiz',QZ); apTRender();
};
AP_T_HTML.quiz=apTQzHTML;

/* نافذة فحص داخلية — للاختبار والتشخيص، مالهاش أى دور فى التشغيل */

/* ═════════════ ٦) كلمات متقاطعة ═════════════
   التوليد تلقائى: بنبدأ بأطول كلمة فى النص، وبعدين كل كلمة جديدة
   بندوّر لها على حرف مشترك مع كلمة متحطة قبلها ونحطها عمودى على
   اتجاهها. وبنرفض أى وضع بيخلّى حرفين جنب بعض من غير ما يكوّنوا
   كلمة حقيقية — فمفيش تقاطعات عشوائية ولا حروف سايبة.
   ===================================================================== */
const CW_BANK=[
  ["وحدة","الشقة فى لغة التعاقد"],
  ["قسط","جزء من الثمن يُسدَّد فى موعده"],
  ["عقد","ورقة تربط طرفين باتفاق"],
  ["مقدم","أول ما يدفعه المشترى"],
  ["تشطيب","آخر مراحل البناء قبل التسليم"],
  ["بورسلين","بلاط فاخر للأرضيات"],
  ["دهان","يُكسى به الحائط لونا"],
  ["مصعد","يصعد بك ولا يتعب"],
  ["عمارة","مبنى من عدة أدوار"],
  ["سلم","درجات توصلك لفوق"],
  ["حديقة","قطعة أرض فيها زرع وورد"],
  ["بوابة","منها تدخل الكمبوند"],
  ["ايصال","ورقة تثبت أنك دفعت"],
  ["فاتورة","بيان بالمستحق"],
  ["خصم","تنزيل فى السعر يفرح المشترى"],
  ["غرامة","جزاء مالى على التأخير"],
  ["سمسار","وسيط بين البائع والمشترى"],
  ["شريك","يقاسمك الربح والخسارة"],
  ["ضمان","تعهد بالإصلاح بعد البيع"],
  ["تسليم","تسلم المفتاح لصاحبه"],
  ["رخصة","إذن رسمى بالبناء"],
  ["مخطط","رسم هندسى للوحدة"],
  ["مساحة","تقاس بالمتر المربع"],
  ["سعر","ما تدفعه مقابل السلعة"],
  ["قناة","السويس أشهرها فى مصر"],
  ["اسماعيلية","محافظة على ضفاف القناة"],
  ["تمساح","بحيرة شهيرة بالإسماعيلية"],
  ["نخيل","شجر الإسماعيلية والواحات"],
  ["شاطئ","حيث يلتقى البر بالماء"],
  ["مرسى","ترسو فيه السفن"],
  ["كتاب","خير جليس فى الزمان"],
  ["قلم","به تكتب ولا يتكلم"],
  ["بحر","واسع مالح لا ينضب"],
  ["نهر","يجرى عذبا بين الضفاف"],
  ["جبل","شامخ لا تهزه الريح"],
  ["شمس","تشرق فتبدد الظلام"],
  ["قمر","يضىء الليل بنور مستعار"],
  ["نجم","يلمع فى السماء ليلا"],
  ["سحاب","يحمل المطر فى السماء"],
  ["مطر","غيث ينزل من السماء"],
  ["ريح","تهب ولا ترى"],
  ["ثلج","ماء تجمد وتساقط أبيض"],
  ["نار","تحرق وتدفئ"],
  ["تراب","منه خلقنا وإليه نعود"],
  ["ذهب","أصفر نفيس يزين"],
  ["فضة","أبيض نفيس أقل من الذهب"],
  ["حديد","معدن صلب للبناء"],
  ["نحاس","معدن أحمر للأسلاك"],
  ["زجاج","شفاف يكسر بسهولة"],
  ["خشب","من الشجر وللأثاث"],
  ["باب","منه تدخل وتخرج"],
  ["نافذة","منها يدخل الهواء"],
  ["سقف","أعلى الغرفة"],
  ["جدار","حائط يفصل الغرف"],
  ["مفتاح","يفتح القفل"],
  ["قفل","يحفظ ما وراءه"],
  ["كرسى","تجلس عليه"],
  ["مكتب","عليه تكتب وتعمل"],
  ["ساعة","تدلك على الوقت"],
  ["مرآة","ترى فيها نفسك"],
  ["طبيب","يداوى المرضى"],
  ["مهندس","يصمم ويبنى"],
  ["معلم","يعلم الناس الخير"],
  ["تاجر","يبيع ويشترى"],
  ["فلاح","يزرع الأرض"],
  ["نجار","يصنع من الخشب"],
  ["حداد","يطرق الحديد"],
  ["خباز","يصنع الخبز"],
  ["اسد","ملك الغابة"],
  ["نمر","مفترس مخطط"],
  ["فيل","أضخم حيوان برى"],
  ["جمل","سفينة الصحراء"],
  ["حصان","يركب ويسابق"],
  ["غزال","رشيق سريع العدو"],
  ["صقر","جارح حاد البصر"],
  ["حمام","طائر السلام"],
  ["نحل","يصنع العسل"],
  ["نمل","مثل فى الجد والنظام"],
  ["سمك","يعيش فى الماء"],
  ["دلفين","ذكى ودود فى البحر"],
  ["تفاح","فاكهة حمراء أو خضراء"],
  ["عنب","عناقيد حلوة"],
  ["موز","أصفر طويل"],
  ["بطيخ","أحمر من الداخل فى الصيف"],
  ["تمر","ثمر النخيل"],
  ["زيتون","منه الزيت المبارك"],
  ["قمح","منه الخبز"],
  ["ارز","حبوب بيضاء تطهى"],
  ["عسل","فيه شفاء للناس"],
  ["لبن","أبيض من الأبقار"],
  ["خبز","أساس المائدة"],
  ["ملح","يعطى الطعام طعما"],
  ["شاى","مشروب ساخن شهير"],
  ["قهوة","مشروب الصباح المر"],
  ["عصير","شراب من الفاكهة"],
  ["ماء","لا حياة بدونه"],
  ["مصر","أم الدنيا"],
  ["نيل","أطول أنهار العالم"],
  ["قاهرة","عاصمة مصر"],
  ["اسكندرية","عروس البحر المتوسط"],
  ["اقصر","مدينة المعابد والآثار"],
  ["اسوان","أقصى جنوب مصر"],
  ["هرم","بناء فرعونى عظيم"],
  ["مسلة","عمود حجرى فرعونى"],
  ["معبد","بيت للعبادة قديما"],
  ["متحف","تحفظ فيه الآثار"],
  ["طريق","تسير فيه السيارات"],
  ["جسر","يعبر فوق النهر"],
  ["نفق","طريق تحت الأرض"],
  ["ميناء","ترسو فيه البواخر"],
  ["مطار","منه تقلع الطائرات"],
  ["قطار","يسير على قضبان"],
  ["سيارة","وسيلة نقل بأربع عجلات"],
  ["دراجة","بعجلتين وبدواسة"],
  ["سفينة","تمخر عباب البحر"],
  ["طائرة","تحلق فى السماء"],
  ["مدرسة","بيت العلم الأول"],
  ["جامعة","أعلى مراحل التعليم"],
  ["مكتبة","فيها الكتب تصف"],
  ["قاموس","يشرح معانى الكلمات"],
  ["لغة","بها نتفاهم"],
  ["حرف","أصغر وحدة فى الكتابة"],
  ["شعر","كلام موزون مقفى"],
  ["قصة","حكاية لها أحداث"],
  ["لوحة","رسم فى إطار"],
  ["نغم","صوت موسيقى عذب"],
  ["عدل","أساس الملك"],
  ["صدق","ينجى وهو ضد الكذب"],
  ["صبر","مفتاح الفرج"],
  ["كرم","خلق العرب الأصيل"],
  ["امانة","ضد الخيانة"],
  ["وفاء","حفظ العهد"],
  ["شكر","رد الجميل بالكلمة"],
  ["رحمة","لين القلب على الضعيف"],
  ["سلام","ضد الحرب"],
  ["فرح","ضد الحزن"],
  ["نور","يبدد الظلمة"],
  ["طفل","صغير يلهو ويلعب"],
  ["شباب","أقوى مراحل العمر"],
  ["جار","أقرب الناس بابا"],
  ["صديق","يسندك وقت الضيق"],
  ["عائلة","أصغر وحدة فى المجتمع"],
  ["بيت","مأوى الأسرة"],
  ["سوق","يباع فيه ويشترى"],
  ["بنك","يحفظ الأموال"],
  ["نقود","بها تشترى"],
  ["ربح","زيادة على رأس المال"],
  ["ميزان","يزن ويعدل"],
  ["مسطرة","بها تقيس وترسم المستقيم"],
  ["رمل","حبيبات الشاطئ"],
  ["صخر","حجر ضخم صلب"],
  ["كهف","تجويف فى الجبل"],
  ["واحة","خضرة وسط الصحراء"],
  ["صحراء","أرض واسعة بلا ماء"],
  ["غابة","أشجار كثيفة متشابكة"],
  ["وردة","أجمل الزهور"],
  ["ياسمين","زهر أبيض عطر"],
  ["ورق","عليه تكتب"],
  ["حبر","به يكتب القلم"]
];

function cwFits(G,N,w,r,c,dir){
  const dr=dir?1:0, dc=dir?0:1;
  const er=r+dr*(w.length-1), ec=c+dc*(w.length-1);
  if(r<0||c<0||er>=N||ec>=N) return -1;
  /* الخانة اللى قبل الكلمة واللى بعدها لازم تكون فاضية */
  const br=r-dr, bc=c-dc, ar=er+dr, ac=ec+dc;
  if(br>=0&&bc>=0&&G[br*N+bc]) return -1;
  if(ar<N&&ac<N&&G[ar*N+ac]) return -1;
  let cross=0;
  for(let i=0;i<w.length;i++){
    const rr=r+dr*i, cc=c+dc*i, cur=G[rr*N+cc];
    if(cur){ if(cur!==w[i]) return -1; cross++; continue; }
    /* خانة فاضية: الجارين العموديين لازم يكونوا فاضيين كمان */
    const p1r=rr+dc, p1c=cc+dr, p2r=rr-dc, p2c=cc-dr;
    if(p1r>=0&&p1r<N&&p1c>=0&&p1c<N&&G[p1r*N+p1c]) return -1;
    if(p2r>=0&&p2r<N&&p2c>=0&&p2c<N&&G[p2r*N+p2c]) return -1;
  }
  return cross;
}
function cwBuild(N,want){
  const pool=sdShuffle(CW_BANK.slice()).filter(x=>x[0].length<=N);
  const G=new Array(N*N).fill('');
  const put=[];
  const first=pool.find(x=>x[0].length>=Math.min(6,N-2))||pool[0];
  if(!first) return null;
  const fr=Math.floor(N/2), fc=Math.max(0,Math.floor((N-first[0].length)/2));
  for(let i=0;i<first[0].length;i++) G[fr*N+fc+i]=first[0][i];
  put.push({w:first[0],cl:first[1],r:fr,c:fc,d:0});
  const used={}; used[first[0]]=1;
  for(let pass=0;pass<3&&put.length<want;pass++){
    for(let k=0;k<pool.length&&put.length<want;k++){
      const [w,cl]=pool[k];
      if(used[w]) continue;
      let best=null;
      for(let pi=0;pi<put.length;pi++){
        const P=put[pi], nd=P.d?0:1;
        for(let a=0;a<P.w.length;a++){
          for(let b=0;b<w.length;b++){
            if(P.w[a]!==w[b]) continue;
            const hr=P.r+(P.d?a:0), hc=P.c+(P.d?0:a);
            const r=nd?hr-b:hr, c=nd?hc:hc-b;
            const cr=cwFits(G,N,w,r,c,nd);
            if(cr>0&&(!best||cr>best.cr)) best={r:r,c:c,d:nd,cr:cr};
          }
        }
      }
      if(best){
        const dr=best.d?1:0, dc=best.d?0:1;
        for(let i=0;i<w.length;i++) G[(best.r+dr*i)*N+best.c+dc*i]=w[i];
        put.push({w:w,cl:cl,r:best.r,c:best.c,d:best.d});
        used[w]=1;
      }
    }
  }
  return put.length>=5?{G:G,put:put,N:N}:null;
}
function cwNumber(st){
  const N=st.N, G=st.G, num=new Array(N*N).fill(0);
  let n=0;
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const i=r*N+c; if(!G[i]) continue;
    const startA=(c===0||!G[i-1])&&(c+1<N&&G[i+1]);
    const startD=(r===0||!G[i-N])&&(r+1<N&&G[i+N]);
    if(startA||startD) num[i]=++n;
  }
  st.num=num;
  st.put.forEach(p=>{ p.n=num[p.r*N+p.c]||0; });
  st.put.sort((a,b)=>a.n-b.n);
}
function cwNew(level){
  const N={e:9,m:11,h:13}[level]||11;
  const want={e:7,m:11,h:15}[level]||11;
  let st=null;
  for(let t=0;t<14&&!st;t++) st=cwBuild(N,want);
  if(!st) return null;
  cwNumber(st);
  st.level=level; st.cur=st.G.map(ch=>ch?'':''); st.sel=-1; st.dir=0;
  st.t=0; st.hints=0; st.done=false;
  lsSet('cw',st); return st;
}
let CW=null, CW_T=null;
function cwTick(){ clearInterval(CW_T); CW_T=setInterval(function(){
  if(!CW||CW.done) return; CW.t=n2(CW.t)+1;
  const e=$$('#cwT'); if(e) e.textContent=mmss(CW.t);
  if(CW.t%10===0) lsSet('cw',CW); },1000); }
const CW_LTR='ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');
function cwWordAt(i,dir){
  if(!CW) return null;
  return CW.put.find(p=>{
    if(p.d!==dir) return false;
    const dr=p.d?1:0, dc=p.d?0:1;
    for(let k=0;k<p.w.length;k++) if((p.r+dr*k)*CW.N+p.c+dc*k===i) return true;
    return false;
  })||null;
}
function apTCwHTML(){
  CW=lsGet('cw',null);
  const best=gScore('cwBest',{});
  const nm={e:'سهل',m:'متوسط',h:'صعب'};
  if(!CW||!CW.G) return '<div class="apTCard"><h4>اختار المستوى</h4><div class="apTBtns">'
    +Object.keys(nm).map(k=>'<button class="btn '+(k==='e'?'green':(k==='m'?'aqua':'red'))
      +'" onclick="apTCwNew(\'' +k+ '\')">'+nm[k]+(best[k]?' · '+mmss(best[k]):'')+'</button>').join('')
    +'</div><p class="apTNote">كل شبكة بتتركّب من الأول من بنك كلمات عربى — فيه كلمات عامة '
    +'وكلمات من شغلنا: وحدة وقسط وتشطيب وقناة والإسماعيلية.</p></div>';
  const N=CW.N, sel=CW.sel;
  const selW=sel>=0?cwWordAt(sel,CW.dir):null;
  let cells='';
  for(let i=0;i<N*N;i++){
    if(!CW.G[i]){ cells+='<div class="cwB"></div>'; continue; }
    const inW=selW&&(function(){ const dr=selW.d?1:0,dc=selW.d?0:1;
      for(let k=0;k<selW.w.length;k++) if((selW.r+dr*k)*N+selW.c+dc*k===i) return true; return false; })();
    const v=CW.cur[i]||'';
    const bad=v&&v!==CW.G[i];
    cells+='<div class="cwC'+(i===sel?' sel':'')+(inW&&i!==sel?' hi':'')+(bad?' bad':'')
      +'" onclick="apTCwSel('+i+')">'+(CW.num[i]?'<u>'+CW.num[i]+'</u>':'')+(v||'')+'</div>';
  }
  const list=d=>CW.put.filter(p=>p.d===d).map(p=>{
    const dr=p.d?1:0, dc=p.d?0:1;
    let ok=true;
    for(let k=0;k<p.w.length;k++){ const ii=(p.r+dr*k)*N+p.c+dc*k; if(CW.cur[ii]!==CW.G[ii]) ok=false; }
    const on=selW&&selW.n===p.n&&selW.d===p.d;
    return '<div class="cwQ'+(ok?' ok':'')+(on?' on':'')+'" onclick="apTCwGo('+p.n+','+p.d+')">'
      +'<b>'+p.n+'</b> '+esc2(p.cl)+' <i>('+p.w.length+')</i></div>';
  }).join('')||'<p class="apTNote">—</p>';
  const left=CW.G.reduce((a,ch,i)=>a+((ch&&CW.cur[i]!==ch)?1:0),0);
  return gBar('<span class="apTDay">⏱ <b id="cwT">'+mmss(CW.t)+'</b> · '+nm[CW.level]
      +' · '+CW.put.length+' كلمة · فاضل '+left+'</span>'
    +'<button class="btn ghost sm" onclick="apTCwQuit()">🔄 جديدة</button>')
  +'<div class="cwG" style="grid-template-columns:repeat('+N+',1fr)">'+cells+'</div>'
  +'<div class="cwKeys">'+CW_LTR.map(ch=>'<button class="cwK" onclick="apTCwPut(\''+ch+'\')">'+ch+'</button>').join('')
    +'<button class="cwK fn" onclick="apTCwPut(\'\')">⌫</button></div>'
  +gBar('<button class="btn ghost sm" onclick="apTCwFlip()">🔁 '+(CW.dir?'رأسى':'أفقى')+'</button>'
    +'<button class="btn ghost sm" onclick="apTCwHint()">💡 حرف ('+(5-n2(CW.hints))+')</button>'
    +'<button class="btn green sm" onclick="apTCwCheck()">✔️ تحقّق</button>')
  +'<div class="apTCard"><h4>↔️ أفقى</h4>'+list(0)+'</div>'
  +'<div class="apTCard"><h4>↕️ رأسى</h4>'+list(1)+'</div>'
  +(CW.done?'<p class="apTWin">🎉 حللتها فى '+mmss(CW.t)+'</p>':'');
}
window.apTCwNew=function(l){
  const st=cwNew(l);
  if(!st){ try{ toast('مش قادر يركّب شبكة — جرّب تانى','err'); }catch(e){} return; }
  CW=st; apTRender(); cwTick();
};
window.apTCwQuit=function(){
  const go=function(){ lsSet('cw',null); CW=null; clearInterval(CW_T); apTRender(); };
  try{ confirmBox('🔄 شبكة جديدة','<p>هتسيب الشبكة الحالية.</p>','ابدأ من الأول',go); }catch(e){ go(); }
};
window.apTCwSel=function(i){
  if(!CW||CW.done||!CW.G[i]) return;
  if(CW.sel===i){ const o=cwWordAt(i,CW.dir?0:1); if(o) CW.dir=CW.dir?0:1; }
  else { CW.sel=i; if(!cwWordAt(i,CW.dir)) CW.dir=CW.dir?0:1; }
  lsSet('cw',CW); apTRender();
};
window.apTCwFlip=function(){ if(!CW) return; CW.dir=CW.dir?0:1; lsSet('cw',CW); apTRender(); };
window.apTCwGo=function(n,d){
  if(!CW) return;
  const p=CW.put.find(x=>x.n===n&&x.d===d); if(!p) return;
  CW.dir=d; CW.sel=p.r*CW.N+p.c; lsSet('cw',CW); apTRender();
};
function cwAdvance(){
  const w=cwWordAt(CW.sel,CW.dir); if(!w) return;
  const dr=w.d?1:0, dc=w.d?0:1;
  const idx=[]; for(let k=0;k<w.w.length;k++) idx.push((w.r+dr*k)*CW.N+w.c+dc*k);
  const at=idx.indexOf(CW.sel);
  for(let k=at+1;k<idx.length;k++) if(!CW.cur[idx[k]]){ CW.sel=idx[k]; return; }
  if(at+1<idx.length) CW.sel=idx[at+1];
}
window.apTCwPut=function(ch){
  if(!CW||CW.done||CW.sel<0) return;
  if(ch===''){ CW.cur[CW.sel]=''; }
  else { CW.cur[CW.sel]=ch; cwAdvance(); }
  buzz(8); cwDone(); lsSet('cw',CW); apTRender();
};
function cwDone(){
  if(CW.G.some((ch,i)=>ch&&CW.cur[i]!==ch)) return;
  CW.done=true; clearInterval(CW_T);
  const b=gScore('cwBest',{});
  if(!b[CW.level]||CW.t<b[CW.level]){ b[CW.level]=CW.t; gSave('cwBest',b);
    try{ toast('رقم قياسى! '+mmss(CW.t),'ok'); }catch(e){} }
  else { try{ toast('برافو — حللتها فى '+mmss(CW.t),'ok'); }catch(e){} }
  buzz([40,60,40]);
}
window.apTCwHint=function(){
  if(!CW||CW.done) return;
  if(n2(CW.hints)>=5){ try{ toast('خلصت التلميحات','err'); }catch(e){} return; }
  let pick=-1;
  if(CW.sel>=0&&CW.cur[CW.sel]!==CW.G[CW.sel]) pick=CW.sel;
  else { const left=[]; CW.G.forEach((ch,i)=>{ if(ch&&CW.cur[i]!==ch) left.push(i); });
    if(!left.length) return; pick=left[Math.floor(Math.random()*left.length)]; }
  CW.cur[pick]=CW.G[pick]; CW.hints=n2(CW.hints)+1; CW.sel=pick;
  cwDone(); lsSet('cw',CW); apTRender();
};
window.apTCwCheck=function(){
  if(!CW) return;
  let wrong=0,left=0;
  CW.G.forEach((ch,i)=>{ if(!ch) return;
    if(!CW.cur[i]) left++; else if(CW.cur[i]!==ch) wrong++; });
  try{ toast(wrong?(wrong+' حرف غلط'):(left?('كله سليم — فاضل '+left+' حرف'):'تمام ✔'), wrong?'err':'ok'); }catch(e){}
};
AP_T_HTML.cw=apTCwHTML; AP_T_INIT.cw=function(){ if(CW&&!CW.done) cwTick(); };

window.AP_TDBG={sdMake:sdMake,sdCount:sdCount,sdOk:sdOk,xoMinimax:xoMinimax,xoWin:xoWin,
  slNew:slNew,slSolvable:slSolvable,qzNew:qzNew,cwNew:cwNew,cwBuild:cwBuild,cwFits:cwFits,CW_BANK:CW_BANK,
  memNew:memNew,guNew:guNew,lsGet:lsGet,lsSet:lsSet,gScore:gScore,
  get SD(){return SD;}, get MM(){return MM;}, get SL(){return SL;},
  get QZ(){return QZ;}, get CW(){return CW;}, get GU(){return GU;}, get XO(){return XO;}};

window.AP_TOOLS_READY=true;
try{ apTRender(); }catch(e){}
})();
