# Design

## Source of truth
- Status: reduced about-page mockup, 2026-11-11.
- Current user direction: match the existing brands-page design guide while retaining the supplied rounded ambai image, current copy, left-title/right-body layout and two home-page business banners. The earlier deleted sections remain deleted.
- Scope: about.html/about.css, brands.html/brands.css and products.html/products.css use a shared page-heading rule in styles.css. The shared site frame and business-banners.css remain unchanged.
- Latest direction: place each existing subpage title in the same position and remove page-title lead copy. Use26px/500 titles, matching the existing brands-page size and the user's requested heading weight.
- Wholesale/consignment page: two equal1400px-grid cards with32px gap,16px corners and1px #e5e5e5 outer borders. The header follows the existing business-banner composition: left title and subtitle, right80px circular #ebebeb backing and40px neutral icon. Header background #f6f6f6, minimum height160px,24px/48px padding; remove both previous gradients. Keep existing 도매구매/위탁판매 copy and shared typography. Icons are a custom shopping cart for wholesale and a custom hand holding a package for consignment; both use1.5px non-scaling strokes. Below, a white body with a1px #e8e8e8 top divider and32px/48px/48px padding retains the original numbered three-step lines, descriptions and signup button. Preserve the lower three-card order-guide section, shared header/footer and page title.
- Reference: https://dadazzang-wholesale-edit.wintry-lemon-8728.chatgpt.site/imweb/store/trade/ ; retrieved copy and screenshot in .omx/artifacts/wholesale-reference/.

## Brand
Use the existing 다다짱 logo, Pretendard typography and neutral B2B site styling.

## Product goals
Display the supplied image, requested experience copy and the two established wholesale/inquiry actions.

## Personas and jobs
Shop owners and online sellers accessing business signup or asking about a bulk order.

## Information architecture
Shared header → page title → supplied ambai image → left-title/right-body experience text → brands/products explanation → two shared business banners → shared footer. The catalog and brands pages use the same page-title position before their existing content.

## Design principles
Preserve the exact supplied image, its full aspect ratio, existing card design and shared navigation. Do not reintroduce deleted copy, photo galleries or experience sections.

## Visual language
- Wholesale typography uses shared styles.css classes, without local font overrides: .text-title26px/500/1.4/#1f1f1f (same rule as page headings), .text-label16px/500/1.5/#1f1f1f, .text-body16px/400/1.9/#777. All use normal letter spacing and the existing Pretendard font. Buttons14px/500 and step numbers12px retain their control/metadata roles.
- Existing light theme, white page and pale-gray cards.
- Desktop content width1400px; page title60px below the header,48px before the first content; business banners top/bottom margin100px.
- Page titles:26px/500,1.4 line height,#1f1f1f,normal letter spacing; no subtitle. Reuse .page-heading/.page-heading__title from styles.css across all four subpages.
- Image corners8px. Card title24px; circular icon background#ebebeb.
- Text sections:80px top/bottom padding with no additional vertical margin, full-width1px #e5e5e5 bottom border and80px column gap.
- No new animation. Wholesale card headers use #f6f6f6 with #ebebeb circular icon backgrounds; lower bodies remain white.

## Components
Wholesale page: reference-style light-gray header with left title/subtitle and right circular icon, white lower body. Shared typography: card/section/page titles26px/500, labels16px/500, body16px/400/#777/1.9. Wholesale uses a custom inline shopping cart; consignment uses a custom inline hand holding a package. Both use1.5px non-scaling strokes and stay neutral #555 in80px #ebebeb circles, SVG40px. Retain numbered28px steps with thin connectors, existing copy, signup destination and48px full-width dark signup buttons. Header/body separated by1px #e8e8e8. The lower order-guide stays a1400px three-column grid with24px gaps,32px padding,12px corners and#f7f7f7 surfaces. Keep the bulk-inquiry section deleted.

One image banner, two editorial text sections and the existing business-banners component. Both text sections use32px/500 headings per the latest user request, with1.4 line height and#1f1f1f color. Body follows the brands-page typography:16px with1.9 line height and#777 color,14px paragraph spacing. Both text sections have80px top/bottom padding per the latest request for more space. The removed sections have no remaining HTML or CSS.

The user-requested brands/products explanation follows the experience divider with the same column proportions. Keep its two-line Korean heading, two paragraphs and local brands-page link. The English eyebrow and the three definitions (형태, 소재, 쓰임), including their exclusive CSS, are removed per the latest instructions.

Place the brand link under the left heading, using the brands-page outlined button guide:40px height,14px text,1px #d8d8d8 border,4px corners,14px caret, black/white hover and visible keyboard focus. Keep the section bottom border with80px bottom padding.

## Accessibility
Meaningful photo alternative, decorative card icons hidden, preserved full-card keyboard focus and semantic page landmarks.

## Responsive behavior
Maintain the existing desktop-only minimum width1440px. Verify at1440/2048px, with no horizontal overflow.

## Interaction states
The catalog has no count/sort toolbar. Align all wrapped brand-tab rows to the left content edge. Preserve original product order, brand tabs, header search, query clearing, URL filter state and empty messages. Separate the brand/search controls from the products by48px.

The left card opens the existing official business signup page in a new tab. The right card is restored to bulk-order inquiry with its original copy and email destination, per the user's rollback. Preserve the icons, shared card styling, hover/focus and shared header/footer behavior.

## Content voice
Use the main page's two banner messages and the user's two experience paragraphs unchanged. No additional company claims or prose.

## Implementation constraints
Static HTML/CSS with local assets; no dependencies or new JavaScript. Preserve shared files. Keep original photographs available to the main/brand pages.

## Open questions
None blocking this version.

## Pre-order text refinement
The lower wholesale section title is “주문 전 확인해 주세요”, shared26px/500. Latest user override for these three cards only: card titles20px/500, body16px/400/#777 with1.5 line height and-0.02em tracking. Body paragraph margins are0. Title-to-grid gap24px, card-label-to-body gap12px. Keep the1400px grid,24px column gaps,32px card padding and existing backgrounds. Definitions and follow-up guidance retain the original meaning.

## Pre-order card icons
Each of the three order-guide cards has a left64px #ebebeb circular icon background with32px #555 outline artwork,1.3px non-scaling strokes and20px gap before the text. Use package for box quantity, clipboard-text for minimum order quantity, and a custom inline delivery truck for shipping. Align icon and text to the top. Preserve the latest20px title/16px body typography and all copy; allow natural body wrapping within the existing three-column1400px grid.

## Upper trade icon colors
Differentiate the two upper icons with restrained color: wholesale warm gray #7b7267 on warm white #f8f7f5; consignment cool gray #68777e on cool white #f7f8fa. Keep the80px circles,40px artwork and1.5px non-scaling strokes. The lower order-guide icons retain neutral #555 on #ebebeb. Card header surfaces follow each palette: wholesale #efeeeb (light warm gray), consignment #eceef2 (light blue gray), lightened from the supplied screenshot colors per the latest request. Lower content bodies remain white.

## Upper card proportion refinement
User-approved refinement: upper card icons40px inside existing80px circles; retain1.5px stroke and muted palettes. Procedure body text remains16px, with1.6 line height; step gap24px. Connector ends6px before the next number circle. Signup button labels16px/500 inside unchanged48px-high full-width buttons. Lower order-guide typography and all existing copy remain unchanged.

## Bulk-order inquiry page
Use /imweb/consult/ for bulk-inquiry content and the latest user reference https://designcode-ver3.vercel.app/contact.html for composition: full-grid divider, compact contact sidebar, pale-gray two-column inputs and right-aligned outlined submit button. Preserve the exact shared header/footer, 1400px grid and desktop minimum1440px. Latest user override removes the separate upper page title; the inquiry container starts60px below the shared header; remove its upper divider per the latest user request while preserving existing spacing. The left “대량 발주 문의” remains the sole h1 at26px/500. White neutral B2B theme; no imagery or motion (variance3, motion0, density4). Left: concise request introduction, existing official signup/catalog links and confirmed contact details. Remove the previous step list and duplicate form title. Right: business information and order requirements, optional reference file, required privacy agreement and submit control. Use shared26px titles,16px labels/body,14px helper text,56px controls,4px corners and existing neutral borders. Bottom space100px.

Imweb official input-form widget supports the required text, phone, email, select, date, file and privacy fields. Two-column field styling is custom CSS, not a confirmed native widget option. Do not specify unverified file size/extension restrictions. Real collection must use the Imweb native input-form widget; the local preview performs browser validation only, sends/stores nothing and explicitly says no inquiry was received. Privacy copy is the reference's prototype wording; collection terms and retention must be finalized when connecting the native widget. No invented commercial conditions. Preserve header search and all existing navigation.

Verify required fields/email/privacy, optional date/file, truthful preview feedback, keyboard focus, 1440/2048px layout, exact shared frame and header search. Store screenshots and manual visual verdict under .omx/artifacts/bulk-order-page/ and .omx/state/bulk-order-page/.

Latest bulk-order spacing: remove the former divider’s48px inner top padding. The inquiry title and form now begin60px below the shared172px header, matching the other subpage titles.

Bulk-order scroll behavior: pin the left guide with CSS position:sticky inside the inquiry grid. Offset it60px below the full header (232px) or compact header (124px). The right form scrolls normally; the guide stops at the grid bottom and never overlays the footer.

Bulk-order left signup/catalog buttons match brands-page .brand-products-link:40px height,14px/500 label,12px icon gap,16px horizontal padding,1px #d8d8d8 border,4px corners,14px Phosphor caret; black/white hover and2px keyboard outline with6px offset. Retain existing destinations and6px space between buttons.

Remove caret icons from the left contact phone/email rows; retain their tel/mailto destinations and divider styling.

Bulk-order input, select, textarea and file-field surfaces use the existing neutral gray #f6f6f6.

Latest submit control: restore the inquiry submit button to solid #1f1f1f with white label/caret; retain its size and right alignment.

Bulk-order field and file-selector borders use1px solid #e5e5e5, matching the shared site border color.
