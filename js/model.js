/* 模型建构：与课件同一套卡片。可以拖错，可以拆开重来。 */
(function () {
  const CARDS = [
    { id: "gene", text: "TMEM175 基因", cls: "g0" },
    { id: "tx", text: "转录", cls: "g1" },
    { id: "mrna", text: "mRNA", cls: "g0" },
    { id: "tl", text: "翻译", cls: "g1" },
    { id: "prot", text: "TMEM175 蛋白", cls: "g0" },
    { id: "phok", text: "溶酶体 pH 稳态", cls: "g0" },
    { id: "deg", text: "α-Synuclein 被分解", cls: "g0" },
    { id: "neuronok", text: "神经元功能正常", cls: "g0" },
    { id: "mut", text: "基因突变（碱基对替换）", cls: "y" },
    { id: "badprot", text: "异常 TMEM175 蛋白", cls: "y" },
    { id: "phdown", text: "溶酶体 pH 下降", cls: "r" },
    { id: "enz", text: "水解酶活性降低", cls: "r" },
    { id: "agg", text: "α-Synuclein 聚积", cls: "r" },
    { id: "damage", text: "神经元受损", cls: "r" }
  ];

  const NORMAL_N = 8;
  const PATHO_N = 6;
  const REF_NORMAL = ["gene", "tx", "mrna", "tl", "prot", "phok", "deg", "neuronok"];
  const REF_PATHO = ["mut", "badprot", "phdown", "enz", "agg", "damage"];

  let normal = Array(NORMAL_N).fill(null);
  let patho = Array(PATHO_N).fill(null);
  let pack = CARDS.map((c) => c.id);
  let selected = null;

  function cardById(id) {
    return CARDS.find((c) => c.id === id);
  }

  function placedSet() {
    return new Set([...normal, ...patho].filter(Boolean));
  }

  function tileHtml(id, interactive) {
    const c = cardById(id);
    const sel = interactive && selected === id ? " is-selected" : "";
    const item = interactive ? ' data-item="model"' : "";
    return `<div class="card-tile ${c.cls}${sel}" data-id="${c.id}"${item}>${c.text}</div>`;
  }

  function slotsHtml(arr, prefix) {
    const parts = [];
    arr.forEach((id, i) => {
      if (i) parts.push('<span class="arrow">→</span>');
      const filled = id ? " is-filled" : "";
      const inner = id ? tileHtml(id, true) : "";
      parts.push(`<div class="model-slot${filled}" data-slot="${prefix}-${i}">${inner}</div>`);
    });
    return parts.join("");
  }

  function render() {
    document.getElementById("slotsNormal").innerHTML = slotsHtml(normal, "n");
    document.getElementById("slotsPatho").innerHTML = slotsHtml(patho, "p");
    const used = placedSet();
    const rest = pack.filter((id) => !used.has(id));
    const pal = document.getElementById("modelPalette");
    pal.innerHTML = rest.length
      ? rest.map((id) => tileHtml(id, true)).join("")
      : '<span style="color:var(--muted)">卡片都已放上。可以拖回来，或点「拆开重来」。</span>';
    bindDrag();
    renderRef();
  }

  function findSlot(el) {
    return el.closest && el.closest(".model-slot");
  }

  function place(id, slotEl, fromEl) {
    if (!slotEl) {
      /* 拖回托盘：若来自某格，清空该格 */
      clearId(id);
      render();
      return;
    }
    const key = slotEl.getAttribute("data-slot");
    if (!key) return;
    const [row, idx] = key.split("-");
    const arr = row === "n" ? normal : patho;
    const i = +idx;
    /* 若该卡已在别处，先拿走 */
    clearId(id);
    /* 若目标格已有卡，换回托盘（清掉即可，render 会把它放回） */
    arr[i] = id;
    render();
  }

  function clearId(id) {
    /* 必须原地改，不能换新数组，否则 place() 里事先拿到的引用会写到已丢弃的旧数组上 */
    for (let i = 0; i < normal.length; i++) if (normal[i] === id) normal[i] = null;
    for (let i = 0; i < patho.length; i++) if (patho[i] === id) patho[i] = null;
  }

  let drag;
  function bindDrag() {
    if (!drag) {
      drag = TMEM175.makeDrag({
        itemSelector: '[data-item="model"]',
        getPayload: (el) => ({ id: el.getAttribute("data-id") }),
        onDrop: (target, payload) => {
          const slot = findSlot(target);
          const pal = target.closest && target.closest("#modelPalette");
          if (slot) { selected = null; place(payload.id, slot); }
          else if (pal) { selected = null; clearId(payload.id); render(); }
        }
      });
    }
    drag.bindItems(document.getElementById("view-model"));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderRef() {
    const box = document.getElementById("modelRef");
    const graph = document.getElementById("modelRefGraph");
    const allow = TMEM175.state && TMEM175.state.flags.modelRef;
    box.hidden = !allow;
    if (!allow || !graph) return;
    const row = (ids, label) => {
      const cells = ids.map((id) => tileHtml(id, false)).join('<span class="arrow">→</span>');
      return `<div class="path-row" style="margin-bottom:10px"><div class="path-label">${label}</div><div class="slots">${cells}</div></div>`;
    };
    graph.innerHTML = `
      ${row(REF_NORMAL, "正常")}
      ${row(REF_PATHO, "致病")}
      <p class="hint">参考模型还可对照课件更细的写法：正常通路有「折叠 / 定位」「H⁺ 正常运出，溶酶体 pH≈4.6」「水解酶活性正常」；致病通路有「mRNA 41 位 GAC→GCC」「41 位 Asp→Ala」「H⁺ 不能运出，pH&lt;4.6」「多巴胺能神经元受损」。拖卡仍以本页与课件卡片为准，不另起竞争模型。</p>`;
  }

  function boot() {
    if (!document.getElementById("modelPalette")) return;
    pack = shuffle(CARDS.map((c) => c.id));
    render();
    document.getElementById("modelReset").addEventListener("click", () => {
      normal = Array(NORMAL_N).fill(null);
      patho = Array(PATHO_N).fill(null);
      render();
    });
    document.getElementById("modelShuffle").addEventListener("click", () => {
      pack = shuffle(CARDS.map((c) => c.id));
      render();
    });

    document.getElementById("view-model").addEventListener("click", (e) => {
      const tile = e.target.closest("[data-item=\"model\"]");
      const slot = e.target.closest(".model-slot");
      if (tile && slot && selected && selected !== tile.getAttribute("data-id")) {
        const id = selected;
        selected = null;
        place(id, slot);
        return;
      }
      if (tile) {
        const id = tile.getAttribute("data-id");
        selected = selected === id ? null : id;
        render();
        return;
      }
      if (slot && selected) {
        const id = selected;
        selected = null;
        place(id, slot);
      }
    });
    document.getElementById("modelRefBtn").addEventListener("click", () => {
      if (TMEM175.state && TMEM175.state.flags.modelRef) {
        document.getElementById("modelRef").hidden = false;
        document.getElementById("modelRef").scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        TMEM175.toast("对照参考请等教师口令解锁");
      }
    });
    document.addEventListener("tmem175:flags", renderRef);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
