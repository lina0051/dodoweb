const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.HOME_TEST_URL || 'http://127.0.0.1:4173/';
const output = '.omx/artifacts/wide-main-slider/home';

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 2048]) {
      const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: 'reduce' });
      const errors = [], failed = [], external = [], requests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (!response.ok()) failed.push(response.url()); });
      page.on('request', request => {
        requests.push(request.url());
        if (new URL(request.url()).origin !== new URL(url).origin) external.push(request.url());
      });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(async () => { await document.fonts.ready; });
      assert.equal(await page.locator('[data-promotion-hero], [data-hero-slide], .promotion-hero, [data-hero-toggle]').count(), 0);
      assert.equal(await page.locator('link[href="hero.css"]').count(), 0);
      assert.ok(requests.some(url => url.endsWith('/main-slider.css')));
      assert.ok(requests.some(url => url.endsWith('/main-slider.js')));
      const quickMenu = page.locator('[data-quick-menu]');
      const home = quickMenu.locator('..');
      assert.equal(await home.locator(':scope > *').count(), 6);
      assert.equal(await home.locator(':scope > :first-child[data-main-slider]').count(), 1);
      assert.equal(await home.locator(':scope > :nth-child(2)[data-quick-menu]').count(), 1);
      const bestsellers = home.locator(':scope > :nth-child(3)[data-product-section="bestsellers"]');
      const mdPicks = home.locator(':scope > :nth-child(4)[data-product-section="md-pick"]');
      assert.equal(await home.locator(':scope > :nth-child(5)[data-brand-marquee]').count(), 1);
      assert.equal(await home.locator(':scope > :last-child[data-business-banners]').count(), 1);
      const about = page.locator('[data-about-section]');
      assert.equal(await about.locator('h2').innerText(), '16년간 쌓아온 경험,\n믿고 거래하는 도매 파트너');
      assert.equal(await about.evaluate(el => el.nextElementSibling.matches('.site-footer')), true);
      const aboutBox = await about.boundingBox();
      const footerBox = await page.locator('.site-footer').boundingBox();
      const businessBox = await page.locator('[data-business-banners]').boundingBox();
      assert.equal(aboutBox.x, 0);
      assert.equal(aboutBox.width, width);
      assert.ok(Math.abs(aboutBox.y - businessBox.y - businessBox.height - 100) < 1, 'business banners precede about section by100px');
      assert.ok(Math.abs(footerBox.y - aboutBox.y - aboutBox.height) < 1, 'about section meets footer without a gap');
      assert.equal(await bestsellers.locator('.product-section__title').textContent(), '추천 상품');
      assert.equal(await bestsellers.locator('.product-section__subtitle').count(), 0);
      assert.equal(await mdPicks.locator('.product-section__title').textContent(), '신상품');
      assert.equal(await mdPicks.locator('.product-section__subtitle').count(), 0);
      assert.equal(await quickMenu.locator('.quick-menu__item').count(), 6);
      const quickSpacing = await quickMenu.evaluate(menu => {
        const rect = element => element.getBoundingClientRect();
        const first = rect(menu.querySelector('.quick-menu__item'));
        const last = rect(menu.querySelector('.quick-menu__label'));
        const box = rect(menu);
        return {
          paddingTop: getComputedStyle(menu).paddingTop,
          paddingBottom: getComputedStyle(menu).paddingBottom,
          marginBottom: getComputedStyle(menu).marginBottom,
          top: first.top - box.top,
          bottom: box.bottom - last.bottom,
        };
      });
      assert.equal(quickSpacing.marginBottom, '0px', 'quick spacing has no negative gap compensation');
      assert.equal(quickSpacing.paddingTop, '100px');
      assert.equal(quickSpacing.paddingBottom, '160px');
      assert.ok(Math.abs(quickSpacing.top - 100) < 1);
      assert.ok(Math.abs(quickSpacing.bottom - 160) < 1);

      const menuLabels = await page.locator('.MAIN_HEADER').first().locator('ul').first().locator('a').allTextContents();
      assert.deepEqual(menuLabels.filter(label => label !== '홈'), ['전체 상품', '취급 브랜드', '다다짱 소개', '도매·위탁 안내', '대량 발주 문의']);
      const logo = await page.getByRole('link', { name: '다다짱 홈', exact: true }).boundingBox();
      const account = await page.locator('.header-account').boundingBox();
      const navigation = await page.getByRole('navigation', { name: '주 메뉴' }).boundingBox();
      const search = await page.getByRole('search', { name: '상품 검색' }).boundingBox();
      const icons = await page.locator('.site-header__icons').boundingBox();
      assert.ok(Math.abs(logo.y + logo.height / 2 - account.y - account.height / 2) < 2, 'logo and account controls share top row');
      assert.ok(navigation.y > logo.y + logo.height, 'navigation is below logo');
      assert.ok(Math.abs(navigation.y + navigation.height / 2 - search.y - search.height / 2) < 2, 'navigation and search share bottom row');
      assert.ok(navigation.x + navigation.width < search.x && search.x + search.width < icons.x, 'navigation, search and icons do not overlap');
      assert.ok(icons.x + icons.width <= width, 'header controls fit viewport');
      assert.equal(await page.getByRole('button', { name: '카테고리', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: '마이페이지', exact: true }).count(), 1);
      assert.equal(await page.getByRole('button', { name: '장바구니 0개', exact: true }).count(), 1);
      const headerInner = await page.locator('.site-header__inner').boundingBox();
      const products = await bestsellers.locator('.bestseller-grid').boundingBox();
      assert.ok(Math.abs(headerInner.x - products.x) < 1, 'header and product content share left edge');
      assert.ok(Math.abs(headerInner.x + headerInner.width - products.x - products.width) < 1, 'header and product content share right edge');
      const header = await page.locator('.MAIN_HEADER').first().boundingBox();
      const menu = await quickMenu.boundingBox();
      const slider = await page.locator('[data-main-slider]').boundingBox();
      assert.ok(Math.abs(slider.y - header.y - header.height) < 2, 'main slider begins directly after the header');
      assert.ok(Math.abs(menu.y - slider.y - slider.height) < 2, 'quick menu begins directly after the slider');
      for (const section of [bestsellers, mdPicks]) {
        assert.equal(await section.locator('[data-product-card]:visible').count(), 8);
        assert.deepEqual(await section.locator('.product-info__price:visible').allTextContents(), Array(8).fill('회원공개'));
        const boxes = await section.locator('[data-product-card]:visible .bestseller-thumbnail').evaluateAll(elements => elements.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }));
        assert.equal(new Set(boxes.map(box => box.x)).size, 4);
        assert.equal(new Set(boxes.map(box => box.y)).size, 2);
        assert.ok(boxes.every(box => Math.abs(box.width - box.height) < 1));
      }
    const expectedProducts = [
      [bestsellers, ['841537', '1066653', '1046001', '804733', '1190340', '786156', '1182449', '1190060']],
      [mdPicks, ['1202277', '11910766', '11910763', '11910762', '1204056', '1204055', '959677', '1203494']],
    ];
    for (const [section, ids] of expectedProducts) {
      const cards = section.locator('[data-product-card]:visible');
      assert.deepEqual(await cards.evaluateAll(cards => cards.map(card => card.href)), ids.map(id => `https://www.dadazzang.co.kr/shop/shopdetail.html?branduid=${id}`));
      assert.equal(await cards.locator('.image__roll-over').count(), 0);
      for (const [index, id] of ids.entries()) {
        const image = cards.nth(index).locator('img');
        const representative = ['841537', '1066653', '1046001', '804733'].includes(id);
        const source = await image.getAttribute('src');
        if (representative) assert.equal(source, `assets/products/${id}_representative_001.jpg`);
        else assert.ok(source.startsWith(`assets/products/dadazzang-${id}.`));
        await image.evaluate(async image => { image.loading = 'eager'; await image.decode(); });
        assert.ok(await image.evaluate(image => image.naturalWidth > 0 && getComputedStyle(image).objectFit === 'cover'));
        assert.equal(await image.getAttribute('alt'), await cards.nth(index).locator('.product-info__title').textContent());
      }
    }
      await page.screenshot({ path: `${output}/after-${width}.png`, fullPage: true });
      await quickMenu.getByRole('link', { name: '전체 상품', exact: true }).click();
      await page.waitForURL('**/products.html');
      assert.equal(await page.title(), '전체 상품 | 다다짱');
      await page.goBack({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('#local-notice[role="status"]').count(), 0);
      const productLink = bestsellers.locator('[data-product-card]').first();
      await productLink.evaluate(link => link.addEventListener('click', event => event.preventDefault(), { once: true }));
      await productLink.dispatchEvent('click', { button: 0, cancelable: true });
      assert.equal(await productLink.getAttribute('target'), '_self');
      assert.equal(await productLink.getAttribute('aria-disabled'), 'true');
      assert.deepEqual(errors, []);
      assert.deepEqual(failed, []);
      assert.deepEqual(external, []);
      console.log(`PASS ${width}px: wide slider, header → slider → quick menu → BEST → NEW → brands, 16 product images/links, cover sizing, generic notice suppressed, no page/network errors.`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
