(function () {
  "use strict";
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 20) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var toReveal = document.querySelectorAll(".observe");
  if (toReveal.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      toReveal.forEach(function (el) { el.classList.add("reveal"); });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("reveal");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -30px 0px" }
      );
      toReveal.forEach(function (el) { io.observe(el); });
    }
  }

  var chips = document.querySelectorAll(".chip");
  var products = document.querySelectorAll(".product");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) {
        c.classList.remove("is-active");
        c.setAttribute("aria-pressed", "false");
      });
      chip.classList.add("is-active");
      chip.setAttribute("aria-pressed", "true");
      var filter = chip.getAttribute("data-filter");
      products.forEach(function (p) {
        var show = filter === "todos" || p.getAttribute("data-cat") === filter;
        p.classList.toggle("is-hidden", !show);
      });
    });
  });
})();
