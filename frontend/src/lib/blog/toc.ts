import type { ArticleBlock } from "@/config/blog";

export function articleToc(blocks: ArticleBlock[]): { id: string; text: string }[] {
  return blocks
    .filter((block): block is Extract<ArticleBlock, { type: "h2" }> => block.type === "h2")
    .map((block) => ({
      id: slugifyHeading(block.text),
      text: block.text,
    }));
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
