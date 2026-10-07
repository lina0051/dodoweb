"use strict";
void (async () => {
  const root = document.querySelector("#site-header-root");
  if (!root) return;

  const currentPage = root.dataset.currentPage;
  const fallbackMarkup = globalThis.SiteHeaderMarkup;
  let markup;
  try {
    if (location.protocol === "file:") {
      if (!fallbackMarkup) throw new Error("파일 미리보기용 헤더가 없습니다.");
      markup = fallbackMarkup;
    } else {
      const response = await fetch("header.html?v=20261007-logo-black-v3");
      if (!response.ok) throw new Error(`공통 헤더를 불러오지 못했습니다. (${response.status})`);
      markup = await response.text();
    }
  } catch (error) {
    if (!fallbackMarkup) {
      console.error(error);
      return;
    }
    markup = fallbackMarkup;
  }

  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  const header = template.content.firstElementChild;
  if (!header) return console.error("공통 헤더 마크업이 비어 있습니다.");
  root.replaceWith(header);

  header.querySelector(`[data-nav-page="${currentPage}"]`)?.setAttribute("aria-current", "page");

  const logoVideo = header.querySelector(".logo-motion");
  const holdTime = Number(logoVideo.dataset.holdTime);
  const playLogoOnce = () => {
    logoVideo.currentTime = 0;
    logoVideo.play().catch(() => {});
  };
  logoVideo.addEventListener("timeupdate", () => {
    if (Number.isFinite(holdTime) && logoVideo.currentTime >= holdTime) logoVideo.pause();
  });
  if (logoVideo.readyState >= 2) playLogoOnce();
  else logoVideo.addEventListener("canplay", playLogoOnce, { once: true });

  const menuToggle = header.querySelector(".site-menu-toggle");
  const navigation = header.querySelector(".site-nav");

  function closeMenu() {
    document.body.classList.remove("site-menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "메뉴 열기");
  }

  menuToggle.addEventListener("click", () => {
    const open = !document.body.classList.contains("site-menu-open");
    document.body.classList.toggle("site-menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  });

  navigation.addEventListener("click", event => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.body.classList.contains("site-menu-open")) {
      closeMenu();
      menuToggle.focus();
    }
  });

  matchMedia("(min-width: 769px)").addEventListener("change", event => {
    if (event.matches) closeMenu();
  });

  const updateHeader = () => header.classList.toggle("is-scrolled", scrollY > 16);
  addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  document.dispatchEvent(new CustomEvent("site-header:ready", { detail: { currentPage } }));
})();
