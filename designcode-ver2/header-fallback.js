"use strict";
globalThis.SiteHeaderMarkup = String.raw`<header class="site-header" id="site-header">
  <svg class="site-logo-filter-defs" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <filter id="logo-black-layers" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
        <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="luminance"></feColorMatrix>
        <feComponentTransfer in="luminance" result="light-threshold">
          <feFuncA type="discrete" tableValues="0 1"></feFuncA>
        </feComponentTransfer>
        <feComposite in="light-threshold" in2="SourceAlpha" operator="in" result="light-mask"></feComposite>
        <feComposite in="SourceAlpha" in2="light-threshold" operator="out" result="dark-mask"></feComposite>
        <feFlood flood-color="#000000" result="solid-black"></feFlood>
        <feComposite in="solid-black" in2="dark-mask" operator="in" result="solid-segments"></feComposite>
        <feFlood flood-color="#000000" flood-opacity=".1" result="soft-black"></feFlood>
        <feComposite in="soft-black" in2="light-mask" operator="in" result="soft-segments"></feComposite>
        <feMerge><feMergeNode in="soft-segments"></feMergeNode><feMergeNode in="solid-segments"></feMergeNode></feMerge>
      </filter>
    </defs>
  </svg>
  <a class="site-brand" href="index.html" aria-label="디자인코드 메인">
    <video class="site-logo-motion logo-motion" autoplay muted playsinline preload="auto" width="640" height="188" data-hold-time="4.4" aria-hidden="true"><source src="assets/brand/code-wordmark-loop.webm" type="video/webm"></video>
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
