import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(dir, 'dist-github');
const baseUrl = 'https://lina0051.github.io/dodoweb/canivon/custom-care';
const values = {
  'sheet-id': '1R__1IzZP6rx3ZYiUuJOcOZQR3RLPTH3_YTw97z0UePs',
  'product-name': 'CANIVON COMPLETE',
  'product-price': '48000',
  'subscription-price': '38000',
  'product-capacity': '멀티 츄 5g × 30정',
  'product-target': '전 연령',
  'product-ingredients': '오메가3·MSM·보스웰리아·루테인·밀크씨슬·CoQ10·블루베리',
  'product-description': '반려견의 건강한 일상을 위한 종합 영양 솔루션',
  'product-image': `${baseUrl}/assets/product-fallback.png`,
  'dog-image': 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
  'icon-joint': 'assets/i-j.png',
  'icon-eye': 'assets/i-e.png',
  'icon-heart': 'assets/i-h.png',
  'icon-skin': 'assets/i-s.png',
  'icon-liver': 'assets/i-l.png',
  'icon-energy': 'assets/i-n.png',
  'icon-daily': 'assets/i-d.png',
  'loading-dog-gif': `${baseUrl}/assets/canivon-running-dog.gif`,
  'purchase-url': 'https://canivon.com/all',
  'subscription-url': '',
  'senior-age': '8',
  'kg-per-stick': '5',
  'discount-rate': '21',
};

const read = (name) => fs.readFileSync(path.join(dir, name), 'utf8');
const replaceValues = (source) => {
  let output = source;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }
  return output;
};

const html = replaceValues(read('html.txt'));
const css = replaceValues(read('css.txt'));
const js = replaceValues(read('javascript.txt'));
const version = '20260901-3';
const loader = `<link rel="stylesheet" href="${baseUrl}/widget.min.css?v=${version}">${html}<script src="${baseUrl}/widget.min.js?v=${version}"></script>`;
const fetchLoader = `<div id="cv-loader"></div><script>(()=>{const b="${baseUrl}",v="${version}",m=document.getElementById("cv-loader"),l=document.createElement("link");l.rel="stylesheet";l.href=b+"/widget.min.css?v="+v;document.head.appendChild(l);fetch(b+"/widget.html?v="+v).then(r=>{if(!r.ok)throw new Error("CANIVON HTML "+r.status);return r.text()}).then(h=>{m.outerHTML=h;const s=document.createElement("script");s.src=b+"/widget.min.js?v="+v;document.body.appendChild(s)}).catch(e=>{m.textContent="맞춤 영양제를 불러오지 못했습니다.";console.error(e)})})()</script>`;
const page = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CANIVON 맞춤 영양 추천</title><link rel="stylesheet" href="widget.min.css?v=${version}"></head><body>${html}<script src="widget.min.js?v=${version}"></script></body></html>`;
const outputs = {
  'widget.min.css': css,
  'widget.min.js': js,
  'widget.html': html,
  'imweb-loader.html': loader,
  'imweb-fetch-loader.html': fetchLoader,
  'index.html': page,
};
const unresolved = Object.values(outputs).join('').match(/{{[^{}]+}}/g);
if (unresolved) {
  throw new Error(`치환되지 않은 배포 값: ${[...new Set(unresolved)].join(', ')}`);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
for (const [name, content] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(outDir, name), content);
}
for (const name of ['i-j.png', 'i-e.png', 'i-h.png', 'i-s.png', 'i-l.png', 'i-n.png', 'i-d.png', 'canivon-running-dog.gif', 'product-fallback.png']) {
  fs.copyFileSync(path.join(dir, 'assets', name), path.join(outDir, 'assets', name));
}

for (const [name, content] of Object.entries(outputs)) {
  console.log(`${name}: ${Buffer.byteLength(content).toLocaleString()} bytes`);
}
