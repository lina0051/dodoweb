"use strict";
globalThis.SiteHeaderMarkup = String.raw`<header class="site-header" id="site-header">
  <a class="site-brand" href="index.html" aria-label="디자인코드 메인">
    <video class="site-logo-motion logo-motion" autoplay muted playsinline preload="auto" width="640" height="188" data-hold-time="4.4" aria-hidden="true"><source src="assets/brand/code-wordmark-black.webm" type="video/webm"></video>
    <img class="site-logo-still" src="assets/brand/code-wordmark-still.svg" width="640" height="188" alt="" aria-hidden="true">
  </a>
  <button class="site-menu-toggle" type="button" aria-label="메뉴 열기" aria-controls="primary-navigation" aria-expanded="false">
    <span></span><span></span>
  </button>
  <nav class="site-nav" id="primary-navigation" aria-label="주 메뉴">
    <a class="site-nav-item" data-nav-page="about-new" href="about-new.html">회사소개</a>
    <a class="site-nav-item" data-nav-page="work" href="work.html">프로젝트</a>
    <a class="site-nav-item" data-nav-page="process" href="process.html">프로세스</a>
    <a class="site-nav-cta" data-nav-page="contact" href="contact.html">상담신청 <span class="arr" aria-hidden="true">→</span></a>
  </nav>
</header>`;
