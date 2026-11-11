const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.HOME_TEST_URL || 'http://127.0.0.1:4173/';
const brands = ['SHIMOMURA', 'AMBAI', 'KAICO', 'YOSHIKAWA', 'PEARL LIFE', 'YAMADAKEN', 'TSUBAME', 'TODAI', 'INOMATA', 'NAKAYA', 'SANADA', 'NAGAO', 'AKEBONO', 'KOKUBO', 'ECHO'];
const output = '.omx/artifacts/brand-logos';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 2048]) {
      const page = await browser.newPage({ viewport: { width, height: 1100 } });
      const errors = [], failed = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (!response.ok()) failed.push(response.url()); });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const marquee = page.locator('[data-brand-marquee]');
      const viewport = marquee.locator('.brand-marquee__viewport');
      const track = marquee.locator('.brand-marquee__track');
      const groups = marquee.locator('.brand-marquee__group');
      assert.equal(await marquee.locator('.brand-marquee__controls, [data-brand-toggle], .brand-marquee__help').count(), 0);
      assert.equal(await groups.count(), 2);
      const band = await marquee.evaluate(el => {
        const style = getComputedStyle(el), rules = getComputedStyle(el, '::before');
        return { paddingTop:style.paddingTop, paddingBottom:style.paddingBottom, background:style.backgroundColor, borderTop:rules.borderTop, borderBottom:rules.borderBottom, marginTop:style.marginTop, ruleWidth:parseFloat(rules.width) };
      });
      assert.equal(band.paddingTop, '80px');
      assert.equal(band.paddingBottom, '80px');
      assert.equal(band.background, 'rgb(255, 255, 255)');
      assert.equal(band.borderTop, '1px solid rgb(221, 221, 221)');
      assert.equal(band.borderBottom, '1px solid rgb(221, 221, 221)');
      assert.ok(Math.abs(band.ruleWidth - width) < 1, 'rules span the viewport');
      assert.equal(band.marginTop, '160px');
      assert.equal(await marquee.locator('.brand-marquee__detail').count(), 0);
      const ribbon = await viewport.boundingBox();
      const productGrid = await page.locator('.bestseller-grid').first().boundingBox();
      assert.ok(Math.abs(ribbon.x - productGrid.x) < 1 && Math.abs(ribbon.width - productGrid.width) < 1, 'ribbon aligns with the product grid');
      for (const group of [groups.first(), groups.last()]) {
        assert.deepEqual(await group.locator('a').evaluateAll(links => links.map(link => link.dataset.brandName)), brands);
        assert.deepEqual(await group.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))), brands.map(brand => `brands.html#${brand.toLowerCase().replaceAll(' ', '-')}`));
        assert.equal(await group.locator('.brand-marquee__logo').count(), 14);
        assert.deepEqual(await group.locator('.brand-marquee__name').allTextContents(), ['TSUBAME']);
        assert.deepEqual(await group.locator('.brand-marquee__label').allTextContents(), ['시모무라','암바이','카이코','요시카와','펄라이프','야마다켄','츠바메','토다이','이노마타','나카야','사나다','나가오','아케보노','코쿠보','에코금속']);
      }
      assert.ok(await marquee.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0 && img.getAttribute('src').startsWith('assets/brands/'))), 'all original and repeated logos decode locally');
      const frames = await marquee.locator('.brand-marquee__logo-frame').evaluateAll(nodes => nodes.map(el => ({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
      assert.ok(frames.every(frame => Math.abs(frame.w - 220) < .01 && Math.abs(frame.h - 80) < .01), 'logos share consistent slots without stretching originals');
      assert.equal(await groups.last().getAttribute('aria-hidden'), 'true');
      assert.equal(await groups.last().locator('a[tabindex="-1"]').count(), 15);
      assert.equal(await groups.last().getAttribute('inert'), null, 'visible loop copy remains clickable');
      assert.equal(await marquee.locator('.brand-marquee__all').getAttribute('href'), 'brands.html');
      assert.equal(await marquee.locator('.brand-marquee__more').count(), 0);
      const layout = await marquee.evaluate(el => {
        const title = el.querySelector('h2'), all = el.querySelector('.brand-marquee__all');
        const grid = document.querySelector('.bestseller-grid').getBoundingClientRect();
        const t = title.getBoundingClientRect(), a = all.getBoundingClientRect();
        return { fontSize: getComputedStyle(title).fontSize, weight: getComputedStyle(title).fontWeight, left: t.left - grid.left, right: a.right - grid.right, sameRow: Math.abs((t.top+t.bottom-a.top-a.bottom)/2) < 1 };
      });
      assert.equal(layout.fontSize, '26px');
      assert.equal(layout.weight, '700');
      assert.ok(Math.abs(layout.left) < 1 && Math.abs(layout.right) < 1 && layout.sameRow);
      await marquee.scrollIntoViewIfNeeded();
      await page.mouse.move(5, 5);
      const time = () => track.evaluate(el => el.getAnimations()[0].currentTime);
      const start = await time();
      await page.waitForTimeout(180);
      assert.ok(await time() > start + 80, 'logos move automatically');
      await viewport.hover();
      assert.equal(await track.evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
      await page.waitForTimeout(80);
      const pausedAt = await time();
      await page.waitForTimeout(180);
      assert.ok(Math.abs(await time() - pausedAt) < 2, 'hover freezes the exact position');
      await page.mouse.move(5, 5);
      await page.waitForTimeout(180);
      assert.ok(await time() > pausedAt + 80, 'leaving resumes movement');
      await viewport.focus();
      assert.equal(await track.evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
      const seam = await track.evaluate(el => {
        const animation = el.getAnimations()[0];
        animation.currentTime = 0;
        const first = el.children[0].getBoundingClientRect().left;
        animation.currentTime = animation.effect.getTiming().duration - 1;
        const second = el.children[1].getBoundingClientRect().left;
        animation.currentTime = 0;
        return { first, second };
      });
      assert.ok(Math.abs(seam.first - seam.second) < .3, 'loop joins without a gap');
      // A swipe changes the flow position and must not activate the link under it.
      await viewport.focus();
      const beforeSwipe = await time();
      await viewport.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 500, clientY: 500 });
      await viewport.dispatchEvent('pointermove', { pointerType: 'touch', clientX: 380, clientY: 500 });
      assert.ok(await time() > beforeSwipe + 100, 'touch swipe moves the ribbon');
      await viewport.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 380, clientY: 500 });
      await groups.first().locator('a').first().dispatchEvent('click');
      assert.equal(page.url(), url, 'swipe does not open a brand');
      assert.equal(await page.locator('#local-notice').count(), 0);
      await groups.first().locator('a').last().focus();
      const focused = await groups.first().locator('a').last().boundingBox();
      const frame = await viewport.boundingBox();
      assert.ok(focused.x >= frame.x - 1 && focused.x + focused.width <= frame.x + frame.width + 1, 'off-screen keyboard choice becomes visible');
      await page.evaluate(() => document.activeElement.blur());
      await viewport.evaluate(el => el.scrollLeft = 0);
      await viewport.focus();
      await track.evaluate(el => el.getAnimations()[0].currentTime = 0);
      await marquee.screenshot({ path: `${output}/marquee-${width}.png` });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await track.evaluate(el => getComputedStyle(el).animationName), 'none');
      assert.equal(await groups.last().isVisible(), false);
      assert.equal(await viewport.evaluate(el => { el.scrollLeft = 400; return el.scrollLeft; }), 400);
      await marquee.locator('.brand-marquee__all').click();
      await page.waitForURL('**/brands.html');
      assert.equal(await page.locator('h1').innerText(), '취급 브랜드');
      for (const brand of brands) {
        assert.equal(await page.locator(`#${brand.toLowerCase().replaceAll(' ', '-')}`).count(), 1, 'every logo has a destination section');
      }
      await page.goBack({ waitUntil: 'networkidle' });
      await groups.first().locator('a').first().locator('img').click();
      await page.waitForURL('**/brands.html#shimomura');
      assert.equal(await page.locator('#shimomura h2').innerText(), '시모무라');
      assert.equal(await page.locator('#local-notice').count(), 0);
      assert.deepEqual(errors, []);
      assert.deepEqual(failed, []);
      console.log(`PASS ${width}px: grid-aligned ribbon, 15 original/repeated brand links, actual all-brands/logo navigation, seamless loop, hover/focus, touch without navigation, keyboard discovery, reduced motion, no errors`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
