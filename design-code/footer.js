"use strict";
void (async () => {
  const root = document.querySelector("#site-footer-root");
  if (!root) return;
  const fallbackMarkup = globalThis.SiteFooterMarkup;

  const prepareMotion = footer => {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      footer.classList.add("is-revealed");
      return;
    }

    const title = footer.querySelector("#footer-contact-title");
    if (title) {
      const label = title.textContent.trim();
      title.setAttribute("aria-label", label);
      title.replaceChildren(...Array.from(label, (character, index) => {
        const span = document.createElement("span");
        span.className = "footer-title-char";
        span.setAttribute("aria-hidden", "true");
        span.style.setProperty("--footer-char-index", index);
        span.textContent = character;
        return span;
      }));
    }

    footer.classList.add("footer-motion-ready");
    const main = document.querySelector("main");
    const sentinel = main ? document.createElement("span") : null;
    if (sentinel) {
      sentinel.className = "footer-motion-sentinel";
      sentinel.setAttribute("aria-hidden", "true");
      main.append(sentinel);
    }

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      footer.classList.add("is-revealed");
      observer.disconnect();
      sentinel?.remove();
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    observer.observe(sentinel || footer);
  };

  try {
    let markup;
    if (location.protocol === "file:") {
      if (!fallbackMarkup) throw new Error("파일 미리보기용 푸터가 없습니다.");
      markup = fallbackMarkup;
    } else {
      const response = await fetch("footer.html?v=20261002-common-v5");
      if (!response.ok) throw new Error(`공통 푸터를 불러오지 못했습니다. (${response.status})`);
      markup = await response.text();
    }

    const template = document.createElement("template");
    template.innerHTML = markup.trim();
    const footer = template.content.firstElementChild;
    if (!footer) throw new Error("공통 푸터 마크업이 비어 있습니다.");
    root.replaceWith(footer);
    prepareMotion(footer);
  } catch (error) {
    if (!fallbackMarkup) return console.error(error);

    const template = document.createElement("template");
    template.innerHTML = fallbackMarkup.trim();
    const footer = template.content.firstElementChild;
    if (!footer) return console.error(error);
    root.replaceWith(footer);
    prepareMotion(footer);
  }
})();
