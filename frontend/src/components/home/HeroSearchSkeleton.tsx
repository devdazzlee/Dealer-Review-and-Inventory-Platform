/** Placeholder matching hero VehicleSearchBar dimensions exactly to prevent CLS. */
export function HeroSearchSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card sm:p-5" aria-hidden>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <div className="h-3 w-14 animate-pulse rounded bg-muted/50" />
            <div className="h-11 animate-pulse rounded-lg bg-muted/40" />
          </div>
        ))}
        <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-4 xl:col-span-1">
          <div className="h-11 w-full animate-pulse rounded-md bg-muted/50 xl:min-w-[13rem]" />
        </div>
      </div>
    </div>
  );
}
