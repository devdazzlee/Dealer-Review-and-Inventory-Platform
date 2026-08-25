import Link from "next/link";
import { CarFront } from "lucide-react";
import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

export default function VehicleNotFound() {
  return (
    <div className="container-page py-20">
      <EmptyState
        icon={CarFront}
        title="Vehicle not found"
        description="This vehicle may have been sold or the link is incorrect. Browse our latest inventory to find your next car."
        action={
          <Button asChild variant="gold">
            <Link href={ROUTES.vehicles}>Browse All Vehicles</Link>
          </Button>
        }
      />
    </div>
  );
}
