const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8770/';
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const results = await Promise.all([1, 2].flatMap(deviceScaleFactor => [1440, 390].map(async width => {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      const video = page.locator('.site-logo-motion');
      await page.waitForFunction(() => {
        const video = document.querySelector('.site-logo-motion');
        return video && video.videoWidth === 640 && video.currentTime > 0 && !video.paused;
      });
      assert.equal(await video.evaluate(el => getComputedStyle(el).filter), 'none');
      assert.equal(await video.evaluate(el => getComputedStyle(el).visibility), 'visible');
      assert.equal(await page.locator('.site-logo-still').isVisible(), false);
      assert.match(await video.evaluate(el => el.currentSrc), /code-wordmark-black\.webm$/);
      await page.waitForFunction(() => {
        const video = document.querySelector('.site-logo-motion');
        return video.paused && video.currentTime >= 4.4 && video.currentTime < 5;
      });
      assert.equal(await video.evaluate(el => getComputedStyle(el).height), width > 768 ? '56px' : '28px');
      const still = page.locator('.site-logo-still');
      await page.waitForFunction(() => document.querySelector('.site-logo-still').complete);
      assert.equal(await still.isVisible(), true);
      assert.equal(await video.isVisible(), false);
      assert.match(await still.getAttribute('src'), /\.svg$/);
      const alpha = await video.evaluate(el => {
        const canvas = document.createElement('canvas');
        canvas.width = el.videoWidth;
        canvas.height = el.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(el, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let transparent = 0, soft = 0, solid = 0;
        for (let i = 3; i < pixels.length; i += 4) {
          if (pixels[i] === 0) transparent++;
          if (pixels[i] >= 20 && pixels[i] <= 32) soft++;
          if (pixels[i] >= 250) solid++;
        }
        return { transparent, soft, solid };
      });
      assert.ok(alpha.transparent > 50000 && alpha.soft > 100 && alpha.solid > 100, 'video must preserve transparent background, 10% layer, and solid strokes');
      await page.locator('.site-brand').screenshot({ path: path.join(root, `evidence/logo-smooth-${width}-dpr${deviceScaleFactor}.png`) });
      if (width < 769) {
        await page.locator('.site-menu-toggle').click();
        assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'), 'true');
        assert.match(await video.evaluate(el => getComputedStyle(el).filter), /invert\(1\)/);
        assert.match(await still.evaluate(el => getComputedStyle(el).filter), /invert\(1\)/);
      }
      assert.deepEqual(errors, []);
      await page.close();
      return { width, deviceScaleFactor, status: 'passed', alpha };
    })));
    fs.writeFileSync(path.join(root, 'evidence/logo-smooth-qa.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
