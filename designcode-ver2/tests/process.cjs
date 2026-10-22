const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = process.env.BASE_URL || 'http://127.0.0.1:8770/process.html';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const checks = [], errors = [], failed = [], layouts = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });

  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every(image => image.complete));

    assert.equal(await page.locator('h1').innerText(), 'Our Process');
    assert.equal(await page.locator('main').getAttribute('class'), 'sub-container process-page');
    assert.equal(await page.locator('.sub-wrap > .sub-title').count(), 1);
    assert.match(await page.locator('.sub-title .stit').innerText(), /처음 만나는 순간부터/);
    const compactTitle = await page.locator('.sub-title').evaluate(element => ({
      height: element.getBoundingClientRect().height,
      fontSize: parseFloat(getComputedStyle(element.querySelector('.btit')).fontSize),
      copyFontSize: getComputedStyle(element.querySelector('.stit')).fontSize,
      paddingTop: getComputedStyle(element.parentElement).paddingTop,
      marginBottom: getComputedStyle(element).marginBottom
    }));
    assert.ok(compactTitle.height < 160);
    assert.equal(compactTitle.fontSize, 72);
    assert.equal(compactTitle.copyFontSize, '19px');
    assert.equal(compactTitle.paddingTop, '140px');
    assert.ok(Math.abs(parseFloat(compactTitle.marginBottom) - 60) < 1);
    checks.push('Title and introduction match project-page typography with compact process-page spacing');
    assert.deepEqual(await page.locator('.process-phase-title h2').allTextContents(), ['계약 전 단계', '계약 후 / 착공 전 단계', '착공 후 단계']);
    assert.equal(await page.locator('.process-card').count(), 9);
    assert.deepEqual(await page.locator('.process-number').allTextContents(), ['01','02','03','04','05','06','07','08','09']);
    assert.deepEqual(await page.locator('.process-copy h3').allTextContents(), ['현장 미팅','레이아웃 피드백','디자인 제안 및 견적 미팅','계약','레이아웃 확정','디자인 확정','착공','세부 컨펌','준공']);
    checks.push('Three project phases and all nine supplied stages render in order');

    assert.equal(await page.locator('.process-card img').count(), 9);
    assert.equal(await page.locator('.process-card.has-image-error').count(), 0);
    assert.equal(await page.locator('.process-card img').evaluateAll(images => images.every(image => image.naturalWidth === 1024 && image.naturalHeight === 1024)), true);
    assert.deepEqual(await page.locator('.process-card img').evaluateAll(images => images.map(image => new URL(image.src).pathname)), Array.from({ length: 9 }, (_, index) => `/assets/process/unified/${String(index + 1).padStart(2, '0')}.png`));
    checks.push('All nine unified 1024px process illustrations load locally');

    assert.deepEqual(await page.locator('.site-nav').locator('.site-nav-item, .site-nav-cta').allTextContents(), ['회사소개', '프로젝트', '프로세스', '상담신청 →']);
    assert.equal(await page.locator('.site-nav a[aria-current="page"]').getAttribute('href'), 'process.html');
    assert.equal(await page.locator('.site-nav-cta').getAttribute('href'), 'contact.html');
    assert.equal(await page.locator('.footer-project-label').getAttribute('href'), 'contact.html');
    checks.push('Current-page navigation and contact footer links are connected');

    for (const width of [320, 390, 768, 769, 1024, 1180, 1181, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(100);
      const layout = await page.evaluate(() => {
        const phase = document.querySelector('.process-phase');
        const children = [...phase.children];
        const columns = new Set(children.map(child => Math.round(child.getBoundingClientRect().left))).size;
        return {
          width: innerWidth,
          columns,
          titleOffsets: [...document.querySelectorAll('.process-phase')].map(phase => {
            const title = phase.querySelector('.process-phase-title h2').getBoundingClientRect();
            return [...phase.querySelectorAll('.process-copy h3')].map(heading => Math.abs(heading.getBoundingClientRect().top - title.top));
          }),
          numberSize: getComputedStyle(document.querySelector('.process-number')).fontSize,
          cards: [...document.querySelectorAll('.process-card')].map(card => {
            const bounds = card.getBoundingClientRect();
            const copy = card.querySelector('.process-copy').getBoundingClientRect();
            const number = card.querySelector('.process-number').getBoundingClientRect();
            const figure = card.querySelector('figure').getBoundingClientRect();
            return { height: bounds.height, clipped: copy.bottom > bounds.bottom - 15 || copy.right > bounds.right + 1,
              originalOrder: number.bottom <= figure.top + 1 && figure.bottom <= copy.top + 1 };
          }),
          overflow: document.documentElement.scrollWidth > innerWidth,
          navWrap: document.querySelector('.site-nav').getBoundingClientRect().height > 96
        };
      });
      assert.equal(layout.overflow, false, `horizontal overflow at ${width}`);
      assert.equal(layout.numberSize, '26px');
      assert.ok(layout.cards.every(card => !card.clipped), `clipped stage copy at ${width}`);
      assert.ok(layout.cards.every(card => card.originalOrder), `changed vertical card layout at ${width}`);
      assert.ok(layout.cards.every(card => card.height < (width <= 768 ? 560 : width <= 1180 ? 610 : 680)), `excessive card whitespace at ${width}`);
      if (width <= 768) assert.equal(layout.columns, 1);
      else if (width <= 1180) assert.equal(layout.columns, 2);
      else {
        assert.equal(layout.columns, 4);
        assert.ok(layout.titleOffsets.flat().every(offset => offset < 1), `phase and stage titles must align at ${width}`);
      }
      if (width > 768) assert.equal(layout.navWrap, false);
      layouts.push(layout);
    }
    checks.push('Nine responsive widths: 4-column desktop, 2-column tablet, 1-column mobile, no overflow');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.site-menu-toggle').click();
    await page.locator('.site-nav').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    await page.locator('.site-nav').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'), 'false');
    checks.push('Mobile navigation opens and closes with keyboard support');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.process-phase').evaluateAll(phases => phases.every(phase => phase.classList.contains('is-revealed'))), true);
    assert.equal(await page.locator('.process-card').first().evaluate(element => getComputedStyle(element).transitionDuration), '0s');
    checks.push('Reduced-motion mode reveals content without animation');

    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    checks.push('No JavaScript errors or failed asset responses');

    const report = { passed: true, testedAt: new Date().toISOString(), checks, layouts, errors, failed };
    fs.writeFileSync(path.join(root, 'evidence/process-qa.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ passed: true, checks }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
