/* 诊断配对：第 38–42 位密码子教学示意。禁止出现真实变异 M393T 或全长序列。 */
(function () {
  const AA = {
    GAC: "天冬氨酸", GAU: "天冬氨酸",
    UUC: "苯丙氨酸", UUU: "苯丙氨酸",
    GCC: "丙氨酸", GCU: "丙氨酸", GCA: "丙氨酸", GCG: "丙氨酸",
    GUG: "缬氨酸", GUU: "缬氨酸", GUA: "缬氨酸", GUC: "缬氨酸",
    UUA: "亮氨酸", UUG: "亮氨酸", CUU: "亮氨酸", CUC: "亮氨酸", CUA: "亮氨酸", CUG: "亮氨酸",
    UCU: "丝氨酸", UCC: "丝氨酸", UCA: "丝氨酸", UCG: "丝氨酸", AGU: "丝氨酸", AGC: "丝氨酸",
    UAU: "酪氨酸", UAC: "酪氨酸",
    UGU: "半胱氨酸", UGC: "半胱氨酸",
    UGG: "色氨酸",
    CCU: "脯氨酸", CCC: "脯氨酸", CCA: "脯氨酸", CCG: "脯氨酸",
    CAU: "组氨酸", CAC: "组氨酸",
    CAA: "谷氨酰胺", CAG: "谷氨酰胺",
    CGU: "精氨酸", CGC: "精氨酸", CGA: "精氨酸", CGG: "精氨酸", AGA: "精氨酸", AGG: "精氨酸",
    AUU: "异亮氨酸", AUC: "异亮氨酸", AUA: "异亮氨酸",
    AUG: "甲硫氨酸",
    ACU: "苏氨酸", ACC: "苏氨酸", ACA: "苏氨酸", ACG: "苏氨酸",
    AAU: "天冬酰胺", AAC: "天冬酰胺",
    AAA: "赖氨酸", AAG: "赖氨酸",
    GAA: "谷氨酸", GAG: "谷氨酸",
    GGU: "甘氨酸", GGC: "甘氨酸", GGA: "甘氨酸", GGG: "甘氨酸",
    UAA: "终止", UAG: "终止", UGA: "终止"
  };

  const POS = [38, 39, 40, 41, 42];
  const NORMAL = ["GAC", "UUC", "GCC", "GAC", "GUG"];
  const PATA = ["GAC", "UUC", "GCC", "GCC", "GUG"];
  const PATB = ["GAU", "UUC", "GCC", "GAC", "GUG"];

  const TRAY = ["天冬氨酸", "苯丙氨酸", "丙氨酸", "缬氨酸", "谷氨酸", "甘氨酸"];

  const SEQS = [
    { id: "normal", title: "正常人", cls: "normal", mrna: NORMAL, note: "对照序列" },
    { id: "a", title: "患者甲", cls: "patient-a", mrna: PATA, note: "请找出与正常人不同的位点", mutIndex: 3 },
    { id: "b", title: "患者乙", cls: "patient-b", mrna: PATB, note: "碱基变了，氨基酸未必变", mutIndex: 0 }
  ];

  const answers = { normal: Array(5).fill(""), a: Array(5).fill(""), b: Array(5).fill("") };
  let active = null;

  function peptide(codons) {
    return codons.map((c) => AA[c] || "？");
  }

  function renderBoard() {
    const board = document.getElementById("seqBoard");
    if (!board) return;
    board.innerHTML = SEQS.map((s) => {
      const codonCells = s.mrna.map((c, i) => {
        let cls = "codon";
        if (s.id === "a" && i === 3) cls += " is-mut";
        if (s.id === "b" && i === 0) cls += " is-silent";
        return `<div class="${cls}">${c}<small>${POS[i]} 位</small></div>`;
      }).join("");
      const slots = answers[s.id].map((aa, i) => {
        const filled = aa ? " is-filled" : "";
        const on = active && active.seq === s.id && active.i === i ? " is-active" : "";
        return `<button type="button" class="aa-slot${filled}${on}" data-seq="${s.id}" data-i="${i}">${aa || "点此配对"}</button>`;
      }).join("");
      return `<article class="seq-card ${s.cls}">
        <div class="seq-head"><h3>${s.title}</h3><div class="meta">mRNA 5′ → 3′　${s.note}</div></div>
        <div class="codon-row"><div class="lab">mRNA</div>${codonCells}</div>
        <div class="aa-row" style="margin-top:8px"><div class="lab">多肽</div>${slots}</div>
      </article>`;
    }).join("");
    board.querySelectorAll(".aa-slot").forEach((btn) => {
      btn.addEventListener("click", () => {
        const seq = btn.getAttribute("data-seq");
        const i = +btn.getAttribute("data-i");
        if (active && active.seq === seq && active.i === i) active = null;
        else active = { seq, i };
        renderBoard();
      });
    });
  }

  function renderTray() {
    const tray = document.getElementById("aaTray");
    tray.innerHTML = TRAY.map((aa) => `<button type="button" class="chip" data-aa="${aa}">${aa}</button>`).join("") +
      `<button type="button" class="chip" data-aa="" style="color:var(--muted)">清除此格</button>`;
    tray.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!active) {
          TMEM175.toast("请先点选一个多肽空格");
          return;
        }
        answers[active.seq][active.i] = btn.getAttribute("data-aa") || "";
        const next = nextEmpty(active.seq, active.i);
        active = next;
        renderBoard();
      });
    });
  }

  function nextEmpty(seq, i) {
    for (let k = i + 1; k < 5; k++) if (!answers[seq][k]) return { seq, i: k };
    return null;
  }

  function codonTableHtml() {
    const rows = [
      ["天冬氨酸 Asp", "GAC　GAU", "患者乙用得到：两种密码子编码同一种氨基酸，这就是简并性。"],
      ["苯丙氨酸 Phe", "UUC　UUU", "本示意片段第 39 位为 UUC。"],
      ["丙氨酸 Ala", "GCU　GCC　GCA　GCG", "患者甲第 41 位变成了 GCC。"],
      ["缬氨酸 Val", "GUU　GUC　GUA　GUG", "本示意片段第 42 位为 GUG。"],
      ["谷氨酸 Glu", "GAA　GAG", "查阅用，本示意片段未使用。"],
      ["甘氨酸 Gly", "GGU　GGC　GGA　GGG", "查阅用，本示意片段未使用。"]
    ];
    return `<p class="hint">仅列出本活动用得到的氨基酸，不是完整密码表。全部为 mRNA 密码子。</p>
      <table class="codon-table"><thead><tr><th>氨基酸</th><th>密码子</th><th>说明</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td><code>${r[1]}</code></td><td>${r[2]}</td></tr>`).join("")}</tbody></table>`;
  }

  function showTab(id) {
    document.getElementById("diagPair").hidden = id !== "pair";
    document.getElementById("diagEdit").hidden = id !== "edit";
    document.getElementById("diagCompare").hidden = id !== "compare";
    document.querySelectorAll("[data-diag-tab]").forEach((b) => {
      b.classList.toggle("btn-primary", b.getAttribute("data-diag-tab") === id);
    });
    if (id === "compare") renderCompare();
    if (id === "edit") renderSandbox();
  }

  function renderCompare() {
    const box = document.getElementById("compareContent");
    const allow = TMEM175.state && TMEM175.state.flags.compare;
    const attempted = Object.values(answers).some((arr) => arr.some(Boolean));
    if (!allow && !attempted) {
      box.innerHTML = `<p>请先在「配对翻译」里自己试一试。若课堂节奏需要提前对照，请教师在面板中解锁「诊断标准示意」。</p>`;
      return;
    }
    if (!allow && attempted) {
      /* 学生做过后再对照，这是「先做再对照」的本意，允许查看 */
    }
    const line = (title, mrna, pep, extra) =>
      `<p><strong>${title}</strong>　mRNA 5′：<code>${mrna.join("　")}</code><br />多肽：${pep.join(" — ")}${extra || ""}</p>`;
    box.innerHTML = `
      ${line("正常人", NORMAL, peptide(NORMAL), "")}
      ${line("患者甲", PATA, peptide(PATA), "　← 第 41 位 GAC→GCC，天冬氨酸→丙氨酸（错义）")}
      ${line("患者乙", PATB, peptide(PATB), "　← 第 38 位 GAC→GAU，氨基酸未变（GAC 与 GAU 都编码天冬氨酸，简并性）")}
      <p class="hint">这是教学示意片段，不是 TMEM175 全长，也不使用真实临床变异编号。诊断任务的书面作答请回到课件。</p>`;
  }

  /* ----- 改一个碱基 ----- */
  let bases = NORMAL.join("").split("");

  function codonAt(k) {
    return bases.slice(k * 3, k * 3 + 3).join("");
  }

  function renderSandbox() {
    const wrap = document.getElementById("sandboxBases");
    const origin = NORMAL.join("");
    let html = "";
    for (let i = 0; i < 15; i++) {
      const pos = POS[Math.floor(i / 3)];
      const head = i % 3 === 1 ? `<div class="pos">${pos} 位</div>` : `<div class="pos">&nbsp;</div>`;
      const changed = bases[i] !== origin[i] ? " is-changed" : "";
      html += `<div class="base-unit">${head}<button type="button" class="base-btn${changed}" data-i="${i}">${bases[i]}</button></div>`;
      if (i % 3 === 2 && i < 14) html += `<div style="width:10px"></div>`;
    }
    wrap.innerHTML = html;
    wrap.querySelectorAll(".base-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const i = +b.getAttribute("data-i");
        const cycle = { A: "U", U: "G", G: "C", C: "A" };
        bases[i] = cycle[bases[i]] || "A";
        renderSandbox();
      });
    });
    const peps = [0, 1, 2, 3, 4].map((k) => {
      const c = codonAt(k);
      const aa = AA[c] || "？";
      const originAa = peptide(NORMAL)[k];
      const mark = aa !== originAa ? ` <span class="tag-red tag">改变</span>` : "";
      return `${aa}${mark}`;
    });
    document.getElementById("sandboxPeptide").innerHTML = "多肽：" + peps.join(" — ");
    const notes = [];
    for (let k = 0; k < 5; k++) {
      const c = codonAt(k);
      const o = NORMAL[k];
      if (c === o) continue;
      const aa = AA[c] || "无法识别 / 终止";
      const oaa = AA[o];
      if (aa === oaa) notes.push(`第 ${POS[k]} 位 ${o}→${c}，氨基酸仍是${aa}。想一想：这和密码子的什么特性有关？`);
      else notes.push(`第 ${POS[k]} 位 ${o}→${c}，${oaa}变成了${aa}。想一想：氨基酸变了，蛋白质空间结构一定变吗？性状一定变吗？`);
    }
    document.getElementById("sandboxNote").textContent = notes.join(" ") || "这是正常人示意序列。点一个碱基试试。";
  }

  function boot() {
    if (!document.getElementById("seqBoard")) return;
    renderBoard();
    renderTray();
    document.getElementById("codonTableWrap").innerHTML = codonTableHtml();
    document.getElementById("toggleCodonTable").addEventListener("click", () => {
      const w = document.getElementById("codonTableWrap");
      w.hidden = !w.hidden;
    });
    document.getElementById("diagClear").addEventListener("click", () => {
      answers.normal = Array(5).fill("");
      answers.a = Array(5).fill("");
      answers.b = Array(5).fill("");
      active = null;
      renderBoard();
    });
    document.querySelectorAll("[data-diag-tab]").forEach((b) => {
      b.addEventListener("click", () => showTab(b.getAttribute("data-diag-tab")));
    });
    document.getElementById("sandboxReset").addEventListener("click", () => {
      bases = NORMAL.join("").split("");
      renderSandbox();
    });
    document.addEventListener("tmem175:flags", () => {
      if (!document.getElementById("diagCompare").hidden) renderCompare();
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
