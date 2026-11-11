/* Keep the navigation row visible without changing the page's header spacing. */
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const upperRows = [header.querySelector('.site-header__announcement'), header.querySelector('.site-header__top')];
  const collapseAt = upperRows.reduce((height, row) => height + (row?.offsetHeight || 0), 0);
  let scheduled = false;

  const update = () => {
    header.classList.toggle('site-header--compact', window.scrollY > collapseAt);
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('pageshow', update);
  update();
})();
