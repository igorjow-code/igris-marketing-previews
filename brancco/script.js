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
  if (!toReveal.length) return;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    toReveal.forEach(function (el) { el.classList.add("reveal"); });
    return;
  }
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
  );
  toReveal.forEach(function (el) { io.observe(el); });
})();
