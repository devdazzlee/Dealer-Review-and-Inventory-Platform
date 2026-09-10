import "server-only";

import { API } from "@/config/constants";
import { env } from "@/config/env";
import { ApiError, ApiErrorResponse } from "@/types/dealer";

interface RequestOptions {
  revalidate?: number;
  headers?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  // Dynamic env access so Next does not inline an empty value at build time.
  // On the VPS, API_INTERNAL_URL=http://127.0.0.1:4100 avoids nginx hairpin 502s.
  const internalBase = process.env["API_INTERNAL_URL"]?.trim().replace(/\/$/, "");
  const base = internalBase || env.apiBaseUrl;
  const url = `${base}${endpoint}`;
  const revalidate = options.revalidate ?? API.revalidateSeconds;

  const response = await fetch(url, {
    next: { revalidate },
    headers: options.headers,
  });

  if (!response.ok) {
    const body: ApiErrorResponse = await response.json().catch(() => ({
      error: "Request failed",
    }));

    throw new ApiError(body.error, response.status, body.code);
  }

  return response.json();
}
