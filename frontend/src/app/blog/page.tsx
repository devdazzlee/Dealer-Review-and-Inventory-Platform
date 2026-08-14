import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { ContentPage, ContentSection } from "@/components/layout/ContentPage";
import { BlogCover } from "@/components/blog/BlogCover";
import { BlogCard } from "@/components/blog/BlogCard";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { SeoContentSection } from "@/components/seo/SeoContentSection";
import { LocationFaqSection } from "@/components/dealers/LocationFaqSection";
import { ROUTES } from "@/config/constants";
import { BLOG_FAQ_ITEMS, BLOG_SEO_CONTENT } from "@/config/seo-content";
import { PAGE_SEO } from "@/config/seo";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { buildBlogListingSchemas } from "@/lib/schema/builders";
import { listBlogPosts, getBlogCategories, getRecentBlogPosts } from "@/lib/api/blog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = PAGE_SEO.blog;
export const revalidate = 120;

interface BlogPageProps {
  searchParams: { page?: string; category?: string };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const page = Number(searchParams.page) || 1;
  const category = searchParams.category;
  const [{ posts, totalPages, total }, categories, recent] = await Promise.all([
    listBlogPosts({ page, pageSize: 9, category }).catch(() => ({
      posts: [],
      totalPages: 1,
      total: 0,
      data: [],
      page: 1,
    })),
    getBlogCategories().catch(() => []),
    getRecentBlogPosts().catch(() => []),
  ]);

  const featured = page === 1 && !category ? posts[0] : undefined;
  const grid = featured && page === 1 && !category ? posts.filter((p) => p.slug !== featured.slug) : posts;

  return (
    <>
      <SchemaMarkup data={buildBlogListingSchemas(BLOG_FAQ_ITEMS, posts)} />
      <ContentPage
        title="Blog & Buying Guides"
        subtitle="Practical tips, dealer insights, and guides to help you shop smarter."
        badge="AutoSalesReviews Blog"
        centered
      >
        <ContentSection>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
            <div>
              {featured && page === 1 && !category && (
                <Link
                  href={`${ROUTES.blog}/${featured.slug}`}
                  className="group mb-8 grid overflow-hidden rounded-lg border border-border/70 bg-white shadow-card transition-all hover:shadow-card-hover md:grid-cols-2"
                >
                  <div className="relative">
                    <BlogCover
                      post={featured}
                      className="w-full"
                      sizes="(max-width: 768px) 100vw, 620px"
                      iconClassName="h-20 w-20"
                      priority
                    />
                    <span className="absolute left-4 top-4 rounded-md bg-accent px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
                      Featured
                    </span>
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <span className="text-xs font-bold uppercase tracking-wide text-accent-foreground/70">
                      {featured.category}
                    </span>
                    <h2 className="mt-2 text-2xl font-extrabold text-primary group-hover:text-navy-600">
                      {featured.title}
                    </h2>
                    <p className="mt-2 text-muted-foreground">{featured.excerpt}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {featured.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {featured.readTime}
                      </span>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
                      Read More
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {page > 1 && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`${ROUTES.blog}?page=${page - 1}${category ? `&category=${encodeURIComponent(category)}` : ""}`}>
                        Previous
                      </Link>
                    </Button>
                  )}
                  <span className="self-center text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`${ROUTES.blog}?page=${page + 1}${category ? `&category=${encodeURIComponent(category)}` : ""}`}>
                        Next
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-lg border border-border/70 bg-white p-4 shadow-card">
                <p className="text-sm font-bold text-primary">Categories</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link href={ROUTES.blog} className="hover:text-primary">
                      All ({total})
                    </Link>
                  </li>
                  {categories.map((item) => (
                    <li key={item.category}>
                      <Link
                        href={`${ROUTES.blog}?category=${encodeURIComponent(item.category)}`}
                        className="hover:text-primary"
                      >
                        {item.category} ({item.count})
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border/70 bg-white p-4 shadow-card">
                <p className="text-sm font-bold text-primary">Recent posts</p>
                <ul className="mt-3 space-y-3">
                  {recent.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={ROUTES.blogPost(item.slug)}
                        className="text-sm font-semibold text-foreground hover:text-primary"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border/70 bg-white p-4 shadow-card">
                <NewsletterSignup />
              </div>
            </aside>
          </div>
        </ContentSection>

        <LocationFaqSection items={BLOG_FAQ_ITEMS} />
        <SeoContentSection content={BLOG_SEO_CONTENT} variant="muted" />
      </ContentPage>
    </>
  );
}
