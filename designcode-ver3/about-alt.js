"use strict";

(() => {
  const counters = [...document.querySelectorAll("[data-count]")];
  const projectTrack = document.querySelector(".about-alt-project-track");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const counter = entry.target;
        const target = Number(counter.dataset.count);
        const start = performance.now();
        const duration = 950;

        const update = now => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          counter.textContent = String(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(update);
        };

        counter.textContent = "0";
        requestAnimationFrame(update);
        observer.unobserve(counter);
      });
    }, { threshold: .6 });

    counters.forEach(counter => observer.observe(counter));
  }

  if (!projectTrack) return;

  let pointerStart = 0;
  let scrollStart = 0;

  projectTrack.addEventListener("pointerdown", event => {
    pointerStart = event.clientX;
    scrollStart = projectTrack.scrollLeft;
    projectTrack.setPointerCapture(event.pointerId);
  });

  projectTrack.addEventListener("pointermove", event => {
    if (!projectTrack.hasPointerCapture(event.pointerId)) return;
    projectTrack.scrollLeft = scrollStart - (event.clientX - pointerStart);
  });
})();
