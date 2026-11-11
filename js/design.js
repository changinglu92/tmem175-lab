(function () {
  const App = window.TMEM175;
  if (!App) return;

  const LINKS = [
    {
      id: "dna",
      title: "DNA / 基因",
      short: "改写或补上这段基因",
      prompt: "你打算怎样处理这段 TMEM175 基因？补上正常拷贝，还是改掉替换的碱基？想一想：神经元里这样做，还要过哪些关？",
      follow: "如果改的是基因本身，细胞以后每次转录会不会都带着这个改变？这对安全性和可逆性意味着什么？"
    },
    {
      id: "mrna",
      title: "mRNA",
      short: "导入正常信使，再翻译",
      prompt: "导入正常的 TMEM175 mRNA，让核糖体翻译出通道蛋白——这和今天复习的转录、翻译是同一条原理。想一想：mRNA 会不会一直留在细胞里？药效大概能维持多久？",
      follow: "如果 mRNA 会被降解，要维持通道数量，是不是需要反复给药？这和直接改 DNA，有什么不一样？"
    },
    {
      id: "protein",
      title: "TMEM175 蛋白",
      short: "直接增强已经做出的通道",
      prompt: "患者已经做出了功能减弱的通道蛋白。有没有办法让现有通道更容易工作，而不去改基因或 mRNA？目前这类小分子激动剂还在临床前。",
      follow: "如果蛋白构象已经不稳，只加一个小分子，就能把溶酶体 pH 拉回 4.6 附近吗？还缺哪一层证据？"
    },
    {
      id: "ph",
      title: "溶酶体 pH",
      short: "先把腔内酸碱稳态调回来",
      prompt: "异常时泵还在泵氢离子，泄漏通道变弱，腔内过酸。如果直接调节 pH，水解酶活性会不会回来？要想一想：会不会影响到别的细胞器？",
      follow: "pH 只是中间环节。即便腔内酸度纠正了，已经聚积的 α-突触核蛋白会不会自动消失？"
    },
    {
      id: "asyn",
      title: "α-突触核蛋白",
      short: "从下游减少聚积或促进清除",
      prompt: "也可以不先修 TMEM175，而是减少 α-突触核蛋白的生成，或帮助细胞把它清掉。针对它的 mRNA 的核酸药物，有的已进入早期临床，但那不是「TMEM175 的药已经进入临床」。",
      follow: "如果上游通道仍然异常，只清下游垃圾，聚积会不会再出现？这个方案解决的是原因，还是结果？"
    }
  ];

  const KEY = "tmem175-design-draft";

  function loadDraft() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function saveDraft(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* ignore */ }
  }

  function current() {
    return LINKS.find((x) => x.id === (loadDraft().link || "")) || null;
  }

  function renderLinks() {
    const box = document.getElementById("designLinks");
    if (!box) return;
    const draft = loadDraft();
    box.innerHTML = LINKS.map((l) => `
      <button type="button" class="design-card${draft.link === l.id ? " is-on" : ""}" data-link="${l.id}">
        <strong>${l.title}</strong>
        <span>${l.short}</span>
      </button>`).join("");
    box.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        const d = loadDraft();
        d.link = b.getAttribute("data-link");
        saveDraft(d);
        paint();
      });
    });
  }

  function classify(text, linkId) {
    const t = (text || "").toLowerCase();
    const notes = [];
    if (/临床|上市|已经有药|特效药/.test(t) && /tmem175|通道/.test(t)) {
      notes.push("请再核一下：针对 TMEM175 本身、用于帕金森病的药，目前还没有进入人体临床试验，更不要写成已经上市。");
    }
    if (/trpml/.test(t) && /tmem175/.test(t)) {
      notes.push("TRPML1 和 TMEM175 是两种不同的溶酶体通道，不要写成同一种药。");
    }
    if (linkId === "mrna" || /mrna|信使|翻译/.test(t)) {
      notes.push("你的想法靠近「生物合成」：把正常蛋白重新造出来。这正好用到今天的基因表达。");
    }
    if (linkId === "asyn" && /mrna|核酸|反义|siRNA|沉默/.test(t)) {
      notes.push("这更像核酸药物：减少 α-突触核蛋白的翻译。有的进入了早期临床，但靶点不是 TMEM175。");
    }
    if (linkId === "protein" || /激动剂|小分子/.test(t)) {
      notes.push("小分子激动剂目前还在临床前，适合写成「研究中的思路」。");
    }
    if (/一定|肯定能治好|治愈/.test(t)) {
      notes.push("TMEM175 是风险因子。干预这条通路，不等于一定能治好帕金森。");
    }
    return notes;
  }

  function showFeedback(kind) {
    const el = document.getElementById("designFeedback");
    const link = current();
    const idea = (document.getElementById("designIdea").value || "").trim();
    if (!el) return;
    if (!link) {
      el.hidden = false;
      el.innerHTML = "<p>先选一环，我才知道该从哪一层追问你。</p>";
      return;
    }
    if (kind === "ask" && !idea) {
      el.hidden = false;
      el.innerHTML = `<p>${link.prompt}</p><p class="hint">先写下你的一句话，我再顺着你的想法往下问。</p>`;
      return;
    }
    const notes = classify(idea, link.id);
    const bits = [`<p>${link.follow}</p>`];
    notes.forEach((n) => bits.push(`<p>${n}</p>`));
    bits.push('<p class="hint">如果你愿意，可以换一环再试：同样是治疗，作用在基因、mRNA、蛋白或下游清除，风险和可持续性是不一样的。</p>');
    el.hidden = false;
    el.innerHTML = bits.join("");
  }

  function paint() {
    renderLinks();
    const link = current();
    const prompt = document.getElementById("designPrompt");
    const area = document.getElementById("designIdea");
    const draft = loadDraft();
    if (area && draft.idea != null && area.value !== draft.idea) area.value = draft.idea;
    if (prompt) prompt.textContent = link ? link.prompt : "先点上面的一环，再在这里写下你想怎么干预。";
  }

  function bind() {
    const area = document.getElementById("designIdea");
    if (area && !area.dataset.bound) {
      area.dataset.bound = "1";
      area.addEventListener("input", () => {
        const d = loadDraft();
        d.idea = area.value;
        saveDraft(d);
      });
    }
    const ask = document.getElementById("designAsk");
    if (ask && !ask.dataset.bound) {
      ask.dataset.bound = "1";
      ask.addEventListener("click", () => showFeedback("ask"));
    }
    const reset = document.getElementById("designReset");
    if (reset && !reset.dataset.bound) {
      reset.dataset.bound = "1";
      reset.addEventListener("click", () => {
        saveDraft({});
        const el = document.getElementById("designFeedback");
        if (el) { el.hidden = true; el.innerHTML = ""; }
        if (area) area.value = "";
        paint();
      });
    }
  }

  document.addEventListener("tmem175:route", () => {
    if (App.route !== "design") return;
    bind();
    paint();
  });
})();
