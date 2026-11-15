/* Has Legs: menu, scroll reveals, FAQ filter and the job sizer. No libraries. */
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

  /* ---- FAQ: filter by topic, and open the question named in the address ---- */

  var filter = doc.querySelector(".faq-filter");
  var groups = [].slice.call(doc.querySelectorAll(".faq-group[data-group]"));
  var showGroup = function (want) {
    if (!filter) { return; }
    [].forEach.call(filter.querySelectorAll("button[data-filter]"), function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-filter") === want ? "true" : "false");
    });
    groups.forEach(function (group) {
      group.hidden = want !== "all" && group.getAttribute("data-group") !== want;
    });
  };
  if (filter) {
    filter.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-filter]");
      if (button) { showGroup(button.getAttribute("data-filter")); }
    });
  }
  var openFromAddress = function () {
    var id = "";
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (err) { id = ""; }
    if (!id) { return; }
    var target = doc.getElementById(id);
    if (!target) { return; }
    var group = target.closest(".faq-group");
    if (group && group.hidden) { showGroup("all"); }
    if (target.tagName === "DETAILS") {
      target.open = true;
      target.scrollIntoView();
    }
  };
  [].forEach.call(doc.querySelectorAll("[data-open-first]"), function (box) {
    var first = box.querySelector("details");
    if (first) { first.open = true; }
  });
  openFromAddress();
  window.addEventListener("hashchange", openFromAddress);

  /* ---- Size your job ---- */

  var sizer = doc.querySelector("[data-sizer]");
  if (sizer) {
    var single = Number(sizer.getAttribute("data-single"));
    var further = Number(sizer.getAttribute("data-further"));
    var setMax = Number(sizer.getAttribute("data-set-max"));
    var currency = sizer.getAttribute("data-currency");
    var briefUrl = sizer.getAttribute("data-brief");
    var countOut = sizer.querySelector("[data-count]");
    var whole = sizer.querySelector("[data-whole]");
    var sizeOut = sizer.querySelector("[data-size]");
    var feeOut = sizer.querySelector("[data-fee]");
    var timeOut = sizer.querySelector("[data-time]");
    var parade = sizer.querySelector("[data-parade]");
    var start = sizer.querySelector("[data-start]");
    var minus = sizer.querySelector('[data-step="-1"]');
    var plus = sizer.querySelector('[data-step="1"]');
    var count = 3;
    var maxCount = 12;

    var money = function (amount) {
      return currency + String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    var legs = '<path class="leg la" d="M22 52V78h7"/><path class="leg lb" d="M38 52V78h7"/>';
    var bodies = [
      '<rect class="b-card" x="12" y="6" width="36" height="47" rx="4"/><circle class="b-hot" cx="30" cy="24" r="9"/><rect class="b-ink" x="19" y="40" width="16" height="4" rx="2"/>',
      '<rect class="b-dark" x="5" y="20" width="50" height="33" rx="6"/><circle class="b-hot" cx="18" cy="36.500" r="5"/><rect class="b-mute" x="28" y="34" width="18" height="5" rx="2.500"/>',
      '<rect class="b-card" x="9" y="26" width="42" height="27" rx="4"/><path class="b-grid" d="M9 36h42M23 36v17M37 36v17"/><circle class="b-hot" cx="44" cy="45" r="3.500"/>',
      '<rect class="b-card" x="18" y="2" width="24" height="51" rx="4"/><circle class="b-hot" cx="30" cy="16" r="7"/><rect class="b-ink" x="24" y="34" width="12" height="4" rx="2"/>',
      '<circle class="b-hot-o" cx="30" cy="33" r="19"/><circle class="b-card" cx="30" cy="26" r="4"/>'
    ];
    var walker = function (index) {
      return '<svg class="walker" viewBox="0 0 60 84" aria-hidden="true">' + legs + '<g class="body">' + bodies[index % bodies.length] + "</g></svg>";
    };

    var render = function () {
      var kit = whole.checked || count > setMax;
      var label, fee, time;
      if (kit) {
        label = "A <em>Kit.</em>";
        fee = "Quoted per kit, within one working day";
        time = "Your delivery date comes with the quote.";
      } else if (count === 1) {
        label = "A <em>Single.</em>";
        fee = "Fixed fee from " + money(single);
        time = "First finished artwork within 24 hours, on working days.";
      } else {
        label = "A <em>Set.</em>";
        fee = "Fixed fee from " + money(single + further * (count - 1));
        time = "First finished artwork within 24 hours, on working days.";
      }
      countOut.textContent = count >= maxCount ? maxCount + "+" : String(count);
      sizeOut.innerHTML = label;
      feeOut.textContent = fee;
      timeOut.textContent = time;
      minus.disabled = count <= 1;
      plus.disabled = count >= maxCount;
      var html = "";
      for (var i = 0; i < count; i++) { html += walker(i); }
      parade.innerHTML = html;
      start.setAttribute("href", briefUrl + "?pieces=" + count + (whole.checked ? "&kit=1" : ""));
    };

    sizer.addEventListener("click", function (event) {
      var button = event.target.closest("[data-step]");
      if (!button) { return; }
      count = Math.min(maxCount, Math.max(1, count + Number(button.getAttribute("data-step"))));
      render();
    });
    whole.addEventListener("change", render);
    render();
  }
})();
