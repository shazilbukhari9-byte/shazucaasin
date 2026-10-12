/* Footer cover: the page content stays pinned at the bottom of the screen while the footer slides up over it,
   dimming and hiding the last sections as it rises. Desktop only; skipped for reduced motion. */
(function(){
  var html=document.documentElement,main=document.querySelector("main"),foot=document.querySelector("footer.foot");
  if(!main||!foot)return;
  var mq=window.matchMedia("(min-width:901px)"),rm=window.matchMedia("(prefers-reduced-motion: reduce)"),raf=0,on=false;
  function enabled(){return mq.matches&&!rm.matches&&"IntersectionObserver" in window}
  function setTop(){
    var h=main.offsetHeight,vh=window.innerHeight;
    /* pin when the bottom of main reaches the bottom of the screen */
    main.style.top=Math.min(0,vh-h)+"px";
  }
  function progress(){
    raf=0;if(!on)return;
    var r=foot.getBoundingClientRect(),vh=window.innerHeight;
    var p=Math.max(0,Math.min(1,(vh-r.top)/Math.min(Math.max(r.height,1),vh)));
    main.style.setProperty("--fc",p.toFixed(3));
  }
  function req(){if(!raf)raf=requestAnimationFrame(progress)}
  function apply(){
    var want=enabled();
    if(want&&!on){on=true;html.classList.add("fc-on");setTop();progress()}
    else if(!want&&on){on=false;html.classList.remove("fc-on");main.style.top="";main.style.removeProperty("--fc")}
    else if(on){setTop();progress()}
  }
  window.addEventListener("scroll",req,{passive:true});
  window.addEventListener("resize",apply);
  if(mq.addEventListener){mq.addEventListener("change",apply);rm.addEventListener("change",apply)}
  if("ResizeObserver" in window)new ResizeObserver(function(){if(on)setTop()}).observe(main);
  window.addEventListener("load",apply);apply();
  window.addEventListener("pageshow",function(e){if(e.persisted)apply()});
})();

