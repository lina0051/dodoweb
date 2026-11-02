"use strict";
(() => {
  const body = document.querySelector(".about-new-body");
  if (!body) return;
  const sections = [...body.querySelectorAll(".about-metrics, .difference-detail, .service-detail")];
  const desktop = matchMedia("(min-width: 1025px)");
  let frame;

  const matchSectionHeights = () => {
    body.style.removeProperty("--about-section-height");
    if (!desktop.matches) return;
    const height = Math.ceil(Math.max(...sections.map(section => section.getBoundingClientRect().height)));
    body.style.setProperty("--about-section-height", `${height}px`);
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(matchSectionHeights);
  };

  addEventListener("resize", schedule, { passive: true });
  addEventListener("load", schedule, { once: true });
  document.fonts.ready.then(schedule);
  schedule();
})();
