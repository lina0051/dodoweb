const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const base = process.env.BASE_URL || 'http://127.0.0.1:8770/';
const phase = process.env.CLEANUP_PHASE || 'after';
const pages = ['index.html', 'work.html', 'process.html', 'contact.html', 'about.html', 'about-alt.html', 'about-new.html', 'project-detail.html'];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const checks = [];
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      for (const file of pages) {
        await page.goto(new URL(file, base).href);
        await page.locator('.site-header').waitFor();
        if (file !== 'project-detail.html') await page.locator('.shared-footer').waitFor({ state: 'attached' });
        await page.evaluate(() => document.fonts.ready);
        const links = await page.locator('#primary-navigation a').evaluateAll(items => items.map(item => [item.textContent.trim(), item.getAttribute('href')]));
        assert.deepEqual(links, [['회사소개', 'about-new.html'], ['프로젝트', 'work.html'], ['프로세스', 'process.html'], ['상담신청 →', 'contact.html']]);
        assert.equal(await page.locator('.floating-contact-link').count(), 3);
        if (width === 390) {
          await page.locator('.site-menu-toggle').click();
          assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'), 'true');
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'), 'false');
        }
        if (file === 'index.html') {
          if (phase === 'after') assert.equal(await page.locator('script[src^="projects.js"]').count(), 0);
          assert.equal(await page.locator('.hero-slide').count(), 5);
          assert.equal(await page.locator('#home-project-list .work-item').count(), 6);
          assert.equal(await page.locator('.faq-question').count(), 13);
          assert.equal(await page.locator('.partner-marquee').count(), 2);
          await page.locator('.faq-question').first().click();
          assert.equal(await page.locator('.faq-question').first().getAttribute('aria-expanded'), 'true');
        }
        if (file === 'work.html') {
          assert.equal(await page.locator('.work-item').count(), 33);
          assert.equal(await page.locator('.work-filter button').count(), 9);
          if (phase === 'after') {
            assert.deepEqual(await page.locator('.work-item img').evaluateAll(images => images.map(image => image.loading)), [
              ...Array(3).fill('eager'), ...Array(30).fill('lazy')
            ]);
          }
          for (const filter of ['service', 'bio', 'semiconductor', 'all']) {
            await page.locator(`[data-filter="${filter}"]`).click();
            const expected = filter === 'all' ? 33 : filter === 'semiconductor' ? 5 : 4;
            assert.equal(await page.locator('.work-item:visible').count(), expected);
            const last = page.locator('.work-item:visible img').last();
            await last.scrollIntoViewIfNeeded();
            await last.evaluate(image => image.decode());
          }
        }
        if (file === 'about-new.html') {
          assert.equal(await page.locator('.service-item').count(), 8);
          assert.deepEqual(await page.locator('[data-count]').allTextContents(), ['14', '250']);
          assert.equal(await page.locator('.about-project-card').count(), 4);
        }
        await page.evaluate(async () => {
          await Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode(); }));
        });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow: ${file} at ${width}`);
        checks.push({ file, width, images: await page.locator('img').count(), passed: true });
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    // Both compatibility paths must survive cleanup: local files and failed HTTP fragments.
    for (const mode of ['file', 'http-failure']) {
      const page = await browser.newPage({ reducedMotion: 'reduce' });
      if (mode === 'http-failure') {
        await page.route('**/header.html?*', route => route.abort());
        await page.route('**/footer.html?*', route => route.abort());
      }
      await page.goto(mode === 'file' ? pathToFileURL(path.join(root, 'index.html')).href : new URL('index.html', base).href);
      await page.locator('.site-header').waitFor();
      await page.locator('.shared-footer').waitFor({ state: 'attached' });
      assert.equal(await page.locator('[data-nav-page="about-new"]').getAttribute('href'), 'about-new.html');
      assert.equal(await page.locator('#home-project-list .work-item').count(), 6);
      checks.push({ mode, passed: true });
      await page.close();
    }
    const motion = await browser.newPage({ reducedMotion: 'no-preference' });
    await motion.goto(new URL('about-new.html', base).href);
    await motion.waitForSelector('[data-gallery-ready="true"]');
    assert.equal(await motion.locator('.about-project-card').count(), 8);
    assert.equal(await motion.locator('.about-project-rail__track').evaluate(track => getComputedStyle(track).animationName), 'about-gallery-flow');
    await motion.close();
    const report = { phase, passed: true, checks };
    fs.writeFileSync(path.join(root, `evidence/resource-cleanup-${phase}-qa.json`), JSON.stringify(report, null, 2) + '\n');
    console.log(`PASS: ${checks.length} page/device/compatibility checks and automatic About gallery (${phase}).`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
