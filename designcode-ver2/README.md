# 디자인코드 홈페이지

`python3 preview.py` 또는 `미리보기.command`를 실행합니다. 로컬 개발 미리보기는 http://127.0.0.1:8770/ 입니다.

- `index.html`: 메인. 사진 5장의 히어로, 프로젝트 6개, 히스토리, 차별화 4가지, 파트너, FAQ, 푸터.
- `work.html`: 프로젝트 33개와 업종 필터 9개. 첫 3개 이미지는 즉시 로딩하고 나머지는 지연 로딩합니다.
- `process.html`: 현장 미팅부터 준공까지 9단계 프로세스 페이지. 사용자 제공 일러스트와 단계별 안내를 사용합니다.
- `contact.html`: 회사·담당자·일정·면적·현장 정보를 보여주는 정적 상담신청 마크업 페이지.
- `about.html`: 스크롤 전환형 기존 디자인코드 소개 페이지.
- `about-alt.html`: 수치와 프로젝트 이미지 스트립을 중심으로 재구성한 두 번째 소개 페이지 시안.
- `about-new.html`: 별도로 수정 중인 회사소개 페이지. CO+DE 흑백·블러 히어로와 텍스트 리빌, 자동으로 흐르는 사진 갤러리, Key Figures → Difference → One-stop Service를 흰색·베이지의 좌우 50:50 배경 패널로 구분해 교차 배치합니다. 기존 소개 페이지는 보관하며 메뉴의 `회사소개`로 열 수 있습니다.
- `home-content.js`: 2024-2026 연혁과 교체 가능한 차별화·파트너·FAQ 콘텐츠.
- `projects.js`: 프로젝트 목록과 상세 페이지에서 사용하는 프로젝트 33개 데이터. 메인은 `home-content.js`의 콘텐츠를 사용합니다.
- `home.css` / `home.js`: 메인 구성과 동작.
- `header.html`: 모든 페이지가 그대로 불러오는 단일 공통 헤더 마크업.
- `header.html` / `header-fallback.js` / `header.js`: 공통 헤더 마크업, `file://` 직접 미리보기 폴백, 현재 메뉴·모바일 메뉴 동작.
- `footer.html` / `footer-fallback.js` / `footer.css` / `footer.js`: 일반 페이지가 공유하는 푸터 마크업·`file://` 폴백·스타일·로더. 프로젝트 상세는 푸터를 로드하지 않는다.
- `work.css` / `work.js`: 기존 메뉴 외관, 프로젝트 레이아웃과 필터.
- `design-system/`: 수정하지 않은 원본 CSS 및 Pretendard Variable.
- `DESIGN.md`: 메인·프로젝트 공통 구현 계약. `WORK-DESIGN.md`: 이전 WORK 상세 기준.
- `evidence/`: 데스크톱·모바일 캡처와 실제 테스트 결과.

메인 프로젝트는 6건입니다. 비트리는 로고 이미지, 액시언은 공간 사진을 사용합니다. 메인 히어로는 고객 전달 배너 사진 5장을 스튜디오비사이드 → 노보네시스 → 카카오 → 에이펫 → 메디스팬 순으로 보여줍니다. 사진은 7초마다 전환합니다. `We Design Together` / `일하고싶은공간, 디자인코드가함께설계합니다.` 문구는 고정 표시합니다.

연혁과 파트너는 자료 미수령 상태입니다. 제안 카피는 고객 검수 후 교체할 수 있습니다. 푸터 연락처는 기존 footer-preview 작업물에서 가져왔으며 이번 작업에서 외부 확인하지 않았습니다. 상담신청은 데이터 연결이나 제출 동작이 없는 정적 폼 마크업입니다.

공통 헤더와 푸터 구조는 `node tests/header-static.cjs`, `node tests/footer-static.cjs`로 검증합니다. 두 번째 소개 페이지는 `node tests/about-alt-static.cjs`로 구조를 검증합니다. Playwright/Chrome 설치 환경에서는 `node tests/home.cjs`, `node tests/work.cjs`, `node tests/process.cjs`, `node tests/contact.cjs`로 화면 동작을 검증하며, 각 테스트는 `BASE_URL`로 경로를 변경할 수 있습니다. 아직 외부 배포하지 않은 로컬 구현입니다.

2026-10-22 리소스 정리: 미사용 미디어 40개와 `.DS_Store` 3개(67,397,099바이트, 약 64.3MiB)를 휴지통으로 옮겼습니다. 정확한 경로·해시·복구 위치는 `evidence/resource-cleanup-manifest.json`에 기록했습니다. 기존 소개 페이지, 디자인 시스템, 검증 자료와 원본 출처 기록은 보존했습니다. 메인의 미사용 샘플 데이터와 `projects.js` 로드를 제거하고, 반복 DOM 조회를 줄였습니다.

리소스 참조는 `node tests/assets-static.cjs`로 검사합니다. Playwright/Chrome 설치 환경에서 `BASE_URL=http://127.0.0.1:8770/ node tests/cleanup-smoke.cjs`로 8개 페이지의 PC·모바일 화면, 이미지, 필터, 모바일 메뉴와 미리보기 폴백을 검증합니다. `BASE_URL`은 실행 중인 미리보기 서버의 루트 주소를 지정합니다. 정리 전후 결과는 `evidence/resource-cleanup-before-qa.json`, `evidence/resource-cleanup-after-qa.json`에 있습니다. 이번 정리를 위해 프로젝트 의존성을 추가하지 않았습니다.
