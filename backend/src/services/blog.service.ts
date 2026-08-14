import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError";

export interface BlogListQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  published?: boolean;
  search?: string;
}

export interface BlogPostInput {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole?: string;
  authorBio?: string | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  body: unknown;
  faqs: unknown;
  metaTitle: string;
  metaDescription: string;
  published?: boolean;
  featured?: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export class BlogService {
  async listPublic(query: BlogListQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 9;
    const where: Prisma.BlogPostWhereInput = { published: true };
    if (query.category) where.category = query.category;

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: posts,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async featured() {
    return prisma.blogPost.findFirst({
      where: { published: true, featured: true },
      orderBy: { publishedAt: "desc" },
    });
  }

  async recent(limit = 5, excludeSlug?: string) {
    return prisma.blogPost.findMany({
      where: {
        published: true,
        ...(excludeSlug ? { slug: { not: excludeSlug } } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        publishedAt: true,
        featuredImageUrl: true,
      },
    });
  }

  async categories() {
    const groups = await prisma.blogPost.groupBy({
      by: ["category"],
      where: { published: true },
      _count: { category: true },
      orderBy: { category: "asc" },
    });
    return groups.map((row) => ({
      category: row.category,
      count: row._count.category,
    }));
  }

  async getById(id: string) {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundError("Blog post");
    return post;
  }

  async getBySlug(slug: string, includeUnpublished = false) {
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post || (!includeUnpublished && !post.published)) {
      throw new NotFoundError("Blog post");
    }
    return post;
  }

  async related(slug: string, category: string, limit = 3) {
    const same = await prisma.blogPost.findMany({
      where: { published: true, slug: { not: slug }, category },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    if (same.length >= limit) return same;
    const extra = await prisma.blogPost.findMany({
      where: {
        published: true,
        slug: { not: slug, notIn: same.map((p) => p.slug) },
      },
      orderBy: { publishedAt: "desc" },
      take: limit - same.length,
    });
    return [...same, ...extra];
  }

  async sitemap() {
    return prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, publishedAt: true },
    });
  }

  async adminList(query: BlogListQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.BlogPostWhereInput = {};
    if (query.category) where.category = query.category;
    if (query.published !== undefined) where.published = query.published;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
      ];
    }
    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { data: posts, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  async create(input: BlogPostInput) {
    const slug = slugify(input.slug || input.title);
    const exists = await prisma.blogPost.findUnique({ where: { slug } });
    if (exists) throw new ConflictError("A post with that slug already exists");
    return prisma.blogPost.create({
      data: this.toData(input, slug),
    });
  }

  async update(id: string, input: Partial<BlogPostInput>) {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Blog post");
    const slug = input.slug ? slugify(input.slug) : existing.slug;
    if (slug !== existing.slug) {
      const clash = await prisma.blogPost.findUnique({ where: { slug } });
      if (clash) throw new ConflictError("A post with that slug already exists");
    }
    const published = input.published ?? existing.published;
    const publishedAt = published
      ? existing.publishedAt ?? new Date()
      : null;
    return prisma.blogPost.update({
      where: { id },
      data: {
        ...this.toData({ ...existing, ...input, published } as BlogPostInput, slug),
        publishedAt,
      },
    });
  }

  async delete(id: string) {
    try {
      await prisma.blogPost.delete({ where: { id } });
    } catch {
      throw new NotFoundError("Blog post");
    }
  }

  async subscribe(email: string) {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) {
      throw new ValidationError("Enter a valid email address");
    }
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      create: { email: normalized },
      update: {},
    });
    return { success: true };
  }

  private toData(input: BlogPostInput, slug: string): Prisma.BlogPostUncheckedCreateInput {
    const published = input.published ?? false;
    return {
      slug,
      title: input.title,
      excerpt: input.excerpt,
      category: input.category,
      author: input.author,
      authorRole: input.authorRole ?? "Staff Writer",
      authorBio: input.authorBio ?? null,
      featuredImageUrl: input.featuredImageUrl ?? null,
      featuredImageAlt: input.featuredImageAlt ?? null,
      body: input.body as Prisma.InputJsonValue,
      faqs: input.faqs as Prisma.InputJsonValue,
      metaTitle: input.metaTitle.slice(0, 60),
      metaDescription: input.metaDescription.slice(0, 155),
      published,
      featured: input.featured ?? false,
      publishedAt: published ? new Date() : null,
    };
  }
}

export const blogService = new BlogService();
