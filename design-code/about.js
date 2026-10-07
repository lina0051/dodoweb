"use strict";
(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const counters = [...document.querySelectorAll("[data-count]")];
  const projectGallery = document.querySelector("[data-project-gallery]");

  const setupProjectGallery = () => {
    if (!projectGallery) return;

    const viewport = projectGallery.querySelector(".about-project-rail__viewport");
    const track = projectGallery.querySelector(".about-project-rail__track");
    if (!viewport || !track) return;

    if (reduceMotion || !("IntersectionObserver" in window) || !("ResizeObserver" in window)) {
      projectGallery.classList.add("is-static");
      return;
    }

    let frameId = 0;
    let isActive = false;
    let travel = 0;

    const update = () => {
      const stickyTop = innerWidth <= 768 ? 64 : 96;
      const scrollDistance = Math.max(projectGallery.offsetHeight - viewport.offsetHeight, 1);
      const progress = Math.min(Math.max((stickyTop - projectGallery.getBoundingClientRect().top) / scrollDistance, 0), 1);
      track.style.setProperty("--rail-x", `${(-travel * progress).toFixed(2)}px`);
      projectGallery.dataset.galleryProgress = progress.toFixed(4);
      if (isActive) frameId = requestAnimationFrame(update);
    };

    const measure = () => {
      travel = Math.max(track.scrollWidth - viewport.clientWidth, 0);
      projectGallery.style.setProperty("--rail-travel", `${travel.toFixed(2)}px`);
      projectGallery.classList.toggle("is-static", travel === 0);
      projectGallery.dataset.galleryReady = "true";
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(update);
    };

    const visibilityObserver = new IntersectionObserver(entries => {
      isActive = entries[0]?.isIntersecting ?? false;
      cancelAnimationFrame(frameId);
      if (isActive) frameId = requestAnimationFrame(update);
    }, { rootMargin: "10% 0px" });

    const resizeObserver = new ResizeObserver(measure);
    visibilityObserver.observe(projectGallery);
    resizeObserver.observe(viewport);
    resizeObserver.observe(track);
    measure();
  };

  setupProjectGallery();

  const setupSectionReveals = () => {
    const page = document.querySelector(".about-page");
    if (!page || reduceMotion || !("IntersectionObserver" in window)) return;

    const revealSets = [
      { selector: ".about-studio__title", variant: "studio-title", step: 0, delay: 80 },
      { selector: ".about-studio__content", variant: "studio-content", step: 0, delay: 230 },
      { selector: "[data-project-gallery]", variant: "gallery", step: 0 },
      { selector: ".metrics-heading h2", variant: "heading", step: 0 },
      { selector: ".metric-list .metric-item", variant: "metric", step: 90 },
      { selector: ".difference-detail .section-heading > *", variant: "heading", step: 90 },
      { selector: ".difference-list .difference-item", variant: "difference", step: 75 },
      { selector: ".service-detail .about-section-heading > *", variant: "heading", step: 90 },
      { selector: ".service-list .service-item", variant: "service", step: 55 }
    ];
    const revealItems = [];

    revealSets.forEach(({ selector, variant, step, delay = 0 }) => {
      document.querySelectorAll(selector).forEach((item, index) => {
        item.classList.add("about-reveal-item", `about-reveal-item--${variant}`);
        item.style.setProperty("--about-reveal-delay", `${delay + Math.min(index, 5) * step}ms`);
        revealItems.push(item);
      });
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: "0px 0px -8% 0px" });

    page.classList.add("motion-ready");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => revealItems.forEach(item => observer.observe(item)));
    });
  };

  setupSectionReveals();

  const setFinalValues = () => counters.forEach(counter => {
    counter.textContent = counter.dataset.count;
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    setFinalValues();
    return;
  }

  const animateCounter = counter => {
    const target = Number(counter.dataset.count);
    const duration = 1100;
    const start = performance.now();
    counter.textContent = "0";

    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      counter.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: .45 });

  counters.forEach(counter => counterObserver.observe(counter));
})();
