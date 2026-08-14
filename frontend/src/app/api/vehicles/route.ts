import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { VEHICLES_PER_PAGE } from "@/config/vehicle";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (!params.get("pageSize")) {
    params.set("pageSize", String(VEHICLES_PER_PAGE));
  }
  const response = await fetch(`${env.apiBaseUrl}/api/vehicles?${params.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { items: [], page: 1, pageSize: VEHICLES_PER_PAGE, total: 0, totalPages: 1, hasMore: false },
      { status: 200 }
    );
  }

  const payload = (await response.json()) as {
    data: unknown[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };

  return NextResponse.json(
    {
      items: payload.data ?? [],
      page: payload.page,
      pageSize: payload.pageSize,
      total: payload.total,
      totalPages: payload.totalPages,
      hasMore: payload.page < payload.totalPages,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
