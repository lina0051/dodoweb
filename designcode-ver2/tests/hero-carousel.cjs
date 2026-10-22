const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const baseUrl = process.env.BASE_URL || process.env.TEST_BASE_URL || 'http://127.0.0.1:8770/';
const photos = ['studio-bside', 'novonesis', 'kakao', 'apet', 'medispan'];
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [], failed = [], screenshots = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('#hero video').count(), 0);
    assert.deepEqual(await page.locator('.hero-slide img').evaluateAll(images => images.map(image => image.getAttribute('src'))), photos.map(name => `assets/hero/banner-${name}.jpg`));
    assert.equal(await page.locator('#hero h1').innerText(), 'We Design Together');
    assert.equal(await page.locator('#hero .hero-slide-copy p').innerText(), '일하고싶은공간, 디자인코드가함께설계합니다.');
    assert.equal(await page.locator('#hero h1').count(), 1);
    assert.equal(await page.locator('.hero-progress-bar').count(), 5);
    assert.equal(await page.locator('.hero-slide .hero-slide-copy').count(), 0);
    const current = () => page.locator('.hero-slide.is-active').getAttribute('data-slide');
    const copyBounds = () => page.locator('.hero-slide-copy').boundingBox();
    for (const [device, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
      await page.setViewportSize(viewport);
      const fixedBounds = await copyBounds();
      for (let index = 0; index < photos.length; index += 1) {
        assert.equal(await current(), String(index));
        await page.waitForFunction(() => {
          const image = document.querySelector('.hero-slide.is-active img');
          return image.complete && image.naturalWidth > 0;
        });
        await page.locator('.hero-slide.is-active img').evaluate(image => image.decode());
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await page.locator('.hero-slide[aria-hidden="false"]').count(), 1);
        assert.equal(await page.locator('#hero-progress').getAttribute('aria-label'), `슬라이드 ${index + 1} / 5`);
        assert.equal(await page.locator('.hero-progress-bar.is-active').evaluate(bar => [...bar.parentElement.children].indexOf(bar)), index);
        assert.deepEqual(await copyBounds(), fixedBounds, 'copy must remain fixed across all photos');
        assert.equal(await page.locator('.hero-slide-copy').evaluate(copy => getComputedStyle(copy).opacity), '1');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const title = await page.locator('#hero h1').boundingBox();
        assert.ok(title.x >= 0 && title.x + title.width <= viewport.width, 'title must fit viewport');
        const file = `evidence/hero-client-banners-${device}${index ? `-${index + 1}` : ''}.png`;
        await page.screenshot({ path: path.join(root, file) });
        screenshots.push(file);
        await page.locator('#slide-next').click();
      }
      assert.equal(await current(), '0', 'next from last photo must wrap to the first');
      await page.locator('#slide-prev').click();
      assert.equal(await current(), '4', 'previous from first must wrap to the last');
      await page.locator('#hero').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await current(), '0');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await current(), '4');
      await page.keyboard.press('ArrowRight');
    }
    // Verify fixed copy throughout an animated transition, then actual seven-second autoplay.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const before = await copyBounds();
    await page.locator('#slide-next').click();
    await page.waitForTimeout(250);
    assert.deepEqual(await copyBounds(), before);
    assert.equal(await page.locator('.hero-slide-copy').evaluate(copy => getComputedStyle(copy).opacity), '1');
    await page.waitForFunction(() => document.querySelector('.hero-slide.is-active').dataset.slide === '2', null, { timeout: 9500 });
    await page.evaluate(() => scrollTo({ top: document.querySelector('#projects').offsetTop, behavior: 'instant' }));
    await page.waitForTimeout(7400);
    assert.equal(await current(), '2', 'autoplay must pause while hero is off screen');
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(7400);
    assert.equal(await current(), '2', 'reduced motion must stop autoplay');
    for (const width of [320, 768, 1024, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}px`);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    const report = { passed: true, testedAt: new Date().toISOString(), baseUrl, checks: ['five client photos in order', 'no hero video', 'fixed copy during every slide and animation', 'all photos load on desktop/mobile', 'progress and accessibility state', 'next/previous wraparound', 'keyboard navigation', 'seven-second autoplay', 'pause off screen', 'reduced motion', 'six viewport widths without overflow'], screenshots, errors, failed };
    fs.writeFileSync(path.join(root, 'evidence/hero-client-banners-qa.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
