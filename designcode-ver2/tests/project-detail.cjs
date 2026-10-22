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
      concept: document.querySelector('.project-concept p:last-child').textContent.trim(),
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
    const navigation = await evaluate(`({
      listExists: Boolean(document.querySelector('.project-navigation-list')),
      unavailableLinks: [...document.querySelectorAll('[data-project-direction]')].every(link => link.getAttribute('aria-disabled') === 'true' && !link.hasAttribute('href')),
      followsGallery: Boolean(document.querySelector('.project-gallery').compareDocumentPosition(document.querySelector('.project-navigation')) & Node.DOCUMENT_POSITION_FOLLOWING)
    })`);
    assert.equal(navigation.listExists, false);
    assert.equal(navigation.unavailableLinks, true);
    assert.equal(navigation.followsGallery, true);
    checks.push('Bottom project navigation has only previous and next controls and disables unavailable adjacent detail pages');
    assert.equal(structure.currentNav, '프로젝트');
    assert.equal(structure.emDashCount, 0);
    checks.push('Project title, supplied information structure, concise concept and 15 real photographs');

    const systemColors = await evaluate(`(() => {
      const selectors = ['.project-eyebrow', '.project-information dt', '.project-information dd', '.project-concept p'];
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
        mastheadBottom: document.querySelector('.project-masthead').getBoundingClientRect().bottom,
        heroRect: document.querySelector('.project-hero-media').getBoundingClientRect().toJSON(),
        firstRowRule: getComputedStyle(document.querySelector('.project-information dl > div')).borderBottomWidth,
        columnRule: getComputedStyle(document.querySelector('.project-information dl > div:nth-child(2)')).borderLeftWidth,
        metadataColumns: getComputedStyle(document.querySelector('.project-information dl')).gridTemplateColumns.split(' ').length,
        informationRect: document.querySelector('.project-information').getBoundingClientRect().toJSON(),
        conceptRect: document.querySelector('.project-concept').getBoundingClientRect().toJSON(),
        conceptHeading: document.querySelector('.project-concept h2').textContent.trim(),
        conceptHeadingRect: document.querySelector('.project-concept h2').getBoundingClientRect().toJSON(),
        conceptCopyRect: document.querySelector('.project-concept-copy').getBoundingClientRect().toJSON(),
        galleryTop: document.querySelector('.project-gallery').getBoundingClientRect().top,
        introSize: getComputedStyle(document.querySelector('.project-concept-intro')).fontSize,
        metadataRowColumns: getComputedStyle(document.querySelector('.project-information dl > div')).gridTemplateColumns.split(' ').length,
        metadataRows: Array.from(document.querySelectorAll('.project-information dl > div')).map(el => ({label: el.querySelector('dt').getBoundingClientRect().toJSON(), value: el.querySelector('dd').getBoundingClientRect().toJSON()})),
        conceptBodySize: getComputedStyle(document.querySelector('.project-concept p')).fontSize,
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
      assert.equal(layout.infoBorderTop, '1px', `information table has a top rule at ${width}px`);
      assert.equal(layout.infoBorderBottom, '1px', `information table has a bottom rule at ${width}px`);
      assert.equal(layout.firstRowRule, '1px', `information rows have a dividing rule at ${width}px`);
      assert.equal(layout.columnRule, '0px', `information table has no central vertical rule at ${width}px`);
      assert.ok(layout.informationRect.top >= layout.mastheadBottom, `metadata follows the project title at ${width}px`);
      assert.ok(Math.abs(layout.heroRect.top - layout.informationRect.bottom - (width <= 768 ? 32 : 48)) <= 1, `metadata precedes the hero with consistent spacing at ${width}px`);
      assert.equal(layout.metadataColumns, 2, `metadata uses two columns at ${width}px`);
      assert.ok(Math.abs(layout.metadataRows[0].label.top - layout.metadataRows[1].label.top) <= 1, `first two fields share a row at ${width}px`);
      assert.ok(Math.abs(layout.metadataRows[2].label.top - layout.metadataRows[3].label.top) <= 1, `last two fields share a row at ${width}px`);
      assert.ok(layout.metadataRows[2].label.top > layout.metadataRows[0].label.top, `metadata uses two rows at ${width}px`);
      assert.equal(layout.metadataRowColumns, width <= 768 ? 1 : 2, `responsive label/value placement at ${width}px`);
      if (width > 768) {
        assert.ok(layout.metadataRows.every(row => Math.abs(row.label.top - row.value.top) <= 1), `labels and values share a baseline at ${width}px`);
      }
      assert.ok(Math.abs(layout.metadataRows[0].value.left - layout.metadataRows[2].value.left) <= 1, `left column values align at ${width}px`);
      assert.ok(Math.abs(layout.metadataRows[1].value.left - layout.metadataRows[3].value.left) <= 1, `right column values align at ${width}px`);
      assert.ok(Math.abs(layout.conceptRect.top - layout.heroRect.bottom - (width <= 768 ? 32 : 48)) <= 1, `introduction follows the hero with consistent spacing at ${width}px`);
      assert.ok(Math.abs(layout.galleryTop - layout.conceptRect.bottom - 80) <= 1, `gallery follows introduction after 80px at ${width}px`);
      assert.equal(layout.introSize, '19px');
      assert.equal(layout.conceptBodySize, '19px');
      assert.equal(layout.conceptHeading, 'Project Overview');
      if (width > 768) {
        assert.ok(layout.conceptCopyRect.left > layout.conceptHeadingRect.right, `overview copy sits right of its heading at ${width}px`);
        assert.ok(Math.abs(layout.conceptHeadingRect.top - layout.conceptCopyRect.top) <= 1, `overview heading and copy align at the top at ${width}px`);
      } else {
        assert.ok(layout.conceptCopyRect.top > layout.conceptHeadingRect.bottom, `overview copy follows its heading on mobile at ${width}px`);
      }
      if (width > 768) {
        assert.ok(Math.abs(layout.pairedImageWidth - ((layout.galleryWidth - 24) / 2)) <= 1, `two-up gallery at ${width}px`);
      } else {
        assert.ok(Math.abs(layout.pairedImageWidth - layout.galleryWidth) <= 1, `single-column mobile gallery at ${width}px`);
      }
    }
    checks.push('Centered full-width and two-up gallery pattern with single-column mobile fallback');
    checks.push('Ruled two-column, two-row metadata table follows the title before the hero; Project Overview and 19px copy follow the hero with an 80px gallery gap');

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
      assert.match(link, /노보네시스(?: 코리아)? 프로젝트 상세 보기/);
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
