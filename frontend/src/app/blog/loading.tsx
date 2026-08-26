import { BlogCardSkeletonGrid } from "@/components/blog/BlogCardSkeleton";

/** Shown automatically by Next.js while /blog re-fetches — both on first
 * load and whenever the category pills or pagination change the
 * searchParams, so switching tabs never looks like nothing happened. */
export default function BlogLoading() {
  return (
    <div className="min-h-[60vh]">
      <div className="relative overflow-hidden bg-primary bg-hero-texture">
        <div className="container-page relative py-14 sm:py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 h-6 w-40 rounded-full bg-white/10" />
            <div className="mx-auto h-9 w-72 max-w-full rounded-md bg-white/20 sm:h-11" />
            <div className="mx-auto mt-4 h-5 w-96 max-w-full rounded-md bg-white/10" />
          </div>
        </div>
      </div>

      <section className="w-full py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-8 border-b border-border/70 pb-6">
            <div className="mb-3 h-3 w-24 skeleton" />
            <div className="flex flex-wrap gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 w-28 skeleton rounded-full" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
            <BlogCardSkeletonGrid count={9} />
            <aside className="space-y-6">
              <div className="h-56 w-full skeleton rounded-lg" />
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
