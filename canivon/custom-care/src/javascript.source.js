(() => {
  const R = document.querySelector("#cv"),
    q = (x) => R.querySelector(x),
    V = q("#cv-view"),
    L = q("#cv-label"),
    C = q("#cv-count"),
    B = q("#cv-bar"),
    D = q("#cv-dog"),
    G = q("#cv-progress-back"),
    X = q("#cv-reset"),
    d = R.dataset;
  let dataReady = Promise.resolve(),
    N = [
      ["joint", "관절·다리"], ["eye", "눈·눈물"], ["heart", "심장·순환"],
      ["skin", "피부·모질"], ["liver", "소화·간"], ["energy", "기력·면역"],
      ["daily", "특별한 이슈 없음"],
    ].map((x, i) => [x[0], x[1], x[1], `${x[1]} 케어`, "종합 영양", `${x[1]} 건강 관리에 도움`, i + 1]),
    S = [
      "이름",
      "성별",
      "나이",
      "몸무게",
      "활동량",
      "건강 고민",
      "최우선 고민",
      "결과",
    ],
    M = { r: [], c: [], h: [], u: [] };
  D.src = d.dg;
  let s = {
    i: 0,
    n: "",
    g: "",
    a: "",
    w: "",
    v: "",
    x: [],
    p: "",
  };
  const h = (v) =>
      String(v ?? "").replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[m],
      ),
    topic = (v) => {
      const text = String(v ?? ""),
        code = text.charCodeAt(text.length - 1),
        hasFinal = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
      return h(text) + (hasFinal ? "은" : "는");
    },
    won = (v) => Number(v).toLocaleString("ko-KR") + "원",
    need = (c) => N.find((n) => n[0] === c),
    senior = () => +s.a >= +(d.sa || 8),
    top = () =>
      [...s.x]
        .sort((a, b) => {
          if (a === s.p) return -1;
          if (b === s.p) return 1;
          let score = (c) => M.r.filter((r) => r[2] === c && ruleMatches(r)).reduce((n, r) => n + r[3], 0);
          return score(b) - score(a) || +(need(a)?.[6] || 999) - +(need(b)?.[6] || 999);
        })
        .map(need),
    progress = () => {
      let i = Math.min(s.i, 7),
        p = (i + 1) * 12.5;
      R.dataset.step = S[i];
      L.textContent = S[i];
      C.textContent = `${i + 1} / 8`;
      B.style.width = p + "%";
      D.style.left = Math.min(94, Math.max(6, p)) + "%";
      G.hidden = i >= 7;
    },
    go = (i) => {
      s.i = i;
      render();
      R.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    error = (m) => {
      let e = q(".cv-error");
      if (e) {
        e.textContent = m;
        e.hidden = false;
      }
    },
    actions = (back, next = "계속하기") =>
      `<div class="cv-actions one"><button class="cv-btn cv-next" type="submit">${next}</button></div>`,
    wrap = (title, lead, body) =>
      `<section class="cv-step"><div class="cv-copy"><h1>${title}</h1><p>${lead}</p></div>${body}</section>`,
    bind = (form, back, fn) => {
      G.onclick = back >= 0 ? () => go(back) : null;
      q(form).onsubmit = (e) => {
        e.preventDefault();
        fn();
      };
    },
    input = (id, label, type, unit, value) =>
      `<label class="cv-field"><span>${label}</span><div class="cv-input"><input id="${id}" type="${type === "number" ? "text" : type}" value="${h(value)}" inputmode="${type === "number" ? "decimal" : "text"}" required><em>${unit}</em></div></label><p class="cv-error" hidden></p>`,
    numberOnly = (id) => {
      let i = q("#" + id);
      i.oninput = () => {
        let v = i.value,
          n = v.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
        v !== n
          ? ((i.value = n), error("숫자로 입력해 주세요."))
          : (q(".cv-error").hidden = true);
      };
    },
    ruleMatches = (r) => {
      let type = r.type || r[0], value = String(r.value ?? r[1]);
      if (type === "age_min") return +s.a >= +value;
      if (type === "age_max") return +s.a <= +value;
      if (type === "activity") return s.v === value;
      if (type === "gender") return s.g === value;
      return false;
    },
    needIcon = (code) =>
      code === "male" || code === "female"
        ? `<svg class="cv-choice-icon cv-gender-icon" aria-hidden="true"><use href="#cv-i-${code}"></use></svg>`
        : `<i class="cv-choice-icon cv-icon-${code}" aria-hidden="true"></i>`,
    choices = (name, list, value, radio = true) =>
      `<div class="cv-grid">${list.map((a) => `<label class="cv-choice"><input type="${radio ? "radio" : "checkbox"}" name="${name}" value="${a[0]}" ${Array.isArray(value) ? (value.includes(a[0]) ? "checked" : "") : value === a[0] ? "checked" : ""}>${radio && name !== "gender" && name !== "primary" ? "" : needIcon(a[0])}<span><strong>${a[1]}</strong>${a[2] ? `<small>${a[2]}</small>` : ""}</span></label>`).join("")}</div><p class="cv-error" hidden></p>`;
  function name() {
    V.innerHTML = wrap(
      "반려견의 이름을 알려주세요",
      "맞춤 질문을 시작할게요.",
      `<form id="f">${input("name", "반려견 이름", "text", "", s.n)}${actions(-1)}</form>`,
    );
    bind("#f", -1, () => {
      let v = q("#name").value.trim();
      v ? ((s.n = v), go(1)) : error("이름을 입력해 주세요.");
    });
  }
  function gender() {
    V.innerHTML = wrap(
      `${h(s.n)}의 성별을 알려주세요`,
      "하나를 선택해 주세요.",
      `<form id="f">${choices(
        "gender",
        [
          ["male", "남아"],
          ["female", "여아"],
        ],
        s.g,
      )}${actions(0)}</form>`,
    );
    bind("#f", 0, () => {
      let v = q("[name=gender]:checked");
      v ? ((s.g = v.value), go(2)) : error("선택하세요.");
    });
  }
  function age() {
    V.innerHTML = wrap(
      `${topic(s.n)} 몇 살인가요?`,
      "나이를 숫자로 입력해 주세요.",
      `<form id="f">${input("age", "나이", "number", "살", s.a)}${actions(1)}</form>`,
    );
    numberOnly("age");
    bind("#f", 1, () => {
      let a = q("#age").value,
        v = +a;
      a !== "" && v >= 0 && v <= 30
        ? ((s.a = v), go(3))
        : error("0~30살로 입력해 주세요.");
    });
  }
  function weight() {
    V.innerHTML = wrap(
      `${h(s.n)}의 몸무게를 알려주세요`,
      "맞춤 급여량을 계산할게요.",
      `<form id="f">${input("weight", "몸무게", "number", "kg", s.w)}${actions(2)}</form>`,
    );
    numberOnly("weight");
    bind("#f", 2, () => {
      let v = +q("#weight").value;
      v > 0 && v <= 100
        ? ((s.w = v), go(4))
        : error("0.1~100kg로 입력해 주세요.");
    });
  }
  function activity() {
    let a = [
      ["home", "차분한 편", "휴식이 많아요"],
      ["normal", "보통", "규칙적으로 산책해요"],
      ["active", "활발함", "뛰어놀기 좋아해요"],
      ["athlete", "운동선수급", "운동량이 많아요"],
    ];
    V.innerHTML = wrap(
      `${h(s.n)}, 평소 활동량은?`,
      "가장 가까운 생활 패턴을 하나 선택해 주세요.",
      `<form id="f">${choices("activity", a, s.v)}${actions(3)}</form>`,
    );
    bind("#f", 3, () => {
      let v = q("[name=activity]:checked");
      v ? ((s.v = v.value), go(5)) : error("선택해 주세요.");
    });
  }
  function needs() {
    let max = +(d.mx || 3);
    V.innerHTML = wrap(
      `요즘 ${h(s.n)}에게 가장 신경 쓰이는 부분은?`,
      `최대 ${max}개까지 선택할 수 있어요.`,
      `<form id="f"><p class="cv-help">1개 이상 선택</p>${choices(
        "need",
        N.map((n) => [n[0], n[1]]),
        s.x,
        false,
      )}${actions(4)}</form>`,
    );
    let c = [...R.querySelectorAll("[name=need]")],
      h2 = q(".cv-help");
    c.forEach(
      (x) =>
        (x.onchange = () => {
          if (x.value === "daily" && x.checked)
            c.filter((y) => y !== x).forEach((y) => (y.checked = false));
          else if (x.checked)
            c.find((y) => y.value === "daily").checked = false;
          let a = c.filter((y) => y.checked);
          if (a.length > max) {
            x.checked = false;
            a = c.filter((y) => y.checked);
            error(`최대 ${max}개까지 선택해 주세요.`);
          }
          h2.textContent = a.length ? a.length + "개 선택" : "1개 이상 선택";
        }),
    );
    bind("#f", 4, () => {
      let a = c.filter((x) => x.checked).map((x) => x.value);
      if (!a.length) return error("하나 이상 선택해 주세요.");
      s.x = a;
      if (a.length === 1) {
        s.p = a[0];
        load();
      } else go(6);
    });
  }
  function priority() {
    let a = s.x.map((c) => [c, need(c)[1]]);
    V.innerHTML = wrap(
      "가장 먼저 관리하고 싶은 고민은 무엇인가요?",
      `${h(s.n)}에게 가장 중요한 한 가지를 선택해 주세요.`,
      `<form id="f">${choices("primary", a, s.p)}${actions(5, "결과 확인하기")}</form>`,
    );
    bind("#f", 5, () => {
      let x = q("[name=primary]:checked");
      if (!x) return error("한 가지를 선택해 주세요.");
      s.p = x.value;
      load();
    });
  }
  function load() {
    s.i = 7;
    R.classList.add("cv-onboarding", "cv-loading-mode");
    progress();
    V.innerHTML = q("#cv-load").innerHTML;
    q("[data-z]").textContent = s.n;
    setTimeout(async () => {
      await dataReady;
      s.i = 8;
      result();
    }, +(d.ls || 3.2) * 1000);
  }
  function result() {
    R.classList.remove("cv-onboarding", "cv-loading-mode");
    let ns = top(),
      p = ns[0] || need("daily"),
      isS = senior(),
      codes = ns.map((n) => n[0]),
      combo = M.c.filter((x) => x[0].every((c) => codes.includes(c))).sort((a, b) => b[0].length - a[0].length || a[3] - b[3])[0],
      head = M.h.filter((x) => ruleMatches(x) && (!x[2].length || x[2].includes("*") || x[2].length === codes.length && x[2].every((c) => codes.includes(c)))).sort((a, b) => a[4] - b[4])[0],
      base = combo?.[1] || head?.[3] || p[3],
      title = isS
        ? p[0] === "daily"
          ? "시니어 종합 케어"
          : "시니어 " + base.replace("데일리 ", "")
        : base,
      badges = ns.map((n) => n[2]);
    if (combo?.[2]) badges.unshift(combo[2]);
    if (isS) badges.push("노령 종합");
    let daily = Math.max(1, Math.ceil(+s.w / +(d.kg || 5))),
      days = +(d.dy || 30),
      monthly = daily * days,
      boxes = Math.ceil(monthly / +(d.pk || 30)),
      price = +d.pp || 0,
      subscriptionPrice = +d.sp || 38000,
      total = price * boxes,
      policy = M.u.find((x) => x[1] === boxes) || M.u.find((x) => x[1] === 0 || x[0] === "default"),
      rate = +(policy?.[2] ?? d.dr ?? (price ? Math.round((1 - subscriptionPrice / price) * 100) : 0)),
      sub = Math.round(total * (1 - rate / 100) / 1000) * 1000,
      details = [
        ["형태·용량", d.pc],
        [
          "급여 대상",
          `${d.pt}${p[0] !== "daily" ? " · " + ns.map((n) => n[1].split("·")[0]).join("/") + " 우선" : ""}`,
        ],
        ["주요 성분", d.pi],
      ];
    V.innerHTML = q("#cv-result-template").innerHTML;
    let put = (selector, value) => (q(selector).textContent = value);
    put("[data-a]", `${s.n}를 위한 맞춤 영양 결과`);
    put("[data-d]", title);
    q("[data-b]").innerHTML = [...new Set(badges)]
      .map((x) => `<span class="cv-badge">${h(x)}</span>`)
      .join("");
    let img = q(".cv-product-img");
    img.src = d.im;
    img.alt = `${d.pn} 제품 이미지`;
    put("[data-c]", d.pn);
    put("[data-e]", `${daily}정`);
    put("[data-f]", `${monthly}정`);
    put("[data-g]", `${boxes}박스`);
    put("[data-h]", `${d.kg || 5}kg 기준`);
    put("[data-j]", `${days}일분`);
    q("[data-k]").innerHTML = details
      .map((x) => `<div><dt>${x[0]}</dt><dd>${h(x[1])}</dd></div>`)
      .join("");
    q("[data-l]").innerHTML =
      ns
        .map(
          (n) =>
            `<article class="cv-reason">${needIcon(n[0])}<div><div class="cv-reason-head"><h3>${h(n[1])}</h3><div class="cv-ingredient-tags">${n[4]
              .split(",")
              .map((x) => `<span>${h(x.trim())}</span>`)
              .join("")}</div></div><p>${h(n[5])}</p></div></article>`,
        )
        .join("") +
      (isS
        ? `<article class="cv-reason">${needIcon("daily")}<div><div class="cv-reason-head"><h3>시니어 종합 관리</h3><div class="cv-ingredient-tags"><span>종합 영양</span></div></div><p>전 성분 종합 관리와 관절 건강을 함께 강조했어요.</p></div></article>`
        : "");
    q("[data-m]").href = d.pu;
    q("[data-o]").href = policy?.[3] || d.su || d.pu;
    put("[data-p]", `총 ${boxes}개 기준`);
    put("[data-q]", won(total));
    put("[data-r]", `1개당 ${won(price)}`);
    put("[data-s]", `${rate}% 할인`);
    put("[data-t]", `${boxes}개월분 · 총 ${boxes}박스`);
    put("[data-u]", won(total));
    put("[data-v]", won(sub));
    put("[data-w]", `월 ${won(Math.round(sub / boxes))}`);
    X.hidden = false;
    q(".cv-restart").onclick = reset;
    img.onerror = () => (img.hidden = true);
    progress();
  }
  function reset() {
    s = {
      i: 0,
      n: "",
      g: "",
      a: "",
      w: "",
      v: "",
      x: [],
      p: "",
    };
    X.hidden = true;
    render();
  }
  function render() {
    R.classList.remove("cv-loading-mode");
    R.classList.add("cv-onboarding");
    progress();
    [name, gender, age, weight, activity, needs, priority][s.i]?.();
  }
  function revealWhenStyled() {
    let started = Date.now();
    function reveal() {
      if (getComputedStyle(R).getPropertyValue("--red").trim() || Date.now() - started > 3000) {
        R.style.removeProperty("visibility");
      } else {
        requestAnimationFrame(reveal);
      }
    }
    reveal();
  }
  X.onclick = reset;
  async function sync() {
    if (!d.si) return;
    let cb = `__cvSheet_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      u = `https://docs.google.com/spreadsheets/d/${d.si}/gviz/tq?sheet=${encodeURIComponent("위젯데이터")}&range=A1:M200&headers=1&tqx=${encodeURIComponent(`out:json;responseHandler:${cb}`)}&tq=select%20*`,
      j = await new Promise((resolve, reject) => {
        let script = document.createElement("script"),
          timer = setTimeout(() => finish(Error("sheet timeout")), 10000),
          finish = (error, value) => {
            clearTimeout(timer);
            script.remove();
            delete window[cb];
            error ? reject(error) : resolve(value);
          };
        window[cb] = (value) => value?.status === "ok" ? finish(null, value) : finish(Error("sheet response"));
        script.onerror = () => finish(Error("sheet load"));
        script.src = u;
        document.head.appendChild(script);
      }), z = {};
    j.table.rows.map((r) => r.c.map((c) => c?.v ?? c?.f ?? "")).forEach((r) => (z[r[0]] ||= []).push(r));
    let p = z.p?.find((x) => x[1] === "complete") || z.p?.[0];
    if (p) ["pn", "pp", "sp", "pc", "pt", "pi", 0, 0, "pu", "su", "pk"].forEach((k, i) => k && p[i + 2] && (d[k] = p[i + 2]));
    if (/^https?:/.test(p?.[9])) d.im = p[9];
    let map = new Map();
    (z.n || []).forEach((x) => {
      let n = [x[1], x[2], x[3], x[4], x[5], x[6], +(x[7] || 999)];
      if (!map.has(n[0]) || x[8] === "complete") map.set(n[0], n);
    });
    if (map.size) N = [...map.values()].sort((a, b) => a[6] - b[6]);
    let K = { kg_per_stick: "kg", days_per_month: "dy", max_needs: "mx", loading_seconds: "ls", senior_age: "sa", subscription_discount_rate: "dr" };
    (z.s || []).forEach((x) => K[x[1]] && (d[K[x[1]]] = x[2]));
    M.r = (z.r || []).map((x) => [x[1], String(x[2]), x[3], +(x[4] || 0)]);
    M.c = (z.c || []).map((x) => [String(x[1] || "").split(/[+,]/).filter(Boolean), x[2], x[3], +(x[4] || 999)]);
    M.h = (z.h || []).map((x) => [x[1], String(x[2]), String(x[3] || "").split(/[+,]/).filter(Boolean), x[4], +(x[5] || 999)]);
    M.u = (z.u || []).filter((x) => x[3] !== "").map((x) => [x[1], +(x[2] || 0), +(x[3] || 0), x[4] || ""]);
  }
  dataReady = sync().catch(() => {});
  if (d.pr === "true") {
    dataReady.finally(() => {
      s = {
        i: 8,
        n: "홍이",
        g: "female",
        a: 9,
        w: 22,
        v: "normal",
        x: ["liver", "joint"],
        p: "liver",
      };
      result();
      revealWhenStyled();
    });
  } else {
    render();
    revealWhenStyled();
  }
})();
