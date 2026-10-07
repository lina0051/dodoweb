const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.heroStarts = [];
      document.addEventListener('playing', event => {
        const video = event.target;
        if (!video.closest('.hero-slide')) return;
        const slide = video.closest('.hero-slide');
        window.heroStarts.push({
          ready: document.readyState,
          time: video.currentTime,
          offset: slide.getBoundingClientRect().left
        });
      }, true);
    });
    await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:8770/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      window.heroPlayback = [];
      document.querySelectorAll('.hero-slide video').forEach(video => {
        video.addEventListener('ended', () => window.heroPlayback.push({
          source: video.getAttribute('src'),
          time: video.currentTime,
          duration: video.duration
        }));
      });
    });
    assert.deepEqual(await page.locator('.hero-slide video').evaluateAll(videos => videos.map(video => video.getAttribute('src'))), [
      'assets/video/designcode-hero-line-to-space-HQ.webm',
      'assets/video/magnific-highkey-studio-1080p.mp4'
    ]);
    assert.deepEqual(await page.locator('.hero-slide video').evaluateAll(videos => videos.map(video => video.loop)), [false, false]);
    await page.waitForFunction(() => document.querySelector('.hero-slide.is-active').dataset.slide === '2', null, { timeout: 30000 });
    const playback = await page.evaluate(() => window.heroPlayback);
    assert.equal(playback.length, 2, 'both videos must end before advancing to the first photo');
    playback.forEach(video => assert.ok(Math.abs(video.time - video.duration) < 0.1, 'each video must play to its full duration'));
    const starts = await page.evaluate(() => window.heroStarts);
    assert.equal(starts.length, 2);
    starts.forEach(start => {
      assert.equal(start.ready, 'complete', 'playback must wait for page loading');
      assert.ok(start.time < 0.1, 'playback must start at the opening frame');
      assert.ok(Math.abs(start.offset) < 1, 'playback must wait until the slide is fully on screen');
    });
    assert.deepEqual(await page.locator('.hero-slide video').evaluateAll(videos => videos.map(video => video.paused)), [true, true]);

    await page.locator('#slide-prev').click();
    await page.waitForTimeout(250);
    assert.deepEqual(await page.locator('#hero-video').evaluate(video => [video.currentTime, video.paused]), [0, true], 'the opening frame must remain still during the slide transition');
    await page.waitForFunction(() => !document.querySelector('#hero-video').paused);
    await page.locator('#slide-next').click();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    await page.locator('#slide-prev').click();
    assert.equal(await page.locator('#hero-video').evaluate(video => video.currentTime), 0, 'returning to a video must rewind it');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('#hero-video').currentTime > 0.5);
    await page.evaluate(() => scrollTo({ top: document.querySelector('#projects').offsetTop, behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('#hero-video').paused);
    const pausedTime = await page.locator('#hero-video').evaluate(video => video.currentTime);
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#hero-video').evaluate(video => video.currentTime), pausedTime);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(time => document.querySelector('#hero-video').currentTime > time + 0.2, pausedTime);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => [...document.querySelectorAll('.hero-slide video')].every(video => video.paused));
    await page.locator('#slide-prev').click();
    assert.equal(await page.locator('#hero-video-arch').evaluate(video => video.currentTime), 0);
    await page.locator('#hero').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('.hero-slide.is-active').getAttribute('data-slide'), '6');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.hero-slide.is-active').getAttribute('data-slide'), '0');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, playback, starts, checks: ['video order', 'both videos play to the end', 'opening frame held until fully visible', 'rewind on revisit', 'pause off screen and resume', 'reduced motion', 'keyboard wraparound'], errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
