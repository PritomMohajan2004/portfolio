(function(){
"use strict";
var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

var tcEls = document.querySelectorAll("[data-timecode]");
function pad(n){ return String(n).padStart(2,"0"); }
var dhaka = new Intl.DateTimeFormat("en-GB", {
  timeZone:  "Asia/Dhaka",
  hourCycle: "h23",
  hour:   "2-digit",
  minute: "2-digit",
  second: "2-digit"
});
function renderTC(){
  var now = new Date();
  var p = dhaka.formatToParts(now);
  var h = p.find(function(x){ return x.type === "hour";   }).value;
  var m = p.find(function(x){ return x.type === "minute"; }).value;
  var s = p.find(function(x){ return x.type === "second"; }).value;
  var f = pad(Math.floor(now.getMilliseconds() / 1000 * 24));
  var tc = h + ":" + m + ":" + s + ":" + f;
  tcEls.forEach(function(el){ el.textContent = tc; });
}
if(reduced){ renderTC(); setInterval(renderTC,1000); }
else{ (function loop(){ renderTC(); requestAnimationFrame(loop); })(); }

var bar = document.querySelector(".progress");
var head = document.getElementById("siteHead");
function onScroll(){
  var h = document.documentElement;
  var max = h.scrollHeight - h.clientHeight;
  bar.style.transform = "scaleX(" + (max>0 ? h.scrollTop/max : 0) + ")";
  head.classList.toggle("scrolled", h.scrollTop > 10);
}
document.addEventListener("scroll", onScroll, {passive:true});
onScroll();

var burger = document.querySelector(".burger");
var menu = document.getElementById("menu");
function toggleMenu(force){
  var open = (typeof force === "boolean") ? force : !menu.classList.contains("open");
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  menu.setAttribute("aria-hidden", !open);
  document.body.classList.toggle("lock", open);
}
burger.addEventListener("click", function(){ toggleMenu(); });
menu.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", function(){ toggleMenu(false); }); });
document.addEventListener("keydown", function(e){ if(e.key === "Escape") toggleMenu(false); });

function scramble(el, delay){
  var target = el.dataset.text || el.textContent;
  if(reduced){ el.textContent = target; return; }
  var chars = "█▓▒░<>/*\\|#@&%";
  var dur = 950, start = null;
  setTimeout(function(){
    requestAnimationFrame(function tick(now){
      if(!start) start = now;
      var p = Math.min(1, (now - start)/dur);
      var locked = Math.floor(p * target.length);
      var out = "";
      for(var i=0;i<target.length;i++){
        out += (i < locked) ? target[i]
             : (target[i] === " " ? " " : chars[Math.floor(Math.random()*chars.length)]);
      }
      el.textContent = out;
      if(p < 1) requestAnimationFrame(tick); else el.textContent = target;
    });
  }, delay);
}
document.querySelectorAll(".scramble").forEach(function(el, i){ scramble(el, 250 + i*220); });

var revealEls = document.querySelectorAll("[data-reveal]");
if(reduced || !("IntersectionObserver" in window)){
  revealEls.forEach(function(el){ el.classList.add("inview"); });
}else{
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add("inview"); io.unobserve(en.target); }
    });
  }, {threshold:.12, rootMargin:"0px 0px -8% 0px"});
  revealEls.forEach(function(el){ io.observe(el); });
}

var navLinks = document.querySelectorAll(".nav a");
var sections = [];
navLinks.forEach(function(a){
  var id = a.getAttribute("href").slice(1);
  var sec = document.getElementById(id);
  if(sec) sections.push({link:a, sec:sec});
});
if("IntersectionObserver" in window){
  var navIO = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        navLinks.forEach(function(a){ a.classList.remove("active"); });
        var match = sections.find(function(s){ return s.sec === en.target; });
        if(match) match.link.classList.add("active");
      }
    });
  }, {rootMargin:"-40% 0px -55% 0px"});
  sections.forEach(function(s){ navIO.observe(s.sec); });
}

var fine = window.matchMedia("(pointer:fine)").matches;
if(fine && !reduced){
  document.documentElement.classList.add("has-cursor");
  var dot = document.querySelector(".cursor-dot");
  var ring = document.querySelector(".cursor-ring");
  var mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;
  document.addEventListener("mousemove", function(e){
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx+"px"; dot.style.top = my+"px";
  }, {passive:true});
  (function follow(){
    rx += (mx-rx)*.16; ry += (my-ry)*.16;
    ring.style.left = rx+"px"; ring.style.top = ry+"px";
    requestAnimationFrame(follow);
  })();
  document.addEventListener("mouseover", function(e){
    ring.classList.toggle("grow", !!e.target.closest("a,button,.xp-card,.b-card,.award"));
  });
}
})();

var canHover = window.matchMedia("(hover:hover)").matches;
document.querySelectorAll("[data-video-card]").forEach(function(card){
  var video = card.querySelector("video");
  if(!video) return;
  video.muted = true;

  function start(){
    card.classList.add("is-playing");
    video.play().catch(function(){});
  }
  function stop(){
    card.classList.remove("is-playing");
    video.pause();
    video.currentTime = 0;
  }

  if(canHover){
    card.addEventListener("mouseenter", start);
    card.addEventListener("mouseleave", stop);
  }else{
    card.querySelector(".proj-media").addEventListener("click", function(){
      card.classList.contains("is-playing") ? stop() : start();
    });
  }

var emailLine = document.querySelector(".email-line");
if(emailLine){
  var copyTimer = null;
  emailLine.addEventListener("click", function(e){
    e.preventDefault();
    var email = emailLine.textContent.trim();

    function showCopied(){
      emailLine.classList.add("copied");
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function(){ emailLine.classList.remove("copied"); }, 1600);
    }
    function fallbackCopy(){
      var ta = document.createElement("textarea");
      ta.value = email;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try{ ok = document.execCommand("copy"); }catch(err){ ok = false; }
      document.body.removeChild(ta);
      return ok;
    }

    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(email).then(showCopied, function(){
        if(fallbackCopy()) showCopied();
      });
    }else{
      if(fallbackCopy()) showCopied();
    }
  });
}

var intHover = window.matchMedia("(hover:hover)").matches;
document.querySelectorAll(".int-row").forEach(function(row){
  var head  = row.querySelector(".int-head");
  var video = row.querySelector("video");

  function setOpen(open){
    row.classList.toggle("open", open);
    head.setAttribute("aria-expanded", open);
    if(video){
      if(open){ video.muted = true; video.play().catch(function(){}); }
      else if(!video.paused){ video.pause(); }
    }
  }

  head.addEventListener("click", function(){
    var pinned = row.classList.toggle("pinned");
    setOpen(pinned ? true : (intHover && row.matches(":hover")));
  });

  if(intHover){
    row.addEventListener("mouseenter", function(){ setOpen(true); });
    row.addEventListener("mouseleave", function(){
      if(!row.classList.contains("pinned")) setOpen(false);
    });
  }
});
});
