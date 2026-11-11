/* Wide brand banners: images, copy and links remain independently editable in HTML. */
(() => {
  'use strict';
  document.querySelectorAll('[data-main-slider]').forEach(slider => {
    const viewport = slider.querySelector('.main-slider__viewport');
    const track = slider.querySelector('.main-slider__track');
    const originals = [...track.querySelectorAll('[data-main-slide]')];
    if (originals.length < 2) return;
    const count = originals.length;
    const cloneCount = Math.min(2, count);
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const toggle = slider.querySelector('[data-main-toggle]');
    const status = slider.querySelector('[data-main-status]');
    const clone = slide => {
      const copy = slide.cloneNode(true);
      copy.dataset.mainClone = 'true';
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      return copy;
    };
    track.prepend(...originals.slice(-cloneCount).map(clone));
    track.append(...originals.slice(0, cloneCount).map(clone));
    const slides = [...track.children];
    let index = 0, position = cloneCount;
    let moving = false, paused = false, hovered = false, focused = false, pointer = null;
    let timer, settleTimer, frame, suppressClickUntil = 0, restoreLinkFocus = false;
    const playback = () => {
      clearTimeout(timer);
      const stopped = paused || hovered || focused || moving || pointer || document.hidden || reducedMotion.matches;
      slider.dataset.autoplay = stopped ? 'paused' : 'playing';
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? '슬라이드 자동재생 시작' : '슬라이드 자동재생 일시정지');
      if (!stopped) timer = setTimeout(() => move(1, false), 5000);
    };
    const draw = (animate = false) => {
      cancelAnimationFrame(frame);
      slider.classList.toggle('is-resetting', !animate);
      const width = originals[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.style.transform = `translate3d(${(viewport.clientWidth - width) / 2 - position * (width + gap)}px,0,0)`;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === position);
        if (Math.abs(i - position) <= 1) slide.querySelector('img').loading = 'eager';
      });
      originals.forEach((slide, i) => {
        slide.inert = i !== index;
        if (i === index) {
          slide.removeAttribute('aria-hidden');
          slide.setAttribute('aria-current', 'true');
        } else {
          slide.setAttribute('aria-hidden', 'true');
          slide.removeAttribute('aria-current');
        }
      });
      slider.dataset.slideIndex = String(index);
      if (!animate) {
        void track.offsetWidth;
        frame = requestAnimationFrame(() => slider.classList.remove('is-resetting'));
      }
    };
    const finish = () => {
      if (!moving) return;
      clearTimeout(settleTimer);
      moving = false;
      if (position < cloneCount || position >= count + cloneCount) {
        position = index + cloneCount;
        draw(false);
      }
      if (restoreLinkFocus) {
        restoreLinkFocus = false;
        originals[index].querySelector('a').focus({ preventScroll: true });
      }
      playback();
    };
    const move = (delta, manual = true) => {
      if (moving || !delta) return;
      restoreLinkFocus = Boolean(document.activeElement?.closest('[data-main-slide]'));
      index = (index + delta + count) % count;
      position += delta;
      moving = !reducedMotion.matches;
      draw(moving);
      if (manual) status.textContent = originals[index].getAttribute('aria-label');
      if (moving) settleTimer = setTimeout(finish, 680);
      else {
        position = index + cloneCount;
        draw(false);
        if (restoreLinkFocus) {
          restoreLinkFocus = false;
          originals[index].querySelector('a').focus({ preventScroll: true });
        }
      }
      playback();
    };
    slider.querySelector('[data-main-prev]').addEventListener('click', () => move(-1));
    slider.querySelector('[data-main-next]').addEventListener('click', () => move(1));
    toggle.addEventListener('click', () => { paused = !paused; playback(); });
    track.addEventListener('transitionend', event => { if (event.target === track && event.propertyName === 'transform') finish(); });
    slider.addEventListener('keydown', event => {
      const delta = { ArrowLeft: -1, ArrowRight: 1, Home: -index, End: count - 1 - index }[event.key];
      if (delta !== undefined) { event.preventDefault(); move(delta); }
    });
    slider.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; playback(); } });
    slider.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovered = false; playback(); } });
    slider.addEventListener('focusin', () => { focused = true; playback(); });
    slider.addEventListener('focusout', () => queueMicrotask(() => { focused = slider.contains(document.activeElement); playback(); }));
    viewport.addEventListener('pointerdown', event => {
      if (event.isPrimary && event.button === 0) { pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; playback(); }
    });
    const endPointer = event => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      pointer = null;
      if (event.type === 'pointerup' && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        suppressClickUntil = performance.now() + 400;
        move(dx < 0 ? 1 : -1);
      }
      playback();
    };
    addEventListener('pointerup', endPointer);
    addEventListener('pointercancel', endPointer);
    viewport.addEventListener('dragstart', event => event.preventDefault());
    viewport.addEventListener('click', event => { if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); } }, true);
    const reflow = () => {
      clearTimeout(settleTimer);
      moving = false;
      position = index + cloneCount;
      draw(false);
      playback();
    };
    new ResizeObserver(reflow).observe(viewport);
    reducedMotion.addEventListener('change', reflow);
    document.addEventListener('visibilitychange', playback);
    draw(false);
    slider.dataset.ready = 'true';
    playback();
  });
})();
