/* 溶酶体 3D：V-ATPase 氢泵 vs TMEM175 通道。默认只展示正常状态。 */
(function () {
  const CAUSE = [
    "TMEM175 通道减弱",
    "H⁺ 不能运出",
    "氢泵仍在泵入",
    "溶酶体 pH 下降（<4.6）",
    "水解酶活性降低",
    "α-突触核蛋白更难降解"
  ];

  let causeSlots = Array(CAUSE.length).fill(null);
  let causePack = CAUSE.slice();
  let selectedCause = null;
  let guess = { ph: "", enz: "" };

  let renderer, scene, camera, root, raf = 0, running = false;
  let abnormal = false;
  let cutOn = true; /* 默认打开切面，便于看清腔内 */
  let protons = [];
  let enzymes = [];
  let tmems = [];
  let pumps = [];
  let membrane, lumen;
  let orbit;
  const target = new THREE.Vector3(0, 0, 0);
  const R = 2.15;

  function labelSprite(text, color) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 96;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 96);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(8, 8, 496, 80, 18);
    else ctx.rect(8, 8, 496, 80);
    ctx.fill();
    ctx.fillStyle = color || "#1B2A33";
    ctx.font = "bold 36px 'Noto Sans CJK SC','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 50);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(1.7, 0.32, 1);
    sp.renderOrder = 10;
    return sp;
  }

  function placeOnMembrane(obj, phi, theta, radius) {
    const p = new THREE.Vector3().setFromSphericalCoords(radius, phi, theta);
    obj.position.copy(p);
    const outward = p.clone().normalize();
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward);
  }

  function makePump() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x6B7CDB, roughness: 0.4, metalness: 0.15 });
    const mat2 = new THREE.MeshStandardMaterial({ color: 0x4456c4, roughness: 0.35, metalness: 0.2 });
    const v0 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.55, 16), mat2);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.38, 8), mat);
    stalk.position.y = 0.42;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), mat);
    head.position.y = 0.66;
    g.add(v0, stalk, head);
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), mat);
      const a = (i / 6) * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.22, 0.66, Math.sin(a) * 0.22);
      g.add(s);
    }
    if (arguments[0]) {
      const lab = labelSprite("V-ATPase 氢泵", "#2C3A8C");
      lab.position.set(0, 1.2, 0);
      g.add(lab);
    }
    g.userData.kind = "pump";
    g.scale.setScalar(1.35);
    return g;
  }

  function makeChannel(isBad, showLab) {
    const g = new THREE.Group();
    const color = isBad ? 0x8a6a6a : 0x3FA37A;
    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.45, side: THREE.DoubleSide });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.62, 18, 1, true), mat);
    const capM = new THREE.MeshStandardMaterial({ color: color, roughness: 0.45 });
    const rim1 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.055, 8, 18), capM);
    rim1.rotation.x = Math.PI / 2; rim1.position.y = 0.31;
    const rim2 = rim1.clone(); rim2.position.y = -0.31;
    g.add(wall, rim1, rim2);
    if (isBad) {
      const plug = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xC0504C, roughness: 0.5 })
      );
      g.add(plug);
    }
    if (showLab) {
      const lab = labelSprite(isBad ? "TMEM175 减弱" : "TMEM175 通道", isBad ? "#7A201C" : "#1F6B4A");
      lab.position.set(0, 1.15, 0);
      g.add(lab);
    }
    g.userData.kind = "tmem";
    g.scale.setScalar(1.35);
    return g;
  }

  let capMesh = null;
  function shellMats() {
    return {
      mem: new THREE.MeshStandardMaterial({
        color: 0xe8d9a0,
        transparent: true,
        opacity: cutOn ? 0.58 : 0.28,
        roughness: 0.55,
        metalness: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false
      }),
      lumen: new THREE.MeshStandardMaterial({
        color: 0x9ad7d0,
        transparent: true,
        opacity: cutOn ? 0.16 : 0.08,
        roughness: 1,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    };
  }
  function rebuildShell() {
    if (!root) return;
    if (membrane) root.remove(membrane);
    if (lumen) root.remove(lumen);
    if (capMesh) { root.remove(capMesh); capMesh = null; }
    const mats = shellMats();
    if (cutOn) {
      /* 开口朝 +X，从默认视角能直接看到腔内 */
      membrane = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 36, Math.PI / 2, Math.PI), mats.mem);
      lumen = new THREE.Mesh(new THREE.SphereGeometry(R - 0.08, 32, 24, Math.PI / 2, Math.PI), mats.lumen);
      capMesh = new THREE.Mesh(
        new THREE.CircleGeometry(R - 0.05, 48),
        new THREE.MeshStandardMaterial({ color: 0x8ecfc4, transparent: true, opacity: 0.32, side: THREE.DoubleSide, roughness: 0.9 })
      );
      capMesh.rotation.y = Math.PI / 2;
      root.add(membrane, lumen, capMesh);
    } else {
      membrane = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 36), mats.mem);
      lumen = new THREE.Mesh(new THREE.SphereGeometry(R - 0.08, 32, 24), mats.lumen);
      root.add(membrane, lumen);
    }
  }

  function attachOrbit(dom) {
    const sph = new THREE.Spherical();
    sph.setFromVector3(camera.position.clone().sub(target));
    const ptrs = new Map();
    let lastPinch = 0;

    function apply() {
      sph.phi = Math.max(0.35, Math.min(Math.PI - 0.35, sph.phi));
      sph.radius = Math.max(4.2, Math.min(14, sph.radius));
      camera.position.setFromSpherical(sph).add(target);
      camera.lookAt(target);
    }
    function onDown(e) {
      dom.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) {
        const arr = [...ptrs.values()];
        lastPinch = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
      }
    }
    function onMove(e) {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) {
        const arr = [...ptrs.values()];
        const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
        if (lastPinch) sph.radius *= lastPinch / d;
        lastPinch = d;
        apply();
        return;
      }
      if (ptrs.size === 1) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        sph.theta -= dx * 0.007;
        sph.phi -= dy * 0.007;
        apply();
      }
    }
    function onUp(e) {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) lastPinch = 0;
    }
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointercancel", onUp);
    dom.addEventListener("wheel", (e) => {
      e.preventDefault();
      sph.radius *= e.deltaY > 0 ? 1.08 : 0.93;
      apply();
    }, { passive: false });
    apply();
    return {
      reset() {
        sph.radius = 8.0; sph.phi = 1.18; sph.theta = 0.72;
        apply();
      }
    };
  }

  function makeProton() {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xE45B8A, emissive: 0x5a1028, roughness: 0.3 })
    );
    const p = {
      mesh,
      mode: "lumen",
      t: Math.random(),
      theta: Math.random() * Math.PI * 2,
      phi: 0.4 + Math.random() * 2.2,
      r: 0.4 + Math.random() * (R - 0.8),
      pump: 0,
      ch: 0
    };
    root.add(mesh);
    return p;
  }

  function layoutProteins() {
    tmems.forEach((g) => root.remove(g));
    pumps.forEach((g) => root.remove(g));
    tmems = [];
    pumps = [];
    /* 切面打开时开口朝 +X，蛋白放在留下的那一半膜上（x ≤ 0） */
    const pumpPos = [
      [1.15, 2.2],
      [1.45, 3.4],
      [1.85, 2.8]
    ];
    const chPos = [
      [0.95, 3.7],
      [1.65, 1.9]
    ];
    pumpPos.forEach(([phi, theta], i) => {
      const g = makePump(i === 0);
      placeOnMembrane(g, phi, theta, R);
      root.add(g);
      pumps.push(g);
    });
    chPos.forEach(([phi, theta], i) => {
      const g = makeChannel(abnormal, i === 0);
      placeOnMembrane(g, phi, theta, R);
      root.add(g);
      tmems.push(g);
    });
  }

  function initScene(host) {
    if (typeof THREE === "undefined") {
      host.innerHTML = '<p style="color:#fff;padding:20px">三维库未加载。请检查 js/vendor/three.min.js。</p>';
      return;
    }
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1a22);
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(4.6, 2.4, 5.2);
    camera.lookAt(target);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.zIndex = "0";
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xb7c4c8, 0.7));
    const key = new THREE.DirectionalLight(0xfff4e0, 1.05);
    key.position.set(5, 6, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x88aacc, 0.45);
    fill.position.set(-4, -2, -3);
    scene.add(fill);

    root = new THREE.Group();
    scene.add(root);

    rebuildShell();

    const colors = [0x7ec8a3, 0xc07ad4, 0xe8a838, 0x6B7CDB, 0xd9893b, 0x5aa0d4];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.16 + Math.random() * 0.08, 0),
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.5 })
      );
      m.userData.base = {
        theta: Math.random() * Math.PI * 2,
        phi: 0.5 + Math.random() * 2,
        r: 0.5 + Math.random() * 1.1,
        speed: 0.15 + Math.random() * 0.2
      };
      root.add(m);
      enzymes.push(m);
    }
    const enzLab = labelSprite("水解酶 · 消化车间", "#7A4A00");
    enzLab.position.set(0.2, 0.15, 0.4);
    enzLab.scale.set(1.9, 0.36, 1);
    root.add(enzLab);

    layoutProteins();

    for (let i = 0; i < 20; i++) protons.push(makeProton());

    orbit = attachOrbit(host);
    orbit.reset();
    resize();
  }

  function resize() {
    if (!renderer) return;
    const host = document.getElementById("lysoStage");
    const w = host.clientWidth || 600;
    const h = host.clientHeight || 460;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function outsidePoint(meshObj, dist) {
    return meshObj.position.clone().normalize().multiplyScalar(R + dist);
  }
  function insidePoint(meshObj, dist) {
    return meshObj.position.clone().normalize().multiplyScalar(R - dist);
  }

  function tickProton(p, dt) {
    const pump = pumps[p.pump % pumps.length];
    const ch = tmems[p.ch % tmems.length];
    if (p.mode === "enter" && pump) {
      p.t += dt * 0.7;
      const a = outsidePoint(pump, 0.9);
      const b = insidePoint(pump, 0.45);
      p.mesh.position.lerpVectors(a, b, Math.min(1, p.t));
      if (p.t >= 1) {
        p.mode = "lumen";
        p.t = 0;
        p.theta = Math.random() * Math.PI * 2;
        p.phi = 0.5 + Math.random() * 2;
        p.r = 0.5 + Math.random() * 1.2;
      }
      return;
    }
    if (p.mode === "exit" && ch && !abnormal) {
      p.t += dt * 0.7;
      const a = insidePoint(ch, 0.45);
      const b = outsidePoint(ch, 0.85);
      p.mesh.position.lerpVectors(a, b, Math.min(1, p.t));
      if (p.t >= 1) {
        /* 循环：从另一个泵再进入 */
        p.mode = "enter";
        p.t = 0;
        p.pump = Math.floor(Math.random() * pumps.length);
      }
      return;
    }
    /* lumen wander */
    p.theta += dt * 0.35;
    p.phi += dt * 0.12;
    const cap = abnormal ? Math.min(p.r + dt * 0.05, R - 0.35) : p.r;
    const r = cap;
    p.mesh.position.setFromSphericalCoords(r, p.phi, p.theta);
    if (!abnormal && Math.random() < dt * 0.25) {
      p.mode = "exit";
      p.t = 0;
      p.ch = Math.floor(Math.random() * tmems.length);
    } else if (abnormal && p.mode === "exit") {
      p.mode = "lumen";
      p.t = 0;
    }
  }

  function maybeSpawnIn() {
    /* 异常时泵仍在工作：周期性让一个腔内粒子从泵再打一次进入动画，并略增数量 */
    if (!abnormal) return;
    if (protons.length < 34 && Math.random() < 0.02) {
      const p = makeProton();
      p.mode = "enter";
      p.t = 0;
      p.pump = Math.floor(Math.random() * pumps.length);
      protons.push(p);
    }
  }

  let last = 0;
  function animate(ts) {
    if (!running) return;
    raf = requestAnimationFrame(animate);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    enzymes.forEach((m, i) => {
      const b = m.userData.base;
      const spd = abnormal ? b.speed * 0.35 : b.speed;
      b.theta += dt * spd;
      m.position.setFromSphericalCoords(b.r, b.phi, b.theta);
      m.rotation.x += dt * (abnormal ? 0.2 : 0.7);
      m.rotation.y += dt * 0.4;
      if (m.material) {
        m.material.color.setHex(abnormal ? 0x9a9080 : [0x7ec8a3, 0xc07ad4, 0xe8a838, 0x6B7CDB, 0xd9893b, 0x5aa0d4][i % 6]);
      }
    });
    protons.forEach((p) => tickProton(p, dt));
    maybeSpawnIn();
    /* 让部分正常粒子开始进入，形成循环 */
    if (!abnormal) {
      const entering = protons.filter((p) => p.mode === "enter").length;
      if (entering < 3) {
        const idle = protons.find((p) => p.mode === "lumen" && Math.random() < 0.3);
        if (idle && Math.random() < dt * 0.8) {
          idle.mode = "enter";
          idle.t = 0;
          idle.pump = Math.floor(Math.random() * pumps.length);
        }
      }
    }
    renderer.render(scene, camera);
  }

  function setAbnormal(on) {
    abnormal = !!on;
    layoutProteins();
    const hudPH = document.getElementById("hudPH");
    const hudMode = document.getElementById("hudMode");
    const note = document.getElementById("abnormalNote");
    if (abnormal) {
      hudPH.textContent = "腔内 pH　< 4.6";
      hudPH.classList.add("alert");
      hudMode.textContent = "状态　异常对照";
      hudMode.classList.add("alert");
      if (note) note.hidden = false;
      protons.forEach((p) => {
        if (p.mode === "exit") { p.mode = "lumen"; p.t = 0; }
      });
    } else {
      hudPH.textContent = "腔内 pH　约 4.6";
      hudPH.classList.remove("alert");
      hudMode.textContent = "状态　正常（默认）";
      hudMode.classList.remove("alert");
      if (note) note.hidden = true;
      /* 减掉异常时多出来的粒子，保持轻量 */
      while (protons.length > 20) {
        const p = protons.pop();
        root.remove(p.mesh);
      }
    }
  }

  function start() {
    if (!renderer) {
      const host = document.getElementById("lysoStage");
      /* 保留 HUD 和按钮，把 canvas 插到舞台里 */
      initScene(host);
      window.addEventListener("resize", resize);
    } else {
      resize();
    }
    if (!running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(animate);
    }
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  }

  /* ----- 因果卡 ----- */
  function renderCause() {
    const slots = document.getElementById("causeSlots");
    const pal = document.getElementById("causePalette");
    if (!slots) return;
    slots.innerHTML = causeSlots.map((txt, i) =>
      `<div class="chain-slot${txt ? " is-filled" : ""}" data-cslot="${i}">${
        txt ? `<div class="card-tile g0${selectedCause === txt ? " is-selected" : ""}" data-item="cause" data-text="${txt}">${i + 1}. ${txt}</div>` : (i + 1) + " ．点此放入 / 拖入"
      }</div>`
    ).join("");
    const used = new Set(causeSlots.filter(Boolean));
    const rest = causePack.filter((t) => !used.has(t));
    pal.innerHTML = rest.map((t) => `<div class="card-tile g1${selectedCause === t ? " is-selected" : ""}" data-item="cause" data-text="${t}">${t}</div>`).join("") ||
      '<span style="color:var(--muted)">卡片已全部放下。可以拖回或拆开重来。</span>';
    if (!renderCause.drag) {
      renderCause.drag = TMEM175.makeDrag({
        itemSelector: '[data-item="cause"]',
        getPayload: (el) => ({ text: el.getAttribute("data-text") }),
        onSelect: (el, payload) => {
          selectedCause = selectedCause === payload.text ? null : payload.text;
          renderCause();
        },
        onDrop: (target, payload) => {
          const slot = target.closest && target.closest("[data-cslot]");
          const back = target.closest && target.closest("#causePalette");
          causeSlots = causeSlots.map((t) => (t === payload.text ? null : t));
          if (slot) {
            const i = +slot.getAttribute("data-cslot");
            causeSlots[i] = payload.text;
          }
          selectedCause = null;
          renderCause();
          maybeCauseHint();
        }
      });
    }
    renderCause.drag.bindItems(document.getElementById("view-lysosome"));
    document.querySelectorAll("#causeSlots [data-cslot]").forEach((slot) => {
      slot.addEventListener("click", () => {
        if (!selectedCause) return;
        const text = selectedCause;
        selectedCause = null;
        causeSlots = causeSlots.map((t) => (t === text ? null : t));
        causeSlots[+slot.getAttribute("data-cslot")] = text;
        renderCause();
        maybeCauseHint();
      });
    });
  }

  function maybeCauseHint() {
    const hint = document.getElementById("causeHint");
    if (causeSlots.every(Boolean)) {
      hint.textContent = "把你的假设说给同伴听。等教师口令，再看异常对照。不要急着写「所以导致帕金森」。";
    } else {
      hint.textContent = "";
    }
  }

  function syncUnlock() {
    const btn = document.getElementById("lysoAbnormal");
    const allow = TMEM175.state && TMEM175.state.flags.lysosomeAbnormal;
    if (btn) btn.hidden = !allow;
    if (!allow && abnormal) setAbnormal(false);
    const note = document.getElementById("abnormalNote");
    if (note && !abnormal) note.hidden = true;
  }

  function boot() {
    if (!document.getElementById("lysoStage")) return;
    renderCause();
    document.getElementById("causeReset").addEventListener("click", () => {
      causeSlots = Array(CAUSE.length).fill(null);
      causePack = CAUSE.slice().sort(() => Math.random() - 0.5);
      renderCause();
      maybeCauseHint();
    });
    causePack = CAUSE.slice().sort(() => Math.random() - 0.5);
    renderCause();

    document.querySelectorAll("#guessPH .guess-opt, #guessEnz .guess-opt").forEach((b) => {
      b.addEventListener("click", () => {
        const group = b.parentElement;
        group.querySelectorAll(".guess-opt").forEach((x) => x.classList.remove("is-picked"));
        b.classList.add("is-picked");
        if (group.id === "guessPH") guess.ph = b.getAttribute("data-val");
        else guess.enz = b.getAttribute("data-val");
      });
    });

    document.getElementById("lysoReset").addEventListener("click", () => orbit && orbit.reset());
    document.getElementById("lysoCut").addEventListener("click", () => {
      cutOn = !cutOn;
      rebuildShell();
    });
    document.getElementById("lysoAbnormal").addEventListener("click", () => {
      if (!(TMEM175.state && TMEM175.state.flags.lysosomeAbnormal)) {
        TMEM175.toast("异常对照请等教师口令解锁");
        return;
      }
      setAbnormal(!abnormal);
    });

    document.addEventListener("tmem175:flags", syncUnlock);
    document.addEventListener("tmem175:route", (e) => {
      if (e.detail.route === "lysosome") {
        start();
        syncUnlock();
      } else {
        stop();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (TMEM175.route === "lysosome") start();
    });
    syncUnlock();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
