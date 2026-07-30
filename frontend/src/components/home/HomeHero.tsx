import { QuickSearchPills } from "@/components/vehicles/QuickSearchPills";
import { HomeHeroHeading } from "@/components/home/HomeHeroHeading";
import { HomeHeroSearchLazy } from "@/components/home/HomeHeroSearchLazy";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-hero bg-hero-texture">
      <div className="container-page py-14 sm:py-20">
        <HomeHeroHeading />

        <div className="mx-auto mt-8 max-w-4xl min-h-[17.5rem] sm:min-h-[11.5rem] xl:min-h-[7.25rem]">
          <HomeHeroSearchLazy />
        </div>

        <div className="mt-6">
          <QuickSearchPills variant="hero" />
        </div>
      </div>
    </section>
  );
}
