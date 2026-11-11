/* 帕金森诊疗中心 · 应用壳：导航、教师解锁、拖拽、轻提示 */
(function (global) {
  const STORAGE = "tmem175-lab-v1";
  const PASS = "tmem175";

  const STAGES = [
    { id: "home", nav: "入项活动", routes: ["", "home"] },
    { id: "inspire", nav: "启发思路", routes: ["inspire"] },
    { id: "diagnose", nav: "诊断归因", routes: ["diagnose"] },
    { id: "model", nav: "模型建构", routes: ["journey", "lysosome", "model"] },
    { id: "design", nav: "开放设计", routes: ["design"] },
    { id: "show", nav: "成果展示", routes: ["show"] }
  ];

  const DEFAULT_STATE = {
    currentStage: "diagnose",
    afterClass: false,
    flags: {
      lysosomeAbnormal: false,
      modelRef: false,
      media: false,
      compare: false
    }
  };

  const App = {
    STAGES,
    state: null,
    route: "home",
    _teacherAuthed: false
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const s = JSON.parse(raw);
      return {
        currentStage: s.currentStage || "diagnose",
        afterClass: !!s.afterClass,
        flags: Object.assign({}, DEFAULT_STATE.flags, s.flags || {})
      };
    } catch (e) {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE, JSON.stringify(App.state));
  }

  function stageIndex(id) {
    return STAGES.findIndex((s) => s.id === id);
  }

  function stageByRoute(route) {
    const r = route || "home";
    return STAGES.find((s) => s.routes.includes(r)) || STAGES[0];
  }

  App.isUnlocked = function (stageId) {
    if (App.state.afterClass) return true;
    return stageIndex(stageId) <= stageIndex(App.state.currentStage);
  };

  App.setStage = function (stageId) {
    if (!STAGES.some((s) => s.id === stageId)) return;
    App.state.currentStage = stageId;
    App.state.afterClass = false;
    saveState();
    renderNav();
    applyRoute();
  };

  App.setFlag = function (key, value) {
    App.state.flags[key] = value;
    saveState();
    document.dispatchEvent(new CustomEvent("tmem175:flags"));
    syncMedia();
  };

  App.unlockAll = function () {
    App.state.afterClass = true;
    App.state.currentStage = "show";
    App.state.flags.lysosomeAbnormal = true;
    App.state.flags.modelRef = true;
    App.state.flags.media = true;
    App.state.flags.compare = true;
    saveState();
    renderNav();
    applyRoute();
    document.dispatchEvent(new CustomEvent("tmem175:flags"));
  };

  App.resetDefault = function () {
    App.state = structuredClone(DEFAULT_STATE);
    saveState();
    renderNav();
    go("home");
    document.dispatchEvent(new CustomEvent("tmem175:flags"));
  };

  function parseHash() {
    const h = (location.hash || "#/home").replace(/^#\/?/, "");
    return h.split("?")[0] || "home";
  }

  function go(route) {
    const r = route === "home" ? "home" : route;
    if (location.hash !== "#/" + r) location.hash = "#/" + r;
    else applyRoute();
  }

  function applyRoute() {
    const route = parseHash();
    const stage = stageByRoute(route);
    if (!App.isUnlocked(stage.id)) {
      toast("请等待教师解锁「" + stage.nav + "」");
      const fallback = STAGES.slice()
        .reverse()
        .find((s) => App.isUnlocked(s.id));
      const fb = fallback.routes[fallback.routes[0] === "" ? 1 : 0] || fallback.routes[0] || "home";
      if (route !== fb) {
        location.hash = "#/" + fb;
        return;
      }
    }
    App.route = route === "" ? "home" : route;
    document.querySelectorAll(".view").forEach((v) => {
      v.classList.toggle("is-on", v.id === "view-" + App.route);
    });
    renderNav();
    document.dispatchEvent(new CustomEvent("tmem175:route", { detail: { route: App.route, stage: stage.id } }));
    const main = document.getElementById("main");
    if (main) main.scrollTop = 0;
    renderSubnav();
    syncMedia();
  }

  function renderNav() {
    const box = document.getElementById("navItems");
    if (!box) return;
    const current = stageByRoute(App.route);
    box.innerHTML = STAGES.map((s) => {
      const locked = !App.isUnlocked(s.id);
      const cur = s.id === current.id;
      const href = s.routes[s.routes[0] === "" ? 1 : 0];
      return `<button type="button" class="nav-item${cur ? " is-current" : ""}${locked ? " is-locked" : ""}" data-route="${href}" data-stage="${s.id}">${s.nav}<span class="lock">${locked ? " 锁" : ""}</span></button>`;
    }).join("");
    box.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sid = btn.getAttribute("data-stage");
        if (!App.isUnlocked(sid)) {
          toast("请等待教师解锁「" + STAGES.find((s) => s.id === sid).nav + "」");
          return;
        }
        go(btn.getAttribute("data-route"));
      });
    });
    renderHomeModules();
  }

  function renderHomeModules() {
    const box = document.getElementById("homeModules");
    if (!box) return;
    const cards = [
      { stage: "inspire", route: "inspire", kicker: "启发思路", title: "请先看课件", text: "转录要点、对照表与流程图在幻灯片上，站内不重复出题。" },
      { stage: "diagnose", route: "diagnose", kicker: "诊断归因", title: "诊断配对", text: "第 38–42 位密码子教学示意：自己配对、改一个碱基，再对照标准示意。" },
      { stage: "model", route: "journey", kicker: "模型建构", title: "宏观 → 微观全景", text: "从端茶杯的手飞向神经系统、神经元、溶酶体，再进入图 8。" },
      { stage: "model", route: "lysosome", kicker: "模型建构", title: "图 8 溶酶体 3D", text: "先看正常，再问、再猜、再拖因果卡；最后才切换异常对照。" },
      { stage: "model", route: "model", kicker: "模型建构", title: "拖卡建构模型", text: "与课件同一套卡片，可以拖错，可以拆开重来。" },
      { stage: "show", route: "show", kicker: "成果展示", title: "端得稳 / 很难拿稳", text: "融媒体对照留空位，由教师解锁后使用。" }
    ];
    box.innerHTML = cards.map((c) => {
      const locked = !App.isUnlocked(c.stage);
      return `<button type="button" class="module-card${locked ? " is-locked" : ""}" data-route="${c.route}" data-stage="${c.stage}">
        <div class="kicker">${c.kicker}${locked ? " · 未解锁" : ""}</div>
        <h3>${c.title}</h3>
        <p>${c.text}</p>
      </button>`;
    }).join("");
    box.querySelectorAll(".module-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sid = btn.getAttribute("data-stage");
        if (!App.isUnlocked(sid)) {
          toast("请等待教师解锁本模块");
          return;
        }
        go(btn.getAttribute("data-route"));
      });
    });
  }

  /* ---------- toast ---------- */
  let toastTimer = 0;
  function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 2600);
  }
  App.toast = toast;

  /* ---------- 教师面板 ---------- */
  function openTeacher(step) {
    const modal = document.getElementById("teacherModal");
    modal.classList.add("is-open");
    const body = document.getElementById("teacherBody");
    const gate = document.getElementById("teacherGate");
    const authed = App._teacherAuthed;
    gate.style.display = authed ? "none" : "flex";
    body.hidden = !authed;
    if (authed) fillTeacherBody();
    if (!authed) {
      const input = document.getElementById("teacherCode");
      input.value = "";
      setTimeout(() => input.focus(), 50);
    }
  }

  function closeTeacher() {
    document.getElementById("teacherModal").classList.remove("is-open");
  }

  function fillTeacherBody() {
    const pick = document.getElementById("stagePick");
    pick.innerHTML = STAGES.map((s) => {
      const on = !App.state.afterClass && App.state.currentStage === s.id;
      return `<button type="button" class="btn${on ? " btn-gold" : ""}" data-stage="${s.id}">讲到「${s.nav}」</button>`;
    }).join("");
    pick.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => { App.setStage(b.getAttribute("data-stage")); fillTeacherBody(); });
    });
    document.querySelectorAll("#teacherBody [data-flag]").forEach((b) => {
      const key = b.getAttribute("data-flag");
      const on = !!App.state.flags[key];
      b.classList.toggle("btn-gold", on);
      b.onclick = () => {
        App.setFlag(key, !App.state.flags[key]);
        fillTeacherBody();
      };
    });
  }

  function bindTeacher() {
    const longPress = (el) => {
      let t = 0;
      const start = (e) => {
        t = setTimeout(() => openTeacher(), 1200);
      };
      const clear = () => clearTimeout(t);
      el.addEventListener("pointerdown", start);
      el.addEventListener("pointerup", clear);
      el.addEventListener("pointerleave", clear);
      el.addEventListener("pointercancel", clear);
    };
    longPress(document.getElementById("navMark"));
    longPress(document.getElementById("hotCorner"));
    longPress(document.getElementById("brandBlock"));

    document.getElementById("teacherGate").addEventListener("submit", (e) => {
      e.preventDefault();
      const code = (document.getElementById("teacherCode").value || "").trim().toLowerCase();
      if (code === PASS) {
        App._teacherAuthed = true;
        document.getElementById("teacherGate").style.display = "none";
        document.getElementById("teacherBody").hidden = false;
        fillTeacherBody();
      } else {
        toast("口令不正确");
      }
    });
    document.getElementById("teacherClose").addEventListener("click", closeTeacher);
    document.getElementById("teacherModal").addEventListener("click", (e) => {
      if (e.target.id === "teacherModal") closeTeacher();
    });
    document.getElementById("unlockAll").addEventListener("click", () => {
      App.unlockAll();
      fillTeacherBody();
      toast("已全部解锁（课后模式）");
    });
    document.getElementById("lockDefault").addEventListener("click", () => {
      App._teacherAuthed = true;
      App.resetDefault();
      fillTeacherBody();
      toast("已恢复课上默认：讲到诊断归因");
    });
  }

  /* ---------- 通用拖放（触控友好） ---------- */
  App.makeDrag = function (options) {
    const { itemSelector, onDrop, getPayload, onSelect } = options;
    let dragging = null;
    let ghost = null;
    let moved = false;

    function payloadFrom(el) {
      return getPayload ? getPayload(el) : { id: el.dataset.id, html: el.innerHTML, className: el.className };
    }

    function ptOf(e) {
      if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0];
      if (e.touches && e.touches[0]) return e.touches[0];
      return e;
    }

    function start(e, el) {
      if (e.button !== undefined && e.button !== 0) return;
      const pt = ptOf(e);
      dragging = { el, payload: payloadFrom(el), x: pt.clientX, y: pt.clientY };
      moved = false;
    }
    function ensureGhost(el) {
      if (ghost) return;
      document.body.classList.add("is-dragging");
      ghost = document.createElement("div");
      ghost.className = "ghost-drag card-tile " + (el.className || "");
      ghost.innerHTML = el.innerHTML;
      ghost.style.width = Math.max(el.offsetWidth, 100) + "px";
      document.body.appendChild(ghost);
    }
    function move(e) {
      if (!dragging) return;
      const pt = ptOf(e);
      const dist = Math.hypot(pt.clientX - dragging.x, pt.clientY - dragging.y);
      if (!moved && dist < 10) return;
      moved = true;
      ensureGhost(dragging.el);
      ghost.style.left = pt.clientX + "px";
      ghost.style.top = pt.clientY + "px";
    }
    function end(e) {
      if (!dragging) return;
      const pt = ptOf(e);
      if (ghost) ghost.style.display = "none";
      const target = document.elementFromPoint(pt.clientX, pt.clientY);
      if (ghost) ghost.remove();
      ghost = null;
      document.body.classList.remove("is-dragging");
      const src = dragging;
      dragging = null;
      if (moved) {
        if (target && onDrop) onDrop(target, src.payload, src.el, pt);
      } else if (onSelect) {
        onSelect(src.el, src.payload);
      }
    }

    document.addEventListener("pointermove", (e) => { if (dragging) move(e); });
    document.addEventListener("pointerup", (e) => { if (dragging) end(e); });
    document.addEventListener("pointercancel", (e) => { if (dragging) end(e); });

    return {
      bindItems(root) {
        root.querySelectorAll(itemSelector).forEach((el) => {
          if (el.dataset.dragBound) return;
          el.dataset.dragBound = "1";
          el.addEventListener("pointerdown", (e) => start(e, el));
        });
      }
    };
  };


  function renderSubnav() {
    document.querySelectorAll(".subnav").forEach((n) => n.remove());
    if (!["journey", "lysosome", "model"].includes(App.route)) return;
    if (!App.isUnlocked("model")) return;
    const view = document.getElementById("view-" + App.route);
    if (!view) return;
    const bar = document.createElement("div");
    bar.className = "subnav";
    const items = [
      ["journey", "① 宏观 → 微观"],
      ["lysosome", "② 图 8 溶酶体"],
      ["model", "③ 拖卡建模"]
    ];
    bar.innerHTML = items.map(([r, t]) =>
      `<button type="button" class="btn${App.route === r ? " is-on" : ""}" data-route="${r}">${t}</button>`
    ).join("");
    bar.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => go(b.getAttribute("data-route"))));
    view.insertBefore(bar, view.firstElementChild.nextElementSibling);
  }

  function syncMedia() {
    const allow = App.state && App.state.flags.media;
    document.querySelectorAll("[data-media]").forEach((el) => {
      el.classList.toggle("is-locked", !allow);
      const p = el.querySelector("p");
      if (p) p.textContent = allow
        ? "已解锁空位。第一版不自制片源，课上可将对照影像接在这里。"
        : "视频插件留空。解锁后可在此接入对照影像。";
    });
  }

  App.loadOptionalConfig = function (url) {
    const s = document.createElement("script");
    s.src = url;
    s.async = false;
    s.onerror = function () { /* 无本地 config 时保持 example / 空配置 */ };
    document.head.appendChild(s);
  };

  App.boot = function () {
    App.state = loadState();
    bindTeacher();
    document.addEventListener("tmem175:flags", syncMedia);
    window.addEventListener("hashchange", applyRoute);
    if (!location.hash) location.hash = "#/home";
    renderNav();
    applyRoute();
    document.dispatchEvent(new CustomEvent("tmem175:ready"));
  };

  App.go = go;
  global.TMEM175 = App;
})(window);
