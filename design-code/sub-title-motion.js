"use strict";
(() => {
  const title = document.querySelector("[data-sub-title-motion]");
  if (!title) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    title.classList.add("is-revealed");
    return;
  }

  const observer = new IntersectionObserver(entries => {
    const entry = entries[0];
    if (!entry?.isIntersecting) return;
    title.classList.add("is-revealed");
    observer.disconnect();
  }, { threshold: .2 });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => observer.observe(title));
  });
})();
