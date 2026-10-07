# 디자인코드 홈페이지

`python3 preview.py` 또는 `미리보기.command`를 실행합니다. 로컬 개발 미리보기는 http://127.0.0.1:8770/ 입니다.

- `index.html`: 메인. 히어로, 프로젝트 8개, 히스토리, 차별화 5가지, 파트너, FAQ, 푸터.
- `work.html`: 기존 프로젝트 페이지. 9개 업종 필터와 6개 프로젝트 유지.
- `process.html`: 현장 미팅부터 준공까지 9단계 프로세스 페이지. 사용자 제공 일러스트와 단계별 안내를 사용합니다.
- `contact.html`: 회사·담당자·일정·면적·현장 정보를 보여주는 정적 상담신청 마크업 페이지.
- `about.html`: 스크롤 전환형 기존 디자인코드 소개 페이지.
- `about-alt.html`: 수치와 프로젝트 이미지 스트립을 중심으로 재구성한 두 번째 소개 페이지 시안.
- `home-content.js`: 2024-2026 연혁과 교체 가능한 차별화·파트너·FAQ 콘텐츠.
- `projects.js`: 기존 프로젝트 데이터. 실제 3건 + 샘플 3건.
- `home.css` / `home.js`: 메인 구성과 동작.
- `header.html`: 모든 페이지가 그대로 불러오는 단일 공통 헤더 마크업.
- `header.html` / `header-fallback.js` / `header.js`: 공통 헤더 마크업, `file://` 직접 미리보기 폴백, 현재 메뉴·모바일 메뉴 동작.
- `footer.html` / `footer-fallback.js` / `footer.css` / `footer.js`: 일반 페이지가 공유하는 푸터 마크업·`file://` 폴백·스타일·로더. 프로젝트 상세는 푸터를 로드하지 않는다.
- `work.css` / `work.js`: 기존 메뉴 외관, 프로젝트 레이아웃과 필터.
- `design-system/`: 수정하지 않은 원본 CSS 및 Pretendard Variable.
- `DESIGN.md`: 메인·프로젝트 공통 구현 계약. `WORK-DESIGN.md`: 이전 WORK 상세 기준.
- `evidence/`: 데스크톱·모바일 캡처와 실제 테스트 결과.

메인 프로젝트는 기존 6건과 메인 전용 샘플 2건을 합쳐 8건입니다. 샘플은 실제 실적이 아닙니다. 비트리와 액시언은 현재 로고 이미지이며 준공 사진을 받으면 교체합니다. 메인 히어로는 `assets/video/designcode-hero-line-to-space-HQ.webm`와 기존 영상을 같은 문구와 디자인으로 보여주는 영상 2개, 공간 사진 5개로 구성된 7개 슬라이드입니다. 영상은 처음부터 끝까지 재생한 뒤, 사진은 7초 후 다음 슬라이드로 넘어갑니다.

연혁과 파트너는 자료 미수령 상태입니다. 제안 카피는 고객 검수 후 교체할 수 있습니다. 푸터 연락처는 기존 footer-preview 작업물에서 가져왔으며 이번 작업에서 외부 확인하지 않았습니다. 상담신청은 데이터 연결이나 제출 동작이 없는 정적 폼 마크업입니다.

공통 헤더와 푸터 구조는 `node tests/header-static.cjs`, `node tests/footer-static.cjs`로 검증합니다. 두 번째 소개 페이지는 `node tests/about-alt-static.cjs`로 구조를 검증합니다. Playwright/Chrome 설치 환경에서는 `node tests/home.cjs`, `node tests/work.cjs`, `node tests/process.cjs`, `node tests/contact.cjs`로 화면 동작을 검증하며, 각 테스트는 `BASE_URL`로 경로를 변경할 수 있습니다. 아직 외부 배포하지 않은 로컬 구현입니다.
