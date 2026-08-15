import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, ChevronRight, Clock } from "lucide-react";
import { getBlogPost, getBlogSitemapEntries } from "@/lib/api/blog";
import { ROUTES } from "@/config/constants";
import {
  buildBlogPostMetadata,
  buildNotFoundMetadata,
} from "@/config/seo";
import { BlogCover } from "@/components/blog/BlogCover";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import {
  buildArticleSchema,
  buildBlogCategorySchema,
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  extractArticleFaqs,
} from "@/lib/schema/builders";
import { BlogCard } from "@/components/blog/BlogCard";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { Button } from "@/components/ui/button";
import { articleToc } from "@/lib/blog/toc";
import { getCanonicalUrl } from "@/lib/seo";

interface ArticlePageProps {
  params: { slug: string };
}

export const revalidate = 120;

export async function generateStaticParams() {
  const posts = await getBlogSitemapEntries();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  try {
    const { post } = await getBlogPost(params.slug);
    return buildBlogPostMetadata(post);
  } catch {
    return buildNotFoundMetadata("Article");
  }
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  let payload;
  try {
    payload = await getBlogPost(params.slug);
  } catch {
    notFound();
  }
  const { post, related } = payload;
  // Prefer the admin-editable faqs field; fall back to any FAQ block
  // embedded directly in body for older content authored that way.
  const faqs = post.faqs.length > 0 ? post.faqs : extractArticleFaqs(post.body);
  const bodyBlocks = post.body.filter((block) => block.type !== "faq");
  const faqSchema = buildFaqPageSchema(faqs);
  const toc = articleToc(post.body);
  const schemaData = [
    buildArticleSchema(post),
    buildBlogCategorySchema(post),
    buildBreadcrumbSchema([
      { name: "Home", path: ROUTES.home },
      { name: "Blog", path: ROUTES.blog },
      { name: post.title, path: ROUTES.blogPost(post.slug) },
    ]),
    ...(faqSchema ? [faqSchema] : []),
  ];

  return (
    <>
      <SchemaMarkup data={schemaData} />
      <div className="bg-background">
        <div className="border-b border-border/70 bg-white">
          <div className="container-page py-3">
            <nav
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
              aria-label="Breadcrumb"
            >
              <Link href={ROUTES.home} className="hover:text-primary">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={ROUTES.blog} className="hover:text-primary">
                Blog
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="truncate font-medium text-primary">
                {post.category}
              </span>
            </nav>
          </div>
        </div>

        <article className="container-page py-8 lg:py-10">
          <div className="mx-auto max-w-3xl">
            <span className="inline-block rounded-md bg-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              {post.category}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-primary sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>

            <div className="mt-5 flex flex-wrap items-center gap-4 border-b border-border/70 pb-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {initials(post.author)}
                </span>
                <div>
                  <p className="text-sm font-bold text-primary">{post.author}</p>
                  <p className="text-xs text-muted-foreground">{post.authorRole}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>
            </div>

            <BlogCover
              post={post}
              className="mt-6 w-full rounded-lg border border-border/70 shadow-card"
              sizes="(max-width: 768px) 100vw, 768px"
              iconClassName="h-20 w-20"
              priority
            />

            <div className="mt-6">
              <ShareButtons
                title={post.title}
                url={getCanonicalUrl(ROUTES.blogPost(post.slug))}
              />
            </div>

            {toc.length > 0 && (
              <nav
                className="mt-8 rounded-lg border border-border/70 bg-white p-5 shadow-card"
                aria-label="Table of contents"
              >
                <p className="text-sm font-bold text-primary">In this article</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="text-primary hover:underline">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <div className="mt-8">
              <ArticleBody blocks={bodyBlocks} />
            </div>

            {faqs.length > 0 && (
              <div className="mt-8">
                <ArticleBody blocks={[{ type: "faq", items: faqs }]} />
              </div>
            )}

            {post.authorBio && (
              <div className="mt-10 rounded-lg border border-border/70 bg-white p-6 shadow-card">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Author
                </p>
                <p className="mt-1 text-base font-bold text-primary">{post.author}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {post.authorBio}
                </p>
              </div>
            )}

            <div className="mt-8 rounded-lg border border-border/70 bg-white p-6 shadow-card">
              <NewsletterSignup />
            </div>

            <div className="mt-10 flex flex-col items-start gap-3 rounded-lg border border-accent/40 bg-gold-light p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold text-primary">
                  Ready to put this into practice?
                </p>
                <p className="text-sm text-foreground/80">
                  Explore real inventory and trusted dealers across the United States.
                </p>
              </div>
              <Button asChild variant="gold" className="shrink-0">
                <Link href={post.ctaHref}>
                  {post.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mx-auto mt-14 max-w-5xl border-t border-border/70 pt-10">
              <h2 className="mb-6 text-2xl font-bold text-primary">Related Articles</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <BlogCard key={item.slug} post={item} />
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </>
  );
}
