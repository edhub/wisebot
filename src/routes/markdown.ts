import { Marked } from "marked";
import hljs from "highlight.js";
import markedKatex from "marked-katex-extension";

/**
 * Markdown utility to centralize rendering logic and prevent
 * repeated global configuration calls which can lead to memory bloat.
 */

const renderer = {
  code(code: string, infostring: string | undefined): string {
    const lang = (infostring || "").match(/\S*/)?.[0] || "";
    let highlighted: string;

    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(code, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(code).value;
    }

    highlighted = highlighted.replace(/\n$/, "") + "\n";

    // @ts-ignore - access marked options
    const langPrefix = this.options.langPrefix || "language-";

    if (!lang) {
      return `<pre><code>${highlighted}</code></pre>\n`;
    }

    return `<pre><code class="${langPrefix}${lang}">${highlighted}</code></pre>\n`;
  },
  link(href: string, title: string | null | undefined, text: string): string {
    // Ensure links open in a controlled way if needed,
    // though here we just return the string as the component handles the click.
    return `<a href="${href}" title="${title || ""}">${text}</a>`;
  },
};

// Create a dedicated instance instead of using the global 'marked' object
// to avoid side effects and configuration pollution.
const markedInstance = new Marked();

markedInstance.use({
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
 * Parses markdown text into HTML.
 * @param text The markdown string to parse.
 * @returns The resulting HTML string.
 */
export function parseMarkdown(text: string): string {
  if (!text) return "";
  try {
    // marked.parse can be sync or async depending on extensions,
    // but with our current setup it is synchronous.
    return markedInstance.parse(text) as string;
  } catch (e) {
    console.error("Markdown parsing failed:", e);
    return text;
  }
}
