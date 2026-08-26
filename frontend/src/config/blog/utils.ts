import type { ArticleBlock, InlinePart } from "./types";

export function link(text: string, href: string): InlinePart {
  return { link: text, href };
}

export function p(...parts: InlinePart[]): ArticleBlock {
  return { type: "p", parts };
}

export function h2(text: string): ArticleBlock {
  return { type: "h2", text };
}

export function h3(text: string): ArticleBlock {
  return { type: "h3", text };
}

export function ul(items: string[]): ArticleBlock {
  return { type: "ul", items };
}

export function quote(text: string): ArticleBlock {
  return { type: "quote", text };
}

export function image(
  url: string,
  alt: string,
  width: number,
  height: number,
  caption?: string
): ArticleBlock {
  return { type: "image", url, alt, width, height, caption };
}

export function faq(
  items: { question: string; answer: string }[],
  title = "Frequently Asked Questions"
): ArticleBlock {
  return { type: "faq", title, items };
}

function inlinePartWords(part: InlinePart): string {
  return typeof part === "string" ? part : part.link;
}

export function blockToPlainText(block: ArticleBlock): string {
  switch (block.type) {
    case "p":
      return block.parts.map(inlinePartWords).join("");
    case "h2":
    case "h3":
      return block.text;
    case "ul":
      return block.items.join(" ");
    case "quote":
      return block.text;
    case "image":
      return "";
    case "faq":
      return block.items
        .map((item) => `${item.question} ${item.answer}`)
        .join(" ");
    default:
      return "";
  }
}

export function countArticleWords(blocks: ArticleBlock[]): number {
  const text = blocks.map(blockToPlainText).join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

/** ~200 words per minute for in-depth buying guides. */
export function estimateReadTime(blocks: ArticleBlock[]): string {
  const words = countArticleWords(blocks);
  const minutes = Math.max(5, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function finalizePost(
  post: Omit<import("./types").BlogPost, "readTime">
): import("./types").BlogPost {
  return {
    ...post,
    readTime: estimateReadTime(post.body),
  };
}
