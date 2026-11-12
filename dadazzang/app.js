/* Local-only interaction layer. Original Next.js bundles are archived in original-js/,
   not executed: hydration requires live APIs and would enable tracking/account calls. */
(() => {
  'use strict';
  // Only pages included in this preview may open; retain product URLs for catalogue search.
  const availablePages = new Set(['./', 'index.html', 'products.html', 'brands.html', 'about.html', 'wholesale.html', 'bulk-order.html'].map(path => new URL(path, location.href).href));
  const isAvailableLink = link => {
    const url = new URL(link.href);
    url.search = '';
    url.hash = '';
    return availablePages.has(url.href);
  };
  const blockUnavailableLink = event => {
    const link = event.target.closest('a[href]');
    if (!link || isAvailableLink(link)) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  };
  document.querySelectorAll('a[href]').forEach(link => {
    if (!isAvailableLink(link)) link.setAttribute('aria-disabled', 'true');
  });
  document.addEventListener('auxclick', blockUnavailableLink, true);
  const sliders=[];
  const notice=text=>{
    if(!text)return;
    let el=document.getElementById('local-notice');
    if(!el){el=document.createElement('div');el.id='local-notice';el.setAttribute('role','status');Object.assign(el.style,{position:'fixed',bottom:'28px',left:'50%',transform:'translateX(-50%)',padding:'14px 22px',background:'#1f1f1f',color:'#fff',borderRadius:'4px',zIndex:30000,fontSize:'14px',maxWidth:'80vw'});document.body.append(el)}
    el.textContent=text;el.hidden=false;clearTimeout(el.hideTimer);el.hideTimer=setTimeout(()=>el.hidden=true,3200);
  };
  document.querySelectorAll('[data-local-slider]').forEach(el=>{
    const wrap=el.querySelector(':scope > .swiper-wrapper');if(!wrap)return;
    const opt=JSON.parse(el.dataset.sliderOptions||'{}');
    const slides=[...wrap.children].filter(n=>n.classList.contains('swiper-slide'));
    if(!slides.length)return;
    if(opt.loop&&slides.every(s=>s.hasAttribute('data-swiper-slide-index'))){slides.sort((a,b)=>Number(a.dataset.swiperSlideIndex)-Number(b.dataset.swiperSlideIndex));slides.forEach(s=>wrap.append(s))}
    let index=opt.loop?Number(opt.realIndex||0):0;
    const count=slides.length;
    const sourceControls=el.parentElement.nextElementSibling;
    const sourceArrows=sourceControls?[...sourceControls.querySelectorAll('svg.cursor_pointer')]:[];
    if(sourceArrows.length===2)sourceArrows.forEach((arrow,i)=>{arrow.setAttribute('role','button');arrow.setAttribute('tabindex','0');arrow.setAttribute('aria-label',i?'다음 슬라이드':'이전 슬라이드');arrow.addEventListener('click',()=>move(i?1:-1));arrow.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();move(i?1:-1)}})});
    const max=()=>Math.max(0,count-(typeof opt.slidesPerView==='number'?opt.slidesPerView:Math.max(1,Math.floor(el.clientWidth/(slides[0].offsetWidth+(opt.spaceBetween||0))))));
    const draw=(animate=true)=>{
      const step=slides[0].getBoundingClientRect().width+(Number(opt.spaceBetween)||0);
      wrap.style.transitionDuration=animate?'450ms':'0ms';
      wrap.style.transform=`translate3d(${-index*step}px,0,0)`;
      slides.forEach((s,i)=>{s.classList.toggle('swiper-slide-active',i===index);s.classList.toggle('swiper-slide-next',i===index+1);s.classList.toggle('swiper-slide-prev',i===index-1);s.querySelectorAll('[data-swiper-parallax]').forEach(p=>p.style.transform='translate3d(0px,0px,0px)')});
      const fraction=el.querySelector('.swiper-pagination-current');if(fraction)fraction.textContent=String(index+1);
      if(sourceArrows.length===2){const n=sourceControls.querySelector('span');if(n)n.textContent=String(index+1);const bar=sourceControls.firstElementChild?.firstElementChild;if(bar&&bar!==sourceArrows[0])bar.style.transform='translateX('+(index/Math.max(1,count-1)*900)+'%)'}
      el.dataset.localIndex=String(index);
    };
    const move=delta=>{index=opt.loop?(index+delta+count)%count:Math.max(0,Math.min(max(),index+delta));draw()};
    el.localSlider={move,draw};sliders.push(el);
    el.tabIndex=0;el.setAttribute('aria-roledescription','carousel');
    el.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}});
    let start=null,dragged=false;
    el.addEventListener('pointerdown',e=>{start=e.clientX;dragged=false});
    el.addEventListener('pointerup',e=>{if(start!==null&&Math.abs(e.clientX-start)>45){dragged=true;move(e.clientX<start?1:-1)}start=null});
    el.addEventListener('dragstart',e=>e.preventDefault());
    el.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopPropagation();dragged=false}},true);
    // Local controls are added without replacing the captured markup.
    const controls=document.createElement('div');controls.className='local-slider-controls';
    for(const [label,sign,delta] of [['이전','‹',-1],['다음','›',1]]){const b=document.createElement('button');b.type='button';b.textContent=sign;b.setAttribute('aria-label',label+' 슬라이드');b.addEventListener('click',()=>move(delta));controls.append(b)}
    if(sourceArrows.length!==2)el.append(controls);draw(false);
    let timer;
    const play=()=>{if(opt.autoplay?.enabled&&!matchMedia('(prefers-reduced-motion: reduce)').matches){clearInterval(timer);timer=setInterval(()=>{if(!document.hidden&&!el.closest('[hidden]'))move(1)},Number(opt.autoplay.delay)||5000)}};
    el.addEventListener('mouseenter',()=>clearInterval(timer));el.addEventListener('mouseleave',play);play();
  });
  addEventListener('resize',()=>sliders.forEach(e=>e.localSlider.draw(false)));
  document.addEventListener('submit',e=>{
    if(e.target.matches('.site-header__search')){
      if(document.querySelector('[data-catalog-controls]'))return;
      e.preventDefault();
      const url=new URL('products.html',location.href);
      const query=new FormData(e.target).get('keyword').trim();
      if(query)url.searchParams.set('q',query);
      location.href=url.href;
      return;
    }
    e.preventDefault();notice();
  },true);
  document.addEventListener('click',e=>{
    if(blockUnavailableLink(e))return;
    if(e.target.closest('[data-ignore-action-link]')){e.preventDefault();e.stopPropagation();notice();return}
    const link=e.target.closest('a[href]');
    if(link)return;
    const button=e.target.closest('button,[role="button"]');if(!button||button.closest('.local-slider-controls,[data-main-slider],[data-brand-marquee],[data-catalog-controls],.site-header__search'))return;
    const text=(button.getAttribute('aria-label')||button.textContent||'').trim();
    if(/^(맨 위|TOP|top|위로)/.test(text)){scrollTo({top:0,behavior:'smooth'});return}
    if(text==='이전 브랜드'||text==='다음 브랜드'){document.querySelector('[data-local-slider="2"]')?.localSlider.move(text==='이전 브랜드'?-1:1);return}
    if(button.closest('[data-ignore-action-link]')||button.hasAttribute('data-ignore-action-link')){e.preventDefault();e.stopPropagation();notice();return}
    notice();
  },true);
  document.querySelectorAll('[role="tab"]').forEach(tab=>tab.addEventListener('click',()=>notice('추출 시 선택된 탭만 포함되어 있습니다. 다른 탭 데이터는 원본 사이트에서 확인해주세요.')));
})();
