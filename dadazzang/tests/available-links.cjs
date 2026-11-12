const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.HOME_TEST_URL || 'http://127.0.0.1:4173/';
const pages = ['index.html', 'products.html', 'brands.html', 'about.html', 'wholesale.html', 'bulk-order.html'];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    let popups = 0;
    const errors = [];
    context.on('page', opened => { if (opened !== page) popups++; });
    page.on('pageerror', error => errors.push(error.message));
    for (const name of pages) {
      await page.goto(new URL(name, base).href);
      const result = await page.evaluate(paths => {
        const available = new Set(['./', ...paths].map(path => new URL(path, location.href).href));
        let blocked = 0;
        for (const link of document.querySelectorAll('a[href]')) {
          const url = new URL(link.href);
          url.search = '';
          url.hash = '';
          if (available.has(url.href)) continue;
          if (link.getAttribute('aria-disabled') !== 'true') throw new Error(`Unavailable link not marked: ${link.href}`);
          for (const type of ['click', 'auxclick']) {
            const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: type === 'click' ? 0 : 1 });
            link.dispatchEvent(event);
            if (!event.defaultPrevented) throw new Error(`Unavailable link not blocked: ${link.href}`);
          }
          blocked++;
        }
        return blocked;
      }, pages);
      assert.ok(result > 0, `${name} has unavailable destinations to verify`);
      assert.equal(await page.locator('#local-notice').count(), 0);
      assert.equal(page.url(), new URL(name, base).href);
      if (name === 'index.html' || name === 'products.html') {
        const product = page.locator('[data-product-card]:visible').first();
        await product.click({ force: true });
        await product.focus();
        await page.keyboard.press('Enter');
        await product.click({ force: true, modifiers: ['ControlOrMeta'] });
        assert.equal(page.url(), new URL(name, base).href);
      }
    }
    await page.goto(base);
    const slider = page.locator('[data-main-slider]');
    const originals = slider.locator('[data-main-slide]:not([data-main-clone])');
    assert.deepEqual(await originals.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))), ['about.html', ...Array(15).fill('brands.html')]);
    await originals.first().getByRole('link').click();
    await page.waitForURL(new URL('about.html', base).href);
    await page.goto(base);
    await slider.press('ArrowRight');
    await slider.locator('[data-main-slide][aria-current="true"] a').click();
    await page.waitForURL(new URL('brands.html', base).href);
    assert.equal(popups, 0);
    assert.deepEqual(errors, []);
    console.log('PASS: all six pages block unavailable links, product clicks/keyboard/modifier clicks stay put, hero links open local introduction/brands, no popups or errors.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
