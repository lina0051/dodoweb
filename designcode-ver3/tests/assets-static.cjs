const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const assets = new Set();
const sources = fs.readdirSync(root).filter(file => /\.(html|css|js)$/.test(file));
for (const file of sources) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const [reference] of source.matchAll(/assets\/[\w./-]+\.(?:png|jpe?g|webp|svg|mp4|webm|woff2?)/g)) assets.add(reference);
}

// Partner paths are generated at runtime, so literal-path searches miss them.
const context = { window: {} };
for (const file of ['projects.js', 'home-content.js']) vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
function collect(value) {
  if (typeof value === 'string' && value.startsWith('assets/')) assets.add(value);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
}
collect(context.window);
assert.equal(context.window.HOME_CONTENT.partners.length, 46);
for (const asset of assets) assert.ok(fs.existsSync(path.join(root, asset)), `Missing asset: ${asset}`);

const styles = fs.readFileSync(path.join(root, 'design-system/system.css'), 'utf8');
for (const [, reference] of styles.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  if (/^(?:data:|https?:|#)/.test(reference)) continue;
  assert.ok(fs.existsSync(path.resolve(root, 'design-system', reference.split(/[?#]/)[0])), `Missing design-system asset: ${reference}`);
}
console.log(`${assets.size} runtime asset paths and design-system fonts exist, including archived pages and dynamic partner logos.`);
