/** Dimension-matched placeholder for BlogCard, used while a new
 * category/page of posts is loading. */
export function BlogCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border/70 bg-white shadow-card">
      <div className="aspect-[16/9] w-full skeleton rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="h-3 w-20 skeleton" />
        <div className="space-y-2">
          <div className="h-4 w-full skeleton" />
          <div className="h-4 w-2/3 skeleton" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full skeleton" />
          <div className="h-3 w-4/5 skeleton" />
        </div>
        <div className="mt-auto flex items-center gap-4 pt-2">
          <div className="h-3 w-16 skeleton" />
          <div className="h-3 w-14 skeleton" />
        </div>
      </div>
    </div>
  );
}

export function BlogCardSkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}
