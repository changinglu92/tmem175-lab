/* 课堂提问框（可选）API 配置示例。
 * 使用方法：复制本文件为 js/config.js，再填写接口信息。
 * js/config.js 已被 .gitignore，切勿把 API key 写入仓库或提交到 GitHub Pages。
 * 没有 config.js、或不填 apiKey 时，站点会自动使用内置的追问规则，课上仍可使用提问框。
 */
window.TMEM175_CONFIG = {
  /* 兼容 OpenAI Chat Completions 的接口，例如：
   *   https://api.openai.com/v1/chat/completions
   * 也可换成其他兼容网关。留空则只用规则式追问。
   */
  apiUrl: "",
  apiKey: "",
  model: "",
  /* 可选：自定义系统提示。一般不必改。 */
  systemPrompt: ""
};
