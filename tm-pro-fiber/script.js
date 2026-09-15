document.documentElement.classList.add("js");

const nav = document.querySelector(".nav");
const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");

const updateNav = () => nav?.classList.toggle("is-scrolled", window.scrollY > 18);
updateNav();
window.addEventListener("scroll", updateNav, { passive: true });

menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  navLinks?.classList.toggle("is-open", !open);
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("is-open");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || menuButton?.getAttribute("aria-expanded") !== "true") return;
  menuButton.setAttribute("aria-expanded", "false");
  navLinks?.classList.remove("is-open");
  menuButton.focus();
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reveals = document.querySelectorAll("[data-reveal]");

if (reducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );
  reveals.forEach((element) => observer.observe(element));
}

const form = document.querySelector("#project-form");
const formNotice = document.querySelector("#form-notice");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  formNotice.hidden = false;
  formNotice.focus();
});
