const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'home.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'home.css'), 'utf8');
const images = [
  'assets/hero/kakao-healthcare.jpg',
  'assets/hero/studio-bside.jpg',
  'assets/hero/novonesis.jpg',
  'assets/hero/blue-lounge.jpg',
  'assets/hero/open-office.jpg'
];

assert.equal((html.match(/class="hero-slide(?:\s|\")/g) || []).length, 7, 'hero must contain two videos plus five supplied image slides');
assert.equal((html.match(/class="hero-progress-bar(?:\s|\")/g) || []).length, 7, 'hero progress must use one bar per slide');
assert.doesNotMatch(html, /id="slide-(?:current|total)"/, 'visible slide numbers must be removed');
assert.match(html, /class="hero-progress-bar is-active"/, 'the first progress bar must be active initially');
assert.match(styles, /\.hero-progress-bar\s*\{[^}]*height:\s*2px;/, 'hero progress bars must be 2px thick');
assert.match(styles, /\.hero-slide::after\s*\{[^}]*height:\s*60%;[^}]*linear-gradient\(to bottom,[^}]*rgba\(20,19,17,\.78\) 100%\)/s, 'hero slides must use a bottom-only gradient scrim for title contrast');
assert.match(script, /slides\.length/, 'the carousel must continue to calculate navigation from its slide collection');
assert.match(styles, /\.hero-slide-copy :is\(h1,h2\)\s*\{[^}]*font-size:\s*100px;[^}]*font-weight:\s*400;[^}]*white-space:\s*nowrap;/, 'desktop hero titles must be 100px, regular weight, and stay on one line');
for (const project of ['Kakao Healthcare', 'Studio Bside', 'Novonesis', 'Apet', 'Super Creative']) {
  assert.match(html, new RegExp(`<h2>${project}</h2>`), `${project} must label its hero image`);
}

for (const image of images) {
  assert.match(html, new RegExp(`src="${image.replaceAll('.', '\\.')}`), `${image} must be used by the main hero`);
  const asset = path.join(root, image);
  assert.ok(fs.existsSync(asset), `${image} must exist`);
  assert.ok(fs.statSync(asset).size > 100_000, `${image} must contain a full-resolution hero image`);
}

assert.doesNotMatch(html, /assets\/projects\/sample-(?:tech|media)\.jpg/, 'placeholder project images must not remain in the hero');

console.log('Main hero uses all five supplied wide-cut images with two videos and seven-slide navigation.');
