/* Has Legs: menu and scroll reveals. No libraries. */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  window.hasLegsReady = true;

  /* ---- Menu (small screens) ---- */

  var menuBtn = doc.querySelector(".menu-btn");
  var nav = doc.getElementById("site-nav");
  if (menuBtn && nav) {
    var word = menuBtn.querySelector(".menu-word");
    var setMenu = function (open) {
      nav.classList.toggle("open", open);
      root.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (word) { word.textContent = open ? "Close" : "Menu"; }
    };
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menuBtn.focus();
      }
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) { setMenu(false); }
    });
    if (window.matchMedia) {
      var wide = window.matchMedia("(min-width: 981px)");
      var onWide = function (query) { if (query.matches) { setMenu(false); } };
      if (wide.addEventListener) { wide.addEventListener("change", onWide); } else if (wide.addListener) { wide.addListener(onWide); }
    }
  }

  /* ---- Header line once the page has scrolled ---- */

  var top = doc.querySelector(".top");
  if (top) {
    var onScroll = function () { top.classList.toggle("scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Reveal on scroll ---- */

  var revealItems = [].slice.call(doc.querySelectorAll("[data-reveal]"));
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) { el.classList.add("in"); });
  } else if (revealItems.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    revealItems.forEach(function (el) { observer.observe(el); });
  }
})();
