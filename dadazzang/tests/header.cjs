const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.HOME_TEST_URL || 'http://127.0.0.1:4173/';
const output = '.omx/artifacts/compact-header';

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 2048]) {
      for (const path of ['index.html', 'products.html']) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(new URL(path, base).href);
        await page.evaluate(() => document.fonts.ready);
        const header = page.locator('.site-header');
        const content = page.locator(path === 'index.html' ? '[data-main-slider]' : '.catalog-page');
        const documentTop = () => content.evaluate(el => el.getBoundingClientRect().top + scrollY);
        const initialTop = await documentTop();
        assert.equal((await header.boundingBox()).height, 172);
        assert.equal(await page.getByRole('button', { name: '로그인', exact: true }).isVisible(), true);

        await page.evaluate(() => scrollTo({ top: 500, behavior: 'instant' }));
        await page.waitForFunction(() => document.querySelector('.site-header').classList.contains('site-header--compact'));
        const compact = await header.boundingBox();
        assert.equal(compact.y, 0);
        assert.equal(compact.height, 64);
        assert.equal(await page.locator('.site-header__announcement').isVisible(), false);
        assert.equal(await page.locator('.site-header__logo').isVisible(), false);
        assert.equal(await page.getByRole('button', { name: '회원가입', exact: true }).isVisible(), false);
        assert.equal(await documentTop(), initialTop, 'collapsing the header must not move page content');
        for (const selector of ['.site-header__nav', '.site-header__search', '.site-header__icons']) {
          const box = await page.locator(selector).boundingBox();
          assert.ok(box.y >= 0 && box.y + box.height <= 64 && box.x + box.width <= width);
        }
        const search = page.getByRole('searchbox');
        await search.focus();
        assert.equal(await search.evaluate(el => el === document.activeElement), true);
        const menu = page.getByRole('link', { name: '전체 상품 카테고리', exact: true });
        assert.equal(await menu.getAttribute('href'), 'products.html');
        await menu.focus();
        assert.equal(await menu.evaluate(el => el === document.activeElement), true);
        assert.equal(await page.locator('#local-notice').count(), 0);
        await page.screenshot({ path: `${output}/${path}-${width}.png`, clip: { x: 0, y: 0, width, height: 80 } });

        await page.reload();
        await page.waitForFunction(() => scrollY === 500 && document.querySelector('.site-header').classList.contains('site-header--compact'));
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForFunction(() => !document.querySelector('.site-header').classList.contains('site-header--compact'));
        assert.equal((await header.boundingBox()).height, 172);
        assert.equal(await page.locator('.site-header__logo').isVisible(), true);
        assert.equal(await documentTop(), initialTop);
        await Promise.all([page.waitForNavigation(), menu.click()]);
        assert.equal(new URL(page.url()).pathname, '/products.html');
        assert.equal(await page.title(), '전체 상품 | 다다짱');
        assert.deepEqual(errors, []);
        console.log(`PASS ${path} ${width}px: full header at top,64px navigation-only header on scroll,no content jump,search/menu usable,reload and return-to-top restore correctly.`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
