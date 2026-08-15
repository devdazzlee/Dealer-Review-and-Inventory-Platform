export type InlinePart = string | { link: string; href: string };

export type ArticleBlock =
  | { type: "p"; parts: InlinePart[] }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string }
  | {
      type: "faq";
      title?: string;
      items: { question: string; answer: string }[];
    };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  authorRole: string;
  authorBio?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  icon: string;
  ctaLabel: string;
  ctaHref: string;
  query: string;
  /** Primary SEO keyword phrase for this article. */
  targetKeyword: string;
  metaTitle?: string;
  metaDescription?: string;
  body: ArticleBlock[];
  faqs: { question: string; answer: string }[];
}

export type BlogPostInput = Omit<BlogPost, "readTime">;
