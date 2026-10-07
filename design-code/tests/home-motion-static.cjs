const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'home.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'home.css'), 'utf8');

assert.match(script, /function setupScrollReveals\(\)/, 'home must initialize a dedicated scroll reveal layer');
assert.match(script, /new IntersectionObserver/, 'scroll reveals must use IntersectionObserver');
assert.doesNotMatch(script, /addEventListener\(['"]scroll['"]/, 'scroll reveals must not attach a window scroll listener');
assert.match(script, /prefers-reduced-motion:\s*reduce/, 'scroll reveals must honor reduced motion');

for (const selector of [
  '#projects .section-heading > *',
  '#home-project-list',
  '#history-list .award-block',
  '#difference-list .difference-item',
  '#partner-marquees .partner-marquee',
  '#faq-list .faq-item'
]) {
  assert.ok(script.includes(selector), `${selector} must participate in the reveal sequence`);
}

assert.match(styles, /\.home-page\.motion-ready \.scroll-reveal-item\s*\{[^}]*opacity:\s*0;[^}]*transform:/s, 'reveal items must begin with a subtle transform and opacity');
assert.match(styles, /\.home-page\.motion-ready \.scroll-reveal-item\.is-revealed\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/s, 'revealed items must settle into their natural position');
for (const variant of ['heading', 'project', 'history', 'marquee', 'faq']) {
  assert.match(styles, new RegExp(`\\.scroll-reveal-item--${variant}[^}]*--reveal-y:\\s*\\d+px`), `${variant} must rise from below`);
}
assert.doesNotMatch(script, /setProperty\('--reveal-x'/, 'section reveals must not enter from either side');
assert.doesNotMatch(script, /#home-project-list \.work-item/, 'project cards must not animate one by one');
assert.match(styles, /\.scroll-reveal-item--difference\s*\{[^}]*--reveal-x:\s*-30px;[^}]*--reveal-y:\s*0px;/, 'difference cards must enter from left to right without vertical movement');
assert.match(script, /'#difference-list \.difference-item', variant: 'difference', step: 75/, 'difference cards must keep a left-to-right stagger');
assert.match(styles, /@media \(prefers-reduced-motion:\s*reduce\)/, 'styles must include a reduced-motion fallback');
assert.match(styles, /\.hero-slide::after\s*\{[^}]*height:\s*60%;[^}]*linear-gradient\(to bottom,[^}]*rgba\(20,19,17,\.78\) 100%\)/s, 'hero slides must include a bottom gradient scrim for title contrast');
assert.match(styles, /@media \(min-width:769px\)\s*\{[\s\S]*?\.history-section,\s*\.home-faq\s*\{\s*padding-top:\s*0;/, 'history and FAQ must not double the desktop section gap');

assert.match(html, /home\.css\?v=20261007-section-spacing-v1/, 'home CSS must be cache-busted for the section-spacing update');
assert.match(html, /home\.js\?v=20261007-hero-bars-v1/, 'home motion JavaScript must be cache-busted');

console.log('Home scroll motion is scoped, observer-driven, staggered, and reduced-motion safe.');
