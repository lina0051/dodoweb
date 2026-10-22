"use strict";
(() => {
  const navigation = document.querySelector('.project-navigation');
  if (!navigation) return;

  const projects = [...(window.WORK_PROJECTS || [])]
    .filter(project => project.detailHref)
    .sort((first, second) => second.year - first.year);
  const currentIndex = projects.findIndex(project => project.id === navigation.dataset.projectId);
  if (currentIndex < 0) return;

  for (const [direction, offset, label] of [['prev', -1, '이전 프로젝트'], ['next', 1, '다음 프로젝트']]) {
    const project = projects[currentIndex + offset];
    const link = navigation.querySelector(`[data-project-direction="${direction}"]`);
    if (!project || !link) continue;
    link.href = project.detailHref;
    link.rel = direction;
    link.removeAttribute('aria-disabled');
    link.removeAttribute('role');
    link.setAttribute('aria-label', `${label}: ${project.name}`);
    link.title = project.name;
  }
})();
