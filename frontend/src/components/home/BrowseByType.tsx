import Link from "next/link";
import { HOME_BODY_STYLES } from "@/config/vehicle";
import { ROUTES } from "@/config/constants";
import { bodyStyleIcon } from "@/lib/vehicles/icons";

export function BrowseByType() {
  return (
    <section className="bg-white">
      <div className="container-page py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Browse by Type
          </h2>
          <p className="mt-2 text-muted-foreground">
            Find the right body style for how you drive.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
          {HOME_BODY_STYLES.map((type) => {
            const Icon = bodyStyleIcon(type.value);
            return (
              <Link
                key={type.value}
                href={`${ROUTES.vehicles}?bodyStyle=${type.value}`}
                prefetch={false}
                className="group flex flex-col items-center gap-3 rounded-lg border border-border/70 bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-bold text-primary">
                  {type.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
