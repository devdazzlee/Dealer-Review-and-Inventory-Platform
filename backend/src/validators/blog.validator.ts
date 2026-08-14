import { z } from "zod";

const jsonValue = z.unknown();

export const blogListQuerySchema = z.object({
  page: z.preprocess(
    (v) => (v === undefined || v === "" ? 1 : Number(v)),
    z.number().int().min(1).default(1)
  ),
  pageSize: z.preprocess(
    (v) => (v === undefined || v === "" ? 9 : Number(v)),
    z.number().int().min(1).max(50).default(9)
  ),
  category: z.string().trim().optional(),
});

export const blogSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const blogIdParamSchema = z.object({
  id: z.string().min(1),
});

export const newsletterBodySchema = z.object({
  email: z.string().email(),
});

export const adminBlogListQuerySchema = z.object({
  page: z.preprocess(
    (v) => (v === undefined || v === "" ? 1 : Number(v)),
    z.number().int().min(1).default(1)
  ),
  pageSize: z.preprocess(
    (v) => (v === undefined || v === "" ? 20 : Number(v)),
    z.number().int().min(1).max(50).default(20)
  ),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  published: z.preprocess((v) => {
    if (v === undefined || v === "") return undefined;
    if (v === "true") return true;
    if (v === "false") return false;
    return v;
  }, z.boolean().optional()),
});

export const blogPostBodySchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  excerpt: z.string().trim().min(1),
  category: z.string().trim().min(1),
  author: z.string().trim().min(1),
  authorRole: z.string().trim().optional(),
  authorBio: z.string().trim().nullable().optional(),
  featuredImageUrl: z.string().trim().nullable().optional(),
  featuredImageAlt: z.string().trim().nullable().optional(),
  body: jsonValue,
  faqs: jsonValue,
  metaTitle: z.string().trim().min(1).max(70),
  metaDescription: z.string().trim().min(1).max(170),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const blogPostUpdateBodySchema = blogPostBodySchema.partial();
