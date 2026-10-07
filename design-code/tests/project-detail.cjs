const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const base = process.env.BASE_URL || 'http://127.0.0.1:8770/project-detail.html';
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'design-code-project-detail-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function readDebuggingPort() {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (fs.existsSync(portFile)) return fs.readFileSync(portFile, 'utf8').split('\n')[0];
    await wait(100);
  }
  throw new Error('Chrome debugging port was not created.');
}

function connect(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  return {
    ready,
    send(method, params = {}) {
      id += 1;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); }
  };
}

(async () => {
  let client;
  const checks = [];
  try {
    const port = await readDebuggingPort();
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
    const pageTarget = targets.find(target => target.type === 'page');
    client = connect(pageTarget.webSocketDebuggerUrl);
    await client.ready;
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Page.navigate', { url: base });

    async function evaluate(expression) {
      const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    }

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const ready = await evaluate(`document.readyState === 'complete' && Boolean(document.querySelector('.site-header'))`);
      if (ready) break;
      await wait(100);
    }

    const structure = await evaluate(`(() => ({
      title: document.title,
      heading: document.querySelector('h1').textContent.trim(),
      eyebrow: document.querySelector('.project-eyebrow').textContent.trim(),
      categoryExists: Boolean(document.querySelector('.project-category')),
      metadata: [...document.querySelectorAll('.project-information dl > div')].map(item => [item.querySelector('dt').textContent.trim(), item.querySelector('dd').textContent.trim()]),
      galleryImages: document.querySelectorAll('.project-gallery img').length,
      totalImages: document.querySelectorAll('main img').length,
      concept: document.querySelector('.project-concept p').textContent.trim(),
      currentNav: document.querySelector('.site-nav [aria-current="page"]').textContent.trim(),
      emDashCount: (document.body.innerText.match(/—/g) || []).length
    }))()`);
    assert.equal(structure.title, 'Novonesis Korea - Featured Work');
    assert.equal(structure.heading, 'Novonesis Korea');
    assert.equal(structure.eyebrow, 'Project');
    assert.equal(structure.categoryExists, false);
    assert.deepEqual(structure.metadata, [
      ['업종', '바이오'],
      ['프로젝트 유형', '오피스'],
      ['면적', '495.9㎡ (150평)'],
      ['위치', '서울특별시 서초구']
    ]);
    assert.equal(structure.galleryImages, 14);
    assert.equal(structure.totalImages, 15);
    assert.match(structure.concept, /그린과 부드러운 우드 톤/);
    assert.equal(structure.currentNav, '프로젝트');
    assert.equal(structure.emDashCount, 0);
    checks.push('Project title, supplied information structure, concise concept and 15 real photographs');

    const systemColors = await evaluate(`(() => {
      const selectors = ['.project-eyebrow', '.project-information dt', '.project-information dd', '.project-concept h2', '.project-concept p', '.project-gallery h2'];
      return selectors.map(selector => getComputedStyle(document.querySelector(selector)).color);
    })()`);
    assert.ok(systemColors.every(color => color === 'rgb(10, 10, 10)'));
    const detailCss = fs.readFileSync(path.join(root, 'project-detail.css'), 'utf8');
    assert.doesNotMatch(detailCss, /#67768e|#cbd1d9|#ecece9|#aaa\b|#555\b|rgba\(255,\s*255,\s*255/);
    checks.push('All detail-page text and rules use the design-system black without custom gray colors');
    assert.equal(await evaluate(`document.querySelector('.project-footer')`), null);
    checks.push('Project detail footer is removed');

    await evaluate(`(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * .8) {
        scrollTo(0, y);
        await new Promise(resolve => setTimeout(resolve, 35));
      }
      scrollTo(0, 0);
      await Promise.all([...document.images].map(image => image.complete ? Promise.resolve() : new Promise(resolve => image.addEventListener('load', resolve, { once: true }))));
    })()`);
    const loadedImages = await evaluate(`[...document.querySelectorAll('main img')].every(image => image.complete && image.naturalWidth > 0)`);
    assert.equal(loadedImages, true);
    checks.push('All optimized project photographs load successfully');

    for (const width of [1440, 1024, 768, 390, 320]) {
      await client.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width <= 768 });
      const layout = await evaluate(`(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        galleryColumns: getComputedStyle(document.querySelector('.project-gallery-grid')).gridTemplateColumns.split(' ').length,
        galleryWidth: document.querySelector('.project-gallery-grid').getBoundingClientRect().width,
        pairedImageWidth: document.querySelector('.gallery-item--half').getBoundingClientRect().width,
        infoBorderTop: getComputedStyle(document.querySelector('.project-information')).borderTopWidth,
        infoBorderBottom: getComputedStyle(document.querySelector('.project-information')).borderBottomWidth,
        titleWidth: document.querySelector('h1').getBoundingClientRect().width,
        heroWidth: document.querySelector('.project-hero-media').getBoundingClientRect().width,
        heroLeft: document.querySelector('.project-hero-media').getBoundingClientRect().left,
        heroRight: innerWidth - document.querySelector('.project-hero-media').getBoundingClientRect().right,
        viewport: innerWidth
      }))()`);
      assert.equal(layout.overflow, false, `no horizontal overflow at ${width}px`);
      assert.equal(layout.galleryColumns, width <= 768 ? 1 : 12, `responsive gallery columns at ${width}px`);
      assert.ok(layout.titleWidth <= layout.viewport, `title fits at ${width}px`);
      assert.ok(layout.heroWidth <= 1136, `Imweb-ready content width at ${width}px`);
      assert.ok(Math.abs(layout.heroLeft - layout.heroRight) <= 1, `centered content at ${width}px`);
      assert.equal(layout.infoBorderTop, '1px', `information top rule at ${width}px`);
      assert.equal(layout.infoBorderBottom, '1px', `information bottom rule at ${width}px`);
      if (width > 768) {
        assert.ok(Math.abs(layout.pairedImageWidth - ((layout.galleryWidth - 24) / 2)) <= 1, `two-up gallery at ${width}px`);
      } else {
        assert.ok(Math.abs(layout.pairedImageWidth - layout.galleryWidth) <= 1, `single-column mobile gallery at ${width}px`);
      }
    }
    checks.push('Centered full-width and two-up gallery pattern with single-column mobile fallback');
    checks.push('Project information uses matching top and bottom rules');

    await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await evaluate(`scrollTo(0, 0)`);
    await wait(100);
    const desktop = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/project-detail-desktop.png'), Buffer.from(desktop.data, 'base64'));

    await evaluate(`document.querySelector('.project-information').scrollIntoView({ block: 'start' })`);
    await wait(150);
    const desktopContent = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/project-detail-content.png'), Buffer.from(desktopContent.data, 'base64'));

    await evaluate(`document.querySelector('.gallery-item--half').scrollIntoView({ block: 'center' })`);
    await wait(150);
    const pairedGallery = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/project-detail-gallery-pairs.png'), Buffer.from(pairedGallery.data, 'base64'));

    await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate(`scrollTo(0, 0)`);
    await wait(550);
    const mobile = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/project-detail-mobile.png'), Buffer.from(mobile.data, 'base64'));

    const assetDir = path.join(root, 'assets/projects/novonesis');
    const assetSizes = fs.readdirSync(assetDir).filter(file => file.endsWith('.jpg')).map(file => fs.statSync(path.join(assetDir, file)).size);
    assert.equal(assetSizes.length, 15);
    assert.ok(assetSizes.every(size => size < 800_000));
    assert.ok(assetSizes.reduce((sum, size) => sum + size, 0) < 8_000_000);
    checks.push('15 web images remain under 8MB total and 800KB each');

    for (const pathname of ['work.html', 'index.html']) {
      const url = new URL(pathname, base).href;
      await client.send('Page.navigate', { url });
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const ready = await evaluate(`document.readyState === 'complete' && Boolean(document.querySelector('a[href="project-detail.html"]'))`);
        if (ready) break;
        await wait(100);
      }
      const link = await evaluate(`document.querySelector('a[href="project-detail.html"]')?.getAttribute('aria-label') || ''`);
      assert.match(link, /노보네시스 코리아 프로젝트 상세 보기/);
    }
    checks.push('Work and home project cards both link to the reusable detail template');

    await client.send('Page.navigate', { url: new URL('work.html', base).href });
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const ready = await evaluate(`Boolean(document.querySelector('.work-thumb-link[href="project-detail.html"] .thumb img'))`);
      if (ready) break;
      await wait(100);
    }
    const thumbnailLink = await evaluate(`Boolean(document.querySelector('.work-thumb-link[href="project-detail.html"] .thumb img'))`);
    assert.equal(thumbnailLink, true);
    await evaluate(`document.querySelector('.work-thumb-link[href="project-detail.html"]').click()`);
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const navigated = await evaluate(`location.pathname.endsWith('/project-detail.html')`);
      if (navigated) break;
      await wait(100);
    }
    const destination = await evaluate(`location.pathname`);
    assert.match(destination, /\/project-detail\.html$/);
    checks.push('Novonesis project-list thumbnail click navigates to the detail page');

    const report = { passed: true, testedAt: new Date().toISOString(), checks, errors: [], failed: [] };
    fs.writeFileSync(path.join(root, 'evidence/project-detail-qa.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (client) client.close();
    chrome.kill('SIGTERM');
    await wait(150);
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
