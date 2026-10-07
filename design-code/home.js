'use strict';
(() => {
  const data = window.HOME_CONTENT;
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const differenceIconMarkup = {
    design: `
      <svg viewBox="0 0 64 64" role="presentation">
        <g class="difference-icon__motion difference-icon__motion--design">
          <path d="m9.5 22.5 22.5-12 22.5 12L32 35 9.5 22.5Z"/>
          <path d="M9.5 22.5v22L32 56.5l22.5-12v-22M32 35v21.5"/>
          <path class="difference-icon__guide" d="M20.5 28.5v10L32 45l11.5-6.5v-10"/>
          <path class="difference-icon__accent difference-icon__accent--design" d="m42.5 16.1 12 6.4-12 6.6"/>
        </g>
      </svg>`,
    service: `
      <svg viewBox="0 0 64 64" role="presentation">
        <g class="difference-icon__motion difference-icon__motion--service">
          <path d="M16.5 23.5A19 19 0 0 1 48 20l2.5 3.5M47.5 40.5A19 19 0 0 1 16 44l-2.5-3.5"/>
          <path class="difference-icon__guide" d="M22 27a12.5 12.5 0 0 1 20-1.5M42 37a12.5 12.5 0 0 1-20 1.5"/>
          <path class="difference-icon__accent" d="m42.5 22 8 1.5-1.2-8M21.5 42l-8-1.5 1.2 8"/>
        </g>
        <circle class="difference-icon__accent-point difference-icon__accent-point--signal" cx="32" cy="32" r="2.25"/>
      </svg>`,
    license: `
      <svg viewBox="0 0 64 64" role="presentation">
        <path d="M13.5 10.5h37v43h-37z"/>
        <path class="difference-icon__guide" d="M13.5 22h37M13.5 34h37M25.5 10.5v43M37.5 10.5v43"/>
        <g class="difference-icon__motion difference-icon__motion--license">
          <circle class="difference-icon__accent" cx="44.5" cy="45.5" r="7"/>
          <path class="difference-icon__accent" d="m41.2 45.5 2.2 2.2 4.5-5"/>
        </g>
      </svg>`,
    photo: `
      <svg viewBox="0 0 64 64" role="presentation">
        <path d="M20 11.5h-8.5V20M44 11.5h8.5V20M52.5 44v8.5H44M20 52.5h-8.5V44"/>
        <g class="difference-icon__motion difference-icon__motion--photo">
          <path d="M18 21h28v22H18z"/>
          <path class="difference-icon__guide" d="m18 43 9-11 6 6 6-7 7 12M18 26h28"/>
          <path class="difference-icon__accent" d="M28.5 28.5h7v7h-7z"/>
        </g>
        <circle class="difference-icon__accent-point difference-icon__accent-point--signal" cx="32" cy="32" r="1.75"/>
      </svg>`
  };
  const featuredProjects = data.featuredProjects;

  featuredProjects.forEach(project => {
    const card = el('article', 'work-item');
    card.dataset.year = project.year;
    const thumb = el('div', 'thumb' + (project.mediaKind === 'logo' ? ' project-logo' : ''));
    const image = el('img');
    Object.assign(image, { src: project.image, alt: project.imageAlt, width: 1000, height: 1000, loading: 'lazy', decoding: 'async' });
    const hover = el('div', 'project-hover');
    hover.setAttribute('aria-hidden', 'true');
    hover.append(el('strong', 'project-hover-title', project.name), el('span', 'project-hover-address', project.address));
    thumb.append(image, hover);
    const info = el('div', 'info');
    info.append(el('h3', 'title', project.name));
    if (project.industry && project.areaPyeong) {
      const tags = el('div', 'tags');
      tags.append(el('span', '', project.industry), el('span', '', project.areaPyeong + '평'));
      info.append(tags);
    }
    if (project.detailHref) {
      const link = el('a', 'work-item-link');
      link.href = project.detailHref;
      link.setAttribute('aria-label', `${project.name} 프로젝트 상세 보기`);
      link.append(thumb, info);
      card.append(link);
    } else {
      card.tabIndex = 0;
      card.setAttribute('aria-label', `${project.name}, ${project.industry}, ${project.areaPyeong}평, ${project.address}`);
      card.append(thumb, info);
    }
    document.querySelector('#home-project-list').append(card);
  });
  data.history.forEach(group => {
    const block = el('div', 'award-block');
    const year = el('div', 'award-year');
    year.append(el('span', 'award-label', group.title));
    const yearText = el('time', '', `(${group.year})`);
    yearText.dateTime = group.year;
    year.append(yearText);
    const list = el('ul', 'award-list');
    group.projects.forEach(project => {
      const row = el('li', 'award-item');
      row.append(
        el('span', 'history-name-ko', project.nameKo),
        el('span', 'history-name-en', project.nameEn)
      );
      list.append(row);
    });
    block.append(year, list);
    document.querySelector('#history-list').append(block);
  });
  data.differences.forEach(item => {
    const card = el('article', 'difference-item');
    const icon = el('div', `icon difference-icon difference-icon--${item.icon}`);
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = differenceIconMarkup[item.icon];
    card.append(icon, el('strong', '', item.subtitle), el('p', '', item.body));
    document.querySelector('#difference-list').append(card);
  });
  const partnerMarquees = document.querySelector('#partner-marquees');
  const partnerRows = [
    { logos: data.partners.slice(0, 23), direction: 'ltr', label: '파트너 로고 첫 번째 행' },
    { logos: data.partners.slice(23), direction: 'rtl', label: '파트너 로고 두 번째 행' }
  ];
  const createLogoGroup = (logos, duplicate = false) => {
    const group = el('div', 'partner-logo-group');
    if (duplicate) group.setAttribute('aria-hidden', 'true');
    logos.forEach(logo => {
      const item = el('div', 'partner-logo');
      const image = el('img');
      Object.assign(image, {
        src: logo.src,
        alt: duplicate ? '' : logo.alt,
        width: 229,
        height: 140,
        loading: 'eager',
        decoding: 'async'
      });
      item.append(image);
      group.append(item);
    });
    return group;
  };
  partnerRows.forEach(({ logos, direction, label }) => {
    const row = el('div', `partner-marquee partner-marquee--${direction}`);
    row.setAttribute('aria-label', label);
    const track = el('div', 'partner-marquee-track');
    track.append(createLogoGroup(logos), createLogoGroup(logos, true));
    row.append(track);
    partnerMarquees.append(row);
  });
  data.faq.forEach(([question, answer], index) => {
    const item = el('div', 'faq-item');
    const heading = el('h3');
    const button = el('button', 'faq-question', question);
    button.type = 'button';
    button.id = 'faq-question-' + index;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'faq-answer-' + index);
    const icon = el('span', 'faq-icon');
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon);
    const panel = el('div', 'faq-answer');
    panel.id = 'faq-answer-' + index;
    panel.hidden = true;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', button.id);
    panel.append(el('p', '', answer));
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      item.classList.toggle('active', open);
    });
    heading.append(button);
    item.append(heading, panel);
    document.querySelector('#faq-list').append(item);
  });

  function setupScrollReveals() {
    const page = document.querySelector('.home-page');
    const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!page || prefersReducedMotion.matches || !('IntersectionObserver' in window)) return;

    const revealSets = [
      { selector: '#projects .section-heading > *', variant: 'heading', step: 90 },
      { selector: '#home-project-list', variant: 'project', step: 0 },
      { selector: '#projects .section-link', variant: 'heading', step: 0 },
      { selector: '#history .section-heading > *', variant: 'heading', step: 90 },
      { selector: '#history-list .award-block', variant: 'history', step: 90 },
      { selector: '#history .cursor-hover', variant: 'history', step: 0 },
      { selector: '#about .section-heading > *', variant: 'heading', step: 90 },
      { selector: '#difference-list .difference-item', variant: 'difference', step: 75 },
      { selector: '#partners .section-heading > *', variant: 'heading', step: 90 },
      { selector: '#partner-marquees .partner-marquee', variant: 'marquee', step: 100 },
      { selector: '#faq .faq-head > *', variant: 'heading', step: 90 },
      { selector: '#faq-list .faq-item', variant: 'faq', step: 55 }
    ];
    const revealItems = [];

    revealSets.forEach(({ selector, variant, step }) => {
      document.querySelectorAll(selector).forEach((item, index) => {
        item.classList.add('scroll-reveal-item', `scroll-reveal-item--${variant}`);
        item.style.setProperty('--reveal-delay', `${Math.min(index, 5) * step}ms`);
        revealItems.push(item);
      });
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -8% 0px' });

    page.classList.add('motion-ready');
    revealItems.forEach(item => observer.observe(item));
  }

  setupScrollReveals();

  const hero = document.querySelector('#hero');
  const slides = [...hero.querySelectorAll('.hero-slide')];
  const video = hero.querySelector('video');
  const heroProgress = document.querySelector('#hero-progress');
  const progressBars = [...heroProgress.querySelectorAll('.hero-progress-bar')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let motionPaused = reducedMotion.matches;
  let visible = true;
  let timer;
  function preloadSlide(index) {
    const image = slides[(index + slides.length) % slides.length].querySelector('img');
    if (image) image.loading = 'eager';
  }
  function schedule() {
    clearTimeout(timer);
    const running = !motionPaused && visible && !document.hidden;
    if (running && current === 0) video.play().catch(() => {});
    else video.pause();
    if (running) timer = setTimeout(() => show(current + 1), 7000);
  }
  function show(index) {
    current = (index + slides.length) % slides.length;
    const previous = (current - 1 + slides.length) % slides.length;
    const next = (current + 1) % slides.length;
    preloadSlide(current);
    preloadSlide(next);
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', current === i);
      slide.classList.toggle('is-prev', previous === i);
      slide.classList.toggle('is-next', next === i);
      slide.setAttribute('aria-hidden', String(current !== i));
    });
    progressBars.forEach((bar, i) => bar.classList.toggle('is-active', current === i));
    heroProgress.setAttribute('aria-label', `슬라이드 ${current + 1} / ${slides.length}`);
    schedule();
  }
  document.querySelector('#slide-prev').addEventListener('click', () => show(current - 1));
  document.querySelector('#slide-next').addEventListener('click', () => show(current + 1));
  hero.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  document.addEventListener('visibilitychange', schedule);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    schedule();
  }, { threshold: .15 }).observe(hero);
  reducedMotion.addEventListener('change', event => {
    motionPaused = event.matches;
    schedule();
  });
  show(0);
})();
