const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = process.env.BASE_URL || 'http://127.0.0.1:8770/work.html';
const assetBase = new URL('./', base).href;
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const checks = [];
  const errors = [], failed = [];
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) failed.push(r.url()); });
  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').innerText(), 'Our Projects');
    assert.match(await page.locator('.sub-title .stit').innerText(), /업종의 특성과/);
    assert.equal(await page.locator('.work-filter button').count(), 9);
    assert.equal(await page.locator('.work-item:visible').count(), 33);
    assert.equal(await page.locator('.work-item').evaluateAll(cards => cards.every((card, index) => index === 0 || Number(cards[index - 1].dataset.year) >= Number(card.dataset.year))), true);
    assert.equal(await page.locator('.project-hover').count(), 33);
    assert.equal(await page.locator('.work-item .tags span').count(), 66);
    assert.deepEqual(await page.locator('.work-item').first().locator('.tags span').allTextContents(), ['바이오', '150평']);
    assert.deepEqual(await page.locator('.work-item .title').allTextContents(), [
      '노보네시스', '액시언', '비트리', '브이테크', '원준', '경일감정평가법인',
      '와이브레인', '카본리셋', '힐리오인베스트먼트', '위아 반려문화공간',
      '카카오헬스케어', '크레스콤', '두리안정보기술', '씨크랩', '케이엘공조', '릴엠', '지에스코', '회계법인청인',
      '스마트레이더시스템', '실리콘마이터스', '멋진녀석들', '센트럴소프트', '폴라리스 세원', '피크닉',
      '에이펫', 'SM건축사사무소', '상상스퀘어', '맨 오브 액션', '피티스튜디오 열정',
      '스튜디오비사이드', '에이원프라이빗에쿼티', '에프엔씨', '헬로우보보스'
    ]);
    assert.deepEqual(await page.locator('.work-item').nth(29).locator('.tags span').allTextContents(), ['미디어', '180평']);
    assert.equal(await page.locator('.project-hover-address').evaluateAll(addresses => addresses.every(address => address.textContent.trim().length > 0)), true);
    const firstProject = page.locator('.work-item').first();
    assert.equal(await firstProject.locator('.project-hover').evaluate(element => getComputedStyle(element).opacity), '0');
    await firstProject.hover();
    await page.waitForTimeout(400);
    assert.equal(await firstProject.locator('.project-hover').evaluate(element => getComputedStyle(element).opacity), '1');
    assert.equal(await firstProject.locator('.thumb img').evaluate(element => getComputedStyle(element).opacity), '1');
    assert.equal(await firstProject.locator('.project-hover').evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0.5)');
    const secondProject = page.locator('.work-item').nth(1);
    await secondProject.hover();
    await page.waitForTimeout(400);
    assert.equal(await secondProject.locator('.thumb img').evaluate(element => getComputedStyle(element).opacity), '1');
    assert.equal(await secondProject.locator('.project-hover').evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0.5)');
    assert.equal(await page.locator('.project-logo').count(), 1);
    assert.deepEqual(await page.locator('.project-logo img').evaluateAll(images => images.map(image => image.getAttribute('src'))), ['assets/projects/btree-transparent.png']);
    assert.equal(await page.locator('.project-logo').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(241, 241, 241)');
    assert.equal(await page.locator('.work-item').filter({ hasText: '액시언' }).locator('img').getAttribute('src'), 'assets/projects/work/semiconductor/axion.jpg');
    checks.push('9 filters, 32 supplied project photographs and 1 transparent logo thumbnail with address overlays');
    assert.deepEqual(await page.locator('.site-brand .site-logo-motion').evaluate(video => [video.videoWidth,video.videoHeight,getComputedStyle(video).height]), [640,188,'56px']);
    assert.deepEqual(await page.locator('.site-nav').locator('.site-nav-item, .site-nav-cta').allTextContents(), ['디자인코드', '프로젝트', '프로세스', '상담신청 →']);
    assert.equal(await page.locator('.site-nav a[aria-current="page"]').getAttribute('href'), 'work.html');
    assert.equal(await page.locator('.site-nav a').filter({ hasText: '프로세스' }).getAttribute('href'), 'process.html');
    assert.equal(await page.locator('.site-nav-cta').getAttribute('href'), 'contact.html');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('.site-menu-toggle').isVisible(), true);
    await page.locator('.site-nav').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.site-nav').isVisible(), false);
    await page.locator('.site-menu-toggle').click();
    assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'), 'true');
    await page.locator('.site-nav').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.site-nav').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'), 'false');
    await page.locator('.site-nav').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.site-nav').isVisible(), false);
    await page.locator('.site-menu-toggle').click();
    await page.locator('.site-nav a[aria-current="page"]').click();
    assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'), 'false');
    checks.push('Supplied logo, four menu labels, current page and accessible mobile toggle');
    for (const [id, count] of [['bio',4],['semiconductor',5],['it',4],['construction',4],['manufacturing',4],['media',4],['finance',4],['service',4],['all',33]]) {
      await page.locator('[data-filter="'+id+'"]').click();
      assert.equal(await page.locator('.work-item:visible').count(), count);
      assert.equal(await page.locator('.work-filter [aria-pressed="true"]').count(), 1);
      assert.equal(await page.locator('#empty-state').isVisible(), count === 0);
      assert.match(await page.locator('#result-status').innerText(), new RegExp(count+'건$'));
    }
    checks.push('Every filter updates real records, selected state and live results');
    await page.locator('[data-filter="construction"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.work-item:visible').count(), 4);
    assert.equal(await page.locator('#empty-state').isVisible(), false);
    await page.locator('#reset-filter').click();
    assert.equal(await page.locator('.work-item:visible').count(), 33);
    assert.equal(await page.locator('[data-filter="all"]').evaluate(e => e === document.activeElement), true);
    checks.push('Keyboard selection, empty state and reset focus');
    const widths = [];
    const reference = await browser.newPage();
    await reference.goto(base);
    await reference.setContent('<link rel="stylesheet" href="'+assetBase+'design-system/system.css"><main class="sub-container"><div class="sub-wrap"><div class="sub-title"><h1 class="btit">Our Projects</h1><p class="stit">업종의 특성과 일하는 방식을 담아</p></div><div class="work-filter"><button class="active">전체<span>(33)</span></button></div><div class="work-list"><article class="work-item"><div class="thumb"></div><div class="info"><h2 class="title">노보네시스</h2><div class="tags"><span>바이오</span><span>150평</span></div></div></article></div></div></main>');
    await reference.evaluate(() => document.fonts.ready);
    const selectors = ['.btit','.stit','.work-filter button','.work-item .title','.work-item .tags'];
    const props = ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundColor','borderRadius','padding'];
    for (const width of [320,390,768,769,1200,1201,1400,1401,1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await reference.setViewportSize({ width, height: 1000 });
      // Original filter transition affects font-size and colors after resize/selection.
      await page.waitForTimeout(650);
      const layout = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.work-item')];
        const buttons = [...document.querySelectorAll('.work-filter button')];
        return { width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
          columns: getComputedStyle(document.querySelector('.work-list')).gridTemplateColumns.split(' ').length,
          clippedButtons: buttons.some(b => { const r = b.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }),
          squareImages: cards.every(c => { const r=c.querySelector('.thumb').getBoundingClientRect(); return Math.abs(r.width-r.height)<1; }),
          imagesReady: [...document.images].every(i => i.complete && i.naturalWidth > 0) };
      });
      assert.equal(layout.overflow, false);
      assert.equal(layout.clippedButtons, false);
      assert.equal(layout.columns, width <= 768 ? 2 : width <= 1200 ? 3 : 4);
      assert.equal(layout.squareImages, true);
      assert.equal(layout.imagesReady, true);
      for (const selector of selectors) {
        const values = await page.locator(selector).first().evaluate((el, props) => { const s=getComputedStyle(el); return props.map(p=>s[p]); }, props);
        const original = await reference.locator(selector).first().evaluate((el, props) => { const s=getComputedStyle(el); return props.map(p=>s[p]); }, props);
        assert.deepEqual(values, original, selector+' source style @ '+width);
      }
      widths.push(layout);
    }
    checks.push('9 responsive widths, square media, no overflow or clipped filters');
    checks.push('45 source component comparisons × 9 CSS properties');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.work-filter button').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
    checks.push('Reduced motion extension');
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    checks.push('No JavaScript errors or failed asset responses');
    await reference.close();
    const report = { passed:true, testedAt:new Date().toISOString(), checks, widths, errors, failed,
      limits:['Four-column desktop layout and nine-filter wrapping are requested composition extensions.','Complete pixel parity with a different source page is not asserted.'] };
    fs.writeFileSync(path.join(root,'evidence/qa.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({passed:true,checks},null,2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
