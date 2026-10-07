"use strict";
(() => {
  const filters = document.querySelector(".work-filter");
  const list = document.querySelector("#project-list");
  const empty = document.querySelector("#empty-state");
  const status = document.querySelector("#result-status");
  const projects = [...window.WORK_PROJECTS].sort((first, second) => second.year - first.year);
  const industries = [
    ["all", "전체"], ["bio", "바이오"], ["semiconductor", "반도체"],
    ["it", "IT"], ["construction", "건설"], ["manufacturing", "제조"],
    ["media", "미디어"], ["finance", "금융"], ["service", "서비스"]
  ];
  const buttons = new Map();
  const cards = new Map();
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  for (const [id, label] of industries) {
    const button = element("button", "", label);
    button.type = "button";
    button.dataset.filter = id;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-controls", "project-list");
    const count = projects.filter(p => id === "all" || p.industryId === id).length;
    const countLabel = element("span", "", "(" + count + ")");
    countLabel.setAttribute("aria-hidden", "true");
    button.append(countLabel);
    button.setAttribute("aria-label", label + " 프로젝트 " + count + "건");
    button.addEventListener("click", () => select(id));
    buttons.set(id, button);
    filters.append(button);
  }
  for (const project of projects) {
    const card = element("article", "work-item");
    card.dataset.industry = project.industryId;
    card.dataset.year = project.year;
    const thumb = element("div", "thumb");
    if (project.mediaKind === "logo") thumb.classList.add("project-logo");
    const image = element("img");
    image.src = project.image;
    image.alt = project.imageAlt;
    image.width = 1000;
    image.height = 1000;
    image.decoding = "async";
    const hover = element("div", "project-hover");
    hover.setAttribute("aria-hidden", "true");
    hover.append(
      element("strong", "project-hover-title", project.name),
      element("span", "project-hover-address", project.address)
    );
    thumb.append(image, hover);
    const info = element("div", "info");
    const title = element("h2", "title", project.name);
    const tags = element("div", "tags");
    tags.append(element("span", "", project.industry));
    if (project.areaPyeong) tags.append(element("span", "", project.areaPyeong + "평"));
    info.append(title, tags);
    if (project.detailHref) {
      const thumbLink = element("a", "work-thumb-link");
      thumbLink.href = project.detailHref;
      thumbLink.setAttribute("aria-label", project.name + " 프로젝트 상세 보기");
      thumbLink.append(thumb);
      card.append(thumbLink, info);
    } else {
      card.tabIndex = 0;
      card.setAttribute("aria-label", project.name + ", " + project.industry + ", " + project.areaPyeong + "평, " + project.address);
      card.append(thumb, info);
    }
    cards.set(project.id, card);
    list.append(card);
  }
  function select(id) {
    let count = 0;
    for (const [key, button] of buttons) {
      const selected = key === id;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
    for (const project of projects) {
      const visible = id === "all" || project.industryId === id;
      cards.get(project.id).hidden = !visible;
      if (visible) count++;
    }
    list.hidden = count === 0;
    empty.hidden = count !== 0;
    status.textContent = industries.find(item => item[0] === id)[1] + " 프로젝트 " + count + "건";
  }
  document.querySelector("#reset-filter").addEventListener("click", () => {
    select("all");
    buttons.get("all").focus();
  });
  select("all");
})();
