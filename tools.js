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
const TOOLS=[
  {id:'quote', ic:'🧮', name:'حاسبة عرض السعر', sub:'قسط شهرى وجدول مبدئى قدام العميل'},
  {id:'calc',  ic:'🔢', name:'الآلة الحاسبة',   sub:'بالنِسب والسجل'},
  {id:'tasbih',ic:'📿', name:'المسبحة',          sub:'عدّاد بيتحفظ لوحده'}
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
    b.innerHTML='<div class="apTList">'+apTList().map(t=>
      '<button class="apTItem" onclick="apToolsGo(\''+t.id+'\')">'
      +'<span class="apTIc">'+t.ic+'</span>'
      +'<span class="apTTx"><b>'+esc2(t.name)+'</b><i>'+esc2(t.sub)+'</i></span>'
      +'<span class="apTAr">‹</span></button>').join('')
      +'</div>'
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
  b.innerHTML=({quote:apTQuoteHTML,calc:apTCalcHTML,tasbih:apTTasbihHTML}[t.id])();
  const after={quote:apTQuoteAfter,calc:apTCalcAfter,tasbih:apTTasbihAfter}[t.id];
  if(after) try{ after(); }catch(e){ console.warn('tool init',e); }
}
window.apTRender=apTRender;
window.apTSoundSet=apTSoundSet;
window.apToolsBack=function(){ apTPage=''; apTRender(); };

/* =====================================================================
   ١) حاسبة عرض السعر — الأداة اللى هتتفتح قدام عميل
   بتبدأ من نِسب النظام الحقيقية (وديعة الاستلام ودفعة الحجز) وبتولّد
   جدول مبدئى بنفس منطق جداول النظام، من غير ما تلمس أى بيانات.
   ===================================================================== */
function apTQuoteDefaults(){
  const d=lsGet('quote',null);
  if(d) return d;
  let dep=7.5, res=5;
  try{ const s=S(); dep=(s.depositPct!=null?s.depositPct:7.5); res=(s.reservePct!=null?s.reservePct:5); }catch(e){}
  return {area:140,ppm:24000,price:0,downPct:25,months:48,every:1,depPct:dep,resPct:res,big:0,bigEvery:12};
}
function apTQuoteHTML(){
  const q=apTQuoteDefaults();
  const f=(lb,id,val,step,hint)=>'<div class="form-row"><label>'+lb+'</label>'
    +'<input type="number" id="'+id+'" value="'+val+'" step="'+(step||1)+'" oninput="apTQuoteCalc()">'
    +(hint?'<span class="gray-note">'+hint+'</span>':'')+'</div>';
  return '<div class="apTCard">'
    +'<div class="grid g2">'
      +f('📐 المساحة (م²)','tqArea',q.area,1)
      +f('🏷️ سعر المتر','tqPpm',q.ppm,100,'سيب السعر فاضى لو هتكتب الإجمالى بنفسك')
    +'</div>'
    +f('💵 إجمالى سعر الوحدة','tqPrice',q.price||Math.round(q.area*q.ppm),1000,'لو غيّرته هيتحسب منه على طول')
    +'<div class="grid g2">'
      +f('💰 المقدم ٪','tqDownPct',q.downPct,0.5)
      +f('📅 عدد الشهور','tqMonths',q.months,1)
    +'</div>'
    +'<div class="grid g2">'
      +'<div class="form-row"><label>🔁 القسط كل</label>'
      +'<select id="tqEvery" onchange="apTQuoteCalc()">'
        +[1,2,3,6,12].map(v=>'<option value="'+v+'"'+(q.every==v?' selected':'')+'>'
          +(v===1?'شهر':v===12?'سنة':v+' شهور')+'</option>').join('')
      +'</select></div>'
      +f('🏦 وديعة الاستلام ٪','tqDepPct',q.depPct,0.5)
    +'</div>'
    +'<div class="grid g2">'
      +f('🎯 دفعة سنوية (اختيارى)','tqBig',q.big,1000,'مبلغ إضافى كل سنة — صفر = مفيش')
      +f('🧾 دفعة الحجز ٪','tqResPct',q.resPct,0.5)
    +'</div>'
  +'</div>'
  +'<div id="tqOut"></div>'
  +'<div class="apTBtns">'
    +'<button class="btn aqua" onclick="apTQuoteSave()">💾 احفظ الأرقام دى</button>'
    +'<button class="btn ghost" onclick="apTQuoteCopy()">📋 نسخ الملخص</button>'
    +'<button class="btn green" onclick="apTQuotePrint()">🖨️ طباعة / PDF</button>'
  +'</div>'
  +'<p class="apTNote">أرقام استرشادية للتفاوض — مش عرض سعر ولا تعاقد مُلزم، '
  +'ومابتتسجّلش فى النظام ولا بتأثر على أى وحدة أو عميل.</p>';
}
let apTQ=null;
function apTQuoteRead(){
  const g=id=>n2(($$('#'+id)||{}).value);
  const area=g('tqArea'), ppm=g('tqPpm');
  let price=g('tqPrice');
  if(!price&&area&&ppm) price=area*ppm;
  const months=Math.max(0,Math.round(g('tqMonths')));
  const every=Math.max(1,Math.round(n2(($$('#tqEvery')||{}).value)||1));
  const downPct=g('tqDownPct'), depPct=g('tqDepPct'), resPct=g('tqResPct'), big=g('tqBig');
  const down=Math.round(price*downPct/100);
  const dep =Math.round(price*depPct/100);
  const res =Math.round(price*resPct/100);
  const count=months>0?Math.floor(months/every):0;
  const years=months>0?Math.floor(months/12):0;
  const bigTot=big>0?big*years:0;
  const rest=Math.max(0,price-down-bigTot);
  const inst=count>0?Math.round(rest/count):0;
  return {area,ppm,price,downPct,down,depPct,dep,resPct,res,months,every,count,inst,
          big,years,bigTot,rest,total:down+inst*count+bigTot};
}
window.apTQuoteCalc=function(){
  const q=apTQuoteRead(); apTQ=q;
  const o=$$('#tqOut'); if(!o) return;
  if(!q.price){ o.innerHTML='<p class="apTNote">اكتب سعر الوحدة أو المساحة وسعر المتر.</p>'; return; }
  const tile=(ic,lb,v,c)=>'<div class="apTTile"><span>'+ic+'</span><div><i>'+lb+'</i><b'
    +(c?' style="color:'+c+'"':'')+'>'+v+'</b></div></div>';
  let rows='';
  if(q.count>0){
    const lbl=q.every===1?'شهرى':q.every===12?'سنوى':'كل '+q.every+' شهور';
    rows='<div class="tbl-wrap"><table class="tbl"><thead><tr><th>البند</th><th>العدد</th><th>القيمة</th><th>الإجمالى</th></tr></thead><tbody>'
      +'<tr><td>المقدم</td><td>1</td><td>'+fmm(q.down)+'</td><td>'+fmm(q.down)+'</td></tr>'
      +'<tr><td>قسط '+lbl+'</td><td>'+fm(q.count)+'</td><td><b>'+fmm(q.inst)+'</b></td><td>'+fmm(q.inst*q.count)+'</td></tr>'
      +(q.bigTot?'<tr><td>دفعة سنوية</td><td>'+fm(q.years)+'</td><td>'+fmm(q.big)+'</td><td>'+fmm(q.bigTot)+'</td></tr>':'')
      +'</tbody><tfoot><tr><th colspan="3">إجمالى المحصَّل</th><th>'+fmm(q.total)+'</th></tr></tfoot></table></div>';
  }
  const diff=Math.round(q.total-q.price);
  o.innerHTML='<div class="apTTiles">'
    +tile('💵','سعر الوحدة',fmm(q.price))
    +tile('💰','المقدم ('+q.downPct+'٪)',fmm(q.down))
    +tile('📅','القسط',q.count?fmm(q.inst):'—','var(--aqua)')
    +tile('🏦','وديعة الاستلام ('+q.depPct+'٪)',fmm(q.dep))
    +tile('🧾','دفعة الحجز ('+q.resPct+'٪)',fmm(q.res))
    +tile(Math.abs(diff)>2?'⚠️':'✔️','فرق التقريب',fmm(diff),Math.abs(diff)>2?'var(--amber)':'var(--green)')
    +'</div>'+rows
    +'<p class="gray-note" style="margin-top:6px">وديعة الاستلام ودفعة الحجز <b>خارج</b> ثمن الوحدة — زى ما النظام بيحسبها بالظبط.</p>';
};
function apTQuoteAfter(){ apTQuoteCalc(); }
window.apTQuoteSave=function(){
  const g=id=>n2(($$('#'+id)||{}).value);
  lsSet('quote',{area:g('tqArea'),ppm:g('tqPpm'),price:g('tqPrice'),downPct:g('tqDownPct'),
    months:g('tqMonths'),every:n2(($$('#tqEvery')||{}).value)||1,depPct:g('tqDepPct'),
    resPct:g('tqResPct'),big:g('tqBig'),bigEvery:12});
  try{ toast('الأرقام اتحفظت على الجهاز ده ✔','ok'); }catch(e){}
};
function apTQuoteText(){
  const q=apTQ||apTQuoteRead(); if(!q.price) return '';
  const lbl=q.every===1?'شهرى':q.every===12?'سنوى':'كل '+q.every+' شهور';
  const L=['عرض استرشادى — Aqua Pearl City'];
  if(q.area) L.push('المساحة: '+fm(q.area)+' م²'+(q.ppm?' · سعر المتر '+fmm(q.ppm):''));
  L.push('سعر الوحدة: '+fmm(q.price));
  L.push('المقدم ('+q.downPct+'٪): '+fmm(q.down));
  if(q.count) L.push('قسط '+lbl+': '+fmm(q.inst)+' × '+fm(q.count));
  if(q.bigTot) L.push('دفعة سنوية: '+fmm(q.big)+' × '+fm(q.years));
  L.push('وديعة الاستلام ('+q.depPct+'٪): '+fmm(q.dep));
  L.push('دفعة الحجز ('+q.resPct+'٪): '+fmm(q.res));
  L.push('— أرقام استرشادية للتفاوض، ليست عرض سعر ولا تعاقدًا ملزمًا.');
  return L.join('\n');
}
window.apTQuoteCopy=function(){
  const t=apTQuoteText(); if(!t) return;
  try{ navigator.clipboard.writeText(t).then(function(){ toast('اتنسخ ✔','ok'); }); }
  catch(e){ try{ toast('مش قادر ينسخ','err'); }catch(_){} }
};
window.apTQuotePrint=function(){
  const q=apTQ||apTQuoteRead(); if(!q.price) return;
  const w=window.open('','_blank'); if(!w){ try{ toast('المتصفح منع النافذة','err'); }catch(e){} return; }
  const lbl=q.every===1?'شهرى':q.every===12?'سنوى':'كل '+q.every+' شهور';
  const r=(a,b)=>'<tr><td>'+a+'</td><td style="text-align:left;font-weight:700">'+b+'</td></tr>';
  w.document.write('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">'
    +'<title>عرض استرشادى — Aqua Pearl City</title><style>'
    +'body{font-family:Tahoma,Arial,sans-serif;direction:rtl;padding:26px;color:#15293b}'
    +'h1{color:#0b2a4a;font-size:20px;margin:0 0 2px}h2{color:#1195b2;font-size:14px;margin:0 0 18px;font-weight:600}'
    +'table{width:100%;border-collapse:collapse;margin-bottom:14px}'
    +'td,th{border:1px solid #dbe6ee;padding:7px 9px;font-size:13px}'
    +'thead th{background:#0b2a4a;color:#fff}'
    +'.nt{font-size:11.5px;color:#5b7186;border-top:1px dashed #dbe6ee;padding-top:9px;margin-top:6px}'
    +'</style></head><body>'
    +'<h1>Aqua Pearl City</h1><h2>عرض استرشادى — '+(new Date()).toLocaleDateString('ar-EG')+'</h2>'
    +'<table>'
    +(q.area?r('المساحة',fm(q.area)+' م²'):'')
    +(q.ppm?r('سعر المتر',fmm(q.ppm)):'')
    +r('سعر الوحدة',fmm(q.price))
    +r('المقدم ('+q.downPct+'٪)',fmm(q.down))
    +(q.count?r('قسط '+lbl,fmm(q.inst)+' × '+fm(q.count)):'')
    +(q.bigTot?r('دفعة سنوية',fmm(q.big)+' × '+fm(q.years)):'')
    +r('وديعة الاستلام ('+q.depPct+'٪)',fmm(q.dep))
    +r('دفعة الحجز ('+q.resPct+'٪)',fmm(q.res))
    +'</table>'
    +'<p class="nt">هذه أرقام استرشادية لغرض التفاوض فقط، ولا تُعد عرض سعر ولا إيجابًا ولا تعاقدًا مُلزمًا '
    +'للشركة، وتخضع للمراجعة والاعتماد قبل التعاقد.</p>'
    +'</body></html>');
  w.document.close(); setTimeout(function(){ try{ w.print(); }catch(e){} },350);
};

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

window.AP_TOOLS_READY=true;
try{ apTRender(); }catch(e){}
})();
