/* 课堂提问框：本课范围内的追问。无 API key 时使用规则底；有 key 也不直接给标准答案。 */
(function () {
  const SCOPE = "本课提问只讨论 TMEM175、基因表达、溶酶体和帕金森风险。不提供个人就医或用药建议。";

  const SYSTEM = [
    "你是高三一轮复习公开课《帕金森诊疗中心》的课堂追问助手，不是讲课聊天机器人。",
    "范围仅限：TMEM175、基因表达（转录/翻译/密码子/简并性/碱基替换）、溶酶体酸碱稳态、帕金森风险机制。",
    "学生卡住或过度推断时，只追问缺失环节，不直接给出标准答案，不替学生写完整因果链。",
    "严禁说「有替换就一定会得帕金森」或「改一个碱基就手抖」。TMEM175 是风险因子。",
    "个人就医、用药、是否患病等建议一律回答：超出本课范围。",
    "教学序列用的是第 38–42 位密码子示意（患者甲 GAC→GCC，Asp→Ala；患者乙 GAC→GAU，简并性），不要引入真实变异 M393T 或全长序列。",
    "V-ATPase 是氢泵（水解 ATP，把 H⁺ 泵入），TMEM175 是把多余 H⁺ 漏出的通道，不是第二种泵。正常腔内 pH 约 4.6，细胞质约 7.2。",
    "用简洁中文，一次只追问一两个关键缺口。"
  ].join("");

  const RULES = [
    {
      test: /(就医|用药|怎么治我|我是不是|家人得了|哪家医院|吃什么药|要不要检查|确诊|处方|门诊)/,
      reply: "个人就医或用药建议超出本课提问范围。把问题收回到课堂上：TMEM175、基因表达、溶酶体，或帕金森风险机制。"
    },
    {
      test: /(一定|肯定|就会).*(帕金森|发病|手抖|患病|中毒)|(有替换就会|改(一个|了)?碱基就会|突变就会得)/,
      reply: "先停一下：TMEM175 是风险因子，不是「有替换就一定会发病」。如果只看到碱基变了，中间还缺哪些环节？蛋白功能变了吗？溶酶体环境变了吗？还有哪些因素可能影响最终是否出现症状？"
    },
    {
      test: /(手抖|颤抖).*(碱基|突变|替换)|(碱基|突变|替换).*(手抖|颤抖)/,
      reply: "「改一个碱基就手抖」这个跳跃太大。从基因到性状，中间还经过哪些过程？清理是否受阻、风险是否升高，怎样用模型里的环节说清楚？"
    },
    {
      test: /(患者乙|没变|相同|简并|同义|GAU|为什么氨基酸)/,
      reply: "患者乙的碱基变了、氨基酸却可能没变。打开密码子表比一比：同一种氨基酸可以由几种密码子编码？这提醒我们什么？"
    },
    {
      test: /(患者甲|错义|GCC|丙氨酸|空间结构|41)/,
      reply: "先把第 41 位和正常人并排写下来。这个密码子变成了什么？对应的氨基酸呢？氨基酸变了以后，你还需要追问哪一步，才能谈到蛋白功能？"
    },
    {
      test: /(密码子表|怎么查|哪个氨基酸|怎么配对)/,
      reply: "先圈出三人序列里不一样的那个密码子，再在密码子表里查它编码什么。不要先看标准示意。查完再问自己：变了的是碱基，还是氨基酸，还是两者都有？"
    },
    {
      test: /(氢泵|通道|V-?ATPase|怎么进|怎么出|漏)/,
      reply: "膜上其实有两种不同的蛋白。一个要消耗 ATP 把 H⁺ 泵进去，另一个只是让多余的 H⁺ 漏出去。它们谁是泵、谁是通道？如果通道变弱，泵还在工作，腔内的 H⁺ 会怎样？"
    },
    {
      test: /(pH|酸碱|过酸|4\.6|7\.2|稳态)/,
      reply: "正常时腔内约 4.6、细胞质约 7.2。pH 要稳定，进和出需要一起看。如果只进不出，pH 会向哪边走？水解酶喜欢的环境被打破以后，消化能力会怎样？先做出你的假设。"
    },
    {
      test: /(水解酶|消化|酶活性|垃圾|降解)/,
      reply: "水解酶是溶酶体的「消化车间」，它们依赖适宜的 pH。若 pH 偏离约 4.6，你认为活性会升高、不变，还是下降？这对 α-突触核蛋白的清理意味着什么？"
    },
    {
      test: /(α-?Synuclein|突触核|聚积|清理|降解不了)/,
      reply: "α-突触核蛋白聚积是重要致病因素，但本课的因果要从 TMEM175 这一侧往下接。溶酶体的消化能力若下降，清理会怎样？请先排出中间的环节，不要直接跳到「所以得了帕金森」。"
    },
    {
      test: /(转录|翻译|mRNA|基因表达|中心法则)/,
      reply: "把「TMEM175 基因 → ？ → ？ → TMEM175 蛋白」中间两步补上，并标出主要场所。真核生物刚转录出来的 RNA，能直接当翻译模板吗？"
    },
    {
      test: /(模型|拖卡|顺序|因果|不会摆)/,
      reply: "先把绿色卡片连成「正常时为什么能维持功能」，再把黄—红色卡片连成「哪一步开始出问题」。不必一次摆对，可以拆开重来。缺的是环节，还是箭头方向？"
    },
    {
      test: /(治疗|CRISPR|基因编辑|干预|方案)/,
      reply: "治疗思路请回到课件的 DNA / mRNA / 蛋白质三层面来写。想一想：你的方案作用在信息流的哪一环？促进 α-突触核蛋白清除如果出现在方案里，它是作用在 TMEM175 本身，还是下游干预？"
    }
  ];

  const FALLBACK = "我可以追问，但不直接给标准答案。你现在卡在哪一环：密码子与氨基酸、H⁺ 怎样进出、pH 与水解酶，还是模型里的因果顺序？先写出你已经想到的那一步。";

  function ruleReply(text) {
    const t = text.replace(/\s+/g, "");
    for (const r of RULES) {
      if (r.test.test(t)) return r.reply;
    }
    return FALLBACK;
  }

  async function apiReply(history, text) {
    const cfg = window.TMEM175_CONFIG || {};
    if (!cfg.apiUrl || !cfg.apiKey) return null;
    const messages = [{ role: "system", content: cfg.systemPrompt || SYSTEM }];
    history.slice(-6).forEach((h) => messages.push({ role: h.role, content: h.content }));
    messages.push({ role: "user", content: text });
    const res = await fetch(cfg.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + cfg.apiKey
      },
      body: JSON.stringify({
        model: cfg.model || "gpt-4o-mini",
        temperature: 0.4,
        messages
      })
    });
    if (!res.ok) throw new Error("api " + res.status);
    const data = await res.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return content || null;
  }

  const history = [];

  function addBubble(role, text) {
    const log = document.getElementById("tutorLog");
    const div = document.createElement("div");
    div.className = "bubble " + (role === "user" ? "me" : "bot");
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function boot() {
    const fab = document.getElementById("tutorFab");
    const panel = document.getElementById("tutorPanel");
    if (!fab) return;
    fab.addEventListener("click", () => {
      const open = !panel.classList.contains("is-open");
      panel.classList.toggle("is-open", open);
      if (open && !panel.dataset.welcomed) {
        addBubble("assistant", "你好。我是本课的追问框，不是答题机。" + SCOPE + "你可以从「我看到碱基变了，但不知道接下来该问什么」开始。");
        panel.dataset.welcomed = "1";
      }
    });
    document.getElementById("tutorClose").addEventListener("click", () => panel.classList.remove("is-open"));
    document.getElementById("tutorForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("tutorInput");
      const text = (input.value || "").trim();
      if (!text) return;
      input.value = "";
      addBubble("user", text);
      history.push({ role: "user", content: text });
      let reply = ruleReply(text);
      try {
        const api = await apiReply(history, text);
        if (api) reply = api;
      } catch (err) {
        reply = ruleReply(text) + "（在线接口暂不可用，已改用课堂追问规则。）";
      }
      addBubble("assistant", reply);
      history.push({ role: "assistant", content: reply });
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
