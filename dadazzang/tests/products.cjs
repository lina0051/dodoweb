const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.HOME_TEST_URL || 'http://127.0.0.1:4173/';
const output = '.omx/artifacts/catalog-controls';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 2048]) {
      const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: 'reduce' });
      const errors = [], failed = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (!response.ok()) failed.push(response.url()); });
      await page.goto(base, { waitUntil: 'networkidle' });
      const shared = await page.evaluate(() => ({ header: document.querySelector('.site-header').outerHTML, footer: document.querySelector('.site-footer').outerHTML, brands: [...new Set([...document.querySelectorAll('[data-brand-name]')].map(el => el.dataset.brandName))] }));
      await page.locator('.site-header__menu a').filter({ hasText: '전체 상품' }).click();
      await page.waitForURL('**/products.html');
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.title(), '전체 상품 | 다다짱');
      assert.equal(await page.locator('.catalog-page h1').count(), 1);
      assert.equal(await page.locator('.catalog-page h1').innerText(), '전체 상품');
      assert.equal(await page.locator('.catalog-page__breadcrumb').count(), 0);
      const tabBrands = await page.locator('[data-brand]').evaluateAll(buttons => buttons.map(button => button.dataset.brand));
      assert.deepEqual(tabBrands, ['', ...shared.brands, 'KOHBEC']);
      assert.equal(await page.locator('.site-header').evaluate(el => el.outerHTML), shared.header);
      assert.equal(await page.locator('.site-footer').evaluate(el => el.outerHTML), shared.footer);
      const cards = page.locator('[data-product-card]');
      const originalOrder = await cards.locator('.product-info__title').allTextContents();
      assert.equal(await page.locator('.catalog-controls__toolbar, [data-catalog-count], [data-catalog-sort]').count(), 0);
      assert.equal(await cards.count(), 16);
      assert.equal(await page.locator('[data-product-card]:visible').count(), 16);
      assert.deepEqual(await cards.locator('.product-info__price').allTextContents(), Array(16).fill('회원공개'));
      const images = cards.locator('img');
      await images.evaluateAll(imgs => Promise.all(imgs.map(async img => { img.loading = 'eager'; await img.decode(); })));
      assert.ok(await images.evaluateAll(imgs => imgs.every(img => img.naturalWidth > 0 && img.getAttribute('src').startsWith('assets/products/'))));
      const geometry = await page.evaluate(() => {
        const box = selector => document.querySelector(selector).getBoundingClientRect();
        const grid = box('.catalog-page__grid'), header = box('.site-header__inner'), footer = box('.site-footer__inner');
        const cards = [...document.querySelectorAll('[data-product-card]')].map(el => el.getBoundingClientRect());
        return { gridWidth: grid.width, left: [grid.left, header.left, footer.left], columns: new Set(cards.map(r => r.x)).size, rows: new Set(cards.map(r => r.y)).size, afterHeader: box('.catalog-controls__brands').top >= box('.site-header').bottom, bottomGap: box('.site-footer').top - Math.max(...cards.map(r => r.bottom)), square: [...document.querySelectorAll('.bestseller-thumbnail')].every(el => Math.abs(el.offsetWidth - el.offsetHeight) < 1) };
      });
      assert.equal(geometry.gridWidth, 1400);
      assert.ok(geometry.left.every(value => Math.abs(value - geometry.left[0]) < 1));
      assert.equal(geometry.columns, 4);
      assert.equal(geometry.rows, 4);
      assert.ok(geometry.afterHeader && geometry.square);
      assert.ok(Math.abs(geometry.bottomGap - 100) < 1);
      assert.equal(await page.locator('form[role="search"]').count(), 1);
      const controls = await page.evaluate(() => {
        const box = selector => document.querySelector(selector).getBoundingClientRect();
        const pills = [...document.querySelectorAll('[data-brand]')].map(el => el.getBoundingClientRect());
        const rows = [...new Set(pills.map(pill => pill.top))].map(top => pills.filter(pill => pill.top === top));
        return { rowLefts: rows.map(row => row[0].left), contentLeft: box('.catalog-page__grid').left, pillGap: box('.catalog-page__grid').top - Math.max(...pills.map(pill => pill.bottom)) };
      });
      assert.ok(controls.rowLefts.every(left => Math.abs(left - controls.contentLeft) < 1));
      assert.equal(controls.pillGap, 48);
      await page.screenshot({ path: `${output}/catalog-${width}.png`, fullPage: true });

      const visible = page.locator('[data-product-card]:visible');
      const clearConditions = async () => {
        await page.locator('[data-brand=""]').click();
        if (await page.locator('[data-clear-query]').isVisible()) await page.locator('[data-clear-query]').click();
      };
      assert.equal(await page.locator('[data-clear-brand], [data-catalog-reset]').count(), 0);
      for (const brand of ['YOSHIKAWA', 'PEARL LIFE', 'YAMADAKEN', 'TSUBAME', 'TODAI', 'NAKAYA', 'NAGAO', 'AKEBONO', 'KOKUBO']) {
        await page.locator(`[data-brand="${brand}"]`).click();
        assert.equal(await visible.count(), 0);
        assert.equal(await page.locator('[data-catalog-empty]').innerText(), '현재 등록된 상품이 없습니다.');
        assert.equal(await page.locator(`[data-brand="${brand}"]`).getAttribute('aria-pressed'), 'true');
      }
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('[data-brand="KOKUBO"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await visible.count(), 0);
      await page.screenshot({ path: `${output}/empty-brand-${width}.png`, fullPage: false });
      assert.ok(await page.locator('[data-catalog-conditions]').isHidden());
      await clearConditions();
      assert.equal(await visible.count(), 16);
      for (const [brand, expected] of [['SHIMOMURA', 6], ['AMBAI', 1], ['KAICO', 1], ['ECHO', 5], ['INOMATA', 1], ['SANADA', 1], ['KOHBEC', 1]]) {
        await page.locator(`[data-brand="${brand}"]`).click();
        assert.equal(await visible.count(), expected);
        assert.deepEqual(await visible.locator('.product-info__subtitle').allTextContents(), Array(expected).fill(brand));
        assert.equal(await page.locator(`[data-brand="${brand}"]`).getAttribute('aria-pressed'), 'true');
      }
      await clearConditions();
      const searchInput = page.locator('.site-header__search input');
      await searchInput.fill('SHIMOMURA');
      await searchInput.press('Enter');
      assert.equal(await visible.count(), 6);
      await searchInput.fill('sfs-102');
      await page.locator('.site-header__search button').click();
      assert.equal(await visible.count(), 1);
      assert.ok((await visible.first().getAttribute('href')).includes('841537'));
      await page.locator('[data-brand="KAICO"]').click();
      assert.equal(await visible.count(), 0);
      assert.ok(await page.locator('[data-catalog-empty]').isVisible());
      assert.ok(await page.locator('[data-clear-query]').isVisible());
      await page.locator('[data-brand=""]').click();
      assert.equal(await visible.count(), 1);
      await page.goBack();
      await page.waitForFunction(() => [...document.querySelectorAll('[data-product-card]')].every(card => card.hidden));
      await clearConditions();
      assert.equal(await visible.count(), 16);
      await searchInput.fill('841537');
      await searchInput.press('Enter');
      assert.equal(await visible.count(), 1);
      await page.locator('[data-clear-query]').click();
      assert.equal(await visible.count(), 16);
      assert.equal(await searchInput.inputValue(), '');
      assert.ok(await page.locator('[data-catalog-conditions]').isHidden());
      assert.deepEqual(await cards.locator('.product-info__title').allTextContents(), originalOrder);
      await page.locator('[data-brand="SHIMOMURA"]').click();
      await page.screenshot({ path: `${output}/filtered-${width}.png`, fullPage: false });
      assert.equal(await page.locator('#local-notice:visible').count(), 0);
      await page.locator('.site-footer__logo').click();
      await page.waitForURL('**/index.html');
      assert.equal(await page.locator('[data-main-slider]').count(), 1);
      await page.locator('.site-header__search input').fill('카이코');
      await page.locator('.site-header__search input').press('Enter');
      await page.waitForURL('**/products.html?q=*');
      await page.waitForLoadState('networkidle');
      assert.equal(await visible.count(), 1);
      assert.equal(await visible.locator('.product-info__subtitle').innerText(), 'KAICO');
      assert.deepEqual(errors, []);
      assert.deepEqual(failed, []);
      console.log(`PASS ${width}px: all16brands incl.9empty brands, left-aligned wrapping, shared page heading, removed count/sort toolbar and breadcrumb, shared layout, header search, combined filters, empty state, reset, original order, URL reload/back and home search; no errors.`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
