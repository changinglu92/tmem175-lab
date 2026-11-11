/* 宏观→微观：老人端茶杯的手 → 神经系统 → 神经元 → 溶酶体 → 图8 */
(function () {
  const STEPS = [
    {
      id: "hand",
      title: "从一杯茶开始",
      text: "静止性震颤、动作缓慢，症状出现在神经系统。表型和病理在神经元。",
      kind: "img",
      src: "assets/teacup-hands.jpg",
      alt: "一双年长的手端着茶杯，教学示意静帧"
    },
    {
      id: "nerve",
      title: "进入神经系统",
      text: "大脑与脊髓组成中枢神经系统。帕金森相关的运动调节，和部分脑区的神经元活动有关。",
      kind: "svg",
      svg: nerveSvg()
    },
    {
      id: "neuron",
      title: "聚焦到神经元",
      text: "这是一个神经元的教学示意：胞体、树突、轴突。我们要进到细胞里面，看它如何清理「垃圾」。",
      kind: "svg",
      svg: neuronSvg()
    },
    {
      id: "lyso",
      title: "溶酶体：消化车间",
      text: "溶酶体是细胞内的消化车间，需要稳定的酸性环境才能让水解酶工作。下一站进入图 8 立体对照。",
      kind: "svg",
      svg: lysoSvg()
    }
  ];

  let step = 0;

  function nerveSvg() {
    return `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="中枢神经系统示意">
      <defs>
        <radialGradient id="bg1" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#1c3a4a"/><stop offset="100%" stop-color="#0b1820"/></radialGradient>
        <linearGradient id="brain" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#9ad7c8"/><stop offset="100%" stop-color="#4e9d8a"/></linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#bg1)"/>
      <!-- 脑 -->
      <ellipse cx="400" cy="160" rx="150" ry="110" fill="url(#brain)" opacity="0.95"/>
      <path d="M280 150c20-40 50-55 80-40c20-30 60-40 90-10c30-25 80-10 95 25c25 10 40 40 30 70c-10 35-40 55-80 60c-30 25-80 25-120 5c-50 10-90-15-95-50c-20-20-15-45 0-60z" fill="#c8efe4" opacity="0.35"/>
      <path d="M310 100c30 10 40 30 30 50M430 95c25 8 40 28 28 55M360 80c10 25 8 45-5 60" stroke="#2F6F5E" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.55"/>
      <!-- 脑干 + 脊髓 -->
      <path d="M390 255c8 18 8 30 4 50v110" stroke="#8ec9b8" stroke-width="18" fill="none" stroke-linecap="round"/>
      <path d="M392 255c6 18 6 30 3 50v110" stroke="#d7f3ea" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.5"/>
      <!-- 侧向神经 -->
      <path d="M396 320h70M396 360h55M396 400h70" stroke="#8ec9b8" stroke-width="6" fill="none" stroke-linecap="round"/>
      <text x="400" y="40" text-anchor="middle" fill="#d5e4dc" font-size="20" font-family="Noto Sans SC, sans-serif">中枢神经系统（教学示意）</text>
      <text x="400" y="175" text-anchor="middle" fill="#16332c" font-size="18" font-weight="700" font-family="Noto Sans SC, sans-serif">脑</text>
      <text x="430" y="430" fill="#d5e4dc" font-size="16" font-family="Noto Sans SC, sans-serif">脊髓</text>
    </svg>`;
  }

  function neuronSvg() {
    return `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="神经元示意">
      <rect width="800" height="450" fill="#0b1820"/>
      <g transform="translate(260 210)">
        <!-- 树突 -->
        <path d="M0 0l-140-90m140 90l-150-20m150 20l-120 70m150-70l-40-110m40 110l30-120" stroke="#7ec8ff" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="-140" cy="-90" r="6" fill="#b9e4ff"/>
        <circle cx="-150" cy="-20" r="6" fill="#b9e4ff"/>
        <circle cx="-120" cy="70" r="6" fill="#b9e4ff"/>
        <!-- 胞体 -->
        <ellipse cx="40" cy="0" rx="70" ry="58" fill="#3d8fb8"/>
        <ellipse cx="40" cy="0" rx="70" ry="58" fill="none" stroke="#9ad7f0" stroke-width="3"/>
        <circle cx="28" cy="-6" r="16" fill="#d9f4ff"/>
        <circle cx="28" cy="-6" r="7" fill="#1b3a4a"/>
        <!-- 胞内溶酶体小点 -->
        <circle cx="60" cy="16" r="9" fill="#e8c056" stroke="#fff4c2" stroke-width="2"/>
        <circle cx="78" cy="-8" r="7" fill="#d9893b" stroke="#ffd9a8" stroke-width="2"/>
        <!-- 轴突 -->
        <path d="M108 8h210" stroke="#7ec8ff" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M318 8l40-24m-40 24l44 6m-44-6l36 28" stroke="#7ec8ff" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      <text x="400" y="40" text-anchor="middle" fill="#d5e4dc" font-size="20" font-family="Noto Sans SC, sans-serif">神经元（教学示意）</text>
      <text x="230" y="120" fill="#b9e4ff" font-size="15" font-family="Noto Sans SC, sans-serif">树突</text>
      <text x="280" y="300" fill="#d9f4ff" font-size="15" font-family="Noto Sans SC, sans-serif">胞体</text>
      <text x="560" y="200" fill="#b9e4ff" font-size="15" font-family="Noto Sans SC, sans-serif">轴突</text>
      <text x="360" y="255" fill="#e8c056" font-size="14" font-family="Noto Sans SC, sans-serif">溶酶体</text>
    </svg>`;
  }

  function lysoSvg() {
    return `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="神经元内的溶酶体">
      <rect width="800" height="450" fill="#0b1820"/>
      <!-- 胞质 -->
      <ellipse cx="400" cy="230" rx="280" ry="170" fill="#163445" stroke="#2b6070" stroke-width="8"/>
      <text x="400" y="70" text-anchor="middle" fill="#d5e4dc" font-size="20" font-family="Noto Sans SC, sans-serif">神经元胞体局部 · 溶酶体</text>
      <!-- 几个细胞器暗示 -->
      <ellipse cx="260" cy="160" rx="40" ry="22" fill="#2a5a6a" stroke="#6aa0b0" stroke-width="2"/>
      <ellipse cx="230" cy="300" rx="50" ry="20" fill="#244a58" stroke="#6aa0b0" stroke-width="2"/>
      <!-- 高亮溶酶体 -->
      <circle cx="430" cy="230" r="78" fill="#d8c078" opacity="0.25"/>
      <circle cx="430" cy="230" r="64" fill="#f3e2a8" stroke="#f6f0d2" stroke-width="6"/>
      <circle cx="408" cy="220" r="8" fill="#7ec8a3"/>
      <circle cx="448" cy="210" r="7" fill="#c07ad4"/>
      <circle cx="440" cy="252" r="8" fill="#e8a838"/>
      <circle cx="414" cy="250" r="6" fill="#6B7CDB"/>
      <text x="430" y="235" text-anchor="middle" fill="#5a3f10" font-size="16" font-weight="700" font-family="Noto Sans SC, sans-serif">溶酶体</text>
      <text x="430" y="338" text-anchor="middle" fill="#f6f0d2" font-size="14" font-family="Noto Sans SC, sans-serif">消化车间 · 需要稳定的酸性 pH</text>
    </svg>`;
  }

  function render() {
    const frame = document.getElementById("journeyFrame");
    if (!frame) return;
    if (!frame.dataset.ready) {
      frame.innerHTML = STEPS.map((s, i) => {
        const body = s.kind === "img"
          ? `<img src="${s.src}" alt="${s.alt}" />`
          : s.svg;
        return `<div class="journey-scene" data-i="${i}">${body}<div class="journey-caption"><h3>${s.title}</h3><p>${s.text}</p></div></div>`;
      }).join("");
      frame.dataset.ready = "1";
    }
    frame.querySelectorAll(".journey-scene").forEach((el, i) => {
      el.classList.toggle("is-on", i === step);
    });
    const dots = document.getElementById("journeyDots");
    dots.innerHTML = STEPS.map((_, i) => `<button type="button" class="${i === step ? "is-on" : ""}" data-i="${i}" aria-label="第${i + 1}步"></button>`).join("");
    dots.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => { step = +b.getAttribute("data-i"); render(); });
    });
    const next = document.getElementById("journeyNext");
    next.textContent = step === STEPS.length - 1 ? "进入图 8 立体对照" : "下一步";
    document.getElementById("journeyPrev").disabled = step === 0;
  }

  function boot() {
    if (!document.getElementById("journeyFrame")) return;
    render();
    document.getElementById("journeyPrev").addEventListener("click", () => {
      if (step > 0) { step--; render(); }
    });
    document.getElementById("journeyNext").addEventListener("click", () => {
      if (step < STEPS.length - 1) { step++; render(); }
      else TMEM175.go("lysosome");
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
