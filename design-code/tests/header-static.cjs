const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pages = [
  ['index.html', 'home'],
  ['about.html', 'about'],
  ['about-alt.html', 'about'],
  ['work.html', 'work'],
  ['process.html', 'process'],
  ['contact.html', 'contact'],
  ['project-detail.html', 'work']
];

for (const [file, page] of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(html, /<link rel="stylesheet" href="work\.css\?v=20261007-header-logo-black-v1">/, `${file} must load the shared frosted-header stylesheet`);
  assert.match(html, /<script src="header-fallback\.js\?v=[^"]+" defer><\/script>/, `${file} must load the file-safe shared header markup`);
  assert.match(html, /<script src="header\.js\?v=[^"]+" defer><\/script>/, `${file} must load the shared header module`);
  assert.match(html, /header-fallback\.js[^<]*<\/script>[\s\S]*header\.js/, `${file} must load shared markup before the header module`);
  assert.match(html, new RegExp(`<div id="site-header-root" data-current-page="${page}"></div>`), `${file} must declare its shared-header page context`);
  assert.doesNotMatch(html, /<header class="site-header"/, `${file} must not duplicate the header markup`);
}

const sharedMarkup = fs.readFileSync(path.join(root, 'header.html'), 'utf8');
assert.equal((sharedMarkup.match(/<header class="site-header"/g) || []).length, 1, 'header.html must own the single shared header markup');
assert.match(sharedMarkup, /<video class="site-logo-motion logo-motion"[^>]*width="640" height="188"[^>]*data-hold-time="4\.4"/, 'shared header must retain the original motion logo contract');
assert.match(sharedMarkup, /<filter id="logo-black-layers"[\s\S]*?<feFlood flood-color="#000000" result="solid-black">[\s\S]*?<feFlood flood-color="#000000" flood-opacity="\.1" result="soft-black">/, 'shared logo filter must render solid black with 10% black for the former gray layer');
assert.doesNotMatch(sharedMarkup, /logo-white-layers/, 'shared header must not retain the old white logo filter');
assert.doesNotMatch(sharedMarkup, /site-logo-static|<img class="site-logo"/, 'shared header must not branch to a page-specific static logo');
assert.match(sharedMarkup, /data-nav-page="about" href="about\.html"/, 'shared design-code link must open the about page');
assert.match(sharedMarkup, /data-nav-page="work" href="work\.html"/, 'shared project link must be identical on every page');
assert.match(sharedMarkup, /data-nav-page="process" href="process\.html"/, 'shared process link must be identical on every page');
assert.match(sharedMarkup, /data-nav-page="contact" href="contact\.html"/, 'shared contact link must be identical on every page');
for (const label of ['디자인코드', '프로젝트', '프로세스', '상담신청']) {
  assert.match(sharedMarkup, new RegExp(label), `header.html must own the ${label} label`);
}

const headerScript = fs.readFileSync(path.join(root, 'header.js'), 'utf8');
assert.match(headerScript, /fetch\(["']header\.html\?v=[^"']+["']\)/, 'header.js must load header.html');
assert.match(headerScript, /location\.protocol === "file:"/, 'header.js must support direct file previews');
assert.match(headerScript, /SiteHeaderMarkup/, 'header.js must use the shared file-safe header fallback');
assert.doesNotMatch(headerScript, /<header class="site-header"/, 'header.js must not contain a second header template');

const fallbackContext = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'header-fallback.js'), 'utf8'), fallbackContext);
assert.equal(fallbackContext.SiteHeaderMarkup.trim(), sharedMarkup.trim(), 'file-safe header markup must exactly match header.html');

const sharedHeaderStyles = fs.readFileSync(path.join(root, 'work.css'), 'utf8');
const homeStyles = fs.readFileSync(path.join(root, 'home.css'), 'utf8');
const pageSpecificStyles = ['about-alt.css', 'about.css', 'contact.css', 'home.css', 'process.css', 'project-detail.css'].map(file => ({
  file,
  css: fs.readFileSync(path.join(root, file), 'utf8')
}));
assert.match(sharedHeaderStyles, /\.site-nav-cta\s*\{[^}]*color:\s*#fff;/, 'shared consultation button text must be white');
assert.match(sharedHeaderStyles, /\.site-logo-motion\s*\{[^}]*filter:\s*url\("#logo-black-layers"\);[^}]*opacity:\s*1;/, 'all pages must use the shared black layered logo treatment');
assert.doesNotMatch(sharedHeaderStyles, /\.site-nav-cta\s*\{[^}]*color:\s*#0a0a0a;/, 'shared consultation button must not revert to black on mobile');
assert.doesNotMatch(homeStyles, /\.home-body\.site-menu-open \.site-nav-cta\s*\{[^}]*color:\s*#0a0a0a;/, 'home mobile menu must retain the white consultation label');
assert.doesNotMatch(homeStyles, /\.home-body \.site-header:not\(\.is-scrolled\)/, 'home must use the same initial black header colors as every other page');
assert.doesNotMatch(homeStyles, /\.home-body\.site-menu-open \.site-logo-motion/, 'home mobile menu must use the shared logo treatment');
assert.match(sharedHeaderStyles, /\.site-header\.is-scrolled\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*\.94\);[^}]*border-bottom-color:\s*rgba\(10,\s*10,\s*10,\s*\.08\);/s, 'scrolled header must retain a translucent fallback and subtle divider');
assert.match(sharedHeaderStyles, /@supports[^\{]*backdrop-filter:[^\{]*\{[\s\S]*?\.site-header\.is-scrolled\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*\.72\);[^}]*-webkit-backdrop-filter:\s*blur\(18px\) saturate\(140%\);[^}]*backdrop-filter:\s*blur\(18px\) saturate\(140%\);/s, 'supported browsers must render the scrolled header as frosted glass');
for (const { file, css } of pageSpecificStyles) {
  assert.doesNotMatch(css, /(?:^|[\s,{])\.[\w-]*body\s+\.site-header\s*\{[^}]*(?:background|backdrop-filter)\s*:/s, `${file} must not override the shared header material`);
}

console.log('All pages load one identical header in HTTP and direct-file previews.');
