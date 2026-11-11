/* Search and browse the local catalogue; no account or store API is called. */
(() => {
  'use strict';
  const controls = document.querySelector('[data-catalog-controls]');
  if (!controls) return;

  const grid = document.querySelector('.catalog-page__grid');
  const search = document.querySelector('.site-header__search');
  const input = search.elements.keyword;
  const conditions = controls.querySelector('[data-catalog-conditions]');
  const clearQuery = controls.querySelector('[data-clear-query]');
  const brands = [...controls.querySelectorAll('[data-brand]')];
  const aliases = { SHIMOMURA: '시모무라', AMBAI: '암바이', KAICO: '카이코', ECHO: '에코', INOMATA: '이노마타', SANADA: '사나다' };
  const normalize = text => text.normalize('NFKC').toLocaleLowerCase('ko').replace(/[\s·-]+/g, '');
  const cards = [...grid.querySelectorAll('[data-product-card]')].map(element => {
    const name = element.querySelector('.product-info__title').textContent.trim();
    const brand = element.querySelector('.product-info__subtitle').textContent.trim();
    const number = new URL(element.href).searchParams.get('branduid');
    return { element, brand, text: normalize(`${name} ${brand} ${aliases[brand] || ''} ${number}`) };
  });
  let query = '', brand = '';

  function readLocation() {
    const params = new URL(location.href).searchParams;
    query = (params.get('q') || '').trim();
    brand = brands.some(button => button.dataset.brand === params.get('brand')) ? params.get('brand') : '';
    input.value = query;
  }

  function render(updateLocation = true) {
    const terms = query.split(/\s+/).map(normalize).filter(Boolean);
    let count = 0;
    for (const card of cards) {
      card.element.hidden = Boolean((brand && card.brand !== brand) || !terms.every(term => card.text.includes(term)));
      if (!card.element.hidden) count++;
    }
    const empty = document.querySelector('[data-catalog-empty]');
    empty.hidden = count !== 0;
    empty.textContent = brand && !query ? '현재 등록된 상품이 없습니다.' : '검색 결과가 없습니다. 다른 검색어나 브랜드를 선택해 주세요.';
    brands.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.brand === brand)));
    conditions.hidden = !query;
    clearQuery.hidden = !query;
    clearQuery.textContent = `검색어: ${query} · 해제`;
    clearQuery.setAttribute('aria-label', `검색어 ${query} 해제`);
    if (updateLocation) {
      const url = new URL(location.href);
      url.searchParams.delete('sort');
      for (const [key, value] of [['q', query], ['brand', brand]]) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      if (url.href !== location.href) history.pushState(null, '', url);
    }
  }

  brands.forEach(button => button.addEventListener('click', () => { brand = button.dataset.brand; render(); }));
  search.addEventListener('submit', event => { event.preventDefault(); query = input.value.trim(); render(); });
  input.addEventListener('search', () => { if (!input.value) { query = ''; render(); } });
  clearQuery.addEventListener('click', () => { query = ''; input.value = ''; render(); input.focus(); });
  addEventListener('popstate', () => { readLocation(); render(false); });
  readLocation();
  render(false);
})();
