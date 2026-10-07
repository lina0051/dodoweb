# Design · 디자인코드 메인과 프로젝트

## Source of truth
- Status: Active. Last refreshed: 2026-10-01.
- Primary surfaces: `index.html` 메인, `work.html` 프로젝트, `process.html` 프로세스, `contact.html` 상담신청.
- 시각 기준: `../soro-design-system/DESIGN.md`, 원본 `reference/main.html`, 원문 base/common/main CSS, 사용자 제공 브랜드 로고.
- 프로젝트 상세 기준: `WORK-DESIGN.md`.
- 최신 요구: 히어로 → 프로젝트 → 히스토리 → 차별화 4가지 → 파트너 → FAQ → Contact Us 푸터. 메인 프로세스 영역은 삭제하되 상단 메뉴의 프로세스 항목은 유지한다.

## Brand
- 디자인코드. 큰 영문 타이포, 넓은 여백, 흑백과 베이지, 원본 주황색 포인트, 정사각형 프로젝트 이미지.
- 로고는 사용자가 제공한 원본 PNG를 유지한다.
- 임의의 수상·실적·고객사·성과 수치를 만들지 않는다. 자료 미제공 영역은 임시 상태를 표시한다.

## Product goals
- 기업 공간 프로젝트와 일하는 방식을 소개하고 프로젝트 탐색·상담으로 이어지게 한다.
- PC에서 프로젝트 3열 × 2줄, 모바일 2열 × 3줄.
- 원본 콘텐츠가 아닌 디자인코드의 제안 카피와 교체 가능한 데이터로 구성한다.

## Personas and jobs
- 사무공간의 신설·이전·리뉴얼을 준비하는 기업 담당자.
- 프로젝트 확인 → 진행 과정과 차별점 이해 → 질문 확인 → 연락.

## Information architecture
- 메인: `/`, `index.html`.
- 프로젝트: `work.html`. 기존 9개 업종 필터·6개 데이터 유지.
- 프로세스: `process.html`. 계약 전, 계약 후·착공 전, 착공 후의 3개 구간과 9개 단계.
- 상담신청: `contact.html`. 프로젝트·프로세스 페이지와 동일한 `.sub-container`, `.sub-wrap`, `.sub-title`, `.btit`, `.stit` 타이틀 시스템을 사용한다. 본문은 좌측 상담 안내·연락처와 우측 프로젝트 정보 폼의 2열 구성이며 모바일에서는 한 열로 전환한다.
- 소개 대안: `about-alt.html`. 기존 `about.html`은 유지하고, 영문 지표 레이블·검증된 수치·프로젝트 이미지 스트립을 중심으로 한 두 번째 소개 시안을 제공한다.
- 로고: 메인. 디자인코드: 메인 차별화. 상담신청: 메인 연락처.
- 메인 프로젝트 6건. 사진 프로젝트를 먼저 배치하고 로고 프로젝트를 뒤에 배치한다.

## Design principles
- 원본 CSS 사본을 수정하지 않는다. 새 구성은 `home.css`에서 문맥을 한정한다.
- 타이틀 영문, 설명 한글. 원본 `.btit`, `.award-*`, `.work-item`, `.faq-*`, `.more-btn` 문맥을 우선 재사용한다.
- OBSERVED: 원본 타이포·색·프로젝트 카드·연도별 행. DERIVED: 차별화·파트너 조합. EXTENDED: 슬라이더·클릭 FAQ·메뉴 연결.
- 원본 메인 전체와 픽셀 일치한다고 주장하지 않는다. 사용자 지정 구성과 콘텐츠를 원본 시각 언어로 조합한다.

## Visual language
- Pretendard Variable. 원본 common.css의 일반 `.btit` 크기·행간·자간 유지.
- 히어로 제목은 원본 `.main-visual .btit` 기반. 모바일 슬라이드 내 두 줄 표시에 필요한 행간 1.1은 명시적 구성 확장이다. 사진과 영상의 상단은 유지하고 하단 60%에만 어두운 그라데이션 스크림을 적용해 제목 대비를 확보한다.
- 섹션 여백: 원본 `clamp(50px,10.417vw,200px)`에서 모바일 최소 80px로 확장. 좌우는 원본 20–30px.
- 흰색, #0a0a0a, #f1efec, #ff6338. 푸터 #ff7632.
- 카드 그림자와 범용 둥근 패널을 추가하지 않는다.
- Difference 아이콘은 64px 건축 도면형 모노라인으로 통일한다. 진한 구조선을 기본으로 하고 #ff6338은 기준점·인증·초점과 같은 핵심 정보에만 제한한다.
- 아이콘에 그라데이션, 그림자, 배경 원형, 큰 채움면을 사용하지 않는다. 모션은 아이콘의 배치와 바깥 프레임을 고정하고 내부 설계선·궤도·인증·초점만 상시 반복한다. `prefers-reduced-motion` 환경에서는 정지한다.

## Components
- 공통 헤더: 실제 마크업은 `header.html`이 소유하고 `header-fallback.js`는 그와 완전히 동일한 `file://` 직접 미리보기용 본본을 제공한다. 각 페이지는 `#site-header-root`만 선언하고 `header.js`가 HTTP에서는 `header.html`, 파일 미리보기에서는 폴백을 불러온 뒤 현재 메뉴의 `aria-current`만 설정한다. 모든 페이지는 같은 모션 로고를 데스크톱 56px, 모바일 28px로 표시하고 4.4초 부근에서 정지한다.
- Process: 프로젝트 페이지와 동일한 `.sub-container`, `.sub-wrap`, `.sub-title`, `.btit`, `.stit` 상단 체계를 사용한다. 이후 세 구간 헤더와 아홉 개의 일러스트 카드로 구성하며, 4열 데스크톱·2열 태블릿(769–1180px)·1열 모바일(최대 768px)을 유지하고 `prefers-reduced-motion`에서는 스크롤 리빌을 정적으로 표시한다.
- About Alternative: 기존 수치인 업계 경력 14년·프로젝트 누적 250+와 One-stop Service 8개 항목만 사용한다. 데스크톱은 상단 1개와 하단 2개의 지표 구조, 모바일은 단일 열로 전환하며 프로젝트 이미지는 가로 스크롤과 스냅으로 탐색한다.
- 히어로: 6개 슬라이드. 첫 슬라이드는 유리 노이즈 오버레이 없이 H.264 Full HD `assets/video/magnific-highkey-studio-1080p.mp4`를 사용하고 이후 슬라이드는 기존 공간 사진을 사용한다.
- 프로젝트: 원본 WORK 카드의 정사각형·타이포·메타·선 재사용. 3열은 사용자 지정.
- 히스토리: 원본 `.award-block > .award-year + .award-list > .award-item` 구조와 반응형을 유지. 2026년 `LATEST PROJECTS`, 2025년 `RECENT PROJECTS`, 2024년 `PROJECT ARCHIVE`의 독립된 세 블록에 프로젝트명과 영문명을 표시하며 원본 수상 배지는 사용하지 않음.
- Difference: 카드 내부 영문 상세 타이틀은 사용하지 않고 한글 제목과 설명만 표시한다. 3D 제안·A/S·면허·촬영은 각각 공간 프레임·연결 궤도·건축 그리드 인증·뷰파인더로 표현한다.
- 차별화: 원본 `.blob` 도형과 원본 베이지 표면에 5가지 기준 배치.
- 파트너: 4열 × 2줄 로고 슬롯. 로고 이미지는 슬롯의 가로·세로 80% 크기로 중앙 배치하며 두 로고 행 사이 간격은 0으로 연결한다. 실제 파트너 로고 미수령.
- FAQ: 원본 질문 행과 아이콘을 사용하되 클릭·키보드 아코디언으로 확장. 자동 이동 track/mask는 제거해 답변을 읽을 수 있게 한다.
- 공통 푸터: 실제 마크업은 `footer.html`, 스타일은 `footer.css`에서 관리하며 `footer-fallback.js`는 동일한 `file://` 직접 미리보기용 본본을 제공한다. 메인·프로젝트 목록·프로세스·상담신청은 `footer.js`로 공통 푸터를 불러오고, 프로젝트 상세는 푸터 리소스를 로드하지 않는다. 푸터가 뷰포트에 진입하면 주황색 배경이 올라오고 `Contact Us` 문자, 안내 문구, 문의 버튼, 하단 정보가 순차적으로 등장한다. 일반 페이지는 메인과 동일한 sticky reveal, `70svh` 최소 높이, 곡선 전환을 사용한다. 회사정보 영역의 브랜드 마크는 사용자 제공 고정형 `assets/brand/footer-logo.png`를 원본 색상 그대로 사용한다. 시스템의 모션 감소 설정이 켜져 있으면 전환 없이 즉시 표시한다.

## Accessibility
- 슬라이더 이전·다음·정지, 키보드 좌우 키, 모바일 메뉴 Escape 지원.
- FAQ는 실제 button과 aria-expanded/controls, hidden 답변.
- reduced-motion에서는 자동 슬라이드·영상 재생을 기본 정지하고 장식 모션을 없앤다.
- WCAG 전면 인증을 주장하지 않는다.

## Responsive behavior
- 메인 프로젝트 >768px 3열, ≤768px 2열. 기존 WORK의 4/3/2열은 별도 유지.
- 모바일 차별화 2열, 파트너 2열, FAQ 세로, 푸터 세로.
- 메뉴는 ≤768px 전체 화면. 본문 anchor scroll margin은 고정 헤더를 고려한다.

## Interaction states
- 슬라이더 7초 자동 전환. 사용자가 정지하거나 화면이 숨겨지거나 히어로를 벗어나면 영상/자동 진행 정지.
- 프로젝트 상세 미구현이므로 카드에 가짜 링크 없음. 전체 프로젝트 링크는 실제 WORK 페이지로 연결.
- 상담은 전용 페이지로 이동한다. 상담 폼은 데이터 연결, 제출, 메일 앱 호출 없이 화면 구성만 제공하는 정적 마크업이다.
- 파트너는 로딩 상태가 아닌 자료 미수령 플레이스홀더. 히스토리는 제공된 자료를 반영.

## Content voice
- 카피는 기업 공간 설계 관점의 제안 문구. 푸터 영문 메시지는 공간과 일하는 방식의 연결을 강조하는 `Let’s design the way you work.`를 사용한다. 차별화·FAQ는 고객 검수 전 초안.
- 연혁·파트너·기간·보장 사항을 사실처럼 채우지 않는다.
- 데이터는 `home-content.js`, 프로젝트는 `projects.js`. 원본 스크립트나 외부 추적 코드 없음.

## Implementation constraints
- 공통 헤더 구조 검증: `tests/header-static.cjs`, 브라우저 렌더링 검증: `evidence/header-shared-qa.json`.
- 공통 푸터 구조 검증: `tests/footer-static.cjs`, 브라우저 렌더링 검증: `evidence/footer-shared-qa.json`.
- Process verification: `tests/process.cjs`, `evidence/process-qa.json`, and `evidence/process-visual-review.json`.
- 의존성 없는 HTML/CSS/JS. 기존 Python 로컬 서버 사용.
- 히어로 영상: 사용자 제공 HEVC MOV `magnific_real-highkey-studio-footage-of-a-smooth-white-lacq_seedance_1080p_16-9_24fps_26020.mov`을 웹 호환 H.264 `assets/video/magnific-highkey-studio-1080p.mp4`로 변환해 사용한다.
- 연락처 출처: 기존 작업물 `../footer-preview/index.html`의 디자인코드 회사 정보. 이번 턴에서 외부 실시간 확인은 하지 않음.
- 이미지와 영상은 로컬 파일. lazy loading 이미지가 실제 스크롤 후 로드되는지 검증.
- 검증: `tests/home.cjs`, `tests/work.cjs`, `evidence/home-qa.json`, 화면 캡처.

## Open questions
- 고객 최종 승인된 차별화·FAQ 문구.
- 실제 연혁 데이터 및 파트너 로고.
- 메인 8개 프로젝트에 사용할 실제 추가 사진·프로젝트 정보.
- 기존 작업물의 연락처·회사 정보가 최신인지 배포 전 확인.
