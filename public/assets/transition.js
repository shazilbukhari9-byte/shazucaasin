/* Branded page transition for "Book a demo".
   Leaving: a coral-to-amber circle grows from the click point, the UCaaS logo settles in the middle with a slim progress line, then the sign-up page opens.
   Arriving: the same screen is already there, the logo lifts away, the colour closes toward the centre and the form builds in piece by piece. */
(function(){
  var KEY="ucaas-transition",LOGO="assets/logo.png";
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EASE="cubic-bezier(.65,.02,.2,1)";
  var css=
  ".pt-veil{position:fixed;inset:0;z-index:2147483000;pointer-events:none;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,#E8553A 0%,#F2783F 52%,#F5A24B 100%);clip-path:circle(0px at var(--x,50%) var(--y,50%));-webkit-clip-path:circle(0px at var(--x,50%) var(--y,50%));will-change:clip-path}"+
  ".pt-veil::before{content:'';position:absolute;width:62vmax;height:62vmax;left:50%;top:50%;margin:-31vmax 0 0 -31vmax;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.22),transparent 70%);opacity:0;transform:scale(.6);transition:opacity .7s .2s,transform 1.1s .2s cubic-bezier(.2,.8,.2,1)}"+
  ".pt-veil.go,.pt-veil.open{pointer-events:all}"+
  ".pt-veil.go{clip-path:circle(150vmax at var(--x,50%) var(--y,50%));-webkit-clip-path:circle(150vmax at var(--x,50%) var(--y,50%));transition:clip-path .62s "+EASE+",-webkit-clip-path .62s "+EASE+"}"+
  ".pt-veil.open{clip-path:circle(150vmax at var(--x,50%) var(--y,50%));-webkit-clip-path:circle(150vmax at var(--x,50%) var(--y,50%))}"+
  ".pt-veil.go::before,.pt-veil.open::before{opacity:1;transform:scale(1)}"+
  ".pt-brand{position:relative;display:flex;flex-direction:column;align-items:center;gap:22px;opacity:0;transform:translateY(14px) scale(.92)}"+
  ".pt-veil.go .pt-brand{opacity:1;transform:none;transition:opacity .45s .32s ease,transform .6s .32s cubic-bezier(.2,.8,.2,1)}"+
  ".pt-veil.open .pt-brand{opacity:1;transform:none}"+
  ".pt-logo{width:184px;height:96px;display:grid;place-items:center;border-radius:26px;background:#fff;box-shadow:0 30px 60px -24px rgba(90,25,10,.55),0 0 0 1px rgba(255,255,255,.55)}"+
  ".pt-logo img{width:128px;height:auto;display:block}"+
  ".pt-line{width:150px;height:3px;border-radius:3px;background:rgba(255,255,255,.3);overflow:hidden}"+
  ".pt-line i{display:block;height:100%;width:100%;border-radius:inherit;background:#fff;transform:scaleX(0);transform-origin:left}"+
  ".pt-veil.go .pt-line i{transform:scaleX(1);transition:transform .8s .45s cubic-bezier(.45,.05,.25,1)}"+
  ".pt-veil.open .pt-line i{transform:scaleX(1)}"+
  ".pt-tag{font:500 13px/1 'Filson Pro',system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.9)}"+
  /* arriving: logo lifts away, colour closes toward the centre */
  ".pt-veil.reveal{pointer-events:none;clip-path:circle(0px at 50% 50%);-webkit-clip-path:circle(0px at 50% 50%);transition:clip-path .8s .12s "+EASE+",-webkit-clip-path .8s .12s "+EASE+"}"+
  ".pt-veil.reveal .pt-brand{opacity:0;transform:translateY(-10px) scale(1.06);transition:opacity .35s ease,transform .5s ease}"+
  /* sign-up page content builds in */
  ".pt-arrive .container{animation:ptfade .6s .45s both ease}"+
  ".pt-arrive .container form .title,.pt-arrive .container .input-field,.pt-arrive .container form .btn,.pt-arrive .container .social-text,.pt-arrive .container .social-media,.pt-arrive .container .panel .content>*{animation:ptup .75s both cubic-bezier(.2,.8,.2,1)}"+
  ".pt-arrive .container form .title{animation-delay:.62s}"+
  ".pt-arrive .container .input-field:nth-of-type(1){animation-delay:.7s}.pt-arrive .container .input-field:nth-of-type(2){animation-delay:.78s}.pt-arrive .container .input-field:nth-of-type(3){animation-delay:.86s}"+
  ".pt-arrive .container form .btn{animation-delay:.94s}.pt-arrive .container .social-text{animation-delay:1s}.pt-arrive .container .social-media{animation-delay:1.06s}"+
  ".pt-arrive .container .panel .content>*{animation-delay:.8s}"+
  "@keyframes ptfade{from{opacity:0}to{opacity:1}}@keyframes ptup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}"+
  "@media(prefers-reduced-motion:reduce){.pt-arrive .container,.pt-arrive .container *{animation:none!important}}";

  function addStyle(){if(document.getElementById("pt-style"))return;var st=document.createElement("style");st.id="pt-style";st.textContent=css;document.head.appendChild(st)}
  function veil(){
    addStyle();
    var v=document.createElement("div");v.className="pt-veil";v.setAttribute("aria-hidden","true");
    v.innerHTML='<div class="pt-brand"><div class="pt-logo"><img src="'+LOGO+'" alt="" width="128" height="55"></div><div class="pt-line"><i></i></div><div class="pt-tag">Setting up your demo</div></div>';
    return v;
  }
  /* the Next.js app routes without a page reload when it can */
  function nav(href){if(window.__ucaasNavigate)window.__ucaasNavigate(href);else window.location.href=href}
  function flag(set){try{if(set)sessionStorage.setItem(KEY,"1");else sessionStorage.removeItem(KEY)}catch(e){}}
  function flagged(){try{return sessionStorage.getItem(KEY)==="1"}catch(e){return false}}

  /* arriving: we came through the veil, so start covered and close it toward the centre */
  function arrive(){
    if(!flagged())return;flag(false);
    if(reduce)return;
    var old=[].slice.call(document.querySelectorAll(".pt-veil"));
    var v=veil();v.classList.add("open");document.body.appendChild(v);
    old.forEach(function(o){o.remove()}); /* in the web app the leaving veil is still on screen; the new one takes over */
    var shown=false;
    function reveal(){if(shown)return;shown=true;v.classList.remove("open");v.classList.add("reveal");setTimeout(function(){v.remove()},1200)}
    setTimeout(function(){requestAnimationFrame(reveal)},380);
    setTimeout(reveal,1100);setTimeout(function(){if(v.parentNode)v.remove()},2600); /* never leave the page covered */
  }
  /* mark the document early so the form starts hidden instead of flashing before the veil is built */
  try{if(sessionStorage.getItem(KEY)==="1"&&!reduce){document.documentElement.classList.add("pt-arrive");addStyle()}}catch(e){}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrive);else arrive();

  /* leaving: any "Book a demo" button that points to the sign-up page */
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a[data-cta='demo']");
    if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var href=a.getAttribute("href");if(!href)return;
    e.preventDefault();
    if(reduce){nav(href);return}
    if(document.querySelector(".pt-veil"))return;
    var r=a.getBoundingClientRect();
    var v=veil();v.style.setProperty("--x",Math.round(e.clientX||(r.left+r.width/2))+"px");v.style.setProperty("--y",Math.round(e.clientY||(r.top+r.height/2))+"px");
    document.body.appendChild(v);
    var pre=new Image();pre.src=LOGO; /* make sure the logo is ready */
    v.getBoundingClientRect();v.classList.add("go");
    flag(true);
    var done=false;function go(){if(done)return;done=true;nav(href)}
    setTimeout(go,1350);
  });

  /* back/forward cache: never leave the veil on screen */
  window.addEventListener("pageshow",function(e){if(e.persisted){var o=document.querySelector(".pt-veil");if(o)o.remove();flag(false);document.documentElement.classList.remove("pt-arrive")}});
})();
