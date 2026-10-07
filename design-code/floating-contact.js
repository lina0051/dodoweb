'use strict';
(() => {
  const contact = document.createElement('nav');
  contact.className = 'floating-contact';
  contact.setAttribute('aria-label', '빠른 상담');
  contact.innerHTML = `
    <a class="floating-contact-link floating-contact-link--kakao" href="https://pf.kakao.com/_QGLVX/chat" target="_blank" rel="noopener noreferrer" aria-label="카카오톡 상담 (새 창)">
      <svg viewBox="0 0 56 56" aria-hidden="true" focusable="false">
        <path d="M17.536 18.605C14.51 21.008 13 23.909 13 27.31c0 2.739.981 5.154 2.941 7.244.485.517 1.018 1.006 1.595 1.463.234.186.48.366.739.538L17.826 42l5.998-2.898a19.52 19.52 0 0 0 4.271.518h.396c4.293 0 7.949-1.201 10.974-3.604C42.487 33.613 44 30.711 44 27.31c0-3.401-1.512-6.303-4.536-8.705C36.44 16.201 32.784 15 28.49 15c-4.278 0-7.93 1.201-10.954 3.605Z" fill="currentColor"/>
      </svg>
    </a>
    <a class="floating-contact-link floating-contact-link--sms" href="sms:01041663194" aria-label="문자 상담 010-4166-3194">
      <svg viewBox="0 0 56 56" aria-hidden="true" focusable="false">
        <path d="M17 15h22a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H27l-8 6v-6h-2a4 4 0 0 1-4-4V19a4 4 0 0 1 4-4Z" fill="currentColor"/>
        <g fill="#000"><circle cx="21" cy="26.5" r="1.8"/><circle cx="28" cy="26.5" r="1.8"/><circle cx="35" cy="26.5" r="1.8"/></g>
      </svg>
    </a>`;
  document.body.append(contact);
})();
