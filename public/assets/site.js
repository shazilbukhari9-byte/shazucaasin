/* menus stay unrendered until the first interaction with the header */
(function(){var hd=document.querySelector("header.nav"),ms=[].slice.call(document.querySelectorAll(".mega"));if(!hd||!ms.length)return;
ms.forEach(function(m){m.classList.add("cold")});
var warm=function(){ms.forEach(function(m){m.classList.remove("cold")})};
["pointerenter","focusin","touchstart","keydown"].forEach(function(ev){hd.addEventListener(ev,warm,{once:true,passive:true})})})();
