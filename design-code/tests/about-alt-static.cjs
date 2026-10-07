"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "about-alt.html"), "utf8");
const css = fs.readFileSync(path.join(root, "about-alt.css"), "utf8");

assert.match(html, /data-current-page="about"/, "공통 헤더에서 About 메뉴가 활성화되어야 합니다.");
assert.match(html, /Years of Experience/, "경력 지표가 있어야 합니다.");
assert.match(html, /Completed Projects/, "프로젝트 지표가 있어야 합니다.");
assert.match(html, /One-stop Service/, "원스톱 서비스 지표가 있어야 합니다.");
assert.equal((html.match(/class="about-alt-fact/g) || []).length >= 3, true, "지표 카드가 3개 이상이어야 합니다.");
assert.equal((html.match(/assets\/projects\/home\//g) || []).length, 6, "프로젝트 이미지 6개를 사용해야 합니다.");
assert.doesNotMatch(html, /mailto:/, "정적 About 페이지에서 메일 앱을 열지 않아야 합니다.");
assert.match(css, /@media \(max-width: 768px\)/, "모바일 레이아웃이 정의되어야 합니다.");
assert.match(css, /prefers-reduced-motion: reduce/, "모션 감소 설정을 지원해야 합니다.");

console.log("about-alt static checks passed");
