/* customer stories: one looping row of cards (originals plus inert clones), paused on hover or focus. Same behaviour as the homepage. */
(function(){var row=document.getElementById("storyRow");if(!row||row.querySelector(".mq-track"))return;
  var cards=[].slice.call(row.children),track=document.createElement("div");track.className="mq-track";
  cards.forEach(function(c){track.appendChild(c)});
  cards.forEach(function(c){var k=c.cloneNode(true);k.setAttribute("aria-hidden","true");k.setAttribute("inert","");track.appendChild(k)});
  row.appendChild(track);row.classList.add("mq");
  track.style.setProperty("--mq-dur",Math.round(cards.length*13)+"s");
})();
