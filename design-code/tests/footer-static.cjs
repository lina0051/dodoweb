const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'about.html', 'about-alt.html', 'work.html', 'process.html', 'contact.html'];

for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(html, /<script src="footer-fallback\.js\?v=20261002-file-fallback-v1" defer><\/script>/, `${file} must load the current file-safe shared footer markup`);
  assert.match(html, /<link rel="stylesheet" href="footer\.css\?v=20261007-footer-spacing-v4">/, `${file} must load the shared footer styles`);
  assert.match(html, /<script src="footer\.js\?v=20261002-common-v5" defer><\/script>/, `${file} must load the current shared footer module`);
  assert.match(html, /footer-fallback\.js[^<]*<\/script>[\s\S]*footer\.js/, `${file} must load shared markup before the footer module`);
  assert.match(html, /<div id="site-footer-root"><\/div>/, `${file} must declare the shared footer host`);
  assert.doesNotMatch(html, /<footer\b/, `${file} must not duplicate footer markup`);
}

const projectDetail = fs.readFileSync(path.join(root, 'project-detail.html'), 'utf8');
assert.doesNotMatch(projectDetail, /footer\.css/, 'project detail must not load shared footer styles');
assert.doesNotMatch(projectDetail, /footer\.js/, 'project detail must not load the shared footer module');
assert.doesNotMatch(projectDetail, /footer-fallback\.js/, 'project detail must not load shared footer fallback markup');
assert.doesNotMatch(projectDetail, /site-footer-root|<footer\b/, 'project detail must remain footer-free');

const sharedMarkup = fs.readFileSync(path.join(root, 'footer.html'), 'utf8');
assert.equal((sharedMarkup.match(/<footer\b/g) || []).length, 1, 'footer.html must own one footer');
assert.match(sharedMarkup, /class="footer home-footer shared-footer"/, 'shared footer must retain the established footer classes');
for (const label of ['Contact Us', '프로젝트 문의하기', 'Back to Top', '© DESIGN CODE. All rights reserved.']) {
  assert.match(sharedMarkup, new RegExp(label), `footer.html must own ${label}`);
}

const footerScript = fs.readFileSync(path.join(root, 'footer.js'), 'utf8');
assert.match(footerScript, /fetch\(["']footer\.html\?v=20261002-common-v5["']\)/, 'footer.js must load footer.html');
assert.match(footerScript, /location\.protocol === "file:"/, 'footer.js must support direct file previews');
assert.match(footerScript, /SiteFooterMarkup/, 'footer.js must use the shared file-safe footer fallback');
assert.match(footerScript, /IntersectionObserver/, 'footer.js must reveal the footer when it enters the viewport');
assert.match(footerScript, /footer-motion-sentinel/, 'footer.js must observe the content boundary instead of the sticky footer itself');
assert.match(footerScript, /footer-motion-ready/, 'footer.js must opt into motion only after the shared footer exists');
assert.match(footerScript, /is-revealed/, 'footer.js must expose a stable revealed state');
assert.match(footerScript, /prefers-reduced-motion: reduce/, 'footer.js must respect reduced-motion preferences');
assert.doesNotMatch(footerScript, /<footer\b/, 'footer.js must not contain duplicate footer markup');

const footerStyles = fs.readFileSync(path.join(root, 'footer.css'), 'utf8');
assert.match(footerStyles, /\.footer-title-char/, 'footer.css must animate the footer title by character');
assert.match(footerStyles, /\.footer-motion-ready\.is-revealed/, 'footer.css must define the revealed motion state');
assert.match(footerStyles, /\.main-container::before,[\s\S]*?\.sub-container::before\s*\{[^}]*height:\s*clamp\(20px,\s*2\.5vw,\s*40px\);[^}]*border-radius:\s*0 0 clamp\(20px,\s*2\.5vw,\s*40px\) clamp\(20px,\s*2\.5vw,\s*40px\);[^}]*clip-path:\s*none;[^}]*transform:\s*none;/s, 'footer transition must be flat through the center with subtly rounded outer ends');
assert.match(footerStyles, /\.shared-footer\s*\{[^}]*padding-top:\s*clamp\(72px,\s*7\.292vw,\s*140px\);/s, 'footer contact content must begin without excessive top spacing');
assert.match(footerStyles, /\.shared-footer\s*\{[^}]*min-height:\s*auto;/s, 'footer must end at its content instead of forcing excess bottom space');
assert.doesNotMatch(footerStyles, /body:not\([^}]+\.shared-footer/, 'footer.css must not change positioning by page');

const contactStyles = fs.readFileSync(path.join(root, 'contact.css'), 'utf8');
assert.doesNotMatch(contactStyles, /\.contact-page::before\s*\{[^}]*display:\s*none/, 'contact must retain the same curved footer transition as the main page');
assert.match(fs.readFileSync(path.join(root, 'contact.html'), 'utf8'), /contact\.css\?v=20261007-shared-chrome-v1/, 'contact must retain the current page-style cache version');

const fallbackContext = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'footer-fallback.js'), 'utf8'), fallbackContext);
assert.equal(fallbackContext.SiteFooterMarkup.trim(), sharedMarkup.trim(), 'file-safe footer markup must exactly match footer.html');

console.log('All standard pages load one shared footer in HTTP and direct-file previews; project detail remains footer-free.');
