const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.HOME_TEST_URL || 'http://127.0.0.1:4173/';
const output = '.omx/artifacts/bulk-order-page/form';
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    const pages = ['index.html', 'products.html', 'brands.html', 'about.html', 'wholesale.html', 'bulk-order.html'];
    const frames = await Promise.all(pages.map(async name => {
      const html = await fs.readFile(name, 'utf8');
      return [html.match(/<header class="MAIN_HEADER site-header"[\s\S]*?<\/header>/)[0], html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)[0]];
    }));
    for (const frame of frames) assert.deepEqual(frame, frames[0], 'shared frame must remain identical');
    for (const width of [1440, 2048]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const errors = [], failures = [], mutations = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('requestfailed', request => failures.push(request.url()));
      page.on('request', request => { if (request.method() !== 'GET') mutations.push(request.url()); });
      await page.goto(new URL('bulk-order.html', base).href);
      await page.evaluate(() => document.fonts.ready);
      const form = page.locator('.bulk-form');
      assert.equal(await form.locator('input, select, textarea').count(), 12);
      assert.equal(await form.locator('[required]').count(), 8);
      await form.getByRole('button', {name:'대량 발주 문의 보내기'}).click();
      assert.equal(await page.locator('#bulk-company').evaluate(el => el.validity.valueMissing), true);
      assert.equal(await form.locator('[role="status"]').isVisible(), false);
      for (const [name, value] of Object.entries({company:'테스트 상호', contactName:'테스트 담당자', phone:'010-0000-0000', products:'SFS-102', quantity:'5박스', message:'테스트 입력: 납품 일정 문의'})) {
        await form.locator(`[name="${name}"]`).fill(value);
      }
      await form.locator('[name="email"]').fill('invalid-email');
      assert.equal(await form.locator('[name="email"]').evaluate(el => el.validity.typeMismatch), true);
      await form.locator('[name="email"]').fill('preview@example.com');
      assert.equal(await form.evaluate(el => el.checkValidity()), false, 'privacy consent is required');
      await form.locator('[name="privacy"]').check();
      assert.equal(await form.evaluate(el => el.checkValidity()), true, 'optional fields may stay empty');
      await form.locator('[name="channel"]').selectOption({ label:'온라인 쇼핑몰' });
      await form.locator('[name="desiredDate"]').fill('2026-12-01');
      await form.locator('[name="referenceFile"]').setInputFiles({ name:'preview.txt', mimeType:'text/plain', buffer:Buffer.from('Preview only') });
      await form.getByRole('button', {name:'대량 발주 문의 보내기'}).click();
      assert.match(await form.locator('[role="status"]').innerText(), /실제 문의는 접수되지 않습니다/);
      assert.equal(new URL(page.url()).pathname, '/bulk-order.html');
      assert.equal(await form.locator('[name="quantity"]').inputValue(), '5박스');
      assert.deepEqual(mutations, [], 'preview must not submit data');
      assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
      await form.locator('[name="quantity"]').fill('10박스');
      assert.equal(await form.locator('[role="status"]').isVisible(), false, 'editing clears stale feedback');
      await page.locator('.bulk-privacy summary').click();
      assert.equal(await page.locator('.bulk-privacy details').getAttribute('open'), '');
      await page.locator('.bulk-privacy summary').click();
      await page.locator('.bulk-privacy summary').focus();
      await page.keyboard.press('Tab');
      assert.equal(await form.getByRole('button', {name:'대량 발주 문의 보내기'}).evaluate(el => el === document.activeElement), true);
      assert.equal(await form.getByRole('button', {name:'대량 발주 문의 보내기'}).evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
      await form.evaluate(el => el.reset());
      await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
      await page.waitForFunction(() => !document.querySelector('.site-header').classList.contains('site-header--compact'));
      const metrics = await page.evaluate(() => {
        const grid = document.querySelector('.bulk-order-layout').getBoundingClientRect();
        const heading = document.querySelector('#bulk-form-title');
        const main = document.querySelector('main').getBoundingClientRect();
        const footer = document.querySelector('footer').getBoundingClientRect();
        return { width:innerWidth, gridWidth:grid.width, gridLeft:grid.left, gridTop:grid.top, pageHeadingCount:document.querySelectorAll('.page-heading').length, titleSize:getComputedStyle(heading).fontSize, bottomSpace:footer.top - main.top - main.height + parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom), overflow:document.documentElement.scrollWidth > innerWidth };
      });
      assert.equal(metrics.gridWidth, 1400);
      assert.equal(metrics.gridLeft, (width - 1400) / 2);
      assert.equal(metrics.gridTop, 232);
      assert.equal(metrics.pageHeadingCount, 0);
      assert.equal(metrics.titleSize, '26px');
      assert.equal(metrics.overflow, false);
      assert.equal(metrics.bottomSpace, 100);
      await page.screenshot({path:`${output}/page-${width}.png`,fullPage:true});
      const search = page.getByRole('searchbox');
      await search.fill('시모무라');
      await Promise.all([page.waitForURL('**/products.html?q=*'), search.press('Enter')]);
      assert.equal(new URL(page.url()).searchParams.get('q'), '시모무라');
      assert.deepEqual(errors, []);
      assert.deepEqual(failures, []);
      results.push({...metrics, errors, failures, submissionRequests:mutations.length});
      console.log(`PASS bulk-order ${width}px: native validation, optional fields/file, consent, honest preview, no submission/storage, frame, layout, focus and shared search.`);
      await page.close();
    }
    await fs.writeFile(`${output}/verification.json`, JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
