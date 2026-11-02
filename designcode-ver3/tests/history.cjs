const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8770/';
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const results = [];
  try {
    for (const width of [1440, 390]) {
      for (const reducedMotion of ['no-preference', 'reduce']) {
        const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(baseUrl, { waitUntil: 'networkidle' });
        const toggle = page.locator('#history-toggle');
        const years = page.locator('#history .award-block:visible .award-year');
        const originalUrl = page.url();
        assert.deepEqual(await years.allTextContents(), ['2026', '2025', '2024']);
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        assert.equal(await toggle.getAttribute('aria-controls'), 'history-archive');
        assert.equal((await toggle.innerText()).replace(/\s+/g, ' '), '지난 프로젝트 더 보기 ↓');
        assert.equal(await page.locator('#history-archive').isVisible(), false);
        await toggle.scrollIntoViewIfNeeded();
        await toggle.focus();
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#history .cursor-hover')).opacity === '1');
        if (reducedMotion === 'reduce') {
          await page.locator('#history').screenshot({ path: path.join(root, `evidence/history-collapsed-${width}.png`) });
        }
        await toggle.press('Enter');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        assert.equal((await toggle.innerText()).replace(/\s+/g, ' '), '프로젝트 접기 ↑');
        assert.deepEqual(await years.allTextContents(), ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2013-2014']);
        assert.deepEqual(await page.locator('#history .award-list').evaluateAll(lists => lists.map(list => list.children.length)), [11, 11, 15, 18, 16, 14, 11, 7, 5, 6, 8, 10, 7]);
        assert.equal(await page.locator('#history .award-item').count(), 139);
        await page.locator('#history .award-block').last().scrollIntoViewIfNeeded();
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#history .award-block:last-child')).opacity === '1');
        await toggle.scrollIntoViewIfNeeded();
        if (reducedMotion === 'reduce') {
          await page.screenshot({ path: path.join(root, `evidence/history-expanded-${width}.png`) });
        }
        await toggle.focus();
        await toggle.press('Space');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        assert.deepEqual(await years.allTextContents(), ['2026', '2025', '2024']);
        assert.equal(await toggle.evaluate(button => button === document.activeElement), true);
        assert.equal(await toggle.evaluate(button => {
          const rect = button.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= innerHeight;
        }), true, 'collapse must keep the control in view');
        await toggle.click();
        assert.equal(await years.count(), 13, 'archive can reopen');
        await toggle.click();
        assert.equal(await years.count(), 3, 'archive can close repeatedly');
        assert.equal(page.url(), originalUrl);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        assert.deepEqual(errors, []);
        results.push({ width, reducedMotion, status: 'passed', projects: 139 });
        await page.close();
      }
    }
    fs.writeFileSync(path.join(root, 'evidence/history-toggle-qa.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
