/* Preview only. Production collection belongs to the Imweb input-form widget. */
(() => {
  'use strict';
  const form = document.querySelector('.bulk-form');
  if (!form) return;
  const status = form.querySelector('[role="status"]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    status.textContent = '입력 내용을 확인했습니다. 현재는 화면 시안으로, 실제 문의는 접수되지 않습니다.';
    status.hidden = false;
  });
  form.addEventListener('input', () => { status.hidden = true; });
})();
