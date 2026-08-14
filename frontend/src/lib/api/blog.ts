import "server-only";

import { apiClient } from "@/lib/api/client";
import type { ArticleBlock, BlogPost } from "@/config/blog";
import { estimateReadTime } from "@/config/blog";

export interface ApiBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole: string;
  authorBio: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  body: ArticleBlock[];
  faqs: { question: string; answer: string }[];
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  featured: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export function mapApiBlogPost(post: ApiBlogPost): BlogPost {
  const body = Array.isArray(post.body) ? post.body : [];
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    readTime: estimateReadTime(body),
    date: post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
    author: post.author,
    authorRole: post.authorRole,
    authorBio: post.authorBio ?? undefined,
    featuredImageUrl: post.featuredImageUrl ?? undefined,
    featuredImageAlt: post.featuredImageAlt ?? undefined,
    icon: "Sedan",
    ctaLabel: "Browse vehicles",
    ctaHref: "/vehicles",
    query: post.title,
    targetKeyword: post.metaTitle,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    body,
  };
}

export async function listBlogPosts(options: {
  page?: number;
  pageSize?: number;
  category?: string;
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(options.page ?? 1));
  params.set("pageSize", String(options.pageSize ?? 9));
  if (options.category) params.set("category", options.category);
  const result = await apiClient<{
    data: ApiBlogPost[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/api/blog?${params.toString()}`);
  return {
    ...result,
    posts: result.data.map(mapApiBlogPost),
  };
}

export async function getBlogPost(slug: string) {
  const result = await apiClient<{ post: ApiBlogPost; related: ApiBlogPost[] }>(
    `/api/blog/${encodeURIComponent(slug)}`
  );
  return {
    post: mapApiBlogPost(result.post),
    related: result.related.map(mapApiBlogPost),
  };
}

export async function getBlogCategories() {
  const result = await apiClient<{ data: { category: string; count: number }[] }>(
    "/api/blog/categories"
  );
  return result.data;
}

export async function getRecentBlogPosts(exclude?: string) {
  const qs = exclude ? `?exclude=${encodeURIComponent(exclude)}` : "";
  const result = await apiClient<{
    data: {
      slug: string;
      title: string;
      excerpt: string;
      category: string;
      publishedAt: string | null;
    }[];
  }>(`/api/blog/recent${qs}`);
  return result.data;
}

export async function getBlogSitemapEntries() {
  try {
    const result = await apiClient<{ data: { slug: string }[] }>("/api/blog/sitemap");
    return result.data;
  } catch {
    return [];
  }
}
