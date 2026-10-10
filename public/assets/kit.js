/* kx kit: tiny behaviours for the section design language. No dependency; Motion is loaded lazily for the extras. */
(function(){
var $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches,HOVER=window.matchMedia&&matchMedia("(hover:hover)").matches;
document.documentElement.classList.add("kx-js");

/* reveal on view: [data-r] (optional value: scale|fade|left|right), [data-stagger] numbers its children */
$$("[data-stagger]").forEach(function(p){[].forEach.call(p.children,function(c,i){c.setAttribute("data-r",c.getAttribute("data-r")||"");c.style.setProperty("--i",i)})});
var seen=function(el){el.classList.add("kx-seen")};
if("IntersectionObserver" in window&&!RM){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){seen(e.target);io.unobserve(e.target)}})},{threshold:.12,rootMargin:"0px 0px -6% 0px"});
  $$("[data-r],.kx-tl>li,[data-beam],[data-count]").forEach(function(el){io.observe(el)});
}else{$$("[data-r],.kx-tl>li,[data-beam],[data-count]").forEach(seen)}


/* AUTO-ENHANCE: every card-like block gets the cursor spotlight, and a slim reading-progress bar tracks the page */
$$(".kx-card,.kx-b,.kx-plan,.ai-ucc .q,.ai-fi,.kx-pv").forEach(function(el){if(!el.hasAttribute("data-spot"))el.setAttribute("data-spot","")});
if(!RM&&!document.querySelector(".kx-progress")){var bar=document.createElement("i");bar.className="kx-progress";bar.setAttribute("aria-hidden","true");document.body.appendChild(bar);
  var pq2=0,pp=function(){pq2=0;var h=document.documentElement.scrollHeight-window.innerHeight;bar.style.setProperty("--sp",h>0?Math.min(1,window.scrollY/h).toFixed(4):0)};
  window.addEventListener("scroll",function(){if(!pq2)pq2=requestAnimationFrame(pp)},{passive:true});pp()}
/* spotlight: pointer position feeds --mx/--my */
if(HOVER){$$("[data-spot]").forEach(function(el){var raf=0,x=0,y=0;
  el.addEventListener("pointermove",function(e){var r=el.getBoundingClientRect();x=e.clientX-r.left;y=e.clientY-r.top;if(!raf)raf=requestAnimationFrame(function(){raf=0;el.style.setProperty("--mx",x+"px");el.style.setProperty("--my",y+"px")})},{passive:true})})}

/* tilt: [data-tilt="8"] max degrees */
if(HOVER&&!RM){$$("[data-tilt]").forEach(function(el){var max=+el.getAttribute("data-tilt")||7;
  el.addEventListener("pointermove",function(e){var r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;el.style.setProperty("--ry",(px*max*2).toFixed(2)+"deg");el.style.setProperty("--rx",(-py*max*2).toFixed(2)+"deg")},{passive:true});
  el.addEventListener("pointerleave",function(){el.style.setProperty("--rx","0deg");el.style.setProperty("--ry","0deg")})})}

/* counters: <b data-count="1284" data-dec="0" data-pre="" data-suf="+">0</b> */
function fmt(v,dec){return dec?v.toFixed(dec):Math.round(v).toLocaleString("en-US")}
$$("[data-count]").forEach(function(el){var to=parseFloat(el.getAttribute("data-count")),dec=+el.getAttribute("data-dec")||0,pre=el.getAttribute("data-pre")||"",suf=el.getAttribute("data-suf")||"";
  var set=function(v){el.textContent=pre+fmt(v,dec)+suf};
  if(RM){set(to);return}
  set(0);var started=false;
  var run=function(){if(started)return;started=true;var t0=performance.now(),dur=1500;(function f(n){var k=Math.min(1,(n-t0)/dur),e=1-Math.pow(1-k,3);set(to*e);if(k<1)requestAnimationFrame(f)})(t0)};
  if("IntersectionObserver" in window){var o=new IntersectionObserver(function(es){if(es[0].isIntersecting){run();o.disconnect()}},{threshold:.4});o.observe(el)}else run()});

/* marquee: [data-mq] duplicates its track so the loop is seamless */
$$("[data-mq]").forEach(function(m){var t=m.querySelector(".kx-mq-t");if(!t||t.getAttribute("data-dup"))return;t.setAttribute("data-dup","1");
  var kids=[].slice.call(t.children);kids.forEach(function(k){var c=k.cloneNode(true);c.setAttribute("aria-hidden","true");t.appendChild(c)})});

/* horizontal carousel: progress bar + prev/next buttons.  <div class="kx-hswrap"><div class="kx-nav"><button data-hs="-1">..</button><button data-hs="1">..</button></div><div class="kx-hs">..</div><div class="kx-prog"><i></i></div></div> */
$$(".kx-hswrap").forEach(function(w){var hs=w.querySelector(".kx-hs"),bar=w.querySelector(".kx-prog>i");if(!hs)return;
  var upd=function(){var max=hs.scrollWidth-hs.clientWidth;var p=max>0?hs.scrollLeft/max:1;if(bar)bar.style.setProperty("--p",Math.max(.12,p).toFixed(3));bar&&bar.parentElement.setAttribute("aria-hidden","true")};
  hs.addEventListener("scroll",function(){requestAnimationFrame(upd)},{passive:true});upd();window.addEventListener("resize",upd);
  $$("[data-hs]",w).forEach(function(b){b.addEventListener("click",function(){var c=hs.children[0];var step=(c?c.getBoundingClientRect().width:300)+16;hs.scrollBy({left:step*(+b.getAttribute("data-hs")),behavior:RM?"auto":"smooth"})})})});

/* timeline line fill: [data-tl] on the .kx-tl list, driven by scroll position */
var tls=$$(".kx-tl");
if(tls.length){var tick=function(){tls.forEach(function(t){var r=t.getBoundingClientRect(),vh=window.innerHeight;var p=(vh*.62-r.top)/(r.height);t.style.setProperty("--tlp",Math.max(0,Math.min(1,p)).toFixed(3))})};
  if(RM){tls.forEach(function(t){t.style.setProperty("--tlp",1)})}else{var q=0;window.addEventListener("scroll",function(){if(!q)q=requestAnimationFrame(function(){q=0;tick()})},{passive:true});window.addEventListener("resize",tick);tick()}}

/* beam: <svg class="kx-beam" data-beam viewBox="0 0 1000 2" preserveAspectRatio="none"><path d="M0 1H1000"/></svg> */
$$("[data-beam]").forEach(function(s){var p=s.querySelector("path");if(!p||!p.getTotalLength)return;var L=Math.ceil(p.getTotalLength());s.style.setProperty("--len",L)});

/* tabs with a sliding pill: <div class="kx-tabs" data-kxtabs><i class="kx-pill"></i><button>..</button>..</div> + <div class="kx-stage"><div class="kx-sg">..</div>..</div> (stage follows the tabs that sit before it in the same wrapper [data-kxwrap]) */
$$("[data-kxtabs]").forEach(function(bar){var pill=bar.querySelector(".kx-pill"),btns=$$("button",bar),wrap=bar.closest("[data-kxwrap]")||bar.parentElement,sg=$$(".kx-sg",wrap);
  var go=function(i){btns.forEach(function(b,k){b.classList.toggle("on",k===i);b.setAttribute("aria-selected",k===i?"true":"false")});sg.forEach(function(s,k){s.classList.toggle("on",k===i)});
    if(pill&&btns[i]){pill.style.width=btns[i].offsetWidth+"px";pill.style.transform="translateX("+btns[i].offsetLeft+"px)"}};
  btns.forEach(function(b,i){b.addEventListener("click",function(){go(i)})});go(0);window.addEventListener("resize",function(){var i=btns.findIndex(function(b){return b.classList.contains("on")});go(Math.max(0,i))});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){var i=btns.findIndex(function(b){return b.classList.contains("on")});go(Math.max(0,i))});if("IntersectionObserver" in window){new IntersectionObserver(function(es){if(es[0].isIntersecting){var i=btns.findIndex(function(b){return b.classList.contains("on")});go(Math.max(0,i))}}).observe(bar)}});

/* list with preview: <div class="kx-lp" data-kxlp><div class="kx-lp-list"><button class="kx-lp-li">..</button></div><div class="kx-lp-pv"><div class="kx-pv">..</div></div></div> */
$$("[data-kxlp]").forEach(function(w){var li=$$(".kx-lp-li",w),pv=$$(".kx-pv",w);
  var go=function(i){li.forEach(function(b,k){b.classList.toggle("on",k===i);b.setAttribute("aria-pressed",k===i?"true":"false")});pv.forEach(function(p,k){p.classList.toggle("on",k===i)})};
  li.forEach(function(b,i){b.addEventListener("click",function(){go(i)});b.addEventListener("mouseenter",function(){if(HOVER)go(i)});b.addEventListener("focus",function(){go(i)})});go(0)});

/* parallax: [data-par="0.08"] moves slower/faster than the page while visible */
if(!RM){var par=$$("[data-par]");if(par.length){var vis=new Set(),pio=new IntersectionObserver(function(es){es.forEach(function(e){e.isIntersecting?vis.add(e.target):vis.delete(e.target)})});par.forEach(function(el){pio.observe(el)});
  var pq=0,pt=function(){pq=0;vis.forEach(function(el){var r=el.getBoundingClientRect(),k=+el.getAttribute("data-par")||.08;var d=(r.top+r.height/2-window.innerHeight/2)*k;el.style.transform="translate3d(0,"+(-d).toFixed(1)+"px,0)"})};
  window.addEventListener("scroll",function(){if(!pq)pq=requestAnimationFrame(pt)},{passive:true})}}

/* Motion (motion.dev) is loaded lazily, only for extras that benefit from springs; nothing depends on it */
if(!RM&&document.querySelector("[data-spring]")){var go=function(){var s=document.createElement("script");s.src="assets/motion.js";s.async=true;s.onload=function(){var M=window.Motion;if(!M||!M.animate)return;
    $$("[data-spring]").forEach(function(el){el.addEventListener("pointerdown",function(){M.animate(el,{scale:[1,.96,1]},{duration:.35,ease:[.2,.8,.2,1]})})})};document.head.appendChild(s)};
  if("requestIdleCallback" in window)requestIdleCallback(go,{timeout:3000});else setTimeout(go,1800)}
})();
