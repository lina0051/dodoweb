const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
(async () => {
 const browser = await chromium.launch({ headless: true, channel: 'chrome' });
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
 const errors = [], failed = [], checks = [], layouts = [];
 page.on('pageerror', e => errors.push(e.message));
 page.on('response', r => { if(r.status() >= 400) failed.push(r.url()); });
 try {
  await page.goto('http://127.0.0.1:8770/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector('.site-logo-motion')?.readyState >= 2 && document.querySelector('.footer-logo-static')?.complete);
  const logoVideo = await page.locator('.site-logo-motion').evaluate(video => ({
   autoplay: video.autoplay,
   muted: video.muted,
   loop: video.loop,
   playsInline: video.playsInline,
   width: video.videoWidth,
   height: video.videoHeight,
   duration: video.duration,
   holdTime: Number(video.dataset.holdTime),
   source: video.currentSrc,
   renderedHeight: getComputedStyle(video).height
  }));
  assert.equal(await page.locator('.site-brand .site-logo-motion').count(), 1);
  assert.match(await page.locator('.site-logo-motion').evaluate(video => getComputedStyle(video).filter), /logo-black-layers/);
  assert.equal(await page.locator('.home-footer .footer-logo-static').count(), 1);
  assert.deepEqual(await page.locator('.footer-logo-static').evaluate(image => [image.tagName,image.naturalWidth,image.naturalHeight,image.getAttribute('src')]), ['IMG',300,68,'assets/brand/footer-logo.png']);
  assert.equal(await page.locator('.footer-logo-static').evaluate(image => getComputedStyle(image).width), '120px');
  assert.deepEqual([logoVideo.autoplay,logoVideo.muted,logoVideo.loop,logoVideo.playsInline], [true,true,false,true]);
  assert.deepEqual([logoVideo.width,logoVideo.height], [640,188]);
  assert.ok(logoVideo.duration > 0);
  assert.equal(logoVideo.holdTime, 4.4);
  assert.equal(logoVideo.renderedHeight, '56px');
  assert.match(logoVideo.source, /assets\/brand\/code-wordmark-loop\.webm$/);
  await page.waitForFunction(() => { const video=document.querySelector('.site-logo-motion'); return video.paused && video.currentTime >= Number(video.dataset.holdTime); }, { timeout: 7000 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => { const video=document.querySelector('.site-logo-motion'); return video && !video.paused && video.currentTime > 0 && video.currentTime < 4.4; });
  assert.deepEqual(await page.locator('main > section, body > footer').evaluateAll(es => es.map(e => e.id)), ['hero','projects','history','about','partners','faq','site-footer']);
  const footerReveal = await page.evaluate(() => {
   const main = document.querySelector('main');
   const footer = document.querySelector('footer');
   const mainStyle = getComputedStyle(main);
   const mainCurveStyle = getComputedStyle(main, '::before');
   const footerStyle = getComputedStyle(footer);
   return {
    siblings: main.nextElementSibling === footer,
    footerInsideMain: main.contains(footer),
    mainPosition: mainStyle.position,
    mainZIndex: mainStyle.zIndex,
    mainBackground: mainStyle.backgroundColor,
    mainCurveDisplay: mainCurveStyle.display,
    mainCurveClipPath: mainCurveStyle.clipPath,
    mainCurveBackground: mainCurveStyle.backgroundColor,
    footerPosition: footerStyle.position,
    footerBottom: footerStyle.bottom,
    footerZIndex: footerStyle.zIndex,
    contactInsideFooter: footer.contains(document.querySelector('#footer-contact-title')),
    ftBackground: getComputedStyle(footer.querySelector('.ft-bg')).backgroundColor,
    bodyOverflowX: getComputedStyle(document.body).overflowX
   };
  });
  assert.deepEqual(footerReveal, {
   siblings: true,
   footerInsideMain: false,
   mainPosition: 'relative',
   mainZIndex: '1',
   mainBackground: 'rgb(255, 255, 255)',
   mainCurveDisplay: 'block',
   mainCurveClipPath: 'ellipse(100% 100% at 50% 0%)',
   mainCurveBackground: 'rgb(255, 255, 255)',
   footerPosition: 'sticky',
   footerBottom: '0px',
   footerZIndex: '0',
   contactInsideFooter: true,
   ftBackground: 'rgb(255, 118, 50)',
   bodyOverflowX: 'clip'
  });
  const middleScroll = await page.evaluate(() => {
   scrollTo({ top: document.querySelector('#projects').offsetTop, behavior: 'instant' });
   const footer = document.querySelector('footer');
   const rect = footer.getBoundingClientRect();
   const hit = document.elementFromPoint(10, innerHeight - 10);
   return {
    footerInViewport: rect.top < innerHeight && rect.bottom > 0,
    footerReceivesPointer: Boolean(hit?.closest('footer'))
   };
  });
  assert.deepEqual(middleScroll, { footerInViewport: false, footerReceivesPointer: false });
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(50);
  const revealedFooter = await page.evaluate(() => {
   const main = document.querySelector('main');
   const footer = document.querySelector('footer');
   const contactTitle = footer.querySelector('#footer-contact-title');
   const mainRect = main.getBoundingClientRect();
   const curveHeight = parseFloat(getComputedStyle(main, '::before').height);
   const link = footer.querySelector('.footer-bottom a');
   const footerRect = footer.getBoundingClientRect();
   const contactTitleRect = contactTitle.getBoundingClientRect();
   const linkRect = link.getBoundingClientRect();
   const hit = document.elementFromPoint(linkRect.left + linkRect.width / 2, linkRect.top + linkRect.height / 2);
   return {
    footerVisible: footerRect.top < innerHeight && footerRect.bottom > 0,
    footerBottom: Math.round(footerRect.bottom),
    curveClearance: Math.round(contactTitleRect.top - (mainRect.bottom + curveHeight / 2)),
    linkReceivesPointer: hit === link || link.contains(hit)
   };
  });
  assert.equal(revealedFooter.footerVisible, true);
  assert.ok(Math.abs(revealedFooter.footerBottom - 1000) <= 1);
  assert.ok(revealedFooter.curveClearance >= 50);
  assert.equal(revealedFooter.linkReceivesPointer, true);
  checks.push('Original sticky footer reveal with Contact Us copy, curved transition, restored motion header logo, static footer logo and footer interactions');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  assert.deepEqual(await page.locator('.site-nav').locator('.site-nav-item, .site-nav-cta').allTextContents(), ['디자인코드', '프로젝트', '프로세스', '상담신청 →']);
  assert.equal(await page.locator('.site-nav a').filter({hasText:'프로세스'}).getAttribute('href'), 'process.html');
  assert.equal(await page.locator('#footer-contact-title').innerText(), 'Contact Us');
  assert.equal(await page.locator('.footer-contact-intro strong').innerText(), 'Let’s design the way you work.');
  assert.equal(await page.locator('.footer-contact-intro p').innerText(), '프로젝트 문의를 남겨주시면\n확인 후 빠르게 안내드리겠습니다.');
  assert.equal(await page.locator('.footer-project-label').innerText(), '프로젝트 문의하기');
  assert.equal(await page.locator('.footer-project-label').getAttribute('href'), 'contact.html');
  assert.equal(await page.locator('.footer-project-arrow').getAttribute('href'), 'contact.html');
  assert.equal(await page.locator('.footer-project-arrow').innerText(), '→');
  assert.equal(await page.locator('.footer-contact-heading').evaluate(element => getComputedStyle(element).gridTemplateAreas), '"title intro arrow" "label intro arrow"');
  assert.equal(await page.locator('.footer-contact-heading').evaluate(element => getComputedStyle(element).rowGap), '20px');
  assert.deepEqual(await page.locator('.footer-project-arrow').evaluate(element => [getComputedStyle(element).backgroundColor,getComputedStyle(element).borderTopWidth,getComputedStyle(element).borderTopStyle]), ['rgba(0, 0, 0, 0)','1px','solid']);
  assert.deepEqual(await page.locator('.footer-contact-intro strong').evaluate(element => [getComputedStyle(element).fontSize,getComputedStyle(element).fontWeight]), ['30px','600']);
  assert.deepEqual(await page.locator('.footer-project-label').evaluate(element => [getComputedStyle(element).fontSize,getComputedStyle(element).fontWeight]), ['26px','550']);
  assert.equal(await page.locator('.footer-contact-heading').evaluate(element => getComputedStyle(element).marginBottom), '60px');
  assert.deepEqual(await page.locator('.home-page .btit, .home-footer .btit').evaluateAll(es => [...new Set(es.map(e => getComputedStyle(e).fontSize))]), ['100px']);
  assert.deepEqual(await page.locator('.home-section').evaluateAll(es => [...new Set(es.map(e => `${getComputedStyle(e).paddingTop}/${getComputedStyle(e).paddingBottom}`))]), ['200px/200px']);
  assert.equal(await page.locator('.difference-item').count(), 4);
  assert.equal(await page.locator('.difference-item h3').count(), 0);
  assert.deepEqual(await page.locator('.difference-icon').evaluateAll(icons => icons.map(icon => [...icon.classList].find(name => name.startsWith('difference-icon--')))), ['difference-icon--design','difference-icon--service','difference-icon--license','difference-icon--photo']);
  assert.deepEqual(await page.locator('.difference-icon').evaluateAll(icons => icons.map(icon => {
   const style = getComputedStyle(icon);
   return [style.width, style.height, style.color];
  })), Array(4).fill(['64px','64px','rgb(95, 91, 86)']));
  assert.deepEqual(await page.locator('.difference-icon__motion').evaluateAll(parts => parts.map(part => getComputedStyle(part).animationName)), ['difference-design-build','difference-service-orbit','difference-license-stamp','difference-photo-focus']);
  assert.deepEqual(await page.locator('.difference-icon__accent').evaluateAll(parts => parts.map(part => getComputedStyle(part).stroke)), Array(5).fill('rgb(255, 99, 56)'));
  assert.deepEqual(await page.locator('.difference-icon__accent-point--signal').evaluateAll(parts => parts.map(part => getComputedStyle(part).animationName)), Array(2).fill('difference-signal-pulse'));
  checks.push('Difference icons share a fixed 64px architectural line system with restrained orange accents and continuous internal motion');
  assert.deepEqual(await page.locator('.difference-item strong').allTextContents(), ['3D 디자인 제안','2년간 무상 A/S','실내건축전문건설면허 보유','전문 촬영사진 공유']);
  assert.deepEqual(await page.locator('.difference-item p').allTextContents(), ['공간을 미리 확인할 수 있도록 3D 투시도를 통해 디자인을 구체적으로 제안합니다.','준공 후 기본 1년에 추가 1년을 더해 최대 2년간 하자보증 서비스를 제공합니다.','실내건축전문건설면허를 보유한 전문 시공사로서 관련 기준과 절차에 맞춰 안전하게 공사를 진행합니다.','준공 후 전문 촬영한 고해상도 사진 원본을 제공해 사내 홍보와 기록에 활용할 수 있습니다.']);
  assert.equal(await page.locator('#difference-title').innerText(), 'Difference');
  assert.equal(await page.locator('#about .section-copy').innerText(), '좋은 공간을 만드는 네 가지 기준.\n보이는 디자인 너머, 일상의 변화까지 생각합니다.');
  assert.equal(await page.locator('.partner-marquee').count(), 2);
  assert.equal(await page.locator('.partner-marquees').evaluate(element => getComputedStyle(element).rowGap), '0px');
  assert.equal(await page.locator('.partner-marquee').evaluateAll(rows => Math.round(rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().bottom)), 0);
  assert.equal(await page.locator('.partner-logo-group:not([aria-hidden="true"]) img').count(), 46);
  assert.equal(await page.locator('.partner-logo-group[aria-hidden="true"] img').count(), 46);
  assert.equal(await page.locator('.partner-logo img').first().evaluate(image => {
   const imageRect = image.getBoundingClientRect();
   const slotRect = image.parentElement.getBoundingClientRect();
   return Math.round(imageRect.width / slotRect.width * 100);
  }), 90);
  assert.deepEqual(await page.locator('.partner-marquee').evaluateAll(rows => rows.map(row => getComputedStyle(row.querySelector('.partner-marquee-track')).animationName)), ['partner-marquee-ltr', 'partner-marquee-rtl']);
  assert.equal(await page.locator('.faq-item').count(), 13);
  const firstFaqQuestion = page.locator('.faq-question').first();
  await firstFaqQuestion.hover();
  await page.waitForTimeout(500);
  assert.equal(await firstFaqQuestion.evaluate(element => getComputedStyle(element).color), 'rgb(255, 99, 56)');
  assert.deepEqual(await firstFaqQuestion.locator('.faq-icon').evaluate(icon => [
   getComputedStyle(icon, '::before').backgroundColor,
   getComputedStyle(icon, '::after').backgroundColor
  ]), ['rgb(255, 99, 56)', 'rgb(255, 99, 56)']);
  checks.push('FAQ question text and icon use the primary orange on pointer hover');
  assert.equal(await page.locator('#home-project-list .work-item').count(), 6);
  assert.deepEqual(await page.locator('#home-project-list .title').allTextContents(), ['스튜디오비사이드','카카오헬스케어','이푸드','와이브레인','노보네시스','슈퍼크리에이티브']);
  assert.deepEqual(await page.locator('#home-project-list .work-item').evaluateAll(cards => cards.map(card => Number(card.dataset.year))), [2021,2024,2025,2025,2026,2017]);
  assert.deepEqual(await page.locator('#home-project-list .tags').evaluateAll(tags => tags.map(tag => [...tag.children].map(child => child.textContent))), [['미디어','180평'],['바이오','200평'],['서비스','120평'],['바이오','150평'],['바이오','150평'],['미디어','250평']]);
  assert.deepEqual(await page.locator('#home-project-list img').evaluateAll(images => images.map(image => new URL(image.src).pathname)), ['/assets/projects/home/01-studiobside.jpg','/assets/projects/home/02-kakao-healthcare.jpg','/assets/projects/home/03-efood.jpg','/assets/projects/home/04-ybrain.jpg','/assets/projects/home/05-novonesis.jpg','/assets/projects/home/06-supercreative.jpg']);
  assert.equal(await page.locator('#home-project-list .project-hover').count(), 6);
  assert.deepEqual(await page.locator('#home-project-list .project-hover-address').allTextContents(), ['판교 판교역로 · 미래에셋센터','판교 판교역로 · 카카오판교아지트','서울 송파구 동남로 · 남성빌딩','판교 창업로 · 판교 제2기업성장센터','서울 서초구 남부순환로 · 옥스포드빌딩 2, 6F','판교 판교역로 · 미래에셋센터']);
  const firstProject = page.locator('#home-project-list .work-item').first();
  assert.equal(await firstProject.locator('.project-hover').evaluate(element => getComputedStyle(element).opacity), '0');
  await firstProject.hover();
  await page.waitForTimeout(400);
  assert.equal(await firstProject.locator('.project-hover').evaluate(element => getComputedStyle(element).opacity), '1');
  assert.ok(Number(await firstProject.locator('.thumb img').evaluate(element => getComputedStyle(element).opacity)) >= 0.6);
  assert.equal(await firstProject.locator('.thumb').evaluate(element => getComputedStyle(element).borderTopWidth), '0px');
  assert.ok(parseFloat(await firstProject.locator('.project-hover-title').evaluate(element => getComputedStyle(element).fontSize)) <= 22);
  await page.locator('#projects').screenshot({path:path.join(root,'evidence/home-projects-hover.png')});
  await firstProject.focus();
  assert.equal(await firstProject.locator('.project-hover').evaluate(element => getComputedStyle(element).opacity), '1');
  assert.equal(await page.locator('#history').count(), 1);
  assert.equal(await page.locator('#history .section-copy').innerText(), '14년의 업계 경력을 바탕으로, 신뢰할 수 있는 공간을 만들어갑니다.');
  assert.deepEqual(await page.locator('#history .award-label').allTextContents(), ['LATEST PROJECTS','RECENT PROJECTS','PROJECT ARCHIVE']);
  assert.deepEqual(await page.locator('#history .award-year time').allTextContents(), ['(2026)','(2025)','(2024)']);
  assert.deepEqual(await page.locator('#history .award-list').evaluateAll(lists => lists.map(list => list.children.length)), [11,11,15]);
  assert.equal(await page.locator('#history .history-name-ko').first().innerText(), '노보네시스코리아');
  assert.equal(await page.locator('#history .history-name-en').first().innerText(), 'NOVONESIS');
  assert.equal((await page.locator('#history .cursor-hover .more-btn').innerText()).replace(/\s+/g, ' '), 'View All Projects →');
  checks.push('Process navigation opens the dedicated page; history shows complete 2026-2024 project groups and a project link');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelector('#hero-video').readyState >= 2);
  assert.deepEqual(await page.locator('.hero-slide-copy :is(h1,h2)').allTextContents(), [
   'We Design Together',
   'We Design Together',
   'Kakao Healthcare',
   'Studio Bside',
   'Novonesis',
   'Apet',
   'Super Creative'
  ]);
  assert.deepEqual(await page.locator('.hero-slide-copy p').allTextContents(), [
   '[시안1] 일하는 방식을 이해하고, 브랜드에 맞는 공간을 설계합니다.',
   '[시안2] 일하는 방식을 이해하고, 브랜드에 맞는 공간을 설계합니다.',
   '투명한 동선과 따뜻한 소재로 완성한 카카오헬스케어의 공간입니다.',
   '집중과 교류가 자연스럽게 이어지는 스튜디오비사이드의 공간입니다.',
   '지속가능한 성장을 담아낸 노보네시스의 업무 공간입니다.',
   '함께 머물고 자연스럽게 연결되는 에이펫의 라운지 공간입니다.',
   '구성원의 일상과 업무 흐름을 연결한 슈퍼크리에이티브의 오픈 오피스입니다.'
  ]);
  assert.deepEqual(await page.locator('.hero-slide img').evaluateAll(images => images.map(image => image.getAttribute('src'))), [
   'assets/hero/kakao-healthcare.jpg',
   'assets/hero/studio-bside.jpg',
   'assets/hero/novonesis.jpg',
   'assets/hero/blue-lounge.jpg',
   'assets/hero/open-office.jpg'
  ]);
  assert.equal(await page.locator('.hero-slide.is-active').getAttribute('data-slide'), '0');
  assert.equal(await page.locator('.hero-slide.is-prev').getAttribute('data-slide'), '6');
  assert.equal(await page.locator('.hero-slide.is-next').getAttribute('data-slide'), '1');
  assert.equal(await page.locator('.hero-progress-bar').count(), 7);
  assert.equal(await page.locator('.hero-progress-bar.is-active').evaluate(bar => [...bar.parentElement.children].indexOf(bar)), 0);
  assert.equal(await page.locator('#hero-progress').innerText(), '');
  const video = await page.locator('#hero-video').evaluate(v => ({ width:v.videoWidth, height:v.videoHeight, muted:v.muted, loop:v.loop }));
  assert.ok(video.width > 0); assert.equal(video.muted,true); assert.equal(video.loop,false);
  await page.waitForFunction(() => [...document.querySelectorAll('.hero-progress-bar')].findIndex(bar => bar.classList.contains('is-active')) === 1, {timeout: 9500});
  await page.waitForFunction(() => document.querySelector('#hero-video').currentTime > 0);
  assert.deepEqual(await page.locator('.hero-slide video').evaluateAll(videos => videos.map(video => video.paused)), [true, false]);
  assert.equal(await page.locator('#slide-pause').count(), 0);
  await page.locator('#slide-prev').click();
  assert.equal(await page.locator('.hero-progress-bar.is-active').evaluate(bar => [...bar.parentElement.children].indexOf(bar)), 0);
  await page.locator('#slide-next').click();
  assert.equal(await page.locator('.hero-progress-bar.is-active').evaluate(bar => [...bar.parentElement.children].indexOf(bar)), 1);
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.hero-progress-bar.is-active').evaluate(bar => [...bar.parentElement.children].indexOf(bar)), 2);
  assert.deepEqual(await page.locator('.hero-slide video').evaluateAll(videos => videos.map(video => video.paused)), [true, true]);
  for (let index = 0; index < 5; index += 1) await page.locator('#slide-next').click();
  assert.equal(await page.locator('.hero-progress-bar.is-active').evaluate(bar => [...bar.parentElement.children].indexOf(bar)), 0);
  checks.push('Hero copy, full-screen carousel state, automatic rotation, minimal controls, next/previous, keyboard and wraparound work');
  for (const item of await page.locator('.faq-question').all()) {
   await item.click();
   assert.equal(await item.getAttribute('aria-expanded'), 'true');
   const panel = page.locator('#' + await item.getAttribute('aria-controls'));
   assert.equal(await panel.isVisible(),true);
   await page.keyboard.press('Enter');
   assert.equal(await item.getAttribute('aria-expanded'), 'false');
   assert.equal(await panel.isVisible(),false);
  }
  checks.push('All FAQ answers open and close with pointer and keyboard');
  for (const width of [320,390,768,1024,1440,1920]) {
   await page.setViewportSize({width,height:1000});
   await page.waitForTimeout(450);
   const layout = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#home-project-list .work-item')];
    const tops = items.map(e=>Math.round(e.getBoundingClientRect().top));
    return {width:innerWidth, overflow:document.documentElement.scrollWidth>innerWidth, columns:tops.filter(t=>t===tops[0]).length, rows:new Set(tops).size};
   });
   assert.equal(layout.overflow,false,'horizontal overflow at '+width);
   assert.equal(layout.columns,width<=768?2:3);
   assert.equal(layout.rows,width<=768?3:2);
   layouts.push(layout);
  }
  checks.push('Six viewport widths: PC 3×2, mobile 2×3, no horizontal overflow');
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.locator('.site-menu-toggle').click();
  await page.locator('.site-nav').waitFor({state:'visible'});
  await page.locator('.site-nav a[href="index.html#about"]').click();
  assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'),'false');
  await page.waitForURL('**/index.html#about');
  await page.emulateMedia({reducedMotion:'reduce'});
  const reducedMotionState = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  assert.equal(reducedMotionState, true);
  checks.push('Mobile menu navigation and reduced-motion handling');
  // Exercise native lazy loading before full-page screenshots.
  for (const img of await page.locator('img:visible').all()) await img.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:path.join(root,'evidence/home-desktop.png'),fullPage:true});
  await page.screenshot({path:path.join(root,'evidence/home-hero.png')});
  await page.locator('#projects').screenshot({path:path.join(root,'evidence/home-projects.png')});
  await page.locator('#about').screenshot({path:path.join(root,'evidence/home-differences.png')});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:path.join(root,'evidence/home-mobile.png'),fullPage:true});
  await page.locator('.site-menu-toggle').click();
  await page.locator('.site-nav').waitFor({state:'visible'});
  await page.screenshot({path:path.join(root,'evidence/home-mobile-menu.png')});
  await page.keyboard.press('Escape');
  await page.goto('http://127.0.0.1:8770/work.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('.work-filter button').count(),9);
  assert.equal(await page.locator('h1').innerText(),'Our Projects');
  checks.push('Project route remains available with nine filters');
  assert.deepEqual(errors,[]); assert.deepEqual(failed,[]);
  checks.push('All media loaded; no JavaScript errors or failed HTTP responses');
  const report={passed:true, testedAt:new Date().toISOString(),checks,layouts,video,errors,failed};
  fs.writeFileSync(path.join(root,'evidence/home-qa.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
