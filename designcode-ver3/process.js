"use strict";
(() => {
  const phases = [...document.querySelectorAll(".process-phase")];
  const images = [...document.querySelectorAll(".process-card img")];

  for (const image of images) {
    const markError = () => image.closest(".process-card")?.classList.add("has-image-error");
    image.addEventListener("error", markError, { once: true });
    if (image.complete && image.naturalWidth === 0) markError();
  }

  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    phases.forEach(phase => phase.classList.add("is-revealed"));
    return;
  }

  document.body.classList.add("motion-ready");
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    }
  }, { threshold: .12 });

  phases.forEach(phase => observer.observe(phase));
})();
