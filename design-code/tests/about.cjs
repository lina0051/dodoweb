const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const base = process.env.BASE_URL || 'http://127.0.0.1:8770/about.html';
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'design-code-about-'));
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
    await evaluate(`document.fonts.ready`);
    await evaluate(`(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
        scrollTo(0, y);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      await Promise.race([
        Promise.all([...document.images].map(image => image.complete ? Promise.resolve() : new Promise(resolve => image.addEventListener('load', resolve, { once: true })))),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);
      scrollTo(0, 0);
    })()`);

    const structure = await evaluate(`(() => ({
      oldIntro: document.querySelectorAll('.about-intro').length,
      heading: document.querySelector('.about-studio h1').innerText,
      label: document.querySelector('.about-studio__label').innerText,
      copyHeading: document.querySelector('.about-studio__copy h2').innerText,
      copyCount: document.querySelectorAll('.about-studio__copy p').length,
      copyIncludesOrigin: document.querySelector('.about-studio__copy').innerText.includes('Cooperative Design'),
      storySections: document.querySelectorAll('.about-story').length,
      order: Boolean(document.querySelector('.about-studio + .about-project-rail + .about-metrics')),
      lowerOrder: Boolean(document.querySelector('.about-metrics + .about-difference')),
      cards: document.querySelectorAll('.about-project-card').length,
      meaningfulImages: document.querySelectorAll('.about-project-rail__track img[alt]:not([alt=""])').length,
      galleryHook: document.querySelectorAll('[data-project-gallery]').length,
      serviceItems: document.querySelectorAll('.service-item').length,
      serviceIcons: document.querySelectorAll('.service-item .service-icon[data-icon^="tabler:"]').length,
      serviceIconStrokeWidths: [...document.querySelectorAll('.service-item .service-icon')].every(icon => getComputedStyle(icon).strokeWidth === '1px'),
      serviceIconColorsMatchPrimary: (() => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--primary)';
        document.body.append(probe);
        const primary = getComputedStyle(probe).color;
        probe.remove();
        return [...document.querySelectorAll('.service-item .service-icon')].every(icon => getComputedStyle(icon).stroke === primary);
      })(),
      allImagesLoaded: [...document.querySelectorAll('.about-project-card img')].every(image => image.complete && image.naturalWidth > 0),
      currentNav: document.querySelector('.site-nav [aria-current="page"]')?.getAttribute('href'),
      bannedDashes: /[—–]/.test(document.body.innerText)
    }))()`);
    assert.deepEqual(structure, {
      oldIntro: 0,
      heading: 'Our\nStory',
      label: '» About',
      copyHeading: 'C O + D E 협업으로 완성하는 공간 디자인',
      copyCount: 2,
      copyIncludesOrigin: true,
      storySections: 0,
      order: true,
      lowerOrder: true,
      cards: 4,
      meaningfulImages: 4,
      galleryHook: 1,
      serviceItems: 8,
      serviceIcons: 8,
      serviceIconStrokeWidths: true,
      serviceIconColorsMatchPrimary: true,
      allImagesLoaded: true,
      currentNav: 'about.html',
      bannedDashes: false
    });
    checks.push('Our Story introduction absorbs the former Story content and removes the duplicate section');

    await evaluate(`scrollTo(0, 100)`);
    await wait(120);
    const scrolledHeader = await evaluate(`(() => {
      const header = document.querySelector('.site-header');
      const style = getComputedStyle(header);
      return {
        active: header.classList.contains('is-scrolled'),
        background: style.backgroundColor,
        backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
        divider: style.borderBottomColor
      };
    })()`);
    assert.equal(scrolledHeader.active, true);
    assert.equal(scrolledHeader.background, 'rgba(255, 255, 255, 0.72)');
    assert.match(scrolledHeader.backdropFilter, /blur\(18px\).*saturate\(1\.4\)/);
    assert.equal(scrolledHeader.divider, 'rgba(10, 10, 10, 0.08)');
    await evaluate(`scrollTo(0, 0)`);
    checks.push('Scrolled header uses translucent white, backdrop blur, saturation, and a subtle divider');

    const initialRailX = await evaluate(`getComputedStyle(document.querySelector('.about-project-rail__track')).transform`);
    await evaluate(`(() => {
      const section = document.querySelector('.about-project-rail');
      const viewport = section.querySelector('.about-project-rail__viewport');
      const top = section.getBoundingClientRect().top + scrollY;
      const distance = section.offsetHeight - viewport.offsetHeight;
      scrollTo(0, top + distance * .5);
    })()`);
    await wait(300);
    const galleryMotion = await evaluate(`(() => ({
      transform: getComputedStyle(document.querySelector('.about-project-rail__track')).transform,
      travel: Number.parseFloat(getComputedStyle(document.querySelector('.about-project-rail')).getPropertyValue('--rail-travel')),
      sticky: getComputedStyle(document.querySelector('.about-project-rail__viewport')).position,
      widths: [...document.querySelectorAll('.about-project-card')].map(card => Math.round(card.getBoundingClientRect().width)),
      offsets: [...document.querySelectorAll('.about-project-card')].map(card => Math.round(card.offsetTop)),
      radii: [...document.querySelectorAll('.about-project-card')].map(card => getComputedStyle(card).borderRadius),
      imageRadii: [...document.querySelectorAll('.about-project-card img')].map(image => getComputedStyle(image).borderRadius),
      ready: document.querySelector('.about-project-rail').dataset.galleryReady
    }))()`);
    const movedRailX = galleryMotion.transform;
    assert.notEqual(initialRailX, movedRailX);
    assert.ok(galleryMotion.travel > 0);
    assert.equal(galleryMotion.sticky, 'sticky');
    assert.ok(new Set(galleryMotion.widths).size >= 4);
    assert.ok(new Set(galleryMotion.offsets).size >= 4);
    assert.deepEqual(galleryMotion.radii, ['0px', '0px', '0px', '0px']);
    assert.deepEqual(galleryMotion.imageRadii, ['0px', '0px', '0px', '0px']);
    assert.equal(galleryMotion.ready, 'true');
    checks.push('Vertical scroll drives a sticky, staggered horizontal project gallery');

    await evaluate(`(() => {
      const section = document.querySelector('.about-project-rail');
      const viewport = section.querySelector('.about-project-rail__viewport');
      const top = section.getBoundingClientRect().top + scrollY;
      const distance = section.offsetHeight - viewport.offsetHeight;
      const stickyTop = innerWidth <= 768 ? 64 : 96;
      scrollTo(0, top - stickyTop + distance);
    })()`);
    await wait(250);
    const galleryEnd = await evaluate(`(() => {
      const section = document.querySelector('.about-project-rail');
      const track = section.querySelector('.about-project-rail__track');
      const matrix = new DOMMatrixReadOnly(getComputedStyle(track).transform);
      return {
        progress: Number(section.dataset.galleryProgress),
        railX: matrix.m41,
        travel: Number.parseFloat(getComputedStyle(section).getPropertyValue('--rail-travel')),
        nextTop: document.querySelector('.about-metrics').getBoundingClientRect().top,
        viewportHeight: innerHeight
      };
    })()`);
    assert.ok(galleryEnd.progress >= .998, JSON.stringify(galleryEnd));
    assert.ok(Math.abs(Math.abs(galleryEnd.railX) - galleryEnd.travel) < 2, JSON.stringify(galleryEnd));
    assert.ok(Math.abs(galleryEnd.nextTop - galleryEnd.viewportHeight) < 2, JSON.stringify(galleryEnd));
    checks.push('The rail reaches its final image before releasing into the next vertical section');

    const layouts = [];
    for (const width of [320, 390, 768, 769, 1024, 1280, 1440, 1920]) {
      await client.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width <= 768 });
      await wait(80);
      const layout = await evaluate(`(() => ({
        width: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth,
        studioColumns: new Set([...document.querySelectorAll('.about-studio__content > *')].map(item => Math.round(item.getBoundingClientRect().left))).size,
        titleFits: document.querySelector('.about-studio h1').getBoundingClientRect().right <= innerWidth,
        serviceColumns: new Set([...document.querySelectorAll('.service-item')].map(item => Math.round(item.getBoundingClientRect().left))).size,
        serviceCards: [...document.querySelectorAll('.service-item')].every(item => getComputedStyle(item).backgroundColor === getComputedStyle(document.documentElement).getPropertyValue('--beige').trim() || getComputedStyle(item).backgroundColor !== 'rgba(0, 0, 0, 0)'),
        differenceColumns: new Set([...document.querySelectorAll('.difference-item')].map(item => Math.round(item.getBoundingClientRect().left))).size,
        differenceBlockFlow: [...document.querySelectorAll('.difference-item')].every(item => getComputedStyle(item).display === 'block'),
        metricSectionColumns: new Set([...document.querySelectorAll('.about-metrics > *')].map(item => Math.round(item.getBoundingClientRect().left))).size,
        sectionTitleSize: getComputedStyle(document.querySelector('.metrics-heading h2')).fontSize,
        sectionTitleSystemMatches: (() => {
          const styles = ['.metrics-heading h2', '.difference-detail .btit', '.service-detail .about-section-heading h3'].map(selector => getComputedStyle(document.querySelector(selector)));
          return ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'].every(property => new Set(styles.map(style => style[property])).size === 1);
        })()
      }))()`);
      assert.equal(layout.overflow, false, `no horizontal overflow at ${width}px`);
      assert.equal(layout.titleFits, true, `studio title fits at ${width}px`);
      assert.equal(layout.studioColumns, width <= 768 ? 1 : 2);
      assert.equal(layout.serviceColumns, width <= 768 ? 2 : 4);
      assert.equal(layout.serviceCards, true);
      assert.equal(layout.differenceColumns, width > 1200 ? 4 : 2);
      assert.equal(layout.differenceBlockFlow, true);
      assert.equal(layout.metricSectionColumns, width <= 768 ? 1 : 2);
      assert.equal(layout.sectionTitleSystemMatches, true, `section title styles match at ${width}px`);
      if (width > 768) assert.equal(layout.sectionTitleSize, '100px', `desktop section title is 100px at ${width}px`);
      layouts.push(layout);
    }
    checks.push('Eight responsive widths preserve the intended grids without horizontal overflow');

    await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await evaluate(`scrollTo(0, 0)`);
    await wait(150);
    const desktop = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/about-studio-desktop.png'), Buffer.from(desktop.data, 'base64'));

    await evaluate(`(() => {
      const section = document.querySelector('.about-project-rail');
      const viewport = section.querySelector('.about-project-rail__viewport');
      const top = section.getBoundingClientRect().top + scrollY;
      const distance = section.offsetHeight - viewport.offsetHeight;
      scrollTo(0, top + distance * .5);
    })()`);
    await wait(150);
    const rail = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/about-studio-rail.png'), Buffer.from(rail.data, 'base64'));

    await evaluate(`(() => {
      const section = document.querySelector('.about-difference');
      scrollTo(0, section.getBoundingClientRect().top + scrollY - 96);
    })()`);
    await wait(150);
    const differenceDesktop = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/about-difference-desktop.png'), Buffer.from(differenceDesktop.data, 'base64'));

    await evaluate(`(() => {
      const section = document.querySelector('.service-detail');
      scrollTo(0, section.getBoundingClientRect().top + scrollY - 96);
    })()`);
    await wait(150);
    const serviceDesktop = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/about-service-desktop.png'), Buffer.from(serviceDesktop.data, 'base64'));

    await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate(`scrollTo(0, 0)`);
    await wait(650);
    const mobile = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/about-studio-mobile.png'), Buffer.from(mobile.data, 'base64'));

    await evaluate(`(() => {
      const section = document.querySelector('.about-project-rail');
      const viewport = section.querySelector('.about-project-rail__viewport');
      const top = section.getBoundingClientRect().top + scrollY;
      const distance = section.offsetHeight - viewport.offsetHeight;
      scrollTo(0, top + distance * .5);
    })()`);
    await wait(200);
    const mobileRail = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/about-gallery-mobile.png'), Buffer.from(mobileRail.data, 'base64'));

    await evaluate(`(() => {
      const section = document.querySelector('.about-difference');
      scrollTo(0, section.getBoundingClientRect().top + scrollY - 64);
    })()`);
    await wait(150);
    const differenceMobile = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/about-difference-mobile.png'), Buffer.from(differenceMobile.data, 'base64'));

    await evaluate(`(() => {
      const section = document.querySelector('.service-detail');
      scrollTo(0, section.getBoundingClientRect().top + scrollY - 64);
    })()`);
    await wait(150);
    const serviceMobile = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/about-service-mobile.png'), Buffer.from(serviceMobile.data, 'base64'));
    checks.push('Desktop and mobile gallery, Difference, and service-card states are captured');

    await client.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await client.send('Page.reload');
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (await evaluate(`document.readyState === 'complete' && Boolean(document.querySelector('.about-project-rail__track'))`)) break;
      await wait(100);
    }
    const reducedMotion = await evaluate(`(() => ({
      animation: getComputedStyle(document.querySelector('.about-project-rail__track')).animationName,
      overflowX: getComputedStyle(document.querySelector('.about-project-rail__viewport')).overflowX,
      counters: [...document.querySelectorAll('[data-count]')].map(item => item.textContent)
    }))()`);
    assert.equal(reducedMotion.animation, 'none');
    assert.match(reducedMotion.overflowX, /auto|scroll/);
    assert.deepEqual(reducedMotion.counters, ['14', '250']);
    checks.push('Reduced-motion mode changes the rail to manual scrolling and keeps final metric values');

    const report = { passed: true, testedAt: new Date().toISOString(), checks, layouts, errors: [], failed: [] };
    fs.writeFileSync(path.join(root, 'evidence/about-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
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
