import { Marked, type Tokens } from "marked";
import hljs from "highlight.js";
import markedKatex from "marked-katex-extension";

/**
 * Markdown 渲染工具，集中管理渲染逻辑，避免重复全局配置导致内存膨胀。
 *
 * 关键：必须设置 useNewRenderer: true 才能使用 token 对象 API。
 * 不设置时，marked v13 会用兼容层把 token 转成旧式位置参数
 * (code, infostring, isEscaped)，导致 { text, lang } 解构出 undefined，
 * hljs 收到 undefined 后抛出异常，parseMarkdown 的 catch 返回原始文本。
 */

const renderer = {
  code({ text, lang }: Tokens.Code): string {
    const language = (lang || "").match(/\S*/)?.[0] || "";
    let highlighted: string;

    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(text, { language }).value;
    } else {
      highlighted = hljs.highlightAuto(text).value;
    }

    highlighted = highlighted.replace(/\n$/, "") + "\n";

    if (!language) {
      return `<pre><code>${highlighted}</code></pre>\n`;
    }

    return `<pre><code class="language-${language}">${highlighted}</code></pre>\n`;
  },
};

const markedInstance = new Marked();

markedInstance.use({
  useNewRenderer: true, // 使用 token 对象 API，绕过兼容层
  renderer,
  gfm: true,
  breaks: true,
});

markedInstance.use(
  markedKatex({
    throwOnError: false,
  }),
);

/**
 * 将 Markdown 文本解析为 HTML。
 */
export function parseMarkdown(text: string): string {
  if (!text) return "";
  try {
    return markedInstance.parse(text) as string;
  } catch (e) {
    console.error("Markdown parsing failed:", e);
    return text;
  }
}
