const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'about.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'about.css'), 'utf8');

assert.match(script, /const setupSectionReveals = \(\) =>/, 'about must initialize a dedicated lower-section reveal layer');
assert.match(script, /new IntersectionObserver/, 'about section reveals must use IntersectionObserver');
assert.doesNotMatch(script, /addEventListener\(["']scroll["']/, 'about section reveals must not attach a window scroll listener');
assert.match(script, /prefers-reduced-motion:\s*reduce/, 'about motion must honor reduced motion');

for (const selector of [
  '.about-studio__title',
  '.about-studio__content',
  '[data-project-gallery]',
  '.metrics-heading h2',
  '.metric-list .metric-item',
  '.difference-list .difference-item',
  '.service-list .service-item'
]) {
  assert.ok(script.includes(selector), `${selector} must participate in the reveal sequence`);
}

assert.match(styles, /\.has-js \.about-page\.motion-ready \.about-reveal-item\s*\{[^}]*opacity:\s*0;[^}]*transform:/s, 'about reveal items must begin with opacity and a subtle transform');
assert.match(styles, /\.has-js \.about-page\.motion-ready \.about-reveal-item\.is-revealed\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/s, 'revealed about items must settle into their natural position');
assert.match(styles, /\.has-js \.about-page\.motion-ready \.about-reveal-item--studio-title\s*\{[^}]*--about-reveal-y:\s*72px/s, 'studio title must reveal as one clearly visible block');
assert.match(styles, /\.has-js \.about-page\.motion-ready \.about-reveal-item--studio-content\s*\{[^}]*--about-reveal-y:\s*48px/s, 'studio description must reveal as one clearly visible block');
assert.match(styles, /\.about-reveal-item--difference\s*\{[^}]*--about-reveal-x:\s*-30px;[^}]*--about-reveal-y:\s*0px;/, 'difference items must retain the main-page left-to-right motion language');
assert.match(styles, /\.about-reveal-item--gallery\.is-revealed \.about-project-card\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/s, 'project cards must reveal without changing the horizontal rail transform');
assert.match(styles, /@media \(prefers-reduced-motion:\s*reduce\)/, 'about styles must include a reduced-motion fallback');
assert.doesNotMatch(script, /\.about-studio__copy > \*/, 'studio description must move as one content block rather than line by line');
assert.match(styles, /\.about-studio__title h1\s*\{[^}]*font-size:\s*160px;/s, 'desktop studio title must use a 160px font size');
assert.match(styles, /\.about-studio__copy\s*\{[^}]*gap:\s*0;/s, 'studio copy must not add grid gaps');
assert.doesNotMatch(styles, /\.about-studio__copy\s*\{[^}]*gap:\s*24px;/s, 'mobile styles must not restore the studio copy gap');
assert.match(html, /about\.css\?v=20261007-studio-type-v1/, 'about motion CSS must be cache-busted');
assert.match(html, /about\.js\?v=20261007-scroll-motion-v5/, 'about motion JavaScript must be cache-busted');

console.log('About sections use scoped, observer-driven, staggered motion with reduced-motion support.');
