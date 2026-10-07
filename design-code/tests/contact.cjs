const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const base = process.env.BASE_URL || 'http://127.0.0.1:8770/contact.html';
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'design-code-contact-'));
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
      const requestId = id;
      return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject });
        socket.send(JSON.stringify({ id: requestId, method, params }));
      });
    },
    close() { socket.close(); }
  };
}

(async () => {
  const checks = [];
  let client;
  try {
    const port = await readDebuggingPort();
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
    const pageTarget = targets.find(target => target.type === 'page');
    if (!pageTarget) throw new Error('Chrome page target was not found.');
    client = connect(pageTarget.webSocketDebuggerUrl);
    await client.ready;
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Page.navigate', { url: base });
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const result = await client.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
      const location = await client.send('Runtime.evaluate', { expression: 'location.href', returnByValue: true });
      const headerReady = await client.send('Runtime.evaluate', { expression: 'Boolean(document.querySelector(".site-header"))', returnByValue: true });
      if (result.result.value === 'complete' && location.result.value === base && headerReady.result.value) break;
      await wait(100);
    }

    async function evaluate(expression) {
      const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    }

    const structure = await evaluate(`(() => ({
      heading: document.querySelector('h1').textContent,
      intro: document.querySelector('#contact-intro-title').textContent,
      mainClass: document.querySelector('main').className,
      sharedTitle: Boolean(document.querySelector('.sub-wrap > .sub-title > .btit')),
      sharedSubtitle: document.querySelector('.sub-title > .stit').textContent,
      required: document.querySelectorAll('.inquiry-form input[required]').length,
      textareas: document.querySelectorAll('.inquiry-form textarea').length,
      buttonType: document.querySelector('.form-actions button').type,
      buttonLabel: document.querySelector('.form-actions button').textContent.trim(),
      usesSharedButton: document.querySelector('.form-actions button').classList.contains('more-btn'),
      hasContactScript: [...document.scripts].some(script => script.src.endsWith('/contact.js')),
      current: document.querySelector('.site-nav a[aria-current="page"]').textContent.trim(),
      imagesReady: [...document.images].every(image => image.complete && image.naturalWidth > 0)
    }))()`);
    assert.equal(structure.heading, 'Contact Us');
    assert.equal(structure.intro, '상담신청 하기');
    assert.equal(structure.mainClass, 'sub-container contact-page');
    assert.equal(structure.sharedTitle, true);
    assert.match(structure.sharedSubtitle, /새로운 공간/);
    assert.equal(structure.required, 8);
    assert.equal(structure.textareas, 1);
    assert.equal(structure.buttonType, 'button');
    assert.equal(structure.buttonLabel, 'Send Inquiry →');
    assert.equal(structure.usesSharedButton, true);
    assert.equal(structure.hasContactScript, false);
    assert.equal(structure.current, '상담신청 →');
    assert.equal(structure.imagesReady, true);
    checks.push('Shared title system, static consultation markup, navigation and local assets');

    await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await evaluate(`(async () => {
      const logo = document.querySelector('.logo-motion');
      if (!logo) return;
      if (logo.readyState < 2) {
        await Promise.race([
          new Promise(resolve => logo.addEventListener('canplay', resolve, { once: true })),
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      }
      logo.currentTime = 4.35;
      await Promise.race([
        new Promise(resolve => logo.addEventListener('seeked', resolve, { once: true })),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
    })()`);
    await wait(150);
    const desktopSubtitleStyle = await evaluate(`(() => {
      const style = getComputedStyle(document.querySelector('.sub-title .stit'));
      return { fontSize: style.fontSize, fontWeight: style.fontWeight };
    })()`);
    assert.deepEqual(desktopSubtitleStyle, { fontSize: '26px', fontWeight: '500' });
    checks.push('Shared subtitle uses 26px and weight 500 at the 1440px PC breakpoint');

    const desktopCapture = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/contact-desktop.png'), Buffer.from(desktopCapture.data, 'base64'));

    const staticButton = await evaluate(`(() => {
      const before = location.href;
      document.querySelector('.form-actions button').click();
      return { before, after: location.href };
    })()`);
    assert.equal(staticButton.after, staticButton.before);
    checks.push('Static CTA does not submit, navigate or open an external application');

    for (const width of [1440, 1024, 768, 390, 320]) {
      await client.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      const layout = await evaluate(`(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        overflowElements: [...document.querySelectorAll('body *')]
          .filter(element => {
            const rect = element.getBoundingClientRect();
            return rect.right > innerWidth + 1 || rect.left < -1;
          })
          .slice(0, 8)
          .map(element => ({ selector: element.className || element.tagName, left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right })),
        columns: getComputedStyle(document.querySelector('.contact-layout')).gridTemplateColumns.split(' ').length,
        buttonWidth: document.querySelector('.form-actions button').getBoundingClientRect().width
      }))()`);
      assert.equal(layout.overflow, false, `no horizontal overflow at ${width}px: ${JSON.stringify(layout.overflowElements)}`);
      assert.equal(layout.columns, width <= 768 ? 1 : 2, `layout columns at ${width}px`);
      assert.ok(layout.buttonWidth > 0);
    }
    checks.push('Responsive split-to-stack layout at five viewport widths');

    await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const mobileSubtitleStyle = await evaluate(`(() => {
      const style = getComputedStyle(document.querySelector('.sub-title .stit'));
      return { fontSize: style.fontSize, fontWeight: style.fontWeight };
    })()`);
    assert.deepEqual(mobileSubtitleStyle, { fontSize: '18px', fontWeight: '500' });
    checks.push('Shared subtitle scales down to 18px on mobile while retaining weight 500');

    const navigation = await evaluate(`(() => {
      window.scrollTo(0, 0);
      const titleRect = document.querySelector('.sub-title').getBoundingClientRect();
      document.querySelector('.site-menu-toggle').click();
      const opened = document.body.classList.contains('site-menu-open');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return { opened, closed: !document.body.classList.contains('site-menu-open'), titleVisible: titleRect.top >= 0 && titleRect.bottom <= innerHeight, titleTop: titleRect.top, titleBottom: titleRect.bottom, viewportHeight: innerHeight };
    })()`);
    assert.equal(navigation.opened, true);
    assert.equal(navigation.closed, true);
    assert.equal(navigation.titleVisible, true, `title bounds ${navigation.titleTop}-${navigation.titleBottom} in ${navigation.viewportHeight}px viewport`);
    checks.push('Accessible mobile navigation and visible shared title');

    await wait(500);
    const mobileCapture = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/contact-mobile.png'), Buffer.from(mobileCapture.data, 'base64'));

    await evaluate(`document.querySelector('#inquiry').scrollIntoView()`);
    await wait(150);
    const mobileFormCapture = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/contact-mobile-form.png'), Buffer.from(mobileFormCapture.data, 'base64'));

    await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await evaluate(`document.querySelector('#inquiry').scrollIntoView()`);
    await wait(150);
    const desktopFormCapture = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/contact-desktop-form.png'), Buffer.from(desktopFormCapture.data, 'base64'));

    await evaluate(`document.querySelector('.form-actions').scrollIntoView({ block: 'center' })`);
    await wait(150);
    const desktopButtonCapture = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, 'evidence/contact-desktop-button.png'), Buffer.from(desktopButtonCapture.data, 'base64'));

    for (const pathname of ['work.html', 'process.html']) {
      const url = new URL(pathname, base).href;
      await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
      await client.send('Page.navigate', { url });
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const ready = await evaluate(`document.readyState === 'complete' && Boolean(document.querySelector('.sub-title .stit'))`);
        if (ready) break;
        await wait(100);
      }
      const pcStyle = await evaluate(`(() => {
        const style = getComputedStyle(document.querySelector('.sub-title .stit'));
        return { fontSize: style.fontSize, fontWeight: style.fontWeight };
      })()`);
      assert.deepEqual(pcStyle, { fontSize: '26px', fontWeight: '500' }, `${pathname} PC subtitle style`);

      await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      const mobileStyle = await evaluate(`(() => {
        const style = getComputedStyle(document.querySelector('.sub-title .stit'));
        return { fontSize: style.fontSize, fontWeight: style.fontWeight };
      })()`);
      assert.deepEqual(mobileStyle, { fontSize: '18px', fontWeight: '500' }, `${pathname} mobile subtitle style`);
    }
    checks.push('Work, process and consultation pages share the same responsive subtitle rule');

    const report = { passed: true, testedAt: new Date().toISOString(), checks, errors: [], failed: [] };
    fs.writeFileSync(path.join(root, 'evidence/contact-qa.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ passed: true, checks }, null, 2));
  } finally {
    if (client) client.close();
    chrome.kill('SIGTERM');
    await wait(150);
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
