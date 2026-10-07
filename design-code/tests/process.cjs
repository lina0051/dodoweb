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
    checks.push('Project page sub-title structure and typography tokens are shared');

    const typographyProperties = ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','marginBottom'];
    const spacingProperties = ['paddingTop','paddingRight','paddingLeft'];
    const processTitleStyles = await page.locator('.sub-title .btit').evaluate((element, properties) => {
      const styles = getComputedStyle(element);
      return properties.map(property => styles[property]);
    }, typographyProperties);
    const processSubtitleStyles = await page.locator('.sub-title .stit').evaluate((element, properties) => {
      const styles = getComputedStyle(element);
      return properties.map(property => styles[property]);
    }, typographyProperties);
    const processWrapStyles = await page.locator('.sub-wrap').evaluate((element, properties) => {
      const styles = getComputedStyle(element);
      return properties.map(property => styles[property]);
    }, spacingProperties);
    const workReference = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await workReference.goto(new URL('work.html', base).href, { waitUntil: 'networkidle' });
    await workReference.evaluate(() => document.fonts.ready);
    assert.deepEqual(await workReference.locator('.sub-title .btit').evaluate((element, properties) => {
      const styles = getComputedStyle(element);
      return properties.map(property => styles[property]);
    }, typographyProperties), processTitleStyles);
    assert.deepEqual(await workReference.locator('.sub-title .stit').evaluate((element, properties) => {
      const styles = getComputedStyle(element);
      return properties.map(property => styles[property]);
    }, typographyProperties), processSubtitleStyles);
    assert.deepEqual(await workReference.locator('.sub-wrap').evaluate((element, properties) => {
      const styles = getComputedStyle(element);
      return properties.map(property => styles[property]);
    }, spacingProperties), processWrapStyles);
    await workReference.close();
    checks.push('Title, subtitle and page inset computed styles match the project page');
    assert.deepEqual(await page.locator('.process-phase-title h2').allTextContents(), ['계약 전 단계', '계약 후 / 착공 전 단계', '착공 후 단계']);
    assert.equal(await page.locator('.process-card').count(), 9);
    assert.deepEqual(await page.locator('.process-number').allTextContents(), ['01','02','03','04','05','06','07','08','09']);
    assert.deepEqual(await page.locator('.process-copy h3').allTextContents(), ['현장 미팅','레이아웃 피드백','디자인 제안 및 견적 미팅','계약','레이아웃 확정','디자인 확정','착공','세부 컨펌','준공']);
    checks.push('Three project phases and all nine supplied stages render in order');

    assert.equal(await page.locator('.process-card img').count(), 9);
    assert.equal(await page.locator('.process-card.has-image-error').count(), 0);
    assert.equal(await page.locator('.process-card img').evaluateAll(images => images.every(image => image.naturalWidth === 1254 && image.naturalHeight === 1254)), true);
    assert.deepEqual(await page.locator('.process-card img').evaluateAll(images => images.map(image => new URL(image.src).pathname)), Array.from({ length: 9 }, (_, index) => `/assets/process/${String(index + 1).padStart(2, '0')}.png`));
    checks.push('All nine user-supplied 1254px process illustrations load locally');

    assert.deepEqual(await page.locator('.site-nav').locator('.site-nav-item, .site-nav-cta').allTextContents(), ['디자인코드', '프로젝트', '프로세스', '상담신청 →']);
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
          overflow: document.documentElement.scrollWidth > innerWidth,
          navWrap: document.querySelector('.site-nav').getBoundingClientRect().height > 96
        };
      });
      assert.equal(layout.overflow, false, `horizontal overflow at ${width}`);
      if (width <= 768) assert.equal(layout.columns, 1);
      else if (width <= 1180) assert.equal(layout.columns, 2);
      else assert.equal(layout.columns, 4);
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
