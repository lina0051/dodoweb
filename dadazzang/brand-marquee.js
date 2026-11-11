/* Pause and direct manipulation for the brand ribbon, without moving the page. */
(() => {
  const section = document.querySelector('[data-brand-marquee]');
  if (!section) return;
  const viewport = section.querySelector('.brand-marquee__viewport');
  const track = section.querySelector('.brand-marquee__track');
  // Keyboard focus reveals an off-screen link without requiring a full cycle.
  viewport.addEventListener('focusin', event => {
    const link = event.target.closest('.brand-marquee__link');
    if (link) link.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  let drag = null;
  let dragged = false;
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = track.getAnimations()[0];
    if (!animation) return;
    section.dataset.dragging = 'true';
    drag = { x: event.clientX, y: event.clientY, time: animation.currentTime, animation };
    dragged = false;
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (Math.abs(dx) <= 8 || Math.abs(dx) < Math.abs(event.clientY - drag.y)) return;
    dragged = true;
    const duration = drag.animation.effect.getTiming().duration;
    const distance = track.scrollWidth / 2;
    drag.animation.currentTime = ((drag.time - dx * duration / distance) % duration + duration) % duration;
  });
  const endDrag = () => { drag = null; delete section.dataset.dragging; };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('dragstart', event => event.preventDefault());
  document.addEventListener('click', event => {
    if (dragged && viewport.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); dragged = false; }
  }, true);
})();
