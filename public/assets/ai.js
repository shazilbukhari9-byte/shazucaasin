(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function icons(r){if(window.ic)window.ic(r||document)}

/* generic tabs: [data-tabs] > [data-tab] buttons, panels [data-panel] */
$$("[data-tabs]").forEach(function(box){
  var btns=$$("[data-tab]",box),panels=$$("[data-panel]",box);
  function go(i,focus){btns.forEach(function(b,k){b.classList.toggle("on",k===i);b.setAttribute("aria-selected",k===i?"true":"false");b.tabIndex=k===i?0:-1});
    panels.forEach(function(p,k){p.classList.toggle("on",k===i)});if(focus)btns[i].focus()}
  btns.forEach(function(b,i){b.addEventListener("click",function(){go(i)});
    b.addEventListener("keydown",function(e){var n=btns.length;if(e.key==="ArrowDown"||e.key==="ArrowRight"){e.preventDefault();go((i+1)%n,true)}else if(e.key==="ArrowUp"||e.key==="ArrowLeft"){e.preventDefault();go((i-1+n)%n,true)}})});
  go(0)});

/* generic segmented control: [data-seg="name"] buttons [data-v]; fires "ai-seg" on the control */
$$("[data-seg]").forEach(function(seg){var btns=$$("button",seg);
  btns.forEach(function(b){b.addEventListener("click",function(){btns.forEach(function(x){x.classList.toggle("on",x===b);x.setAttribute("aria-pressed",x===b?"true":"false")});seg.dispatchEvent(new CustomEvent("ai-seg",{detail:b.getAttribute("data-v")}))})})});

/* ---------- receptionist ---------- */
var LANG={en:["English","EN-US","Thanks for calling Summit Dental, this is Olivia. How can I help?"],
es:["Español","ES-MX","Gracias por llamar a Summit Dental, soy Olivia. ¿En qué puedo ayudarle?"],
pt:["Português","PT-BR","Obrigada por ligar para a Summit Dental, sou a Olivia. Como posso ajudar?"],
fr:["Français","FR-FR","Merci d'avoir appelé Summit Dental, je suis Olivia. Comment puis-je vous aider ?"],
de:["Deutsch","DE-DE","Danke für Ihren Anruf bei Summit Dental, hier ist Olivia. Wie kann ich helfen?"],
it:["Italiano","IT-IT","Grazie per aver chiamato Summit Dental, sono Olivia. Come posso aiutarla?"],
zh:["中文","ZH-CN","感谢致电 Summit Dental，我是 Olivia。请问有什么可以帮您？"],
ja:["日本語","JA-JP","お電話ありがとうございます。Summit Dentalのオリビアです。ご用件をお伺いします。"],
ko:["한국어","KO-KR","Summit Dental에 전화해 주셔서 감사합니다. 올리비아입니다. 무엇을 도와드릴까요?"],
hi:["हिन्दी","HI-IN","Summit Dental में कॉल करने के लिए धन्यवाद, मैं ओलिविया बोल रही हूँ। मैं आपकी कैसे मदद कर सकती हूँ?"],
ar:["العربية","AR-SA","شكرًا لاتصالك بـ Summit Dental، أنا أوليفيا. كيف يمكنني مساعدتك؟"],
tl:["Tagalog","TL-PH","Salamat sa pagtawag sa Summit Dental, si Olivia ito. Paano ko kayo matutulungan?"],
vi:["Tiếng Việt","VI-VN","Cảm ơn bạn đã gọi Summit Dental, tôi là Olivia. Tôi có thể giúp gì cho bạn?"],
th:["ไทย","TH-TH","ขอบคุณที่โทรหา Summit Dental ดิฉันโอลิเวียค่ะ ให้ช่วยอะไรดีคะ"],
nl:["Nederlands","NL-NL","Bedankt voor het bellen met Summit Dental, met Olivia. Waarmee kan ik u helpen?"],
pl:["Polski","PL-PL","Dziękujemy za telefon do Summit Dental, mówi Olivia. W czym mogę pomóc?"]};
var langBtns=$$("[data-lang]");
if(langBtns.length){
  var touched=false;
  var setLang=function(k){var L=LANG[k];if(!L)return;
    langBtns.forEach(function(b){var on=b.getAttribute("data-lang")===k;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false")});
    $$("[data-lang-out]").forEach(function(o){o.style.opacity=0;setTimeout(function(){o.textContent=L[2];o.setAttribute("lang",k);o.style.opacity=1},160)});
    $$("[data-lang-code]").forEach(function(o){o.textContent=L[1]});$$("[data-lang-name]").forEach(function(o){o.textContent=L[0]})};
  langBtns.forEach(function(b){b.addEventListener("click",function(){touched=true;setLang(b.getAttribute("data-lang"))})});
  var order=["en","es","fr","hi"],oi=1;
  if(!RM)setInterval(function(){if(touched||document.hidden)return;oi=(oi+1)%order.length;setLang(order[oi])},3600);
  setLang("es");
}
var T=$("#aiT");if(T&&!RM){var sec=1;setInterval(function(){if(document.hidden)return;sec=sec>=59?1:sec+1;T.textContent="00:"+(sec<10?"0":"")+sec},1000)}

/* day chart */
var day=$("#aiDay");
if(day){
  var hrs=[2,1,1,1,1,2,4,6,8,8,10,9,8,9,10,9,8,7,9,8,6,4,2,1],bars=$(".ai-bars",day),html="";
  hrs.forEach(function(v,h){var o=(h<9||h>17)?" class=\"o\"":"";html+="<i"+o+" style=\"--v:"+v+"\" title=\""+("0"+h).slice(-2)+":00 · "+v+" calls\"></i>"});bars.innerHTML=html;
  var ans=$("[data-ans]",day),sub=$("[data-ans-sub]",day);
  $("[data-seg]",day).addEventListener("ai-seg",function(e){var ai=e.detail==="ai";day.classList.toggle("is-ai",ai);
    ans.textContent=ai?"134 of 134":"78 of 134";sub.textContent=ai?"calls answered · 56 picked up by AI":"calls answered · 56 went to voicemail"});
}

/* rules */
var rules=$$("[data-rule]");
if(rules.length){
  var rows=$$("[data-need]"),cnt=$("#aiRuleCnt");
  var upd=function(){var on={};rules.forEach(function(r){on[r.getAttribute("data-rule")]=r.getAttribute("aria-checked")==="true"});var p=0;
    rows.forEach(function(row){var need=row.getAttribute("data-need"),pill=$(".ai-pill",row),person=need&&on[need];
      pill.className="ai-pill "+(person?"hot":"ok");pill.textContent=person?"Warm transfer":"AI handles";if(person)p++});
    if(cnt)cnt.textContent=p+" to a person, "+(rows.length-p)+" handled by AI"};
  rules.forEach(function(r){r.addEventListener("click",function(){r.setAttribute("aria-checked",r.getAttribute("aria-checked")==="true"?"false":"true");upd()})});upd();
}

/* ---------- agent assist ---------- */
$$(".ai-btn[data-use]").forEach(function(b){b.addEventListener("click",function(){b.classList.add("used");b.textContent=b.getAttribute("data-done")||"Used"})});
var ramp=$("#aiRamp");
if(ramp){
  var W=600,H=220,L=10,B=30;
  function wo(w){return 100*(1-Math.exp(-w/7.5))}function wi(w){return Math.min(100,100*(1-Math.exp(-w/2.1)))}
  function X(w){return L+(W-L)*w/12}function Y(v){return H-B-(H-B-14)*v/100}
  function path(fn){var d="";for(var w=0;w<=12;w+=.25){d+=(w?"L":"M")+X(w).toFixed(1)+" "+Y(fn(w)).toFixed(1)}return d}
  var svg="<svg viewBox=\"0 0 "+(W+10)+" "+H+"\" role=\"img\" aria-label=\"New-hire ramp, with and without Agent Assist (illustrative)\">";
  [0,4,8,12].forEach(function(w){svg+="<line class=\"ax\" x1=\""+X(w)+"\" x2=\""+X(w)+"\" y1=\"14\" y2=\""+(H-B)+"\"/><text x=\""+X(w)+"\" y=\""+(H-8)+"\" text-anchor=\"middle\">wk "+w+"</text>"});
  svg+="<line x1=\""+L+"\" x2=\""+W+"\" y1=\""+Y(100)+"\" y2=\""+Y(100)+"\" stroke=\"#C9BFB4\" stroke-dasharray=\"5 6\"/><text x=\""+(W)+"\" y=\""+(Y(100)-6)+"\" text-anchor=\"end\">Senior level</text>";
  svg+="<path class=\"ln\" d=\""+path(wo)+"\" stroke=\"#B9AEA2\"/><path class=\"ln with\" d=\""+path(wi)+"\" stroke=\"url(#rg)\"/>";
  svg+="<defs><linearGradient id=\"rg\" x1=\"0\" x2=\"1\"><stop offset=\"0\" stop-color=\"#FF7A5C\"/><stop offset=\"1\" stop-color=\"#F5C46B\"/></linearGradient></defs>";
  svg+="<circle id=\"rdo\" r=\"6\" fill=\"#fff\" stroke=\"#8A7F74\" stroke-width=\"3\"/><circle id=\"rdi\" class=\"wdot\" r=\"7\" fill=\"#fff\" stroke=\"#E8553A\" stroke-width=\"3\"/></svg>";
  $(".ai-rsvg",ramp).innerHTML=svg;
  var rng=$("#aiRng"),o=$("#rdo"),i=$("#rdi"),ro=$("#aiRo"),rw=$("#aiRw"),rk=$("#aiRk");
  var draw=function(){var w=+rng.value;o.setAttribute("cx",X(w));o.setAttribute("cy",Y(wo(w)));i.setAttribute("cx",X(w));i.setAttribute("cy",Y(wi(w)));
    ro.textContent=Math.round(wo(w))+"%";rw.textContent=Math.round(wi(w))+"%";rk.textContent="Week "+w};
  rng.addEventListener("input",draw);rng.value=2;draw();
  $("[data-seg]",ramp).addEventListener("ai-seg",function(e){ramp.classList.toggle("is-with",e.detail==="with")});ramp.classList.add("is-with");
}
var tone=$("#aiTone");
if(tone){var TX={warm:"I'm so sorry that happened. Let me check the carrier scan for you right now.",formal:"Apologies for the inconvenience. I will review the carrier scan for your parcel immediately.",brief:"Sorry about that. Checking the carrier scan now."};
  var sug=$("#aiSug"),box=$("#aiBox"),ins=$("#aiIns"),cur="warm";
  tone.addEventListener("ai-seg",function(e){cur=e.detail;sug.style.opacity=0;setTimeout(function(){sug.textContent=TX[cur];sug.style.opacity=1},150);box.classList.remove("ok");box.textContent="Type a reply..."});
  ins.addEventListener("click",function(){box.textContent=TX[cur];box.classList.add("ok")});}

/* ---------- conversation intelligence ---------- */
var flt=$("#aiFlt");
if(flt){var res=$$(".ai-res"),mc=$("#aiMc");
  flt.addEventListener("ai-seg",function(e){var n=0;res.forEach(function(r){var show=e.detail==="all"||r.getAttribute("data-cat")===e.detail;r.hidden=!show;if(show)n++});mc.textContent=n+" match"+(n===1?"":"es")+" · "+n+" call"+(n===1?"":"s")})}
var layers=$$("[data-layer]");
if(layers.length){var conv=$("#aiLayers"),lc=$("#aiLc");
  var upL=function(){var n=0;layers.forEach(function(b){var on=b.getAttribute("aria-checked")==="true";conv.classList.toggle("l-"+b.getAttribute("data-layer"),on);if(on)n++});lc.textContent=n+" of 5 layers on"};
  layers.forEach(function(b){b.addEventListener("click",function(){b.setAttribute("aria-checked",b.getAttribute("aria-checked")==="true"?"false":"true");upL()})});upL();}
var th=$$(".ai-th");
if(th.length&&$("#aiTn")){
  var TH=[["Pricing structure",142,"Rising vs previous period",["Per-seat pricing is hard to justify for part-time staff.","Is there a discount if we commit annually?"]],
  ["Implementation time",98,"Steady vs previous period",["We can't lose a month to a migration.","How long until the whole team is live?"]],
  ["Integration depth",71,"Rising vs previous period",["Does it write back to Salesforce, or only read?","We need the call data in our warehouse."]],
  ["Security review",54,"Falling vs previous period",["Our security team wants the SOC 2 report first.","Where are recordings stored and for how long?"]],
  ["Contract length",41,"Steady vs previous period",["Can we start monthly and move to annual later?","Three years feels long for a first contract."]]];
  var fac={7:.24,30:1,90:2.8},per=30;
  var render=function(sel){th.forEach(function(b,i){var n=Math.round(TH[i][1]*fac[per]);b.querySelector("b").textContent=n;b.querySelector("i").style.setProperty("--w",Math.max(8,Math.round(n/(142*fac[per])*100))+"%");b.classList.toggle("on",i===sel)});
    var d=TH[sel],n=Math.round(d[1]*fac[per]);$("#aiTn").textContent=d[0];$("#aiTc").textContent=n;$("#aiTt").textContent=d[2];
    $("#aiTq").innerHTML=d[3].map(function(q){return "<p class=\"ai-quote\">“"+q+"”</p>"}).join("")};
  var sel=0;th.forEach(function(b,i){b.addEventListener("click",function(){sel=i;render(sel)})});
  $("#aiPer").addEventListener("ai-seg",function(e){per=+e.detail;render(sel)});$("#aiPer [data-v='30']").click();render(0);
}

/* ---------- platform pages ---------- */
var seats=$$(".ai-seat");
if(seats.length){var sc=$("#aiSeatCnt");var us=function(){var n=seats.filter(function(b){return b.getAttribute("aria-pressed")==="true"}).length;sc.textContent=n+" of "+seats.length+" seats have fax. The other "+(seats.length-n)+" don’t pay for it."};
  seats.forEach(function(b){b.addEventListener("click",function(){b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")==="true"?"false":"true");us()})});us();}
var sun=$("#aiSun");
if(sun){var rng2=$("#aiSunR"),rowsS=$$("[data-off]",sun),clk=$("#aiSunT"),sum=$("#aiSunS"),pad=function(n){return(n<10?"0":"")+n};
  var drawSun=function(){var h=+rng2.value,on=0,names=[];clk.textContent=pad(h)+":00 UTC";
    rowsS.forEach(function(r){var off=+r.getAttribute("data-off"),ag=+r.getAttribute("data-ag"),loc=((h+off)%24+24)%24,open=loc>=8&&loc<18;
      r.classList.toggle("closed",!open);$(".lt",r).textContent=pad(loc)+":00 local · "+ag+" agents";var p=$(".ai-pill",r);p.className="ai-pill "+(open?"ok":"neu");p.textContent=open?"Live":"Closed";
      if(open){on+=ag;names.push(r.getAttribute("data-name"))}});
    sum.textContent=names.length?"Calls route to "+names.join(", ")+" · "+on+" agents online":"No office is staffed at this hour"};
  rng2.addEventListener("input",drawSun);rng2.value=14;drawSun();}

/* polish v1: fit the hero mockup to the screen height, balance uneven splits */
(function(){
  var hero=$(".hero"),win=hero&&$(".ai-win",hero);
  function fit(){if(!win)return;win.style.zoom="";if(window.innerWidth<=1000)return;var avail=window.innerHeight*0.93-76,h=win.getBoundingClientRect().height;if(h>avail)win.style.zoom=Math.max(.72,avail/h).toFixed(3)}
  fit();window.addEventListener("resize",fit);setTimeout(fit,500);setTimeout(fit,1600);
  function balance(){$$(".ai-split").forEach(function(sp){sp.classList.remove("ai-skew");$$(".ai-stk",sp).forEach(function(c){c.classList.remove("ai-stk")});
    if(window.innerWidth<=1000||sp.children.length!==2)return;var a=sp.children[0],b=sp.children[1],ha=a.getBoundingClientRect().height,hb=b.getBoundingClientRect().height;
    if(Math.abs(ha-hb)>260){sp.classList.add("ai-skew");(ha<hb?a:b).classList.add("ai-stk")}})}
  balance();window.addEventListener("resize",balance);setTimeout(balance,700);setTimeout(balance,2000);
})();
/* performance: menus stay unrendered until the first interaction with the header */
(function(){var hd=$("header.nav"),ms=$$(".mega");if(!hd||!ms.length)return;ms.forEach(function(m){m.classList.add("cold")});
  var warm=function(){ms.forEach(function(m){m.classList.remove("cold")})};
  ["pointerenter","focusin","touchstart","keydown"].forEach(function(ev){hd.addEventListener(ev,warm,{once:true,passive:true})})})();
/* in-page anchors used in the hero */
$$("a[href^='#']").forEach(function(a){if(a.getAttribute("href").length<2)return;a.addEventListener("click",function(e){var t=$(a.getAttribute("href"));if(t){e.preventDefault();t.scrollIntoView({behavior:RM?"auto":"smooth",block:"start"})}})});
icons();
})();
